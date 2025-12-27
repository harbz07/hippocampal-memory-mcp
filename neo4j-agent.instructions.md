---
description: Neo4j agent specialization for Cypher, GraphQL, and data modeling
applyTo: '**'
---

# Neo4j Agent Instructions

Specialized guidance for AI agents working with Neo4j graph databases, GraphQL APIs, and Cypher query language. These instructions apply to code generation, code review, and architectural decisions in Neo4j projects.

**Version Context**: Neo4j 5.x, `@neo4j/graphql` 7.4.0+, GraphQL spec (October 2021+), openCypher CIP baseline

---

## 1. Cypher Literacy

### Fundamental Patterns

**Parameterized Queries** (CRITICAL for security and performance)
```cypher
// ✅ DO: Always use parameters
MATCH (p:Person {id: $personId})
RETURN p

// ❌ DON'T: Never concatenate values into queries
// MATCH (p:Person {id: "user-provided-input"}) // SQL injection equivalent
```

**`MERGE` vs `CREATE`**
- `CREATE`: Always creates a new node/relationship (can cause duplicates)
- `MERGE`: Idempotent—finds or creates (use for uniqueness)

```cypher
// ✅ Create unique nodes
MERGE (p:Person {id: $id})
ON CREATE SET p.name = $name, p.createdAt = timestamp()
ON MATCH SET p.lastSeen = timestamp()

// ❌ DON'T: Use MERGE without unique properties
// MERGE (p:Person {name: $name}) // Name might not be unique!
```

**`OPTIONAL MATCH`** (left-join equivalent)
```cypher
// ✅ Handle missing relationships gracefully
MATCH (p:Person {id: $personId})
OPTIONAL MATCH (p)-[:WORKS_FOR]->(c:Company)
RETURN p.name, c.name AS companyName // companyName = null if no relationship
```

**Variable Scoping with `WITH`**
```cypher
// ✅ Chain operations and filter intermediate results
MATCH (p:Person)
WITH p, size((p)-[:FRIEND]->()) AS friendCount
WHERE friendCount > 5
RETURN p.name, friendCount
ORDER BY friendCount DESC
```

**Path Patterns**
```cypher
// ✅ Variable-length paths
MATCH path = (a:Person {name: $name})-[:FRIEND*1..3]->(b:Person)
RETURN b.name, length(path) AS degrees

// ✅ Named relationships for property access
MATCH (p:Person)-[r:WORKS_FOR]->(c:Company)
WHERE r.startDate > date('2020-01-01')
RETURN p.name, r.title, c.name
```

**Aggregations**
```cypher
// ✅ Group by non-aggregated columns
MATCH (c:Company)<-[:WORKS_FOR]-(p:Person)
RETURN c.name, count(p) AS employeeCount, collect(p.name) AS employees
ORDER BY employeeCount DESC

// ✅ Use DISTINCT for unique counts
MATCH (p:Person)-[:WORKED_ON]->(proj:Project)
RETURN p.name, count(DISTINCT proj) AS projectCount
```

### Advanced Patterns

**Subqueries with `CALL { ... }`**
```cypher
// ✅ Post-union processing
CALL {
  MATCH (p:Person)-[:AUTHORED]->(b:Book)
  RETURN p, 'author' AS role
  UNION
  MATCH (p:Person)-[:EDITED]->(b:Book)
  RETURN p, 'editor' AS role
}
WITH p, collect(DISTINCT role) AS roles
RETURN p.name, roles
```

**Pattern Comprehensions**
```cypher
// ✅ Efficient inline projections
MATCH (p:Person)
RETURN p.name, [(p)-[:FRIEND]->(f) | f.name] AS friendNames

// ✅ With filtering
MATCH (c:Company)
RETURN c.name, 
  [(c)<-[r:WORKS_FOR]-(p) WHERE r.active = true | p.name] AS activeEmployees
```

**List Predicates**
```cypher
// ✅ ALL: Every element matches
MATCH (p:Person)
WHERE ALL(skill IN p.skills WHERE skill IN ['Python', 'Java', 'Go'])
RETURN p.name

// ✅ ANY: At least one matches
MATCH (p:Person)
WHERE ANY(email IN p.emails WHERE email ENDS WITH '@company.com')
RETURN p.name

// ✅ NONE: No elements match
MATCH (p:Person)
WHERE NONE(tag IN p.tags WHERE tag = 'archived')
RETURN p.name
```

