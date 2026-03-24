import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChatMessage, ChatConversation } from '../models/feature.models';

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  sendMessage(message: string, conversationId?: string): Observable<{ conversationId: string; message: ChatMessage }> {
    return this.http.post<{ conversationId: string; message: ChatMessage }>(
      `${this.baseUrl}/chatbot`,
      { message, conversationId }
    );
  }

  getConversations(): Observable<ChatConversation[]> {
    return this.http.get<ChatConversation[]>(`${this.baseUrl}/chatbot`);
  }

  getMessages(conversationId: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.baseUrl}/chatbot/${conversationId}`);
  }

  deleteConversation(conversationId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/chatbot/${conversationId}`);
  }
}
