const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Conditionally require get-cookie so it doesn't load Puppeteer during tests
let refreshLirrSession;
if (process.env.NODE_ENV !== "test") {
  refreshLirrSession = require("./get-cookie");
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mount Modular Routes
app.use("/api", require("./routes/lirr"));
app.use("/api", require("./routes/crew"));

// Only listen if run directly (node server.js)
if (require.main === module) {
  refreshLirrSession().then(() => {
    app.listen(PORT, () => {
      console.log(`LIRR Backend proxy running on http://localhost:${PORT}`);
    });
  });
}

module.exports = app;
