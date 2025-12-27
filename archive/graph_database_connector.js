import neo4j from "neo4j-driver"; # Connect to Neo4j database

const driver = neo4j.driver(
    "neo4j+s://e3ef3e92.databases.neo4j.io",
    neo4j.auth.basic("neo4j", "neo4jpass")
);