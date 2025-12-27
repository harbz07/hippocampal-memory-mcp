# How to Deploy Your MCP Server (Simple Version)

## What You Need First

**IMPORTANT**: You need a **cloud Neo4j database** for this to work remotely. Your local Neo4j Desktop won't be accessible from the internet.

### Option 1: Neo4j Aura (Easiest)
1. Go to https://console.neo4j.io
2. Create a free account
3. Create a new database (Free tier is fine)
4. **Save the credentials** - you'll need:
   - Connection URI (looks like `neo4j+s://xxxxx.databases.neo4j.io`)
   - Username (usually `neo4j`)
   - Password (generate a new one)
5. Run the setup script with your NEW Aura credentials

## Step-by-Step Deployment

### Step 1: Initialize Git (if not already done)

```bash
git init
git add .
git commit -m "Initial commit"
```

### Step 2: Push to GitHub

1. Go to https://github.com/new
2. Create a new repository (e.g., "hippocampal-memory-mcp")
3. **DON'T** initialize with README (you already have one)
4. Copy the commands GitHub shows you:

```bash
git remote add origin https://github.com/YOUR_USERNAME/hippocampal-memory-mcp.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy to Render

1. Go to https://render.com and sign up (it's free)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account
4. Select your `hippocampal-memory-mcp` repository
5. Fill in:
   - **Name**: `hippocampal-memory-mcp` (or whatever you want)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run start:remote`
   - **Plan**: Free
6. Click **"Advanced"** and add environment variables:
   - `NEO4J_URI` = your Aura URI (e.g., `neo4j+s://xxxxx.databases.neo4j.io`)
   - `NEO4J_USER` = `neo4j`
   - `NEO4J_PASSWORD` = your Aura password
   - `OPENAI_API_KEY` = your OpenAI API key
7. Click **"Create Web Service"**
8. Wait 5-10 minutes for deployment

### Step 4: Connect to Claude.ai

1. Go to https://claude.ai
2. Click Settings (gear icon) → **Connectors**
3. Click **"Add Custom Connector"**
4. Enter your Render URL:
   ```
   https://YOUR-APP-NAME.onrender.com/sse
   ```
5. Give it a name like "My Memory Server"
6. Save and test!

## Troubleshooting

**"Service Unavailable" error?**
- Check that your Neo4j Aura database is running (not paused)
- Verify environment variables are set correctly in Render

**Render shows errors?**
- Check the logs in Render dashboard
- Make sure you set ALL environment variables

**Can't connect in Claude?**
- Make sure you're on a paid Claude plan (Pro/Max/Team/Enterprise)
- Check the URL ends with `/sse`
- Wait a few minutes - Render free tier can be slow to start

## Cost Breakdown

- **Neo4j Aura Free**: $0 (limited to 200k nodes)
- **Render Free**: $0 (sleeps after 15 min inactivity, 750 hours/month)
- **OpenAI API**: ~$0.0001 per embedding (very cheap)

Total: **FREE** for light usage!
