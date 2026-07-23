# Notes + Artifact Organizer — Brainstorm

## Core Concept

A personal knowledge base for notes and images. Quick-add anything, name it, organize by tag and/or folder, search across everything. Data stored in Supabase, deployed on GitHub Pages.

## Decisions

| Decision | Choice |
|----------|--------|
| Platform | Web app on GitHub Pages |
| Auth | Supabase (email/password or GitHub OAuth) — only you access your data |
| Storage | Supabase Postgres (data) + Supabase Storage (images) |
| Editor | SimpleMDE — toolbar + live preview + Prism.js code highlighting |
| Mobile | Fully responsive |
| Artifact types | Notes + Images (extensible via JSONB metadata) |
| Framework | Preact + Vite |
| Styling | Tailwind CSS |
| Search | Supabase full-text search (built-in, free) |
| Theme | GitHub-inspired dark/light mode toggle |

## Visual Design

Inspired by GitHub's dark mode — clean, functional, content-focused.

### Dark Mode (default)

| Element | Color |
|---------|-------|
| Page background | `#0d1117` |
| Sidebar / panels | `#161b22` |
| Cards / containers | `#161b22` |
| Borders / dividers | `#30363d` |
| Primary text | `#c9d1d9` |
| Secondary text | `#8b949e` |
| Links / accent | `#58a6ff` |
| Primary button bg | `#238636` (green) |
| Primary button hover | `#2ea043` |
| Danger / delete | `#f85149` |
| Success | `#3fb950` |
| Header / topbar | `#010409` |
| Input bg | `#0d1117` |
| Input border | `#30363d` |
| Scrollbar | `#30363d` |

### Light Mode

| Element | Color |
|---------|-------|
| Page background | `#ffffff` |
| Sidebar / panels | `#f6f8fa` |
| Cards / containers | `#ffffff` |
| Borders / dividers | `#d0d7de` |
| Primary text | `#1f2328` |
| Secondary text | `#656d76` |
| Links / accent | `#0969da` |
| Primary button bg | `#1a7f37` (green) |
| Primary button hover | `#2da44e` |
| Danger / delete | `#cf222e` |
| Success | `#1a7f37` |
| Header / topbar | `#f6f8fa` |
| Input bg | `#ffffff` |
| Input border | `#d0d7de` |
| Scrollbar | `#d0d7de` |

### Layout

```
+---------------------------------------------------------------+
| Header: [Logo]          [Search...]          [Theme toggle]   |
+-------------------+-------------------------------------------+
| Sidebar           |  Main Area                                |
|                   |                                           |
| [Search]          |  Artifact list / viewer                   |
| [Quick Add]       |                                           |
|                   |                                           |
| Folders         + |  +---+  +---+  +---+                     |
|   + Project A   | |  |Card |  |Card |  |Card |              |
|   + Project B   | |  +---+  +---+  +---+                     |
|       - file.md | |                                           |
|       img.png   | |  (or single artifact viewer in edit mode) |
| +---+           | |                                           |
| | + Subfolder   | |                                           |
| +---+           | |                                           |
|                   |                                           |
| Tags            | |                                           |
|   [tag1]        | |                                           |
|   [tag2]        | |                                           |
|   [tag3]        | |                                           |
+-------------------+-------------------------------------------+
```

### Typography

- Font: System font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`)
- Code: `'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace`
- Body: 14px, line-height 1.5
- Heading: 16-24px, line-height 1.25

### UI Principles

- Content-first: maximum space for note content
- Subtle borders over shadows for separation
- Green accent for primary actions (GitHub-style)
- Blue for links and interactive elements
- Smooth transitions between dark/light mode
- Collapsible sidebar on mobile

## What's In Scope

- **Notes** — Markdown content with title, tags, folder
- **Images** — Upload or paste, with name, tags, folder
- **Search** — Full-text search across titles and content
- **Tags** — Create, remove, filter by tag
- **Folders** — Flat or nested folder organization
- **Online access** — Deployed on GitHub Pages, data in Supabase

## What's NOT In Scope (Yet)

- Link artifact type (extensible, not built)
- Collaboration / sharing
- Version history
- AI features
