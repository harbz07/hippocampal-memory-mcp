/**
 * Hippocampus Module Extension
 * 
 * Additional tools that match the biomimetic schema:
 * - hippocampus_write_event: Create Event with Who/Why/What/Where/Effects blocks
 * - hippocampus_write_reflection: Agent-relative memory slice
 * - hippocampus_search_events: Pattern completion retrieval
 */

// Tool definitions for Hippocampus Module
export const hippocampusTools = [
  {
    name: 'hippocampus_write_event',
    description: 'Create an episodic Event with Who/Why/What/Where/Effects blocks. Mimics hippocampal CA3 pattern separation and binding.',
    inputSchema: {
      type: 'object',
      properties: {
        event: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique event identifier (auto-generated if omitted)',
            },
            title: {
              type: 'string',
              description: 'Short semantic label for the event',
            },
            description: {
              type: 'string',
              description: 'Narrative content of the event',
            },
            happened_at: {
              type: 'string',
              format: 'date-time',
              description: 'ISO 8601 timestamp (defaults to now)',
            },
            who: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', description: 'Person/Agent name or ID' },
                  type: { 
                    type: 'string', 
                    enum: ['person', 'agent'],
                    description: 'Participant type (person for humans, agent for AI/systems)'
                  },
                },
                required: ['id', 'type'],
              },
              description: 'Participants in the event',
            },
            why: {
              type: 'array',
              items: { type: 'string' },
              description: 'Catalysts/motivations (why it happened)',
            },
            what_entities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  kind: { type: 'string', description: 'framework, paper, module, system, etc.' },
                  meta: { type: 'string', description: 'Optional JSON metadata' },
                },
                required: ['id', 'name', 'kind'],
              },
              description: 'Non-human entities involved (frameworks, artifacts, concepts)',
            },
            what_produced: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  kind: { type: 'string' },
                  meta: { type: 'string' },
                },
                required: ['id', 'name', 'kind'],
              },
              description: 'Entities created during this event',
            },
            where: {
              type: 'string',
              description: 'Place name (physical or conceptual location)',
            },
            effects: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  summary: { type: 'string', description: 'What happened as a result' },
                  valence: { 
                    type: 'string', 
                    enum: ['positive', 'negative', 'neutral', 'mixed'],
                    description: 'Emotional tone'
                  },
                  intensity: { 
                    type: 'number', 
                    minimum: 0.0, 
                    maximum: 1.0,
                    description: 'Emotional strength (0.0-1.0)'
                  },
                  target_id: { type: 'string', description: 'Who/what was affected' },
                  target_kind: { 
                    type: 'string',
                    description: 'HUMAN, AGENT, GROUP, SYSTEM, etc.'
                  },
                },
                required: ['summary', 'valence', 'intensity', 'target_id', 'target_kind'],
              },
              description: 'Outcomes with emotional weighting',
            },
          },
          required: ['title', 'description', 'who', 'where'],
        },
      },
      required: ['event'],
    },
  },
  {
    name: 'hippocampus_write_reflection',
    description: 'Create agent-relative Reflection about an event. Mimics prefrontal cortex self-referential processing with egocentric perspective.',
    inputSchema: {
      type: 'object',
      properties: {
        event_id: {
          type: 'string',
          description: 'ID of the event being reflected upon',
        },
        agent_id: {
          type: 'string',
          description: 'ID of the agent creating the reflection',
        },
        reflection: {
          type: 'object',
          properties: {
            summary: {
              type: 'string',
              description: 'Agent\'s interpretation of the event',
            },
            valence: {
              type: 'string',
              enum: ['positive', 'negative', 'neutral', 'mixed'],
              description: 'Agent\'s emotional response',
            },
            considered_targets: {
              type: 'array',
              items: { type: 'string' },
              description: 'Other entities considered in this reflection (beyond self)',
            },
          },
          required: ['summary', 'valence'],
        },
      },
      required: ['event_id', 'agent_id', 'reflection'],
    },
  },
  {
    name: 'hippocampus_search_events',
    description: 'Retrieve events using pattern completion. Supports semantic search, temporal filters, participant filters, and effect filters.',
    inputSchema: {
      type: 'object',
      properties: {
        semantic_query: {
          type: 'string',
          description: 'Natural language query for semantic search (optional)',
        },
        time_range: {
          type: 'object',
          properties: {
            start: { type: 'string', format: 'date-time' },
            end: { type: 'string', format: 'date-time' },
          },
          description: 'Filter by temporal range (optional)',
        },
        participants: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by participant IDs (Person/Agent names)',
        },
        entities: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by entity IDs involved',
        },
        place: {
          type: 'string',
          description: 'Filter by location',
        },
        effects_on: {
          type: 'string',
          description: 'Filter for events with effects on specific target',
        },
        min_effect_intensity: {
          type: 'number',
          minimum: 0.0,
          maximum: 1.0,
          description: 'Minimum emotional intensity threshold',
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 10,
          description: 'Maximum results to return',
        },
      },
    },
  },
];

