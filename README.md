# Formyst

A self-hosted form builder with separate accounts and forms. Each account can
create several forms and can see only its own form definitions, responses, CSV
exports, and integration settings. A published form has a public respondent URL;
only the owner can edit it or see responses.

## Features

- Drag-and-drop builder and live preview.
- Text, email, phone, number, date, website URL, paragraph, dropdown, radio,
  and checkbox fields. Each field supports a label, help text, required setting,
  and choice options where applicable.
- Conditional show/hide rules based on dropdown, radio, or checkbox choices.
  Hidden fields are excluded from validation and saved responses.
- Accent, background, card, font, corner, alignment, logo, cover, and thank-you
  customization. The submit button has its own text, colors, size, width,
  corners, and alignment controls.
- Per-field label, input, border, focus, size, and corner styling; custom page
  background colors and uploaded background images.
- Multiple forms per account; private response dashboards and CSV exports.
- A local AI assistant for applying form and theme edits and answering product-help questions.
- Public email/password sign-up, Google sign-in, admin-created accounts, and self-service password changes.
- Optional n8n, automation, Slack, Discord, and Telegram integrations per form.
- Red unread-response badges on the forms dashboard, cleared when responses are opened.

## Requirements

- Node.js 20.12 or newer
- MySQL 8.0 or newer, or a compatible MariaDB version
- Python 3 only when importing the previous SQLite database

## Set up a fresh installation

1. Create a MySQL database and a dedicated user with access to it. For example,
   in a MySQL administrator shell:

   ```sql
   CREATE DATABASE formyst CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'formyst'@'localhost' IDENTIFIED BY 'a-strong-unique-password';
   GRANT ALL PRIVILEGES ON formyst.* TO 'formyst'@'localhost';
   ```

2. Run `npm install`, copy `.env.example` to `.env` for a fresh install, and set
   `DATABASE_URL`, `INITIAL_ADMIN_EMAIL`, and `INITIAL_ADMIN_PASSWORD`.
   Percent-encode reserved characters in the password part of a MySQL URL.
3. Run `npm run db:deploy` and `npm run db:seed`.
4. Remove `INITIAL_ADMIN_PASSWORD` from the environment after seeding.
5. Run `npm run dev` for development, or `npm run build` and `npm start`
   for production.

WAMP provides MySQL for this project. The Next.js app still runs with Node.js
at `http://localhost:3000`; it does not need to be inside `C:\wamp64\www`.
The initial migration creates InnoDB tables explicitly because some WAMP
installations default to MyISAM. Use InnoDB for future MySQL table migrations.

Sign in at `/login` with the first administrator account. Anyone can create a
member account at `/signup`; public registration never grants administrator
access. Admins can also create accounts from **Accounts** in the workspace
navigation (`/accounts`) or **Create account** on the forms dashboard. Users can
create and customize their own forms.
Each form's **Open form** link is public; the edit and responses links require
the owner's session. The owner can unpublish a form from the list to stop
accepting public responses without deleting existing responses.
In the builder, **Save draft** keeps a form private. **Publish** saves the
current edits and makes its respondent link live; **Unpublish** makes it private
again. A form needs at least one field before it can be published.

## Enable Google sign-in

1. In Google Cloud Console, configure the OAuth consent screen and create an
   OAuth client ID with application type **Web application**.
2. Add this exact authorized redirect URI to the client:
   `http://localhost:3000/api/auth/google/callback` for local use. For production,
   use `https://your-domain/api/auth/google/callback`.
3. Set `APP_URL`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` in `.env`, then
   restart the app. Google accounts must return a verified email address. Formyst
   identifies each Google account by its stable Google subject ID and creates it
   as a member.

## Enable the AI form assistant

Install [Ollama for Windows](https://ollama.com/download/windows), start it, and
download the local model in PowerShell:

```powershell
ollama pull qwen3:4b
```

Ollama's local API defaults to `http://127.0.0.1:11434`; Formyst uses that local
server and the `qwen3:4b` model by default. You can override these with
`OLLAMA_BASE_URL` and `OLLAMA_MODEL` in `.env`. No OpenAI API key is needed and
there are no per-request API charges; the model runs on the computer hosting
Formyst. The model download uses roughly 2.5 GB of disk space.

