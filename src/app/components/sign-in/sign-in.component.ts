import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SignInCredentials } from '../../interfaces/auth-interface';
import { RouterModule } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Firestore, doc, setDoc, serverTimestamp } from '@angular/fire/firestore';


@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss'
})
export class SignInComponent implements OnInit, OnDestroy {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  route = inject(ActivatedRoute);

  email = '';
  password = '';
  errorMessage = '';
  loading = false;
  rememberMe = false;
  showSuccessMsgDialog: boolean = false;
  showSuccessMsg: string = '';

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    // Load credentials if they exist
    const savedEmail = localStorage.getItem('savedEmail');
    const savedPassword = localStorage.getItem('savedPassword');

    if (savedEmail) this.email = savedEmail;
    if (savedPassword) this.password = savedPassword;

    document.body.classList.add('auth-hidden');

    this.route.queryParams.subscribe(params => {
      if (params['registered'] === 'true') {
        this.showSuccessMsg = 'You have Successfully Registered';
        this.showSuccessMsgDialog = true;

        // Optional auto-hide after delay
        setTimeout(() => this.showSuccessMsgDialog = false, 4000);
      }
    });

  }

  ngOnDestroy(): void {
    document.body.classList.remove('auth-hidden');
  }

  saveCredentials() {
    localStorage.setItem('savedEmail', this.email);
    localStorage.setItem('savedPassword', this.password);
  }

  toggleRemember() {
    if (!this.rememberMe) {
      localStorage.removeItem('savedEmail');
      localStorage.removeItem('savedPassword');
    } else {
      this.saveCredentials();
    }
  }

  async login() {
    this.errorMessage = '';
    this.loading = true;
    const credentials: SignInCredentials = {
      email: this.email,
      password: this.password
    };
    try {
      await this.authService.signIn(credentials);
      // Store or clear credentials based on rememberMe
      if (this.rememberMe) {
        this.saveCredentials();
      } else {
        localStorage.removeItem('savedEmail');
        localStorage.removeItem('savedPassword');
      }
      this.router.navigate(['/summary']); // redirect on success
    } catch (error: any) {
      switch (error.code) {
        case 'auth/invalid-credential':
          this.errorMessage = 'Invalid email or password.';
          break;
        case 'auth/user-not-found':
          this.errorMessage = 'No account found with this email.';
          break;
        case 'auth/wrong-password':
          this.errorMessage = 'Incorrect password.';
          break;
        case 'auth/too-many-requests':
          this.errorMessage = 'Too many attempts. Please try again later.';
          break;
        default:
          this.errorMessage = 'Login failed. Please try again.';
      }
    } finally {
      this.loading = false;
      // Clear form only if not remembering
      if (!this.rememberMe) {
        this.clearForm();
      }
    }
  }
  

  clearForm() {
    this.email = '';
    this.password = '';
  }

  async loginAsGuest() { 
    try {
      await signInWithEmailAndPassword(this.auth, 'guest@join-app.com', '123456');
      this.router.navigate(['/board']);
    } catch (error) {
      console.error('Guest login failed', error);
    }
  }
}
