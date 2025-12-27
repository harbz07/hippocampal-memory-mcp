# Hippocampal Memory MCP Server - Quick Start Checklist

## Daily Startup (Before Using Claude Desktop)

- [ ] **Start Neo4j Desktop**
  - Open Neo4j Desktop app
  - Ensure your database is running (green play button)

- [ ] **Start ngrok tunnel**
  ```powershell
  ngrok tcp 7687
  ```
  - Copy the tunnel URL (e.g., `tcp://2.tcp.us-cal-1.ngrok.io:12841`)

- [ ] **Update ngrok URL if it changed**
  - Open: `C:\Users\harve\AppData\Roaming\Claude\claude_desktop_config.json`
  - Update line 7: `"NEO4J_URI": "bolt://YOUR_NEW_NGROK_URL"`
  - Save the file

- [ ] **Open Claude Desktop**
  - MCP server will connect automatically
  - Check for 5 hippocampal memory tools

## Verifying Connection

Run this test to verify everything works:
```powershell
cd c:\Users\harve\Neo4j
node test-tunnel.mjs
```

Should see: `✅ Tunnel connection successful!`

## Adding New Tools

When you want to add or modify tools:

1. **Edit the server file**
   - Open: `c:\Users\harve\Neo4j\hippocampal-mcp-server.mjs`
   - Add tool definition (~line 75-200)
   - Add tool handler (~line 300+)

2. **Restart Claude Desktop**
   - Close and reopen
   - New tools will be available immediately

3. **Test the new tool**
   - Ask Claude Desktop to use your new tool
   - Check logs if issues: `C:\Users\harve\AppData\Roaming\Claude\logs\mcp-server-hippocampal-memory.log`

## Troubleshooting

**MCP Server Disconnected:**
- Check Neo4j Desktop is running
- Check ngrok tunnel is active
- Verify ngrok URL in `claude_desktop_config.json` matches current tunnel
- Check logs: `C:\Users\harve\AppData\Roaming\Claude\logs\mcp-server-hippocampal-memory.log`

**Tools Not Appearing:**
- Restart Claude Desktop
- Check MCP server logs for errors

**Connection Timeouts:**
- Verify ngrok tunnel URL hasn't changed
- Test connection with `node test-tunnel.mjs`

## Key Files Reference

- **MCP Server:** `c:\Users\harve\Neo4j\hippocampal-mcp-server.mjs`
- **Claude Config:** `C:\Users\harve\AppData\Roaming\Claude\claude_desktop_config.json`
- **Test Script:** `c:\Users\harve\Neo4j\test-tunnel.mjs`
- **Logs:** `C:\Users\harve\AppData\Roaming\Claude\logs\mcp-server-hippocampal-memory.log`

## Available Tools

1. **encode_memory** - Store experiences with semantic embeddings
2. **recall_memory** - Search memories semantically
3. **mutate_graph** - Create nodes and relationships
4. **evolve_bond** - Update relationship strengths
5. **query_graph** - Run custom Cypher queries

## Important Notes

- ngrok URL changes every restart (unless using paid static URL)
- Neo4j Desktop must be running before Claude Desktop
- Config changes require Claude Desktop restart
- Credentials are in `claude_desktop_config.json` env section
