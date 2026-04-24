import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { VerificationService, VerificationItem } from '../../core/services/verification.service';
import { AuthStoreService } from '../../core/services/auth-store.service';
@Component({
  selector: 'app-verification',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './verification.component.html',
  styleUrl: './verification.component.scss',
})
export class VerificationComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly verificationService = inject(VerificationService);
  private readonly authStore = inject(AuthStoreService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly currentStatus = signal<VerificationItem | null>(null);
  selectedFile: File | null = null;

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    documentType: ['CC', Validators.required],
    documentNumber: ['', [Validators.required, Validators.minLength(5)]],
  });

  ngOnInit(): void {
    this.checkStatus();
  }

  checkStatus(): void {
    this.verificationService.getMyStatus().subscribe({
      next: (status) => {
        this.currentStatus.set(status);
        if (status && status.status === 'APPROVED' && !this.authStore.isOwner()) {
          // Si fuimos aprobados, refrescar el JWT en el cliente para obtener los permisos OWNER
          this.authStore.refreshSession().subscribe();
        }
      },
      error: () => this.currentStatus.set(null),
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  submit(): void {
    if (this.form.invalid || !this.selectedFile) {
      this.form.markAllAsTouched();
      this.error.set('Por favor completa todos los campos adjunta tu documento.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    const data = {
      ...this.form.getRawValue(),
      file: this.selectedFile
    };

    this.verificationService.submitVerification(data).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set('¡Solicitud enviada! Tu verificación está pendiente de revisión.');
        this.form.reset();
        this.selectedFile = null;
        this.checkStatus();
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.message || err?.message || 'Error al enviar la solicitud.';
        this.error.set(msg);
      },
    });
  }
}
