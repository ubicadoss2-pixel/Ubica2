import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AnalyticsSummary, AuditLog, Report } from '../../core/models/api.models';
import { AdminService } from '../../core/services/admin.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { ReportsService } from '../../core/services/reports.service';
import { VerificationService, VerificationItem } from '../../core/services/verification.service';

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
  private readonly verificationService = inject(VerificationService);
  private readonly fb = inject(FormBuilder);

  readonly summary = signal<AnalyticsSummary | null>(null);
  readonly reports = signal<Report[]>([]);
  readonly verifications = signal<VerificationItem[]>([]);
  readonly audit = signal<AuditLog[]>([]);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);

  // Users management
  readonly usersPage = signal<any>({ items: [], total: 0 });
  readonly searchUser = signal('');
  readonly filterRole = signal('');
  readonly activeTab = signal<'dashboard' | 'users' | 'verifications' | 'reports' | 'audit'>('dashboard');

  readonly moderationForm = this.fb.nonNullable.group({
    placeId: '',
    placeStatus: 'PUBLISHED',
    eventId: '',
    eventStatus: 'ACTIVE',
  });

  constructor() {
    this.loadAll();
  }

  setTab(tab: 'dashboard' | 'users' | 'verifications' | 'reports' | 'audit'): void {
    this.activeTab.set(tab);
    // Carga perezosa de datos según la pestaña si fuera necesario, 
    // pero por ahora mantenemos loadAll para simplicidad.
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
    this.loadVerifications();
    this.loadAudit();
    this.loadUsers();
  }

  loadVerifications(): void {
    this.verificationService.getVerifications().subscribe({
      next: (data) => this.verifications.set(data),
      error: (err) => this.error.set(err?.error?.message ?? 'No se cargaron verificaciones.'),
    });
  }

  verify(id: string, status: 'APPROVED' | 'REJECTED'): void {
    this.verificationService.updateStatus(id, status).subscribe({
      next: () => {
        this.info.set(`Solicitud ${status === 'APPROVED' ? 'aprobada' : 'rechazada'}.`);
        this.loadVerifications();
      },
      error: (err) => this.error.set(err?.error?.message ?? 'Error al actualizar verificación.'),
    });
  }

  loadUsers(): void {
    this.adminService.getUsers(1, 20, this.searchUser(), this.filterRole()).subscribe({
      next: (page) => this.usersPage.set(page),
      error: (err) => this.error.set(err?.error?.message ?? 'No se pudieron cargar los usuarios.'),
    });
  }

  updateUserRole(userId: string, targetSelectValue: string): void {
    this.adminService.updateUserRole(userId, targetSelectValue).subscribe({
      next: () => {
        this.info.set('Rol actualizado correctamente');
        this.loadUsers(); // refresh data
      },
      error: (err) => this.error.set('Error al actualizar los permisos'),
    });
  }

  onFilterEvent(event: Event, type: 'search' | 'role'): void {
    const val = (event.target as HTMLInputElement | HTMLSelectElement).value;
    if (type === 'search') {
      this.searchUser.set(val);
    } else {
      this.filterRole.set(val);
    }
    this.loadUsers();
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
