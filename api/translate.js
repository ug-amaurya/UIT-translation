import translate from "bing-translate-api";

// =============================================
// PRODUCTION CONFIGURATION & MONITORING
// =============================================

// Environment configuration
const config = {
  rateLimit: {
    requests: parseInt(process.env.API_RATE_LIMIT_REQUESTS || "100"),
    windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
  },
  cache: {
    expiryMs: parseInt(process.env.CACHE_EXPIRY_MS || "3600000"), // 1 hour
  },
  api: {
    timeout: parseInt(process.env.BING_TRANSLATE_TIMEOUT || "15000"),
    maxPayloadSize: parseInt(process.env.API_MAX_PAYLOAD_SIZE || "10485760"), // 10MB
  },
  logging: {
    enabled: process.env.ENABLE_LOGGING === "true",
    level: process.env.LOG_LEVEL || "error",
  },
};

// =============================================
// RATE LIMITING & SECURITY
// =============================================

// In-memory rate limiting store (for serverless, consider Redis for scaling)
const rateLimitStore = new Map();

function getRateLimitKey(req) {
  // Use IP address as rate limit key
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

function checkRateLimit(clientId) {
  const now = Date.now();
  const windowStart = now - config.rateLimit.windowMs;

  if (!rateLimitStore.has(clientId)) {
    rateLimitStore.set(clientId, []);
  }

  const requests = rateLimitStore.get(clientId);

  // Remove expired requests
  const validRequests = requests.filter((timestamp) => timestamp > windowStart);
  rateLimitStore.set(clientId, validRequests);

  // Check if rate limit exceeded
  if (validRequests.length >= config.rateLimit.requests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: windowStart + config.rateLimit.windowMs,
    };
  }

  // Add current request
  validRequests.push(now);

  return {
    allowed: true,
    remaining: config.rateLimit.requests - validRequests.length,
    resetTime: windowStart + config.rateLimit.windowMs,
  };
}

// =============================================
// ENHANCED CACHING & MONITORING
// =============================================

// Translation cache with enhanced tracking
const translationCache = new Map();
const cacheTimestamps = new Map();
const requestMetrics = {
  total: 0,
  successful: 0,
  cached: 0,
  errors: 0,
  rateLimited: 0,
};

function cleanupCache() {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [key, timestamp] of cacheTimestamps.entries()) {
    if (now - timestamp > config.cache.expiryMs) {
      translationCache.delete(key);
      cacheTimestamps.delete(key);
      cleanedCount++;
    }
  }

  if (config.logging.enabled && cleanedCount > 0) {
    console.log(`[Cache] Cleaned ${cleanedCount} expired entries`);
  }
}

function logError(error, context = {}) {
  if (config.logging.enabled) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] Translation API Error:`, {
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      context,
      metrics: requestMetrics,
    });
  }
}

function logRequest(req, result) {
  if (config.logging.enabled && config.logging.level === "info") {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] API Request:`, {
      method: req.method,
      userAgent: req.headers["user-agent"],
      clientId: getRateLimitKey(req),
      textLength: req.body?.text?.length || 0,
      targetLanguage: req.body?.targetLanguage,
      cached: result?.cached || false,
      processingTime: result?.processingTime || 0,
    });
  }
}

/**
 * PRODUCTION-READY SERVERLESS TRANSLATION API
 * Features: Rate limiting, enhanced caching, error monitoring, security headers
 * Endpoint: POST /api/translate
 *
 * Request Body:
 * - { text: string, targetLanguage: string } - For simple text translation
 * - { object: any, targetLanguage: string } - For deep object translation
 *
 * Response: { translatedText/translatedObject, sourceLanguage, metadata }
 */
