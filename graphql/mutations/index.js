const codeMutation = require("./codeMutation");
const userMutation = require("./userMutation");
const contestMutaion = require("./contestMutaion");
const commentMutation = require("./commentMutation");

module.exports = mutations = {
  ...codeMutation,
  ...userMutation,
  ...contestMutaion,
  ...commentMutation,
};
