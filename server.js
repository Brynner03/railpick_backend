const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

// Conditionally require get-cookie so it doesn't load Puppeteer during tests
let refreshLirrSession;
if (process.env.NODE_ENV !== "test") {
  refreshLirrSession = require("./get-cookie");
}

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Proxy endpoint for the LIRR Scratch Sheet / Daily Board Awards
app.get("/api/scratch-sheet", async (req, res) => {
  try {
    const { date, craftGroup } = req.query;
    // Always load the latest PHP_SESSION_ID from process.env
    const phpSessionId = process.env.PHP_SESSION_ID;

    const lirrResponse = await axios.get(
      `https://crew.lirr.org/services/daily-board-awards/get-daily-board-awards-details.php`,
      {
        params: {
          craft_group: craftGroup || "TS",
          craft_group_description: "PASSENGER+TRAINMEN",
          scheduled_date: date || "11/02/2026",
        },
        headers: {
          Cookie: `PHPSESSID=${phpSessionId}`,
          "X-Requested-With": "XMLHttpRequest",
          Referer: "https://crew.lirr.org/",
        },
      },
    );

    res.json(lirrResponse.data);
  } catch (error) {
    console.error("Error fetching LIRR data:", error.message);
    res.status(500).json({ error: "Failed to fetch scratch sheet from LIRR" });
  }
});

// Only listen if this file is run directly (node server.js)
if (require.main === module) {
  refreshLirrSession().then(() => {
    app.listen(PORT, () => {
      console.log(`LIRR Backend proxy running on http://localhost:${PORT}`);
    });
  });
}

// Export app for Jest/Supertest
module.exports = app;
