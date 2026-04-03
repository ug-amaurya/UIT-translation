import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';

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

  /**
   * Alternative method using bing-translate-api package
   * Note: This requires a Node.js backend or proxy server since the package uses Node.js APIs
   * 
   * @param text - Text to translate
   * @param fromLang - Source language
   * @param toLang - Target language  
   * @returns Promise with translation result
   */
  async translateWithBingApi(text: string, fromLang: string = 'auto-detect', toLang: string = 'en'): Promise<TranslationResult> {
    // This would be used if you set up a backend API endpoint
    // For now, it's a placeholder for future implementation
    try {
      // Import dynamically to avoid errors in browser
      const translate = await import('bing-translate-api').then(m => m.translate);
      const result = await translate(text, fromLang === 'auto-detect' ? null : fromLang, toLang);
      return result as TranslationResult;
    } catch (error) {
      throw new Error('bing-translate-api requires Node.js environment. Please use the translate() method instead or set up a backend proxy.');
    }
  }
}
