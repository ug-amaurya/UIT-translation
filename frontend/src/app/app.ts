import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TranslationService, TranslationResponse } from './translation.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private translationService = inject(TranslationService);

  title = signal('🌍 Web-Form Translation Studio');

  // Form data
  inputText = signal('');
  selectedLanguage = signal('es');

  // Language dropdown state
  isLanguageDropdownOpen = signal(false);
  languageSearchQuery = signal('');

  // Results
  translatedResult = signal<string>('');
  isLoading = signal(false);
  errorMessage = signal<string>('');
  searchQuery = signal<string>('');
  copySuccess = signal<boolean>(false);

  // Available languages from service
  languages = this.translationService.getSupportedLanguages();

  // Get filtered languages based on search
  get filteredLanguages() {
    const query = this.languageSearchQuery().toLowerCase();
    if (!query) return this.languages;
    return this.languages.filter(
      (lang) => lang.name.toLowerCase().includes(query) || lang.code.toLowerCase().includes(query),
    );
  }

  // Get selected language display name
  get selectedLanguageName() {
    const selected = this.languages.find((lang) => lang.code === this.selectedLanguage());
    return selected ? selected.name : 'Select Language';
  }

  // Sample JSON for testing

  /**
   * Toggle language dropdown
   */
  toggleLanguageDropdown(): void {
    this.isLanguageDropdownOpen.set(!this.isLanguageDropdownOpen());
    if (this.isLanguageDropdownOpen()) {
      // Clear search when opening
      this.languageSearchQuery.set('');
      // Focus on search input after a short delay
      setTimeout(() => {
        const searchInput = document.querySelector('.language-search-input') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }, 100);
    }
  }

  /**
   * Select a language and close dropdown
   */
  selectLanguage(languageCode: string): void {
    this.selectedLanguage.set(languageCode);
    this.isLanguageDropdownOpen.set(false);
    this.languageSearchQuery.set('');
  }

  /**
   * Close dropdown when clicking outside
   */
  closeLanguageDropdown(): void {
    this.isLanguageDropdownOpen.set(false);
    this.languageSearchQuery.set('');
  }
  async onTranslate(): Promise<void> {
    const text = this.inputText().trim();
    const language = this.selectedLanguage();

    if (!text) {
      this.errorMessage.set('Please enter JSON to translate');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.copySuccess.set(false);

    try {
      await this.translateJsonContent(text, language);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Translation failed');
      this.translatedResult.set('');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Translate JSON object content
   */
  private async translateJsonContent(jsonText: string, language: string): Promise<void> {
    try {
      // Try enhanced object translation first
      try {
        const jsonObject = JSON.parse(jsonText);
        const result = await this.translationService.translateComplexObject(jsonObject, language);

        if (result && result.translatedObject) {
          this.translatedResult.set(JSON.stringify(result.translatedObject, null, 2));
          this.errorMessage.set('');
          return;
        }
      } catch (enhancedError) {
        // Fallback to standard translation
      }

      // Fallback to standard object translation
      const jsonObject = JSON.parse(jsonText);
      const translatedObject = await this.translationService.translateObject(jsonObject, language);
      this.translatedResult.set(JSON.stringify(translatedObject, null, 2));
      this.errorMessage.set('');
    } catch (parseError) {
      if (parseError instanceof SyntaxError) {
        this.errorMessage.set('Invalid JSON format. Please check your input.');
      } else {
        throw parseError;
      }
    }
  }

  /**
   * Load sample JSON into input
   */

  /**
   * Load complex form object sample into input
   */

  /**
   * Test server's enhanced object translation
   */
  async testServerTranslation(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const result = await this.translationService.testServerTranslation(this.selectedLanguage());

      if (result && result.translatedObject) {
        // Create sample object for display
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

        // Show both original and translated in the UI
        this.inputText.set(JSON.stringify(sampleObject, null, 2));
        this.translatedResult.set(JSON.stringify(result.translatedObject, null, 2));
      } else {
        this.errorMessage.set('Server test completed but no translation result received');
      }
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Server test failed');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Clear all fields
   */
  clearAll(): void {
    this.inputText.set('');
    this.translatedResult.set('');
    this.errorMessage.set('');
    this.searchQuery.set('');
    this.copySuccess.set(false);
  }

  /**
   * Copy translated JSON to clipboard
   */
  async copyResult(): Promise<void> {
    if (!this.translatedResult()) return;

    try {
      await navigator.clipboard.writeText(this.translatedResult());
      this.copySuccess.set(true);
      setTimeout(() => this.copySuccess.set(false), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = this.translatedResult();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.copySuccess.set(true);
      setTimeout(() => this.copySuccess.set(false), 2000);
    }
  }

  /**
   * Get filtered result based on search
   */
  get filteredResult(): string {
    const result = this.translatedResult();
    const query = this.searchQuery().toLowerCase();

    if (!query || !result) return result;

    // Simple highlighting - replace matching text with highlighted version
    return result.replace(
      new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
      '<mark>$1</mark>',
    );
  }
}
