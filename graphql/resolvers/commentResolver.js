const prisma = require("../../client/prisma");

const resolver = {
  getComments: async (
    _,
    { problemId, page, limit },
    { user, isAuthenticated }
  ) => {
    if (!problemId) throw new Error("missing probelm id");
    // check if the problem id is valid
    let reqpage = page ? page : 0,
      reqlimit = limit ? limit : 10;
    let offset = reqpage * reqlimit;
    const res = prisma.comment.findMany({
      where: { problemId },
      take: reqlimit,
      skip: offset,
      include: { user: true},
    });
    return res;
  },
};
module.exports = resolver;

// type Comment ={
//   id: ID
//   userId: ID
//   comment: String
//   problemId: ID
//   problem: Problem
//   user: User
// }
