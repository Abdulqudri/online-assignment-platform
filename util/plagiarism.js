const { Copyleaks } = require("plagiarism-checker");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const ngrok_url = process.env.NGROK_URL;
// Initialize Copyleaks API
const copyleaks = new Copyleaks();

const EMAIL = process.env.EMAIL; // Set in your .env file
const API_KEY = process.env.COPY_LEAK_API_KEY; // Set in your .env file
const copyleaksAuth = async () => {
  try {
    const authToken = await copyleaks.loginAsync(EMAIL, API_KEY);
    return authToken; // Save this token for further API calls
  } catch (error) {
    console.error("Error authenticating with Copyleaks:", error.message);
    throw error;
  }
};

const scanFile = async (submission) => {
  try {
    const token = await copyleaksAuth();
    if (!token) {
      return res
        .status(500)
        .json({ message: "Failed to authenticate with Copyleaks API" });
    }
    const filename = submission.filePath.replace("/uploads/", "");

    const filePath = path.join(
      __dirname,
      "../uploads",
      submission.filePath.replace("/uploads/", "")
    );
    const fileStream = await fs.promises.readFile(filePath);
    const scanId = uuidv4();

    // Submit content for plagiarism check
    const scanPayload = {
      base64: fileStream.toString("base64"), // Path to the file you want to check
      filename: filename,
      properties: {
        sandbox: true, // Set to false for production
        webhooks: {
          status: `${ngrok_url}/webhook/{STATUS}/${scanId}/${submission._id}`,
        },
        cheatDetection: true,
        aiGeneratedText: {
          detect: true,
        },
      },
    };

    // Submit the file for plagiarism scanning
    await copyleaks.submitFileAsync(token, scanId, scanPayload);
  } catch (error) {
    console.error("Error scanning file:", error);
  }
};



module.exports = { scanFile };
