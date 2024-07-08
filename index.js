const express = require("express");
const { ApolloServer, gql } = require("apollo-server-express");
const cors = require("cors");
require("dotenv").config();
const prisma = require("./client/prisma");
const { jwt_decode } = require("./services/jwt/jwt");
const { typedefs } = require("./graphql/typedefs");
const { mutaions, quary, typeResovers } = require("./graphql/reslovers");

const PORT = process.env.PORT || 4000;
const typeDefs = gql`
  type Query {
    hello: String
  }
  ${typedefs}
`;

const resolvers = {
  Query: {
    hello: async () => {
      // try {
      //   const res = await prisma.user.create({
      //     data: {
      //       firstName: "second User",
      //       lastName: "lastName",
      //       password: "12345",
      //       userName: "firstuser",
      //       email: "raghav@gmail.com",
      //     },
      //   });
      //   console.log(res);
      // } catch (ex) {
      //   console.log(ex);
      // }
      return "Hello world!";
    },
    ...quary,
  },
  Mutation: {
    ...mutaions,
  },
  ...typeResovers,
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const token = req.headers.authorization;
    const user = await jwt_decode(token);
    const isAuthenticated = user ? true : false;
    return { user, isAuthenticated };
  },
});

const app = express();
app.use(cors());
server.start().then(() => {
  server.applyMiddleware({ app, path: "/graphql", cors: false });

  app.listen({ port: PORT }, () =>
    console.log(`Server ready at http://localhost:${PORT}${server.graphqlPath}`)
  );
});
