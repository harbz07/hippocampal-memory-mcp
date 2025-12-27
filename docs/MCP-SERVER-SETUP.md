# Hippocampal Memory MCP Server Setup

## 🧠 What This Does

This MCP server gives Claude **neuroanatomically-inspired memory capabilities**:

- **Episodic encoding** with emotional valence and consolidation paths
- **Semantic retrieval** using vector similarity + Cypher filters
- **Bond evolution** tracking relationship dynamics over time
- **Arbitrary graph operations** for flexibility

## 📦 Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Add your OpenAI API key to `.env`:

```env
OPENAI_API_KEY=sk-...your-key-here
```

### 3. Initialize Neo4j Schema

Run the setup script to create vector indexes and constraints:

```bash
npm run setup-schema
```

You should see:
```
🧠 Setting up Neo4j vector index for hippocampal memory...
✅ Vector index created
✅ person_id
✅ project_id
✅ concept_id
✅ event_id
✨ Schema setup complete!
```

## 🔧 Claude Desktop Configuration

Add this to your Claude Desktop config file:

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`  
**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "hippocampal-memory": {
      "command": "node",
      "args": [
        "C:\\Users\\harve\\Neo4j\\hippocampal-mcp-server.mjs"
      ],
      "env": {
        "NEO4J_URI": "neo4j+s://e3ef3e92.databases.neo4j.io",
        "NEO4J_USER": "neo4j",
        "NEO4J_PASSWORD": "_irZcZW9qMFxJ-kWwosj1B8Ym0rnRhCNzYNePndvMqE",
        "OPENAI_API_KEY": "your-openai-api-key-here"
      }
    }
  }
}
```

**Important:** Replace `OPENAI_API_KEY` with your actual key.

## 🛠️ Available Tools

### 1. `encode_memory`
Create episodic memory with emotional valence and entity involvement.

**Example:**
```json
{
  "event": {
    "type": "realization",
    "emotional_valence": 0.7,
    "significance": 0.9,
    "context_summary": "Discovered that hippocampal consolidation model maps perfectly to Neo4j's graph structure"
  },
  "involves": [
    {
      "entity_id": "person-uuid",
      "role": "subject",
      "salience": 1.0
    }
  ]
}
```

### 2. `recall_memory`
Semantic + temporal + emotional retrieval.

**Example:**
```json
{
  "query": "conversations about Neo4j graph databases",
  "emotional_range": [0.0, 1.0],
  "significance_threshold": 0.5,
  "limit": 10,
  "include_consolidations": true
}
```

### 3. `mutate_graph`
Execute arbitrary Cypher write operations.

**Example:**
```json
{
  "cypher": "CREATE (p:Person {id: $id, name: $name, type: 'human'})",
  "params": {
    "id": "new-uuid",
    "name": "Harvey"
  }
}
```

### 4. `evolve_bond`
Track relationship dynamics over time.

**Example:**
```json
{
  "from_entity_id": "person-1-uuid",
  "to_entity_id": "person-2-uuid",
  "new_strength": 0.85,
  "emotional_resonance": 0.7,
  "milestone": "First successful collaboration on MCP server",
  "interaction_context": "Building hippocampal memory system"
}
```

### 5. `query_graph`
Read-only Cypher queries.

**Example:**
```json
{
  "cypher": "MATCH (p:Person)-[b:BOND]->(p2:Person) WHERE b.strength > $threshold RETURN p.name, p2.name, b.strength ORDER BY b.strength DESC",
  "params": {
    "threshold": 0.7
  }
}
```

## 🧪 Testing

After configuration, restart Claude Desktop and try:

> "Encode a memory about our conversation building this MCP server. It was a collaboration with high significance."

> "Recall memories about Neo4j and graph databases."

> "Show me all Person nodes and their bonds."

## 🔍 Architecture

**Vector Search Flow:**
1. Claude sends natural language query → `recall_memory`
2. Server generates embedding via OpenAI
3. Neo4j vector index finds semantically similar Events
4. Cypher filters apply (temporal, emotional, entity)
5. Hybrid scoring: `0.7 * similarity + 0.3 * significance`
6. Ranked results returned to Claude

**Memory Encoding Flow:**
1. Claude sends event data → `encode_memory`
2. Server generates embedding from context_summary
3. Transaction creates Event node + relationships
4. Returns event ID and metadata

## 📊 Schema

Core node types:
- **Event** - Episodic memories with embeddings
- **Person** - Humans and AI entities
- **Project** - Ongoing work
- **Concept** - Abstract ideas

Key relationships:
- **INVOLVES** - Event → Entity (with role & salience)
- **PRECEDED** - Event → Event (causal chains)
- **CONSOLIDATED_TO** - Event → Concept/Person/Project
- **BOND** - Person ↔ Person (with strength & trajectory)
- **WORKS_ON** - Person → Project

## 💡 Cost

**Embeddings:** ~$0.02 per 1M tokens  
**Per memory:** ~$0.00002 (1000-character summary)  
**Negligible** for typical usage

## 🐛 Troubleshooting

**"Vector index not found":**
```bash
npm run setup-schema
```

**"OPENAI_API_KEY not set":**
Add to Claude Desktop config or `.env` file

**"Connection refused":**
Check Neo4j credentials in config

---

**Built with:** MCP SDK, Neo4j, OpenAI text-embedding-3-small
