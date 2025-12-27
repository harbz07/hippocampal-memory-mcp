# 🧠 Hippocampal Memory MCP Server

An MCP server for neuroanatomically-inspired memory consolidation using Neo4j and semantic search.

## Features

- **Episodic Memory Encoding**: Create memory events with emotional valence and temporal context
- **Semantic Retrieval**: Vector similarity search using OpenAI embeddings
- **Graph Queries**: Execute Cypher queries on your memory graph

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```
NEO4J_URI=neo4j://127.0.0.1:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
OPENAI_API_KEY=your_api_key
```

3. Set up Neo4j schema:
```bash
npm run setup-schema
```

4. Run locally (stdio for Claude Desktop):
```bash
npm start
```

5. Run as remote server (HTTP/SSE for claude.ai):
```bash
npm run start:remote
```

## Deployment to Render

1. Push to GitHub
2. Connect to Render
3. Add environment variables in Render dashboard:
   - `NEO4J_URI` (you'll need a cloud Neo4j instance like Aura)
   - `NEO4J_USER`
   - `NEO4J_PASSWORD`
   - `OPENAI_API_KEY`
4. Deploy!

## Usage with Claude

### Local (Claude Desktop)
Add to `%APPDATA%\Claude\claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "hippocampal-memory": {
      "command": "node",
      "args": ["C:\\Users\\harve\\Neo4j\\hippocampal-mcp-server.mjs"]
    }
  }
}
```

### Remote (claude.ai)
Add connector in Settings > Connectors using your Render URL:
```
https://your-app.onrender.com/sse
```

## 5 Tools

1. **`encode_memory`** - Save episodic memories
2. **`recall_memory`** - Semantic search
3. **`query_graph`** - Read from Neo4j
4. **`mutate_graph`** - Write to Neo4j
5. **`evolve_bond`** - Track relationships
