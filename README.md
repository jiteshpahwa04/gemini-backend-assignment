# Gemini Backend

## 📚 Table of Contents
1. [Project Overview](#project-overview)  
2. [Feature List](#feature-list)  
3. [Tech Stack & Architecture](#tech-stack--architecture)  
4. [Environment Variables](#environment-variables)  
5. [Local / EC2 Deployment (PM2 + Docker Compose)](#local--ec2-deployment-pm2--docker-compose)  
6. [Running with PM2](#running-with-pm2)  
7. [One-command Stack with Docker Compose](#one-command-stack-with-docker-compose)  
8. [Stripe Setup (Live)](#stripe-setup-live)  
9. [Prisma Commands Cheat-sheet](#prisma-commands-cheat-sheet)  
10. [Google Gemini API Setup](#google-gemini-api-setup)  
11. [Background Worker](#background-worker)  
12. [API Reference](#api-reference)  
13. [Caching Strategy](#caching-strategy)  
14. [Rate Limits](#rate-limits)  
15. [Testing Tips (Stripe & Webhooks)](#testing-tips)  

---

## Project Overview

A chat-style backend that:
- Authenticates users via OTP (phone)  
- Stores chatrooms & messages in PostgreSQL  
- Streams user questions to **Google Gemini** via a Redis-based queue & worker  
- Caches chatroom lists per-user in Redis  
- Handles free **Basic** and paid **Pro** tiers via **Stripe Subscriptions**  
- Enforces a 5-message/day rate limit for **Basic** users, unlimited for **Pro**  
- Provides centralized custom error handling with defined error classes  

---

## Feature List

| Domain            | Functionalities                                                               |
| ----------------- | ---------------------------------------------------------------------------- |
| **Auth**          | Signup, Send OTP, Verify OTP, JWT issuance, Forgot password, Change password |
| **User**          | Get my profile (incl. subscription tier)                                      |
| **Chatrooms**     | Create / list / fetch chatroom, post message → Gemini                        |
| **Subscriptions** | Initiate checkout (returns Stripe URL), Get subscription tier                |
| **Webhooks**      | Capture Stripe payment events to update subscription status                  |
| **Worker**        | Reads Redis stream → calls Gemini → publishes reply                          |
| **Error Handling**| Centralized middleware, custom `BadRequest`, `Unauthorized`, `NotFound`, etc.|
| **Rate limit**    | Basic users: 5 messages/day (per user, Redis counter)                        |
| **Cache**         | Chatroom list cached 5 min (Redis), invalidated on create                    |

---

## Tech Stack & Architecture

**High-level flow:**

1. **Client → Node/Express (PM2)**  
2. **Node/Express → Redis Stream `gemini:requests`**  
3. **Worker ← Redis Stream** → calls Google Gemini → publishes to `gemini:response:<correlationId>`  
4. **Node/Express ← Pub/Sub `gemini:response:*`**  
5. **Data persistence** in PostgreSQL; Redis for cache & rate counters  
6. **Subscriptions** via Stripe Checkout & Webhooks  
7. **Custom error handling** via centralized middleware (`src/util/error`)  

**Key libraries & tools:**

| Area                 | Library / Tool              |
| -------------------- | --------------------------- |
| HTTP server          | **Express**                 |
| ORM / DB client      | **Prisma** → PostgreSQL     |
| AI integration       | **@google/genai**           |
| Billing              | **Stripe SDK**              |
| Queue & cache        | **Redis Streams + Pub/Sub** |
| Process manager      | **PM2** (backend & worker)  |

---

## Environment Variables

| Key                     | Example                                                  | Notes                                |
| ----------------------- | -------------------------------------------------------- | ------------------------------------ |
| `PORT`                  | `3000`                                                   | Express listen port                  |
| `DATABASE_URL`          | `postgresql://postgres:postgres@postgres:5432/gemini_db` |                                      |
| `REDIS_URL`             | `redis://redis:6379`                                     |                                      |
| `JWT_SECRET`            | `supersecret`                                            | 256-bit string                       |
| `GEMINI_API_KEY`        | `…`                                                      | From Google AI Studio                |
| `STRIPE_SECRET_KEY`     | `sk_test_…` / `sk_live_…`                                |                                      |
| `STRIPE_PRO_PRICE_ID`   | `price_…`                                                | Recurring price ID                   |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…`                                                | From Stripe Webhooks settings        |
| `DOMAIN`                | `https://api.example.com`                                | For browser redirects only           |

Create a `.env` file with these keys before running.

---

## Local / EC2 Deployment (PM2 + Docker Compose)

```bash
# 1. Clone & enter the project
git clone https://github.com/jiteshpahwa04/gemini-backend-assignment.git
cd gemini-backend-assignment

# 2. Env setup
cp .env.example .env      # fill in all values

# 3. Install deps & generate Prisma client
npm install
cd src
npx prisma generate        # builds @prisma/client
npx prisma migrate deploy  # applies migrations
cd ..

# 4. Start Postgres & Redis
docker-compose up -d postgres redis

# 5. Launch backend & worker under PM2
pm2 start src/index.js --name backend
pm2 start src/workers/gemini_worker.js --name worker

# 6. Persist PM2 on reboot
pm2 save && pm2 startup
````

---

## Running with PM2

```bash
pm2 start src/index.js                   --name backend
pm2 start src/workers/gemini_worker.js   --name worker
pm2 save && pm2 startup                  # auto-launch on reboot
pm2 logs backend                         # tail server logs
pm2 logs worker                          # tail worker logs
```

---

## One-command Stack with Docker Compose

If you prefer Docker alone:

```bash
docker-compose up --build -d       # backend, postgres, redis
docker-compose logs -f backend
```

*(The Compose file copies `src/prisma`, runs `npm install → prisma migrate deploy → node src/index.js` inside the container.)*

---

## Stripe Setup (Live)

1. In Stripe Dashboard → Products → Price (recurring) → copy **Price ID**.
2. In API Gateway → HTTP API → your deployed stage → note the invoke URL:
   `https://<api-id>.execute-api.<region>.amazonaws.com/prod`
3. In Stripe Dashboard → Developers → Webhooks → Add endpoint:

   ```
   https://<api-id>.execute-api.<region>.amazonaws.com/prod/webhook/stripe
   ```

   * Select events: `checkout.session.completed`, `invoice.payment_failed`.
4. Copy the **Signing Secret** → add to `.env` as `STRIPE_WEBHOOK_SECRET`.
5. Update `.env`:

   ```bash
   STRIPE_SECRET_KEY=sk_live_…
   STRIPE_PRO_PRICE_ID=price_…
   DOMAIN=https://your-frontend-domain.com
   ```
6. Restart backend:

   ```bash
   pm2 restart backend
   ```

---

## Prisma Commands Cheat-sheet

| Purpose                       | Command (run inside `src/`) |
| ----------------------------- | --------------------------- |
| Generate client after `npm i` | `npx prisma generate`       |
| Apply migrations (prod)       | `npx prisma migrate deploy` |
| Push schema (no migrations)   | `npx prisma db push`        |

---

## Google Gemini API Setup

1. Generate an API key at [ai.google.dev/keys](https://ai.google.dev/keys).
2. Add it to `.env` as `GEMINI_API_KEY`.
3. The worker uses model `gemini-2.5-flash` by default (edit in `src/workers/gemini_worker.js`).

---

## Background Worker

File: `src/workers/gemini_worker.js`

* Consumes Redis stream `gemini:requests` (group `gemini-workers`).
* Calls Google Gemini → publishes replies to `gemini:response:<correlationId>`.
* Managed under PM2 as **worker**.

---

## API Reference

| Method & Path                | Auth   | Description                       |
| ---------------------------- | ------ | --------------------------------- |
| `POST /auth/signup`          | –      | Create user `{ phone, name }`     |
| `POST /auth/send-otp`        | –      | Send OTP `{ phone }`              |
| `POST /auth/verify-otp`      | –      | Verify OTP → returns JWT          |
| `POST /auth/forgot-password` | –      | Send reset OTP                    |
| `POST /auth/change-password` | JWT    | Change password `{ newPassword }` |
| `GET /user/me`               | JWT    | Profile + subscription            |
| `POST /chatroom`             | JWT    | Create chatroom `{ name? }`       |
| `GET /chatroom`              | JWT    | List chatrooms (cached)           |
| `GET /chatroom/:id`          | JWT    | Get specific chatroom + messages  |
| `POST /chatroom/:id/message` | JWT    | `{ content }` → Gemini reply      |
| `POST /subscribe/pro`        | JWT    | Returns Stripe Checkout URL       |
| `GET /subscribe/status`      | JWT    | Current subscription record       |
| `POST /webhook/stripe`       | Stripe | Handle subscription events        |

---

## Caching Strategy

* **GET /chatroom**: caches result in Redis at `user:<id>:chatrooms` for 300 s.
* **POST /chatroom**: invalidates that cache key.

---

## Rate Limits

* **Basic tier**: max 5 outbound messages per day (`user:<id>:messages:<YYYY-MM-DD>`).

---

## Testing Tips (Stripe & Webhooks)

* **Stripe test cards**:

  * Success: `4242 4242 4242 4242`
  * Decline: `4000 0000 0000 0002`
* **Stripe CLI** (test mode only):

  ```bash
  stripe listen --forward-to localhost:3000/webhook/stripe
  stripe trigger checkout.session.completed
  ```
* **Logs**: use `pm2 logs` or `docker-compose logs -f backend` to trace flows.