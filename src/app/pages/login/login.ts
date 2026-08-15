import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  username = '';
  password = '';
  showPassword = false;

  errorMsg = signal<string>('');
  loading = signal<boolean>(false);

  diagnosticSteps = [
    'Verificando conexão segura...',
    'Validando credenciais...',
    'Sistema pronto.',
  ];
  currentStep = signal<number>(0);

  constructor(private authService: AuthService, private router: Router) {
    this.runDiagnosticLoop();
  }

  private runDiagnosticLoop(): void {
    setInterval(() => {
      this.currentStep.update((v) => (v + 1) % this.diagnosticSteps.length);
    }, 2600);
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (!this.username || !this.password) {
      this.errorMsg.set('Preencha usuário e senha.');
      return;
    }

    this.errorMsg.set('');
    this.loading.set(true);

    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 401) {
          this.errorMsg.set('Usuário ou senha inválidos.');
        } else {
          this.errorMsg.set('Não foi possível conectar ao servidor. Tente novamente.');
        }
      },
    });
  }
}