import { Component, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

function passwordMatchValidator(g: AbstractControl): ValidationErrors | null {
  const pass = g.get('password')?.value;
  const confirm = g.get('confirmPassword')?.value;
  return pass === confirm ? null : { mismatch: true };
}

@Component({
  selector: 'app-registrarse',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registrarse.html',
  styleUrl: './registrarse.css',
})
export class Registrarse {

  form: FormGroup;
  loading = signal(false);
  error = signal('');

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {

    this.form = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      acceptTerms: [false, Validators.requiredTrue]
    }, { validators: passwordMatchValidator });
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');

    const data = {
      nombre: this.form.value.fullName,
      email: this.form.value.email,
      password: this.form.value.password,
      telefono: this.form.value.phone
    };
    //Llama HTTP del backend
    this.auth.register(data).subscribe({
      next: () => {
        this.loading.set(false);
        //Logueao automatico
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(
          err.error?.message || 'Error al registrarse. Intentalo nuevamente.'
        );
      }
    });
  }
}