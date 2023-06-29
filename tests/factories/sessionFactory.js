// A factory is a fuynction that creates and returns
// common resource that we might want to use throughout
// our test suite
const Buffer = require("buffer").Buffer;
const Keygrip = require("keygrip");
const keys = require("../../config/keys");
const keygrip = new Keygrip([keys.cookieKey]);
module.exports = (user) => {
  const sessionObject = {
    passport: {
      user: user._id.toString(),
    },
  };
  const session = Buffer.from(JSON.stringify(sessionObject)).toString("base64");
  const sig = keygrip.sign("session=" + session);
  return { session, sig };
};
