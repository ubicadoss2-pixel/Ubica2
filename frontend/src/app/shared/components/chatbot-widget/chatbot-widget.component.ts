import { Component, inject, signal, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ChatbotService } from '../../../core/services/chatbot.service';
import { AuthStoreService } from '../../../core/services/auth-store.service';
import { AppStateService } from '../../../core/services/app-state.service';
import { ChatMessage } from '../../../core/models/feature.models';

import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-chatbot-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  template: `
    <button class="chat-fab" *ngIf="!isReservationPage()" (click)="toggleChat($event)" [class.has-unread]="unreadCount() > 0" [class.menu-hidden]="appState.menuOpen()">
      <div class="icon-wrapper" *ngIf="!isOpen()">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="robot-svg">
          <rect x="5" y="8" width="14" height="12" rx="3" stroke="currentColor" stroke-width="2"/>
          <path d="M9 13H9.01" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M15 13H15.01" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M12 16.5C11 16.5 10 16 10 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M8 8V6C8 4.5 9 3 12 3C15 3 16 4.5 16 6V8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="12" cy="3" r="1" fill="currentColor"/>
        </svg>
      </div>
      <svg *ngIf="isOpen()" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      <span *ngIf="unreadCount() > 0 && !isOpen()" class="badge">{{ unreadCount() }}</span>
    </button>

    <!-- Ventana del chat -->
    <div class="chat-window" *ngIf="isOpen() && !appState.menuOpen() && !isReservationPage()">
      <div class="chat-header">
        <div class="header-info">
          <div class="bot-avatar">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="8" width="14" height="12" rx="3" stroke="currentColor" stroke-width="2"/>
              <circle cx="9" cy="13" r="1" fill="currentColor"/>
              <circle cx="15" cy="13" r="1" fill="currentColor"/>
            </svg>
          </div>
          <div class="title-status">
            <h4>UbiBot</h4>
            <span class="status" [class.online]="isOnline()">{{ 'Sistema Cuántico Activo' | translate }}</span>
          </div>
        </div>
        <div class="header-actions">
          <button class="action-btn" (click)="clearChat()" title="Limpiar chat">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
          <button class="close-header" (click)="toggleChat()">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      <div class="chat-messages" #messagesContainer>
        <div *ngIf="messages().length === 0" class="welcome">
          <div class="welcome-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
          </div>
          <p class="welcome-title">Hola, soy tu asistente UbiBot</p>
          <p>Estoy listo para ayudarte a descubrir lo mejor de Armenia hoy.</p>
          <div class="quick-options" *ngIf="isAuthenticated()">
            <button (click)="askForNearbyEvents()">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              Eventos Cercanos
            </button>
            <button (click)="quickAsk('¿Qué eventos hay hoy?')">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              Eventos Hoy
            </button>
            <button (click)="quickAsk('¿Dónde hay buenos cocteles?')">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 4 3.5 3.5"/><path d="M16 4 4 16"/><path d="m8 16 3-3"/><path d="m14.5 4.5-6.5 6.5"/></svg>
              Cocteles y comida
            </button>
            <button (click)="quickAsk('¿Qué tal el Museo del Oro?')">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" x2="21" y1="22" y2="22"/><rect width="4" height="5" x="4" y="17"/><rect width="4" height="10" x="10" y="12"/><rect width="4" height="15" x="16" y="7"/></svg>
              Cultura y Arte
            </button>
            <button (click)="quickAsk('¿Cómo funcionan los niveles de precio?')">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              Info de Precios
            </button>
          </div>
          <div class="welcome-disclaimer" *ngIf="!isAuthenticated()" style="margin-top: 1rem; font-size: 0.8rem; border-top: 1px dashed rgba(255,0,127,0.3); padding-top: 0.5rem; display: flex; align-items: center; gap: 0.4rem; color: #ff007f; justify-content: center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Requiere inicio de sesión para interactuar.
          </div>
        </div>

        <div *ngFor="let msg of messages()" class="message" [class.user]="msg.role === 'user'" [class.bot]="msg.role === 'assistant'">
          <div class="bubble">
            <div class="bubble-text">{{ msg.content }}</div>
            
            <!-- TARJETAS DE RECOMENDACIÓN (HU-04) -->
            <div *ngIf="msg.metadata?.action === 'RECOMMEND_EVENTS' && msg.metadata?.items?.length > 0" class="recommendations-container">
              <div *ngFor="let item of msg.metadata.items" class="rec-card" (click)="routeToEvent(item); $event.stopPropagation()">
                <div class="rec-header">
                <span class="rec-category">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                  {{ item.category }}
                </span>
                <span class="rec-distance">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  a {{ item.distance.toFixed(1) }} km
                </span>
              </div>
              <h5 class="rec-title">{{ item.title }}</h5>
              <p class="rec-place">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                {{ item.placeName }}
              </p>
              <p class="rec-schedule">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {{ item.schedule }}
              </p>
              <button class="rec-route-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                Trazar ruta
              </button>
              </div>
            </div>
          </div>
          <div class="time">{{ msg.createdAt | date:'HH:mm' }}</div>
        </div>

        <div *ngIf="loading()" class="message bot">
          <div class="bubble typing">
            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          </div>
        </div>
      </div>

      <div class="chat-input" *ngIf="isAuthenticated()">
        <button class="voice-btn" 
                [class.recording]="isRecording()" 
                (click)="toggleSpeech()"
                [title]="isRecording() ? 'Detener grabación' : 'Entrada de voz'">
          <svg *ngIf="!isRecording()" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
          <svg *ngIf="isRecording()" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/></svg>
        </button>
        <input type="text" 
               [(ngModel)]="inputMessage" 
               (keyup.enter)="sendMessage()"
               placeholder="Pregúntame sobre eventos, lugares o rutas..."
               [disabled]="loading()" />
        <button class="send-btn" (click)="sendMessage()" [disabled]="loading() || !inputMessage.trim()">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
            <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <div class="chat-input" *ngIf="!isAuthenticated()">
        <a routerLink="/login" class="login-prompt">Inicia sesión para usar la IA</a>
      </div>
    </div>
  `,
  styles: [`
    :host {
      /* Remove display: contents to prevent iOS Safari rendering bugs */
    }

    .chat-fab {
      pointer-events: auto; /* Re-enable clicks for the button */
      position: fixed;
      bottom: 30px;
      right: 30px;
      width: 65px;
      height: 65px;
      border-radius: 50%;
      background: var(--surface-main);
      border: 2px solid var(--neon-purple);
      color: var(--neon-purple);
      box-shadow: 0 0 15px rgba(191, 0, 255, 0.4);
      cursor: pointer;
      z-index: 2147483647 !important; /* Max integer z-index */
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      overflow: hidden;
      visibility: visible;
      opacity: 1;
    }

    .chat-fab.menu-hidden {
      visibility: hidden;
      opacity: 0;
      pointer-events: none;
    }

    .chat-fab:hover {
      transform: scale(1.1) rotate(5deg);
      box-shadow: 0 0 30px rgba(191, 0, 255, 0.8);
      background: var(--neon-purple);
      color: white;
    }

    .icon-wrapper {
      width: 35px;
      height: 35px;
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }

    .badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background: var(--neon-pink);
      color: white;
      font-size: 0.75rem;
      padding: 3px 8px;
      border-radius: 10px;
      font-weight: 800;
      border: 2px solid var(--surface-main);
    }

    .chat-window {
      pointer-events: auto;
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 700px;
      height: 85vh;
      max-width: 95vw;
      max-height: 90vh;
      background: var(--surface-card);
      border: 1px solid var(--border-glow);
      border-radius: 32px;
      box-shadow: var(--shadow-md);
      display: flex;
      flex-direction: column;
      z-index: 2147483647 !important;
      overflow: hidden;
      backdrop-filter: blur(30px);
      transition: all 0.4s ease;
    }

    .chat-header {
      background: var(--identity-surface);
      border-bottom: 1px solid var(--border-quiet);
      padding: 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .bot-avatar {
      width: 40px;
      height: 40px;
      background: var(--neon-purple);
      color: white;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 6px;
    }

    .title-status h4 {
      margin: 0;
      font-size: 1.1rem;
      color: var(--ink-primary);
      font-weight: 700;
    }

    .status {
      font-size: 0.75rem;
      color: var(--neon-blue);
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .status::before {
      content: '';
      width: 6px;
      height: 6px;
      background: var(--neon-blue);
      border-radius: 50%;
      box-shadow: 0 0 5px var(--neon-blue);
    }

    .close-header {
      background: transparent;
      border: none;
      color: var(--ink-muted);
      width: 32px; height: 32px;
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      padding: 4px;
      transition: color 0.3s, background 0.3s;
    }
    .close-header:hover { color: var(--neon-pink); background: rgba(219,39,119,0.1); }

    .header-actions { display: flex; gap: 8px; align-items: center; }
    .action-btn {
      background: var(--surface-soft);
      border: 1px solid var(--border-quiet); 
      color: var(--ink-muted);
      width: 32px; height: 32px; border-radius: 8px;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: all 0.3s;
      &:hover { background: var(--border-quiet); color: var(--ink-primary); }
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      overflow-x: hidden;
      word-break: break-word;
    }

    .welcome {
      text-align: center;
      padding: 1rem 0;
      color: var(--ink-secondary);

      .welcome-icon {
        color: var(--identity-glow);
        margin-bottom: 0.75rem;
        display: flex;
        justify-content: center;
        opacity: 0.8;
      }
    }
    .welcome-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--ink-primary);
      margin-bottom: 8px;
    }

    .quick-options {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
      margin-top: 1.5rem;
    }
    .quick-options button {
      background: var(--identity-surface);
      border: 1px solid var(--border-quiet);
      color: var(--ink-primary);
      padding: 8px 14px;
      border-radius: 12px;
      font-size: 0.82rem;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .quick-options button:hover {
      background: var(--neon-purple);
      color: white;
      border-color: var(--neon-purple);
      transform: translateY(-2px);
    }

    .message {
      max-width: 85%;
      animation: messageIn 0.3s ease-out;
    }
    @keyframes messageIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .message.user { align-self: flex-end; }
    .message.bot { align-self: flex-start; }

    .bubble {
      padding: 12px 16px;
      border-radius: 18px;
      font-size: 0.95rem;
      line-height: 1.5;
      white-space: pre-wrap;
    }

    .message.user .bubble {
      background: var(--neon-purple);
      color: white;
      border-bottom-right-radius: 4px;
      box-shadow: 0 4px 15px rgba(191, 0, 255, 0.3);
    }
    .message.bot .bubble {
      background: var(--surface-soft);
      color: var(--ink-primary);
      border-bottom-left-radius: 4px;
      border: 1px solid var(--border-quiet);
      box-shadow: var(--shadow-sm);
    }

    .time {
      font-size: 0.7rem;
      color: var(--ink-muted);
      margin-top: 4px;
      padding: 0 4px;
    }
    .message.user .time { text-align: right; }

    .chat-input {
      padding: 1.5rem;
      background: var(--surface-main);
      border-top: 1px solid var(--border-quiet);
      display: flex;
      gap: 12px;
    }

    .voice-btn {
      background: var(--surface-soft);
      border: 1px solid var(--border-quiet);
      border-radius: 12px;
      width: 48px; height: 48px;
      color: var(--neon-purple);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.3s;
      &:hover { background: var(--neon-purple); color: #fff; box-shadow: 0 0 15px var(--neon-purple); }
    }

    .voice-btn.recording {
      background: var(--neon-pink) !important;
      color: white !important;
      box-shadow: 0 0 20px var(--neon-pink) !important;
      animation: pulseRecord 1.5s infinite;
      border-color: var(--neon-pink) !important;
    }

    @keyframes pulseRecord {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.8; }
      100% { transform: scale(1); opacity: 1; }
    }

    .chat-input input {
      flex: 1;
      background: var(--surface-soft);
      border: 1px solid var(--border-quiet);
      border-radius: 16px;
      padding: 14px 20px;
      color: var(--ink-primary);
      font-size: 1rem;
      transition: all 0.3s;
    }
    .chat-input input:focus {
      outline: none;
      border-color: var(--neon-purple);
      box-shadow: 0 0 20px rgba(191, 0, 255, 0.3);
      background: var(--surface-card);
    }

    .send-btn {
      width: 48px;
      height: 48px;
      background: var(--neon-purple);
      color: white;
      border: none;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .send-btn:hover:not(:disabled) {
      transform: scale(1.05);
      filter: brightness(1.2);
      box-shadow: 0 0 15px rgba(191, 0, 255, 0.4);
    }
    .send-btn:disabled {
      background: var(--ink-muted);
      color: var(--surface-main);
      opacity: 0.5;
      cursor: not-allowed;
    }

    .login-prompt {
      flex: 1;
      text-align: center;
      background: var(--identity-surface);
      color: var(--neon-purple);
      padding: 12px;
      border-radius: 14px;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
      border: 1px dashed var(--neon-purple);
    }

    .typing .dot { background: var(--neon-purple); box-shadow: 0 0 5px var(--neon-purple); }

    /* RECOMMENDATION CARDS DESIGN */
    .recommendations-container {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      margin-top: 12px;
      width: 100%;
    }
    
    @media (min-width: 500px) {
      .recommendations-container {
        grid-template-columns: 1fr 1fr;
      }
    }

    .rec-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 14px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      display: flex;
      flex-direction: column;
      gap: 6px;
      backdrop-filter: blur(10px);
      text-align: left;
    }

    .rec-card:hover {
      background: rgba(191, 0, 255, 0.1);
      border-color: var(--neon-purple);
      transform: translateY(-3px);
      box-shadow: 0 4px 15px rgba(191, 0, 255, 0.2);
    }

    .rec-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .rec-category {
      color: var(--neon-pink);
    }

    .rec-distance {
      color: var(--neon-blue);
      background: rgba(0, 242, 254, 0.1);
      padding: 2px 6px;
      border-radius: 8px;
    }

    .rec-title {
      margin: 4px 0 2px 0;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--ink-primary);
      line-height: 1.3;
    }

    .rec-place {
      margin: 0;
      font-size: 0.8rem;
      color: var(--ink-secondary);
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .rec-schedule {
      margin: 0;
      font-size: 0.75rem;
      color: var(--ink-muted);
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .rec-route-btn {
      margin-top: 8px;
      background: var(--neon-purple);
      color: white;
      border: none;
      border-radius: 8px;
      padding: 6px 12px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      width: 100%;
      text-align: center;
    }

    .rec-card:hover .rec-route-btn {
      background: var(--neon-pink);
      box-shadow: 0 0 10px var(--neon-pink);
    }

    /* Mobile responsive: chatbot */
    @media (max-width: 1024px) {
      .chat-window {
        width: calc(100vw - 1rem);
        max-width: 480px;
        height: 75vh;
        max-height: 75vh;
        top: auto;
        bottom: 90px;
        right: 0.5rem;
        left: auto;
        transform: none;
        border-radius: 20px;
        z-index: 9999 !important;
      }
      .chat-fab {
        position: fixed !important;
        bottom: 90px;
        right: 16px;
        width: 58px;
        height: 58px;
        z-index: 9999 !important;
      }
    }

    @media (max-width: 480px) {
      .chat-window {
        width: 100vw;
        height: 100dvh;
        max-height: 100dvh;
        max-width: 100vw;
        top: 0;
        bottom: 0;
        right: 0;
        left: 0;
        transform: none;
        border-radius: 0;
        z-index: 9999 !important;
      }
      .chat-fab {
        position: fixed !important;
        bottom: 90px;
        right: 14px;
        width: 54px;
        height: 54px;
        z-index: 9999 !important;
        /* Fondo más sólido en móvil por si se pierde con el mapa */
        background: var(--surface-card);
        box-shadow: 0 4px 15px rgba(191, 0, 255, 0.5);
      }
    }
  `]
})
export class ChatbotWidgetComponent {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  private readonly chatbotService = inject(ChatbotService);
  private readonly authStore = inject(AuthStoreService);
  readonly appState = inject(AppStateService);
  private readonly elementRef = inject(ElementRef);
  private readonly router = inject(Router);

