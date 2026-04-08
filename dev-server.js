/**
 * Development server to test the translation API locally
 * This mimics the Vercel serverless environment for development
 */
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Import the translation function
// Since we're simulating Vercel's environment, we'll implement it directly
function loadTranslateModule() {
  try {
    // First try to require from api directory
    const bingTranslate = require("./api/node_modules/bing-translate-api");
    return bingTranslate.translate; // The actual translate function is the .translate property
  } catch (e) {
    try {
      // Fallback: try to require from current directory node_modules
      const bingTranslate = require("bing-translate-api");
      return bingTranslate.translate; // The actual translate function is the .translate property
    } catch (e2) {
      return null;
    }
  }
}

let translate = loadTranslateModule();

// Helper function to determine if a value should be translated
const shouldTranslateField = (key, value) => {
  // Skip if value is not a string or is empty
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  // Skip technical fields that shouldn't be translated
  const skipFields = [
    "id",
    "mapping",
    "autoPopulate",
    "dependOnField",
    "dependOnValue",
    "advanceCondition",
    "value",
    "symbol",
    "fileType",
    "fileName",
    "fileSize",
    "subLabelFontStyle",
    "subLabelHeadingColor",
  ];

  if (skipFields.includes(key)) {
    return false;
  }

  // Skip values that look like technical data (IDs, codes, etc.)
  if (
    /^[a-zA-Z0-9_-]+$/.test(value) &&
    value.length < 50 &&
    !value.includes(" ")
  ) {
    return false;
  }

  return true;
};

// Helper function to translate a single text value
const translateText = async (text, targetLanguage) => {
  if (!text || typeof text !== "string" || !text.trim()) {
    return text;
  }

  try {
    const result = await translate(text, null, targetLanguage);
    return result.translation || text;
  } catch (error) {
    return text; // Return original text if translation fails
  }
};

// Deep object translation function
const translateObjectDeep = async (obj, targetLanguage, path = "") => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    const translatedArray = [];
    for (let i = 0; i < obj.length; i++) {
      translatedArray[i] = await translateObjectDeep(
        obj[i],
        targetLanguage,
        `${path}[${i}]`,
      );
    }
    return translatedArray;
  }

  // Handle primitive types
  if (typeof obj !== "object") {
    return obj;
  }

  // Handle objects
  const translatedObj = {};

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof value === "string") {
      // Check if this field should be translated
      if (shouldTranslateField(key, value)) {
        translatedObj[key] = await translateText(value, targetLanguage);
      } else {
        translatedObj[key] = value;
      }
    } else if (typeof value === "object") {
      // Recursively translate nested objects/arrays
      translatedObj[key] = await translateObjectDeep(
        value,
        targetLanguage,
        currentPath,
      );
    } else {
      // Keep other data types as-is (numbers, booleans, etc.)
      translatedObj[key] = value;
    }
  }

  return translatedObj;
};

// Function to handle bulk code list translation (JSON strings)
const translateBulkCodeList = async (bulkCodeList, targetLanguage) => {
  try {
    // Parse the JSON string
    const codeListObj = JSON.parse(bulkCodeList);

    // Translate only the keys (labels), keep values unchanged
    const translatedObj = {};
    for (const [key, value] of Object.entries(codeListObj)) {
      const translatedKey = await translateText(key, targetLanguage);
      translatedObj[translatedKey] = value;
    }

    // Return as formatted JSON string
    return JSON.stringify(translatedObj, null, 2);
  } catch (error) {
    return bulkCodeList; // Return original if parsing fails
  }
};

