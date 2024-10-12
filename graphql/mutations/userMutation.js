const prisma = require("../../client/prisma");
const bcrypt = require("bcrypt");
const { sign_token } = require("../../services/jwt/jwt");
require("dotenv").config();

const ROUNDS = process.env.SALT_ROUNDS || 10;

const mutations = {
  blockUser: async (_, { contestId }, { user, isAuthenticated }) => {
    if (!isAuthenticated) throw new Error("Missing token or expired Token!!");
    const res = await prisma.contestPerformance.updateMany({
      where: { AND: [{ userId: user?.id }, { contestId }] },
      data: {
        isBlocked: true,
      },
    });
    return true;
  },

  editProfile: async (_, { input }, { user, isAuthenticated }) => {
    if (!isAuthenticated) throw new Error("Missing token or expired Token!!");
    const {
      id,
      firstName,
      lastName,
      userName,
      profileLink,
      linkedinLink,
      githubLink,
      instagramLink,
      portfolioLink,
    } = input;
    if (id != user.id) throw new Error("Your not Autherised!!");
    const muser = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName,
        lastName,
        userName,
        profileLink,
        linkedinLink,
        githubLink,
        instagramLink,
        portfolioLink,
      },
    });
    return muser;
  },

  registerUser: async (_, { newUser }) => {
    const { userName, password, email, organisation } = newUser;
    const exist = await prisma.user.findFirst({
      where: { email },
    });
    if (exist) throw new Error(`Organisation/User with email already exist!!`);
    const hashed = await bcrypt.hash(password, ROUNDS);
    var user = await prisma.user.create({
      data: { userName, password: hashed, email, organisation },
    });
    const token = await sign_token({
      id: user.id,
      email,
      organisation,
      name: user.firstName + user.lastName,
    });
    return { token, user };
  },
};

module.exports = mutations;
