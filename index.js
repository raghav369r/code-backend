const express = require("express");
const { ApolloServer, gql } = require("apollo-server-express");
const cors = require("cors");
require("dotenv").config();

const PORT = process.env.PORT || 4000;
const typeDefs = gql`
  type Query {
    hello: String
  }
`;

const resolvers = {
  Query: {
    hello: () => "Hello world!",
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => ({ ...req, isAuthenticated: false }),
});

const app = express();
app.use(cors());
server.start().then(() => {
  server.applyMiddleware({ app, path: "/graphql", cors: false });

  app.listen({ port: PORT }, () =>
    console.log(`Server ready at http://localhost:${PORT}${server.graphqlPath}`)
  );
});
