/**
 * Health Check API Endpoint
 * Provides API status, metrics, and configuration info
 */

// Simple in-memory metrics store (shared with main API)
let healthMetrics = {
  uptime: Date.now(),
  requests: 0,
  errors: 0,
  lastRequest: null,
  version: "1.0.0",
};

export default function handler(req, res) {
  // Increment request counter
  healthMetrics.requests++;
  healthMetrics.lastRequest = new Date().toISOString();

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow GET requests for health check
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed",
      message: "Health check only supports GET requests",
    });
  }

  const uptime = Date.now() - healthMetrics.uptime;
  const uptimeFormatted = {
    hours: Math.floor(uptime / (1000 * 60 * 60)),
    minutes: Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((uptime % (1000 * 60)) / 1000),
  };

  return res.status(200).json({
    status: "healthy",
    message: "Translation API is operational",
    timestamp: new Date().toISOString(),

    // Service Information
    service: {
      name: "Translation API",
      version: healthMetrics.version,
      environment: process.env.NODE_ENV || "development",
      uptime: uptimeFormatted,
    },

    // API Configuration
    config: {
      rateLimitRequests: parseInt(process.env.API_RATE_LIMIT_REQUESTS || "100"),
      rateLimitWindowMinutes:
        parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || "900000") / 60000,
      maxPayloadSizeMB:
        parseInt(process.env.API_MAX_PAYLOAD_SIZE || "10485760") / 1048576,
      cacheExpiryHours:
        parseInt(process.env.CACHE_EXPIRY_MS || "3600000") / 3600000,
      apiTimeoutSeconds:
        parseInt(process.env.BING_TRANSLATE_TIMEOUT || "15000") / 1000,
    },

    // Basic Metrics
    metrics: {
      totalRequests: healthMetrics.requests,
      totalErrors: healthMetrics.errors,
      lastRequest: healthMetrics.lastRequest,
      errorRate:
        healthMetrics.requests > 0
          ? ((healthMetrics.errors / healthMetrics.requests) * 100).toFixed(2) +
            "%"
          : "0%",
    },

    // API Endpoints
    endpoints: {
      translate: "POST /api/translate",
      health: "GET /api/health",
    },

    // Documentation
    docs: {
      deployment: "/DEPLOYMENT.md",
      github: "https://github.com/your-repo/translation-app",
    },
  });
}
