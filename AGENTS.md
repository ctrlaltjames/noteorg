# AGENTS.md — Notes + Artifact Organizer

## Project Overview

Notes + Artifact Organizer is a web-based personal knowledge base for notes, images, and code snippets. Built with Preact, Vite, Tailwind CSS, CodeMirror 6, and the File System Access API.

## Current Status

- Read `.opencode/plans/phase-*-checkpoint.md` to find the latest completed phase
- The highest phase number = last completed phase
- Implement the next phase

## Session Protocol

When starting a session, follow these steps EXACTLY:

### Step 1: Find Current Phase
1. Search for `.opencode/plans/phase-*-checkpoint.md`
2. Find the file with the highest phase number (e.g., `phase-2-checkpoint.md`)
3. If no checkpoint exists, start with Phase 1
4. The next phase = highest phase number + 1

### Step 2: Read Planning Docs
1. Read `notes-artifact-organizer-plan.md` — project concept and decisions
2. Read `implementation-plan.md` — phase details and file lists
3. Read the checkpoint file for the last completed phase

### Step 3: Implement Current Phase
1. Follow the implementation steps in `implementation-plan.md` for the current phase
2. Create ALL files listed (including prior-phase files)
3. Run verification commands
4. Commit to git: `git add . && git commit -m "Phase N: <name>"`
5. Create/update the checkpoint file at `.opencode/plans/phase-N-checkpoint.md`
6. STOP and wait for user input

### Step 4: Create Checkpoint
After completing the phase, create `.opencode/plans/phase-N-checkpoint.md` with this format:

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
- Commit: <hash> "Phase N: <name>"
- Status: clean

### Next Phase: Phase N+1
- No action needed — Phase N+1 is fully self-contained
- It will recreate all files from Phase N plus new ones
```

## Continue Command

The user will type one of these prompts:

| Prompt | What it does |
|--------|-------------|
| `"continue"` | Implement next phase after latest checkpoint |
| `"continue to phase N"` | Implement specific phase |
| `"redo phase N"` | Rollback git and redo phase N |
| `"skip phase N"` | Mark phase N as complete without implementing |

## Context Management

- READ ONLY the files needed for the current phase
- DO NOT read files from completed phases unless they are inputs to the current phase
- The implementation-plan.md has a complete file list for each phase — follow it exactly

## Git Workflow

- Branch: `main`
- Commit message format: `"Phase N: <name>"`
- Failed phase: `git reset --hard HEAD~1` to rollback, then retry
- Before starting: `git status` should be clean

## File Size Targets

| File Type | Target Size | Max Size |
|-----------|------------|----------|
| Utility files | 50-100 lines | 150 lines |
| Context providers | 100-200 lines | 300 lines |
| Simple components | 50-150 lines | 250 lines |
| Complex components | 150-300 lines | 500 lines |
| Config files | 20-50 lines | 80 lines |

## IMPORTANT

- After completing each phase, STOP and wait for user input
- Do NOT proceed to the next phase without explicit instruction
- Always create the checkpoint file before stopping
