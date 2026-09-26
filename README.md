<img src="public/icon.svg" alt="Tasks logo" width="64" height="64">

# Tasks

A self-hosted kanban board, to-do list, and sticky notes app.

![Screenshot of a board](docs/board.jpg)

## Features

* Kanban boards with up to six sections
* Tasks with priorities, deadlines, and Markdown descriptions
* Drag and drop to reorder tasks, move them between sections, and reorder boards
* A to-do list with deadlines and drag-and-drop reordering
* Sticky notes with nine colors, Markdown support, and a trash that keeps the 50 most recent deleted notes
* Search across tasks, to-dos, and sticky notes, with links directly to each result
* Light and dark themes, with an option to follow the system theme
* Mobile support: swipe between sections and press and hold to drag
* Multiple users, each with their own boards, to-dos, and notes

## Boards, To-Do and Sticky Notes

### Boards

![Screenshot of a board in the dark theme](docs/board-dark.jpg)

Task cards are color-coded by priority, and overdue deadlines turn red. Boards are listed in the sidebar, with the search box above them.

### To-Do

![Screenshot of the to-do list](docs/todo.jpg)

A simple to-do list for keeping track of things outside your boards.

### Sticky Notes

![Screenshot of the sticky note board](docs/sticky-notes.jpg)

A freeform board where you can place notes wherever you want. Hover over a note to change its color, edit it, or delete it.

## Running it

You need a PostgreSQL server. If you're running the app without Docker, you'll also need Node.js 24 or newer.

First, create the database. `setup-database.sql` creates the `tasks_db` database and the `tasks_user` role. Change the password in the file before running it:

```bash
psql -h YOUR_POSTGRES_HOST -U postgres -f setup-database.sql
```

### Locally

```bash
cp .env.example .env    # fill it in, see Configuration below
npm install
npx prisma db push      # creates the tables
npm run dev
```

Then open http://localhost:3000/setup and create the admin account.

### With Docker

```bash
docker build -t tasks .

docker run -d --name tasks -p 3000:3000 \
  -e TASKS_DATABASE_URL="postgresql://tasks_user:YOUR_PASSWORD@YOUR_POSTGRES_HOST:5432/tasks_db" \
  -e TASKS_NEXTAUTH_SECRET="YOUR_SECRET" \
  -e TASKS_NEXTAUTH_URL="https://tasks.example.com" \
  tasks
```

The container runs `prisma db push` on startup to create or update the tables.

Then create the admin account at `/setup`.

### Configuration

| Variable                   | Description                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------- |
| `TASKS_DATABASE_URL`       | PostgreSQL connection string                                                        |
| `TASKS_NEXTAUTH_SECRET`    | Secret used to sign the session cookie. Generate one with `openssl rand -base64 32` |
| `TASKS_NEXTAUTH_URL`       | Public URL of the app. When it starts with `https://`, cookies are marked as secure |
| `TASKS_AUTH`               | `local` (default) or `oidc`                                                         |
| `TASKS_OIDC_ISSUER`        | OIDC issuer URL                                                                     |
| `TASKS_OIDC_CLIENT_ID`     | OIDC client ID                                                                      |
| `TASKS_OIDC_CLIENT_SECRET` | OIDC client secret                                                                  |
| `TASKS_OIDC_NAME`          | Provider name on the sign-in button. Defaults to `SSO`                              |

### Authentication

Set `TASKS_AUTH` to `local` (default) or `oidc`.

**local**: accounts and passwords are stored in Tasks. The first account, created at `/setup`, is the admin.

**oidc**: users sign in through an OpenID Connect provider and are managed there. Password login, `/setup`, and user management are disabled. Everyone is a regular user.

The login page has a single sign-in button that redirects to the provider. On the first sign-in, Tasks links the user to the account with the same email, or creates a new account. After that, users are matched by their provider ID. Username and email changes in the provider are synced to Tasks on sign-in.

A provider account without an email, or with an email already linked to a different provider account, can't sign in.

Signing out of Tasks doesn't sign you out of the provider. To switch accounts, sign out of the provider.

To set it up:

1. Register Tasks in the provider as a confidential client, with the redirect URI `https://tasks.example.com/api/auth/callback/oidc`.
2. Configure the provider to sign ID tokens with RS256. HS256 isn't supported.
3. Set `TASKS_AUTH=oidc` and the `TASKS_OIDC_*` variables.

> [!WARNING]
> Tasks trusts the email address from the provider and uses it to link existing accounts. Only use a provider you control.

## Architecture

![Architecture diagram](docs/architecture.svg)

The app is a single Next.js application that serves both the UI and the API. Markdown is rendered in the browser.

* Authentication uses NextAuth with a JWT session cookie. `src/proxy.ts` redirects unauthenticated users to `/login`.
* Data is stored in PostgreSQL using Prisma. API routes only read and write data belonging to the signed-in user.

## Development

```bash
npm test
npm run lint
```

## License

[MIT](LICENSE)
