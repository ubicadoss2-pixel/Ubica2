import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AppStateService } from './app-state.service';

const ACCESS_TOKEN_KEY = 'ubica2_access_token';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly http = inject(HttpClient);
  private readonly appState = inject(AppStateService);
  private readonly baseUrl = environment.apiBaseUrl;
  
  readonly currentLanguage = signal<string>('es');

  constructor() {
    this.loadAndApplySettings();
  }

  private isInitialized = false;

  private loadAndApplySettings(): void {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    
    const applyAll = (theme: string, fontSize: string, language: string) => {
      this.applyTheme(theme);
      this.applyFontSize(fontSize);
      this.applyLanguage(language);
      this.isInitialized = true;
    };

    if (!token) {
      const localTheme = localStorage.getItem('theme') || 'dark';
      const localSize = localStorage.getItem('font_size') || 'medium';
      const localLang = localStorage.getItem('language') || 'es';
      applyAll(localTheme, localSize, localLang);
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    this.http.get<any>(`${this.baseUrl}/preferences`, { headers }).subscribe({
      next: (data) => {
        applyAll(
          data.preferences?.theme || 'dark',
          data.preferences?.font_size || 'medium',
          data.preferences?.language || 'es'
        );
      },
      error: () => {
        const localTheme = localStorage.getItem('theme') || 'dark';
        const localSize = localStorage.getItem('font_size') || 'medium';
        const localLang = localStorage.getItem('language') || 'es';
        applyAll(localTheme, localSize, localLang);
      }
    });
  }

  applyTheme(theme: string): void {
    const validTheme = (theme === 'dark' || theme === 'light') ? theme : 'dark';
    
    if (this.appState.theme() !== validTheme) {
      this.appState.theme.set(validTheme);
    }
  }

  applyFontSize(size: string): void {
    const sizes: Record<string, string> = {
      small: '13px',
      medium: '16px',
      large: '20px'
    };
    const fontSize = sizes[size] || '16px';
    
    document.documentElement.style.setProperty('--base-font-size', fontSize);
    
    document.body.style.fontSize = fontSize;
    document.body.setAttribute('data-font-size', size);
    
    localStorage.setItem('font_size', size);
  }

  applyLanguage(lang: string): void {
    document.body.setAttribute('data-language', lang);
    this.currentLanguage.set(lang);
    
    localStorage.setItem('language', lang);
    
    document.cookie = `googtrans=/es/${lang}; path=/`;
    if (location.hostname !== 'localhost') {
        document.cookie = `googtrans=/es/${lang}; domain=.${location.hostname}; path=/`;
    }

    if (this.isInitialized) {
      window.location.reload();
    } else {
      const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (select) {
        select.value = lang;
        select.dispatchEvent(new Event('change'));
      }
    }
  }

  refresh(): void {
    this.isInitialized = false;
    this.loadAndApplySettings();
  }
}