export default async function handler(req, res) {
  const startTime = Date.now();
  const clientId = getRateLimitKey(req);

  // Increment total request counter
  requestMetrics.total++;

  try {
    // =============================================
    // SECURITY & CORS HEADERS
    // =============================================

    const corsOrigin = process.env.CORS_ORIGIN || "*";
    res.setHeader("Access-Control-Allow-Credentials", true);
    res.setHeader("Access-Control-Allow-Origin", corsOrigin);
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
    );

    // Security headers
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    // Handle preflight OPTIONS request
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Method not allowed",
        message: "Only POST requests are supported",
        supportedMethods: ["POST", "OPTIONS"],
      });
    }

    // =============================================
    // RATE LIMITING
    // =============================================

    const rateLimitResult = checkRateLimit(clientId);

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", config.rateLimit.requests);
    res.setHeader("X-RateLimit-Remaining", rateLimitResult.remaining);
    res.setHeader(
      "X-RateLimit-Reset",
      Math.ceil(rateLimitResult.resetTime / 1000),
    );

    if (!rateLimitResult.allowed) {
      requestMetrics.rateLimited++;

      return res.status(429).json({
        error: "Rate limit exceeded",
        message: `Too many requests. Limit: ${config.rateLimit.requests} requests per ${Math.ceil(config.rateLimit.windowMs / 60000)} minutes`,
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
      });
    }

    // =============================================
    // REQUEST VALIDATION
    // =============================================

    // Check payload size
    const payloadSize = JSON.stringify(req.body).length;
    if (payloadSize > config.api.maxPayloadSize) {
      return res.status(413).json({
        error: "Payload too large",
        message: `Request payload (${payloadSize} bytes) exceeds maximum size (${config.api.maxPayloadSize} bytes)`,
        maxSize: config.api.maxPayloadSize,
      });
    }

    const { text, object, targetLanguage } = req.body;

    // Validate target language
    if (!targetLanguage || typeof targetLanguage !== "string") {
      return res.status(400).json({
        error: "Missing target language",
        message:
          'Required parameter "targetLanguage" must be a valid language code (e.g., "es", "fr", "de")',
        supportedLanguages:
          "https://docs.microsofttranslator.com/languages.html",
      });
    }

    // Validate translation input
    let translationInput;
    let isObjectTranslation = false;

    if (object !== undefined) {
      translationInput = object;
      isObjectTranslation = true;
    } else if (text !== undefined) {
      if (typeof text !== "string" || text.trim() === "") {
        return res.status(400).json({
          error: "Invalid text input",
          message: 'Parameter "text" must be a non-empty string',
        });
      }
      translationInput = text.trim();
    } else {
      return res.status(400).json({
        error: "Missing translation input",
        message:
          'Either "text" (string) or "object" (any) parameter is required',
      });
    }

    // =============================================
    // CACHING & TRANSLATION
    // =============================================

    // Clean up expired cache entries
    cleanupCache();

    // Create cache key
    const cacheKey = isObjectTranslation
      ? `object:${JSON.stringify(translationInput)}|${targetLanguage.toLowerCase()}`
      : `text:${translationInput.toLowerCase()}|${targetLanguage.toLowerCase()}`;

    // Check cache first
    if (translationCache.has(cacheKey)) {
      const cachedResult = translationCache.get(cacheKey);
      requestMetrics.successful++;
      requestMetrics.cached++;

      const result = {
        ...cachedResult,
        cached: true,
        processingTime: Date.now() - startTime,
        rateLimit: {
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
        },
      };

      logRequest(req, result);
      return res.status(200).json(result);
    }

    // Perform translation
    let translationResult;

    if (isObjectTranslation) {
      // Deep object translation
      translationResult = await translateObjectDeep(
        translationInput,
        targetLanguage,
      );
    } else {
      // Simple text translation with timeout
      const translationPromise = translate(
        translationInput,
        null,
        targetLanguage,
      );
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Translation timeout")),
          config.api.timeout,
        ),
      );

      const result = await Promise.race([translationPromise, timeoutPromise]);

      translationResult = {
        [isObjectTranslation ? "translatedObject" : "translatedText"]:
          isObjectTranslation ? result : result.translation,
        sourceLanguage: result.language?.from || "auto-detected",
        targetLanguage: targetLanguage,
        originalInput: translationInput,
      };
    }

    // Add metadata
    const responseData = {
      ...translationResult,
      cached: false,
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      rateLimit: {
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime,
      },
      metadata: {
        inputType: isObjectTranslation ? "object" : "text",
        inputSize: payloadSize,
        cacheSize: translationCache.size,
      },
    };

    // Store in cache
    translationCache.set(cacheKey, responseData);
    cacheTimestamps.set(cacheKey, Date.now());

    // Update metrics
    requestMetrics.successful++;

    // Log request
    logRequest(req, responseData);

    return res.status(200).json(responseData);
  } catch (error) {
    // =============================================
    // ERROR HANDLING & MONITORING
    // =============================================

    requestMetrics.errors++;

    const processingTime = Date.now() - startTime;

    // Log error with context
    logError(error, {
      clientId,
      requestBody: req.body,
      processingTime,
      userAgent: req.headers["user-agent"],
    });

    // Handle specific error types
    if (error.message?.includes("timeout")) {
      return res.status(408).json({
        error: "Request timeout",
        message:
          "Translation request timed out. Please try again with shorter text.",
        timeout: config.api.timeout,
        processingTime,
      });
    }

    if (error.message?.includes("language")) {
      return res.status(400).json({
        error: "Invalid language code",
        message: "The specified target language is not supported",
        details: error.message,
        supportedLanguages:
          "https://docs.microsofttranslator.com/languages.html",
      });
    }

    if (error.code === "ENOTFOUND" || error.code === "ECONNRESET") {
      return res.status(503).json({
        error: "Service unavailable",
        message:
          "Translation service is temporarily unavailable. Please try again later.",
        retryAfter: 30,
      });
    }

    // Generic production error response
    const errorResponse = {
      error: "Internal server error",
      message: "An unexpected error occurred while processing your request",
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      processingTime,
    };

    // Include error details in development
    if (process.env.NODE_ENV === "development") {
      errorResponse.details = error.message;
      errorResponse.stack = error.stack;
    }

    return res.status(500).json(errorResponse);
  }
}

// =============================================
// DEEP OBJECT TRANSLATION UTILITY
// =============================================

async function translateObjectDeep(obj, targetLanguage, path = "") {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    if (shouldTranslateField(obj)) {
      try {
        const result = await translate(obj, null, targetLanguage);
        return result.translation;
      } catch (error) {
        logError(error, { field: path, value: obj });
        return obj; // Return original on translation error
      }
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    const translated = [];
    for (let i = 0; i < obj.length; i++) {
      translated[i] = await translateObjectDeep(
        obj[i],
        targetLanguage,
        `${path}[${i}]`,
      );
    }
    return translated;
  }

  if (typeof obj === "object") {
    const translated = {};
    for (const [key, value] of Object.entries(obj)) {
      translated[key] = await translateObjectDeep(
        value,
        targetLanguage,
        `${path}.${key}`,
      );
    }
    return translated;
  }

  return obj;
}

function shouldTranslateField(value) {
  if (typeof value !== "string") return false;

  const trimmed = value.trim();
  if (trimmed.length === 0) return false;

  // Skip URLs, emails, technical values
  const skipPatterns = [
    /^https?:\/\//i,
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i,
    /^\d+$/,
    /^[a-zA-Z0-9_-]+$/,
  ];

  return !skipPatterns.some((pattern) => pattern.test(trimmed));
}
