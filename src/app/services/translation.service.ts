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
    // For browser environment, we'll use a proxy approach or direct API call
    // Since bing-translate-api uses Node.js APIs, we need to implement browser-compatible version
    
    const url = 'https://www.bing.com/ttranslatev3';
    
    // Prepare request parameters
    const fromLanguage = fromLang === 'auto-detect' ? null : fromLang;
    const params = new URLSearchParams();
    if (fromLanguage) {
      params.append('fromLang', fromLanguage);
    }
    params.append('to', toLang);
    params.append('text', text);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    return new Observable(observer => {
      this.http.post<any>(url, params.toString(), { 
        headers,
        withCredentials: false 
      }).subscribe({
        next: (response) => {
          // Parse Bing's response format
          if (response && response[0]) {
            const result: TranslationResult = {
              text: text,
              userLang: fromLang,
              translation: response[0].translations[0].text,
              language: {
                to: toLang,
                from: response[0].detectedLanguage?.language || fromLang,
                score: response[0].detectedLanguage?.score
              }
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
