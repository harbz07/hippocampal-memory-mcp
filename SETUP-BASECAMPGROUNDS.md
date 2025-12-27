# Quick Setup for basecampgrounds.com

## Once cloudflared finishes installing...

Open a **NEW PowerShell window** (so it picks up cloudflared in PATH) and run these exact commands:

### Step 1: Login to Cloudflare
```powershell
cloudflared tunnel login
```
This opens your browser - authorize it with your Cloudflare account (basecampgrounds.com).

### Step 2: Create the tunnel
```powershell
cloudflared tunnel create neo4j-memory
```
Copy the **Tunnel ID** it gives you (looks like: `12345678-abcd-efgh-ijkl-mnopqrstuvwx`)

### Step 3: Create config file

Create this file: `C:\Users\harve\.cloudflared\config.yml`

```yaml
tunnel: YOUR_TUNNEL_ID_FROM_STEP_2
credentials-file: C:\Users\harve\.cloudflared\YOUR_TUNNEL_ID_FROM_STEP_2.json

ingress:
  - hostname: neo4j.basecampgrounds.com
    service: tcp://localhost:7687
  - service: http_status:404
```

**Replace `YOUR_TUNNEL_ID_FROM_STEP_2`** with the actual tunnel ID from step 2!

### Step 4: Route DNS
```powershell
cloudflared tunnel route dns neo4j-memory neo4j.basecampgrounds.com
```

This creates a DNS CNAME record automatically.

### Step 5: Start the tunnel
```powershell
cloudflared tunnel run neo4j-memory
```

**Keep this window open!** Your Neo4j is now accessible at `neo4j.basecampgrounds.com:7687`

### Step 6: Test it works

Open another PowerShell and update your `.env`:

```
NEO4J_URI=neo4j://neo4j.basecampgrounds.com:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=Fatboy$muckers1
OPENAI_API_KEY=sk-proj-...
```

Then test:
```powershell
node test-connection.mjs
```

Should see "✅ Connection successful!"

## Install as Windows Service (so it runs automatically)

Once you confirm it works:

```powershell
cloudflared service install
```

Then start it:
```powershell
sc start cloudflared
```

Now the tunnel runs automatically when Windows starts!

## Next: Deploy to Render

Now you can deploy your MCP server to Render with these environment variables:
- `NEO4J_URI`: `neo4j://neo4j.basecampgrounds.com:7687`
- `NEO4J_USER`: `neo4j`
- `NEO4J_PASSWORD`: `Fatboy$muckers1`
- `OPENAI_API_KEY`: `sk-proj-...`

Your computer needs to be running for this to work, but the tunnel stays connected automatically!
