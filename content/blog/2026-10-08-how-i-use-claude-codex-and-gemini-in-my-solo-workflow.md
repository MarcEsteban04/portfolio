---
title: "How I use Claude, Codex, and Gemini in my solo workflow"
date: 2026-10-08
category: AI
topic: ai-pair
summary: "I explain where Claude, Codex, and Gemini fit in my daily development cycle and share practical tips."
tags: [ai, productivity, javascript, flutter]
---

## Overview
As a solo developer I spend a lot of time shifting between idea, prototype, and production. Three AI assistants have become part of my routine: Claude, Codex, and Gemini. Each one shines at a different stage, and I keep the workflow simple so I can stay focused on building.

## Claude – the thinking partner
I use Claude mainly for high‑level tasks that require language understanding rather than raw code. Typical uses:

* **Brainstorming features** – I describe the problem and ask Claude to outline possible UI flows. The response gives me a quick checklist that I can turn into tickets.
* **Writing documentation** – After I finish a feature I paste a short summary into Claude and request a markdown README. The output is usually ready to copy‑paste with only minor edits.
* **Reviewing pull requests** – I feed the diff into Claude and ask for potential pitfalls or unclear logic. Claude often points out edge cases I missed, especially around authentication or error handling.

A typical prompt looks like:

```text
I just added a Supabase function that inserts a row into the "orders" table. Show me a concise description for the README and flag any security concerns.
```

Claude returns a short paragraph for the README and a note about checking RLS policies. I treat the output as a draft, not a final verdict, but it saves me from writing the same boilerplate over and over.

## Codex – the code generator inside the editor
Codex lives in my editor as a completion engine. It excels when I need concrete snippets, especially in TypeScript or Dart. I rely on it for:

* **Boilerplate scaffolding** – Running `npx create-next-app` gives me the project, but Codex helps me flesh out API routes faster. I type a comment like `// get user by email` and Codex suggests the full handler.
* **SQL queries** – When I need a quick SQLite query for a local cache, I describe the schema and ask Codex to generate the SELECT statement.
* **Refactoring** – I highlight a block and ask Codex to convert a callback‑based function to async/await. The suggestion is usually correct and saves a few minutes.

Example of a Codex‑generated Next.js route handler:

```typescript
// app/api/users/[id]/route.ts
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.from("users").select("*").eq("id", id).single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data);
}
```

I keep the generated code minimal and add typing later. The key is to give a clear comment or function name so Codex knows the intent.

## Gemini – the data‑oriented assistant
Gemini is my go‑to when I work with data models, migrations, or complex query logic. It understands relational concepts well, and I use it for:

* **Designing schema** – I describe the entities (e.g., `users`, `orders`, `products`) and ask Gemini to propose a normalized SQLite schema. I then copy the CREATE statements into a migration file.
* **Writing migration scripts** – Gemini can generate the `up` and `down` SQL needed for a version bump, which I review before committing.
* **Debugging query results** – When a Supabase RPC returns unexpected data, I paste the query and sample rows into Gemini and ask for possible reasons. It often points out missing joins or type mismatches.

A typical Gemini interaction:

```text
I have tables: users(id, email), orders(id, user_id, total). Write a SQLite view that shows each user's total spend.
```

Gemini replies with:

```sql
CREATE VIEW user_spend AS
SELECT u.id, u.email, COALESCE(SUM(o.total), 0) AS total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.email;
```

I copy that directly into my migration, run it, and the view is ready for reporting.

## How I keep the three in sync
1. **Idea → Claude** – I start with a natural‑language description, get a feature outline, and turn that into tickets.
2. **Implementation → Codex** – While coding, I rely on Codex for snippets and quick refactors. I keep the editor focused on the current file.
3. **Data → Gemini** – Whenever a new table or relationship appears, I ask Gemini for the schema and migration code. I also use it to sanity‑check complex queries.

By separating concerns—Claude for language, Codex for code, Gemini for data—I avoid the confusion of feeding every request to a single model. The workflow stays lightweight, and I can switch tools in seconds.

## Quick checklist for a new feature
1. Write a brief description and ask Claude for a feature outline.
2. Turn the outline into a task list in your project board.
3. For each task, open a file, add a comment describing the desired function, and let Codex generate the boilerplate.
4. When a new table is needed, ask Gemini for the schema and migration script.
5. After coding, paste the diff into Claude for a quick review before opening a PR.

Following this pattern has reduced the amount of time I spend on repetitive writing and let me focus on solving the real problems for my clients.
