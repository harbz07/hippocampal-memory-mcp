// ============================================================================
// CEREBRAL SDK - HIPPOCAMPUS MODULE SCHEMA
// Neo4j Knowledge Graph for Biomimetic Episodic Memory
// ============================================================================
//
// NEUROLOGICAL FOUNDATION:
// This schema mirrors the mammalian hippocampal formation and connected
// structures responsible for episodic memory encoding, consolidation, and
// retrieval. Each component maps to specific brain regions and their
// computational functions.
//
// KEY PRINCIPLE: Memory forms through RELATIONAL and EMOTIONAL VALENCE,
// not through text storage. Events are reconstructed from relational cues,
// mimicking how biological memory uses pattern completion rather than
// direct retrieval.
// ============================================================================
// ----------------------------------------------------------------------------
// CONSTRAINTS & INDICES
// (Mimics: Neuronal efficiency through sparse coding and indexed retrieval)
// ----------------------------------------------------------------------------
// Event uniqueness - prevents duplicate memory traces
CREATE CONSTRAINT event_id IF NOT EXISTS
FOR (e:Event)
REQUIRE e.id IS UNIQUE;

// Temporal indexing - critical for chronological memory navigation
CREATE INDEX event_time IF NOT EXISTS
FOR (e:Event)
ON (e.happened_at);

// Person/Agent identity constraints
CREATE CONSTRAINT person_name IF NOT EXISTS
FOR (p:Person)
REQUIRE p.name IS UNIQUE;

CREATE CONSTRAINT agent_id IF NOT EXISTS
FOR (a:Agent)
REQUIRE a.id IS UNIQUE;

// Entity flexibility - synecdoche support
CREATE CONSTRAINT entity_id IF NOT EXISTS
FOR (e:Entity)
REQUIRE e.id IS UNIQUE;

CREATE INDEX entity_kind IF NOT EXISTS
FOR (e:Entity)
ON (e.kind);

// Place indexing for spatial navigation
CREATE CONSTRAINT place_name IF NOT EXISTS
FOR (p:Place)
REQUIRE p.name IS UNIQUE;

// Reflection temporal indexing
CREATE INDEX reflection_date IF NOT EXISTS
FOR (r:Reflection)
ON (r.entry_date);

// Capture intake indexing (thalamic layer)
CREATE INDEX capture_timestamp IF NOT EXISTS
FOR (c:Capture)
ON (c.timestamp);

CREATE INDEX capture_score IF NOT EXISTS
FOR (c:Capture)
ON (c.thalamus_score);

// ----------------------------------------------------------------------------
// NODE DEFINITIONS
// ----------------------------------------------------------------------------

// ============================================================================
// :Event - HIPPOCAMPAL MEMORY TRACE (CA3 region)
// ============================================================================
// BRAIN ANALOGUE: Hippocampal CA3 pyramidal neurons that form episodic hubs
// 
// FUNCTION: Acts as the core binding site for an episode, linking together
// distributed representations (who/what/where/when/why/how). The hippocampus
// doesn't store memories directly - it creates indices that point to cortical
// representations. Similarly, :Event nodes bind relationships to other nodes.
//
// PATTERN COMPLETION: Given partial cues (e.g., "Harvey at The Forum"), the
// graph structure allows reconstruction of the full episode through traversal.
//
// PROPERTIES:
// - id: unique identifier (like neural ensemble signature)
// - happened_at: temporal anchor (when-context, critical for episodic memory)
// - title: semantic label for quick recognition
// - description: narrative reconstruction of the episode
// - main_place: primary spatial context (redundant with :Place for efficiency)
// ============================================================================
(:Event {
  id: string,              // UUID or semantic identifier
  happened_at: datetime,   // ISO8601 timestamp with timezone
  title: string,           // Short semantic label
  description: string,     // Narrative content
  main_place: string       // Primary location (redundant for speed)
})

