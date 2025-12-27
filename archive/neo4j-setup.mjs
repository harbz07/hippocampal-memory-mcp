// Load .env variables from the .env file (requires `dotenv` package)
import 'dotenv/config';
import neo4j from 'neo4j-driver';
import { Neo4jGraphQL } from '@neo4j/graphql';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

const { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD } = process.env;

if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) {
  console.error('Missing environment variables. Ensure .env contains NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD');
  process.exit(1);
}

async function main() {
  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));

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

  const server = new ApolloServer({ schema: await neoSchema.getSchema() });

  const { url } = await startStandaloneServer(server, { listen: { port: 4000 } });
  console.log(`🚀 Server ready at ${url}`);
}

main().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
