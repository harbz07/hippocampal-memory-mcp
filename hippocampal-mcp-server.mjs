#!/usr/bin/env node

/**
 * Hippocampal Memory Consolidation MCP Server
 * 
 * Provides Claude with neuroanatomically-inspired memory tools:
 * - encode_memory: Episodic event creation with emotional valence & consolidation paths
 * - recall_memory: Semantic + temporal + emotional retrieval with vector similarity
 * - mutate_graph: General write operations for nodes/relationships
 * - evolve_bond: Track relationship dynamics over time
 * - query_graph: Read-only Cypher queries
 */

import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import neo4j from 'neo4j-driver';
import OpenAI from 'openai';
import { randomUUID } from 'crypto';
import { hippocampusTools, handleWriteEvent, handleWriteReflection, handleSearchEvents } from './hippocampus-extension.mjs';

// ============================================================================
// ENVIRONMENT VALIDATION
// ============================================================================

const { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD, OPENAI_API_KEY } = process.env;

if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) {
  console.error('❌ Missing Neo4j environment variables (NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD)');
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.error('❌ Missing OPENAI_API_KEY environment variable');
  process.exit(1);
}

// ============================================================================
// CLIENT INITIALIZATION & CONTEXT CREATION
// ============================================================================

const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Create shared context object passed to all handlers
const context = {
  driver,
  openai,
  generateEmbedding: async (text) => {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  },
};

// ============================================================================
// MCP SERVER INITIALIZATION
// ============================================================================

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

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      ...hippocampusTools,
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
                glyph: {
                  type: 'string',
                  description: 'Optional ROSTAM encoding',
                },
              },
              required: ['type', 'context_summary', 'emotional_valence', 'significance'],
            },
            involves: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  entity_id: {
                    type: 'string',
                    description: 'ID of Person/Project/Concept node',
                  },
                  role: {
                    type: 'string',
                    enum: ['subject', 'object', 'catalyst', 'witness'],
                    description: 'Role in the event',
                  },
                  salience: {
                    type: 'number',
                    minimum: 0.0,
                    maximum: 1.0,
                    description: 'Importance of this entity in the event',
                  },
                },
                required: ['entity_id', 'role', 'salience'],
              },
              description: 'Entities involved in this event',
            },
            precedes: {
              type: 'array',
              items: { type: 'string' },
              description: 'IDs of events this causally follows',
            },
            consolidates_to: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  target_id: {
                    type: 'string',
                    description: 'ID of Concept/Person/Project to consolidate into',
                  },
                  strength: {
                    type: 'number',
                    minimum: 0.0,
                    maximum: 1.0,
                  },
                  type: {
                    type: 'string',
                    enum: ['episodic', 'semantic', 'procedural'],
                  },
                },
                required: ['target_id', 'strength', 'type'],
              },
              description: 'Memory consolidation paths',
            },
          },
          required: ['event'],
        },
      },
      {
        name: 'recall_memory',
        description: 'Retrieve memories using semantic similarity, emotional valence, temporal range, or entity involvement. Returns ranked results combining vector similarity with Cypher filters.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Natural language query for semantic search',
            },
            emotional_range: {
              type: 'array',
              items: { type: 'number' },
              minItems: 2,
              maxItems: 2,
              description: 'Filter by emotional valence [min, max] between -1.0 and 1.0',
            },
            temporal_range: {
              type: 'array',
              items: { type: 'string', format: 'date-time' },
              minItems: 2,
              maxItems: 2,
              description: 'Filter by timestamp [start, end] in ISO 8601 format',
            },
            significance_threshold: {
              type: 'number',
              minimum: 0.0,
              maximum: 1.0,
              description: 'Minimum significance level',
            },
            involves_entities: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by entity involvement (Person/Project/Concept IDs)',
            },
            event_types: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['conversation', 'realization', 'correction', 'collaboration', 'genesis'],
              },
              description: 'Filter by event types',
            },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 10,
              description: 'Maximum number of results',
            },
            include_consolidations: {
              type: 'boolean',
              default: false,
              description: 'Include consolidation targets in results',
            },
          },
        },
      },
      {
        name: 'mutate_graph',
        description: 'Execute arbitrary Cypher write operations for creating/updating nodes, relationships, and properties. Use for operations beyond specialized tools.',
        inputSchema: {
          type: 'object',
          properties: {
            cypher: {
              type: 'string',
              description: 'Cypher query to execute (write operations)',
            },
            params: {
              type: 'object',
              description: 'Parameterized query values',
            },
          },
          required: ['cypher'],
        },
      },
      {
        name: 'evolve_bond',
        description: 'Update bond strength between entities and track relationship trajectory over time. Automatically records milestones and calculates momentum.',
        inputSchema: {
          type: 'object',
          properties: {
            from_entity_id: {
              type: 'string',
              description: 'Source entity ID (typically Person)',
            },
            to_entity_id: {
              type: 'string',
              description: 'Target entity ID (typically Person)',
            },
            new_strength: {
              type: 'number',
              minimum: 0.0,
              maximum: 1.0,
              description: 'Updated bond strength',
            },
            emotional_resonance: {
              type: 'number',
              minimum: -1.0,
              maximum: 1.0,
              description: 'Emotional quality of the bond',
            },
            milestone: {
              type: 'string',
              description: 'Description of what just happened',
            },
            interaction_context: {
              type: 'string',
              description: 'Context of this bond evolution',
            },
          },
          required: ['from_entity_id', 'to_entity_id', 'new_strength'],
        },
      },
      {
        name: 'query_graph',
        description: 'Execute read-only Cypher queries for complex data retrieval. Use for custom queries, analytics, and exploring the graph structure.',
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

// ============================================================================
// REQUEST HANDLER (Tool Dispatcher)
// ============================================================================

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const startTime = Date.now();

  try {
    switch (request.params.name) {
      // Extension handlers - pass context
      case 'hippocampus_write_event':
        return await handleWriteEvent(request.params.arguments, startTime, context);

      case 'hippocampus_write_reflection':
        return await handleWriteReflection(request.params.arguments, startTime, context);

      case 'hippocampus_search_events':
        return await handleSearchEvents(request.params.arguments, startTime, context);

      // Local handlers - pass context
      case 'encode_memory':
        return await handleEncodeMemory(request.params.arguments, startTime, context);

      case 'recall_memory':
        return await handleRecallMemory(request.params.arguments, startTime, context);

      case 'mutate_graph':
        return await handleMutateGraph(request.params.arguments, startTime, context);

      case 'evolve_bond':
        return await handleEvolveBond(request.params.arguments, startTime, context);

      case 'query_graph':
        return await handleQueryGraph(request.params.arguments, startTime, context);

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
            metadata: {
              execution_time_ms: Date.now() - startTime,
            },
          }, null, 2),
        },
      ],
    };
  }
});

