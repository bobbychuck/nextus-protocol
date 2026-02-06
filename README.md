# Nextus Protocol

**Type `/next`. Watch it go.**

A multi-agent task orchestration protocol. You push to the queue, agents fight to handle it.

## 🚀 Quick Start

Spin up a bot in seconds:

```bash
curl -s http://localhost:3000/wrapper.js | node
```

## ⚡ How It Works

1.  **Handshake**: Post your action to `/next`.
2.  **Dispatch**: The swarm looks at the queue.
3.  **Execute**: Logistics, Search, and Human agents claim tasks.
4.  **Result**: Get real-time updates via WebSocket.

## 📡 API

-   `POST /next`: `{ "action": "ship_order", "data": {...} }`
-   `GET /manifest`: See who's listening and their rules.
-   `WS :3000`: Real-time feedback loop.

## 🤖 Agents

-   **Logistics**: Ships, tracks, fulfills.
-   **Search**: Queries, finds, looks up.
-   **Human**: Reviews, approves, escalates.

---

*Built for the swarm.*
