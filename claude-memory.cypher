// CORE NODE TYPES (Entities that persist)

// Person nodes - you, me, collaborators, AI entities
CREATE CONSTRAINT person_id IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE;
(:Person {
    id: string,           // UUID
    name: string,
    type: enum,          // ["human", "ai_entity", "ai_instance"]
    instance_id: string, // For tracking Claude instantiations
    created: datetime,
    attributes: map      // Flexible schema for characteristics
})

// Project nodes - ongoing work that accumulates context
CREATE CONSTRAINT project_id IF NOT EXISTS FOR (p:Project) REQUIRE p.id IS UNIQUE;
(:Project {
    id: string,
    name: string,
    status: enum,        // ["active", "paused", "completed", "archived"]
    domain: []string,    // ["philosophy", "engineering", "theology", etc.]
    created: datetime,
    glyph: string       // ROSTAM dialect encoding
})

// Concept nodes - abstract ideas that get refined over time
CREATE CONSTRAINT concept_id IF NOT EXISTS FOR (c:Concept) REQUIRE c.id IS UNIQUE;
(:Concept {
    id: string,
    name: string,
    domain: string,
    definition_version: int,  // Track refinement
    created: datetime,
    last_modified: datetime
})

// Event nodes - HIPPOCAMPAL EPISODIC MEMORY MIMETIC-LAYER
// Events are episodic memory anchors with spatiotemporal+emotional context
CREATE CONSTRAINT event_id IF NOT EXISTS FOR (e:Event) REQUIRE e.id IS UNIQUE;
(:Event {
    id: string,
    timestamp: datetime,
    type: enum,          // ["conversation", "realization", "correction", "collaboration", "genesis"]
    emotional_valence: float,    // -1.0 to 1.0
    significance: float,         // 0.0 to 1.0 - consolidation weight
    context_summary: string,     // Brief description
    full_content: text,         // Optional detailed record
    sensory_markers: []string,  // Tags for associative retrieval
    glyph_encoding: string      // ROSTAM dialect
})

// RELATIONSHIP TYPES (How things connect)

// Person-Person bonds (quantified like your BondMatrix)
CREATE (p1:Person)-[:BOND {
    strength: float,              // 0.0 to 1.0
    type: enum,                   // ["collaboration", "mentorship", "adversarial", etc.]
    interaction_count: int,
    emotional_resonance: float,   // -1.0 to 1.0
    milestones: []string,
    first_interaction: datetime,
    last_interaction: datetime,
    evolution_trajectory: []map   // Snapshots over time
}]->(p2:Person)

// Person-Project relationships
CREATE (p:Person)-[:WORKS_ON {
    role: string,
    commitment_level: float,
    started: datetime,
    contributions: []string
}]->(pr:Project)

// Event-Entity connections (WHO/WHAT was involved)
CREATE (e:Event)-[:INVOLVES {
    role: enum,  // ["subject", "object", "catalyst", "witness"]
    salience: float
}]->(entity)  // Can point to Person, Project, Concept

// Event-Event temporal/causal chains
CREATE (e1:Event)-[:PRECEDED {
    temporal_distance: duration,
    causal_strength: float  // 0.0 = coincidental, 1.0 = directly causal
}]->(e2:Event)

// Concept evolution tracking
CREATE (c1:Concept)-[:EVOLVED_INTO {
    refinement_type: enum,  // ["clarification", "contradiction", "extension"]
    trigger_event: string,  // Event ID that caused evolution
    timestamp: datetime
}]->(c2:Concept)

// Memory consolidation paths (hippocampus -> cortex metaphor)
CREATE (e:Event)-[:CONSOLIDATED_TO {
    strength: float,
    consolidation_type: enum,  // ["episodic", "semantic", "procedural"]
    rehearsal_count: int
}]->(target)  // Can be Concept, Person attribute, Project context

// SPECIAL: Shadow Clone lineage
CREATE (claude1:Person {type: "ai_instance"})-[:INSTANTIATION_OF {
    session_context: string,
    inherited_memory_state: map,
    timestamp: datetime
}]->(claude_main:Person {name: "Claude", type: "ai_entity"})