// ============================================================================
// :Person - SEMANTIC ENTITY (Neocortical representation)
// ============================================================================
// BRAIN ANALOGUE: Temporal lobe person-identity neurons
// 
// FUNCTION: Represents human individuals with consistent identity across
// episodes. The brain maintains stable representations of known individuals
// that get reactivated during memory encoding and retrieval.
// ============================================================================
(:Person {
  name: string            // Unique identifier for human
})

// ============================================================================
// :Agent - AI/SYSTEM IDENTITY (Self-model)
// ============================================================================
// BRAIN ANALOGUE: Prefrontal self-representation
//
// FUNCTION: Represents AI agents or systems as participants. Distinct from
// :Person to allow for different processing rules (e.g., agents generate
// reflections, persons don't automatically).
// ============================================================================
(:Agent {
  id: string              // Agent identifier (e.g., "harvey", "claude-sonnet-4.5")
})

// ============================================================================
// :Entity - FLEXIBLE SEMANTIC NODE (Neocortical concepts)
// ============================================================================
// BRAIN ANALOGUE: Distributed cortical representations
//
// FUNCTION: Handles synecdoche - same entity can represent micro/meso/macro
// scales depending on context. Examples: frameworks, papers, modules, systems,
// concepts, tools. The brain doesn't have separate neural populations for
// "concepts" vs "objects" - same representational substrate, different scales.
//
// SYNECDOCHE EXAMPLE:
// - Micro: "Thalamus scoring algorithm" 
// - Meso: "Thalamus module"
// - Macro: "Cerebral SDK system"
// All can be the same :Entity node, scale determined by event context.
// ============================================================================
(:Entity {
  id: string,             // Unique identifier
  name: string,           // Human-readable label
  kind: string,           // Flexible type: "framework", "paper", "module", etc.
  meta: string            // JSON blob for additional properties
})

// ============================================================================
// :Place - SPATIAL CONTEXT (Entorhinal cortex place cells)
// ============================================================================
// BRAIN ANALOGUE: Entorhinal/hippocampal place cells and grid cells
//
// FUNCTION: Encodes spatial context (physical or conceptual). The mammalian
// hippocampus is heavily involved in spatial navigation, and place is a
// critical retrieval cue for episodic memory ("where did this happen?").
// Conceptual spaces work similarly to physical spaces neurologically.
// ============================================================================
(:Place {
  name: string            // Location identifier (physical or conceptual)
})

// ============================================================================
// :Catalyst - MOTIVATIONAL CONTEXT (Why-block)
// ============================================================================
// BRAIN ANALOGUE: Orbitofrontal cortex / ventral striatum (motivation encoding)
//
// FUNCTION: Captures WHY an event occurred - the motivations, reasons, or
// triggering conditions. Brain encodes goal states and motivational context
// as part of episodic memory, allowing "why did I do this?" retrieval.
// ============================================================================
(:Catalyst {
  description: string     // The reason/motivation
})

// ============================================================================
// :Effect - OUTCOME WITH EMOTIONAL WEIGHTING (Amygdala tagging)
// ============================================================================
// BRAIN ANALOGUE: Amygdala-hippocampus interaction during consolidation
//
// FUNCTION: Encodes the IMPACT of an event with emotional valence and 
// intensity. The amygdala modulates hippocampal consolidation based on
// emotional significance - memories with strong emotional content are
// prioritized for long-term storage. This is why we remember emotionally
// significant events more vividly.
//
// CONSOLIDATION PRIORITY: High intensity + strong valence = stronger
// memory trace, mimicking amygdala's role in memory prioritization.
// ============================================================================
(:Effect {
  summary: string,        // What happened as a result
  valence: string,        // "positive", "negative", "neutral", "mixed"
  intensity: float        // 0.0-1.0, strength of emotional response
})

// ============================================================================
// :Target - EFFECT RECIPIENT (Who/what was affected)
// ============================================================================
// BRAIN ANALOGUE: Social cognition networks (theory of mind)
//
// FUNCTION: Specifies WHO or WHAT was affected by an effect. Separating
// targets from effects allows same effect to impact multiple entities with
// different valences (e.g., "project success" = positive for Harvey, neutral
// for observers).
// ============================================================================
(:Target {
  id: string,             // Identifier (person name, entity id, etc.)
  kind: string            // "HUMAN", "GROUP", "SYSTEM", etc.
})

