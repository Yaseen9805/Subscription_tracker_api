# Subscription Tracker API

![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?logo=jsonwebtokens&logoColor=white)
![Upstash](https://img.shields.io/badge/Upstash-00E9A3?logo=upstash&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?logo=eslint&logoColor=white)

## Short description

A REST API for tracking recurring subscriptions, built with Node and Express. It handles user auth, subscription CRUD, works out renewal dates automatically, and schedules renewal reminders through Upstash Workflow/QStash.

## Technologies

Node.js (ESM), Express 4, MongoDB with Mongoose 8, JWT and bcrypt for auth, Arcjet for bot detection and rate limiting, Upstash Workflow (QStash) for scheduling, dayjs for date handling, ESLint

## Features

- Signup, signin, and signout with JWT-based auth and bcrypt-hashed passwords
- Signup runs inside a MongoDB transaction so a new user is created atomically
- Subscriptions store a start date and frequency; the renewal date is calculated automatically if it isn't provided
- A subscription's status flips to expired on its own once the renewal date has passed
- Creating a subscription kicks off an Upstash Workflow run that schedules reminders at 7, 5, 2, and 1 days before renewal
- Arcjet middleware adds bot detection, a WAF-style shield, and rate limiting to every request
- Centralized error handling normalizes Mongoose cast, validation, and duplicate-key errors into consistent JSON responses

## The process

The goal was to build something closer to a real backend service than a typical CRUD tutorial, so most of the effort went into the auth flow and the scheduling side rather than just basic routes. Wrapping user creation in a Mongoose transaction was one of the trickier parts, since it means the database has to run as a replica set rather than a standalone instance. Wiring up Upstash Workflow to schedule several reminders ahead of a renewal date, instead of just firing a single reminder, was the other main piece of work, along with adding Arcjet in front of the routes for basic abuse protection.

## What I learned

- Using Mongoose transactions and sessions to keep multi-step writes atomic
- Structuring an Express app with separate config, controller, middleware, and route layers
- Scheduling delayed, multi-step jobs with Upstash Workflow instead of relying on a simple cron job
- Adding request-level security (bot detection, rate limiting) with Arcjet
- Centralizing error handling so controllers don't need repetitive try/catch logic for every error type

## How it can be improved

- Wire up the stubbed subscription and user endpoints (list, update, delete, cancel) that currently just return placeholders
- Replace the reminder logging with actual email or SMS delivery
- Add automated tests for the auth flow and subscription lifecycle
- Add pagination and filtering to the list endpoints

## How to run the project

1. Clone the repo and run `npm install`
2. Create a `.env.development.local` file with your MongoDB URI, JWT secret, Arcjet key, and Upstash QStash credentials
3. Run `npm run dev` to start the server with nodemon
4. The API listens on `http://localhost:<PORT>` under the `/api/v1` prefix
