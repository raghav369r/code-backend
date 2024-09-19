const codeResolver = require("./codeResolver");
const contestResolver = require("./contestResolver");
const problemResolver = require("./problemResolver");
const userResolver = require("./userResolver");

module.exports = resolvers = {
  ...codeResolver,
  ...contestResolver,
  ...problemResolver,
  ...userResolver,
};