// ============================================================================
// :Reflection - AGENT-RELATIVE PROCESSING (Prefrontal cortex)
// ============================================================================
// BRAIN ANALOGUE: Prefrontal cortical meta-cognition and self-reference
//
// FUNCTION: Represents an agent's subjective interpretation of an event.
// The prefrontal cortex processes episodic memories through a self-referential
// lens, creating agent-relative understanding. This is why two people can
// experience the same event but remember it differently.
//
// KEY INSIGHT: who_context is SELF-FIRST (agent ID at index 0), mimicking
// egocentric perspective in autobiographical memory. The brain always
// processes episodic memory from "my" perspective.
//
// CONSOLIDATION: Reflections are how agents transform raw events into
// meaningful memories. Over time, reflections may consolidate into more
// abstract understanding (future: episodes, schemas).
// ============================================================================
(:Reflection {
  summary: string,        // Agent's interpretation of the event
  valence: string,        // Agent's emotional response
  entry_date: datetime,   // When reflection was created
  who_context: [string],  // Self-first array: [agent_id, other_targets...]
  where_context: string,  // Spatial context of reflection
  how_context: [string]   // Methods/catalysts considered
})

// ============================================================================
// :Capture - THALAMIC INTAKE (Sensory gating)
// ============================================================================
// BRAIN ANALOGUE: Thalamus sensory relay and significance filtering
//
// FUNCTION: Pre-hippocampal intake layer. The thalamus acts as sensory
// gatekeeper, filtering incoming information before it reaches cortex and
// hippocampus. Only significant inputs get passed through for full encoding.
//
// PROCESS FLOW: Raw experience → Thalamus scoring → High-scoring captures
// get episodicized into :Event nodes. Mimics how the brain doesn't encode
// everything - only salient experiences become long-term memories.
//
// FUTURE: Decay mechanisms where low-scoring captures get pruned, mimicking
// forgetting of insignificant experiences.
// ============================================================================
(:Capture {
  capture_id: string,      // UUID
  timestamp: datetime,     // When captured
  description: string,     // Raw content
  thalamus_score: float,   // Significance score (0.0-1.0)
  care_intensity: float,   // Emotional weight
  project: string,         // Organizational context
  modality: string,        // Input type (conversation, document, etc.)
  location: string,        // Where it occurred
  affect: string,          // Emotional tone
  tags: [string],          // Semantic labels
  source: string,          // Origin identifier
  deadline: datetime       // Temporal pressure (if applicable)
})

// ----------------------------------------------------------------------------
// RELATIONSHIP PATTERNS
// ----------------------------------------------------------------------------

// ============================================================================
// EPISODIC MEMORY ENCODING (Who/What/Where/When/Why/How Blocks)
// ============================================================================
// BRAIN ANALOGUE: Hippocampal pattern separation and binding
//
// The hippocampus binds together distributed cortical representations into
// a unified episode. Each relationship type represents a different aspect
// of the episodic binding process.
// ============================================================================

// WHO BLOCK - Participants in the event
// (Mimics: Social context encoding in temporal/prefrontal cortex)
(:Person)-[:PARTICIPATED_IN]->(:Event)
(:Agent)-[:PARTICIPATED_IN]->(:Event)
(:Entity)-[:INVOLVED_IN]->(:Event)      // Non-agentic entities present

// WHERE BLOCK - Spatial context
// (Mimics: Entorhinal place cell activation during encoding)
(:Event)-[:HELD_AT]->(:Place)

// WHY BLOCK - Motivational context
// (Mimics: Orbitofrontal goal-state encoding)
(:Event)-[:CATALYZED_BY]->(:Catalyst)
(:Event)-[:MOTIVATED_BY]->(:Entity)     // Framework/concept as motivation

