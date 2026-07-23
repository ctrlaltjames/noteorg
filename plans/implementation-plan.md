# Implementation Plan — Notes + Artifact Organizer

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| UI Framework | Preact | Lightweight, component-based, fast |
| Build Tool | Vite | Fast dev server, HMR, standard Preact setup |
| Markdown Editor | CodeMirror 6 | Lightweight, great markdown support, extensible |
| Markdown Renderer | marked.js | Client-side markdown to HTML |
| Syntax Highlighting | Prism.js | Code blocks in notes |
| Search Engine | Fuse.js | Client-side fuzzy full-text search |
| Styling | Tailwind CSS | Fast UI development, consistent design |
| File Access | File System Access API | Read/write files user selects |

## Project Structure

```
notes-organizer/
+-- AGENTS.md                    # Auto-read by OpenCode — session protocol
+-- notes-artifact-organizer-plan.md  # Brainstorming plan
+-- implementation-plan.md       # This file
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
|   +-- components/
|   |   +-- Layout/
|   |   |   +-- AppLayout.jsx
|   |   |   +-- Sidebar.jsx
|   |   |   +-- MainArea.jsx
|   |   |   +-- Toolbar.jsx
|   |   +-- Sidebar/
|   |   |   +-- FolderTree.jsx
|   |   |   +-- FolderNode.jsx
|   |   |   +-- TagPanel.jsx
|   |   +-- Editor/
|   |   |   +-- NoteEditor.jsx
|   |   |   +-- MarkdownPreview.jsx
|   |   |   +-- CodeBlock.jsx
|   |   +-- Gallery/
|   |   |   +-- ImageGallery.jsx
|   |   |   +-- ImageCard.jsx
|   |   +-- Search/
|   |   |   +-- SearchBar.jsx
|   |   |   +-- SearchResults.jsx
|   |   +-- Modals/
|   |       +-- FolderPicker.jsx
|   |       +-- TagEditor.jsx
|   |       +-- SettingsModal.jsx
|   |       +-- ImageViewer.jsx
|   +-- utils/
|   |   +-- fileSystem.js
|   |   +-- search.js
|   |   +-- tags.js
|   |   +-- markdown.js
|   |   +-- autoSave.js
|   +-- context/
|       +-- FileSystemContext.jsx
|       +-- AppStateContext.jsx
+-- public/
    +-- favicon.ico
```

## Data Layout (on user's disk)

```
<user-chosen-folder>/
+-- .notes-organizer/
|   +-- config.json          # app settings, open folder path
+-- notes/
|   +-- personal/
|   |   +-- grocery-list.md
|   |   +-- recipe.md
|   +-- work/
|       +-- project-x/
|       |   +-- sandbox-update.md
|       |   +-- meeting-notes.md
|       |   +-- screenshot-1.png
|       +-- project-y/
|           +-- design-spec.md
+-- assets/
    +-- shared-image.png
```

- Notes stored as `.md` files with YAML frontmatter
- Images stored alongside notes or in `assets/`
- App config in `.notes-organizer/config.json`

## Session & Context Strategy

### How It Works

OpenCode auto-reads `AGENTS.md` on every session start. This file contains the session protocol that tells the agent:
1. How to find the current phase (search for checkpoint files)
2. What to read (planning docs + checkpoint)
3. What to implement (current phase files)
4. When to stop (after each phase, wait for user)

### User Workflow

```
You: [new folder, git init, copy plan files + AGENTS.md]
Agent: [auto-reads AGENTS.md] "Project loaded. Ready to start Phase 1?"
You: "continue"
Agent: [implements Phase 1 -> commits -> creates checkpoint -> STOPS]
Agent: "Phase 1 complete. Run npm run dev to verify."
---
You: [new session, type "continue"]
Agent: [auto-reads AGENTS.md -> finds checkpoint -> implements Phase 2]
Agent: [commits -> creates checkpoint -> STOPS]
You: "continue"
...
```

### Your Commands

| Command | What it does |
|---------|-------------|
| `"continue"` | Implement next phase |
| `"continue to phase N"` | Jump to specific phase |
| `"redo phase N"` | Rollback and redo phase N |
| `"skip phase N"` | Mark phase N as complete |

