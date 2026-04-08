import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface TranslationRequest {
  text?: string;
  object?: any;
  targetLanguage: string;
}

export interface TranslationResponse {
  translatedText?: string;
  translatedObject?: any;
  sourceLanguage: string;
  targetLanguage: string;
  originalText?: string;
  originalInput?: any;
  cached: boolean;
  processingTime: number;
  rateLimit: {
    remaining: number;
    resetTime: number;
  };
  metadata?: {
    inputType: 'text' | 'object';
    inputSize: number;
    cacheSize: number;
  };
  timestamp?: string;
}

export interface ProductionErrorResponse {
  error: string;
  message: string;
  requestId?: string;
  processingTime?: number;
  retryAfter?: number;
  timeout?: number;
  maxSize?: number;
  supportedLanguages?: string;
}

export interface TranslatedObject {
  [key: string]: string | TranslatedObject;
}

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private apiUrl = '/api/translate';
  private healthUrl = '/api/health';
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };

  constructor(private http: HttpClient) {}

  /**
   * Check API health and get service information
   * @returns Observable with API status and metrics
   */
  checkHealth(): Observable<any> {
    return this.http.get<any>(this.healthUrl, this.httpOptions).pipe(catchError(this.handleError));
  }

  /**
   * Translate a single text string using the enhanced production API
   * @param text - Text to translate
   * @param targetLanguage - Target language code (e.g., 'es', 'fr', 'de')
   * @returns Observable<TranslationResponse>
   */
  translateText(text: string, targetLanguage: string): Observable<TranslationResponse> {
    if (!text || !text.trim()) {
      return throwError(() => new Error('Text cannot be empty'));
    }

    if (!targetLanguage) {
      return throwError(() => new Error('Target language is required'));
    }

    const request: TranslationRequest = {
      text: text.trim(),
      targetLanguage: targetLanguage.toLowerCase(),
    };

    return this.http.post<TranslationResponse>(this.apiUrl, request, this.httpOptions).pipe(
      map((response) => ({
        ...response,
        // Maintain backward compatibility
        translatedText: response.translatedText || '',
        cacheHit: response.cached,
      })),
      catchError(this.handleError),
    );
  }

  /**
   * Translate complex objects using the enhanced production API
   * Supports deep nested structures and maintains non-translatable fields
   * @param obj - Object to translate (supports nested structures)
   * @param targetLanguage - Target language code
   * @returns Promise<TranslationResponse> - Enhanced translation response
   */
  async translateComplexObject(obj: any, targetLanguage: string): Promise<TranslationResponse> {
    if (!targetLanguage) {
      throw new Error('Target language is required');
    }

    if (!obj || (typeof obj !== 'object' && typeof obj !== 'string')) {
      throw new Error('Invalid object provided for translation');
    }

    const request: TranslationRequest = {
      object: obj,
      targetLanguage: targetLanguage.toLowerCase(),
    };

    try {
      const response = await this.http
        .post<TranslationResponse>(this.apiUrl, request, this.httpOptions)
        .toPromise();

      return {
        ...response,
        // Ensure we have the translated object
        translatedObject: response?.translatedObject || response,
      } as TranslationResponse;
    } catch (error: any) {
      throw this.createEnhancedError(error, 'Complex object translation failed');
    }
  }

  /**
   * Test the server's translation capabilities with sample data
   * @param targetLanguage - Target language code
   * @returns Promise<TranslationResponse> - Server test response
   */
  async testServerTranslation(targetLanguage: string = 'es'): Promise<TranslationResponse> {
    const sampleObject = {
      title: 'Welcome to our form',
      description: 'Please fill out the following information',
      fields: {
        name: 'Full Name',
        email: 'Email Address',
        message: 'Your Message',
        submit: 'Submit Form',
      },
      validation: {
        required: 'This field is required',
        invalid: 'Please enter a valid value',
      },
    };

    try {
      return await this.translateComplexObject(sampleObject, targetLanguage);
    } catch (error: any) {
      throw this.createEnhancedError(error, 'Server test failed');
    }
  }

  /**
   * Legacy method - now uses the enhanced API internally
   * Translate all string values in a JSON object
   * @param obj - Object to translate
   * @param targetLanguage - Target language code
   * @returns Promise<TranslatedObject>
   */
  async translateObject(obj: any, targetLanguage: string): Promise<TranslatedObject> {
    if (!obj || typeof obj !== 'object') {
      throw new Error('Invalid object provided for translation');
    }

    if (!targetLanguage) {
      throw new Error('Target language is required');
    }

    try {
      const response = await this.translateComplexObject(obj, targetLanguage);
      return response.translatedObject as TranslatedObject;
    } catch (error) {
      throw new Error(`Object translation failed: ${error}`);
    }
  }

  /**
   * Translate multiple texts in parallel (with rate limiting awareness)
   * @param texts - Array of texts to translate
   * @param targetLanguage - Target language code
   * @param batchSize - Number of concurrent requests (default: 5)
   * @returns Promise<TranslationResponse[]>
   */
  async translateBatch(
    texts: string[],
    targetLanguage: string,
    batchSize: number = 5,
  ): Promise<TranslationResponse[]> {
    if (!texts || texts.length === 0) {
      return [];
    }

    if (!targetLanguage) {
      throw new Error('Target language is required');
    }

    // Filter out empty texts
    const validTexts = texts.filter((text) => text && text.trim());

    if (validTexts.length === 0) {
      return [];
    }

    const results: TranslationResponse[] = [];

    // Process in batches to respect rate limits
    for (let i = 0; i < validTexts.length; i += batchSize) {
      const batch = validTexts.slice(i, i + batchSize);

      try {
        // Create promises for current batch
        const translationPromises = batch.map((text) =>
          this.translateText(text, targetLanguage).toPromise(),
        );

        // Execute current batch
        const batchResults = await Promise.all(translationPromises);
        results.push(
          ...(batchResults.filter((result) => result !== undefined) as TranslationResponse[]),
        );

        // Small delay between batches to avoid rate limiting
        if (i + batchSize < validTexts.length) {
          await this.delay(100);
        }
      } catch (error: any) {
        // Handle rate limiting gracefully
        if (error.status === 429) {
          const retryAfter = error.error?.retryAfter || 30;
          console.warn(`Rate limit hit, waiting ${retryAfter}s before retry...`);
          await this.delay(retryAfter * 1000);
          // Retry current batch
          i -= batchSize;
          continue;
        }
        throw this.createEnhancedError(error, 'Batch translation failed');
      }
    }

    return results;
  }

  /**
   * Enhanced error handling for production API responses
   * @param error - HTTP error response
   * @returns Enhanced error with user-friendly messages
   */
  private createEnhancedError(error: any, context: string = 'Translation failed'): Error {
    if (error.error && typeof error.error === 'object') {
      const prodError = error.error as ProductionErrorResponse;

      let message = prodError.message || prodError.error || context;

      // Add specific handling for different error types
      switch (error.status) {
        case 400:
          message = `Invalid request: ${prodError.message}`;
          break;
        case 408:
          message = `Request timed out (${prodError.timeout}ms). Please try again with shorter text.`;
          break;
        case 413:
          message = `Request too large (max: ${prodError.maxSize} bytes). Please reduce the content size.`;
          break;
        case 429:
          message = `Rate limit exceeded. Please wait ${prodError.retryAfter || 15} seconds and try again.`;
          break;
        case 503:
          message = `Translation service temporarily unavailable. Please try again in a few minutes.`;
          break;
        case 500:
          message = `Server error (${prodError.requestId || 'unknown'}). Please try again later.`;
          break;
        default:
          message = prodError.message || `${context}: ${error.status}`;
      }

      const enhancedError = new Error(message);
      (enhancedError as any).status = error.status;
      (enhancedError as any).originalError = prodError;
      return enhancedError;
    }

    // Fallback for non-production API errors
    return new Error(`${context}: ${error.message || 'Unknown error'}`);
  }

  /**
   * Utility method for delays (used in batch processing)
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get comprehensive list of supported language codes
   * Enhanced list for production deployment
   * @returns Array of language objects with codes and names
   */
  getSupportedLanguages(): { code: string; name: string }[] {
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'pt-br', name: 'Portuguese (Brazil)' },
      { code: 'ru', name: 'Russian' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'zh', name: 'Chinese (Simplified)' },
      { code: 'zh-tw', name: 'Chinese (Traditional)' },
      { code: 'ar', name: 'Arabic' },
      { code: 'hi', name: 'Hindi' },
      { code: 'th', name: 'Thai' },
      { code: 'vi', name: 'Vietnamese' },
      { code: 'nl', name: 'Dutch' },
      { code: 'sv', name: 'Swedish' },
      { code: 'da', name: 'Danish' },
      { code: 'no', name: 'Norwegian' },
      { code: 'fi', name: 'Finnish' },
      { code: 'pl', name: 'Polish' },
      { code: 'cs', name: 'Czech' },
      { code: 'sk', name: 'Slovak' },
      { code: 'hu', name: 'Hungarian' },
      { code: 'ro', name: 'Romanian' },
      { code: 'bg', name: 'Bulgarian' },
      { code: 'hr', name: 'Croatian' },
      { code: 'sl', name: 'Slovenian' },
      { code: 'et', name: 'Estonian' },
      { code: 'lv', name: 'Latvian' },
      { code: 'lt', name: 'Lithuanian' },
      { code: 'tr', name: 'Turkish' },
      { code: 'el', name: 'Greek' },
      { code: 'he', name: 'Hebrew' },
      { code: 'fa', name: 'Persian' },
      { code: 'ur', name: 'Urdu' },
      { code: 'bn', name: 'Bengali' },
      { code: 'ta', name: 'Tamil' },
      { code: 'te', name: 'Telugu' },
      { code: 'ml', name: 'Malayalam' },
      { code: 'kn', name: 'Kannada' },
      { code: 'gu', name: 'Gujarati' },
      { code: 'mr', name: 'Marathi' },
      { code: 'pa', name: 'Punjabi' },
      { code: 'id', name: 'Indonesian' },
      { code: 'ms', name: 'Malay' },
      { code: 'tl', name: 'Filipino' },
      { code: 'sw', name: 'Swahili' },
      { code: 'am', name: 'Amharic' },
      { code: 'is', name: 'Icelandic' },
      { code: 'mk', name: 'Macedonian' },
      { code: 'mt', name: 'Maltese' },
      { code: 'cy', name: 'Welsh' },
      { code: 'ga', name: 'Irish' },
      { code: 'eu', name: 'Basque' },
      { code: 'ca', name: 'Catalan' },
      { code: 'gl', name: 'Galician' },
    ];
  }

  /**
   * Enhanced HTTP error handler for production API
   * Provides user-friendly error messages and handles rate limiting
   * @param error - HTTP error response
   * @returns Observable error with enhanced messaging
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    let userFriendlyMessage = 'Translation service is temporarily unavailable';

    if (error.error instanceof ErrorEvent) {
      // Client-side network error
      errorMessage = `Network error: ${error.error.message}`;
      userFriendlyMessage = 'Network connection error. Please check your internet connection.';
    } else if (error.error && typeof error.error === 'object') {
      // Server-side error response from production API
      const prodError = error.error as ProductionErrorResponse;

      switch (error.status) {
        case 400:
          userFriendlyMessage =
            prodError.message || 'Invalid translation request. Please check your input.';
          break;
        case 408:
          userFriendlyMessage =
            'Translation request timed out. Please try again with shorter text.';
          break;
        case 413:
          userFriendlyMessage = 'Content too large. Please reduce the text size and try again.';
          break;
        case 429:
          const retrySeconds = prodError.retryAfter || 30;
          userFriendlyMessage = `Too many requests. Please wait ${retrySeconds} seconds and try again.`;
          break;
        case 503:
          userFriendlyMessage =
            'Translation service is temporarily down. Please try again in a few minutes.';
          break;
        case 500:
          userFriendlyMessage = `Server error${prodError.requestId ? ` (${prodError.requestId})` : ''}. Please try again later.`;
          break;
        default:
          userFriendlyMessage =
            prodError.message || prodError.error || 'Translation request failed';
      }

      errorMessage = prodError.message || prodError.error || `HTTP ${error.status}`;
    } else {
      // Legacy or generic error handling
      if (error.error && error.error.error) {
        errorMessage = error.error.error;
        userFriendlyMessage = error.error.error;
      } else if (error.message) {
        errorMessage = error.message;
        userFriendlyMessage = error.message;
      } else {
        errorMessage = `HTTP ${error.status}: ${error.statusText}`;
        userFriendlyMessage = `Service error (${error.status}). Please try again.`;
      }
    }

    // Log detailed error for debugging
    console.error('Translation Service Error:', {
      status: error.status,
      message: errorMessage,
      userMessage: userFriendlyMessage,
      error: error.error,
      timestamp: new Date().toISOString(),
    });

    // Return user-friendly error
    const enhancedError = new Error(userFriendlyMessage);
    (enhancedError as any).status = error.status;
    (enhancedError as any).originalError = error.error;

    return throwError(() => enhancedError);
  }
}
