import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslatorComponent } from './translator.component';

describe('TranslatorComponent', () => {
  let component: TranslatorComponent;
  let fixture: ComponentFixture<TranslatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslatorComponent, HttpClientTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TranslatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default source language as auto-detect', () => {
    expect(component.sourceLang).toBe('auto-detect');
  });

  it('should have default target language as English', () => {
    expect(component.targetLang).toBe('en');
  });

  it('should clear text when onClear is called', () => {
    component.sourceText = 'Test';
    component.translatedText = 'Translation';
    component.onClear();
    expect(component.sourceText).toBe('');
    expect(component.translatedText).toBe('');
  });
});
