import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, CanDeactivate } from '@angular/router';
import { PreferencesService, HistoryService, Category, HistoryItem } from '../../core/services/preferences-history.service';
import { ThemeService } from '../../core/services/theme.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="settings-page">
      <header class="settings-header">
        <p class="eyebrow">{{ 'Calibración de Explorador' | translate }}</p>
        <h1>{{ 'Configuración' | translate }}</h1>
      </header>

      <div class="settings-grid">
        <!-- Main Column -->
        <div class="main-column">
          <!-- Preferencias Section -->
          <section class="section-card">
            <div class="section-header">
              <h2>{{ 'Intereses y Radar' | translate }}</h2>
              <p>{{ 'Personaliza cómo Ubica2 encuentra gemas para ti.' | translate }}</p>
            </div>

            <div class="form-container">
              <!-- Categorías -->
              <div class="field-group">
                <label class="field-label">{{ 'Categorías Favoritas' | translate }}</label>
                <div class="interest-cloud">
                  <button *ngFor="let cat of availableCategories()" 
                          type="button"
                          class="interest-pill"
                          [class.active]="isCategorySelected(cat.code)"
                          (click)="toggleCategory(cat.code)">
                    <span class="pill-dot"></span>
                    {{ cat.name }}
                  </button>
                </div>
              </div>

              <div class="field-divider"></div>

              <!-- Notificaciones -->
              <div class="field-group">
                <label class="field-label">{{ 'Canales de Pulso' | translate }}</label>
                <div class="pulse-channels">
                  <label class="pulse-option">
                    <input type="checkbox" [(ngModel)]="form.notifications_enabled" (change)="markAsChanged()">
                    <div class="pulse-box">
                      <span class="pulse-indicator"></span>
                      <span class="pulse-label">{{ 'Notificaciones del Sistema' | translate }}</span>
                    </div>
                  </label>
                  <label class="pulse-option">
                    <input type="checkbox" [(ngModel)]="form.email_notifications" (change)="markAsChanged()">
                    <div class="pulse-box">
                      <span class="pulse-indicator"></span>
                      <span class="pulse-label">{{ 'Resúmenes por Email' | translate }}</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </section>


        </div>

        <!-- Sidebar Column -->
        <aside class="side-column">
          <section class="section-card sticky-sidebar">
            <h2>{{ 'Apariencia' | translate }}</h2>
            
            <div class="field-group">
              <label class="field-label">{{ 'Visión' | translate }}</label>
              <div class="option-grid">
                <button class="option-btn" [class.selected]="form.theme === 'light'" (click)="setTheme('light')" title="Modo Claro">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                </button>
                <button class="option-btn" [class.selected]="form.theme === 'dark'" (click)="setTheme('dark')" title="Modo Oscuro">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                </button>
                <button class="option-btn" [class.selected]="form.theme === 'auto'" (click)="setTheme('auto')" title="Automático">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                </button>
              </div>
            </div>

            <div class="field-group">
              <label class="field-label">{{ 'Idioma' | translate }}</label>
              <select class="custom-select" [(ngModel)]="form.language" (change)="markAsChanged()">
                <option value="es">Castellano</option>
                <option value="en">English</option>
              </select>
            </div>

            <div class="field-group">
              <label class="field-label">{{ 'Escala de Interfaz' | translate }}</label>
              <div class="font-stepper">
                <button (click)="setFont('small')" [class.active]="form.font_size === 'small'">A</button>
                <button (click)="setFont('medium')" [class.active]="form.font_size === 'medium'">A+</button>
                <button (click)="setFont('large')" [class.active]="form.font_size === 'large'">A++</button>
              </div>
            </div>

            <div class="save-area pt-2">
              <button class="btn-main w-full" 
                      (click)="savePreferences()" 
                      [disabled]="saving() || !hasChanges()">
                {{ saving() ? ('Sincronizando...' | translate) : ('Guardar Calibración' | translate) }}
              </button>
              <p class="status-msg success" *ngIf="saveSuccess()">{{ saveSuccess() }}</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .settings-page { 
      max-width: 1200px; 
      margin: 0 auto; 
      padding: 4rem 2rem; 
      min-height: 100vh;
      animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* Pulse Channels - Mechanical Feel */
    .pulse-channels { display: flex; flex-direction: column; gap: 0.75rem; }
    .pulse-option { 
      cursor: pointer;
      input { display: none; }
      .pulse-box {
        display: flex; align-items: center; gap: 1rem;
        padding: 1.25rem; background: var(--surface-soft);
        border: 1px solid var(--border-quiet); border-radius: var(--radius-md);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .pulse-indicator {
        width: 12px; height: 12px; border-radius: 50%;
        border: 2px solid var(--ink-secondary); transition: inherit;
      }
      .pulse-label { font-weight: 700; color: var(--ink-secondary); transition: inherit; }
      
      input:checked + .pulse-box {
        background: var(--identity-surface); border-color: var(--identity-glow);
        .pulse-indicator { background: var(--identity-glow); border-color: var(--identity-glow); box-shadow: 0 0 12px var(--identity-glow); }
        .pulse-label { color: var(--identity-glow); }
      }
      &:hover .pulse-box { transform: translateX(4px); background: var(--border-quiet); }
    }



    .settings-header { 
      margin-bottom: 4rem; 
      .eyebrow { 
        font-family: var(--font-sans);
        letter-spacing: 0.2em; 
        text-transform: uppercase; 
        font-weight: 800; 
        font-size: 0.7rem; 
        color: var(--identity-glow); 
        margin-bottom: 0.75rem; 
      }
      h1 { 
        font-family: var(--font-display); 
        font-size: 3.5rem; 
        margin: 0; 
        color: var(--ink-primary);
        letter-spacing: -0.02em;
      }
    }

    .settings-grid { 
      display: grid; 
      grid-template-columns: 1fr 380px; 
      gap: 3.5rem; 
      align-items: start; 
    }
    
    .section-card { 
      background: var(--surface-card); 
      border-radius: var(--radius-lg); 
      border: 1px solid var(--border-quiet); 
      padding: 3rem;
      box-shadow: var(--shadow-md);
    }

    .section-header { 
      margin-bottom: 2.5rem;
      h2 { 
        font-family: var(--font-display); 
        font-size: 1.75rem; 
        margin-bottom: 0.75rem; 
        color: var(--ink-primary);
      }
      p { color: var(--ink-secondary); font-size: 1rem; line-height: 1.5; }
    }

    /* Interest Cloud - Craft Expression */
    .interest-cloud { display: flex; flex-wrap: wrap; gap: 1rem; }
    .interest-pill { 
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.75rem 1.5rem; 
      background: var(--surface-soft); 
      border: 1px solid transparent;
      border-radius: 100px; 
      font-weight: 700; 
      font-size: 0.9rem; 
      cursor: pointer; 
      color: var(--ink-secondary);
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      
      .pill-dot { 
        width: 8px; height: 8px; border-radius: 50%; 
        background: var(--ink-secondary); 
        opacity: 0.3;
        transition: inherit; 
      }
      
      &:hover {
        color: var(--ink-primary);
        background: var(--border-quiet);
      }
      
      &.active { 
        background: var(--identity-surface); 
        color: var(--identity-glow); 
        border-color: var(--identity-glow);
        transform: translateY(-2px); 
        box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.2);
        .pill-dot { background: var(--identity-glow); opacity: 1; transform: scale(1.4); }
      }
    }

    /* Custom Input Styles */
    .field-label {
      display: block;
      font-weight: 800;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--ink-muted);
      margin-bottom: 1rem;
    }

    .custom-select { 
      width: 100%; 
      padding: 1rem; 
      border-radius: var(--radius-sm); 
      border: 1px solid var(--border-quiet);
      background: var(--surface-soft); 
      color: var(--ink-primary); 
      font-weight: 600;
      font-size: 1rem;
      appearance: none;
      cursor: pointer;
      &:focus { border-color: var(--identity-glow); outline: none; }
    }

    .option-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
    .option-btn { 
      padding: 1rem; 
      background: var(--surface-soft); 
      border: 1px solid var(--border-quiet); 
      border-radius: var(--radius-sm);
      cursor: pointer; 
      font-size: 1.4rem; 
      transition: 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      &:hover { background: var(--border-quiet); }
      &.selected { 
        background: var(--identity-glow); 
        color: white; 
        border-color: var(--identity-glow); 
        box-shadow: 0 8px 16px -4px rgba(99, 102, 241, 0.3);
        transform: translateY(-1px);
      }
    }

    /* Font Stepper */
    .font-stepper {
      display: flex;
      gap: 0.75rem;
      button {
        flex: 1;
        padding: 1rem;
        background: var(--surface-soft);
        border: 1px solid var(--border-quiet);
        border-radius: var(--radius-sm);
        cursor: pointer;
        font-size: 1rem;
        font-weight: 700;
        color: var(--ink-secondary);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        
        &:hover {
          background: var(--border-quiet);
          color: var(--ink-primary);
        }
        
        &.active {
          background: var(--identity-glow);
          color: white;
          border-color: var(--identity-glow);
          box-shadow: 0 8px 16px -4px rgba(99, 102, 241, 0.3);
          transform: translateY(-1px);
        }
      }
    }

    /* Rastro - Visual Path */
    .rastro-list { display: grid; gap: 1.25rem; }
    .rastro-card { 
      padding: 1.5rem; 
      background: var(--surface-soft); 
      border: 1px solid transparent; 
      border-radius: var(--radius-md);
      cursor: pointer; 
      transition: 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        left: 0; top: 0; bottom: 0;
        width: 4px;
        background: var(--identity-glow);
        transform: scaleY(0);
        transition: inherit;
      }

      &:hover { 
        transform: translateX(12px); 
        background: var(--surface-card);
        border-color: var(--border-quiet);
        box-shadow: var(--shadow-md);
        &::before { transform: scaleY(1); }
      }

      h3 { font-size: 1.2rem; margin: 0.75rem 0 0.5rem; color: var(--ink-primary); font-family: var(--font-display); }
      p { color: var(--ink-secondary); font-size: 0.9rem; margin: 0; line-height: 1.5; }
    }

    .rastro-meta { 
      display: flex; 
      justify-content: space-between; 
      align-items: center;
      .rastro-type { 
        font-size: 0.65rem; 
        font-weight: 800; 
        text-transform: uppercase; 
        letter-spacing: 0.1em;
        color: var(--identity-glow); 
        background: var(--identity-surface); 
        padding: 4px 10px; 
        border-radius: 4px; 
      }
      .rastro-date { font-size: 0.8rem; color: var(--ink-secondary); font-weight: 500; }
    }

    .btn-main {
      padding: 1.25rem;
      background: var(--ink-primary);
      color: var(--surface-main);
      border: none;
      border-radius: var(--radius-sm);
      font-weight: 800;
      font-size: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      cursor: pointer;
      transition: 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      
      &:hover:not(:disabled) {
        background: var(--identity-glow);
        color: white;
        transform: translateY(-2px);
        box-shadow: 0 12px 24px -6px rgba(99, 102, 241, 0.4);
      }
      
      &:disabled { opacity: 0.4; cursor: not-allowed; }
    }

    .field-divider { height: 1px; background: var(--border-quiet); margin: 2.5rem 0; }
    .sticky-sidebar { position: sticky; top: 2rem; }
    .mt-2 { margin-top: 3rem; }
    .pt-2 { padding-top: 2rem; }
    .w-full { width: 100%; }

    @media (max-width: 992px) {
      .settings-page { padding: 2rem 1rem; }
      .settings-header {
        margin-bottom: 2rem;
        h1 { font-size: 2.5rem; }
      }
      .settings-grid {
        grid-template-columns: 1fr;
        gap: 2rem;
      }
      .section-card { padding: 1.5rem; }
      .sticky-sidebar { position: static; }
      .option-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class SettingsComponent implements OnInit, CanDeactivate<SettingsComponent> {
  private readonly preferencesService = inject(PreferencesService);
  private readonly historyService = inject(HistoryService);
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  readonly availableCategories = signal<Category[]>([]);
  readonly selectedCategories = signal<string[]>([]);
  readonly historyItems = signal<HistoryItem[]>([]);
  readonly loadingHistory = signal(false);
  readonly saving = signal(false);
  readonly saveSuccess = signal('');
  readonly saveError = signal('');
  readonly showWarning = signal(false);
  readonly hasChanges = signal(false);

  form = {
    notifications_enabled: true,
    email_notifications: false,
    theme: 'dark',
    language: 'es',
    font_size: 'medium'
  };

  ngOnInit(): void {
    this.loadCategories();
    this.loadPreferences();
    this.loadHistory();
  }

  loadCategories(): void {
    this.preferencesService.getCategories().subscribe({
      next: (cats) => this.availableCategories.set(cats)
    });
  }

  loadPreferences(): void {
    this.preferencesService.getPreferences().subscribe({
      next: (data) => {
        if (data.preferences) {
          this.form.notifications_enabled = data.preferences.notifications_enabled === 'true';
          this.form.email_notifications = data.preferences.email_notifications === 'true';
          this.form.theme = data.preferences.theme || 'dark';
          this.form.language = data.preferences.language || 'es';
          this.form.font_size = data.preferences.font_size || 'medium';
        }
        if (data.favoriteCategories) {
          this.selectedCategories.set(data.favoriteCategories.map(c => c.code));
        }
      }
    });
  }

  loadHistory(): void {
    this.loadingHistory.set(true);
    this.historyService.getHistory().subscribe({
      next: (data) => {
        this.historyItems.set(data.items || []);
        this.loadingHistory.set(false);
      },
      error: () => this.loadingHistory.set(false)
    });
  }

  isCategorySelected(code: string): boolean {
    return this.selectedCategories().includes(code);
  }

  toggleCategory(code: string): void {
    const current = this.selectedCategories();
    if (current.includes(code)) {
      this.selectedCategories.set(current.filter(c => c !== code));
    } else {
      this.selectedCategories.set([...current, code]);
    }
    this.markAsChanged();
  }

  markAsChanged(): void {
    this.hasChanges.set(true);
  }

  setTheme(t: string): void {
    this.form.theme = t;
    this.markAsChanged();
  }

  setFont(s: string): void {
    this.form.font_size = s;
    this.markAsChanged();
  }

  savePreferences(): void {
    this.saving.set(true);
    this.saveSuccess.set('');
    this.saveError.set('');

    this.preferencesService.updatePreferences({
      notifications_enabled: this.form.notifications_enabled,
      email_notifications: this.form.email_notifications,
      theme: this.form.theme,
      language: this.form.language,
      font_size: this.form.font_size,
      favoriteCategories: this.selectedCategories()
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.hasChanges.set(false);
        this.saveSuccess.set('✅ Preferencias guardadas correctamente');
        
        // Apply theme/font/language immediately
        this.themeService.applyTheme(this.form.theme);
        this.themeService.applyFontSize(this.form.font_size);
        if (this.themeService.currentLanguage() !== this.form.language) {
          this.themeService.applyLanguage(this.form.language);
        }
        
        setTimeout(() => this.saveSuccess.set(''), 3000);
      },
      error: (err) => {
        this.saving.set(false);
        this.saveError.set(err?.error?.message || 'Error al guardar');
      }
    });
  }

  clearHistory(): void {
    if (confirm('¿Estás seguro de que quieres borrar todo el historial?')) {
      this.historyService.clearHistory().subscribe({
        next: () => this.historyItems.set([])
      });
    }
  }

  goToItem(item: any): void {
    const targetId = item.target_id || item.item_id;
    this.router.navigate(['/places', targetId]);
  }

  canDeactivate(): boolean {
    if (this.hasChanges()) {
      this.showWarning.set(true);
      return false;
    }
    return true;
  }

  confirmExit(): void {
    this.showWarning.set(false);
  }
}