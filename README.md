# Click Win

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![BNB Chain](https://img.shields.io/badge/BNB_Chain-BSC-F0B90B?logo=binance&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

**Click Win** is a digital auction platform built on BNB Chain where each click adds a discount to the prize. The last person to click before the timer reaches zero wins the discounted prize, paid out in USDT (BEP-20) or BNB.

---

## Overview

- Users deposit BNB or USDT to purchase **clicks** at $0.20 each.
- Each click on an active auction adds a small discount to the prize and resets the countdown timer.
- When the timer expires, the last clicker wins the prize at the accumulated discount.
- Payouts are executed on-chain via BNB Chain (BSC).
- A referral system rewards 20% bonus clicks on a referred user's first deposit.

---

## Architecture

```
  Browser (React/Next.js)
      |          ^
      |  REST    |  WebSocket
      v          |
  +-----------------------+
  |   Fastify API + WS    |    <-- packages/backend
  +-----------+-----------+
              |
     +--------+---------+
     |                   |
  +--v--+          +-----v-----+
  | PG  |          |   Redis   |
  +--+--+          +-----+-----+
     |                   |
     |    +--------------+------------+
     |    |              |            |
     | +--v---+   +------v-----+  +--v--------+
     | |Watcher|   | Settlement |  | Pub/Sub   |
     | +-------+   +------------+  +-----------+
     |   packages/     packages/
     |   watcher       settlement
     |
  +--v----------+
  | BNB Chain   |
  | (BSC)       |
  +-------------+
```

### 5 Phases

| Phase | Service        | Description                                          |
| ----- | -------------- | ---------------------------------------------------- |
| 1     | Shared         | TypeScript types, constants, and shared utilities    |
| 2     | Backend        | Fastify REST API, WebSocket, auction engine          |
| 3     | Frontend       | React/Next.js UI with wallet integration             |
| 4     | Watcher        | On-chain deposit detector and confirmation tracker   |
| 5     | Settlement     | Prize calculation and on-chain payout execution      |

---

## Tech Stack

| Layer      | Technology                                          |
| ---------- | --------------------------------------------------- |
| Frontend   | React, Next.js, Tailwind CSS, ethers.js, react-i18next |
| Backend    | Fastify, Redis, PostgreSQL, WebSocket               |
| Blockchain | BNB Chain (BSC), USDT BEP-20, HD Wallet (BIP-44)   |
| DevOps     | Docker, GitHub Actions, Railway / Render            |

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/click-win.git
cd click-win

# 2. Copy environment file
cp .env.example .env
# Edit .env with your values (database, Redis, wallet keys, etc.)

# 3. Start infrastructure (PostgreSQL + Redis)
docker-compose up -d

# 4. Install dependencies
npm install

# 5. Run database migrations
npm run db:migrate

# 6. Start backend (API + WebSocket)
npm run dev:backend

# 7. Start frontend (in a separate terminal)
npm run dev:frontend
```

Additional services (run in separate terminals as needed):

```bash
# Deposit watcher (on-chain monitoring)
npm run dev:watcher

# Settlement service (prize payouts)
npm run dev:settlement
```

---

## Project Structure

```
click-win/
├── .env.example                 # Environment variable template
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI pipeline
├── docker-compose.yml           # PostgreSQL + Redis for local dev
├── package.json                 # Root workspace config (npm workspaces)
├── tsconfig.base.json           # Shared TypeScript configuration
├── README.md                    # This file
│
├── shared/                      # @click-win/shared
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts             # Re-exports
│       ├── types.ts             # All TypeScript interfaces
│       └── constants.ts         # Platform constants and Redis keys
│
├── packages/
│   ├── backend/                 # @click-win/backend
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── Dockerfile
│   │   ├── migrations/          # PostgreSQL migration files
│   │   │   └── 001_initial_schema.sql
│   │   └── src/
│   │       ├── server.ts        # Fastify app entry point
│   │       ├── db/              # Database pool and migration runner
│   │       ├── middleware/       # Auth, rate-limit middleware
│   │       ├── redis/           # Redis client and Lua scripts
│   │       ├── routes/          # REST API route handlers
│   │       ├── services/        # Business logic services
│   │       └── ws/              # WebSocket handler
│   │
│   ├── frontend/                # @click-win/frontend
│   │   ├── Dockerfile
│   │   ├── public/
│   │   │   └── locales/         # i18n translations (en, pt-BR, es)
│   │   └── src/
│   │       ├── components/      # React components
│   │       ├── contexts/        # React context providers (Wallet)
│   │       ├── hooks/           # Custom React hooks
│   │       ├── i18n/            # i18n configuration
│   │       ├── pages/           # Next.js pages
│   │       └── utils/           # API client, WebSocket client
│   │
│   ├── watcher/                 # @click-win/watcher
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       └── index.ts         # Deposit watcher entry point
│   │
│   └── settlement/              # @click-win/settlement
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts         # Entry point (Redis subscriber + health)
│           ├── config.ts        # Environment configuration
│           ├── calculator.ts    # Prize breakdown calculation
│           ├── executor.ts      # On-chain transaction execution
│           ├── processor.ts     # Settlement orchestration
│           └── auditor.ts       # Audit logging
```

---

## Environment Variables

| Variable              | Description                                    | Default                                      |
| --------------------- | ---------------------------------------------- | -------------------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string                   | `postgresql://clickwin:...@localhost:5432/clickwin` |
| `REDIS_URL`           | Redis connection string                        | `redis://localhost:6379`                     |
| `JWT_SECRET`          | Secret for JWT token signing                   | (required)                                   |
| `HD_XPUB`             | BIP-44 extended public key for deposit addresses | (required)                                 |
| `HOT_WALLET_KEY`      | Hot wallet private key (settlement only)       | (required for settlement)                    |
| `BNB_RPC_URL`         | BNB Chain RPC endpoint                         | `https://bsc-dataseed1.binance.org`          |
| `ALCHEMY_API_KEY`     | Alchemy API key for enhanced RPC               | (optional)                                   |
| `USDT_CONTRACT`       | USDT BEP-20 contract address on BSC            | `0x55d398326f99059fF775485246999027B3197955`  |
| `MIN_CONFIRMATIONS`   | Required block confirmations for deposits      | `15`                                         |
| `PRICE_PER_CLICK`     | USDT cost per click                            | `0.20`                                       |
| `REFERRAL_BONUS_PCT`  | Referral bonus percentage (first deposit)      | `0.20` (20%)                                 |
| `PLATFORM_FEE_PCT`    | Platform fee on prize payouts                  | `0` (0%)                                     |
| `CORS_ORIGIN`         | Allowed CORS origin                            | `https://clickwin.fun`                       |
| `PORT`                | Backend HTTP port                              | `3000`                                       |
| `WS_PORT`             | WebSocket port                                 | `3001`                                       |
| `NODE_ENV`            | Environment (development/production)           | `development`                                |

---

## API Reference

| Method | Endpoint                    | Auth | Description                          |
| ------ | --------------------------- | ---- | ------------------------------------ |
| GET    | `/auth/nonce/:address`      | No   | Get nonce for wallet signature       |
| POST   | `/auth/verify`              | No   | Verify signature, issue JWT          |
| GET    | `/auctions`                 | No   | List active auctions                 |
| GET    | `/auctions/:id`             | No   | Get auction details                  |
| POST   | `/auctions/:id/click`       | JWT  | Submit a click on an auction         |
| GET    | `/me/balance`               | JWT  | Get user's click balance             |
| GET    | `/me/deposit-address`       | JWT  | Get or create deposit address        |
| GET    | `/me/deposits`              | JWT  | List user's deposit history          |
| GET    | `/me/referral`              | JWT  | Get referral stats and code          |
| GET    | `/me/referral/history`      | JWT  | Get referral reward history          |

---

## WebSocket Events

| Event              | Direction       | Description                                 |
| ------------------ | --------------- | ------------------------------------------- |
| `subscribe`        | Client -> Server | Subscribe to auction updates                |
| `click`            | Client -> Server | Submit a click (authenticated)              |
| `auction:state`    | Server -> Client | Full auction state snapshot                 |
| `auction:click`    | Server -> Client | New click on auction (discount + timer)     |
| `auction:ended`    | Server -> Client | Auction timer expired, winner announced     |
| `balance:updated`  | Server -> Client | User's click balance changed                |
| `referral:bonus`   | Server -> Client | Referral bonus clicks credited              |
| `error`            | Server -> Client | Error message                               |

---

## Referral System

Click Win includes a built-in referral program:

1. Every user receives a unique 6-character referral code upon registration.
2. New users can enter a referral code during wallet verification.
3. When the referred user makes their **first deposit**, the referrer earns a **20% bonus** in clicks (based on the deposit's click value).
4. Both the referrer and referred user are notified in real time via WebSocket.

---

## Security

- **Wallet-based authentication**: Users sign a nonce with their BNB Chain wallet (no passwords).
- **JWT tokens**: Short-lived (1 hour) tokens for API authentication.
- **HD wallet deposit addresses**: Each user gets a unique BIP-44 derived deposit address. Only the extended public key is stored on the backend; private keys remain in the settlement service.
- **Rate limiting**: API (100 req/min/IP), WebSocket (10 msg/sec), click cooldown (500ms).
- **Input validation**: All API inputs are validated and sanitized.
- **Audit logging**: Every settlement, payout, and critical operation is logged to the `audit_logs` table with full payloads.
- **On-chain confirmation**: Deposits require 15 block confirmations before crediting.
- **CORS**: Restricted to the configured origin domain.

---

## License

This project is licensed under the [MIT License](LICENSE).
