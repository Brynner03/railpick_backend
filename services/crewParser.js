const fs = require("fs");
const path = require("path");
const { PDFParse } = require("pdf-parse");

function parseScheduleBlock(lines) {
  const block = {
    report: null,
    release: null,
    legs: [],
    reliefDays: null,
    coveredBy: null,
    notes: [],
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const parts = trimmed.split("\t").map((p) => p.trim());

    if (trimmed.includes("Report")) {
      const reportIdx = parts.indexOf("Report");
      block.report =
        reportIdx > 0
          ? parts.slice(0, reportIdx).join(" ")
          : parts[parts.length - 1] || parts[0];
    } else if (trimmed.includes("Release")) {
      const releaseIdx = parts.indexOf("Release");
      block.release =
        releaseIdx > 0 ? parts.slice(0, releaseIdx).join(" ") : parts[0];
    } else if (trimmed.includes("Relief Days")) {
      block.reliefDays = trimmed;
    } else if (trimmed.includes("Covered by")) {
      block.coveredBy = trimmed;
    } else if (
      trimmed.includes("Lv.") ||
      trimmed.includes("Arr.") ||
      trimmed.includes("DH to")
    ) {
      // 1. Extract Origin and Destination based on "Lv." and "Arr." keywords
      let origin = null;
      let destination = null;

      const lvIndex = parts.findIndex((p) => p === "Lv." || p.includes("Lv."));
      if (lvIndex > 0) {
        origin = parts[lvIndex - 1];
      }

      const arrIndex = parts.findIndex(
        (p) => p === "Arr." || p.includes("Arr."),
      );
      if (arrIndex > 0) {
        destination = parts[arrIndex - 1];
      }

      // 2. Dynamically find the Train Number (a standalone number not formatted as a time)
      let trainNumber = null;
      for (const part of parts) {
        if (/^\*?\d{1,5}$/.test(part) && !part.includes(".")) {
          trainNumber = part;
          break;
        }
      }

      // 3. Extract Times correctly (Departure at start, Arrival at end)
      const times = parts.filter((p) => /\d{1,2}[\.:]\d{2}/.test(p));

      let arrivalTime =
        parts[0] && /\d{1,2}[\.:]\d{2}/.test(parts[0])
          ? parts[0]
          : times.length > 0
            ? times[0]
            : null;
      let departureTime =
        times.length > 1
          ? times[times.length - 1]
          : times.length === 1
            ? times[0]
            : null;

      // Handle Deadheads explicitly
      if (trimmed.includes("DH to")) {
        destination = trimmed.replace("DH to", "").trim();
        trainNumber = "DH";
        arrivalTime = parts[0];
        departureTime = null;
      }

      block.legs.push({
        departureTime: departureTime,
        arrivalTime: arrivalTime,
        trainNumber: trainNumber,
        origin: origin,
        destination: destination,
        rawLeg: trimmed,
      });
    } else {
      block.notes.push(trimmed);
    }
  }

  return block;
}

async function parseCrewSchedule(crewNum) {
  const filePath = path.join(
    __dirname,
    "../documents",
    "GO 202 2026 Psgr Crew Book.pdf",
  );

  if (!fs.existsSync(filePath)) {
    throw new Error("Crew book PDF not found in documents folder");
  }

  const dataBuffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: dataBuffer });

  let text = "";
  try {
    const pdfData = await parser.getText();
    text = pdfData.text || "";
  } finally {
    await parser.destroy();
  }

  const lines = text.split("\n");
  const crewLines = [];
  let capturing = false;
  const nextCrewNum = String(parseInt(crewNum, 10) + 1);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === crewNum) {
      capturing = true;
    } else if (
      capturing &&
      (line === nextCrewNum ||
        line.startsWith(nextCrewNum + "\t") ||
        line.includes("PASSENGER CREWS") ||
        line.includes("-- "))
    ) {
      capturing = false;
      break;
    }

    if (capturing) {
      crewLines.push(line);
    }
  }

  if (crewLines.length === 0) {
    return null;
  }

  let currentBlockType = "weekday";
  const weekdayLines = [];
  const weekendLines = [];

  for (const line of crewLines) {
    if (line.includes("Sat.-Sun.")) {
      currentBlockType = "weekend";
      continue;
    }

    if (currentBlockType === "weekday") {
      weekdayLines.push(line);
    } else {
      weekendLines.push(line);
    }
  }

  return {
    crewNumber: crewNum,
    schedule: {
      weekday: parseScheduleBlock(weekdayLines),
      weekend: parseScheduleBlock(weekendLines),
    },
    rawDetails: crewLines,
  };
}

module.exports = { parseCrewSchedule };
