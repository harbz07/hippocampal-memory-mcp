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

  // GraphQL Type Definitions - matches your claude-memory.cypher schema
  const typeDefs = `#graphql
    type Person @node {
      id: ID! @id
      name: String!
      type: String!
      instance_id: String
      created: DateTime! @timestamp(operations: [CREATE])
      attributes: String
      
      # Person-Person bonds (with properties)
      bondsOut: [Person!]! @relationship(type: "BOND", direction: OUT, properties: "BondProperties")
      bondsIn: [Person!]! @relationship(type: "BOND", direction: IN, properties: "BondProperties")
      
      # Work relationships
      worksOn: [Project!]! @relationship(type: "WORKS_ON", direction: OUT, properties: "WorksOnProperties")
      
      # Event involvement
      involvedInEvents: [Event!]! @relationship(type: "INVOLVES", direction: IN, properties: "InvolvesProperties")
      
      # Instance relationships
      instantiations: [Person!]! @relationship(type: "INSTANTIATION_OF", direction: IN, properties: "InstantiationProperties")
      instanceOf: [Person!]! @relationship(type: "INSTANTIATION_OF", direction: OUT, properties: "InstantiationProperties")
    }

    type Project @node {
      id: ID! @id
      name: String!
      status: String!
      domain: [String!]!
      created: DateTime! @timestamp(operations: [CREATE])
      glyph: String
      
      contributors: [Person!]! @relationship(type: "WORKS_ON", direction: IN, properties: "WorksOnProperties")
      events: [Event!]! @relationship(type: "INVOLVES", direction: IN, properties: "InvolvesProperties")
    }

    type Concept @node {
      id: ID! @id
      name: String!
      domain: String!
      definition_version: Int!
      created: DateTime! @timestamp(operations: [CREATE])
      last_modified: DateTime! @timestamp(operations: [UPDATE])
      
      evolvedFrom: [Concept!]! @relationship(type: "EVOLVED_INTO", direction: IN, properties: "EvolvedIntoProperties")
      evolvedTo: [Concept!]! @relationship(type: "EVOLVED_INTO", direction: OUT, properties: "EvolvedIntoProperties")
      events: [Event!]! @relationship(type: "INVOLVES", direction: IN, properties: "InvolvesProperties")
      consolidatedFrom: [Event!]! @relationship(type: "CONSOLIDATED_TO", direction: IN, properties: "ConsolidatedToProperties")
    }

    type Event @node {
      id: ID! @id
      timestamp: DateTime!
      type: String!
      emotional_valence: Float
      significance: Float
      context_summary: String!
      full_content: String
      sensory_markers: [String!]
      glyph_encoding: String
      
      # Event relationships - using wrapper types for polymorphic relationships
      involvesPersons: [Person!]! @relationship(type: "INVOLVES", direction: OUT, properties: "InvolvesProperties")
      involvesProjects: [Project!]! @relationship(type: "INVOLVES", direction: OUT, properties: "InvolvesProperties")
      involvesConcepts: [Concept!]! @relationship(type: "INVOLVES", direction: OUT, properties: "InvolvesProperties")
      
      precededBy: [Event!]! @relationship(type: "PRECEDED", direction: IN, properties: "PrecededProperties")
      precedes: [Event!]! @relationship(type: "PRECEDED", direction: OUT, properties: "PrecededProperties")
      
      consolidatedToConcepts: [Concept!]! @relationship(type: "CONSOLIDATED_TO", direction: OUT, properties: "ConsolidatedToProperties")
      consolidatedToPersons: [Person!]! @relationship(type: "CONSOLIDATED_TO", direction: OUT, properties: "ConsolidatedToProperties")
      consolidatedToProjects: [Project!]! @relationship(type: "CONSOLIDATED_TO", direction: OUT, properties: "ConsolidatedToProperties")
    }

    # Relationship Properties
    type BondProperties @relationshipProperties {
      strength: Float!
      type: String!
      interaction_count: Int!
      emotional_resonance: Float!
      milestones: [String!]
      first_interaction: DateTime!
      last_interaction: DateTime!
      evolution_trajectory: String
    }

    type WorksOnProperties @relationshipProperties {
      role: String!
      commitment_level: Float!
      started: DateTime!
      contributions: [String!]
    }

    type InvolvesProperties @relationshipProperties {
      role: String!
      salience: Float!
    }

    type PrecededProperties @relationshipProperties {
      temporal_distance: String
      causal_strength: Float!
    }

    type EvolvedIntoProperties @relationshipProperties {
      refinement_type: String!
      trigger_event: String!
      timestamp: DateTime!
    }

    type ConsolidatedToProperties @relationshipProperties {
      strength: Float!
      consolidation_type: String!
      rehearsal_count: Int!
    }

    type InstantiationProperties @relationshipProperties {
      session_context: String!
      inherited_memory_state: String
      timestamp: DateTime!
    }
  `;

  const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

  const server = new ApolloServer({ schema: await neoSchema.getSchema() });

  const { url } = await startStandaloneServer(server, { listen: { port: 4000 } });
  console.log(`🚀 Claude Memory Graph Server ready at ${url}`);
  console.log(`🧠 Access GraphQL Playground to explore your schema`);
}

main().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
