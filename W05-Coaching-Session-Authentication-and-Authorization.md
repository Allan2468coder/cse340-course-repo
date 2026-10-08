# W05 Coaching Session: Authentication and Authorization

Prepared coaching-session transcript draft

Student: Ogwal Allan  
Project: CSE 340 Service Network application  
Target discussion time: 30-35 minutes when discussed interactively

Preparation note: This is a prepared coaching-session draft based on the current project code. The time blocks are a pacing guide, not a claim that this text alone records 30 minutes of elapsed conversation. Before submitting, review the explanations, personalize the student responses, and make sure the actual coaching discussion meets the required duration.

Session goals
- Explain the difference between authentication and authorization in the application.
- Explain registration validation, password hashing, database storage, and duplicate-account handling.
- Explain login, session creation, logout, and the session cookie settings.
- Explain how middleware protects pages and actions according to account role.
- Explain how the interface displays role-specific links and account information safely.

## [00:00-05:00] Introduction and application architecture

AI Coach: We are focusing on authentication and authorization today. Give me a short overview of the application and explain the difference between those two ideas.

Student (draft response): My application is an Express and EJS service network application backed by PostgreSQL. It displays organizations, projects, and categories, and it now supports user accounts. Authentication answers, "Who is this user?" Registration creates an account and login verifies its credentials. Authorization answers, "What is this signed-in user allowed to do?" In my application, a session identifies the signed-in account, and route middleware checks whether that account is allowed to open protected pages or submit protected actions.

AI Coach: Where do routes, controllers, models, and views fit into the account features?

Student (draft response): The routes in `src/routes.js` map URLs and HTTP methods to controller functions and attach access middleware where needed. The controllers in `src/controllers/auth.js` validate submitted account data, call model functions, and choose a response such as rendering a form or redirecting. The account model in `src/models/accounts.js` runs the parameterized PostgreSQL queries. The EJS views render registration, login, dashboard, and user-list pages. Password hashing is kept in `src/lib/passwords.js`, separate from the route and view code.

AI Coach: Why is it not enough to hide an administrator link in the page?

Student (draft response): A visitor can type a URL directly or send a request without using the page links. Hiding a link only changes the interface. The server must check access on the actual route, including POST routes that change data. My `requireRole('Admin')` middleware does that check before the controller runs.

## [00:05-12:00] 1. Registration, validation, and password storage

AI Coach: Walk through a registration request. What validation takes place, and where?

Student (draft response): A registration form posts to `/register`. In `src/routes.js`, the POST route runs `registrationValidationRules` before `registerAction`. The rules in `src/controllers/auth.js` trim and validate first and last names, normalize and validate the email, require a password between 8 and 128 characters, and check that the confirmation matches. If validation fails, the controller returns status 400 and renders the form again with field-specific errors. The submitted password fields are not included in the account object that is passed to the view.

AI Coach: Does a new registrant get to select their own account role?

Student (draft response): No. The registration form does not contain a role field. The controller passes the validated account details and password hash to `createAccount`, and the model gives the account the default `Client` role. The database also has a default of `Client` and a check constraint allowing only `Client` or `Admin`. That prevents a person from making themselves an administrator by changing the form submission.

AI Coach: Explain what happens to a password before it is saved.

Student (draft response): `registerAction` calls `hashPassword` from `src/lib/passwords.js` before it calls the account model. The helper uses Node's `scrypt` with a new random 16-byte salt for each password. It stores the algorithm parameters, salt, and derived key in a formatted string. The original password is never inserted into the database. During login, the application derives a key from the submitted password and stored salt, then uses `timingSafeEqual` to compare it with the stored key.

AI Coach: What protects against two people registering the same email at nearly the same time?

Student (draft response): The account table has a unique constraint on `account_email`, and `createAccount` uses a parameterized SQL insert. The controller catches PostgreSQL's unique-violation code, `23505`, and renders a useful duplicate-email error. A separate “does this email already exist?” check would not be enough by itself, because two requests could pass that check at the same time. The database constraint is the final guarantee.

AI Coach: What account information does the account model return after creating an account, and what does it avoid returning?

Student (draft response): The insert returns the account ID, first name, last name, email, and role. It does not return the password hash. The registration controller then sets a flash message and redirects to `/login`, so the user can sign in.

## [00:12-19:00] 2. Login, sessions, and logout

AI Coach: Explain the main steps in a successful login.

Student (draft response): The login form posts to `/login`, and the route runs `loginValidationRules` before `loginAction`. The controller normalizes the email, gets the matching account through `getAccountByEmail`, and calls `verifyPassword` with the submitted password and stored hash. If verification succeeds, the controller regenerates the session and stores only the account ID, first name, last name, email, and account type in `req.session.account`. It does not put the password or password hash in the session. Then it flashes a welcome message and redirects to `/dashboard`.

AI Coach: Why does the controller regenerate the session after a successful login?

Student (draft response): Regenerating the session gives the authenticated user a new session ID instead of continuing with the ID from before login. That helps prevent session fixation, where an attacker might try to make a victim use a session ID the attacker already knows.

AI Coach: What response does the application give when the email is not found or the password is wrong?

Student (draft response): It renders the login page with status 401 and the same message, “Email or password is incorrect.” It does not reveal whether the email exists. The email remains in the form so the user can correct it, but the password is not repopulated.

AI Coach: How does the browser stay signed in across later requests?

