import { Component, inject, OnInit, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatbotService } from '../../core/services/chatbot.service';
import { ChatMessage } from '../../core/models/feature.models';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-container">
      <div class="chat-header">
        <h3>Asistente Ubica2</h3>
      </div>
      
      <div class="chat-messages" #messagesContainer>
        <div *ngIf="messages().length === 0" class="welcome-message">
          <p>¡Hola! Soy tu asistente de Ubica2. Puedo ayudarte a encontrar:</p>
          <ul>
            <li>Lugares cerca de ti</li>
            <li>Eventos upcoming</li>
            <li>Recomendaciones personalizadas</li>
          </ul>
          <p>¿En qué puedo ayudarte hoy?</p>
        </div>
        
        <div *ngFor="let msg of messages()" 
             class="message" 
             [class.user]="msg.role === 'user'"
             [class.bot]="msg.role === 'assistant'">
          <div class="message-content">{{ msg.content }}</div>
          <div class="message-time">{{ msg.createdAt | date:'shortTime' }}</div>
        </div>
        
        <div *ngIf="loading()" class="message bot">
          <div class="message-content typing">Escribiendo...</div>
        </div>
      </div>
      
      <div class="chat-input">
        <input type="text" 
               [(ngModel)]="inputMessage" 
               (keyup.enter)="sendMessage()"
               placeholder="Escribe tu mensaje..."
               [disabled]="loading()" />
        <button (click)="sendMessage()" [disabled]="loading() || !inputMessage.trim()">
          Enviar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .chat-container {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 100px);
      max-width: 600px;
      margin: 0 auto;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .chat-header {
      background: #007bff;
      color: white;
      padding: 1rem;
    }
    .chat-header h3 { margin: 0; }
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      background: #f5f5f5;
    }
    .welcome-message {
      background: #fff;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
    }
    .welcome-message ul { margin: 0.5rem 0; padding-left: 1.5rem; }
    .message {
      margin-bottom: 1rem;
      max-width: 80%;
    }
    .message.user {
      margin-left: auto;
    }
    .message.bot {
      margin-right: auto;
    }
    .message-content {
      padding: 0.75rem;
      border-radius: 12px;
      line-height: 1.4;
    }
    .message.user .message-content {
      background: #007bff;
      color: white;
      border-bottom-right-radius: 4px;
    }
    .message.bot .message-content {
      background: #fff;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .message-time {
      font-size: 0.7rem;
      color: #999;
      margin-top: 0.25rem;
    }
    .message.user .message-time { text-align: right; }
    .typing { font-style: italic; color: #666; }
    .chat-input {
      display: flex;
      padding: 1rem;
      background: #fff;
      border-top: 1px solid #eee;
    }
    .chat-input input {
      flex: 1;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }
    .chat-input button {
      margin-left: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .chat-input button:disabled { background: #ccc; }
  `]
})
export class ChatbotComponent implements OnInit {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  
  private readonly chatbotService = inject(ChatbotService);
  
  readonly messages = signal<ChatMessage[]>([]);
  readonly loading = signal(false);
  inputMessage = '';

  ngOnInit(): void {}

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
          content: 'Lo siento, tuve un problema al procesar tu mensaje. ¿Podrías intentar de nuevo?',
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