### Core Principle

Each phase is **fully self-contained**. Any phase can be implemented in a fresh session without knowledge of prior phases. Each phase creates all files from scratch.

### Phase Checkpoint Format

After completing each phase, the agent automatically creates `.opencode/plans/phase-N-checkpoint.md`:

```
## Phase N Complete

### Files Created (with line counts)
- src/context/FileSystemContext.jsx (120 lines)
- src/components/Layout/AppLayout.jsx (80 lines)
...

### Files Modified
- src/App.jsx (added FileSystemProvider wrapper)
- src/main.jsx (updated entry point)

### What Works
- [x] User can open a folder via file picker
- [x] File read/write works
- [x] Folder picker modal shows on first launch

### Verification Commands
- npm run dev (should start, show folder picker)
- Pick a folder -> should show empty sidebar + main area

### Git State
- Branch: main
- Commit: <hash> "Phase 1: Foundation"
- Status: clean

### Next Phase: Phase N+1
- No action needed — Phase N+1 is fully self-contained
- It will recreate all files from Phase N plus new ones
```

### Git Workflow

- Each phase commits to `main` branch
- Successful phase = `git add . && git commit -m "Phase N: <name>"`
- Failed phase = `git reset --hard HEAD~1` to rollback, then retry
- Before starting: `git status` should be clean
- Branch strategy: single `main` branch (no feature branches needed)

### File Size Targets

| File Type | Target Size | Max Size |
|-----------|------------|----------|
| Utility files | 50-100 lines | 150 lines |
| Context providers | 100-200 lines | 300 lines |
| Simple components | 50-150 lines | 250 lines |
| Complex components | 150-300 lines | 500 lines |
| Config files | 20-50 lines | 80 lines |

If a file exceeds the max, split it into sub-components.

### Overhead

Each phase recreates all prior-phase files. This means:
- Phase 3 writes 34 files (Phase 1-3 combined)
- Phase 4 writes 42 files (Phase 1-4 combined)
- Extra tokens but cleanest handoff — no dependency tracking needed

## Phased Implementation

### Phase 1: Foundation

**Goal:** Working app shell with folder access. Standalone — no dependencies.

**Files to create (12 files):**

| File | Lines | Purpose |
|------|-------|---------|
| `package.json` | 25 | Dependencies, scripts |
| `vite.config.js` | 10 | Vite + Preact plugin |
| `tailwind.config.js` | 20 | Tailwind theme |
| `postcss.config.js` | 5 | PostCSS for Tailwind |
| `index.html` | 15 | Entry HTML |
| `src/main.jsx` | 20 | Preact entry point |
| `src/styles/tailwind.css` | 10 | Tailwind imports |
| `src/styles/custom.css` | 40 | Custom styles |
| `src/context/FileSystemContext.jsx` | 120 | File System Access API wrapper |
| `src/components/Layout/AppLayout.jsx` | 80 | Sidebar + main area shell |
| `src/components/Modals/FolderPicker.jsx` | 90 | Folder selection modal |
| `src/App.jsx` | 40 | Root component with FileSystemProvider |

**Implementation Steps:**

1. Initialize project structure (create all directories)
2. Create `package.json` with dependencies: `preact`, `preact-cli`, `tailwindcss`, `postcss`, `autoprefixer`, `vite`, `@vitejs/plugin-react`
3. Install dependencies: `npm install`
4. Create `vite.config.js` with Preact plugin
5. Create `tailwind.config.js` with content paths
6. Create `postcss.config.js`
7. Create `index.html` with Tailwind CDN link
8. Create `src/styles/tailwind.css` with `@tailwind` directives
9. Create `src/styles/custom.css` with custom styles
10. Create `src/main.jsx` — Preact entry point
11. Create `src/context/FileSystemContext.jsx` — wraps File System Access API:
    - `openDirectory()` — user picks a folder
    - `readFile(path)` — reads file content
    - `writeFile(path, content)` — writes file content
    - `createDirectory(path)` — creates folder
    - `listDirectory(path)` — lists files/folders
    - `getFileHandle(path)` — gets FileHandle for later writes
