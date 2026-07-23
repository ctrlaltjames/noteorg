# Setup Checklist — NoteOrg

**Before starting a new session, complete these steps in order.** Each step is self-contained — finish one before moving to the next.

---

## Step 1: Create Supabase Project

- [ ] Go to [supabase.com](https://supabase.com) and create a new project (or use an existing one)
- [ ] Note your project URL (looks like `https://xxxxx.supabase.co`)
- [ ] Note your project ref (the short code, e.g., `abc123`)

**Done when:** You have a Supabase project URL and can access the dashboard.

---

## Step 2: Create `.env` File

- [ ] In the project root, create a file named `.env`
- [ ] Add the following, replacing the placeholders with your Supabase credentials:
  ```
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key-from-supabase-dashboard
  ```
- [ ] Find your anon key in Supabase Dashboard: **Settings > API > anon/public key**

**Verification:** Run `npm run dev` — the app should start without errors. The Supabase client will log connection attempts (it won't work yet, but the app should load).

---

## Step 3: Run Database Schema

- [ ] Open your Supabase Dashboard
- [ ] Go to **SQL Editor**
- [ ] Copy the entire `SQL_SCHEMA` constant from `src/lib/supabase.js` (lines 14–82)
- [ ] Paste into the SQL Editor and click **Run**
- [ ] Verify all tables were created: `artifacts`, `folders`, `tags`, `artifact_tags`

**Verification:** Go to **Table Editor** in Supabase — you should see all 4 tables. Each table should have a red "user_id" policy indicating RLS is active.

---

## Step 4: Create Storage Bucket

- [ ] In Supabase Dashboard, go to **Storage**
- [ ] Click **New Bucket**
- [ ] Name it: `images`
- [ ] Set **Public bucket**: enabled
- [ ] Set **File size limit**: 10MB
- [ ] Click **Create**

**Verification:** You should see the `images` bucket listed. It should show as "public".

---

## Step 5: Test Authentication

- [ ] Run `npm run dev`
- [ ] Open http://127.0.0.1:5173
- [ ] Click **Sign Up** and create an account with email/password
- [ ] Verify you're logged in (Header shows "Sign Out")
- [ ] Refresh the page — you should stay logged in

**Verification:** You should be able to sign up, log in, and the session should persist on refresh.

---

## Step 6: Test Full Workflow

- [ ] Click the **+** button (QuickAdd)
- [ ] Create a **Note** with markdown content (try headings, code blocks, lists)
- [ ] Verify it appears in the sidebar list
- [ ] Click the note to view rendered markdown
- [ ] Click **Edit**, modify the content, press **Ctrl+S**
- [ ] Create an **Image** by uploading a file
- [ ] Verify the image appears in the list and can be viewed
- [ ] Test **search** by typing in the sidebar search box
- [ ] Test **tags** — create a tag when adding an artifact, then filter by it
- [ ] Test **folders** — create a folder, assign it to an artifact, then filter

**Verification:** All CRUD operations work, search filters results, tags and folders organize artifacts.

---

## Step 7 (Optional): GitHub OAuth

- [ ] Go to [GitHub Settings > Developer settings > OAuth apps](https://github.com/settings/developers)
- [ ] Create a new OAuth app, note the **Client ID** and generate a **Client Secret**
- [ ] Set Authorization callback URL to: `https://your-project.supabase.co/auth/v1/callback`
- [ ] In Supabase Dashboard: **Authentication > Providers > GitHub** — enable it
- [ ] Paste the Client ID and Client Secret
- [ ] Restart the dev server and test the "Continue with GitHub" button

**Verification:** GitHub login redirects to GitHub, then back to the app, and you're logged in.

---

## Quick Reference

| Item | Location |
|------|----------|
| Supabase URL | Dashboard > Project Settings > API |
| Anon Key | Dashboard > Settings > API > anon/public |
| SQL Schema | `src/lib/supabase.js` lines 14–82 |
| Storage Bucket | Dashboard > Storage > New Bucket (`images`) |
| OAuth Settings | Dashboard > Authentication > Providers |

---

**After completing all steps:** The app is fully functional and ready for development.
