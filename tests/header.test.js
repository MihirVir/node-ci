const Page = require("./helpers/page");
// The inner function inside before each statement
// will be automatically invoked before every single
// test get executed inside this file
let page;
beforeEach(async () => {
  page = await Page.build();
  // visit localhost:3000
  await page.goto("http://localhost:3000");
});

afterEach(async () => {
  // closing browser instances

  await page.close();
});

test("The header has the correct text", async () => {
  const property = await page.getContentsOf("a.brand-logo");
  expect(property).toEqual("Blogster");
});

test("Checking the OAUTH Flow", async () => {
  await page.click(".right a");
  const url = await page.url();
  expect(url).toMatch(/accounts\.google\.com/);
});

test("When signed in shows logout btn", async () => {
  // sessionFactory requires a user mongoose model to be passed
  await page.login();
  await page.waitFor("a[href='/auth/logout']");
  const text = await page.getContentsOf('a[href="/auth/logout"]');
  expect(text).toEqual("Logout");
});
