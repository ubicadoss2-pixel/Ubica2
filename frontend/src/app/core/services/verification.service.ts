import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

export interface VerificationRequest {
  fullName: string;
  documentType: string;
  documentNumber: string;
  file: File;
}

export interface VerificationItem {
  id: string;
  fullName: string;
  documentType: string;
  documentNumber: string;
  fileUrl: string;
  status: string;
  createdAt: string;
  user?: { email: string };
}

@Injectable({ providedIn: 'root' })
export class VerificationService extends ApiService {
  submitVerification(data: VerificationRequest) {
    const formData = new FormData();
    formData.append('fullName', data.fullName);
    formData.append('documentType', data.documentType);
    formData.append('documentNumber', data.documentNumber);
    formData.append('archivo', data.file);

    return this.http.post<VerificationItem>(`${this.baseUrl}/verificacion`, formData);
  }

  getMyStatus() {
    return this.http.get<VerificationItem | null>(`${this.baseUrl}/verificacion/me`);
  }

  getVerifications() {
    return this.http.get<VerificationItem[]>(`${this.baseUrl}/verificacion`);
  }

  updateStatus(id: string, status: string) {
    return this.http.put<VerificationItem>(`${this.baseUrl}/verificacion/${id}`, { status });
  }
}
