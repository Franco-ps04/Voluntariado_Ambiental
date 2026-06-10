import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-card-stats',
  imports: [],
  template: `
    <div class="card border-0 shadow-sm rounded-4 p-4 text-center gu-stat h-100">
      <i class="bi text-success fs-2 d-block mb-2" [class]="icon"></i>
      <h3 class="fw-bold mb-0" style="color:#111">{{ value }}</h3>
      <p class="text-muted mb-0 small">{{ label }}</p>
    </div>
  `,
  styleUrl: './card-stats.css',
})
export class CardStats {
  @Input() label = '';
  @Input() value: string | number = '';
  @Input() icon = 'bi-star-fill';
}