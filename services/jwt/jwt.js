const jwt = require("jsonwebtoken");
require("dotenv").config();
const SECRET = process.env.JWT_SECRET;

const jwt_decode = async (token) => {
  if (!token) return null;
  var user = null;
  try {
    user = await jwt.verify(token, SECRET);
  } catch (ex) {
    console.log("error decoding token ");
    user = null;
  }
  return user;
};

const sign_token = async (data) => {
  const token = await jwt.sign({ ...data }, SECRET);
  return token;
};

module.exports = { jwt_decode, sign_token };
