const prisma = require("../../client/prisma");
const { runCode } = require("../../services/runCode/run");

const resolvers = {
  runCode: async (_, { input }, { user }) => {
    const res = await runCode(input);
    return res;
  },
};

module.exports = resolvers;
