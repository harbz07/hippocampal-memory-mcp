import 'dotenv/config';
import neo4j from 'neo4j-driver';

const { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD } = process.env;

if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) {
  console.error('Missing environment variables. Ensure .env contains NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD');
  process.exit(1);
}

async function setupSchema() {
  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
  const session = driver.session();

  try {
    console.log('Setting up Neo4j constraints and indexes...\n');

    // Create constraints for uniqueness
    const constraints = [
      'CREATE CONSTRAINT person_id IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE',
      'CREATE CONSTRAINT project_id IF NOT EXISTS FOR (p:Project) REQUIRE p.id IS UNIQUE',
      'CREATE CONSTRAINT concept_id IF NOT EXISTS FOR (c:Concept) REQUIRE c.id IS UNIQUE',
      'CREATE CONSTRAINT event_id IF NOT EXISTS FOR (e:Event) REQUIRE e.id IS UNIQUE'
    ];

    for (const constraint of constraints) {
      console.log(`Executing: ${constraint}`);
      await session.run(constraint);
      console.log('✓ Success\n');
    }

    // Optional: Create indexes for common queries
    const indexes = [
      'CREATE INDEX person_name IF NOT EXISTS FOR (p:Person) ON (p.name)',
      'CREATE INDEX project_status IF NOT EXISTS FOR (p:Project) ON (p.status)',
      'CREATE INDEX event_timestamp IF NOT EXISTS FOR (e:Event) ON (e.timestamp)',
      'CREATE INDEX event_type IF NOT EXISTS FOR (e:Event) ON (e.type)'
    ];

    for (const index of indexes) {
      console.log(`Executing: ${index}`);
      await session.run(index);
      console.log('✓ Success\n');
    }

    console.log('✅ Schema setup complete!');
  } catch (error) {
    console.error('❌ Error setting up schema:', error);
    throw error;
  } finally {
    await session.close();
    await driver.close();
  }
}

setupSchema().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
