const codeMutation = require("./codeMutation");
const userMutation = require("./userMutation");
const contestMutaion = require("./contestMutaion");

module.exports = mutations = {
  ...codeMutation,
  ...userMutation,
  ...contestMutaion,
};
