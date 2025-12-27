import 'dotenv/config';
import neo4j from 'neo4j-driver';

const { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD } = process.env;

if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) {
  console.error('❌ Missing Neo4j environment variables');
  process.exit(1);
}

async function setupVectorIndex() {
  const driver = neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
  );

  const session = driver.session();

  try {
    console.log('🧠 Setting up Neo4j vector index for hippocampal memory...\n');

    // Create vector index for Event embeddings
    console.log('📊 Creating vector index on Event.embedding...');
    await session.run(`
      CREATE VECTOR INDEX event_embeddings IF NOT EXISTS
      FOR (e:Event)
      ON e.embedding
      OPTIONS {
        indexConfig: {
          \`vector.dimensions\`: 1536,
          \`vector.similarity_function\`: 'cosine'
        }
      }
    `);
    console.log('✅ Vector index created');

    // Verify constraints from claude-memory.cypher exist
    console.log('\n🔍 Verifying node constraints...');
    
    const constraints = [
      'CREATE CONSTRAINT person_id IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE',
      'CREATE CONSTRAINT project_id IF NOT EXISTS FOR (p:Project) REQUIRE p.id IS UNIQUE',
      'CREATE CONSTRAINT concept_id IF NOT EXISTS FOR (c:Concept) REQUIRE c.id IS UNIQUE',
      'CREATE CONSTRAINT event_id IF NOT EXISTS FOR (e:Event) REQUIRE e.id IS UNIQUE'
    ];

    for (const constraint of constraints) {
      await session.run(constraint);
      console.log(`✅ ${constraint.match(/CONSTRAINT (\w+)/)[1]}`);
    }

    // Show index status
    console.log('\n📋 Current indexes:');
    const result = await session.run('SHOW INDEXES');
    result.records.forEach(record => {
      const name = record.get('name');
      const type = record.get('type');
      const state = record.get('state');
      console.log(`  - ${name} [${type}] (${state})`);
    });

    console.log('\n✨ Schema setup complete! Ready for hippocampal consolidation.\n');

  } catch (error) {
    console.error('❌ Error setting up schema:', error.message);
    throw error;
  } finally {
    await session.close();
    await driver.close();
  }
}

setupVectorIndex().catch(console.error);
