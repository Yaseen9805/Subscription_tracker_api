# Subscription Tracker API

A Node.js/Express REST API for tracking recurring subscriptions — user auth, subscription CRUD, automatic renewal-date calculation, and scheduled renewal reminders via Upstash Workflow/QStash.

## Features

- **Authentication** — signup/signin/signout with JWT, hashed passwords (bcrypt), and a transactional signup (MongoDB session) to guarantee atomic user creation.
- **Subscriptions** — create subscriptions with a `startDate` and `frequency`; `renewalDate` is auto-calculated on save if not provided, and `status` auto-flips to `expired` once the renewal date has passed.
- **Renewal reminders** — creating a subscription can trigger an Upstash Workflow run that schedules reminders 7/5/2/1 days before renewal (currently logs each reminder — hook in email/SMS delivery as needed).
- **Security middleware** — [Arcjet](https://arcjet.com) provides bot detection, a shield/WAF layer, and token-bucket rate limiting on every request.
- **Centralized error handling** — Mongoose `CastError`, duplicate-key, and validation errors are normalized into consistent JSON error responses.

## Tech Stack

- **Runtime**: Node.js (ESM / `"type": "module"`)
- **Framework**: Express 4
- **Database**: MongoDB with Mongoose 8
- **Auth**: jsonwebtoken, bcryptjs, cookie-parser
- **Security**: @arcjet/node
- **Scheduling**: @upstash/workflow (QStash)
- **Dates**: dayjs
- **Tooling**: ESLint, nodemon

## Prerequisites

- Node.js and npm
- A MongoDB connection string
  - Signup uses a Mongoose transaction, so the database must be a **replica set** (any MongoDB Atlas cluster satisfies this by default; a plain standalone `mongod` does not).
- An [Arcjet](https://arcjet.com) API key (used for bot detection / rate limiting middleware)
- An [Upstash QStash](https://upstash.com/docs/qstash) token + URL (used to schedule renewal reminders)

## Installation

```bash
npm install
```

## Configuration

Environment variables are loaded from `.env.<NODE_ENV>.local` (see `config/env.js`), defaulting to `.env.development.local` when `NODE_ENV` is unset. Create that file in the project root with:

```bash
PORT=5500
SERVER_URL=<your server's public URL, e.g. an ngrok tunnel in dev>
NODE_ENV=development

DB_URI=<your MongoDB connection string>

JWT_SECRET=<your JWT signing secret>
JWT_EXPIRES_IN=1d

ARCJET_KEY=<your Arcjet API key>
ARCJET_ENV=development

QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=<your Upstash QStash token>
```

For a production deployment, create `.env.production.local` with the equivalent production values (`NODE_ENV=production` enables the renewal-reminder workflow trigger automatically on subscription creation).

## Usage

```bash
npm run dev    # start with nodemon (auto-restart on changes)
npm start      # start normally
```

The API listens on `http://localhost:<PORT>` and connects to MongoDB on startup.

> Arcjet's bot-detection rule blocks requests without a recognized browser/allowed client signature by default — plain `curl` requests will get a 403 `Bot detected`. Use a browser, Postman, or another allow-listed client (see `config/arcjet.js`) when testing manually.

## API Endpoints

All routes are prefixed with `/api/v1`. Routes marked *(stub)* return a placeholder response and are not yet wired to a controller.

### Auth (`/auth`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/signup` | Create a user, returns a JWT |
| POST | `/signin` | Authenticate, returns a JWT |
| POST | `/signout` | Sign out |

### Subscriptions (`/subscriptions`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | — | List all subscriptions *(stub)* |
| GET | `/upcoming-renewals` | — | Upcoming renewals *(stub)* |
| GET | `/user/:id` | required | Get a given user's subscriptions |
| GET | `/:subscriptionId/workflow` | required | Get the Upstash workflow status for a subscription's reminders |
| GET | `/:id` | — | Get subscription details *(stub)* |
| POST | `/` | required | Create a subscription |
| PUT | `/:id` | — | Update a subscription *(stub)* |
| DELETE | `/:id` | — | Delete a subscription *(stub)* |
| PUT | `/:id/cancel` | — | Cancel a subscription *(stub)* |

### Users (`/users`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | — | List all users |
| GET | `/:id` | required | Get a user by id |
| POST | `/` | — | Create a user *(stub)* |
| PUT | `/:id` | — | Update a user *(stub)* |
| DELETE | `/:id` | — | Delete a user *(stub)* |

### Workflows (`/workflows`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/subscriptions/reminder` | Upstash Workflow entry point that runs the renewal-reminder schedule; triggered internally by QStash, not intended for direct client calls |

Authenticated routes expect `Authorization: Bearer <token>`.

## Project Structure

```
backend/
├── app.js                        # Express app entry point
├── config/
│   ├── arcjet.js                 # Arcjet rules: shield, bot detection, rate limiting
│   ├── env.js                    # Loads env vars from .env.<NODE_ENV>.local
│   └── upstash.js                # Upstash Workflow client
├── controllers/
│   ├── auth.controller.js
│   ├── subscription.controller.js
│   ├── user.controller.js
│   └── workflow.controller.js
├── database/
│   └── mongodb.js                # Mongoose connection
├── middlewares/
│   ├── arcjet.middlewares.js
│   ├── auth.middlewares.js       # JWT verification
│   └── error.middleware.js       # Centralized error handler
├── models/
│   ├── subscription.model.js
│   └── user.model.js
└── routes/
    ├── auth.routes.js
    ├── subscription.routes.js
    ├── users.routes.js
    └── workflow.routes.js
```

## Linting

```bash
npx eslint .
```