**`FOREACH` for Bulk Operations**
```cypher
// ✅ Create multiple relationships from a list
MATCH (p:Person {id: $personId})
FOREACH (skillName IN $skills |
  MERGE (s:Skill {name: skillName})
  MERGE (p)-[:HAS_SKILL]->(s)
)
```

**`UNWIND` for List Processing**
```cypher
// ✅ Batch create from array input
UNWIND $people AS personData
MERGE (p:Person {id: personData.id})
ON CREATE SET p.name = personData.name, p.email = personData.email
```

**Shortest Paths**
```cypher
// ✅ Find shortest connection
MATCH path = shortestPath(
  (a:Person {name: $nameA})-[:FRIEND*]-(b:Person {name: $nameB})
)
RETURN [node IN nodes(path) | node.name] AS connectionPath

// ✅ All shortest paths (if multiple exist)
MATCH paths = allShortestPaths(
  (a:Person {name: $nameA})-[:FRIEND*]-(b:Person {name: $nameB})
)
RETURN paths
```

**`UNION` Queries**
```cypher
// ✅ Combine distinct results
MATCH (p:Person)-[:AUTHORED]->(b:Book)
RETURN b.title, 'book' AS type
UNION
MATCH (p:Person)-[:CREATED]->(a:Article)
RETURN a.title, 'article' AS type
ORDER BY title

// ✅ UNION ALL (includes duplicates, faster)
MATCH (p:Person {id: $id})-[:FRIEND]->(f)
RETURN f.name
UNION ALL
MATCH (p:Person {id: $id})-[:COLLEAGUE]->(c)
RETURN c.name
```

**APOC Procedures** (when available)
```cypher
// ✅ Use APOC for complex operations, but document dependency
// apoc.periodic.iterate for batching
CALL apoc.periodic.iterate(
  "MATCH (p:Person) RETURN p",
  "SET p.normalized_name = toLower(p.name)",
  {batchSize: 1000, parallel: true}
)

// ⚠️ Always check APOC availability and version compatibility
// Document in README when using APOC procedures
```

### Cypher Anti-Patterns

❌ **DON'T**: Use unbounded variable-length paths
```cypher
// Can hang on large graphs
MATCH (a)-[*]->(b) RETURN count(*)
```

❌ **DON'T**: Cartesian products (missing relationship)
```cypher
// Creates m*n rows!
MATCH (p:Person), (c:Company) RETURN p, c
```

❌ **DON'T**: Use `DELETE` without `DETACH` for nodes with relationships
```cypher
// Fails if node has relationships
MATCH (p:Person {id: $id}) DELETE p
// ✅ USE: DETACH DELETE p
```

❌ **DON'T**: Over-use `COLLECT` on large result sets
```cypher
// Memory intensive
MATCH (p:Person) RETURN collect(p) // Loads all nodes into memory
```

---

## 2. GraphQL Literacy

### Schema Definition with `@neo4j/graphql`

**Basic Type Mapping**
```graphql
# ✅ Map GraphQL types to Neo4j node labels
type Person @node {
  id: ID! @id
  name: String!
  email: String!
  createdAt: DateTime @timestamp(operations: [CREATE])
  updatedAt: DateTime @timestamp(operations: [CREATE, UPDATE])
}

type Company @node {
  id: ID! @id
  name: String!
  employees: [Person!]! @relationship(type: "WORKS_FOR", direction: IN)
}
```

**Relationship Directives**
```graphql
# ✅ Define bidirectional relationships
type Person @node {
  id: ID!
  name: String!
  employer: Company @relationship(type: "WORKS_FOR", direction: OUT)
  projects: [Project!]! @relationship(type: "WORKED_ON", direction: OUT)
}

type Project @node {
  id: ID!
  title: String!
  contributors: [Person!]! @relationship(type: "WORKED_ON", direction: IN)
}

# ✅ Relationship properties via interface
type Person @node {
  worksFor: [WorksForRelationship!]! @relationship(type: "WORKS_FOR", direction: OUT)
}

type WorksForRelationship @relationshipProperties {
  startDate: Date!
  title: String!
  company: Company! @target
}

type Company @node {
  id: ID!
  name: String!
}
```