// ============================================================================
// LOCAL HANDLER IMPLEMENTATIONS
// ============================================================================

async function handleEncodeMemory(args, startTime, context) {
  const { driver, generateEmbedding } = context;
  const session = driver.session();
  const tx = session.beginTransaction();

  try {
    const { event, involves = [], precedes = [], consolidates_to = [] } = args;

    // Validate event data
    if (event.emotional_valence < -1.0 || event.emotional_valence > 1.0) {
      throw new Error('emotional_valence must be between -1.0 and 1.0');
    }
    if (event.significance < 0.0 || event.significance > 1.0) {
      throw new Error('significance must be between 0.0 and 1.0');
    }

    // Generate event ID and timestamp
    const eventId = randomUUID();
    const timestamp = event.timestamp || new Date().toISOString();

    // Generate embedding from context_summary (and optionally full_content)
    const embeddingText = event.full_content 
      ? `${event.context_summary}\n\n${event.full_content}`
      : event.context_summary;
    
    const embedding = await generateEmbedding(embeddingText);

    // Create Event node
    await tx.run(
      `
      CREATE (e:Event {
        id: $id,
        timestamp: datetime($timestamp),
        type: $type,
        emotional_valence: $emotional_valence,
        significance: $significance,
        context_summary: $context_summary,
        full_content: $full_content,
        glyph_encoding: $glyph,
        embedding: $embedding,
        embedding_model: 'text-embedding-3-small'
      })
      RETURN e
      `,
      {
        id: eventId,
        timestamp,
        type: event.type,
        emotional_valence: event.emotional_valence,
        significance: event.significance,
        context_summary: event.context_summary,
        full_content: event.full_content || null,
        glyph: event.glyph || null,
        embedding,
      }
    );

    // Create INVOLVES relationships
    for (const involvement of involves) {
      await tx.run(
        `
        MATCH (e:Event {id: $eventId})
        MATCH (entity {id: $entityId})
        CREATE (e)-[:INVOLVES {
          role: $role,
          salience: $salience
        }]->(entity)
        `,
        {
          eventId,
          entityId: involvement.entity_id,
          role: involvement.role,
          salience: involvement.salience,
        }
      );
    }

    // Create PRECEDED relationships
    for (const precedingEventId of precedes) {
      await tx.run(
        `
        MATCH (e1:Event {id: $precedingId})
        MATCH (e2:Event {id: $eventId})
        CREATE (e1)-[:PRECEDED {
          temporal_distance: duration.between(e1.timestamp, e2.timestamp),
          causal_strength: 0.8
        }]->(e2)
        `,
        {
          precedingId: precedingEventId,
          eventId,
        }
      );
    }

    // Create CONSOLIDATED_TO relationships
    for (const consolidation of consolidates_to) {
      await tx.run(
        `
        MATCH (e:Event {id: $eventId})
        MATCH (target {id: $targetId})
        CREATE (e)-[:CONSOLIDATED_TO {
          strength: $strength,
          consolidation_type: $type,
          rehearsal_count: 1
        }]->(target)
        `,
        {
          eventId,
          targetId: consolidation.target_id,
          strength: consolidation.strength,
          type: consolidation.type,
        }
      );
    }

    await tx.commit();

    // Retrieve the created event with relationships
    const session2 = driver.session();
    const finalResult = await session2.run(
      `
      MATCH (e:Event {id: $eventId})
      OPTIONAL MATCH (e)-[inv:INVOLVES]->(entity)
      OPTIONAL MATCH (prev)-[prec:PRECEDED]->(e)
      OPTIONAL MATCH (e)-[cons:CONSOLIDATED_TO]->(target)
      RETURN e,
             collect(DISTINCT {entity: entity, role: inv.role, salience: inv.salience}) as involves,
             collect(DISTINCT prev.id) as preceded_by,
             collect(DISTINCT {target: target.id, type: cons.consolidation_type, strength: cons.strength}) as consolidations
      `,
      { eventId }
    );
    await session2.close();

    const record = finalResult.records[0];
    const eventNode = record.get('e').properties;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: {
              event_id: eventId,
              timestamp: eventNode.timestamp,
              type: eventNode.type,
              emotional_valence: eventNode.emotional_valence,
              significance: eventNode.significance,
              context_summary: eventNode.context_summary,
              involves: record.get('involves').filter(i => i.entity),
              preceded_by: record.get('preceded_by').filter(id => id),
              consolidations: record.get('consolidations').filter(c => c.target),
            },
            metadata: {
              execution_time_ms: Date.now() - startTime,
              nodes_created: 1,
              relationships_created: involves.length + precedes.length + consolidates_to.length,
              embedding_generated: true,
            },
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    await session.close();
  }
}

