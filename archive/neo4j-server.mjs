import neo4j from "neo4j-driver";
import { Neo4jGraphQL } from "@neo4j/graphql";
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

async function main() {
  // Create the Neo4j driver (replace credentials/URI with your own)
  const driver = neo4j.driver(
    "neo4j+s://e3ef3e92.databases.neo4j.io",
    neo4j.auth.basic("neo4j", "_irZcZW9qMFxJ-kWwosj1B8Ym0rnRhCNzYNePndvMqE")
  );

  const typeDefs = `#graphql
    type Movie @node {
        title: String
        actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
    }

    type Actor @node {
        name: String
        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
    }
  `;

  const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

  const server = new ApolloServer({
    schema: await neoSchema.getSchema(),
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
  });

  console.log(`🚀 Server ready at ${url}`);
}

main().catch(err => {
  console.error('Server failed to start:', err);
  process.exitCode = 1;
});