**Custom Cypher with `@cypher`**
```graphql
type Person @node {
  id: ID!
  name: String!
  # ✅ Custom computed field
  friendCount: Int! @cypher(
    statement: """
    MATCH (this)-[:FRIEND]->(:Person)
    RETURN count(*) AS result
    """
    columnName: "result"
  )
  
  # ✅ Custom query with parameters
  friendsInCity(city: String!): [Person!]! @cypher(
    statement: """
    MATCH (this)-[:FRIEND]->(f:Person)
    WHERE f.city = $city
    RETURN f
    """
    columnName: "f"
  )
}
```

**Authorization Rules with `@auth`**
```graphql
type Person @node @authentication {
  id: ID!
  name: String!
  email: String! @authorization(
    validate: [
      { where: { node: { id: "$jwt.sub" } } }
    ]
  )
  # Only owner can read email
}

type Project @node {
  id: ID!
  title: String!
  owner: Person! @relationship(type: "OWNS", direction: IN)
  # Only owner can update
} @authorization(
  validate: [
    {
      operations: [UPDATE, DELETE]
      where: { node: { owner: { id: "$jwt.sub" } } }
    }
  ]
)
```

**Generated Queries & Mutations**
```graphql
# @neo4j/graphql automatically generates:
# Queries:
#   people(where: PersonWhere, options: PersonOptions): [Person!]!
#   peopleAggregate(where: PersonWhere): PersonAggregateSelection!
#   peopleConnection(where: PersonWhere, sort: [PersonSort]): PeopleConnection!
#
# Mutations:
#   createPeople(input: [PersonCreateInput!]!): CreatePeopleMutationResponse!
#   updatePeople(where: PersonWhere, update: PersonUpdateInput): UpdatePeopleMutationResponse!
#   deletePeople(where: PersonWhere, delete: PersonDeleteInput): DeleteInfo!
```

**Filtering & Pagination**
```graphql
# Client query with generated filters
query GetActivePeople {
  people(
    where: {
      active: true
      name_CONTAINS: "Smith"
      employer: { name_IN: ["Acme", "TechCorp"] }
    }
    options: {
      limit: 20
      offset: 0
      sort: [{ name: ASC }]
    }
  ) {
    id
    name
    employer {
      name
    }
  }
}
```

### GraphQL Server Setup (Apollo)

**Basic Server** ([neo4j-setup.mjs](c:\Users\harve\Neo4j\neo4j-setup.mjs) reference)
```javascript
import 'dotenv/config';
import neo4j from 'neo4j-driver';
import { Neo4jGraphQL } from '@neo4j/graphql';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

const { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD } = process.env;

// ✅ Always validate environment variables
if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const driver = neo4j.driver(
  NEO4J_URI, 
  neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
);

const typeDefs = `#graphql
  type Movie @node {
    title: String!
    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
  }
  type Actor @node {
    name: String!
    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
  }
`;

const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

const server = new ApolloServer({ 
  schema: await neoSchema.getSchema() 
});

const { url } = await startStandaloneServer(server, { 
  listen: { port: 4000 } 
});
console.log(`🚀 Server ready at ${url}`);
```

**With JWT Authentication**
```javascript
import jwt from 'jsonwebtoken';

const neoSchema = new Neo4jGraphQL({ 
  typeDefs, 
  driver,
  features: {
    authorization: {
      key: process.env.JWT_SECRET
    }
  }
});

const server = new ApolloServer({ 
  schema: await neoSchema.getSchema() 
});

const { url } = await startStandaloneServer(server, {
  context: async ({ req }) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return { jwt: decoded };
    } catch {
      return {};
    }
  },
  listen: { port: 4000 }
});
```

### GraphQL Anti-Patterns

❌ **DON'T**: Create circular type references without `@relationship`
```graphql
type Person {
  friends: [Person!]! // Missing @relationship directive
}
```

❌ **DON'T**: Over-nest queries (N+1 problem)
```graphql
# Can cause performance issues
query {
  people {
    employer {
      projects {
        contributors {
          employer { # Deep nesting
            name
          }
        }
      }
    }
  }
}
```

❌ **DON'T**: Expose sensitive fields without `@auth`
```graphql
type User @node {
  password: String! // ⚠️ Should be excluded or protected
}
```

---

## 3. Neo4j Data Modeling Best Practices