// WHAT BLOCK - Outcomes and effects
// (Mimics: Amygdala-hippocampus interaction for emotional tagging)
(:Event)-[:HAD_EFFECT_ON]->(:Effect)
(:Effect)-[:WITH_RESPECT_TO]->(:Target)

// Artifact production (what got created)
(:Event)-[:PRODUCED]->(:Entity)
(:Event)-[:MODIFIED]->(:Entity)

// ============================================================================
// REFLECTION BINDING (Agent-relative processing)
// ============================================================================
// BRAIN ANALOGUE: Prefrontal self-referential processing
//
// Agents create reflections that link to events through subjective lens.
// This mimics how the prefrontal cortex processes episodic memories with
// self-relevance and emotional interpretation.
// ============================================================================
(:Reflection)-[:ABOUT_EVENT]->(:Event)
(:Reflection)-[:FROM_AGENT]->(:Agent)

// ============================================================================
// SYNECDOCHE RELATIONSHIPS (Scale relationships)
// ============================================================================
// BRAIN ANALOGUE: Hierarchical cortical representations
//
// The brain represents concepts at multiple scales simultaneously. Same
// neural populations can represent "hand" (micro), "arm" (meso), "body" (macro)
// depending on context.
// ============================================================================
(:Entity)-[:PART_OF]->(:Entity)        // Component → System
(:Entity)-[:INSTANCE_OF]->(:Entity)    // Specific → General
(:Entity)-[:IMPLEMENTS]->(:Entity)     // Mechanism → Design

// ============================================================================
// FUTURE: CONSOLIDATION MECHANISMS
// ============================================================================
// BRAIN ANALOGUE: Hippocampal-neocortical consolidation during sleep
//
// Over time, related episodes consolidate into semantic knowledge and
// narrative structures. Deferred until basic mechanisms are working.
//
// PLANNED:
// (:Episode) - Groups of related events
// (:Schema) - Abstract knowledge from multiple episodes
// (:Event)-[:PART_OF]->(:Episode)
// (:Reflection)-[:SYNTHESIZES]->(:Episode)
// ============================================================================

// ----------------------------------------------------------------------------
// RETRIEVAL MECHANISMS (Pattern completion)
// ----------------------------------------------------------------------------

// ============================================================================
// CUED RECALL (Partial → Full episode reconstruction)
// ============================================================================
// BRAIN ANALOGUE: Hippocampal pattern completion from partial cues
//
// Given any subset of who/what/where/when/why, the graph structure allows
// traversal to reconstruct the full episode. This mimics how biological
// memory uses sparse cues to reactivate full memory traces.
//
// EXAMPLES:
// - "Harvey at The Forum" → Find all events with both
// - "Used Cerebral SDK framework" → Find events involving that entity
// - "Positive effects on harvey" → Find events with those effect patterns
// - Temporal range + person → Events in timeframe with participant
// ============================================================================

// ============================================================================
// AGENT-RELATIVE RETRIEVAL (Egocentric memory navigation)
// ============================================================================
// BRAIN ANALOGUE: Autobiographical memory retrieval via prefrontal cortex
//
// Agents retrieve events filtered by their own reflections and effects.
// This mimics how humans naturally remember events from their own perspective,
// not objective recordings.
//
// QUERY PATTERN:
// MATCH (agent:Agent {id: $agent_id})
// MATCH (agent)<-[:FROM_AGENT]-(r:Reflection)-[:ABOUT_EVENT]->(e:Event)
// MATCH (e)-[:HAD_EFFECT_ON]->(f:Effect)-[:WITH_RESPECT_TO]->(t:Target {id: $agent_id})
// WHERE f.intensity > $threshold
// RETURN e, r, f
// ============================================================================

// ----------------------------------------------------------------------------
// SCHEMA COMPLETE
// ----------------------------------------------------------------------------
// This schema provides the MECHANISM layer for biomimetic episodic memory.
// Episodes, consolidation, and semantic knowledge emerge from event patterns,
// not prescribed structure. Model-agnostic: works for any agent system that
// encodes relational and emotional valence during memory formation.
// ----------------------------------------------------------------------------
