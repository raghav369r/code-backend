const codeResolver = require("./codeResolver");
const contestResolver = require("./contestResolver");
const problemResolver = require("./problemResolver");
const userResolver = require("./userResolver");
const commentResolver = require("./commentResolver");

module.exports = resolvers = {
  ...codeResolver,
  ...contestResolver,
  ...problemResolver,
  ...userResolver,
  ...commentResolver,
};
