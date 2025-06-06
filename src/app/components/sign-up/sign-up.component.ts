import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SignUpCredentials } from '../../interfaces/auth-interface';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss'
})
export class SignUpComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  router = inject(Router);
  name = '';
  email = '';
  password = '';
  repeatPassword = '';
  errorMessage = '';
  acceptedTerms = false;

  ngOnInit(): void {
    document.body.classList.add('auth-hidden');
  }

  ngOnDestroy(): void {
    document.body.classList.remove('auth-hidden');
  }

  async register() {
    if (this.password !== this.repeatPassword) {
      this.errorMessage = "Passwords do not match.";
      return;
    }

    const credentials: SignUpCredentials = {
      name: this.name,
      email: this.email,
      password: this.password
    };

    try {
      await this.authService.signUp(credentials);
      this.router.navigate(['/sign-in'], { queryParams: { registered: 'true' } }); //It appends a query parameter (?registered=true) to the URL when navigating between routes.using it to pass a signal from the sign-up page to the sign-in page.
      this.errorMessage = '';
      // console.log('You are successfully Registered');
      this.clearForm();
    } catch (error: any) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          this.errorMessage = 'This email is already registered.';
          break;
        case 'auth/invalid-email':
          this.errorMessage = 'Invalid email address.';
          break;
        case 'auth/weak-password':
          this.errorMessage = 'Password is too weak.';
          break;
        default:
          this.errorMessage = 'Sign-up failed. Please try again.';
      }
    }
  }

  clearForm() {
    this.name = '';
    this.email = '';
    this.password = '';
    this.repeatPassword = '';
  }

}
