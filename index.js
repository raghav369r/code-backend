const express = require("express");
const { ApolloServer, gql } = require("apollo-server-express");
const cors = require("cors");
require("dotenv").config();
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
    hello: async () => "Hello world!",
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
    var user = null;
    try {
      user = await jwt_decode(token);
    } catch (ex) {
      user = null;
    }
    const isAuthenticated = user ? true : false;
    return { user, isAuthenticated };
  },
});

const app = express();
app.use(cors());
app.get("/", (req, res) => {
  res.status(200).send("hello, surprised to see you here!!");
});
server.start().then(() => {
  server.applyMiddleware({ app, path: "/graphql", cors: false });

  app.listen({ port: PORT }, () =>
    console.log(`Server ready at http://localhost:${PORT}${server.graphqlPath}`)
  );
});
