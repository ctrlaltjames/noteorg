# Implementation Plan â€” Notes + Artifact Organizer

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| UI Framework | Preact | Lightweight, component-based |
| Build Tool | Vite | Fast dev server, HMR |
| Markdown Editor | SimpleMDE | Toolbar + live preview + Prism.js |
| Markdown Renderer | marked.js | Client-side markdown to HTML |
| Syntax Highlighting | Prism.js | Code blocks in notes |
| Search | Supabase full-text search | Built-in, free, no extra deps |
| Styling | Tailwind CSS | Fast UI development |
| Auth | Supabase Auth | Email/password + GitHub OAuth |
| Storage | Supabase Postgres | Relational data |
| File Storage | Supabase Storage | Images |

## Project Structure

```
+-- AGENTS.md
+-- notes-artifact-organizer-brainstorm.md
+-- implementation-plan.md
+-- index.html
+-- package.json
+-- vite.config.js
+-- tailwind.config.js
+-- postcss.config.js
+-- src/
|   +-- main.jsx
|   +-- App.jsx
|   +-- styles/
|   |   +-- tailwind.css
|   |   +-- custom.css
|   +-- lib/
|   |   +-- supabase.js
|   +-- context/
|   |   +-- AuthContext.jsx
|   |   +-- AppContext.jsx
|   +-- components/
|       +-- Auth/
|       |   +-- LoginPage.jsx
|       +-- Layout/
|       |   +-- Header.jsx
|       |   +-- AppLayout.jsx
|       |   +-- Sidebar.jsx
|       |   +-- ArtifactList.jsx
|       |   +-- ArtifactCard.jsx
|       +-- Editor/
|       |   +-- ArtifactViewer.jsx
|       +-- Modals/
|           +-- QuickAdd.jsx
|   +-- utils/
|       +-- markdown.js
|       +-- images.js
```

## Data Model

```sql
-- Core table (extensible via metadata JSONB)
create table artifacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  title text not null,
  type text not null check (type in ('note', 'image')),
  content text not null,
  metadata jsonb default '{}',
  folder_id uuid references folders(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Folders (nested)
create table folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  name text not null,
  parent_id uuid references folders(id) on delete cascade,
  created_at timestamptz default now()
);

-- Tags
create table tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  name text not null,
  created_at timestamptz default now()
);

-- Many-to-many: artifact tags
create table artifact_tags (
  artifact_id uuid not null references artifacts(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (artifact_id, tag_id)
);

-- Full-text search index
alter table artifacts add column search_tsvector tsvector
  generated always as (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))) stored;
create index on artifacts using gin(search_tsvector);

-- Row Level Security
alter table artifacts enable row level security;
alter table folders enable row level security;
alter table tags enable row level security;
alter table artifact_tags enable row level security;

create policy "Users see only their own data" on artifacts for all using (auth.uid() = user_id);
create policy "Users see only their own data" on folders for all using (auth.uid() = user_id);
create policy "Users see only their own data" on tags for all using (auth.uid() = user_id);
create policy "Users see only their own data" on artifact_tags for all using auth.uid() in (select user_id from artifacts where artifacts.id = artifact_tags.artifact_id) and auth.uid() in (select user_id from tags where tags.id = artifact_tags.tag_id);
```

## Metadata per Artifact Type

```json
// note
{ "wordCount": 342 }

// image
{ "width": 1920, "height": 1080, "mimeType": "image/png", "storagePath": "images/abc123.png" }
```

Adding a new type (e.g. "link") requires zero schema changes â€” just a new metadata shape and renderer.

## Component Hierarchy

```
App
+-- ThemeProvider (dark/light toggle, localStorage persistence)
+-- AuthProvider
|   +-- LoginPage (email/password + GitHub OAuth)
|   +-- AppLayout
|       +-- Header
|       |   +-- Logo/Title
|       |   +-- ThemeToggle (sun/moon icon)
|       +-- Sidebar
|       |   +-- SearchBar
|       |   +-- QuickAdd button
|       |   +-- TagFilter
|       |   +-- FolderFilter
|       +-- MainArea
|           +-- ArtifactList
|           |   +-- ArtifactCard (note preview / image thumbnail)
|           +-- ArtifactViewer (view: rendered markdown / edit: SimpleMDE)
|           +-- QuickAdd modal
```

## Session & Context Strategy

OpenCode auto-reads `AGENTS.md` on every session start. This file contains the session protocol that tells the agent:
1. How to find the current phase (search for checkpoint files)
2. What to read (planning docs + checkpoint)
3. What to implement (current phase files)
4. When to stop (after each phase, wait for user)

### Your Commands

| Command | What it does |
|---------|-------------|
| `"continue"` | Implement next phase |
| `"continue to phase N"` | Jump to specific phase |
| `"redo phase N"` | Rollback and redo phase N |
| `"skip phase N"` | Mark phase N as complete |

### Core Principle

Each phase is **fully self-contained**. Any phase can be implemented in a fresh session without knowledge of prior phases. Each phase creates all files from scratch.

## Phased Implementation

### Phase 1: Auth + Supabase