Student (draft response): `server.js` configures `express-session` before `connect-flash` and before the routes. The session middleware reads the signed session cookie, makes the session available as `req.session`, and saves changes such as `req.session.account`. The cookie is HTTP-only, uses `SameSite=Lax`, is marked secure automatically when the request is HTTPS, and expires after 30 minutes. The `SESSION_SECRET` environment variable should be set to a stable secret in deployment. The code generates a random fallback if it is missing, which is useful for local development but means existing sessions will not survive a server restart if that fallback changes.

AI Coach: Why does the order of session middleware and flash middleware matter?

Student (draft response): Flash messages are stored in the session. The session middleware must run first so `connect-flash` can use `req.session`, and both must run before routes that read or set flash messages. The application makes queued success and error messages available to the shared header, which displays them once on the next page.

AI Coach: What happens when a signed-in user logs out?

Student (draft response): The `logOut` controller destroys the session, clears the `connect.sid` cookie, and redirects to `/login`. Destroying the server-side session means the browser no longer has the account data that protected routes check.

## [00:19-26:00] 3. Authorization middleware and protected routes

AI Coach: Show the difference between `requireLogin` and `requireRole`.

Student (draft response): `requireLogin` checks whether `req.session.account` exists. If it does, it calls `next()`; otherwise it flashes a message and redirects to `/login`. `requireRole(role)` first checks that the user is signed in, then compares the account's `account_type` with the required role. An unauthenticated user is redirected to login, and a signed-in user with the wrong role receives a permission message and is redirected to the dashboard.

AI Coach: Give an example of how those middleware functions are attached to routes.

Student (draft response): In `src/routes.js`, `/dashboard` uses `requireLogin` because any signed-in account may view it. `/users` uses `requireRole('Admin')`. The create and edit routes for organizations, projects, and categories also use `requireRole('Admin')`. The middleware appears on both the GET form route and the POST action route. For project category assignment, both `GET /assign-categories/:id` and `POST /assign-categories/:id` require the Admin role. That protects the page and the database-changing action.

AI Coach: What would happen if you protected the GET form but forgot to protect its POST route?

Student (draft response): A non-admin could bypass the form and submit a POST request directly. The server would accept the action unless the POST route also checked authorization. Every route that performs a protected operation needs its own server-side access check.

AI Coach: How does category reassignment work for an authorized administrator?

Student (draft response): The Project Detail page has an “Update Project Categories” link under the Categories heading. An administrator opens the assignment page, where every available category is rendered as a checkbox and categories already assigned to that project are checked. The form posts the selected IDs. The controller validates that IDs are integers and that they refer to categories in the database. It treats no checked boxes as an empty selection, then the model updates the project's rows in the `project_category` junction table. On success, the controller flashes a confirmation and redirects back to the Project Detail page. The assignment routes remain admin-only under the Week 5 authorization rules.

## [00:26-31:00] 4. Role-aware navigation and account data

AI Coach: How does the interface reflect a visitor's signed-in state and role?

Student (draft response): In `server.js`, middleware sets `res.locals.currentUser` from the session account, or to `null` if nobody is signed in. The shared header shows Register and Log In links to visitors. Signed-in users see Dashboard and Log Out. The Registered Users link is shown only to an administrator. The Project Detail page keeps the category reassignment link visible, while its route enforces that only an administrator can use the assignment form and submit changes.

AI Coach: Why do the route checks still matter if the template hides an administrator-only link?

Student (draft response): Template conditions make the page clearer, but they are not a security boundary. Someone can request `/users` or `/edit-project/1` directly. The route middleware checks the role on the server for each request, regardless of which links are visible.

AI Coach: How does the registered-users page avoid exposing password hashes?

Student (draft response): The `getAllAccounts` model query selects only the account ID, first name, last name, email, and role. It does not select `account_password`. The users controller passes those rows to the page, and the EJS template uses escaped output tags to display the values in a table.

AI Coach: If a new Client tries to open the users page directly, what happens?

Student (draft response): The request reaches the route middleware before `showUsers`. Since the account type is not `Admin`, `requireRole('Admin')` sets a flash message and redirects to the dashboard. The controller does not run, and the users query is not made for that request.

## [00:31-35:00] 5. Deployment setup and reflection

AI Coach: What configuration is needed to provision an administrator when the application starts?

Student (draft response): `server.js` creates the account table and calls `ensureAdminAccount` with the configured admin email, password, and optional first and last names. The default email is `admin@example.com`, but `ADMIN_PASSWORD` must be provided outside development or startup fails. The model hashes the configured password and inserts the account as `Admin`; if that email already exists, it updates that account's name, password hash, and role. The deployment must keep the admin password and session secret in environment variables rather than committing real secrets.

AI Coach: What limitation does the current session setup have, and how would you improve it for a larger deployment?

Student (draft response): The app uses `express-session`'s default in-memory store. That is adequate for a small course application, but sessions are lost on restart and are not shared between multiple server instances. For a larger deployment, I would configure a persistent session store shared by the instances and continue using a stable secret from the deployment environment.

AI Coach: Summarize what you learned about authentication and authorization in this project.

Student (draft response): Registration validates account data and stores a salted password hash rather than a plain-text password. Login verifies the password and records a limited account profile in a regenerated session. Logout destroys that session. Authorization middleware checks the session and role on protected routes, including both forms and actions that change data. The interface reflects the signed-in state, but server-side route checks enforce the actual permissions. These features build on the MVC, routing, validation, and database work from earlier weeks.