12. Create `src/components/Layout/AppLayout.jsx` — sidebar + main area shell
13. Create `src/components/Modals/FolderPicker.jsx` — folder selection modal
14. Create `src/App.jsx` — root component wrapping AppLayout with FileSystemProvider
15. Verify: `npm run dev` starts, folder picker appears, selecting a folder shows empty UI

**Deliverable:** App runs, user picks a folder, file read/write works, empty UI shell.

**Verification:** `npm run dev` -> folder picker -> select folder -> see empty sidebar + main area.

**Git:** `git add . && git commit -m "Phase 1: Foundation"`

---

### Phase 2: Core Features

**Goal:** Folder tree, note editor, image gallery. Standalone — includes all Phase 1 files.

**Files to create (16 files):**

| File | Lines | Purpose |
|------|-------|---------|
| *(All Phase 1 files — identical content)* | | |
| `src/components/Sidebar/FolderTree.jsx` | 130 | Recursive folder tree |
| `src/components/Sidebar/FolderNode.jsx` | 80 | Single folder node |
| `src/components/Editor/NoteEditor.jsx` | 250 | CodeMirror 6 editor with preview |
| `src/components/Editor/MarkdownPreview.jsx` | 100 | Render markdown + Prism.js |
| `src/components/Editor/CodeBlock.jsx` | 50 | Code block with copy button |
| `src/components/Gallery/ImageGallery.jsx` | 150 | Image grid, paste, drag-drop |
| `src/components/Gallery/ImageCard.jsx` | 60 | Image thumbnail card |
| `src/components/Layout/Sidebar.jsx` | 60 | Sidebar wrapper |
| `src/components/Layout/MainArea.jsx` | 60 | Main area wrapper |
| `src/components/Layout/AppLayout.jsx` | 100 | Updated to include Sidebar + MainArea |
| `src/App.jsx` | 60 | Updated with folder tree + editor |
| `src/utils/markdown.js` | 40 | Markdown utilities |

**Implementation Steps:**

1. Recreate all Phase 1 files (identical content)
2. Create `src/utils/markdown.js` — markdown parsing utilities
3. Create `src/components/Sidebar/FolderNode.jsx` — recursive folder node with expand/collapse, context menu
4. Create `src/components/Sidebar/FolderTree.jsx` — recursive tree using FolderNode
5. Create `src/components/Editor/NoteEditor.jsx` — CodeMirror 6 with markdown mode, split view, keyboard shortcuts
6. Create `src/components/Editor/MarkdownPreview.jsx` — render markdown with marked.js, Prism.js for code blocks
7. Create `src/components/Editor/CodeBlock.jsx` — code block component with copy button
8. Create `src/components/Gallery/ImageGallery.jsx` — image grid, clipboard paste, drag-drop, browse
9. Create `src/components/Gallery/ImageCard.jsx` — image thumbnail card
10. Create `src/components/Layout/Sidebar.jsx` — sidebar wrapper with FolderTree
11. Create `src/components/Layout/MainArea.jsx` — main area with NoteEditor + ImageGallery
12. Update `src/components/Layout/AppLayout.jsx` — integrate Sidebar + MainArea
13. Update `src/App.jsx` — wire up FileSystemContext with folder tree + editor
14. Verify: create note -> edit with preview -> paste image -> browse folders

**Deliverable:** Full note-taking workflow — create, edit, save, preview notes. Paste/drop images. Folder navigation.

**Verification:** `npm run dev` -> pick folder -> create note -> edit with preview -> paste image -> browse folders.

**Git:** `git add . && git commit -m "Phase 2: Core Features"`

---

### Phase 3: Search & Tags

**Goal:** Full-text search, tagging system. Standalone — includes all Phase 1-2 files.

**Files to create (12 files):**

