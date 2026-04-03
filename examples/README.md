# Examples

This directory contains example implementations for using the bing-translate-api package.

## Backend Translation API

**File:** `backend-translation-api.js`

A complete Node.js/Express backend API that uses the `bing-translate-api` package to provide translation services.

### Why use a backend?

The `bing-translate-api` package uses Node.js built-in modules (like `http`, `https`, `stream`, etc.) that are not available in browser environments. While the Angular frontend can attempt to call Bing's endpoints directly, a backend proxy provides:

1. **No CORS issues** - Your backend can make requests to Bing without cross-origin restrictions
2. **Better reliability** - Backend has full access to the bing-translate-api package features
3. **Rate limiting** - Implement your own rate limiting and caching
4. **Security** - Keep API keys and sensitive logic on the server
5. **Analytics** - Track translation usage

### Setup

1. Install additional dependencies:
```bash
npm install express cors
```

2. Run the backend server:
```bash
node examples/backend-translation-api.js
```

3. The API will be available at `http://localhost:3000`

### API Endpoints

#### POST /api/translate
Translate text from one language to another.

**Request:**
```json
{
  "text": "Hello, world!",
  "fromLang": "auto-detect",
  "toLang": "es"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "text": "Hello, world!",
    "translation": "¡Hola, mundo!",
    "language": {
      "from": "en",
      "to": "es",
      "score": 1
    }
  }
}
```

#### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "Bing Translation API",
  "timestamp": "2026-04-03T10:00:00.000Z"
}
```

### Integrating with Angular

Update your `TranslationService` to use the backend endpoint:

```typescript
translate(text: string, fromLang: string, toLang: string): Observable<TranslationResult> {
  const url = 'http://localhost:3000/api/translate';
  return this.http.post<any>(url, { text, fromLang, toLang }).pipe(
    map(response => response.data)
  );
}
```

For production, replace `http://localhost:3000` with your deployed backend URL and add proper environment configuration.

## Production Considerations

1. **Environment Variables** - Store backend URL in environment files
2. **Authentication** - Add API key or JWT authentication
3. **Rate Limiting** - Implement request rate limiting
4. **Caching** - Cache common translations to reduce API calls
5. **Error Handling** - Implement proper error handling and retry logic
6. **Monitoring** - Add logging and monitoring for translation requests
7. **HTTPS** - Always use HTTPS in production
