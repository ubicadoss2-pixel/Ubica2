import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

const ACCESS_TOKEN_KEY = 'ubica2_access_token';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;
  
  readonly currentLanguage = signal<string>('es');

  constructor() {
    this.loadAndApplySettings();
  }

  private loadAndApplySettings(): void {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    
    const url = token 
      ? `${this.baseUrl}/preferences`
      : `${this.baseUrl}/preferences/defaults`;
    
    this.http.get<any>(url, { headers }).subscribe({
      next: (data) => {
        const theme = data.preferences?.theme || 'light';
        this.applyTheme(theme);
        
        const fontSize = data.preferences?.font_size || 'medium';
        this.applyFontSize(fontSize);
        
        const language = data.preferences?.language || 'es';
        this.applyLanguage(language);
      },
      error: () => {
        this.applyTheme('light');
        this.applyFontSize('medium');
        this.applyLanguage('es');
      }
    });
  }

  applyTheme(theme: string): void {
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${theme}-theme`);
    document.body.setAttribute('data-theme', theme);
    
    // Also apply to root for CSS variables
    const root = document.documentElement;
    if (theme === 'dark') {
      root.style.setProperty('--bg-primary', '#050508');
      root.style.setProperty('--bg-secondary', '#0f172a');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#cbd5e1');
      root.style.setProperty('--card-bg', 'rgba(30, 41, 59, 0.7)');
    } else {
      root.style.setProperty('--bg-primary', '#ffffff');
      root.style.setProperty('--bg-secondary', '#f8f9fa');
      root.style.setProperty('--text-primary', '#333333');
      root.style.setProperty('--text-secondary', '#666666');
      root.style.setProperty('--card-bg', '#ffffff');
    }
  }

  applyFontSize(size: string): void {
    const sizes: Record<string, string> = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    const fontSize = sizes[size] || '16px';
    document.body.style.fontSize = fontSize;
    document.documentElement.style.fontSize = fontSize;
    document.body.setAttribute('data-font-size', size);
  }

  applyLanguage(lang: string): void {
    document.body.setAttribute('data-language', lang);
    this.currentLanguage.set(lang);
    
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (select) {
      select.value = lang;
      select.dispatchEvent(new Event('change'));
    } else {
      const interval = setInterval(() => {
        const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement;
        if (combo) {
          combo.value = lang;
          combo.dispatchEvent(new Event('change'));
          clearInterval(interval);
        }
      }, 500);
      setTimeout(() => clearInterval(interval), 5000);
    }
  }

  refresh(): void {
    this.loadAndApplySettings();
  }
}