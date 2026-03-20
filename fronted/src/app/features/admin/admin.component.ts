import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AnalyticsSummary, AuditLog, Report } from '../../core/models/api.models';
import { AdminService } from '../../core/services/admin.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { ReportsService } from '../../core/services/reports.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly reportsService = inject(ReportsService);
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);

  readonly summary = signal<AnalyticsSummary | null>(null);
  readonly reports = signal<Report[]>([]);
  readonly audit = signal<AuditLog[]>([]);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);

  readonly moderationForm = this.fb.nonNullable.group({
    placeId: '',
    placeStatus: 'PUBLISHED',
    eventId: '',
    eventStatus: 'ACTIVE',
  });

  constructor() {
    this.loadAll();
  }

  updateReport(reportId: string, status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED'): void {
    this.reportsService.update(reportId, status).subscribe({
      next: () => {
        this.info.set('Reporte actualizado.');
        this.loadReports();
      },
      error: (err) => this.error.set(err?.error?.message ?? 'No fue posible actualizar reporte.'),
    });
  }

  updateReportFromValue(reportId: string, status: string): void {
    if (status !== 'OPEN' && status !== 'IN_REVIEW' && status !== 'RESOLVED' && status !== 'REJECTED') {
      return;
    }
    this.updateReport(reportId, status);
  }

  applyModeration(): void {
    const { placeId, placeStatus, eventId, eventStatus } = this.moderationForm.getRawValue();

    if (placeId) {
      this.adminService.updatePlaceStatus(placeId, placeStatus as any).subscribe({
        next: () => this.info.set('Estado de lugar actualizado.'),
        error: (err) => this.error.set(err?.error?.message ?? 'No fue posible actualizar lugar.'),
      });
    }

    if (eventId) {
      this.adminService.updateEventStatus(eventId, eventStatus as any).subscribe({
        next: () => this.info.set('Estado de evento actualizado.'),
        error: (err) => this.error.set(err?.error?.message ?? 'No fue posible actualizar evento.'),
      });
    }
  }

  private loadAll(): void {
    this.loadSummary();
    this.loadReports();
    this.loadAudit();
  }

  private loadSummary(): void {
    this.analyticsService.summary().subscribe({
      next: (summary) => this.summary.set(summary),
      error: (err) => this.error.set(err?.error?.message ?? 'No se pudo cargar analítica.'),
    });
  }

  private loadReports(): void {
    this.reportsService.list().subscribe({
      next: (reports) => this.reports.set(reports),
      error: (err) => this.error.set(err?.error?.message ?? 'No se pudieron cargar reportes.'),
    });
  }

  private loadAudit(): void {
    this.adminService.audit().subscribe({
      next: (audit) => this.audit.set(audit),
      error: (err) => this.error.set(err?.error?.message ?? 'No se pudo cargar auditoría.'),
    });
  }
}
