import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SignInCredentials } from '../../interfaces/auth-interface';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss'
})
export class SignInComponent {
  email = '';
  password = '';
  errorMessage = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) { }
  
  async login() {
    this.errorMessage = '';
    this.loading = true;

    const credentials: SignInCredentials = {
      email: this.email,
      password: this.password
    };

    try {
      await this.authService.signIn(credentials);
      this.router.navigate(['/summary']); // redirect on success
    } catch (error: any) {
      this.errorMessage = error.message || 'Login failed.';
    } finally {
      this.loading = false;
    }
  }
}
