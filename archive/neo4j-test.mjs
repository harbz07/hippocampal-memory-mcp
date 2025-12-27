import 'dotenv/config';
import neo4j from 'neo4j-driver';

const { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD } = process.env;
if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) {
  console.error('Missing env vars NEO4J_URI, NEO4J_USER or NEO4J_PASSWORD');
  process.exit(1);
}

const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
async function test() {
  const session = driver.session();
  try {
    const result = await session.run('RETURN 1 AS ok');
    console.log('Connected — test query result:', result.records[0].get('ok').toNumber ? result.records[0].get('ok').toNumber() : result.records[0].get('ok'));
  } catch (err) {
    console.error('Connection failed:', err.message || err);
  } finally {
    await session.close();
    await driver.close();
  }
}
test();