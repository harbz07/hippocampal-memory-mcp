#!/usr/bin/env node

import 'dotenv/config';
import neo4j from 'neo4j-driver';

const { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD } = process.env;

console.log('Testing Neo4j connection...');
console.log('URI:', NEO4J_URI);
console.log('User:', NEO4J_USER);

const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));

try {
  await driver.verifyConnectivity();
  console.log('✅ Connection successful!');

  const session = driver.session();
  const result = await session.run('RETURN "Hello Neo4j!" AS message');
  console.log('✅ Query test:', result.records[0].get('message'));
  await session.close();

} catch (error) {
  console.error('❌ Connection failed:', error.message);
  console.error('Full error:', error);
} finally {
  await driver.close();
}