**Goal:** Working app with Supabase setup, auth, login page, dark/light theme. Standalone â€” no dependencies.

**Important:** This phase replaces the old 5-phase plan. All old files must be deleted before creating new ones.

**Files to create (13 files):**

| File | Lines | Purpose |
|------|-------|---------|
| `package.json` | 20 | Dependencies: preact, tailwindcss, postcss, autoprefixer, vite, @vitejs/plugin-react, supabase-js, simplemde, marked, prismjs |
| `vite.config.js` | 10 | Vite + Preact plugin |
| `tailwind.config.js` | 25 | Tailwind theme with GitHub dark/light color tokens, content paths |
| `postcss.config.js` | 5 | PostCSS for Tailwind |
| `index.html` | 15 | Entry HTML with theme support |
| `src/main.jsx` | 15 | Preact entry point |
| `src/styles/tailwind.css` | 10 | Tailwind imports + base styles |
| `src/styles/custom.css` | 40 | CSS custom properties for dark/light theme, transitions |
| `src/lib/supabase.js` | 35 | Supabase client + SQL schema (all tables, RLS policies, full-text index) |
| `src/context/AuthContext.jsx` | 60 | Supabase auth: signIn, signUp, signOut, session state |
| `src/context/ThemeContext.jsx` | 30 | Theme provider: dark/light toggle, persists to localStorage |
| `src/components/Auth/LoginPage.jsx` | 60 | Email/password form + GitHub OAuth button |
| `src/components/Layout/Header.jsx` | 40 | Top bar with logo, theme toggle button (subtle sun/moon icon) |
| `src/App.jsx` | 40 | Root: AuthProvider + ThemeProvider, conditionally renders LoginPage or AppLayout |

**Implementation Steps:**

1. Delete all old files from the previous plan:
   - `src/components/ContextMenu.jsx`
   - `src/components/Editor/NoteEditor.jsx`
   - `src/components/Editor/MarkdownPreview.jsx`
   - `src/components/Editor/CodeBlock.jsx`
   - `src/components/Gallery/ImageGallery.jsx`
   - `src/components/Gallery/ImageCard.jsx`
   - `src/components/Layout/Toolbar.jsx`
   - `src/components/Layout/MainArea.jsx`
   - `src/components/Modals/FolderPicker.jsx`
   - `src/components/Modals/ImageViewer.jsx`
   - `src/components/Modals/RenameModal.jsx`
   - `src/components/Modals/SettingsModal.jsx`
   - `src/components/Modals/TagEditor.jsx`
   - `src/components/Search/SearchBar.jsx`
   - `src/components/Search/SearchResults.jsx`
   - `src/components/Sidebar/FolderTree.jsx`
   - `src/components/Sidebar/FolderNode.jsx`
   - `src/components/Sidebar/TagPanel.jsx`
   - `src/context/FileSystemContext.jsx`
   - `src/context/AppStateContext.jsx`
   - `src/utils/autoSave.js`
   - `src/utils/search.js`
   - `src/utils/tags.js`
   - `plans/implementation-plan.md`
   - `plans/notes-artifact-organizer-plan.md`
   - `.opencode/plans/phase-1-checkpoint.md`
   - `.opencode/plans/phase-2-checkpoint.md`
   - `.opencode/plans/phase-3-checkpoint.md`
   - `.opencode/plans/phase-4-checkpoint.md`
   - `.opencode/plans/phase-5-checkpoint.md`
   - `.opencode/plans/phase-6-checkpoint.md`
   - `deploy.sh`
   - `README.md`
2. Remove empty directories left from the old plan:
   - `src/components/Editor`
   - `src/components/Gallery`
   - `src/components/Modals`
   - `src/components/Search`
   - `src/components/Sidebar`
   - `src/context`
   - `src/utils`
3. Create all directories
4. Create `package.json` with dependencies
5. Create `vite.config.js` with Preact plugin
6. Create `tailwind.config.js` with GitHub color tokens:
   - Dark: `#0d1117` (bg), `#161b22` (panels), `#30363d` (borders), `#c9d1d9` (text), `#58a6ff` (accent), `#238636` (primary btn)
   - Light: `#ffffff` (bg), `#f6f8fa` (panels), `#d0d7de` (borders), `#1f2328` (text), `#0969da` (accent), `#1a7f37` (primary btn)
   - Use Tailwind `dark:` variants for theme switching
7. Create `postcss.config.js`
8. Create `index.html` with theme meta tags
9. Create `src/styles/tailwind.css` with `@tailwind` directives
10. Create `src/styles/custom.css` â€” CSS custom properties (`--bg-primary`, `--text-secondary`, etc.) for both themes, smooth `transition` on theme switch
11. Create `src/lib/supabase.js` â€” Supabase client initialization + complete SQL schema (tables, RLS policies, full-text search index)
12. Create `src/context/AuthContext.jsx` â€” Supabase auth context: `signIn`, `signUp`, `signOut`, `session`, `user` state
13. Create `src/context/ThemeContext.jsx` â€” theme provider with `dark`/`light` state, `toggleTheme()` function, persists to `localStorage`
14. Create `src/components/Auth/LoginPage.jsx` â€” email/password form + GitHub OAuth button, styled with theme-aware Tailwind classes
15. Create `src/components/Layout/Header.jsx` â€” top bar with app logo/title on left, theme toggle button (sun/moon icon) on right, minimal/no search yet
16. Create `src/App.jsx` â€” root component wrapping ThemeProvider + AuthProvider, conditionally renders LoginPage or AppLayout (placeholder)
17. Verify: `npm run dev` starts, login page shows, theme toggle switches dark/light, email sign up works, session persists