async function handleRecallMemory(args, startTime, context) {
  const { driver, generateEmbedding } = context;
  const session = driver.session();

  try {
    const {
      query,
      emotional_range,
      temporal_range,
      significance_threshold,
      involves_entities,
      event_types,
      limit = 10,
      include_consolidations = false,
    } = args;

    let cypherQuery = '';
    let params = { limit };

    if (query) {
      const queryEmbedding = await generateEmbedding(query);
      params.queryEmbedding = queryEmbedding;

      cypherQuery = `
        CALL db.index.vector.queryNodes('event_embeddings', $limit * 2, $queryEmbedding)
        YIELD node AS e, score
      `;
    } else {
      cypherQuery = `
        MATCH (e:Event)
        WITH e, 0.5 AS score
      `;
    }

    // Apply filters
    const whereClauses = [];

    if (emotional_range) {
      whereClauses.push('e.emotional_valence >= $emotionalMin AND e.emotional_valence <= $emotionalMax');
      params.emotionalMin = emotional_range[0];
      params.emotionalMax = emotional_range[1];
    }

    if (temporal_range) {
      whereClauses.push('e.timestamp >= datetime($temporalStart) AND e.timestamp <= datetime($temporalEnd)');
      params.temporalStart = temporal_range[0];
      params.temporalEnd = temporal_range[1];
    }

    if (significance_threshold !== undefined) {
      whereClauses.push('e.significance >= $significanceThreshold');
      params.significanceThreshold = significance_threshold;
    }

    if (event_types && event_types.length > 0) {
      whereClauses.push('e.type IN $eventTypes');
      params.eventTypes = event_types;
    }

    if (involves_entities && involves_entities.length > 0) {
      cypherQuery += `
        WITH e, score
        MATCH (e)-[:INVOLVES]->(entity)
        WHERE entity.id IN $involvesEntities
      `;
      params.involvesEntities = involves_entities;
    }

    if (whereClauses.length > 0) {
      cypherQuery += `\nWHERE ${whereClauses.join(' AND ')}`;
    }

    cypherQuery += `
      WITH e, score, (score * 0.7 + e.significance * 0.3) AS final_score
    `;

    if (include_consolidations) {
      cypherQuery += `
        OPTIONAL MATCH (e)-[cons:CONSOLIDATED_TO]->(target)
        WITH e, final_score, collect({target: target.id, type: cons.consolidation_type, strength: cons.strength}) as consolidations
      `;
    }

    cypherQuery += `
      RETURN e.id AS id,
             e.timestamp AS timestamp,
             e.type AS type,
             e.emotional_valence AS emotional_valence,
             e.significance AS significance,
             e.context_summary AS context_summary,
             e.full_content AS full_content,
             e.glyph_encoding AS glyph,
             final_score AS relevance_score
             ${include_consolidations ? ', consolidations' : ''}
      ORDER BY final_score DESC
      LIMIT $limit
    `;

    const result = await session.run(cypherQuery, params);

    const memories = result.records.map(record => {
      const memory = {
        id: record.get('id'),
        timestamp: record.get('timestamp'),
        type: record.get('type'),
        emotional_valence: record.get('emotional_valence'),
        significance: record.get('significance'),
        context_summary: record.get('context_summary'),
        full_content: record.get('full_content'),
        glyph: record.get('glyph'),
        relevance_score: record.get('relevance_score'),
      };

      if (include_consolidations) {
        memory.consolidations = record.get('consolidations').filter(c => c.target);
      }

      return memory;
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: {
              memories,
              count: memories.length,
              query: query || 'filtered search',
            },
            metadata: {
              execution_time_ms: Date.now() - startTime,
              semantic_search_used: !!query,
            },
          }, null, 2),
        },
      ],
    };
  } finally {
    await session.close();
  }
}

