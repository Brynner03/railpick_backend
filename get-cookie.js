require("dotenv").config();
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

async function refreshLirrSession() {
  console.log("Starting Puppeteer to refresh LIRR session cookie...");

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  try {
    await page.goto("https://crew.lirr.org/login.php", {
      waitUntil: "networkidle2",
    });

    // 1. Wait for the disclaimer to be present, then click it via JavaScript evaluation
    await page.waitForSelector("#disclaimer-acknowledge");
    await page.evaluate(() => {
      const checkbox = document.getElementById("disclaimer-acknowledge");
      if (checkbox) {
        checkbox.click();
      }
    });

    // 2. Type your credentials into the fields
    await page.type("#employee-id", process.env.LIRR_EMPLOYEE_ID);
    await page.type("#password", process.env.LIRR_PASSWORD);

    // 3. SUBMIT THE FORM (This was missing!)
    console.log("Clicking login button...");
    await Promise.all([
      page.click("#login-button"),
      page.waitForNavigation({ waitUntil: "networkidle2" }),
    ]);

    // 4. Now grab cookies and find the PHPSESSID after successful login
    const cookies = await page.cookies();
    const phpSessionCookie = cookies.find((c) => c.name === "PHPSESSID");

    if (phpSessionCookie) {
      const sessionId = phpSessionCookie.value;
      console.log(`Success! Got PHPSESSID: ${sessionId}`);

      // 5. Update local .env file
      process.env.PHP_SESSION_ID = sessionId;

      const envPath = path.join(__dirname, ".env");
      let envContent = fs.existsSync(envPath)
        ? fs.readFileSync(envPath, "utf8")
        : "";

      if (envContent.includes("PHP_SESSION_ID=")) {
        envContent = envContent.replace(
          /PHP_SESSION_ID=.*/,
          `PHP_SESSION_ID=${sessionId}`,
        );
      } else {
        envContent += `\nPHP_SESSION_ID=${sessionId}\n`;
      }

      fs.writeFileSync(envPath, envContent);
      console.log("Successfully saved PHPSESSID to .env!");
    } else {
      console.error("Could not find PHPSESSID cookie after login attempt.");
    }
  } catch (error) {
    console.error(
      "Error during automated login session refresh:",
      error.message,
    );
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  refreshLirrSession();
}

module.exports = refreshLirrSession;
