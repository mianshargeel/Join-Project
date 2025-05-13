import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SignInCredentials } from '../../interfaces/auth-interface';
import { RouterModule } from '@angular/router';
import { Auth, signInAnonymously } from '@angular/fire/auth';
import { Firestore, doc, setDoc, serverTimestamp } from '@angular/fire/firestore';


@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss'
})
export class SignInComponent {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  email = '';
  password = '';
  errorMessage = '';
  loading = false;
  rememberMe = false;

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    // Load credentials if they exist
    const savedEmail = localStorage.getItem('savedEmail');
    const savedPassword = localStorage.getItem('savedPassword');

    if (savedEmail) this.email = savedEmail;
    if (savedPassword) this.password = savedPassword;
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
      this.router.navigate(['/summary']); // redirect on success
    } catch (error: any) {
      this.errorMessage = error.message || 'Login failed.';
    } finally {
      this.loading = false;
    }
  }

  async loginAsGuest() {
    try {
      const credential = await signInAnonymously(this.auth);
      const uid = credential.user.uid;

      //store guest contact in Firestore if not already there
      const contactRef = doc(this.firestore, 'contacts', uid);
      await setDoc(contactRef, {
        id: uid,
        name: 'Guest User',
        email: '',
        telephone: '',
        createdAt: serverTimestamp(),
        isGuest: true
      });

      // Redirect to summary or home
      this.router.navigate(['/board']);
    } catch (error) {
      console.error('Guest login failed', error);
    }
  }
}
