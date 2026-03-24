import { Component, inject, signal, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChatbotService } from '../../../core/services/chatbot.service';
import { AuthStoreService } from '../../../core/services/auth-store.service';
import { ChatMessage } from '../../../core/models/feature.models';

@Component({
  selector: 'app-chatbot-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <!-- Botón flotante -->
    <button class="chat-fab" (click)="toggleChat()" [class.has-unread]="unreadCount() > 0">
      <span *ngIf="!isOpen()">💬</span>
      <span *ngIf="isOpen()">✕</span>
      <span *ngIf="unreadCount() > 0 && !isOpen()" class="badge">{{ unreadCount() }}</span>
    </button>

    <!-- Ventana del chat -->
    <div class="chat-window" *ngIf="isOpen()">
      <div class="chat-header">
        <h4>Asistente Ubica2</h4>
        <span class="status" [class.online]="isOnline()">●</span>
      </div>

      <div class="chat-messages" #messagesContainer>
        <div *ngIf="messages().length === 0" class="welcome">
          <p>¡Hola! Soy tu asistente de Ubica2 👋</p>
          <p>Puedo ayudarte a encontrar:</p>
          <ul>
            <li (click)="quickAsk('lugares cerca de mi')">📍 Lugares cerca de ti</li>
            <li (click)="quickAsk('eventos esta noche')">🎉 Eventos esta noche</li>
            <li (click)="quickAsk('planes y precios')">💰 Planes y precios</li>
            <li (click)="quickAsk('promociones activas')">🔥 Promociones activas</li>
          </ul>
          <p class="hint">Selecciona una opción o escribe tu pregunta</p>
        </div>

        <div *ngFor="let msg of messages()" class="message" [class.user]="msg.role === 'user'" [class.bot]="msg.role === 'assistant'">
          <div class="bubble">{{ msg.content }}</div>
          <div class="time">{{ msg.createdAt | date:'HH:mm' }}</div>
        </div>

        <div *ngIf="loading()" class="message bot">
          <div class="bubble typing">
            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          </div>
        </div>
      </div>

      <div class="chat-input" *ngIf="isAuthenticated()">
        <input type="text" 
               [(ngModel)]="inputMessage" 
               (keyup.enter)="sendMessage()"
               placeholder="Escribe tu pregunta..."
               [disabled]="loading()" />
        <button (click)="sendMessage()" [disabled]="loading() || !inputMessage.trim()">➤</button>
      </div>

      <div class="chat-input" *ngIf="!isAuthenticated()">
        <a routerLink="/login" class="login-prompt">Inicia sesión para chatear</a>
      </div>
    </div>
  `,
  styles: [`
    .chat-fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #007bff, #0056b3);
      border: none;
      box-shadow: 0 4px 20px rgba(0,123,255,0.4);
      cursor: pointer;
      font-size: 1.5rem;
      z-index: 9999;
      transition: transform 0.2s, box-shadow 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .chat-fab:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 25px rgba(0,123,255,0.5);
    }
    .chat-fab span { color: white; }
    .badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #e74c3c;
      color: white;
      font-size: 0.7rem;
      padding: 2px 6px;
      border-radius: 10px;
      font-weight: bold;
    }

    .chat-window {
      position: fixed;
      bottom: 100px;
      right: 24px;
      width: 360px;
      height: 500px;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      display: flex;
      flex-direction: column;
      z-index: 9998;
      overflow: hidden;
    }

    .chat-header {
      background: linear-gradient(135deg, #007bff, #0056b3);
      color: white;
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .chat-header h4 { margin: 0; font-size: 1rem; }
    .status { font-size: 0.8rem; }
    .status.online { color: #2ecc71; }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      background: #f8f9fa;
    }

    .welcome {
      background: #fff;
      padding: 1rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      margin-bottom: 1rem;
    }
    .welcome p { margin: 0 0 0.5rem; font-size: 0.9rem; }
    .welcome ul { margin: 0.5rem 0; padding-left: 1.2rem; }
    .welcome li {
      cursor: pointer;
      padding: 0.25rem 0;
      font-size: 0.85rem;
      color: #007bff;
    }
    .welcome li:hover { text-decoration: underline; }
    .hint { font-size: 0.75rem !important; color: #888; }

    .message { margin-bottom: 0.75rem; }
    .message.user { text-align: right; }
    .bubble {
      display: inline-block;
      padding: 0.6rem 1rem;
      border-radius: 16px;
      max-width: 80%;
      font-size: 0.9rem;
      line-height: 1.4;
      word-wrap: break-word;
    }
    .message.user .bubble {
      background: #007bff;
      color: white;
      border-bottom-right-radius: 4px;
    }
    .message.bot .bubble {
      background: #fff;
      color: #333;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .time { font-size: 0.7rem; color: #999; margin-top: 2px; }
    .message.user .time { text-align: right; }

    .typing { display: flex; gap: 4px; padding: 0.8rem 1rem; }
    .dot {
      width: 8px;
      height: 8px;
      background: #999;
      border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out;
    }
    .dot:nth-child(1) { animation-delay: -0.32s; }
    .dot:nth-child(2) { animation-delay: -0.16s; }
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }

    .chat-input {
      display: flex;
      padding: 0.75rem;
      border-top: 1px solid #eee;
      background: #fff;
    }
    .chat-input input {
      flex: 1;
      padding: 0.6rem 0.8rem;
      border: 1px solid #ddd;
      border-radius: 20px;
      font-size: 0.9rem;
      outline: none;
    }
    .chat-input input:focus { border-color: #007bff; }
    .chat-input button {
      margin-left: 0.5rem;
      padding: 0.6rem 1rem;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
    }
    .chat-input button:disabled { background: #ccc; }
    .login-prompt {
      flex: 1;
      text-align: center;
      color: #007bff;
      text-decoration: none;
      font-size: 0.9rem;
      padding: 0.5rem;
    }

    @media (max-width: 480px) {
      .chat-window {
        width: calc(100vw - 32px);
        height: 60vh;
        bottom: 90px;
        right: 16px;
      }
    }
  `]
})
export class ChatbotWidgetComponent {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  private readonly chatbotService = inject(ChatbotService);
  private readonly authStore = inject(AuthStoreService);

  readonly isOpen = signal(false);
  readonly messages = signal<ChatMessage[]>([]);
  readonly loading = signal(false);
  readonly unreadCount = signal(0);
  readonly isOnline = signal(true);

  inputMessage = '';
  private lastMessageCount = 0;

  isAuthenticated(): boolean {
    return this.authStore.isAuthenticated();
  }

  toggleChat(): void {
    this.isOpen.update(v => !v);
    if (this.isOpen()) {
      this.unreadCount.set(0);
      this.scrollToBottom();
    }
  }

  quickAsk(question: string): void {
    this.inputMessage = question;
    this.sendMessage();
  }

  sendMessage(): void {
    if (!this.inputMessage.trim() || this.loading()) return;

    const userMessage = this.inputMessage.trim();
    this.inputMessage = '';

    this.messages.update(msgs => [...msgs, {
      id: Date.now().toString(),
      conversationId: '',
      role: 'user' as const,
      content: userMessage,
      createdAt: new Date().toISOString()
    }]);

    this.scrollToBottom();
    this.loading.set(true);

    this.chatbotService.sendMessage(userMessage).subscribe({
      next: (response) => {
        this.messages.update(msgs => [...msgs, response.message]);
        this.loading.set(false);
        this.scrollToBottom();
      },
      error: () => {
        this.messages.update(msgs => [...msgs, {
          id: Date.now().toString(),
          conversationId: '',
          role: 'assistant' as const,
          content: 'Lo siento, tuve un problema. ¿Podrías intentar de nuevo?',
          createdAt: new Date().toISOString()
        }]);
        this.loading.set(false);
        this.scrollToBottom();
      }
    });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer?.nativeElement) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }
}
