/**
 * Backend Translation API Example using bing-translate-api
 * 
 * This example shows how to use the bing-translate-api package in a Node.js backend.
 * You can use this as a reference to create a backend API endpoint for your Angular application.
 * 
 * Requirements:
 * - Node.js 18+
 * - Express.js (npm install express)
 * - bing-translate-api (already installed)
 * - cors (npm install cors) - for cross-origin requests
 * 
 * To run this example:
 * 1. Install additional dependencies: npm install express cors
 * 2. Run: node examples/backend-translation-api.js
 * 3. The API will be available at http://localhost:3000
 */

const express = require('express');
const cors = require('cors');
const { translate } = require('bing-translate-api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all origins (configure appropriately for production)
app.use(express.json());

/**
 * POST /api/translate
 * 
 * Request body:
 * {
 *   "text": "Hello, world!",
 *   "fromLang": "auto-detect" | "en" | "es" | etc.,
 *   "toLang": "es"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "text": "Hello, world!",
 *     "translation": "¡Hola, mundo!",
 *     "language": {
 *       "from": "en",
 *       "to": "es"
 *     }
 *   }
 * }
 */
app.post('/api/translate', async (req, res) => {
  try {
    const { text, fromLang, toLang } = req.body;

    // Validation
    if (!text || !toLang) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: text and toLang are required'
      });
    }

    if (text.length > 5000) {
      return res.status(400).json({
        success: false,
        error: 'Text too long. Maximum 5000 characters allowed.'
      });
    }

    // Translate using bing-translate-api
    const fromLanguage = (fromLang === 'auto-detect' || !fromLang) ? null : fromLang;
    const result = await translate(text, fromLanguage, toLang);

    // Return the result
    res.json({
      success: true,
      data: {
        text: result.text,
        translation: result.translation,
        language: {
          from: result.language.from,
          to: result.language.to,
          score: result.language.score
        },
        correctedText: result.correctedText,
        feminineTranslation: result.feminineTranslation,
        masculineTranslation: result.masculineTranslation
      }
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({
      success: false,
      error: 'Translation failed. Please try again.',
      details: error.message
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Bing Translation API',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Translation API server is running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Translation endpoint: POST http://localhost:${PORT}/api/translate`);
});

/**
 * How to integrate this with your Angular app:
 * 
 * 1. Update TranslationService to use this backend endpoint:
 * 
 * translate(text: string, fromLang: string, toLang: string): Observable<TranslationResult> {
 *   const url = 'http://localhost:3000/api/translate';
 *   return this.http.post<any>(url, { text, fromLang, toLang }).pipe(
 *     map(response => response.data)
 *   );
 * }
 * 
 * 2. For production, replace 'http://localhost:3000' with your actual backend URL
 * 3. Consider adding authentication, rate limiting, and caching
 */
