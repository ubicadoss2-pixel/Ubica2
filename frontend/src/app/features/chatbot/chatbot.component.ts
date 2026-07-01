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
          <p>¡Hola! Qué bueno verte por aquí. Soy tu asistente de Ubica2, ¡listo para ayudarte a armar el mejor parche!</p>
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
      background: var(--surface-card);
      border-radius: 8px;
      box-shadow: var(--shadow-md);
      overflow: hidden;
      border: 1px solid var(--border-quiet);
    }
    .chat-header {
      background: var(--identity-gradient, var(--identity-glow));
      color: var(--ink-on-primary);
      padding: 1rem;
    }
    .chat-header h3 { margin: 0; }
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      background: var(--surface-soft);
    }
    .welcome-message {
      background: var(--surface-card);
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      border: 1px solid var(--border-quiet);
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
      background: var(--identity-glow);
      color: var(--ink-on-primary);
      border-bottom-right-radius: 4px;
    }
    .message.bot .message-content {
      background: var(--surface-card);
      border-bottom-left-radius: 4px;
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--border-quiet);
    }
    .message-time {
      font-size: 0.7rem;
      color: var(--ink-muted);
      margin-top: 0.25rem;
    }
    .message.user .message-time { text-align: right; }
    .typing { font-style: italic; color: var(--ink-secondary); }
    .chat-input {
      display: flex;
      padding: 1rem;
      background: var(--surface-card);
      border-top: 1px solid var(--border-quiet);
    }
    .chat-input input {
      flex: 1;
      padding: 0.75rem;
      border: 1px solid var(--border-quiet);
      border-radius: 4px;
      font-size: 1rem;
      background: var(--bg-input, var(--surface-soft));
      color: var(--ink-primary);
    }
    .chat-input button {
      margin-left: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: var(--identity-glow);
      color: var(--ink-on-primary);
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .chat-input button:disabled { opacity: 0.6; cursor: not-allowed; }
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
          content: this.generateHumanResponse(userMessage),
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

  private generateHumanResponse(msg: string): string {
    const text = msg.toLowerCase();
    if (text.includes('hola') || text.includes('buenos') || text.includes('saludos')) {
      return '¡Hola! Qué gusto saludarte. ¿En qué te puedo ayudar hoy? Estoy aquí para recomendarte los mejores parches en Armenia.';
    }
    if (text.includes('recomend') || text.includes('donde') || text.includes('dónde') || text.includes('plan')) {
      return '¡Claro que sí! Si buscas rumba, te recomiendo muchísimo "El Chalet" o "Samba Caramba", ¡el ambiente es espectacular! Si prefieres algo más tranquilo o para comer, "Arepas Nattys" es una parada obligatoria. ¿Qué tipo de ambiente buscas hoy?';
    }
    if (text.includes('reseña') || text.includes('comentar') || text.includes('opinión')) {
      return 'Para dejar una reseña, es súper fácil: Ve a la página principal de "Explorar", busca el lugar que visitaste y haz clic en su nombre o en "Ver Detalles". Abajo encontrarás la sección "Opiniones de usuarios" donde podrás ponerle una calificación de estrellas y dejar tu comentario.';
    }
    if (text.includes('gracias')) {
      return '¡Con todo gusto! Para eso estoy. Si necesitas algo más, aquí estaré. ¡Que la pases genial!';
    }
    return 'Entiendo... Como tu asistente local, mi objetivo es que tengas la mejor experiencia. Cuéntame un poquito más de lo que tienes en mente y con gusto te armo un buen plan a tu medida. ¡Aquí estoy para ayudarte!';
  }
}