| File | Lines | Purpose |
|------|-------|---------|
| *(All Phase 1-2 files — identical content)* | | |
| `src/components/Search/SearchBar.jsx` | 100 | Search input with debounce |
| `src/components/Search/SearchResults.jsx` | 120 | Fuse.js search results |
| `src/components/Sidebar/TagPanel.jsx` | 100 | Tag list with filter |
| `src/components/Modals/TagEditor.jsx` | 90 | Create/rename/delete tags |
| `src/utils/search.js` | 80 | Fuse.js index builder |
| `src/utils/tags.js` | 60 | Tag CRUD operations |
| `src/context/AppStateContext.jsx` | 100 | Global state (selected note, tags, search) |
| `src/components/Layout/AppLayout.jsx` | 120 | Updated with SearchBar + TagPanel |
| `src/components/Editor/NoteEditor.jsx` | 280 | Updated with tag toolbar |
| `src/App.jsx` | 80 | Updated with AppStateProvider |

**Implementation Steps:**

1. Recreate all Phase 1-2 files (identical content)
2. Create `src/utils/search.js` — Fuse.js index builder, search function
3. Create `src/utils/tags.js` — tag CRUD, tag extraction from frontmatter
4. Create `src/context/AppStateContext.jsx` — global state: selected note, tags, search query, search results
5. Create `src/components/Search/SearchBar.jsx` — search input, debounced search, keyboard nav
6. Create `src/components/Search/SearchResults.jsx` — search results list, click to open note/image
7. Create `src/components/Sidebar/TagPanel.jsx` — tag list, click to filter, tag colors
8. Create `src/components/Modals/TagEditor.jsx` — create/rename/delete tags modal
9. Update `src/components/Editor/NoteEditor.jsx` — add tag toolbar, integrate with AppStateContext
10. Update `src/components/Layout/AppLayout.jsx` — add SearchBar to toolbar, TagPanel to sidebar
11. Update `src/App.jsx` — add AppStateProvider, wire up search + tags
12. Verify: create notes with tags -> search by keyword -> filter by tag

**Deliverable:** Find any note or image by keyword, tag, or folder. Filter by tag.

**Verification:** `npm run dev` -> create notes with tags -> search -> filter by tag.

**Git:** `git add . && git commit -m "Phase 3: Search & Tags"`

---

### Phase 4: Polish & UX

**Goal:** Auto-save, error handling, settings, responsive design. Standalone — includes all Phase 1-3 files.

**Files to create (10 files):**

| File | Lines | Purpose |
|------|-------|---------|
| *(All Phase 1-3 files — identical content)* | | |
| `src/utils/autoSave.js` | 60 | Debounced save utility |
| `src/components/Modals/SettingsModal.jsx` | 120 | Settings panel |
| `src/components/Layout/Toolbar.jsx` | 80 | Top toolbar with save indicator |
| `src/components/Layout/AppLayout.jsx` | 140 | Updated with Toolbar, responsive |
| `src/context/FileSystemContext.jsx` | 150 | Updated with error handling, auto-save |
| `src/context/AppStateContext.jsx` | 130 | Updated with settings, toasts |
| `src/components/Modals/ImageViewer.jsx` | 70 | Full-size image viewer |
| `src/styles/custom.css` | 80 | Added toast, responsive styles |
| `src/App.jsx` | 100 | Updated with SettingsProvider, Toast |

**Implementation Steps:**

1. Recreate all Phase 1-3 files (identical content)
2. Create `src/utils/autoSave.js` — debounced save, save indicator logic
3. Create `src/components/Modals/SettingsModal.jsx` — theme, font size, auto-save interval, export
4. Create `src/components/Layout/Toolbar.jsx` — top toolbar with save indicator, settings button
5. Create `src/components/Modals/ImageViewer.jsx` — full-size image viewer modal
6. Update `src/context/FileSystemContext.jsx` — add error handling, auto-save integration, toast notifications
7. Update `src/context/AppStateContext.jsx` — add settings state, toast state, image viewer state
8. Update `src/components/Layout/AppLayout.jsx` — add Toolbar, responsive layout (collapsible sidebar)
9. Update `src/styles/custom.css` — add toast styles, responsive breakpoints
10. Update `src/App.jsx` — add SettingsProvider, Toast component, wire up all contexts
11. Verify: edit note -> stop typing -> auto-save -> trigger error -> see toast -> resize window -> responsive