// Handler implementations

export async function handleWriteEvent(args, startTime, driver) {
  const session = driver.session();
  const tx = session.beginTransaction();

  try {
    const { event } = args;
    
    // Generate event ID if not provided
    const eventId = event.id || `event-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const happenedAt = event.happened_at || new Date().toISOString();
    
    // Create Event node
    await tx.run(
      `
      CREATE (e:Event {
        id: $id,
        happened_at: datetime($happenedAt),
        title: $title,
        description: $description
      })
      `,
      {
        id: eventId,
        happenedAt,
        title: event.title,
        description: event.description,
      }
    );

    // WHERE Block - Place
    if (event.where) {
      await tx.run(
        `
        MATCH (e:Event {id: $eventId})
        MERGE (p:Place {name: $placeName})
        MERGE (e)-[:HELD_AT]->(p)
        `,
        { eventId, placeName: event.where }
      );
    }

    // WHO Block - Participants
    if (event.who) {
      for (const participant of event.who) {
        if (participant.type === 'person') {
          await tx.run(
            `
            MATCH (e:Event {id: $eventId})
            MERGE (p:Person {name: $name})
            MERGE (p)-[:PARTICIPATED_IN]->(e)
            `,
            { eventId, name: participant.id }
          );
        } else if (participant.type === 'agent') {
          await tx.run(
            `
            MATCH (e:Event {id: $eventId})
            MERGE (a:Agent {id: $agentId})
            MERGE (a)-[:PARTICIPATED_IN]->(e)
            `,
            { eventId, agentId: participant.id }
          );
        }
      }
    }

    // WHY Block - Catalysts
    if (event.why) {
      for (const reason of event.why) {
        await tx.run(
          `
          MATCH (e:Event {id: $eventId})
          MERGE (c:Catalyst {description: $reason})
          MERGE (e)-[:CATALYZED_BY]->(c)
          `,
          { eventId, reason }
        );
      }
    }

    // WHAT Block - Entities involved
    if (event.what_entities) {
      for (const entity of event.what_entities) {
        await tx.run(
          `
          MATCH (e:Event {id: $eventId})
          MERGE (ent:Entity {id: $entityId})
          ON CREATE SET ent.name = $name, ent.kind = $kind, ent.meta = $meta
          MERGE (ent)-[:INVOLVED_IN]->(e)
          `,
          {
            eventId,
            entityId: entity.id,
            name: entity.name,
            kind: entity.kind,
            meta: entity.meta || null,
          }
        );
      }
    }

    // WHAT Block - Entities produced
    if (event.what_produced) {
      for (const entity of event.what_produced) {
        await tx.run(
          `
          MATCH (e:Event {id: $eventId})
          MERGE (ent:Entity {id: $entityId})
          ON CREATE SET ent.name = $name, ent.kind = $kind, ent.meta = $meta
          MERGE (e)-[:PRODUCED]->(ent)
          `,
          {
            eventId,
            entityId: entity.id,
            name: entity.name,
            kind: entity.kind,
            meta: entity.meta || null,
          }
        );
      }
    }

    // EFFECTS Block
    if (event.effects) {
      for (const effect of event.effects) {
        await tx.run(
          `
          MATCH (e:Event {id: $eventId})
          MERGE (t:Target {id: $targetId, kind: $targetKind})
          CREATE (f:Effect {
            summary: $summary,
            valence: $valence,
            intensity: $intensity
          })
          MERGE (e)-[:HAD_EFFECT_ON]->(f)
          MERGE (f)-[:WITH_RESPECT_TO]->(t)
          `,
          {
            eventId,
            targetId: effect.target_id,
            targetKind: effect.target_kind,
            summary: effect.summary,
            valence: effect.valence,
            intensity: effect.intensity,
          }
        );
      }
    }

    await tx.commit();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: {
              event_id: eventId,
              timestamp: happenedAt,
              title: event.title,
            },
            metadata: {
              execution_time_ms: Date.now() - startTime,
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

export async function handleWriteReflection(args, startTime, driver) {
  const session = driver.session();

  try {
    const { event_id, agent_id, reflection } = args;

    const result = await session.run(
      `
      MATCH (e:Event {id: $eventId})
      MERGE (a:Agent {id: $agentId})
      
      OPTIONAL MATCH (e)-[:HAD_EFFECT_ON]->(f:Effect)-[:WITH_RESPECT_TO]->(t:Target)
      WHERE t.id = $agentId OR t.id IN $consideredTargets
      
      OPTIONAL MATCH (e)-[:HELD_AT]->(p:Place)
      OPTIONAL MATCH (e)-[:CATALYZED_BY]->(c:Catalyst)
      
      WITH e, a, 
           [$agentId] + collect(DISTINCT t.id) AS who_context,
           p.name AS where_context,
           collect(DISTINCT c.description) AS how_context
      
      CREATE (ref:Reflection {
        summary: $summary,
        valence: $valence,
        entry_date: datetime(),
        who_context: who_context,
        where_context: where_context,
        how_context: how_context
      })
      MERGE (ref)-[:ABOUT_EVENT]->(e)
      MERGE (ref)-[:FROM_AGENT]->(a)
      
      RETURN ref
      `,
      {
        eventId: event_id,
        agentId: agent_id,
        summary: reflection.summary,
        valence: reflection.valence,
        consideredTargets: reflection.considered_targets || [],
      }
    );

    const record = result.records[0];
    const reflectionNode = record.get('ref').properties;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: {
              agent_id,
              event_id,
              reflection: {
                summary: reflectionNode.summary,
                valence: reflectionNode.valence,
                who_context: reflectionNode.who_context,
                where_context: reflectionNode.where_context,
                how_context: reflectionNode.how_context,
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

export async function handleSearchEvents(args, startTime, driver, openai) {
  const session = driver.session();

  try {
    const {
      semantic_query,
      time_range,
      participants,
      entities,
      place,
      effects_on,
      min_effect_intensity,
      limit = 10,
    } = args;

    let cypherQuery = 'MATCH (e:Event)';
    const params = { limit: parseInt(limit) || 10 };
    const whereClauses = [];

    // Temporal filter
    if (time_range) {
      whereClauses.push('e.happened_at >= datetime($timeStart) AND e.happened_at <= datetime($timeEnd)');
      params.timeStart = time_range.start;
      params.timeEnd = time_range.end;
    }

    // Participant filter
    if (participants && participants.length > 0) {
      cypherQuery += `
        WITH e
        MATCH (e)<-[:PARTICIPATED_IN]-(participant)
        WHERE participant.name IN $participants OR participant.id IN $participants
      `;
      params.participants = participants;
    }

    // Entity filter
    if (entities && entities.length > 0) {
      cypherQuery += `
        WITH e
        MATCH (e)<-[:INVOLVED_IN]-(entity:Entity)
        WHERE entity.id IN $entities
      `;
      params.entities = entities;
    }

    // Place filter
    if (place) {
      whereClauses.push('EXISTS((e)-[:HELD_AT]->(:Place {name: $place}))');
      params.place = place;
    }

    // Effects filter
    if (effects_on) {
      whereClauses.push('EXISTS((e)-[:HAD_EFFECT_ON]->(:Effect)-[:WITH_RESPECT_TO]->(:Target {id: $effectsOn}))');
      params.effectsOn = effects_on;
    }

    if (min_effect_intensity !== undefined) {
      cypherQuery += `
        WITH e
        MATCH (e)-[:HAD_EFFECT_ON]->(f:Effect)
        WHERE f.intensity >= $minIntensity
      `;
      params.minIntensity = min_effect_intensity;
    }

    if (whereClauses.length > 0) {
      cypherQuery += `\nWHERE ${whereClauses.join(' AND ')}`;
    }

    // Return pattern completion (full episode reconstruction)
    cypherQuery += `
      WITH DISTINCT e
      OPTIONAL MATCH (e)<-[:PARTICIPATED_IN]-(person:Person)
      OPTIONAL MATCH (e)<-[:PARTICIPATED_IN]-(agent:Agent)
      OPTIONAL MATCH (e)<-[:INVOLVED_IN]-(entity:Entity)
      OPTIONAL MATCH (e)-[:HELD_AT]->(place:Place)
      OPTIONAL MATCH (e)-[:CATALYZED_BY]->(catalyst:Catalyst)
      OPTIONAL MATCH (e)-[:HAD_EFFECT_ON]->(effect:Effect)-[:WITH_RESPECT_TO]->(target:Target)
      
      RETURN e.id AS id,
             e.title AS title,
             e.description AS description,
             e.happened_at AS when,
             collect(DISTINCT person.name) AS people,
             collect(DISTINCT agent.id) AS agents,
             collect(DISTINCT entity.name) AS entities,
             place.name AS where,
             collect(DISTINCT catalyst.description) AS why,
             collect(DISTINCT {
               effect: effect.summary,
               valence: effect.valence,
               intensity: effect.intensity,
               target: target.id
             }) AS effects
      ORDER BY e.happened_at DESC
      LIMIT $limit
    `;

    const result = await session.run(cypherQuery, params);

    const events = result.records.map(record => ({
      id: record.get('id'),
      title: record.get('title'),
      description: record.get('description'),
      when: record.get('when'),
      who: {
        people: record.get('people').filter(p => p),
        agents: record.get('agents').filter(a => a),
      },
      what: record.get('entities').filter(e => e),
      where: record.get('where'),
      why: record.get('why').filter(w => w),
      effects: record.get('effects').filter(e => e.effect),
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: {
              events,
              count: events.length,
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