  readonly isOpen = signal(false);
  readonly messages = signal<ChatMessage[]>([]);
  readonly loading = signal(false);
  readonly unreadCount = signal(0);
  readonly isOnline = signal(true);
  readonly conversationId = signal<string | null>(null);

  inputMessage = '';
  private lastRecommendedPlaceInfo: { lat?: number, lng?: number, placeId?: string, name?: string } | null = null;

  readonly isRecording = signal(false);
  private recognition: any = null;
  userLocation: { lat: number; lng: number } | null = null;
  locationPermissionGranted = false;

  constructor() {
    const storedConversationId = localStorage.getItem('chatbotConversationId');
    if (storedConversationId && this.isUuid(storedConversationId)) {
      this.conversationId.set(storedConversationId);
    } else {
      localStorage.removeItem('chatbotConversationId');
    }
  }

  isAuthenticated(): boolean {
    return this.authStore.isAuthenticated();
  }

  isReservationPage(): boolean {
    return this.router.url.startsWith('/reservation') || this.router.url.startsWith('/reserve');
  }

  toggleChat(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (!this.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.isOpen.update(v => !v);
    if (this.isOpen()) {
      this.unreadCount.set(0);
      setTimeout(() => this.scrollToBottom(), 100);
    } else {
      // Clear conversation context when closing to guarantee fresh start for routes
      this.clearChatWithoutPrompt();
    }
  }

  clearChatWithoutPrompt(): void {
    this.messages.set([]);
    this.conversationId.set(null);
    this.lastRecommendedPlaceInfo = null;
    localStorage.removeItem('chatbotConversationId');
  }

  quickAsk(question: string): void {
    if (!this.isAuthenticated()) return;
    this.inputMessage = question;
    this.sendMessage();
  }

  requestLocationConsent(): Promise<{ lat: number, lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          this.locationPermissionGranted = true;
          resolve(this.userLocation);
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  }

  async askForNearbyEvents(): Promise<void> {
    try {
      this.loading.set(true);
      const coords = await this.requestLocationConsent();
      this.loading.set(false);
      this.inputMessage = 'Recomiéndame eventos cercanos a mi ubicación';
      this.sendMessage();
    } catch (err) {
      this.loading.set(false);
      this.messages.update(msgs => [...msgs, {
        id: Date.now().toString(),
        conversationId: '',
        role: 'assistant' as const,
        content: 'Para darte recomendaciones basadas en tu ubicación actual, necesito que permitas el acceso a tu ubicación. 🗺️ Si lo deseas, puedes intentar nuevamente haciendo clic en el botón de Eventos Cercanos.',
        createdAt: new Date().toISOString()
      }]);
      this.scrollToBottom();
    }
  }

  routeToEvent(item: any): void {
    console.log('[CHATBOT] Routing to event:', item.title, item.lat, item.lng);
    this.appState.triggerRouteToPlace(item.lat, item.lng, item.title || item.placeName);
    this.isOpen.set(false); // Close chat to show map
  }

  initSpeechRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'es-CO';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;

      this.recognition.onstart = () => {
        this.isRecording.set(true);
      };

      this.recognition.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        this.inputMessage = resultText;
        this.isRecording.set(false);
        // Automatically submit transcription after a brief delay
        setTimeout(() => this.sendMessage(), 500);
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        this.isRecording.set(false);
      };

