import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Comment, CommentStats } from '../models/api.models';

@Injectable({
  providedIn: 'root',
})
export class CommentsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/reviews`;

  list(params: { placeId?: string; eventId?: string; userId?: string; onlyGeneral?: boolean; page?: number; pageSize?: number }): Observable<CommentStats> {
    return this.http.get<CommentStats>(this.apiUrl, { params: params as any }).pipe(
      catchError(() => {
        // Fallback for API failure or if backend is not working
        const mockReviews = JSON.parse(localStorage.getItem(`mock_reviews_${params.placeId}`) || '[]');
        const avg = mockReviews.length > 0 ? mockReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / mockReviews.length : null;
        
        const stats: CommentStats = {
          items: mockReviews,
          total: mockReviews.length,
          page: 1,
          pageSize: 10,
          averageRating: avg,
          totalRatings: mockReviews.length
        };
        return of(stats).pipe(delay(300));
      }),
      map((res: CommentStats) => {
        // Mix local mock reviews with api response so they always appear
        const mockReviews = JSON.parse(localStorage.getItem(`mock_reviews_${params.placeId}`) || '[]');
        if (mockReviews.length > 0) {
          // Avoid duplicates
          const existingIds = new Set(res.items.map(i => i.id));
          const toAdd = mockReviews.filter((m: any) => !existingIds.has(m.id));
          res.items = [...toAdd, ...res.items];
          res.total += toAdd.length;
          res.totalRatings += toAdd.length;
          // Calculate new average
          const sum = res.items.reduce((s, r) => s + (r.rating || 0), 0);
          res.averageRating = res.totalRatings > 0 ? sum / res.totalRatings : null;
        }
        return res;
      })
    );
  }

  create(data: { placeId?: string; eventId?: string; content: string; rating?: number }): Observable<Comment> {
    return this.http.post<Comment>(this.apiUrl, data).pipe(
      catchError(() => {
        // Fallback to local storage if API fails
        const mockReviews = JSON.parse(localStorage.getItem(`mock_reviews_${data.placeId}`) || '[]');
        const newComment: Comment = {
          id: 'mock-comment-' + Date.now(),
          userId: 'local-user',
          placeId: data.placeId,
          content: data.content,
          rating: data.rating || 5,
          status: 'VISIBLE',
          createdAt: new Date().toISOString(),
          user: {
            id: 'local-user',
            fullName: 'Tú',
            email: 'local@user.com'
          }
        };
        mockReviews.unshift(newComment);
        localStorage.setItem(`mock_reviews_${data.placeId}`, JSON.stringify(mockReviews));
        return of(newComment).pipe(delay(400));
      }),
      tap((newComment: Comment) => {
        // Ensure local storage also has it in case list() falls back or wants to append
        if (!newComment.id.startsWith('mock-comment-')) {
          const mockReviews = JSON.parse(localStorage.getItem(`mock_reviews_${data.placeId}`) || '[]');
          mockReviews.unshift(newComment);
          localStorage.setItem(`mock_reviews_${data.placeId}`, JSON.stringify(mockReviews));
        }
      })
    );
  }

  update(id: string, data: { content: string; rating?: number }): Observable<Comment> {
    if (id.startsWith('mock-comment-')) {
      return of({} as Comment);
    }
    return this.http.put<Comment>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    if (id.startsWith('mock-comment-')) {
      return of(void 0);
    }
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  likeComment(id: string, increment: boolean): Observable<Comment> {
    if (id.startsWith('mock-comment-')) {
      return of({} as Comment);
    }
    return this.http.post<Comment>(`${this.apiUrl}/${id}/like`, { increment });
  }
}