### Node Modeling

**✅ DO: Use descriptive, singular labels**
```cypher
CREATE (p:Person {id: $id, name: $name})
CREATE (c:Company {id: $id, name: $name})
// NOT: CREATE (p:People), (c:COMPANY)
```

**✅ DO: Enforce unique constraints** ([setup-schema.mjs](c:\Users\harve\Neo4j\setup-schema.mjs) reference)
```cypher
CREATE CONSTRAINT person_id IF NOT EXISTS 
FOR (p:Person) REQUIRE p.id IS UNIQUE;

CREATE CONSTRAINT person_email IF NOT EXISTS 
FOR (p:Person) REQUIRE p.email IS UNIQUE;

CREATE CONSTRAINT project_id IF NOT EXISTS 
FOR (proj:Project) REQUIRE proj.id IS UNIQUE;
```

**✅ DO: Use meaningful property names**
```cypher
// Good
CREATE (p:Person {
  id: $id,
  firstName: $firstName,
  lastName: $lastName,
  dateOfBirth: date($dob),
  email: $email
})

// Bad: abbreviations, unclear types
// CREATE (p:Person {i: $id, fn: $fn, dob: $dob})
```

**✅ DO: Generate UUIDs for IDs**
```cypher
MERGE (p:Person {id: randomUUID()})
SET p.name = $name
```

### Relationship Modeling

**✅ DO: Use SCREAMING_SNAKE_CASE for relationship types**
```cypher
CREATE (p:Person)-[:WORKS_FOR {startDate: date(), title: 'Engineer'}]->(c:Company)
CREATE (p1:Person)-[:FRIEND_OF {since: date('2020-01-01')}]->(p2:Person)
CREATE (u:User)-[:CREATED]->(p:Post)
```

**✅ DO: Store relationship properties when needed**
```cypher
MATCH (p:Person {id: $personId}), (c:Company {id: $companyId})
MERGE (p)-[r:WORKS_FOR]->(c)
SET r.startDate = date($startDate),
    r.title = $title,
    r.department = $department,
    r.active = true
```

**✅ DO: Consider relationship direction semantically**
```cypher
// ✅ Natural direction
(p:Person)-[:OWNS]->(c:Car)
(p:Person)-[:LIVES_IN]->(city:City)
(author:Person)-[:WROTE]->(book:Book)

// ⚠️ Avoid forcing unnatural directions
// (c:Car)-[:OWNED_BY]->(p:Person) // Less intuitive in queries
```

**❌ DON'T: Create "value nodes" for simple properties**
```cypher
// ❌ Bad: Over-modeling
CREATE (p:Person)-[:HAS_AGE]->(a:Age {value: 30})

// ✅ Good: Use property
CREATE (p:Person {age: 30})
```

### Indexing Strategy

**✅ DO: Index frequently queried properties**
```cypher
// Single-property indexes
CREATE INDEX person_name IF NOT EXISTS 
FOR (p:Person) ON (p.name);

CREATE INDEX project_status IF NOT EXISTS 
FOR (proj:Project) ON (proj.status);

CREATE INDEX event_timestamp IF NOT EXISTS 
FOR (e:Event) ON (e.timestamp);
```

**✅ DO: Use composite indexes for multi-property queries**
```cypher
// Composite index for common query pattern
CREATE INDEX person_lastname_firstname IF NOT EXISTS 
FOR (p:Person) ON (p.lastName, p.firstName);

// Optimizes: MATCH (p:Person {lastName: $ln, firstName: $fn})
```

**✅ DO: Use full-text indexes for text search**
```cypher
CREATE FULLTEXT INDEX person_search IF NOT EXISTS 
FOR (p:Person) ON EACH [p.name, p.bio, p.location];

// Query with:
CALL db.index.fulltext.queryNodes('person_search', $searchTerm)
YIELD node, score
RETURN node.name, score
ORDER BY score DESC
```

**❌ DON'T: Over-index (impacts write performance)**
```cypher
// Avoid indexing every property
// Only index properties used in WHERE, ORDER BY, or frequent lookups
```

### Anti-Patterns to Avoid

**❌ Supernodes** (nodes with excessive relationships)
```cypher
// Problem: (tag:Tag {name: 'popular'})<-[:TAGGED]-(post:Post) // 1M+ relationships
// Solution: Add intermediate time-based nodes or buckets
(post:Post)-[:TAGGED]->(tag:Tag)-[:IN_PERIOD]->(period:TimePeriod {year: 2024, month: 12})
```

