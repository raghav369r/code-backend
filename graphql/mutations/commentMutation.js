const prisma = require("../../client/prisma");

const mutations = {
  addComment: async (_, { problemId, comment }, { user, isAuthenticated }) => {
    if (!isAuthenticated)
      throw new Error("Missing token or expired Token! login acnd try again");
    if (!comment || comment.length < 2)
      throw new Error("comment must be of length 2!");
    if (!problemId) throw new Error("missing probelm id");
    // check if the problem id is valid
    const res = await prisma.comment.create({
      data: {
        comment,
        userId: user.id,
        problemId,
        time: new Date(),
      },
      include: { user: true },
    });
    return res;
  },
};
module.exports = mutations;
