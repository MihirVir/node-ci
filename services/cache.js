const mongoose = require("mongoose");
const redis = require("redis");
const exec = mongoose.Query.prototype.exec;
const keys = require("../config/keys.js");
// To make a function which is not promisified is
// to write the following commented command
// const util = require("util");
// client.get = util.promisify(client.get)

const client = redis.createClient(keys.redisURI);
client.connect();

// make sure to use function keyword
mongoose.Query.prototype.cache = function (options = {}) {
  // imagine this like we are creating a variable called useCache
  // if its true then we will apply the cache logic
  // users can use it as .cache() after .find()
  this.useCache = true;
  this.hashKey = JSON.stringify(options.key || "");
  // return this will enable us to make it a chainable
  // function call. It means that we can use it like as following
  // Blog.find().cache().limit(1).sort() whatever other properties

  return this;
};

mongoose.Query.prototype.exec = async function () {
  if (!this.useCache) {
    return exec.apply(this, arguments);
  }
  // it allows to safely copy content from one object
  // to another {} in assign is the object that we're going to
  // copy a bunch of properties to
  const key = JSON.stringify(
    Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name,
    })
  );

  // see if we have val for the key in redis
  const cacheVal = await client.hGet(this.hashKey, key);
  // if we do return that
  if (cacheVal) {
    const doc = JSON.parse(cacheVal);

    // Hydrating Array
    return Array.isArray(doc)
      ? doc.map((d) => new this.model(d))
      : new this.model(doc);
  }
  // Otherwise, issue the query and store the
  // results in redis

  const result = await exec.apply(this, arguments);
  client.hSet(this.hashKey, key, JSON.stringify(result), "EX", 10);
  return result;
};

module.exports = {
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey));
  },
};