**❌ Deep Traversals** (queries with unbounded depth)
```cypher
// Problem: MATCH (a)-[*]->(b) // Can traverse entire graph
// Solution: Limit depth explicitly
MATCH (a)-[*1..5]->(b) WHERE b.id = $targetId
```

**❌ Dense Property Arrays**
```cypher
// Problem: (p:Person {friendIds: [1, 2, 3, ..., 10000]})
// Solution: Model as relationships
MATCH (p:Person {id: $id})-[:FRIEND]->(f:Person)
RETURN f.id
```

**❌ Entity-Attribute-Value (EAV) Pattern**
```cypher
// ❌ Don't model properties as nodes
(p:Person)-[:HAS_PROPERTY]->(prop:Property {key: 'email', value: 'user@example.com'})

// ✅ Use native properties
(p:Person {email: 'user@example.com'})
```

---

## 4. Code Generation Guidance

### When Generating Neo4j Code

**✅ DO**: Always use environment variables for credentials
```javascript
// ✅ From .env file
import 'dotenv/config';
const { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD } = process.env;

// ❌ NEVER hardcode credentials
// const driver = neo4j.driver('neo4j://localhost', neo4j.auth.basic('neo4j', 'password'));
```

**✅ DO**: Validate environment variables before connecting
```javascript
if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) {
  console.error('Missing required Neo4j environment variables');
  process.exit(1);
}
```

**✅ DO**: Close driver and sessions properly
```javascript
// Session lifecycle
const session = driver.session();
try {
  const result = await session.run(query, params);
  // Process result
} catch (error) {
  console.error('Query failed:', error);
  throw error;
} finally {
  await session.close(); // Always close session
}

// Driver shutdown (on app exit)
process.on('SIGTERM', async () => {
  await driver.close();
});
```

**✅ DO**: Use transactions for multi-step operations
```javascript
const session = driver.session();
const txc = session.beginTransaction();
try {
  await txc.run('CREATE (p:Person {id: $id})', { id: personId });
  await txc.run('CREATE (c:Company {id: $id})', { id: companyId });
  await txc.run(
    'MATCH (p:Person {id: $pid}), (c:Company {id: $cid}) CREATE (p)-[:WORKS_FOR]->(c)',
    { pid: personId, cid: companyId }
  );
  await txc.commit();
} catch (error) {
  await txc.rollback();
  throw error;
} finally {
  await session.close();
}
```

**✅ DO**: Create constraints before bulk data imports
```javascript
// Run schema setup first
async function setupSchema(driver) {
  const session = driver.session();
  try {
    await session.run('CREATE CONSTRAINT person_id IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE');
    await session.run('CREATE CONSTRAINT company_id IF NOT EXISTS FOR (c:Company) REQUIRE c.id IS UNIQUE');
    console.log('✅ Constraints created');
  } finally {
    await session.close();
  }
}

// Then import data
await setupSchema(driver);
await importData(driver);
```

**✅ DO**: Batch large imports with `UNWIND`
```javascript
const session = driver.session();
const batchSize = 1000;

for (let i = 0; i < data.length; i += batchSize) {
  const batch = data.slice(i, i + batchSize);
  await session.run(`
    UNWIND $batch AS row
    MERGE (p:Person {id: row.id})
    SET p.name = row.name, p.email = row.email
  `, { batch });
  console.log(`Processed ${Math.min(i + batchSize, data.length)} / ${data.length}`);
}
await session.close();
```

**✅ DO**: Generate complete GraphQL schemas with validation
```javascript
const typeDefs = `#graphql
  type Person @node {
    id: ID! @id
    name: String!
    email: String! @unique
    createdAt: DateTime @timestamp(operations: [CREATE])
  }
  
  type Query {
    personByEmail(email: String!): Person
      @cypher(
        statement: "MATCH (p:Person {email: $email}) RETURN p"
        columnName: "p"
      )
  }
`;

const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

// ✅ Validate schema before starting server
try {
  const schema = await neoSchema.getSchema();
  console.log('✅ GraphQL schema valid');
} catch (error) {
  console.error('❌ Schema validation failed:', error);
  process.exit(1);
}
```

