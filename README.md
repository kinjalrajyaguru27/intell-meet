# Intell-Meet-Link: Complete Enterprise Meeting & Collaboration Hub

Intell-Meet-Link is an enterprise-grade full-stack meeting, chat, project management, and AI analytics platform. It integrates video conferencing (WebRTC signaling), collaborative workspace document editing (with notes checkpoint rollback), real-time channel chats (similar to Slack/Teams), Kanban task boards, calendar and Gantt charting, and automated AI summary post-meeting analytics.

---

## 🚀 Tech Stack

- **Monorepo**: PNPM Workspaces, Node.js 24+, TypeScript 5.9
- **Frontend**: React 19, Vite, Tailwind CSS, Lucide icons, Recharts, Wouter routing, TanStack Query (v5)
- **Backend**: Express 5, Node HTTP Server, CORS, Cookie Parser, Pino logging
- **Real-Time Layer**: Socket.io (online presence, direct messages, typing indicators, read receipts, signaling)
- **Database**: MongoDB (Mongoose ODM)
- **AI Engine**: Mocked advanced speech analysis models for action-items, transcripts, summaries, and forecasts.

---

## 📁 Repository Structure

```
├── api/                     # Vercel Serverless Function entry point
├── artifacts/
│   ├── api-server/          # Express backend application
│   │   ├── src/             # API routes, middlewares, signaling (Socket.io)
│   │   └── build.mjs        # Production ESBuild compiler
│   └── meet/                # React Vite client application
├── lib/
│   ├── api-client-react/    # Generated react hooks using Orval
│   ├── api-spec/            # OpenAPI specification (openapi.yaml)
│   ├── api-zod/             # Zod validation schemas
│   └── db/                  # Shared database module (Mongoose Models & connectDB)
├── scratch/                 # E2E runtime testing and audit scripts
├── package.json             # Root Workspace package manager configurations
├── pnpm-workspace.yaml      # Monorepo workspaces definition
└── vercel.json              # Vercel deployment route rewrites
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
# Node environment
NODE_ENV=production

# Server configuration
PORT=5000

# Security (secrets)
JWT_SECRET=your_jwt_signing_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_token_secret_here

# Database Configuration (MongoDB URI)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/intell_meet

# Google OAuth 2.0 Client IDs
GOOGLE_CLIENT_ID=your_google_oauth_client_id_backend.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id_frontend.apps.googleusercontent.com

# OpenAI API Key for meeting transcripts processing and AI Summaries
OPENAI_API_KEY=your_openai_api_key_here

# (Optional) CORS production origins
CORS_ORIGIN=https://your-production-app.vercel.app
```

---

## 📦 GitHub Repository Setup & Push Commands

To initialize the repository locally and push to your remote GitHub repository:

```bash
git init
git add .
git commit -m "Production Ready"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

---

---

## 🛠️ Commands Reference

### Development Mode
Runs both the API server (port 5000) and frontend client (port 8080) concurrently:
```bash
npx pnpm dev
```

### Typecheck Verification
Performs compilation audits across all workspaces:
```bash
npx pnpm run typecheck
```

### Production Build
Typechecks the workspace and builds all production dist targets:
```bash
npx pnpm run build
```

---

## 🚀 Deployment Instructions

### Option 1: Vercel Deployment (Serverless)

Vercel supports deploying mono-repos directly. 

1. **Import the Project** in Vercel.
2. Configure **Environment Variables** in Vercel settings matching `.env.example`.
3. Set the following Build settings in Vercel:
   - **Framework Preset**: Vite / Other (or leave as Default)
   - **Build Command**: `pnpm build`
   - **Output Directory**: `artifacts/meet/dist/public`
   - **Root Directory**: `.`
4. Deploy. Vercel will compile the React app, serve it statically, and map `/api/*` to the Node.js serverless function defined in `api/index.ts`.

> [!WARNING]
> **Serverless Limitation**: Vercel Serverless Functions do not support persistent WebSockets (Socket.io WebRTC signaling and real-time typing indicators). While Socket.io will fall back to long-polling, connection states are stateless. If WebSockets are business-critical, deploy the API server on a persistent hosting platform (Option 2).

### Option 2: Persistent Server Deployment (Recommended)

For WebRTC signaling and persistent Socket.io connections, deploy the application to a cloud virtual machine (e.g., AWS EC2, DigitalOcean, Heroku, or Render):

1. **Build the packages**:
   ```bash
   npx pnpm build
   ```
2. **Start the API Server** in production:
   ```bash
   cd artifacts/api-server
   NODE_ENV=production MONGODB_URI=mongodb://... PORT=5000 npm run start
   ```
3. **Serve the frontend**: The backend automatically serves the compiled frontend assets from `artifacts/meet/dist/public` if they are present. Alternatively, reverse-proxy paths through Nginx.
