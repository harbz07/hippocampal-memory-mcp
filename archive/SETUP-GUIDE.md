# Claude Memory Graph Setup Guide

## Understanding GraphQL ↔ Neo4j Relationship

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│  GraphQL Client │ ──────> │ Neo4jGraphQL API │ ──────> │   Neo4j DB  │
│  (Your App)     │ <────── │  (Translation)   │ <────── │  (Storage)  │
└─────────────────┘         └──────────────────┘         └─────────────┘
```

**NOT Bidirectional Sync** - They serve different purposes:
- **Neo4j**: Stores actual data (nodes, relationships)
- **GraphQL**: Provides API interface (queries, mutations)
- **Neo4jGraphQL**: Translates GraphQL operations → Cypher queries

## Setup Steps

### 1. Install Dependencies (if not done)
```powershell
npm install @neo4j/graphql graphql neo4j-driver @apollo/server dotenv
```

### 2. Create Database Schema (Constraints & Indexes)
Run this FIRST to set up database structure:
```powershell
node setup-schema.mjs
```

This creates:
- ✓ Unique constraints on `Person.id`, `Project.id`, `Concept.id`, `Event.id`
- ✓ Indexes for faster queries on names, types, timestamps

### 3. Start GraphQL Server
```powershell
node claude-memory-server.mjs
```

Server starts at: http://localhost:4000

### 4. Access GraphQL Playground
Open browser to: http://localhost:4000

## What Each File Does

| File | Purpose |
|------|---------|
| `claude-memory.cypher` | **Documentation** - Schema design in Cypher notation |
| `setup-schema.mjs` | **Database Setup** - Creates constraints/indexes in Neo4j |
| `claude-memory-server.mjs` | **API Server** - GraphQL interface to your data |
| `.env` | **Configuration** - Database credentials |

## Example Usage

### Creating Data via GraphQL

```graphql
mutation {
  createPeople(input: [
    {
      id: "uuid-1",
      name: "Harvey",
      type: "human",
      created: "2025-12-25T00:00:00Z",
      attributes: "{\"interests\": [\"philosophy\", \"theology\"]}"
    },
    {
      id: "claude-main",
      name: "Claude",
      type: "ai_entity",
      created: "2025-12-25T00:00:00Z",
      attributes: "{}"
    }
  ]) {
    people {
      id
      name
      type
    }
  }
}
```

### Creating Relationships

```graphql
mutation {
  createEvents(input: [
    {
      id: "event-1",
      timestamp: "2025-12-25T12:00:00Z",
      type: "conversation",
      emotional_valence: 0.8,
      significance: 0.9,
      context_summary: "Discussing Neo4j schema design",
      sensory_markers: ["technical", "collaborative"]
    }
  ]) {
    events {
      id
      context_summary
    }
  }
}

# Connect event to people
mutation {
  updateEvents(
    where: { id: "event-1" }
    connect: {
      involves: [
        { where: { node: { id: "uuid-1" } }, edge: { role: "subject", salience: 1.0 } }
        { where: { node: { id: "claude-main" } }, edge: { role: "catalyst", salience: 1.0 } }
      ]
    }
  ) {
    events {
      id
    }
  }
}
```

### Querying Data

```graphql
query {
  events(where: { type: "conversation" }) {
    id
    timestamp
    context_summary
    significance
    involves {
      ... on Person {
        name
        type
      }
    }
  }
}
```

## Key Differences: Cypher vs GraphQL

### Cypher (claude-memory.cypher)
- **Purpose**: Database schema definition & documentation
- **Run directly** in Neo4j Browser or via driver
- **Example**: `CREATE (p:Person {id: "1", name: "Harvey"})`

### GraphQL (claude-memory-server.mjs)
- **Purpose**: API interface definition
- **Auto-generates** queries/mutations from typeDefs
- **Example**: `mutation { createPeople(input: {...}) }`

## Next Steps

1. ✅ Run `setup-schema.mjs` to create constraints
2. ✅ Start `claude-memory-server.mjs` to expose API
3. 🔍 Experiment in GraphQL Playground
4. 🧠 Build your memory accumulation logic!

## Troubleshooting

**Error: Constraint already exists**
- Safe to ignore - means schema is already set up

**Error: Cannot connect to Neo4j**
- Check `.env` credentials
- Verify database is running at neo4j.io

**GraphQL type errors**
- Check that your mutations match the typeDefs structure
- Union types need inline fragments in queries
