# Hippocampus Module Tools Deployment

## Status
✅ **Schema deployed and working**
✅ **Extension code written** (`hippocampus-extension.mjs`)
⏳ **Integration pending** (requires Claude Desktop restart)

## What Got Built

Three new high-level tools that match the biomimetic schema:

1. **hippocampus_write_event** - Create Event with Who/Why/What/Where/Effects blocks
2. **hippocampus_write_reflection** - Agent-relative memory slice
3. **hippocampus_search_events** - Pattern completion retrieval

## Integration Steps

### 1. Modify `hippocampal-mcp-server.mjs`

Add import at top of file:
```javascript
import { hippocampusTools, handleWriteEvent, handleWriteReflection, handleSearchEvents } from './hippocampus-extension.mjs';
```

### 2. Update tool list in `ListToolsRequestSchema` handler

Find this section (around line 85):
```javascript
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'encode_memory',
        // ...
      },
      // ... other tools
    ],
  };
});
```

Add the new tools to the array:
```javascript
return {
  tools: [
    ...hippocampusTools,  // ADD THIS LINE
    {
      name: 'encode_memory',
      // ... existing tools follow
    },
  ],
};
```

### 3. Add tool handlers in `CallToolRequestSchema`

Find this section (around line 450):
```javascript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const startTime = Date.now();

  try {
    switch (request.params.name) {
      case 'encode_memory':
        return await handleEncodeMemory(request.params.arguments, startTime);
      
      // ... other cases
    }
  }
});
```

Add new cases BEFORE the default case:
```javascript
switch (request.params.name) {
  case 'hippocampus_write_event':
    return await handleWriteEvent(request.params.arguments, startTime, driver);
  
  case 'hippocampus_write_reflection':
    return await handleWriteReflection(request.params.arguments, startTime, driver);
  
  case 'hippocampus_search_events':
    return await handleSearchEvents(request.params.arguments, startTime, driver, openai);
  
  case 'encode_memory':
    // ... existing cases follow
}
```

### 4. Restart Claude Desktop

The MCP server only loads on Claude Desktop startup, so you need to:
1. Quit Claude Desktop completely
2. Relaunch
3. New tools will be available

## Workaround: Use Now Without Restart

You can use `hippocampal-memory:mutate_graph` to write events manually:

```javascript
hippocampal-memory:mutate_graph({
  cypher: `
    WITH "event-id" AS eventId, "2025-12-27T07:00:00Z" AS happenedAt
    CREATE (e:Event {
      id: eventId,
      happened_at: datetime(happenedAt),
      title: "Event Title",
      description: "Event description"
    })
    // Add WHO/WHY/WHAT/WHERE/EFFECTS blocks
    // See examples in deployed test events
  `
})
```

## Verification

After integration, test with:
```javascript
hippocampal-memory:hippocampus_search_events({
  participants: ["Harvey"],
  limit: 5
})
```

Should return the two test events we created today:
1. "Hippocampus Schema Deployment"
2. "Hippocampus Schema Development"

## Schema Files

- **Schema definition:** Deployed via Cypher (see transcript)
- **Extension code:** `C:\Users\harve\Neo4j\hippocampus-extension.mjs`
- **Main server:** `C:\Users\harve\Neo4j\hippocampal-mcp-server.mjs`
- **Deployment guide:** This file

## Next: Populate Memories

Once tools are integrated (or using `mutate_graph` workaround), start encoding recent conversation history:
- Dec 6: Søren voice coaching
- Dec 6: Memory systems discussion
- Dec 5: Corpus verification
- Dec 5: AO framework implementation
- Today: Schema deployment

