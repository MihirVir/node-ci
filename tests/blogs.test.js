const Page = require("./helpers/page");

let page;

beforeEach(async () => {
  page = await Page.build();
  await page.goto("http://localhost:3000");
});

afterEach(async () => {
  await page.close();
});

describe("When logged in", () => {
  beforeEach(async () => {
    await page.login();
    await page.click("a.btn-floating");
  });

  test("When logged in, can see blog create form", async () => {
    const label = await page.getContentsOf("form label");
    expect(label).toEqual("Blog Title");
  });

  describe("And using valid inputs", () => {
    beforeEach(async () => {
      await page.type(".title input", "My Title");
      await page.type(".content input", "My Content");
      await page.click("form button");
    });
    test("Submitting then saving adds blog to index page", async () => {
      await page.click("button.green");
      await page.waitForSelector(".card");
      const title = await page.getContentsOf(".card-title");
      const content = await page.getContentsOf("p");
      expect(title).toEqual("My Title");
      expect(content).toEqual("My Content");
    });
    test("Submitting takes user to review screen", async () => {
      const text = await page.getContentsOf("h5");
      expect(text).toEqual("Please confirm your entries");
    });
  });

  describe("And using invalid inputs", () => {
    beforeEach(async () => {
      await page.click("form button");
    });
    test("the form shows an error message", async () => {
      const titleErr = await page.getContentsOf(".title .red-text");
      const contentErr = await page.getContentsOf(".content .red-text");
      expect(titleErr).toEqual("You must provide a value");
      expect(contentErr).toEqual("You must provide a value");
    });
  });
});

describe("When user is not logged in", () => {
  const actions = [
    {
      method: "get",
      path: "/api/blogs",
    },
    {
      method: "post",
      path: "/api/blogs",
      data: {
        title: "T",
        content: "C",
      },
    },
  ];
  test("Blog related actions are prohibited", async () => {
    const results = await page.execRequest(actions);

    for (let r of results) {
      expect(r).toEqual({ error: "You must log in!" });
    }
  });
});
