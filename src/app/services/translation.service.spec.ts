import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { TranslationService } from './translation.service';

describe('TranslationService', () => {
  let service: TranslationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(TranslationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have supported languages', () => {
    expect(service.supportedLanguages.length).toBeGreaterThan(0);
  });

  it('should get language name from code', () => {
    expect(service.getLanguageName('en')).toBe('English');
    expect(service.getLanguageName('es')).toBe('Spanish');
  });
});
