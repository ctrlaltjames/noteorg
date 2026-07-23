# Notes + Artifact Organizer — Project Plan

## Core Concept

A web-based personal knowledge base for notes, images, and code snippets with powerful search and organization.

## MVP Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Platform | Web app | Accessible from any browser |
| Storage | Browser Filesystem API | Files stay on your machine, user controls where they live |
| Users | Single user | Simplest MVP, multi-user can be added later |
| Search | Metadata + full-text | Skip AI search for now, add later |
| Framework | Preact | Lightweight, component-based, no heavy build chain |
| Folders | Folders + Tags | Best of both worlds |
| Code blocks | Syntax highlighting + copy button | Matches your use case |
| Priority | MVP-first | Get something working, iterate |

## Proposed Architecture

```
+-------------------------------------------------+
|           Preact Frontend                       |
|  +-----------+ +------------+ +--------------+  |
|  |  Notes    | |  Images    | |  Search      |  |
|  |  Editor   | |  Gallery   | |  Engine      |  |
|  +-----------+ +------------+ +--------------+  |
|         |              |                         |
|         +------|------+                         |
|            File System API                      |
+----------------|--------------------------------+
                 |
         User's chosen folder
         +-- notes/
         |   +-- project-x/
         |       +-- sandbox-update.md
         |       +-- screenshot-1.png
         +-- _tags/
             +-- sandbox.json
```

## Data Structure

### Notes stored as Markdown files:

````markdown
---
title: "Sandbox Update Script"
tags: [sandbox, deployment, work]
folder: work/project-x
created: 2025-07-20
---

Here's the code I used to update the sandbox...

```javascript
const deploy = () => { ... };
```

![screenshot.png](./screenshot.png)
````

### Images stored alongside notes as PNG/JPG files.

### Tags stored as lightweight JSON sidecars or embedded in frontmatter.

## Key Features (MVP)

1. **Note Editor** - Markdown editing with preview
2. **Image Support** - Paste from clipboard, drag-and-drop, browse to add
3. **Folder Tree** - Hierarchical folder navigation (work, personal, sub-folders)
4. **Tagging System** - Add/remove tags from any note or image
5. **Full-Text Search** - Search across note titles, content, tags, and filenames
6. **Code Blocks** - Syntax highlighting (Prism.js or highlight.js) + copy button
7. **Folder Picker** - User selects a local folder on first use
8. **Auto-save** - Write changes back to the filesystem

## Tech Stack

- **UI**: Preact (lightweight React alternative)
- **Markdown**: marked.js or remark (rendering) + CodeMirror or Monaco (editing)
- **Syntax Highlighting**: Prism.js (lightweight, easy to customize)
- **Search**: Client-side full-text search using Fuse.js (fuzzy search, fast, no server)
- **File Access**: File System Access API (showDirectoryPicker)
- **Styling**: Plain CSS or a lightweight CSS framework (Tailwind via CDN for speed)

## What's Not in MVP (But Planned)

- AI/semantic search (WebLLM with llama.cpp)
- Multi-user / accounts
- Cloud sync
- Mobile responsive (can be added)
- Collaboration / sharing

## Open Questions / Tradeoffs

1. **Browser Support** - File System Access API only works in Chromium browsers (Chrome, Edge, Arc). Firefox/Safari won't support it. Consider adding a fallback (IndexedDB) for non-Chromium browsers.

2. **Single folder per session** - The user picks one folder to work from. Consider supporting multiple folder roots if needed.

3. **Image handling** - For large images, consider client-side compression before saving.

4. **Note editing experience** - Split-view editor (edit + preview side by side) vs. toggle between edit/preview modes.
