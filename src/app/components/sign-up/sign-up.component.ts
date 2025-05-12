import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SignUpCredentials } from '../../interfaces/auth-interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss'
})
export class SignUpComponent {
  authService = inject(AuthService);
  router = inject(Router);
  name = '';
  email = '';
  password = '';
  repeatPassword = '';
  errorMessage = '';
  successMessage = '';

  async register() {
    if (this.password !== this.repeatPassword) {
      this.errorMessage = "Passwords do not match.";
      this.successMessage = '';
      return;
    }

    const credentials: SignUpCredentials = {
      name: this.name,
      email: this.email,
      password: this.password
    };

    try {
      await this.authService.signUp(credentials);
      this.router.navigate(['/summary']);
      this.errorMessage = '';
      console.log('You are successfully Registered');
      this.clearForm();
    } catch (error: any) {
      this.errorMessage = error.message || 'Sign-up failed.';
      this.successMessage = '';
    }
  }

  clearForm() {
    this.name = '';
    this.email = '';
    this.password = '';
    this.repeatPassword = '';
  }

}
