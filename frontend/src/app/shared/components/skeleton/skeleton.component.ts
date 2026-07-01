import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="skeleton-loader" 
      [ngClass]="type"
      [style.width]="width"
      [style.height]="height"
      [style.border-radius]="borderRadius"
      [style.margin]="margin"
    ></div>
  `,
  styles: [`
    .skeleton-loader {
      background: var(--surface-soft, #f3f4f6);
      background: linear-gradient(
        90deg,
        var(--surface-soft, #f3f4f6) 25%,
        var(--border-quiet, #e5e7eb) 50%,
        var(--surface-soft, #f3f4f6) 75%
      );
      background-size: 200% 100%;
      animation: skeleton-shimmer 1.5s infinite;
      border-radius: 4px;
    }

    body.dark-mode .skeleton-loader {
      background: linear-gradient(
        90deg,
        var(--surface-card, #1f2937) 25%,
        var(--surface-soft, #374151) 50%,
        var(--surface-card, #1f2937) 75%
      );
      background-size: 200% 100%;
    }

    .skeleton-loader.card {
      width: 100%;
      height: 300px;
      border-radius: 16px;
    }

    .skeleton-loader.text {
      width: 100%;
      height: 16px;
      margin-bottom: 8px;
    }

    .skeleton-loader.title {
      width: 60%;
      height: 24px;
      margin-bottom: 16px;
    }

    .skeleton-loader.avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
    }

    .skeleton-loader.button {
      width: 120px;
      height: 40px;
      border-radius: 8px;
    }

    @keyframes skeleton-shimmer {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
  `]
})
export class SkeletonComponent {
  @Input() type: 'card' | 'text' | 'title' | 'avatar' | 'button' | 'custom' = 'text';
  @Input() width?: string;
  @Input() height?: string;
  @Input() borderRadius?: string;
  @Input() margin?: string;
}
