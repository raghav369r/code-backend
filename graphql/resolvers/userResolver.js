const prisma = require("../../client/prisma");
const bcrypt = require("bcrypt");
const { sign_token } = require("../../services/jwt/jwt");
require("dotenv").config();

const ROUNDS = process.env.SALT_ROUNDS || 10;

const resolvers = {
  getUser: async (_, { userId }, { user, isAuthenticated }) => {
    if (!isAuthenticated) throw new Error("Missing token or expired Token!!");
    const nuser = await prisma.user.findFirst({
      where: { id: userId || user?.id },
    });
    return nuser;
  },

  loginUser: async (_, { email, password, organisation }) => {
    const user = await prisma.user.findFirst({
      where: {
        AND: [
          { email: { equals: email, mode: "insensitive" } },
          { organisation },
        ],
      },
    });
    if (!user)
      throw new Error(
        `no ${organisation ? "organisation" : "user"} exist with given email!!`
      );

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error("Invalid password!!");
    const token = sign_token({
      id: user.id,
      email,
      organisation,
      name: user.firstName + user.lastName,
    });
    return { token, user };
  },

  getAllParticipatedContests: async (
    _,
    { userId, Pagination },
    { user, isAuthenticated }
  ) => {
    const { page, limit } = Pagination || {};
    if (page == -1) throw new Error("Invalid Page Number!!");
    const offSet = ((page || 1) - 1) * (limit || 10);
    // if (!isAuthenticated) throw new Error("Missing token or expired Token!!");
    const userDet = await prisma.user.findFirst({
      where: { id: userId },
      include: {
        registered: {
          include: { contest: true },
          orderBy: [{ registeredAt: "desc" }],
          skip: offSet,
          take: limit || 10,
        },
      },
    });
    let pastContests = [];
    userDet?.registered?.forEach(({ contest }) => {
      // console.log(contest);
      if (new Date(contest.endTime) <= new Date()) pastContests.push(contest);
    });
    return pastContests;
  },

  getAllOrganisedContests: async (
    _,
    { Pagination },
    { user, isAuthenticated }
  ) => {
    const { page, limit } = Pagination || {};
    if (page == -1) throw new Error("Invalid Page Number!!");
    const offSet = ((page || 1) - 1) * (limit || 10);
    if (!isAuthenticated) throw new Error("Missing token or expired Token!!");
    const organised = await prisma.contest.findMany({
      where: { owner: user.id },
      // where: { OR: [{ owner: user.id }, { mediators: { contains: user.id } }] },
      orderBy: [{ startTime: "desc" }],
      skip: offSet,
      take: limit || 10,
    });
    return organised;
  },
};

module.exports = resolvers;
