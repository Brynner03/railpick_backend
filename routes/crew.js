const express = require("express");
const router = express.Router();
const { parseCrewSchedule } = require("../services/crewParser");

router.get("/crew/:crewNum", async (req, res) => {
  try {
    const crewNum = req.params.crewNum;
    const result = await parseCrewSchedule(crewNum);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: `Crew ${crewNum} not found in document`,
      });
    }

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error parsing crew details:", error.message);
    res.status(500).json({
      error: "Failed to parse crew details from PDF",
      details: error.message,
    });
  }
});

module.exports = router;
