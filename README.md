# cse340-course-repo
# Local setup

1. Copy `.env.example` to `.env` and set `DB_URL` to your PostgreSQL connection URL.
2. Set `SESSION_SECRET` to a long random value.
3. Set `ADMIN_PASSWORD` to provision the required admin account. The account email defaults to `admin@example.com` and can be changed with `ADMIN_EMAIL`.
4. Run `npm install`, then `npm run dev`.

The application creates the `account` table at startup. New registrations receive the `Client` role; the configured admin account is created or refreshed with the `Admin` role. Passwords are stored as salted scrypt hashes.