Only the current form design, the user's prompt, and recent assistant chat are
sent to Ollama; form submissions are not included. The assistant first plans the
edit, then generates a patch limited to the relevant form controls. Validated
changes apply to the open editor
automatically. The user still saves or publishes the form when ready. The
assistant can answer questions about Formyst's form builder, publishing,
responses, and integrations from a curated product guide. Account and security
operations remain outside its scope. The assistant has no tools or access to
execute code, query response data, or alter other forms.

When someone reports hard-to-read text, the editor checks text contrast against
card and input backgrounds, adjusts unsafe field and button colors, and makes a
glass card more opaque if an image behind it obscures text. Whole-form redesigns
get the same readability check before they appear in the editor.

To evaluate a running local model against varied requests, run
`node scripts/evaluate-assistant.mjs` for intent and scope, then
`node scripts/evaluate-design-patch.mjs` for generated design patches. Set
`OLLAMA_MODEL` to compare a different installed model. These checks use a
synthetic form and do not read saved forms or responses.

For deployment, run Ollama as a persistent service on the same server as the
Formyst server process, install `qwen3:4b` there, and keep its API on loopback.
Set `OLLAMA_BASE_URL=http://127.0.0.1:11434` and
`OLLAMA_MODEL=qwen3:4b` for the deployed Formyst process. If Formyst runs in a
container, its loopback address is inside that container, so Ollama must be
reachable in the same network namespace for this configuration to work. The
assistant will be unavailable when Ollama is stopped; the rest of Formyst can
still run. On Linux, use Ollama's systemd service to keep it running after
restarts: https://docs.ollama.com/linux.

## Import the previous SQLite installation

The previous `prisma/dev.db` is left intact. The old SQLite migration history
is in `prisma/sqlite-migrations`; the active migrations create a new MySQL
database. To transfer the old form, submissions, and integration settings:

1. Back up `prisma/dev.db` and the current `.env`; edit `.env` instead of
   replacing it.
2. Configure the new MySQL `DATABASE_URL`, run `npm run db:deploy`, and
   create the first administrator with `npm run db:seed`.
3. Run `node prisma/import-sqlite.mjs prisma/dev.db admin@example.com`, using
   the actual administrator email.
4. Check the imported form and response count in the dashboard before switching
   traffic to the new app.

The previous shared `/form` URL is replaced by a form-specific `/f/{id}` URL.
Share the imported form's new link with respondents.

The import reads SQLite without writing to it. It is repeatable: existing form,
submission, and setting records are left in place.

## Security and deployment

- Passwords use salted scrypt hashes. Sessions use random browser tokens; only
  their SHA-256 hashes are stored in MySQL. Password changes revoke all sessions.
- Every private form and response query checks the signed-in owner ID. The
  `/f/{id}` respondent URL is intentionally public only after a form is saved
  with at least one field.
- Host the application behind HTTPS. Production cookies are `HttpOnly`,
  `Secure`, and `SameSite=Lax`. Mutating browser routes check `Origin`.
- The built-in rate limiter is per process. For multiple app instances, use a
  shared limiter at the edge or proxy. Set `TRUST_PROXY=true` only when a trusted
  reverse proxy overwrites `X-Forwarded-For`; otherwise headers supplied by
  clients must not be trusted as IP addresses.
- Set `WEBHOOK_ALLOWED_HOSTS` to a comma-separated list of exact HTTPS
  destination hosts, including a port when needed, before users can configure
  n8n, Slack, Discord, or an automation webhook. Example:
  `WEBHOOK_ALLOWED_HOSTS=n8n.example.com,hooks.slack.com,discord.com,hooks.zapier.com`.
  Webhook redirects are
  not followed. This lets the server operator control outbound destinations.
- MySQL connections and the database account should be restricted to the app
  host. Back up the database and protect `.env`.
- The `deepmerge-ts` override keeps Prisma 6's config dependency on the
  patched 8.0.2 release. Recheck the override when upgrading Prisma.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start local development |
| `npm run build` | Production build |
| `npm start` | Start the production build |
| `npm run typecheck` | Check TypeScript |
| `npm run test` | Run schema and security validation tests |
| `npm run lint` | Run ESLint |
| `npm run db:deploy` | Apply MySQL migrations |
| `npm run db:seed` | Create the first administrator once |
| `npm run db:studio` | Browse the database locally |
