# 🧠 Hippocampal Memory MCP Server

An MCP server for neuroanatomically-inspired memory consolidation using Neo4j and semantic search.

## Features

- **Episodic Memory Encoding**: Create memory events with emotional valence and temporal context
- **Semantic Retrieval**: Vector similarity search using OpenAI embeddings
- **Graph Operations**: Full Cypher query support for reading and writing
- **Relationship Tracking**: Monitor bond strength evolution over time
- **Extensible Schema**: Additional tools in [hippocampus-extension.mjs](hippocampus-extension.mjs) ready for integration

## Quick Start

See [CHECKLIST.md](CHECKLIST.md) for daily startup instructions.

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Neo4j
You need Neo4j Desktop running locally with a database on port 7687.

### 3. Initialize Schema
```bash
npm run setup-schema
```

### 4. Setup Tunnel (for remote access)
Start ngrok to expose your local Neo4j:
```bash
ngrok tcp 7687
```
Copy the tunnel URL (e.g., `tcp://2.tcp.us-cal-1.ngrok.io:12841`)

### 5. Configure Claude Desktop
Edit `%APPDATA%\Claude\claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "hippocampal-memory": {
      "command": "node",
      "args": ["C:\\Users\\harve\\Neo4j\\hippocampal-mcp-server.mjs"],
      "env": {
        "NEO4J_URI": "bolt://YOUR_NGROK_URL",
        "NEO4J_USER": "neo4j",
        "NEO4J_PASSWORD": "your_password",
        "OPENAI_API_KEY": "your_openai_key"
      }
    }
  }
}
```

### 6. Start Claude Desktop
The MCP server will connect automatically.

## Available Tools (8)

### Hippocampus Module (Biomimetic Schema)

1. **`hippocampus_write_event`** - Structured event creation with Who/Why/What/Where/Effects blocks
2. **`hippocampus_write_reflection`** - Agent-relative memory slices with egocentric perspective
3. **`hippocampus_search_events`** - Pattern completion retrieval with temporal/participant/effect filters

### Core Memory Tools

4. **`encode_memory`** - Save episodic memories with vector embeddings
5. **`recall_memory`** - Semantic + temporal + emotional search
6. **`query_graph`** - Read-only Cypher queries
7. **`mutate_graph`** - Write operations (CREATE, MERGE, etc.)
8. **`evolve_bond`** - Track relationship dynamics over time

## Architecture

**Current Setup:**
- Neo4j Desktop running locally on port 7687
- ngrok tunnel for remote access
- Claude Desktop connects via stdio transport
- Render deployment at https://hippocampal-memory-mcp.onrender.com (HTTP/SSE transport)

**Files:**
- [hippocampal-mcp-server.mjs](hippocampal-mcp-server.mjs) - Main server (stdio for Claude Desktop)
- [remote-mcp-server.mjs](remote-mcp-server.mjs) - HTTP/SSE server (for remote connections)
- [hippocampus-extension.mjs](hippocampus-extension.mjs) - Additional biomimetic tools
- [setup-vector-index.mjs](setup-vector-index.mjs) - Schema initialization
- [test-connection.mjs](test-connection.mjs) - Local connection test
- [test-tunnel.mjs](test-tunnel.mjs) - Tunnel connection test

## Schema

**Core Nodes:**
- Event - Episodic memories with vector embeddings
- Person - Human and AI entities
- Project - Ongoing work
- Concept - Abstract ideas
- Place, Catalyst, Entity, Target, Effect, Reflection, Agent (extension schema)

**Key Relationships:**
- INVOLVES - Event → Entity (with role & salience)
- PRECEDED - Event → Event (causal chains)
- CONSOLIDATED_TO - Event → Concept/Person/Project
- BOND - Person ↔ Person (with strength trajectory)
- PARTICIPATED_IN, CATALYZED_BY, HELD_AT, HAD_EFFECT_ON, etc. (extension schema)

**Indexes:**
- Vector index on Event.embedding (1536 dimensions, cosine similarity)
- Unique constraints on id fields for Person, Project, Concept, Event

## Important Notes

- **ngrok URL changes** on every restart (unless you pay for static URL)
- Update NEO4J_URI in Claude Desktop config when ngrok URL changes
- Neo4j Desktop must be running before starting Claude Desktop
- Environment variables are in Claude Desktop config (NOT .env file)
- Render deployment requires persistent Neo4j (Aura) - local tunnel won't work

## Testing

Test local connection:
```bash
node test-connection.mjs
```

Test tunnel connection:
```bash
node test-tunnel.mjs
```

## Documentation

- [CHECKLIST.md](CHECKLIST.md) - Daily startup and tool addition guide
- [neo4j-agent.instructions.md](neo4j-agent.instructions.md) - Comprehensive Neo4j/Cypher/GraphQL guide
- [docs/](docs/) - Archived setup guides and deployment notes

## Deployment

Currently deployed to Render at: https://hippocampal-memory-mcp.onrender.com

For deployment details, see archived docs.
