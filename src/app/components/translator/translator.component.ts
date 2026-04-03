import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextarea } from 'primeng/inputtextarea';
import { ProgressSpinner } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { TranslationService, TranslationResult, LanguageOption } from '../../services/translation.service';

@Component({
  selector: 'app-translator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    DropdownModule,
    InputTextarea,
    ProgressSpinner,
    TooltipModule
  ],
  templateUrl: './translator.component.html',
  styleUrls: ['./translator.component.scss']
})
export class TranslatorComponent {
  sourceText: string = '';
  translatedText: string = '';
  sourceLang: string = 'auto-detect';
  targetLang: string = 'en';
  isLoading: boolean = false;
  errorMessage: string = '';
  detectedLanguage: string = '';
  
  languages: LanguageOption[] = [];
  targetLanguages: LanguageOption[] = [];

  constructor(private translationService: TranslationService) {
    this.languages = this.translationService.supportedLanguages;
    // Target languages shouldn't include auto-detect
    this.targetLanguages = this.translationService.supportedLanguages.filter(
      lang => lang.code !== 'auto-detect'
    );
  }

  async onTranslate() {
    if (!this.sourceText.trim()) {
      this.errorMessage = 'Please enter text to translate';
      return;
    }

    if (this.sourceText.length > 5000) {
      this.errorMessage = 'Text is too long. Maximum 5000 characters allowed.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.translatedText = '';
    this.detectedLanguage = '';

    try {
      this.translationService.translate(
        this.sourceText,
        this.sourceLang,
        this.targetLang
      ).subscribe({
        next: (result: TranslationResult) => {
          this.translatedText = result.translation;
          
          if (this.sourceLang === 'auto-detect' && result.language.from) {
            this.detectedLanguage = this.translationService.getLanguageName(result.language.from);
          }
          
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Translation error:', error);
          this.errorMessage = 'Translation failed. This could be due to CORS restrictions. ' +
            'Consider setting up a backend proxy server for production use.';
          this.isLoading = false;
        }
      });
    } catch (error: any) {
      console.error('Translation error:', error);
      this.errorMessage = error.message || 'An error occurred during translation';
      this.isLoading = false;
    }
  }

  onSwapLanguages() {
    if (this.sourceLang !== 'auto-detect') {
      const temp = this.sourceLang;
      this.sourceLang = this.targetLang;
      this.targetLang = temp;
      
      // Swap texts
      const tempText = this.sourceText;
      this.sourceText = this.translatedText;
      this.translatedText = tempText;
    }
  }

  onClear() {
    this.sourceText = '';
    this.translatedText = '';
    this.errorMessage = '';
    this.detectedLanguage = '';
  }

  onCopyTranslation() {
    if (this.translatedText) {
      navigator.clipboard.writeText(this.translatedText).then(() => {
        // Success - you could add a toast notification here
        console.log('Translation copied to clipboard');
      }).catch(err => {
        console.error('Failed to copy:', err);
      });
    }
  }
}
