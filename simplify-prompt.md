You are a product architect. Read docs/ARCHITECTURE.md, docs/FEATURES.md, docs/NORTH-STAR.md, docs/PROBLEM.md, README.md, CLAUDE.md.

## Simplification Order from Founder

The zero-knowledge / envelope encryption / client-side decryption / AES-SIV model is OVER-ENGINEERED for a non-enterprise product. Remove it.

Replace with a simple, standard encryption model:

### What to keep
- Data encrypted at rest (standard — whatever the database provider offers)
- HTTPS in transit (standard)
- Per-app API tokens with scoped permissions
- Audit log of all AI activity
- Data export (user can download their data anytime)
- App isolation (each app has its own data, no cross-app access)

### What to REMOVE
- Zero-knowledge architecture
- User-held master keys / PBKDF2 / Argon2 key derivation
- App Data Key (ADK) / envelope encryption
- Client-side decryption in browser
- AES-SIV / AES-GCM field-level encryption
- Per-field encryption decisions (filterable vs sensitive)
- "Platform cannot read user data" claim (drop this — it's too complex to implement properly and not needed for personal/SMB use)
- Session-scoped decryption for AI agents
- Key loss recovery phrases

### The simple model instead
- Supabase Postgres for platform data (users, billing, schemas)
- Turso or Neon for user app data (per-app isolation)
- Standard encryption at rest (provider-managed)
- HTTPS everywhere
- Per-app tokens, revocable
- RLS or app_id scoping for data isolation
- "We take privacy seriously — your data is isolated per app, encrypted at rest, and you can export or delete it anytime"

That's it. Simple. Standard. Like any good SaaS.

If enterprise customers later NEED zero-knowledge, it becomes a paid add-on. Not the default architecture.

## Your Task

Update ALL documents to remove the over-complicated encryption and replace with the simple model:

1. docs/ARCHITECTURE.md — remove zero-knowledge sections, simplify storage/privacy
2. docs/FEATURES.md — remove encryption features from P1, keep as Future/Enterprise
3. docs/NORTH-STAR.md — soften privacy claims from "we can't read your data" to "your data is isolated and encrypted at rest"
4. docs/PROBLEM.md — keep privacy as a value but don't over-promise
5. README.md — simplify privacy messaging
6. CLAUDE.md — update tech stack

Overwrite all files in place.

When done:
openclaw system event --text "Done: EzyForge docs simplified — removed zero-knowledge, kept simple encryption" --mode now