**Deliverable:** Production-ready MVP — auto-save, error toasts, settings, responsive layout.

**Verification:** `npm run dev` -> edit note -> stop typing -> auto-save -> trigger error -> see toast -> resize -> responsive.

**Git:** `git add . && git commit -m "Phase 4: Polish & UX"`

---

### Phase 5: Documentation & Deployment

**Goal:** README, deploy config, browser notes. Standalone — includes all Phase 1-4 files.

**Files to create (3 files):**

| File | Lines | Purpose |
|------|-------|---------|
| *(All Phase 1-4 files — identical content)* | | |
| `README.md` | 100 | Setup, usage, browser support |
| `deploy.sh` | 30 | Build + deploy script |
| `.github/workflows/deploy.yml` | 40 | GitHub Actions CI/CD |

**Implementation Steps:**

1. Recreate all Phase 1-4 files (identical content)
2. Create `README.md` — project description, setup instructions, usage guide, browser compatibility
3. Create `deploy.sh` — build script, GitHub Pages deploy
4. Create `.github/workflows/deploy.yml` — GitHub Actions workflow for auto-deploy on push
5. Verify: `npm run build` produces static files

**Deliverable:** Documented, deployable app.

**Verification:** `npm run build` -> static files generated -> deploy to GitHub Pages.

**Git:** `git add . && git commit -m "Phase 5: Documentation & Deployment"`

## Phase Dependency Matrix

```
          | P1 | P2 | P3 | P4 | P5
----------|----|----|----|----|---
Phase 1   | X  |    |    |    |
Phase 2   | X  | X  |    |    |
Phase 3   | X  | X  | X  |    |
Phase 4   | X  | X  | X  | X  |
Phase 5   | X  | X  | X  | X  | X
```

## Component Hierarchy

```
App
+-- AppStateProvider
|   +-- FileSystemProvider
|       +-- AppLayout
|           +-- Toolbar
|           |   +-- SearchBar
|           |   +-- NewNoteBtn
|           |   +-- SettingsBtn
|           +-- Sidebar
|           |   +-- FolderTree
|           |   |   +-- FolderNode (recursive)
|           |   +-- TagPanel
|           +-- MainArea
|           |   +-- EmptyState (no note selected)
|           |   +-- NoteEditor
|           |   |   +-- CodeMirror Editor
|           |   |   +-- Markdown Preview
|           |   |   +-- Editor Toolbar (tags, save indicator)
|           |   +-- ImageGallery
|           |   |   +-- ImageCard
|           |   +-- SearchResults (overlay)
|           +-- Modals
|               +-- FolderPicker
|               +-- TagEditor
|               +-- SettingsModal
|               +-- ImageViewer
```

## Key Technical Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| File access | File System Access API | Direct file read/write, user-controlled |
| Search | Fuse.js (in-memory) | Fast, fuzzy, no server needed |
| Editor | CodeMirror 6 | Lightweight, markdown support, extensible |
| Image storage | Original files (not base64) | Smaller app size, user can open images externally |
| State management | Preact Context + useReducer | Simple, no external dependency |
| Tag storage | YAML frontmatter | Human-readable, no separate DB |
| Phase strategy | Fully self-contained | Any phase runnable in fresh session |
| Rollback | Git-based | `git reset --hard HEAD~1` on failure |
| Session handoff | AGENTS.md auto-read | OpenCode reads AGENTS.md on every session start |

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| File System Access API not in Firefox/Safari | Users on non-Chromium can't use file access | Offer IndexedDB fallback for non-Chromium browsers |
| Large image libraries slow down gallery | Poor performance | Virtual scrolling, lazy loading, thumbnails |
| CodeMirror 6 learning curve | Slower development | Use official markdown extension, start simple |
| Auto-save conflicts if file changed externally | Data loss | Detect file modification time, prompt user |

## Future Enhancements (Post-MVP)

- AI/semantic search (WebLLM + llama.cpp)
- Multi-user / accounts
- Cloud sync (Dropbox, Google Drive)
- Mobile app (PWA -> Capacitor)
- Collaboration / sharing
- Version history / git integration
- Export to PDF
