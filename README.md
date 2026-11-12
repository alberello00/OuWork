# OuWork

Boards for teams that think together: notes, links and images on shared canvases, organised in **workspaces** and **boards**, with links between items, private content enforced by the database, and (in progress) activity history, version history and an AI assistant on three levels: note, board, workspace.

OuWork started as a copy of OurWorld, a personal project, and is now a separate product. A full README with screenshots and an architecture section arrives with phase W7.

## Run it locally

Requirements: Node 22, pnpm, Docker, the Supabase CLI.

```bash
pnpm install
supabase start -x logflare,vector,edge-runtime,imgproxy,supavisor,studio,mailpit
supabase db reset                 # migrations + demo data
cp .env.example .env.local        # then fill the keys from `supabase status -o env`
pnpm dev
```

Demo users (password `ouwork-dev`): `maya`, `jonas`, `priya`, `tom`, `elena` share the workspace "Product Launch"; `sam` is only in "Website Redesign".

## Checks

```bash
pnpm lint && pnpm typecheck && pnpm test && supabase test db
```

## Documentation

Project documentation is in Italian under `docs/`: requirements and plan in `docs/requisiti-ouwork.md`, current status in `docs/stato.md`, decisions in `docs/decisioni.md`.
