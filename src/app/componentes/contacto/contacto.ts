import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-contacto',
  imports: [CommonModule, FormsModule],
  templateUrl: './contacto.html',
  styleUrl: './contacto.css',
})
export class Contacto {
  form = {
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: ''
  };

  subjects = ['Consulta general', 'Registro de organización', 'Reporte de problema', 'Sugerencia', 'Otro'];

  submitted = false;
  success = false;
  sending = false;
  errorMessage = '';

  constructor(private http: HttpClient) { }

  public isEmailValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  public isPhoneValid(phone: string): boolean {
    return /^\d{9}$/.test(phone.trim());
  }

  private validate(): string {
    const name = this.form.name.trim();
    const phone = this.form.phone.trim();
    const email = this.form.email.trim();
    const subject = this.form.subject.trim();
    const message = this.form.message.trim();

    if (!name || name.length < 3) return 'Ingresa tu nombre completo.';
    if (!phone) return 'Ingresa tu teléfono.';
    if (!this.isPhoneValid(phone)) return 'El teléfono debe tener 9 dígitos.';
    if (!email) return 'Ingresa tu correo electrónico.';
    if (!this.isEmailValid(email)) return 'Ingresa un correo válido.';
    if (!subject) return 'Selecciona un asunto.';
    if (!message || message.length < 10) return 'El mensaje debe tener al menos 10 caracteres.';
    if (message.length > 2000) return 'El mensaje no debe superar 2000 caracteres.';

    return '';
  }

  submit(): void {
    this.submitted = true;
    this.success = false;
    this.errorMessage = '';

    const validationError = this.validate();
    if (validationError) {
      this.errorMessage = validationError;
      return;
    }

    const payload = {
      nombre: this.form.name.trim(),
      telefono: this.form.phone.trim(),
      email: this.form.email.trim(),
      asunto: this.form.subject.trim(),
      mensaje: this.form.message.trim()
    };

    this.sending = true;
    this.http.post<any>(`${environment.apiUrl}/contacto`, payload)
      .pipe(finalize(() => this.sending = false))
      .subscribe({
        next: () => {
          this.success = true;
          this.submitted = false;
          this.form = {
            name: '',
            phone: '',
            email: '',
            subject: '',
            message: ''
          };
          setTimeout(() => this.success = false, 5000);
        },
        error: (err) => {
          this.errorMessage = err?.error?.message ?? 'No se pudo enviar el mensaje.';
        }
      });
  }
}