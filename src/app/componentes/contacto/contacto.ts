import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

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
  success = false;

  submit(): void {
    if (!this.form.name || !this.form.email || !this.form.message) {
      alert('Completa todos los campos obligatorios.');
      return;
    }
    this.success = true;
    this.form = { name: '', phone: '', email: '', subject: '', message: '' };
    setTimeout(() => this.success = false, 4000);
  }
}
