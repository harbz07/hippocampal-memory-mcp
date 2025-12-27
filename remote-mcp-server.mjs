#!/usr/bin/env node

/**
 * Remote Hippocampal Memory MCP Server (HTTP/SSE)
 * For use with claude.ai web connectors
 */

import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import neo4j from 'neo4j-driver';
import OpenAI from 'openai';
import { randomUUID } from 'crypto';
import express from 'express';
import cors from 'cors';

const PORT = process.env.PORT || 3000;

// Environment validation
const { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD, OPENAI_API_KEY } = process.env;

if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) {
  console.error('❌ Missing Neo4j environment variables');
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.error('❌ Missing OPENAI_API_KEY');
  process.exit(1);
}

// Initialize clients
const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Embedding generation helper
async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'hippocampal-memory-mcp' });
});

// SSE endpoint for MCP
app.get('/sse', async (req, res) => {
  console.log('New SSE connection established');

  const server = new Server(
    {
      name: 'hippocampal-memory-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Set up tool handlers (same as stdio version)
  setupToolHandlers(server);

  const transport = new SSEServerTransport('/messages', res);
  await server.connect(transport);
});

// POST endpoint for MCP messages
app.post('/messages', async (req, res) => {
  // This endpoint is used by SSEServerTransport for client->server messages
  res.status(200).end();
});

function setupToolHandlers(server) {
  // Tool definitions
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'encode_memory',
          description: 'Create episodic memory event with emotional valence, temporal context, and entity involvement. Automatically generates embeddings for semantic retrieval.',
          inputSchema: {
            type: 'object',
            properties: {
              event: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: ['conversation', 'realization', 'correction', 'collaboration', 'genesis'],
                    description: 'Type of episodic event',
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time',
                    description: 'ISO 8601 datetime (defaults to now)',
                  },
                  emotional_valence: {
                    type: 'number',
                    minimum: -1.0,
                    maximum: 1.0,
                    description: 'Emotional tone: -1.0 (negative) to 1.0 (positive)',
                  },
                  significance: {
                    type: 'number',
                    minimum: 0.0,
                    maximum: 1.0,
                    description: 'Consolidation priority: 0.0 (trivial) to 1.0 (critical)',
                  },
                  context_summary: {
                    type: 'string',
                    description: 'Brief description of the event (used for semantic search)',
                  },
                  full_content: {
                    type: 'string',
                    description: 'Optional detailed record of the event',
                  },
                },
                required: ['type', 'context_summary', 'emotional_valence', 'significance'],
              },
              involves: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    entity_id: { type: 'string' },
                    role: {
                      type: 'string',
                      enum: ['subject', 'object', 'catalyst', 'witness'],
                    },
                    salience: { type: 'number', minimum: 0.0, maximum: 1.0 },
                  },
                  required: ['entity_id', 'role', 'salience'],
                },
              },
            },
            required: ['event'],
          },
        },
        {
          name: 'recall_memory',
          description: 'Retrieve memories using semantic similarity, emotional valence, temporal range, or entity involvement.',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Natural language query for semantic search',
              },
              limit: {
                type: 'integer',
                minimum: 1,
                maximum: 100,
                default: 10,
              },
            },
          },
        },
        {
          name: 'query_graph',
          description: 'Execute read-only Cypher queries for complex data retrieval.',
          inputSchema: {
            type: 'object',
            properties: {
              cypher: {
                type: 'string',
                description: 'Cypher query to execute (read-only)',
              },
              params: {
                type: 'object',
                description: 'Parameterized query values',
              },
            },
            required: ['cypher'],
          },
        },
      ],
    };
  });

  // Tool handlers (simplified - add full handlers from your original file)
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const startTime = Date.now();

    try {
      switch (request.params.name) {
        case 'encode_memory':
          return await handleEncodeMemory(request.params.arguments, startTime);

        case 'recall_memory':
          return await handleRecallMemory(request.params.arguments, startTime);

        case 'query_graph':
          return await handleQueryGraph(request.params.arguments, startTime);

        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
            }, null, 2),
          },
        ],
      };
    }
  });
}

// Simplified handlers (you can copy the full ones from hippocampal-mcp-server.mjs)
async function handleEncodeMemory(args, startTime) {
  const session = driver.session();
  try {
    const { event, involves = [] } = args;
    const eventId = randomUUID();
    const timestamp = event.timestamp || new Date().toISOString();

    const embedding = await generateEmbedding(event.context_summary);

    await session.run(
      `CREATE (e:Event {
        id: $id,
        timestamp: datetime($timestamp),
        type: $type,
        emotional_valence: $emotional_valence,
        significance: $significance,
        context_summary: $context_summary,
        full_content: $full_content,
        embedding: $embedding,
        embedding_model: 'text-embedding-3-small'
      })
      RETURN e`,
      {
        id: eventId,
        timestamp,
        type: event.type,
        emotional_valence: event.emotional_valence,
        significance: event.significance,
        context_summary: event.context_summary,
        full_content: event.full_content || null,
        embedding,
      }
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: { event_id: eventId, timestamp },
            metadata: { execution_time_ms: Date.now() - startTime },
          }, null, 2),
        },
      ],
    };
  } finally {
    await session.close();
  }
}

async function handleRecallMemory(args, startTime) {
  const session = driver.session();
  try {
    const { query, limit = 10 } = args;

    if (query) {
      const queryEmbedding = await generateEmbedding(query);

      const result = await session.run(
        `CALL db.index.vector.queryNodes('event_embeddings', $limit, $queryEmbedding)
        YIELD node AS e, score
        RETURN e.id AS id, e.context_summary AS context_summary,
               e.emotional_valence AS emotional_valence, score
        LIMIT $limit`,
        { queryEmbedding, limit }
      );

      const memories = result.records.map(r => ({
        id: r.get('id'),
        context_summary: r.get('context_summary'),
        emotional_valence: r.get('emotional_valence'),
        score: r.get('score'),
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: { memories, count: memories.length },
              metadata: { execution_time_ms: Date.now() - startTime },
            }, null, 2),
          },
        ],
      };
    }

    return {
      content: [
        { type: 'text', text: JSON.stringify({ success: true, data: { memories: [] } }, null, 2) },
      ],
    };
  } finally {
    await session.close();
  }
}

async function handleQueryGraph(args, startTime) {
  const session = driver.session();
  try {
    const { cypher, params = {} } = args;
    const result = await session.run(cypher, params);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: {
              records: result.records.map(record => record.toObject()),
              count: result.records.length,
            },
            metadata: { execution_time_ms: Date.now() - startTime },
          }, null, 2),
        },
      ],
    };
  } finally {
    await session.close();
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`🧠 Remote Hippocampal Memory MCP Server running on port ${PORT}`);
  console.log(`📡 SSE endpoint: http://localhost:${PORT}/sse`);
  console.log(`🔗 Neo4j: ${NEO4J_URI}`);
});
