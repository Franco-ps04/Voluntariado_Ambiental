import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class AdminLayout {
  constructor(public auth: AuthService, private router: Router) { }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  getEmail(): string {
    return this.auth.currentUser?.email ?? '';
  }
}
