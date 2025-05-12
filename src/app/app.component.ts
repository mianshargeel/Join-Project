import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/header/header.component';
import { NavbarComponent } from "./shared/navbar/navbar.component";
import { TaskService } from './services/task.service';
import { AuthService } from './services/auth.service';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  firebaseTaskService = inject(TaskService);
  private authService = inject(AuthService);
  private router = inject(Router);

  authUser: User | null = null;

  constructor() {
    // Load tasks on app start
    this.firebaseTaskService.loadAllTasks();

    // Listen for auth state changes
    this.authService.getCurrentUser(user => {
      this.authUser = user;
    });
  }

  logout() {
    this.authService.logout().then(() => {
      this.router.navigate(['/sign-in']);
    });
  }
}
