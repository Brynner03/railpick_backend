# LIRR Job Tracker & Scratch Sheet Backend

A secure Node.js & Express proxy backend designed to fetch, authenticate, and process daily board awards and scratch sheets from the internal LIRR crew portal (`crew.lirr.org`).

---

## Features

- **Secure Proxy Routing:** Bypasses CORS restrictions and securely attaches active session credentials to internal LIRR API requests.
- **Automated Session Handling:** Manages session cookies to maintain smooth communication with the backend crew portal.
- **Earnings & Wage Calculation Ready:** Structured to compute overtime (time-and-a-half after 8 hours), daily guarantees, and tiered wage progressions for Assistant Conductors and Conductors.

---

## Tech Stack

- **Node.js & Express:** Lightweight server framework for handling proxy routes and business logic.
- **Axios:** HTTP client for communicating with internal endpoints.
- **Puppeteer _(Planned)_:** Automated headless browser management for persistent cookie handling.
- **Dotenv:** Secure environment variable configuration.

---

## Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/railpick_backend.git](https://github.com/your-username/railpick_backend.git)
   cd railpick_backend
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure your environment variables:**
   Create a `.env` file in the root directory and add your configuration:

```bash
PORT=5000
PHP_SESSION_ID=your_active_session_cookie_here
```

4. **Run the server:**

```bash
node server.js
```

The server will spin up locally at (`http://localhost:5000`).

## API Endpoints

### `GET /api/scratch-sheet`

Fetches the daily board awards and job details for a specified date and craft group.

- **Query Parameters:**
  - `date` _(optional)_: The target schedule date (e.g., `11/03/2026`).
  - `craftGroup` _(optional)_: The craft group filter (default: `TS`).

---

## License

Personal project for operational workflow optimization.
