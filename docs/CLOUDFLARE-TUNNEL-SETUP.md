# Cloudflare Tunnel Setup for Neo4j

## Once cloudflared is installed (waiting for winget to finish...)

### Step 1: Authenticate with Cloudflare

Open a new PowerShell/CMD window and run:

```bash
cloudflared tunnel login
```

This will open your browser to log into Cloudflare. Authorize it.

### Step 2: Create a Tunnel

```bash
cloudflared tunnel create neo4j-memory
```

This creates a tunnel named "neo4j-memory". It will give you a **Tunnel ID** - save this!

### Step 3: Create Config File

Create a file at `C:\Users\harve\.cloudflared\config.yml`:

```yaml
tunnel: <YOUR_TUNNEL_ID_FROM_STEP_2>
credentials-file: C:\Users\harve\.cloudflared\<YOUR_TUNNEL_ID>.json

ingress:
  - hostname: neo4j.your-domain.com
    service: tcp://localhost:7687
  - service: http_status:404
```

**Replace**:
- `<YOUR_TUNNEL_ID_FROM_STEP_2>` with the tunnel ID from step 2
- `neo4j.your-domain.com` with a subdomain on your Cloudflare domain

### Step 4: Route DNS

```bash
cloudflared tunnel route dns neo4j-memory neo4j.your-domain.com
```

This creates a DNS record pointing `neo4j.your-domain.com` to your tunnel.

### Step 5: Start the Tunnel

```bash
cloudflared tunnel run neo4j-memory
```

Leave this running! Your Neo4j is now accessible at `neo4j.your-domain.com:7687`

### Step 6: Update Your .env for Remote

For deploying to Render, update the environment variables:

```
NEO4J_URI=neo4j://neo4j.your-domain.com:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=Fatboy$muckers1
OPENAI_API_KEY=sk-proj-...
```

## To run tunnel as a background service (optional)

```bash
cloudflared service install
```

Then start it:
```bash
net start cloudflared
```

Now it runs automatically when Windows starts!