**Deliverable:** App runs, Supabase connected, auth works, RLS policies protect data, dark/light theme toggle functional.

**Verification:** `npm run dev` -> sign up with email -> logged in -> session persists on refresh -> click theme toggle -> dark/light switches smoothly.

**Git:** `git add . && git commit -m "Phase 1: Auth + Supabase + Theme"`

---

### Phase 2: Core Features + Search

**Goal:** Full CRUD for notes and images, tag/folder organization, search. Standalone â€” includes all Phase 1 files.

**Files to create (23 files):**

| File | Lines | Purpose |
|------|-------|---------|
| *(All Phase 1 files â€” identical content)* | | |
| `src/context/AppContext.jsx` | 120 | Global state: artifacts, tags, folders, selected artifact, search query, filters |
| `src/components/Layout/AppLayout.jsx` | 80 | Sidebar + main area, responsive layout |
| `src/components/Layout/Sidebar.jsx` | 70 | Search bar + QuickAdd button + TagFilter + FolderFilter |
| `src/components/Layout/ArtifactList.jsx` | 100 | Fetch artifacts from Supabase, display list |
| `src/components/Layout/ArtifactCard.jsx` | 50 | Note preview snippet / image thumbnail |
| `src/components/Editor/ArtifactViewer.jsx` | 120 | View mode: rendered markdown + images. Edit mode: SimpleMDE with toolbar |
| `src/components/Modals/QuickAdd.jsx` | 100 | Type selector (note/image), form fields, tag input, save |
| `src/utils/markdown.js` | 30 | Render markdown (marked.js) + Prism.js code highlighting |
| `src/utils/images.js` | 40 | Image compression + Supabase Storage upload |
| `src/styles/custom.css` | 40 | Custom styles: responsive breakpoints, animations |

**Implementation Steps:**

1. Recreate all Phase 1 files (identical content)
2. Create `src/utils/markdown.js` â€” `renderMarkdown()` using marked.js + Prism.js for code blocks
3. Create `src/utils/images.js` â€” `compressImage()` (canvas resize), `uploadImage()` to Supabase Storage
4. Create `src/context/AppContext.jsx` â€” global state: artifacts list, tags, folders, selected artifact, search query, active filters. CRUD functions: `createArtifact`, `updateArtifact`, `deleteArtifact`, `createTag`, `createFolder`, `fetchArtifacts`
5. Create `src/components/Layout/AppLayout.jsx` â€” responsive sidebar + main area layout
6. Create `src/components/Layout/Sidebar.jsx` â€” search bar at top, QuickAdd button, tag filter list, folder filter list
7. Create `src/components/Layout/ArtifactList.jsx` â€” fetch from Supabase with filters (search + tag + folder), display ArtifactCards
8. Create `src/components/Layout/ArtifactCard.jsx` â€” note: title + preview snippet + tags. Image: thumbnail + name + tags
9. Create `src/components/Editor/ArtifactViewer.jsx` â€” view mode: rendered markdown + images. Edit mode: SimpleMDE textarea + toolbar. Image type: preview + rename/delete
10. Create `src/components/Modals/QuickAdd.jsx` â€” modal with type selector (note/image), form fields, tag input, save button
11. Update `src/styles/custom.css` â€” responsive breakpoints, animations, custom scrollbars
12. Update `src/App.jsx` â€” add AppContextProvider, wire up AuthContext + AppContext
13. Verify: create note -> edit with toolbar -> save -> see in list. Create image -> upload -> see thumbnail. Search -> filter by tag -> filter by folder. Responsive on mobile.

**Deliverable:** Full CRUD for notes and images, search, tag/folder filtering, responsive layout, online via GitHub Pages.

**Verification:** `npm run dev` -> login -> create note -> edit with SimpleMDE -> create image -> search -> filter by tag -> filter by folder -> resize to mobile.

**Git:** `git add . && git commit -m "Phase 2: Core Features + Search"`

## Phase Dependency Matrix

```
      | P1 | P2
--------|----|---
Phase 1 | X  |
Phase 2 | X  | X
```

## Overhead

Each phase recreates all prior-phase files. This means:
- Phase 2 writes 25 files (Phase 1-2 combined)
- Extra tokens but cleanest handoff â€” no dependency tracking needed

## File Size Targets

| File Type | Target Size | Max Size |
|-----------|------------|----------|
| Utility files | 30-50 lines | 80 lines |
| Context providers | 60-120 lines | 200 lines |
| Simple components | 50-80 lines | 150 lines |
| Complex components | 80-120 lines | 200 lines |
| Config files | 10-20 lines | 50 lines |

If a file exceeds the max, split it into sub-components.