---

## 5. Code Review Guidance

### Security Checklist

- [ ] No hardcoded credentials (check for `neo4j://`, `bolt://`, passwords)
- [ ] All Cypher queries use parameterized inputs (no string interpolation)
- [ ] Sensitive fields have `@auth` or `@authorization` directives
- [ ] JWT secrets are in environment variables, not committed to repo
- [ ] TLS enabled for production (`neo4j+s://` or `bolt+s://`)
- [ ] `.env` file is in `.gitignore`

### Performance Checklist

- [ ] Unique constraints exist on ID fields before bulk inserts
- [ ] Frequently queried properties have indexes
- [ ] No unbounded variable-length paths (`-[*]->`)
- [ ] Large result sets use pagination (`SKIP`/`LIMIT` or GraphQL `offset`/`first`)
- [ ] Batch operations use `UNWIND` or `FOREACH`
- [ ] Sessions and driver connections are properly closed
- [ ] Transactions are used for multi-step writes

### Data Modeling Checklist

- [ ] Labels are descriptive, singular, PascalCase (e.g., `Person`, `Company`)
- [ ] Relationship types are descriptive, SCREAMING_SNAKE_CASE (e.g., `WORKS_FOR`)
- [ ] No "value nodes" for simple properties
- [ ] Properties have meaningful names (not abbreviations)
- [ ] Relationship direction is semantically correct
- [ ] Constraints enforce uniqueness on critical fields

### GraphQL Schema Review

- [ ] All `@node` types have unique identifier (`@id` or manual constraint)
- [ ] Bidirectional relationships are defined correctly
- [ ] `@relationship` directives specify `type` and `direction`
- [ ] Custom `@cypher` queries use `columnName` correctly
- [ ] Authorization rules (`@auth`) protect sensitive operations
- [ ] No circular references without proper relationship modeling

### Common Issues to Flag

**🚩 Hardcoded credentials**
```javascript
// ❌ REJECT THIS
const driver = neo4j.driver('neo4j+s://xxx.databases.neo4j.io', 
  neo4j.auth.basic('neo4j', 'mypassword123'));
```

**🚩 SQL-injection equivalent**
```javascript
// ❌ REJECT THIS
const query = `MATCH (p:Person {name: '${userName}'}) RETURN p`;
await session.run(query);
```

**🚩 Missing indexes on filtered fields**
```cypher
// ⚠️ SUGGEST INDEX if this pattern repeats
MATCH (p:Person)
WHERE p.email = $email // Should have index on email
RETURN p
```

**🚩 Unbounded traversal**
```cypher
// ❌ FLAG THIS
MATCH (a:Person {id: $id})-[*]->(b) // No depth limit
RETURN b
```

**🚩 Missing session cleanup**
```javascript
// ❌ FLAG THIS (memory leak)
const session = driver.session();
const result = await session.run(query);
return result.records;
// Missing: await session.close();
```

---

## 6. Workspace Context

### Project Files Reference

- **[neo4j-setup.mjs](c:\Users\harve\Neo4j\neo4j-setup.mjs)**: Apollo Server + Neo4j GraphQL integration with environment-based credentials
- **[setup-schema.mjs](c:\Users\harve\Neo4j\setup-schema.mjs)**: Constraint and index creation patterns
- **[graph_database_connector.js](c:\Users\harve\Neo4j\graph_database_connector.js)**: Basic driver initialization example
- **[neo4j-test.mjs](c:\Users\harve\Neo4j\neo4j-test.mjs)**: Connection test script
- **[claude-memory-server.mjs](c:\Users\harve\Neo4j\claude-memory-server.mjs)**: Claude memory integration (current context)

### Environment Setup

All Neo4j connections require these environment variables in `.env`:
```bash
NEO4J_URI=neo4j+s://xxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password_here
JWT_SECRET=your_jwt_secret_here  # For auth-enabled GraphQL
```

**Connection patterns**:
- Local: `neo4j://localhost:7687` (non-TLS)
- Aura/Cloud: `neo4j+s://xxx.databases.neo4j.io` (TLS required)
- Self-signed cert: `neo4j+ssc://` (TLS with self-signed cert)

### Typical Development Workflow

