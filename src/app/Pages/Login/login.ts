import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../Services/Auth';
import { LocalStorage } from '../../Storage/localStorage';
import { Router } from '@angular/router';

@Component({
  selector: 'login',
  imports: [CommonModule, FormsModule, ReactiveFormsModule,],
  templateUrl: './login.html',
})
export class Login {
    private toast = inject(ToastrService);
    private authService = inject(AuthService);
    private router = inject(Router);
    private locaStorage = inject(LocalStorage);
    protected readonly title = signal('Login');

  loginForm = new FormGroup({
    tipoDocumento: new FormControl('', [Validators.required]),
    numeroDocumento: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  });

  onSubmit() {
    if (this.loginForm.valid) {
      const formData = this.loginForm.value;
      const loginData = {
        tipo_documento: formData.tipoDocumento || '',
        numero_documento: formData.numeroDocumento || '',
        contrasena: formData.password || '',
      };
      this.authService.login(loginData).subscribe({
        next: (response) => {
          this.loginForm.reset();
          this.showToast();
          this.locaStorage.setItem('access_token', response.token);
          this.locaStorage.setItem('rol', response.rol);
          this.router.navigate(['/']);
        },
        error: (error: any) => {
          console.log(error);
          this.showErrorToast('Login failed');
        }
      });
    }
  }

  get tipoDocumento() {
    return this.loginForm.get('tipoDocumento');
  }
  get numeroDocumento() {
    return this.loginForm.get('numeroDocumento');
  }
  get password() {
    return this.loginForm.get('password');
  }

    showToast() {
    this.toast.success('Login successful', 'Success');
  }

  showErrorToast(error: string) {
    this.toast.error(error, 'Error');
  }
}
