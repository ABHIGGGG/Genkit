# Genkit – AI-Powered Site & App Generation Platform

<div align="center">
  <h3>Build production-ready websites with Genkit</h3>
  <p>Generate complete apps and websites using natural language</p>
</div>

## Overview

Genkit is an AI-powered code generation platform that converts natural language prompts into fully functional, production-ready Next.js applications. Describe what you want to build, and Genkit’s AI agent generates the complete codebase with live preview support.

## ✨ Key Features

* **AI-Driven Code Generation**: Natural language to production-ready code using OpenAI GPT-4
* **Live Preview**: Instantly preview generated apps inside secure E2B sandboxes
* **Pre-Built Templates**: Ready-to-use templates including Netflix, YouTube, Airbnb, and Spotify clones
* **Code Explorer**: Inspect and navigate generated source code with syntax highlighting
* **Project Management**: Save, manage, and iterate on generated projects
* **Authentication**: Integrated user authentication via Clerk
* **Usage Tracking**: Credit-based usage system with free and paid tiers

## 🚀 Tech Stack

**Frontend**: Next.js 15, TypeScript, Tailwind CSS, Shadcn/UI, React Query
**Backend**: tRPC, PostgreSQL, Prisma ORM, Clerk Auth
**AI & Jobs**: OpenAI GPT-4, Inngest, E2B Sandboxes

## 📋 Prerequisites

* Node.js 18+ and npm
* PostgreSQL database
* OpenAI API key
* E2B API key
* Clerk authentication setup
* Inngest account

## 🛠️ Installation

1. **Clone the repository**

```bash
git clone https://github.com/your-username/genkit.git
cd genkit
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

```bash
cp .env.example .env.local
```

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/genkit"

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# AI
OPENAI_API_KEY=your_openai_api_key

# E2B
E2B_API_KEY=your_e2b_api_key

# Inngest
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key
```

4. **Set up the database**

```bash
npx prisma generate
npx prisma migrate deploy
```

5. **(Optional) Seed the database**

```bash
npm run db:seed
```

## 🔥 Development

### Start the development server

```bash
npm run dev
```

### Run background jobs

```bash
npx inngest-cli@latest dev
```

### Database Utilities

Apply schema changes:

```bash
npx prisma migrate dev
```

Open Prisma Studio:

```bash
npx prisma studio
```

Reset database (⚠️ deletes all data):

```bash
npx prisma migrate reset
```

## 📁 Project Structure

```
genkit/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # Reusable UI components
│   ├── modules/          # Feature modules
│   ├── lib/              # Shared utilities
│   ├── hooks/            # Custom hooks
│   ├── inngest/          # Background jobs
│   └── trpc/             # tRPC setup
├── prisma/               # Database schema & migrations
├── public/               # Static assets
└── sandbox-templates/    # E2B sandbox configs
```

## 🎯 Usage

### Creating a Project

1. Sign in to Genkit
2. Describe your application in the input field
3. Select a template or provide a custom prompt
4. Generate the application
5. Preview it in the live sandbox
6. Explore and review the generated code

### Example Prompts

* “Build a modern todo app with drag-and-drop support”
* “Create a social media dashboard with analytics”
* “Build a restaurant website with online ordering”
* “Create a fitness tracker with progress charts”

## 💳 Usage & Billing

* **Free Tier**: 2 credits per month
* **Pro Tier**: 100 credits per month with priority generation

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm run build
vercel --prod
```

Configure environment variables and database connections via the Vercel dashboard and set up Inngest webhooks.

### Docker

```bash
docker build -t genkit .
docker run -p 3000:3000 genkit
```

## 🐛 Troubleshooting

**Database Issues**

* Confirm `DATABASE_URL` is correct
* Ensure PostgreSQL is running

**AI Generation Errors**

* Validate OpenAI API key
* Check API usage limits

**Sandbox Problems**

* Verify E2B API key
* Review sandbox quota limits