      this.recognition.onend = () => {
        this.isRecording.set(false);
      };
    } else {
      console.warn('Speech recognition not supported in this browser.');
    }
  }

  toggleSpeech(): void {
    if (!this.recognition) {
      this.initSpeechRecognition();
    }

    if (!this.recognition) {
      alert('Tu navegador no soporta el reconocimiento de voz. Te recomendamos usar Google Chrome o Microsoft Edge para esta función. 🎙️');
      return;
    }

    if (this.isRecording()) {
      this.recognition.stop();
    } else {
      try {
        this.recognition.start();
      } catch (e) {
        console.error(e);
      }
    }
  }

  async sendMessage(): Promise<void> {
    if (!this.isAuthenticated() || !this.inputMessage.trim() || this.loading()) return;

    const userMessage = this.inputMessage.trim();
    const userMessageLower = userMessage.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");


    // 2. Comprobar si pregunta por cosas cercanas y obtener ubicación
    const isNearbyQuery = 
      userMessageLower.includes('cerca') || 
      userMessageLower.includes('cercan') || 
      userMessageLower.includes('proxim') || 
      userMessageLower.includes('distancia') || 
      userMessageLower.includes('ubicacion');

    let coords: { lat: number, lng: number } | undefined;
    if (isNearbyQuery && !this.userLocation) {
      try {
        coords = await this.requestLocationConsent();
      } catch (err) {
        console.warn('Geolocation consent denied or failed:', err);
      }
    } else if (this.userLocation) {
      coords = this.userLocation;
    }

    this.inputMessage = '';

    // Add user message
    this.messages.update(msgs => [...msgs, {
      id: Date.now().toString(),
      conversationId: '',
      role: 'user' as const,
      content: userMessage,
      createdAt: new Date().toISOString()
    }]);

    this.scrollToBottom();
    this.loading.set(true);

    const enrichedMessage = this.enrichMessageWithContext(userMessage, userMessageLower);

    this.chatbotService.sendMessage(
      enrichedMessage, 
      this.getValidConversationId() || undefined,
      coords?.lat,
      coords?.lng
    ).subscribe({
      next: (response) => {
        if (this.isUuid(response.conversationId)) {
          this.conversationId.set(response.conversationId);
          localStorage.setItem('chatbotConversationId', response.conversationId);
        } else {
          // Cuando el backend responde en modo degradado puede enviar IDs temporales.
          // No los persistimos para evitar errores de validación en el próximo mensaje.
          this.conversationId.set(null);
          localStorage.removeItem('chatbotConversationId');
        }
        this.messages.update(msgs => [...msgs, response.message]);
        this.loading.set(false);
        this.scrollToBottom();

        // Handle Metadata Actions (e.g., ROUTE)
        if (response.message.metadata?.action === 'ROUTE') {
          const { lat, lng, placeId } = response.message.metadata;
          const placeName = response.message.content.match(/\*\*(.*?)\*\*/)?.[1] || 'Lugar';
          this.lastRecommendedPlaceInfo = { lat, lng, placeId, name: placeName };
          
          console.log('[CHATBOT] Triggering route to:', placeName, lat, lng);
          this.appState.triggerRouteToPlace(lat, lng, placeName);
          
          // Optionally close chat to show the map
          setTimeout(() => this.isOpen.set(false), 2000);
        }
      },
      error: (err) => {
        console.error('[CHATBOT] Error:', err);
        this.loading.set(false);
        const errorMsg = '¡Oops! Mis circuitos han tenido un pequeño cortocircuito analizando esa consulta. ⚡️ Por favor, intenta decirme de otra forma lo que buscas, ¡estoy listo para procesarlo de nuevo! 🤖';
        this.messages.update(msgs => [...msgs, {
          id: Date.now().toString(),
          conversationId: '',
          role: 'assistant' as const,
          content: errorMsg,
          createdAt: new Date().toISOString()
        }]);
        this.scrollToBottom();
      }
    });
  }

  clearChat(): void {
    if (confirm('¿Estás seguro de que deseas limpiar la conversación?')) {
      this.messages.set([]);
      this.conversationId.set(null);
      this.lastRecommendedPlaceInfo = null;
      localStorage.removeItem('chatbotConversationId');
    }
  }

  private enrichMessageWithContext(userMessage: string, userMessageLower: string): string {
    const lastAssistantMsg = [...this.messages()].reverse().find(m => m.role === 'assistant');
    if (!lastAssistantMsg) return userMessage;

    const usesReferences =
      userMessageLower.includes('ese') ||
      userMessageLower.includes('esa') ||
      userMessageLower.includes('alla') ||
      userMessageLower.includes('allá') ||
      userMessageLower.includes('ese lugar') ||
      userMessageLower.includes('ese plan');

    if (!usesReferences) return userMessage;

    return `${userMessage}\n\nContexto previo de la conversación:\n${lastAssistantMsg.content.substring(0, 300)}`;
  }

  private getValidConversationId(): string | null {
    const id = this.conversationId();
    return id && this.isUuid(id) ? id : null;
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer?.nativeElement) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }
}
