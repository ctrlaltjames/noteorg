# NoteOrg

A web-based personal knowledge base for notes, images, and code snippets with powerful search and organization.

## Features

- **Note Editor** — Markdown editing with live preview, syntax highlighting, and copy buttons
- **Image Support** — Paste from clipboard, drag-and-drop, and browse to add images
- **Folder Tree** — Hierarchical folder navigation for organizing notes
- **Tagging System** — Add, remove, and filter notes by tags
- **Full-Text Search** — Fuzzy search across note titles, content, tags, and filenames using Fuse.js
- **Auto-Save** — Debounced automatic saves with manual save option
- **Dark Mode** — Automatic dark mode based on system preferences
- **Responsive** — Works on desktop and mobile with collapsible sidebar

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | Preact |
| Build Tool | Vite |
| Markdown Editor | CodeMirror 6 |
| Markdown Renderer | marked.js |
| Syntax Highlighting | Prism.js |
| Search Engine | Fuse.js |
| Styling | Tailwind CSS |
| File Access | File System Access API |

## Setup

### Prerequisites

- Node.js 18+
- A Chromium-based browser (Chrome, Edge, Arc) for full file system access

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Opens the app at `http://localhost:5173`.

### Production Build

```bash
npm run build
```

Outputs static files to the `dist/` directory.

### Preview Build

```bash
npm run preview
```

## Usage

1. Open the app in a Chromium-based browser
2. Select a local folder to use as your workspace
3. Create notes, add images, organize with folders and tags
4. Use the search bar to find notes by keyword or tag
5. Click the settings icon to customize theme, font size, and auto-save interval

### Browser Support

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome | Full | File System Access API supported |
| Edge | Full | File System Access API supported |
| Arc | Full | File System Access API supported |
| Firefox | Partial | No file system access — UI works, file operations unavailable |
| Safari | Partial | No file system access — UI works, file operations unavailable |

The File System Access API is only available in Chromium-based browsers. On Firefox and Safari, the app will show a notice that file operations are unavailable.

## Data Layout

Notes are stored as Markdown files with YAML frontmatter:

```markdown
---
title: "My Note"
tags: [work, project]
folder: work/project-x
created: 2025-07-20
---

Note content in Markdown...
```

Images are stored alongside notes or in an `assets/` folder.

## Deployment

### GitHub Pages

```bash
chmod +x deploy.sh
./deploy.sh
```

Or configure the GitHub Actions workflow in `.github/workflows/deploy.yml` for automatic deployment on push.

### Manual Deployment

```bash
npm run build
# Upload dist/ contents to any static hosting service
```

## License

MIT
