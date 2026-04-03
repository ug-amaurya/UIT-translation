import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TranslationResult {
  text: string;
  userLang: string;
  translation: string;
  correctedText?: string;
  language: {
    to: string;
    from: string;
    score?: number;
  };
  feminineTranslation?: string;
  masculineTranslation?: string;
}

export interface LanguageOption {
  code: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  // Popular languages supported by Bing Translator
  public readonly supportedLanguages: LanguageOption[] = [
    { code: 'auto-detect', name: 'Auto Detect' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh-Hans', name: 'Chinese (Simplified)' },
    { code: 'zh-Hant', name: 'Chinese (Traditional)' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'nl', name: 'Dutch' },
    { code: 'pl', name: 'Polish' },
    { code: 'tr', name: 'Turkish' },
    { code: 'sv', name: 'Swedish' },
    { code: 'da', name: 'Danish' },
    { code: 'fi', name: 'Finnish' },
    { code: 'no', name: 'Norwegian' },
    { code: 'cs', name: 'Czech' },
    { code: 'el', name: 'Greek' },
    { code: 'he', name: 'Hebrew' },
    { code: 'th', name: 'Thai' },
    { code: 'vi', name: 'Vietnamese' }
  ];

  constructor(private http: HttpClient) {}

  /**
   * Translates text using Bing Translator API
   * This method uses the browser-compatible approach to call Bing's translation endpoint
   * 
   * Note: The bing-translate-api package is installed in the project but can only be used
   * in a Node.js backend environment. This service provides a browser-compatible wrapper
   * that uses the same underlying Bing translation service.
   * 
   * @param text - The text to translate
   * @param fromLang - Source language code (use 'auto-detect' for automatic detection)
   * @param toLang - Target language code
   * @returns Observable with translation result
   */
  translate(text: string, fromLang: string = 'auto-detect', toLang: string = 'en'): Observable<TranslationResult> {
    // Use backend proxy server running on port 49653 to avoid CORS issues
    const url = 'http://localhost:49653/api/translate';
    
    const body = {
      text: text,
      fromLang: fromLang,
      toLang: toLang
    };

    return new Observable(observer => {
      this.http.post<any>(url, body).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const result: TranslationResult = {
              text: response.data.text,
              userLang: fromLang,
              translation: response.data.translation,
              language: response.data.language,
              correctedText: response.data.correctedText,
              feminineTranslation: response.data.feminineTranslation,
              masculineTranslation: response.data.masculineTranslation
            };
            observer.next(result);
            observer.complete();
          } else {
            observer.error(new Error('Invalid response format'));
          }
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  /**
   * Get language name from code
   * @param code - Language code
   * @returns Language name or the code if not found
   */
  getLanguageName(code: string): string {
    const lang = this.supportedLanguages.find(l => l.code === code);
    return lang ? lang.name : code;
  }
}