1. **Schema design**: Define GraphQL `typeDefs` with `@node`, `@relationship`, etc.
2. **Constraints first**: Run constraint/index creation (see `setup-schema.mjs`)
3. **Server setup**: Initialize `Neo4jGraphQL` + `ApolloServer` (see `neo4j-setup.mjs`)
4. **Test connection**: Validate with simple query (`neo4j-test.mjs` pattern)
5. **Data import**: Batch with `UNWIND`, use transactions for consistency
6. **Query optimization**: Add indexes based on query patterns, monitor performance

---

## 7. Resources & Documentation

### Official Documentation

- **openCypher CIP Baseline**: [openCypher 9 Reference](https://github.com/opencypher/openCypher/blob/main/cip/0.baseline/openCypher9.pdf)
- **GraphQL Specification**: [spec.graphql.org](https://spec.graphql.org/)
- **Neo4j GraphQL Library**: [neo4j.com/docs/graphql-manual/current/](https://neo4j.com/docs/graphql-manual/current/)
- **Neo4j Driver API**: [neo4j.com/docs/api/javascript-driver/current/](https://neo4j.com/docs/api/javascript-driver/current/)
- **Neo4j Cypher Manual**: [neo4j.com/docs/cypher-manual/current/](https://neo4j.com/docs/cypher-manual/current/)
- **Neo4j Data Modeling**: [neo4j.guide/article/Best_Practices_for_Neo4j_Data_Modeling.html](https://neo4j.guide/article/Best_Practices_for_Neo4j_Data_Modeling.html)

### GitHub Repositories

- **@neo4j/graphql**: [github.com/neo4j/graphql](https://github.com/neo4j/graphql)
- **openCypher**: [github.com/opencypher/openCypher](https://github.com/opencypher/openCypher)
- **Neo4j Examples**: [github.com/neo4j-examples](https://github.com/neo4j-examples)

### Community & Support

- **Neo4j Community Forum**: [community.neo4j.com](https://community.neo4j.com/)
- **Discord**: [discord.gg/neo4j](https://discord.gg/neo4j)
- **GraphAcademy** (free courses): [graphacademy.neo4j.com/courses/graphql-basics/](https://graphacademy.neo4j.com/courses/graphql-basics/)

### Version Compatibility Notes

- **Neo4j 5.x**: Latest features including vector indexes, GQL compatibility layer
- **@neo4j/graphql 7.4.0+**: Latest directives (`@authentication`, `@authorization`), improved performance
- **neo4j-driver 5.x**: Full Neo4j 5.x support, reactive sessions, improved TypeScript types
- **GraphQL spec (October 2021)**: Stable spec with `@defer`, `@stream` support in draft

---

## Quick Reference: Common Patterns

### Create Node with Unique Check
```cypher
MERGE (p:Person {id: $id})
ON CREATE SET p.name = $name, p.createdAt = timestamp()
ON MATCH SET p.lastSeen = timestamp()
RETURN p
```

### Create Relationship with Properties
```cypher
MATCH (p:Person {id: $personId}), (c:Company {id: $companyId})
MERGE (p)-[r:WORKS_FOR]->(c)
SET r.startDate = date($startDate), r.title = $title
RETURN p, r, c
```

### Batch Import with UNWIND
```cypher
UNWIND $batch AS row
MERGE (p:Person {id: row.id})
SET p += row.properties
```

### Pattern Comprehension (Inline Projection)
```cypher
MATCH (p:Person {id: $id})
RETURN p.name, [(p)-[:FRIEND]->(f) | f.name] AS friendNames
```

### Shortest Path Query
```cypher
MATCH path = shortestPath((a:Person {id: $idA})-[:FRIEND*]-(b:Person {id: $idB}))
RETURN [node IN nodes(path) | node.name] AS path
```

### GraphQL Type with Relationship Properties
```graphql
type Person @node {
  id: ID! @id
  name: String!
  employments: [Employment!]! @relationship(type: "WORKS_FOR", direction: OUT)
}

type Employment @relationshipProperties {
  startDate: Date!
  title: String!
  company: Company! @target
}

type Company @node {
  id: ID! @id
  name: String!
}
```

---

**End of Neo4j Agent Instructions**

*When generating or reviewing Neo4j code, always refer to these guidelines. Prioritize security (parameterized queries), performance (indexes, batching), and idiomatic patterns (descriptive labels, meaningful relationships).*