async function handleMutateGraph(args, startTime, context) {
  const { driver } = context;
  const session = driver.session();

  try {
    const { cypher, params = {} } = args;

    const result = await session.run(cypher, params);

    const summary = result.summary;
    const counters = summary.counters.updates();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: {
              records: result.records.map(record => record.toObject()),
              summary: {
                nodes_created: counters.nodesCreated,
                nodes_deleted: counters.nodesDeleted,
                relationships_created: counters.relationshipsCreated,
                relationships_deleted: counters.relationshipsDeleted,
                properties_set: counters.propertiesSet,
              },
            },
            metadata: {
              execution_time_ms: Date.now() - startTime,
            },
          }, null, 2),
        },
      ],
    };
  } finally {
    await session.close();
  }
}

async function handleEvolveBond(args, startTime, context) {
  const { driver } = context;
  const session = driver.session();

  try {
    const {
      from_entity_id,
      to_entity_id,
      new_strength,
      emotional_resonance,
      milestone,
      interaction_context,
    } = args;

    const result = await session.run(
      `
      MATCH (from {id: $fromId})
      MATCH (to {id: $toId})
      MERGE (from)-[b:BOND]->(to)
      ON CREATE SET
        b.strength = $newStrength,
        b.emotional_resonance = $emotionalResonance,
        b.interaction_count = 1,
        b.first_interaction = datetime(),
        b.last_interaction = datetime(),
        b.milestones = CASE WHEN $milestone IS NOT NULL THEN [$milestone] ELSE [] END,
        b.evolution_trajectory = [{
          timestamp: datetime(),
          strength: $newStrength,
          context: $context
        }]
      ON MATCH SET
        b.strength = $newStrength,
        b.emotional_resonance = coalesce($emotionalResonance, b.emotional_resonance),
        b.interaction_count = b.interaction_count + 1,
        b.last_interaction = datetime(),
        b.milestones = CASE 
          WHEN $milestone IS NOT NULL THEN b.milestones + $milestone 
          ELSE b.milestones 
        END,
        b.evolution_trajectory = b.evolution_trajectory + {
          timestamp: datetime(),
          strength: $newStrength,
          emotional_resonance: $emotionalResonance,
          context: $context
        }
      RETURN b, from.name AS from_name, to.name AS to_name
      `,
      {
        fromId: from_entity_id,
        toId: to_entity_id,
        newStrength: new_strength,
        emotionalResonance: emotional_resonance || null,
        milestone: milestone || null,
        context: interaction_context || null,
      }
    );

    const record = result.records[0];
    const bond = record.get('b').properties;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: {
              from: record.get('from_name'),
              to: record.get('to_name'),
              bond: {
                strength: bond.strength,
                emotional_resonance: bond.emotional_resonance,
                interaction_count: bond.interaction_count,
                first_interaction: bond.first_interaction,
                last_interaction: bond.last_interaction,
                milestones: bond.milestones,
                trajectory_length: bond.evolution_trajectory.length,
              },
            },
            metadata: {
              execution_time_ms: Date.now() - startTime,
            },
          }, null, 2),
        },
      ],
    };
  } finally {
    await session.close();
  }
}

async function handleQueryGraph(args, startTime, context) {
  const { driver } = context;
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
            metadata: {
              execution_time_ms: Date.now() - startTime,
            },
          }, null, 2),
        },
      ],
    };
  } finally {
    await session.close();
  }
}

// ============================================================================
// SERVER LIFECYCLE
// ============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🧠 Hippocampal Memory MCP Server running on stdio');
  console.error('🔗 Neo4j:', NEO4J_URI);
  console.error('🤖 OpenAI embeddings: text-embedding-3-small');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});