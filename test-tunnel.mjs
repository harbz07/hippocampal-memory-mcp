#!/usr/bin/env node

import neo4j from 'neo4j-driver';

const NEO4J_URI = 'bolt://2.tcp.us-cal-1.ngrok.io:12841';
const NEO4J_USER = 'neo4j';
const NEO4J_PASSWORD = 'Fatboy$muckers1';

console.log('Testing Neo4j tunnel connection...');
console.log('URI:', NEO4J_URI);
console.log('User:', NEO4J_USER);

const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));

try {
  await driver.verifyConnectivity();
  console.log('✅ Tunnel connection successful!');

  const session = driver.session();
  const result = await session.run('RETURN "Hello from the tunnel!" AS message');
  console.log('✅ Query test:', result.records[0].get('message'));
  await session.close();

  console.log('\n🎉 Your tunnel is working! Neo4j at neo4j.basecampgrounds.com is accessible!');
} catch (error) {
  console.error('❌ Connection failed:', error.message);
  console.error('Full error:', error);
} finally {
  await driver.close();
}
