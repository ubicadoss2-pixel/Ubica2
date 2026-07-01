import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { PlacesService } from '../../../core/services/places.service';
import { AuthStoreService } from '../../../core/services/auth-store.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

Chart.register(...registerables);

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit, AfterViewInit {
  @ViewChild('visitsChart') visitsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('ratingsChart') ratingsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('historyChart') historyChartRef!: ElementRef<HTMLCanvasElement>;

  private readonly analyticsService = inject(AnalyticsService);
  private readonly placesService = inject(PlacesService);
  private readonly authStore = inject(AuthStoreService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly http = inject(HttpClient);

  // Charts Instances
  visitsChart: any;
  ratingsChart: any;
  historyChart: any;

  // Filters
  startDate: string = '';
  endDate: string = '';
  selectedPlace: string = 'all';

  isLoading = true;

  get isAdmin() {
    return this.authStore.isAdmin();
  }

  // KPIs
  kpis = {
    totalVisits: 0,
    totalReservations: 0,
    totalFavorites: 0,
    averageRating: 0
  };

  // Automated Analysis Text
  analysisAlerts: { type: string; message: string }[] = [];

  // Owner places list for filter dropdown
  ownerPlaces: { id: string; name: string }[] = [];

  // Table Data (Reservations)
  tableData: any[] = [];
  filteredTableData: any[] = [];

  // Pagination
  currentPage = 1;
  pageSize = 5;
  get totalPages() { return Math.ceil(this.filteredTableData.length / this.pageSize); }
  get paginatedData() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredTableData.slice(start, start + this.pageSize);
  }

  // Sort
  sortColumn = 'date';
  sortAsc = false;

  // Chart data for dynamic updates
  private visitLabels: string[] = [];
  private visitData: number[] = [];
  private monthlyLabels: string[] = [];
  private monthlyTotals: number[] = [];
  private ratingDistribution = [0, 0, 0, 0, 0]; // 1, 2, 3, 4, 5 stars

  constructor() {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);
    this.endDate = today.toISOString().split('T')[0];
    this.startDate = lastMonth.toISOString().split('T')[0];
  }

  ngOnInit() {
    this.loadRealData();
  }

  ngAfterViewInit() {
    // Charts will be init'd after data loads via initCharts()
  }

  private loadRealData() {
    this.isLoading = true;
    const user = this.authStore.user();

    const params = new URLSearchParams();
    if (this.startDate) params.append('startDate', this.startDate);
    if (this.endDate) params.append('endDate', this.endDate);
    if (this.selectedPlace && this.selectedPlace !== 'all') params.append('placeId', this.selectedPlace);
    
    const query = params.toString() ? `?${params.toString()}` : '';

    forkJoin({
      summary: this.http.get(`${environment.apiBaseUrl}/analytics/summary${query}`).pipe(catchError(() => of(null))),
      places: user ? this.placesService.list({ ownerId: user.id, pageSize: 50 }).pipe(catchError(() => of(null))) : of(null),
      reservations: user ? this.http.get(`${environment.apiBaseUrl}/reservations/owner${query}`).pipe(catchError(() => of(null))) : of(null)
    }).subscribe(({ summary, places, reservations }) => {
      
      if (places) {
        this.ownerPlaces = (places as any).items ?? [];
      }

      if (summary) {
        const s = summary as any;
        this.kpis.totalVisits = (s.placeViews ?? 0) + (s.eventViews ?? 0);
        this.kpis.totalFavorites = s.totalFavorites ?? 0;
        this.kpis.averageRating = s.averageRating ?? 0;
        this.kpis.totalReservations = s.totalReservations ?? 0;
        
        // Build chart data directly from backend aggregations
        this.buildChartData(s.charts);
      } else {
        this.buildChartData(null);
      }
      
      // Load Reservations for table
      if (reservations) {
        const resList = (reservations as any).items || [];
        this.buildTableData(resList);
      } else {
        this.tableData = [];
      }
      
      this.filteredTableData = [...this.tableData];

      this.buildAlerts();

      this.isLoading = false;
      this.cdr.detectChanges();
      
      // Refresh charts if they exist, or init them
      if (this.visitsChart) {
        this.updateCharts();
      } else {
        setTimeout(() => this.initCharts(), 100);
      }
    });
  }

  private buildChartData(charts: any) {
    if (!charts) {
      this.visitLabels = ['Sin datos'];
      this.visitData = [0];
      this.ratingDistribution = [0, 0, 0, 0, 0];
      this.monthlyLabels = [];
      this.monthlyTotals = [];
      return;
    }

    this.visitLabels = charts.visitsByPlace?.labels || ['Sin datos'];
    this.visitData = charts.visitsByPlace?.data || [0];
    
    this.ratingDistribution = charts.ratingDistribution || [0, 0, 0, 0, 0];
    if (this.ratingDistribution.every((x: number) => x === 0)) {
      this.ratingDistribution = [0, 0, 0, 0, 0]; 
    }

    this.monthlyLabels = charts.visitsByMonth?.labels || [];
    this.monthlyTotals = charts.visitsByMonth?.data || [];
  }

  private updateCharts() {
    if (this.visitsChart) {
      this.visitsChart.data.labels = this.visitLabels;
      this.visitsChart.data.datasets[0].data = this.visitData;
      this.visitsChart.update();
    }
    if (this.ratingsChart) {
      this.ratingsChart.data.datasets[0].data = this.ratingDistribution;
      this.ratingsChart.update();
    }
    if (this.historyChart) {
      this.historyChart.data.labels = this.monthlyLabels;
      this.historyChart.data.datasets[0].data = this.monthlyTotals;
      this.historyChart.update();
    }
  }

  private buildTableData(reservations: any[]) {
    this.tableData = reservations.map(r => ({
      date: r.date,
      time: r.time,
      guestName: r.guestName,
      placeName: r.place?.name || 'General',
      guests: r.guests,
      reason: r.reason || 'No especificado',
      observations: r.observations || 'Sin observaciones',
      registeredAt: new Date(r.createdAt).toLocaleString('es-CO')
    }));
  }

  private buildAlerts() {
    this.analysisAlerts = [];
    if (this.kpis.totalVisits > 0) {
      this.analysisAlerts.push({ type: 'success', message: `¡Excelente! Acumulas ${this.kpis.totalVisits.toLocaleString()} visitas registradas en el período seleccionado.` });
    }
    if (this.kpis.averageRating > 0) {
      if (this.kpis.averageRating >= 4.5) {
        this.analysisAlerts.push({ type: 'info', message: `Tu calificación promedio es ${this.kpis.averageRating}/5 ⭐ — mantén la calidad del servicio.` });
      } else {
        this.analysisAlerts.push({ type: 'warning', message: `Tu calificación promedio es ${this.kpis.averageRating}/5. Considera responder a las reseñas de usuarios.` });
      }
    } else {
      this.analysisAlerts.push({ type: 'info', message: `Aún no tienes suficientes reseñas para calcular una calificación promedio en este período.` });
    }
  }

  applyFilters() {
    // Ya no filtramos localmente en memoria. Re-cargamos todo desde el servidor.
    this.loadRealData();
  }

  initCharts() {
    if (!this.visitsChartRef?.nativeElement) return;

    // Use a neutral gray that is readable in both light and dark mode
    const textColor = '#888888';
    const gridColor = 'rgba(136, 136, 136, 0.15)';

    const commonOptions: any = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: textColor, font: { family: 'Inter', size: 12 } } }
      },
      scales: {
        x: { ticks: { color: textColor }, grid: { color: gridColor } },
        y: { ticks: { color: textColor }, grid: { color: gridColor } }
      }
    };

    // 1. Bar Chart — Lugares Más Visitados
    this.visitsChart = new Chart(this.visitsChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: this.visitLabels,
        datasets: [{
          label: 'Visitas',
          data: this.visitData,
          backgroundColor: 'rgba(217, 70, 239, 0.8)',
          borderRadius: 6,
          hoverBackgroundColor: '#d946ef'
        }]
      },
      options: { ...commonOptions, indexAxis: 'y' as const }
    });

    // 2. Doughnut — Distribución de Calificaciones
    this.ratingsChart = new Chart(this.ratingsChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['1 Estrella', '2 Estrellas', '3 Estrellas', '4 Estrellas', '5 Estrellas'],
        datasets: [{
          data: this.ratingDistribution,
          backgroundColor: ['#f43f5e', '#f97316', '#eab308', '#84cc16', '#22c55e'],
          borderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: textColor, font: { family: 'Inter', size: 12 }, padding: 16 }
          }
        }
      }
    });

    // 3. Line/Bar — Comparativo Mensual (Visitas)
    this.historyChart = new Chart(this.historyChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: this.monthlyLabels,
        datasets: [{
          label: 'Visitas',
          data: this.monthlyTotals,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#10b981',
          pointRadius: 5
        }]
      },
      options: { ...commonOptions }
    });
  }

  sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortColumn = column;
      this.sortAsc = true;
    }

    this.filteredTableData.sort((a: any, b: any) => {
      let valA = a[column];
      let valB = b[column];
      if (valA < valB) return this.sortAsc ? -1 : 1;
      if (valA > valB) return this.sortAsc ? 1 : -1;
      return 0;
    });
  }

  nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }

  async exportToPDF() {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setTextColor(139, 92, 246);
    doc.text('Ubica2 · Reporte Estadístico', 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, 14, 30);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Resumen General (KPIs)', 14, 45);

    const kpiData = [
      ['Total Visitas', this.kpis.totalVisits.toLocaleString()],
      ['Reservas Recibidas', this.kpis.totalReservations.toLocaleString()],
      ['Calificación Promedio', `${this.kpis.averageRating} / 5`],
      ['Total Favoritos', this.kpis.totalFavorites.toLocaleString()]
    ];

    autoTable(doc, {
      startY: 50,
      head: [['Indicador', 'Valor']],
      body: kpiData,
      theme: 'grid',
      headStyles: { fillColor: [139, 92, 246] }
    });

    try {
      const visitsImg = this.visitsChartRef.nativeElement.toDataURL('image/png', 1.0);
      doc.addPage();
      doc.text('Lugares Más Visitados', 14, 20);
      doc.addImage(visitsImg, 'PNG', 14, 25, 180, 80);
    } catch (e) {
      console.warn('No se pudo capturar gráfico PDF', e);
    }

    doc.addPage();
    doc.text('Reservas Recibidas', 14, 20);

    const tableBody = this.filteredTableData.map(row => [
      row.date, row.time, row.guestName, row.placeName, row.guests, row.reason
    ]);

    autoTable(doc, {
      startY: 25,
      head: [['Fecha', 'Hora', 'A nombre de', 'Lugar', 'Personas', 'Motivo']],
      body: tableBody,
      theme: 'striped',
      headStyles: { fillColor: [100, 100, 100] }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 200;
    doc.text('_____________________________', 14, finalY + 30);
    doc.text('Firma del Responsable', 14, finalY + 40);

    doc.save(`Reporte_Ubica2_${new Date().getTime()}.pdf`);
  }

  exportToExcel() {
    const wsData = [
      ['Fecha', 'Hora', 'A nombre de', 'Lugar', 'Personas', 'Motivo', 'Observaciones', 'Registrado El']
    ];

    this.filteredTableData.forEach(row => {
      wsData.push([
        row.date, row.time, row.guestName, row.placeName, row.guests, row.reason, row.observations, row.registeredAt
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reservas');
    XLSX.writeFile(wb, `Reporte_Reservas_${new Date().getTime()}.xlsx`);
  }
}
