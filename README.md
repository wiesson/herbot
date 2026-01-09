# Norbot

AI-powered task management from Slack. Mention @Norbot in any channel to automatically extract tasks, prioritize them, and add them to your Kanban board.

**Live at [norbot.vercel.app](https://norbot.vercel.app)**

## Features

- **Slack Bot**: @mention Norbot to create tasks, update status, assign, and summarize
- **Projects**: Organize tasks with short codes (TM-123), keywords for auto-detection
- **Channel Mappings**: Link Slack channels to GitHub repos and projects
- **AI Task Extraction**: Extracts title, priority, type, and asks clarifying questions
- **GitHub Integration**: Create issues with @claude mention, link repos to projects
- **Kanban Dashboard**: Visual task board organized by status
- **Team Management**: Invite members, assign roles (admin/member/viewer)
- **Thread Context**: Bot understands full thread history when mentioned in replies
- **File Attachments**: Screenshots and files from Slack attached to tasks
- **AI Usage Limits**: Per-workspace monthly limits

## How It Works

### Current

```
┌─────────────────────────────────────────────────────────────┐
│ 1. AGENTIC INTAKE                                           │
│    User: "@norbot there's a bug"                            │
│    Bot: "What's happening? Screenshot?"                     │
│    User: [image] [more text]                                │
│    Bot: "Got it. Which project?" → collects into structure  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. TASK CREATED                                             │
│    Structured: title, description, images, code context     │
│    Assigned to project, tagged, prioritized                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. GITHUB ISSUE (optional)                                  │
│    Creates GitHub issue with full context                   │
│    Includes @claude mention for AI coding agents            │
└─────────────────────────────────────────────────────────────┘
```

### Coming Soon

```
┌─────────────────────────────────────────────────────────────┐
│ 4. TRIGGER AI CODER                                         │
│    Automatically triggers Claude Code / Cursor / etc.       │
│    AI starts working on the fix                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. VERIFICATION / HANDOVER                                  │
│    AI verifies: "I can reproduce this"                      │
│    AI prepares: "Here's what I found, files involved"       │
│    Best case: "Here's the fix"                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. PR                                                       │
│    Vercel/Netlify: just merge and done                      │
│    Complex: handover to human with full context             │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Frontend**: Next.js 16, React 19, shadcn/ui (base-ui)
- **Backend**: Convex (real-time database + serverless functions)
- **AI**: Claude via Convex Agents (@convex-dev/agent)
- **Auth**: GitHub OAuth

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up Convex

```bash
pnpm convex dev
```

This will:

- Create a new Convex project (or connect to existing)
- Generate `convex/_generated/` files
- Give you your deployment URL (e.g., `https://helpful-horse-123.convex.site`)

### 3. Create Slack App (one-click via manifest)

1. Open `slack-app-manifest.yaml`
2. Replace `YOUR_CONVEX_URL` with your Convex deployment name (e.g., `helpful-horse-123`)
3. Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From a manifest**
4. Select your workspace, paste the YAML, create the app
5. Click **Install to Workspace**

### 4. Configure environment variables

In the [Convex Dashboard](https://dashboard.convex.dev), add these environment variables:

| Variable               | Where to find it                                        |
| ---------------------- | ------------------------------------------------------- |
| `SLACK_CLIENT_ID`      | Slack App → Basic Information → App Credentials         |
| `SLACK_CLIENT_SECRET`  | Slack App → Basic Information → App Credentials         |
| `SLACK_SIGNING_SECRET` | Slack App → Basic Information → App Credentials         |
| `ANTHROPIC_API_KEY`    | [console.anthropic.com](https://console.anthropic.com/) |

Also add to `.env.local`:

```env
NEXT_PUBLIC_CONVEX_URL=https://YOUR_DEPLOYMENT.convex.cloud
NEXT_PUBLIC_APP_URL=http://localhost:3000

# GitHub OAuth (create at github.com/settings/developers)
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

### 5. Run the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

1. **Login** with GitHub
2. **Create workspace** or accept an invite
3. **Setup wizard**: Connect Slack app, link GitHub repos, map channels
4. **Configure**: Set up projects with short codes and keywords
5. **Use Norbot** in Slack:
   - `@Norbot The login button is broken on mobile` → creates task
   - `@Norbot summarize` → shows task overview
   - `@Norbot mark TM-123 as done` → updates status
   - `@Norbot assign TM-123 to @user` → assigns task
   - `@Norbot send TM-123 to github` → creates GitHub issue

## Project Structure

```
├── src/
│   ├── app/                    # Next.js pages
│   │   ├── w/[slug]/          # Workspace dashboard + settings
│   │   ├── invite/[token]/    # Invitation acceptance
│   │   └── login/             # GitHub OAuth
│   ├── components/
│   │   ├── kanban/            # Kanban board
│   │   └── ui/                # UI components
│   └── hooks/                 # React hooks
├── convex/
│   ├── agents/                # Norbot agent + tools
│   │   ├── taskExtractor.ts   # Agent definition
│   │   └── tools.ts           # Agent capabilities
│   ├── schema.ts              # Database schema
│   ├── slack.ts               # Slack event handlers
│   ├── projects.ts            # Projects management
│   ├── channelMappings.ts     # Channel-repo-project links
│   ├── github.ts              # GitHub integration
│   └── http.ts                # Webhook endpoints
└── slack-app-manifest.yaml    # Slack app setup
```

## License

MIT