// API route that mimics Vercel's /api/* routing
app.post("/api/translate", async (req, res) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
  );

  try {
    const { text, object, targetLanguage, mode } = req.body;

    // Validate target language
    if (!targetLanguage || typeof targetLanguage !== "string") {
      return res.status(400).json({
        error:
          'Missing or invalid "targetLanguage" parameter. Must be a valid language code (e.g., "es", "fr", "de").',
      });
    }

    // Validate translation input - accept either text OR object
    let translationInput;
    let isObjectTranslation = false;

    if (object !== undefined) {
      translationInput = object;
      isObjectTranslation = true;
    } else if (text !== undefined) {
      if (typeof text !== "string" || text.trim() === "") {
        return res.status(400).json({
          error: 'Parameter "text" must be a non-empty string',
        });
      }
      translationInput = text.trim();
    } else {
      return res.status(400).json({
        error: 'Either "text" (string) or "object" (any) parameter is required',
      });
    }

    // Check if translation is available
    if (!translate) {
      return res.status(503).json({
        error:
          "Translation service not available. Please run: cd api && npm install",
        details: "bing-translate-api module not found",
      });
    }

    let translationResult;

    if (isObjectTranslation) {
      // Handle object translation
      if (mode === "bulkCodeList") {
        // Handle bulk code list translation (only translate keys, keep values)
        const translatedObj = {};
        for (const [key, value] of Object.entries(translationInput)) {
          const translatedKey = await translateText(key, targetLanguage);
          translatedObj[translatedKey] = value;
        }
        translationResult = {
          translatedObject: translatedObj,
          sourceLanguage: "auto-detected",
          targetLanguage: targetLanguage,
          originalInput: translationInput,
          cached: false,
          isObjectMode: true,
        };
      } else {
        // Deep object translation (translate values, keep keys)
        const translatedObj = await translateObjectDeep(
          translationInput,
          targetLanguage,
        );
        translationResult = {
          translatedObject: translatedObj,
          sourceLanguage: "auto-detected",
          targetLanguage: targetLanguage,
          originalInput: translationInput,
          cached: false,
          isObjectMode: true,
        };
      }
    } else {
      // Handle text translation
      try {
        // Try to parse as JSON for backward compatibility
        const parsedObj = JSON.parse(translationInput);
        if (typeof parsedObj === "object" && parsedObj !== null) {
          // It's JSON, treat as object
          const translatedObj = await translateObjectDeep(
            parsedObj,
            targetLanguage,
          );
          translationResult = {
            translatedText: JSON.stringify(translatedObj, null, 2),
            sourceLanguage: "auto-detected",
            targetLanguage: targetLanguage,
            originalText: translationInput,
            cached: false,
            isObjectMode: true,
          };
        } else {
          throw new Error("Not an object");
        }
      } catch (parseError) {
        // Simple text translation
        const result = await translate(translationInput, null, targetLanguage);
        translationResult = {
          translatedText: result.translation,
          sourceLanguage: result.language?.from || "auto-detected",
          targetLanguage: targetLanguage,
          originalText: translationInput,
          cached: false,
          isObjectMode: false,
        };
      }
    }

    // Return successful response
    return res.status(200).json(translationResult);
  } catch (error) {
    // Handle specific API errors
    if (error.message && error.message.includes("language")) {
      return res.status(400).json({
        error:
          "Invalid language code. Please check the target language parameter.",
        details: error.message,
      });
    }

    // Generic error response
    return res.status(500).json({
      error:
        "Translation service temporarily unavailable. Please try again later.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Handle preflight OPTIONS requests
app.options("/api/translate", (req, res) => {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
  );
  res.status(200).end();
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Translation API development server is running!",
    timestamp: new Date().toISOString(),
  });
});

// Test endpoint for complex object translation
app.get("/api/test-object-translation", async (req, res) => {
  const targetLanguage = req.query.lang || "es";

  // Sample form object similar to your TypeScript example
  const sampleFormObj = {
    formObj: [
      {
        tab: 1,
        children: [
          {
            id: "field_1",
            mapping: "user_name",
            appearance: {
              headingLabel: "Personal Information",
              label: "Full Name",
              content:
                "Please enter your complete legal name as it appears on official documents.",
              notes: "This field is required for identity verification",
            },
            behaviour: {
              placeholder: "Enter your full name here",
              fieldInfo: "Your name will be used for official correspondence",
              label: "Name",
              codeList: [
                { label: "Mr.", value: "mr" },
                { label: "Mrs.", value: "mrs" },
                { label: "Ms.", value: "ms" },
              ],
              bulkCodeList:
                '{"First Choice": "option1", "Second Choice": "option2", "Third Choice": "option3"}',
              tabs: [
                { title: "Basic Info", symbol: "info" },
                { title: "Contact Details", symbol: "contact" },
              ],
              choices: [
                { label: "Individual", value: "individual" },
                { label: "Organization", value: "organization" },
              ],
            },
            validation: {
              errorMsg: {
                required: "This field is required",
                maxlength: "Maximum 100 characters allowed",
                pattern: "Please enter a valid name",
                custom: "Name format is invalid",
              },
            },
          },
          {
            id: "field_2",
            appearance: {
              headingLabel: "Contact Information",
              label: "Email Address",
              uploadBtn: "Upload Document",
              removeAllBtn: "Remove All Files",
              consentLabel: "I agree to the terms and conditions",
            },
            behaviour: {
              placeholder: "your.email@example.com",
              fieldInfo: "We will send important updates to this email",
            },
            validation: {
              errorMsg: {
                required: "Email address is required",
                pattern: "Please enter a valid email address",
              },
            },
          },
        ],
      },
    ],
  };

  try {
    const translatedObj = await translateObjectDeep(
      sampleFormObj,
      targetLanguage,
    );

    res.json({
      success: true,
      message: `Object translated to ${targetLanguage}`,
      original: sampleFormObj,
      translated: translatedObj,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Test translation failed",
      details: error.message,
    });
  }
});

// Start server
app.listen(PORT, () => {});

// Graceful shutdown
process.on("SIGINT", () => {
  process.exit(0);
});

module.exports = app;
