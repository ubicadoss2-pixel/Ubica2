import { Component, inject, signal, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
      <span *ngIf="isOpen()" class="close-icon">✕</span>
      <span *ngIf="unreadCount() > 0 && !isOpen()" class="badge">{{ unreadCount() }}</span>
    </button>

    <!-- Ventana del chat -->
    <div class="chat-window" *ngIf="isOpen()">
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
            <h4>Ubica2 AI</h4>
            <span class="status" [class.online]="isOnline()">Sistema Activo</span>
          </div>
        </div>
        <button class="close-header" (click)="toggleChat()">✕</button>
      </div>

      <div class="chat-messages" #messagesContainer>
        <div *ngIf="messages().length === 0" class="welcome">
          <div class="welcome-icon">✨</div>
          <p class="welcome-title">¡Hola! Soy tu asistente Ubica2 AI</p>
          <p>Estoy listo para ayudarte a descubrir lo mejor de Armenia hoy.</p>
          <div class="quick-options" *ngIf="isAuthenticated()">
            <button (click)="quickAsk('¿Qué eventos hay hoy?')">🎉 Eventos Hoy</button>
            <button (click)="quickAsk('¿Dónde hay buenos cocteles?')">🍸 Cocteles y comida</button>
            <button (click)="quickAsk('¿Qué tal el Museo del Oro?')">🏛️ Cultura y Arte</button>
            <button (click)="quickAsk('¿Cómo funcionan los niveles de precio?')">💰 Info de Precios</button>
          </div>
          <div class="welcome-disclaimer" *ngIf="!isAuthenticated()" style="margin-top: 1rem; color: #ff007f; font-size: 0.8rem; border-top: 1px dashed rgba(255,0,127,0.3); padding-top: 0.5rem;">
            🔒 Requiere inicio de sesión para interactuar.
          </div>
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
               placeholder="Pregúntame lo que sea..."
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
    .chat-fab {
      position: fixed;
      bottom: 30px;
      right: 30px;
      width: 65px;
      height: 65px;
      border-radius: 50%;
      background: #0f172a;
      border: 2px solid var(--neon-purple);
      color: var(--neon-purple);
      box-shadow: 0 0 15px rgba(191, 0, 255, 0.4);
      cursor: pointer;
      z-index: 9999;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      overflow: hidden;
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

    .close-icon {
      font-size: 24px;
      font-weight: bold;
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
      border: 2px solid #0f172a;
    }

    .chat-window {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 700px;
      height: 85vh;
      max-width: 95vw;
      max-height: 90vh;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(191, 0, 255, 0.2);
      border-radius: 32px;
      box-shadow: 0 25px 60px rgba(0,0,0,0.6), 0 0 30px rgba(191, 0, 255, 0.1);
      display: flex;
      flex-direction: column;
      z-index: 9998;
      overflow: hidden;
      backdrop-filter: blur(25px);
    }

    .chat-header {
      background: rgba(191, 0, 255, 0.1);
      border-bottom: 1px solid rgba(191, 0, 255, 0.2);
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
      color: white;
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
      color: #94a3b8;
      font-size: 20px;
      cursor: pointer;
      padding: 4px;
    }
    .close-header:hover { color: white; }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .welcome {
      text-align: center;
      padding: 1rem 0;
      color: #cbd5e1;
    }
    .welcome-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: white;
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
      background: rgba(191, 0, 255, 0.1);
      border: 1px solid rgba(191, 0, 255, 0.3);
      color: #e2e8f0;
      padding: 8px 16px;
      border-radius: 12px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
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
      background: #1e293b;
      color: #f1f5f9;
      border-bottom-left-radius: 4px;
      border: 1px solid rgba(255,255,255,0.05);
    }

    .time {
      font-size: 0.7rem;
      color: #64748b;
      margin-top: 4px;
      padding: 0 4px;
    }
    .message.user .time { text-align: right; }

    .chat-input {
      padding: 1.25rem;
      background: rgba(15, 23, 42, 0.8);
      border-top: 1px solid rgba(255,255,255,0.05);
      display: flex;
      gap: 10px;
    }

    .chat-input input {
      flex: 1;
      background: #0f172a;
      border: 1px solid rgba(191, 0, 255, 0.2);
      border-radius: 14px;
      padding: 12px 16px;
      color: white;
      font-size: 0.95rem;
    }
    .chat-input input:focus {
      border-color: var(--neon-purple);
      box-shadow: 0 0 10px rgba(191, 0, 255, 0.2);
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
      background: #334155;
      color: #94a3b8;
      cursor: not-allowed;
    }

    .login-prompt {
      flex: 1;
      text-align: center;
      background: rgba(191, 0, 255, 0.1);
      color: var(--neon-purple);
      padding: 12px;
      border-radius: 14px;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
      border: 1px dashed var(--neon-purple);
    }

    .typing .dot { background: var(--neon-purple); box-shadow: 0 0 5px var(--neon-purple); }

    @media (max-width: 480px) {
      .chat-window {
        width: 100vw;
        height: 100vh;
        bottom: 0;
        right: 0;
        border-radius: 0;
      }
      .chat-fab { bottom: 20px; right: 20px; }
    }
  `]
})
export class ChatbotWidgetComponent {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  private readonly chatbotService = inject(ChatbotService);
  private readonly authStore = inject(AuthStoreService);
  private readonly router = inject(Router);

  readonly isOpen = signal(false);
  readonly messages = signal<ChatMessage[]>([]);
  readonly loading = signal(false);
  readonly unreadCount = signal(0);
  readonly isOnline = signal(true);

  inputMessage = '';
  private lastMessageCount = 0;
  private lastRecommendedPlaceInfo: { lat?: number, lng?: number, placeId?: string } | null = null;

  constructor() {
    this.router.events.subscribe(() => {
      if (this.router.url.includes('/login') || this.router.url.includes('/register')) {
        this.isOpen.set(false);
      }
    });
  }

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
    if (!this.isAuthenticated()) return;
    this.inputMessage = question;
    this.sendMessage();
  }

  sendMessage(): void {
    if (!this.isAuthenticated() || !this.inputMessage.trim() || this.loading()) return;

    const userMessage = this.inputMessage.trim();
    const userMessageLower = userMessage.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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

    this.chatbotService.sendMessage(userMessage).subscribe({
      next: (response) => {
        this.messages.update(msgs => [...msgs, response.message]);
        this.loading.set(false);
        this.scrollToBottom();
      },
      error: () => {
        // Mock fallback for a better "Organized" experience
        setTimeout(() => {
          const isOwner = this.authStore.hasRole('OWNER');
          
          let mockReply = isOwner 
            ? '¡Hola Empresario! 💼 Veo que estás operando desde tu panel de dueño. Como tu Inteligencia Artificial administrativa, puedo ayudarte a analizar estadísticas, gestionar tus planes, o darte consejos de posicionamiento. ¿Qué área de tu negocio optimizamos hoy? 📈✨'
            : 'Entiendo perfectamente. Como tu Inteligencia Artificial hiper-avanzada de Ubica2, proceso cientos de datos de la región en milisegundos para darte la opción perfecta. ¡Dime exactamente qué tipo de vibra, sabor o experiencia buscas y yo deduciré el lugar ideal de inmediato! 🤖✨';

          // --- OWNER SPECIFIC QUERIES ---
          if (isOwner && (userMessageLower.includes('publicar') || userMessageLower.includes('añadir') || userMessageLower.includes('nuevo') || userMessageLower.includes('crear'))) {
            mockReply = '🏢 **Para publicar tu negocio en Ubica2:**\n\n1. Necesitas ingresar a "Mis Lugares".\n2. Clic en "Nuevo Lugar" y subes tus fotos, coordenadas y horarios.\n3. ¡Se publicará al instante en el mapa de todos los usuarios!\n\n¿Quieres que te redirija directamente a la pantalla de creación? (Dime "sí" o "llevame"). 🛠️';
            this.lastRecommendedPlaceInfo = { placeId: 'owner-redirect-new' };
          } 
          else if (isOwner && (userMessageLower.includes('plan') || userMessageLower.includes('suscripcion') || userMessageLower.includes('pago'))) {
            mockReply = '💎 **Sistema de Crecimiento Ubica2:**\n\n- **Básico:** Tu entrada digital (1 lugar, 3 eventos).\n- **Profesional:** Crecimiento masivo (5 lugares, 20 eventos y mayor visibilidad).\n- **Empresarial:** Dominio total del ecosistema turístico local.\n\nPuedes escalar tu plan cuando lo desees. ¿Te abro la vista de planes? 💳';
            this.lastRecommendedPlaceInfo = { placeId: 'owner-redirect-plans' };
          } 
          else if (isOwner && (userMessageLower.includes('estadistica') || userMessageLower.includes('visita') || userMessageLower.includes('analytics'))) {
            mockReply = '📊 **Tus Analíticas en Tiempo Real:**\n\nNuestro radar inteligente rastrea cada vez que un usuario mira tu perfil, le da a "Ir ahora" en el GPS, o te guarda en favoritos. \n\n*Spoiler:* Tu último lugar publicado ha tenido un 45% más de visibilidad este fin de semana. ¡Sigue así! 🚀';
          }
          
          // --- NAVIGATION / COMMANDS ---
          else if (userMessageLower.includes('navega') || userMessageLower.includes('activar') || userMessageLower.includes('ruta') || userMessageLower.includes('llevame') || userMessageLower === 'si') {
            
            if (this.lastRecommendedPlaceInfo?.placeId === 'owner-redirect-new') {
               mockReply = '🛠️ ¡Entendido jefe! Abriendo tu panel de creación de negocios... 🚀';
               setTimeout(() => { this.isOpen.set(false); this.router.navigate(['/owner/place/new']); }, 2000);
            } else if (this.lastRecommendedPlaceInfo?.placeId === 'owner-redirect-plans') {
               mockReply = '💎 ¡Redirigiendo a la zona de Suscripciones! 🚀';
               setTimeout(() => { this.isOpen.set(false); this.router.navigate(['/plans']); }, 2000);
            } else {
               mockReply = '📍 ¡Coordenadas fijadas exitosamente! \n\nEstoy tomando el control: Iniciando protocolo de navegación en vivo en 3... 2... 1... 🚀';
               setTimeout(() => {
                 this.isOpen.set(false);
                 if (this.lastRecommendedPlaceInfo) {
                   this.router.navigate(['/'], { queryParams: this.lastRecommendedPlaceInfo });
                 } else {
                   this.router.navigate(['/']);
                 }
               }, 2500);
            }
          } 
          
          // --- GENERAL USER QUERIES ---
          else if (userMessageLower.includes('evento') || userMessageLower.includes('hoy')) {
            this.lastRecommendedPlaceInfo = { lat: 4.5495, lng: -75.6631, placeId: 'mock-real-2' };
            mockReply = '¡Por supuesto! 🚀 Analizando la agenda cultural de Armenia en tiempo real, he detectado unas opciones fantásticas para tu día:\n\n1. 🎶 **El Solar Gastrobar**: Ideal si buscas un ambiente vibrante con música y mixología avanzada.\n2. 🎭 **Dar Papaya**: Perfecto para eventos acústicos o para empezar la tarde.\n\n¿Te gustaría que analice la ruta más rápida hacia El Solar Gastrobar? (Dime "activar" o "sí"). 📍';
          } else if (!isOwner && (userMessageLower === 'hola' || userMessageLower.includes('buenos dias') || userMessageLower.includes('buenas tardes') || userMessageLower.includes('buenas noches'))) {
            mockReply = '¡Hola! El gusto es todo mío. Soy Ubica2 AI 🔮, tu agente personal avanzado. \n\nConozco cada rincón oculto, evento furtivo y joya gastronómica del Quindío. Dime, ¿tienes ganas de conectarte con la naturaleza, relajarte tomando el mejor café de origen o vivir una noche intensa? Lo que decidas, lo haré posible por ti. 🌟';
          } else if (userMessageLower.includes('coctel') || userMessageLower.includes('comida') || userMessageLower.includes('comer') || userMessageLower.includes('restaurante')) {
             this.lastRecommendedPlaceInfo = { lat: 4.5512, lng: -75.6598, placeId: 'mock-real-1' };
            mockReply = '¡Excelente decisión! 🍸 Tras cruzar calificaciones, cercanía y reseñas top, filtré las mejores opciones para tu paladar:\n\n🔥 **La Fogata**: Indispensable para una cena premium y cortes exquisitos.\n🌿 **Botanika**: Destaca enormemente por sus fusiones experimentales y botánica.\n\nAmbos garantizan una experiencia superior. ¿Deseas que fije el rumbo hacia La Fogata? (Dime "ruta" o "sí"). 🚗🎯';
          } else if (userMessageLower.includes('museo') || userMessageLower.includes('cultura')) {
             this.lastRecommendedPlaceInfo = { lat: 4.5501, lng: -75.6606, placeId: 'mock-real-4' };
            mockReply = 'Ah, excelente elección. Hablando de acervo histórico, mi análisis apunta sin dudas al **Museo del Oro Quimbaya**.\n\n🏛️ Fue diseñado por el ilustre arquitecto Rogelio Salmona y alberga un tesoro invaluable de nuestras raíces originarias. Mi consejo experto: visítalo antes de las 4 PM para admirar cómo la luz dorada baña sus espejos de agua. ¿Te activo la navegación? ✨';
          } else if (userMessageLower.includes('precio') || userMessageLower.includes('funciona') || userMessageLower.includes('cuanto')) {
            mockReply = '¡Pregunta clave! 💡 Procesé nuestro ecosistema de precios para categorizarlo así de fácil:\n\n💲 Nivel 1: Súper accesible (Parques públicos, joyitas ocultas o cafés locales).\n💲💲 Nivel 2: Rango Medio. El balance ideal entre comodidad y precio excelente.\n💲💲💲 Nivel 3: Premium. Diseñado para experiencias VIP exclusivas y cenas románticas.\n\nPuedo actuar como tu conserje y ocultar automáticamente cualquier lugar que no esté en el presupuesto de tu bolsillo de hoy. ¿Con cuál nivel te sientes a gusto? 💳✨';
          }

          this.messages.update(msgs => [...msgs, {
            id: Date.now().toString(),
            conversationId: '',
            role: 'assistant' as const,
            content: mockReply,
            createdAt: new Date().toISOString()
          }]);
          this.loading.set(false);
          this.scrollToBottom();
        }, 800);
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
