const express = require("express");
const router = express.Router();
const axios = require("axios");

// Proxy endpoint for the LIRR Scratch Sheet
router.get("/scratch-sheet", async (req, res) => {
  try {
    const { date, craftGroup } = req.query;
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

// New endpoint to get parsed job counts and preview lists
router.get("/job-summary", async (req, res) => {
  try {
    const { date, craftGroup } = req.query;
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

    // DEBUG: Log the type and structure of what LIRR sent back
    console.log("LIRR Raw Response Type:", typeof lirrResponse.data);
    console.log(
      "LIRR Raw Response Sample:",
      JSON.stringify(lirrResponse.data).slice(0, 300),
    );

    // Ensure we have an array to work with (handles both direct arrays and nested objects)
    const rawRecords = Array.isArray(lirrResponse.data)
      ? lirrResponse.data
      : lirrResponse.data.data || lirrResponse.data.records || [];

    const counts = {
      total: rawRecords.length,
      byPos: { AC: 0, CO: 0, TC: 0 },
    };
    const previewJobs = [];

    rawRecords.forEach((record) => {
      const position = record.position_code || record.position || "Unknown";
      const jobNumber = record.job_number || record.jobNumber || "N/A";
      const reportTime = record.report_time || record.reportTime || "";
      const releaseTime = record.release_time || record.releaseTime || "";

      if (counts.byPos[position] !== undefined) {
        counts.byPos[position]++;
      }

      previewJobs.push({
        jobNumber,
        position,
        service: "passenger",
        reportTime,
        releaseTime,
      });
    });

    res.json({
      success: true,
      date: date || "11/02/2026",
      counts,
      previewJobs: previewJobs.slice(0, 20),
    });
  } catch (error) {
    // Print the exact error stack to your terminal for easy debugging
    console.error("Error parsing LIRR job summary:", error);
    res
      .status(500)
      .json({
        error: "Failed to parse job summary from LIRR data",
        details: error.message,
      });
  }
});

module.exports = router;
