// src/lib/copyleaks.js
const plagiarismChecker = require("plagiarism-checker");
const Copyleaks = 
  // if it’s a named export
  (plagiarismChecker.Copyleaks)
  // or if it’s the default export
  || plagiarismChecker.default
  // or if the module itself is the constructor
  || plagiarismChecker;

const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const EMAIL = process.env.EMAIL;
const API_KEY = process.env.COPY_LEAK_API_KEY;
const NGROK_URL = process.env.NGROK_URL;

if (!EMAIL || !API_KEY) {
  throw new Error("Missing EMAIL or COPY_LEAK_API_KEY in environment");
}

// Now Copyleaks should be a valid constructor
const copyleaks = new Copyleaks({
  email: EMAIL,
  apiKey: API_KEY,
});

let _authToken = null;
async function getAuthToken() {
  if (_authToken) return _authToken;
  try {
    const { accessToken, expiresIn } = await copyleaks.loginAsync();
    _authToken = accessToken;
    setTimeout(() => { _authToken = null; }, (expiresIn - 60) * 1000);
    return _authToken;
  } catch (err) {
    console.error("Copyleaks login failed:", err);
    throw err;
  }
}

async function scanFile(submission) {
  const scanId = uuidv4();
  const token = await getAuthToken();

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
    await copyleaks.createScan(token, scanOptions);
    console.log(`Scan ${scanId} submitted successfully.`);
    return scanId;
  } catch (err) {
    console.error("Error submitting scan:", err);
    throw err;
  }
}

module.exports = { scanFile };
