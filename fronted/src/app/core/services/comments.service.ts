import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Comment, CommentStats } from '../models/api.models';

@Injectable({
  providedIn: 'root',
})
export class CommentsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/comments`;

  list(params: { placeId?: string; eventId?: string; page?: number; pageSize?: number }): Observable<CommentStats> {
    return this.http.get<CommentStats>(this.apiUrl, { params: params as any });
  }

  create(data: { placeId?: string; eventId?: string; content: string; rating?: number }): Observable<Comment> {
    return this.http.post<Comment>(this.apiUrl, data);
  }
}
