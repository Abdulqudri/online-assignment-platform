const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const CopyleaksCloud = require("plagiarism-checker");

const EMAIL = process.env.EMAIL;
const API_KEY = process.env.COPY_LEAK_API_KEY;
const NGROK_URL = process.env.NGROK_URL;

if (!EMAIL || !API_KEY) {
  throw new Error("Missing EMAIL or COPY_LEAK_API_KEY in environment");
}

// Now Copyleaks should be a valid constructor
const copyleaks = new CopyleaksCloud()

async function getAuthToken() {
  try {
    await copyleaks.login(EMAIL,API_KEY)
  } catch (err) {
    console.error("Copyleaks login failed:", err);
    throw err;
  }
}

async function scanFile(submission) {
  const scanId = uuidv4();
  await getAuthToken();

  const filename = path.basename(submission.filePath);
  const fullPath = path.join(__dirname, "..", "uploads", filename);

  let fileBuffer;
  try {
    fileBuffer = await fs.promises.readFile(fullPath);
  } catch (err) {
    console.error("Failed to read upload:", err);
    throw new Error("Upload not found");
  }

  const scanOptions = {
    scanId,
    fileName: filename,
    base64: fileBuffer.toString("base64"),
    properties: {
      sandbox: true,
      webhooks: {
        status: `${NGROK_URL}/webhook/{STATUS}/${scanId}/${submission._id}`,
      },
      cheatDetection: true,
      aiGeneratedText: { detect: true },
    },
  };

  try {
    await copyleaks.createByFile(fileBuffer);
    console.log(`Scan ${scanId} submitted successfully.`);
    return scanId;
  } catch (err) {
    console.error("Error submitting scan:", err);
    throw err;
  }
}

module.exports = { scanFile };
