const puppeteer = require("puppeteer");
const userFactory = require("../factories/userFactory");
const sessionFactory = require("../factories/sessionFactory");
class CustomPage {
  static async build() {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
    });

    const page = await browser.newPage();
    const customPage = new CustomPage(page, browser);

    return new Proxy(customPage, {
      get: function (target, property) {
        return target[property] || browser[property] || page[property];
      },
    });
  }

  constructor(page, browser) {
    this.page = page;
    this.browser = browser;
  }
  async close() {
    await this.browser.close();
  }

  async login() {
    const user = await userFactory();
    const session = sessionFactory(user);

    // session details {user}
    const cookies = [
      {
        name: "session",
        value: session.session,
        domain: "localhost",
        path: "/",
        secure: false,
      },
      {
        name: "session.sig",
        value: session.sig,
        domain: "localhost",
        path: "/",
        secure: false,
      },
    ];
    const headers = cookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");
    await this.page.setExtraHTTPHeaders({ Cookie: headers });

    // refreshing
    await this.page.goto("http://localhost:3000/blogs");
    await this.page.waitFor("a[href='/auth/logout']");
  }

  get(path) {
    return this.page.evaluate((_path) => {
      return fetch(_path, {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) => res.json());
    }, path);
  }

  post(path, data) {
    return this.page.evaluate(
      (_path, _data) => {
        return fetch(_path, {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(_data),
        }).then((res) => res.json());
      },
      path,
      data
    );
  }

  execRequest(actions) {
    return Promise.all(
      actions.map(({ method, path, data }) => {
        return this[method](path, data);
      })
    );
  }

  async getContentsOf(selector) {
    return this.page.$eval(selector, (el) => el.innerHTML);
  }
}

module.exports = CustomPage;
