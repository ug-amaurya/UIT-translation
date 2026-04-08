// Simple test for the translation API
const testData = {
  text: "Hello, world!",
  targetLanguage: "es",
};

// Note: This is just a reference test.
// In a real environment, you would make an HTTP request to:
// POST /api/translate
// Body: { text: "Hello, world!", targetLanguage: "es" }
// Expected response: { translatedText: "¡Hola, mundo!", sourceLanguage: "en", targetLanguage: "es", originalText: "Hello, world!", cached: false }
