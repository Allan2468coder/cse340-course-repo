# cse340-course-repo

## Project site

The GitHub Pages project overview is available at
https://allan2468coder.github.io/cse340-course-repo/. It describes the
application and links to its source and local setup instructions. GitHub Pages
only hosts static files; run the Express and PostgreSQL application locally
using the setup steps below.

# Local setup

1. Copy `.env.example` to `.env` and set `DB_URL` to a reachable PostgreSQL connection URL. When running locally with a hosted Render database, use its **External Database URL**; its internal hostname only resolves from Render services on the same private network. Alternatively, use a local PostgreSQL URL.
2. Set `SESSION_SECRET` to a long random value.
3. Set `ADMIN_PASSWORD` to provision the required admin account. The account email defaults to `admin@example.com` and can be changed with `ADMIN_EMAIL`.
4. Run `npm install`, then `npm run dev`.

At startup the application applies the idempotent schema and sample data in `src/setup.sql`, then creates or refreshes the configured admin account. New registrations receive the `Client` role. Passwords are stored as salted scrypt hashes. The `/healthz` endpoint can be used for deployment health checks.

The development script uses Node.js's built-in watch mode (Node.js 18.11 or newer), so no separate file-watcher dependency is required.
