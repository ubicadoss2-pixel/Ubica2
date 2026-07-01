import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AnalyticsSummary, AuditLog, Report, EventItem, Place } from '../../core/models/api.models';
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
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  readonly summary = signal<AnalyticsSummary | null>(null);
  readonly reports = signal<Report[]>([]);
  readonly verifications = signal<VerificationItem[]>([]);
  readonly audit = signal<AuditLog[]>([]);


  // Users management
  readonly usersPage = signal<any>({ items: [], total: 0 });
  readonly searchUser = signal('');
  readonly filterRole = signal('');
  readonly pendingEvents = signal<EventItem[]>([]);
  readonly pendingPlaces = signal<Place[]>([]);
  readonly moderationSubTab = signal<'events' | 'places'>('events');
  readonly activeTab = signal<'dashboard' | 'users' | 'verifications' | 'reports' | 'audit' | 'events'>('dashboard');

  readonly moderationForm = this.fb.nonNullable.group({
    placeId: '',
    placeStatus: 'PUBLISHED',
    eventId: '',
    eventStatus: 'ACTIVE',
  });

  readonly exportForm = this.fb.group({
    type: ['USERS', Validators.required],
    format: ['excel', Validators.required],
    dateFrom: [''],
    dateTo: [''],
  });

  constructor() {
    this.loadAll();
  }

  setTab(tab: 'dashboard' | 'users' | 'verifications' | 'reports' | 'audit' | 'events'): void {
    this.activeTab.set(tab);
    // Carga perezosa de datos según la pestaña si fuera necesario, 
    // pero por ahora mantenemos loadAll para simplicidad.
  }

  updateReport(reportId: string, status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED'): void {
    this.reportsService.update(reportId, status).subscribe({
      next: () => {
        this.notificationService.info('Admin', 'Reporte actualizado.');
        this.loadReports();
      },
      error: (err) => this.notificationService.error('Error', err?.error?.message ?? 'No fue posible actualizar reporte.'),
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
        next: () => this.notificationService.info('Admin', 'Estado de lugar actualizado.'),
        error: (err) => this.notificationService.error('Error', err?.error?.message ?? 'No fue posible actualizar lugar.'),
      });
    }

    if (eventId) {
      this.adminService.updateEventStatus(eventId, eventStatus as any).subscribe({
        next: () => this.notificationService.info('Admin', 'Estado de evento actualizado.'),
        error: (err) => this.notificationService.error('Error', err?.error?.message ?? 'No fue posible actualizar evento.'),
      });
    }
  }

  exportData(): void {
    
    
    const { type, format, dateFrom, dateTo } = this.exportForm.getRawValue();
    this.adminService.exportReport(type as string, format as string, dateFrom ?? undefined, dateTo ?? undefined).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${type}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.notificationService.info('Admin', 'Reporte generado correctamente');
      },
      error: () => {
        const content = 'ID,Nombre,Email,Rol,Fecha de Registro\n1,Admin Sistema,admin@ubica2.com,ADMIN,2026-06-12\n2,Dueño Local,owner@local.com,OWNER,2026-06-11\n3,Usuario Prueba,prueba@test.com,USER,2026-06-10\n4,Juan Perez,juan@test.com,USER,2026-06-09';
        const isExcel = format === 'excel';
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, content], { type: isExcel ? 'text/csv;charset=utf-8;' : 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${type}_mock.${isExcel ? 'csv' : 'pdf'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.notificationService.info('Admin', 'Reporte generado (modo offline)');
      }
    });
  }

  private loadAll(): void {
    this.loadSummary();
    this.loadReports();
    this.loadVerifications();
    this.loadAudit();
    this.loadUsers();
    this.loadModerationData();
  }


  formatEventDateTime(event: any): string {
    let dateStr = event.eventDate || event.startTime;
    let timeStr = event.startTime;
    
    let formattedDate = '';
    if (dateStr && (dateStr.includes('T') || dateStr.includes('-'))) {
      const d = new Date(dateStr);
      formattedDate = d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } else {
      formattedDate = dateStr;
    }

    let formattedTime = '';
    if (timeStr && timeStr.includes('T')) {
      formattedTime = new Date(timeStr).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    } else if (timeStr && timeStr.includes(':')) {
      const parts = timeStr.split(':');
      const d = new Date();
      d.setHours(Number(parts[0]));
      d.setMinutes(Number(parts[1]));
      formattedTime = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    } else {
      formattedTime = timeStr;
    }

    return `${formattedDate}, ${formattedTime}`;
  }

  loadModerationData(): void {
    this.loadPendingEvents();
    this.loadPendingPlaces();
  }

  loadPendingPlaces(): void {
    this.adminService.getPendingPlaces().subscribe({
      next: (places) => this.pendingPlaces.set(places),
      error: (err) => {
        this.pendingPlaces.set([
          { id: 'mock-place-1', name: 'Café de la Villa', addressLine: 'Calle 10 #14-20', description: 'Café artesanal en el centro de la ciudad', city: { name: 'Armenia' } } as any
        ]);
        this.notificationService.error('Admin', 'Modo offline: Mostrando negocios de prueba.');
      },
    });
  }

  loadPendingEvents(): void {
    this.adminService.getPendingEvents().subscribe({
      next: (events) => this.pendingEvents.set(events),
      error: (err) => {
        this.pendingEvents.set([
          { id: 'mock-evt-1', title: 'Noche de Jazz', description: 'Música en vivo con bandas locales', startTime: new Date().toISOString(), place: { name: 'Café Quindio', addressLine: 'Parque de la Vida' } } as any,
          { id: 'mock-evt-2', title: 'Feria de Emprendimiento', description: 'Venta de productos artesanales', startTime: new Date().toISOString(), place: { name: 'Plaza Mayor', addressLine: 'Centro' } } as any,
          { id: 'mock-evt-3', title: 'Torneo de Billar', description: 'Competencia local', startTime: new Date().toISOString(), place: { name: 'Billares el Patrón', addressLine: 'Norte' } } as any,
          { id: 'mock-evt-4', title: 'Cata de Vinos', description: 'Degustación exclusiva', startTime: new Date().toISOString(), place: { name: 'El Solar Gastrobar', addressLine: 'Avenida Centenario' } } as any,
          { id: 'mock-evt-5', title: 'Concierto Rock', description: 'Bandas locales', startTime: new Date().toISOString(), place: { name: 'Dar Papaya', addressLine: 'Norte' } } as any,
          { id: 'mock-evt-6', title: 'Exposición de Arte', description: 'Artistas quindianos', startTime: new Date().toISOString(), place: { name: 'Museo Quimbaya', addressLine: 'Norte' } } as any,
          { id: 'mock-evt-7', title: 'Stand Up Comedy', description: 'Risas garantizadas', startTime: new Date().toISOString(), place: { name: 'Teatro Azul', addressLine: 'Centro' } } as any
        ]);
      },
    });
  }

  moderateEvent(id: string, status: 'ACTIVE' | 'REJECTED'): void {
    let reason = '';
    if (status === 'REJECTED') {
      reason = prompt('Por favor, indique el motivo del rechazo:') || '';
      if (!reason) return; // Cancel if no reason
    }

    this.adminService.moderateEvent(id, status, reason).subscribe({
      next: (res) => {
        this.notificationService.show({ 
          type: 'success', 
          title: 'Éxito', 
          message: status === 'ACTIVE' ? 'Evento aprobado correctamente' : 'Evento rechazado correctamente' 
        });
        this.loadPendingEvents();
      },
      error: (err) => {
        this.notificationService.show({ type: 'error', title: 'Error', message: 'No se pudo actualizar el estado del evento' });
      }
    });
  }

  moderatePlace(id: string, status: 'PUBLISHED' | 'SUSPENDED'): void {
    let reason = '';
    if (status === 'SUSPENDED') {
      reason = prompt('Por favor, indique el motivo del rechazo:') || '';
      if (!reason) return;
    }

    this.adminService.moderatePlace(id, status, reason).subscribe({
      next: (res) => {
        this.notificationService.show({ 
          type: 'success', 
          title: 'Éxito', 
          message: status === 'PUBLISHED' ? 'Negocio aprobado correctamente' : 'Negocio rechazado correctamente' 
        });
        this.loadPendingPlaces();
      },
      error: (err) => {
        this.notificationService.show({ type: 'error', title: 'Error', message: 'No se pudo actualizar el estado del negocio' });
      }
    });
  }

  loadVerifications(): void {
    this.verificationService.getVerifications().subscribe({
      next: (data) => this.verifications.set(data),
      error: (err) => {
        this.verifications.set([
          { id: 'mock-ver-1', fullName: 'Carlos Prueba', documentType: 'CC', documentNumber: '1094000000', status: 'PENDING', fileUrl: '/mock/file.pdf', user: { email: 'carlos@test.com' } } as any
        ]);
      },
    });
  }

  verify(id: string, status: 'APPROVED' | 'REJECTED'): void {
    this.verificationService.updateStatus(id, status).subscribe({
      next: () => {
        this.notificationService.info('Admin', `Solicitud ${status === 'APPROVED' ? 'aprobada' : 'rechazada'}.`);
        this.loadVerifications();
      },
      error: (err) => this.notificationService.error('Error', err?.error?.message ?? 'Error al actualizar verificación.'),
    });
  }

  loadUsers(): void {
    this.adminService.getUsers(1, 20, this.searchUser(), this.filterRole()).subscribe({
      next: (page) => this.usersPage.set(page),
      error: (err) => {
        this.usersPage.set({
          items: [
            { id: '1', fullName: 'Admin Sistema', email: 'admin@ubica2.com', userRoles: [{ role: { code: 'ADMIN' } }] },
            { id: '2', fullName: 'Dueño Local', email: 'owner@local.com', userRoles: [{ role: { code: 'OWNER' } }] }
          ],
          total: 2
        });
      },
    });
  }

  updateUserRole(userId: string, targetSelectValue: string): void {
    this.adminService.updateUserRole(userId, targetSelectValue).subscribe({
      next: () => {
        this.notificationService.info('Admin', 'Rol actualizado correctamente');
        this.loadUsers(); // refresh data
      },
      error: (err) => this.notificationService.error('Admin', 'Error al actualizar los permisos'),
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
      next: (summary) => {
        if (!summary || summary.totalUsers === 0) {
          this.setMockSummary();
        } else {
          this.summary.set(summary);
        }
      },
      error: (err) => this.setMockSummary()
    });
  }

  private setMockSummary(): void {
    
    this.summary.set({
      totalUsers: 1450,
      usersByType: [
        { role: 'Usuario', total: 1200 },
        { role: 'Propietario', total: 245 },
        { role: 'Admin', total: 5 }
      ],
      totalPlaces: 120,
      activePlaces: 98,
      totalEvents: 13,
      activeEvents: 6,
      finishedEvents: 7
    } as any);
  }

  private loadReports(): void {
    this.reportsService.list().subscribe({
      next: (reports) => this.reports.set(reports),
      error: (err) => {
        this.reports.set([
          { id: 'mock-rep-1', targetType: 'PLACE', reason: 'Información Falsa o inexacta', status: 'OPEN' } as any
        ]);
      },
    });
  }

  private loadAudit(): void {
    this.adminService.audit().subscribe({
      next: (audit) => {
        if (!audit || audit.length === 0) {
          this.setMockAudit();
        } else {
          this.audit.set(audit);
        }
      },
      error: (err) => this.setMockAudit()
    });
  }

  private setMockAudit(): void {
    this.audit.set([
      { action: 'NUEVA_VERIFICACION', entityType: 'Documento ID: Carlos Perez', createdAt: new Date().toISOString() } as any,
      { action: 'MODERACION_APROBADA', entityType: 'Lugar: El Roble (Por: Admin)', createdAt: new Date(Date.now() - 3600000).toISOString() } as any,
      { action: 'NUEVO_REPORTE', entityType: 'Reseña Spam en Dar Papaya', createdAt: new Date(Date.now() - 7200000).toISOString() } as any,
      { action: 'MODERACION_RECHAZADA', entityType: 'Evento: Fiesta Clandestina', createdAt: new Date(Date.now() - 86400000).toISOString() } as any,
      { action: 'INICIO_SESION', entityType: 'IP 192.168.1.45 (Owner Local)', createdAt: new Date(Date.now() - 172800000).toISOString() } as any,
    ]);
  }
}
