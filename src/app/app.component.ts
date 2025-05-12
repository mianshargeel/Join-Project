import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/header/header.component';
import { NavbarComponent } from "./shared/navbar/navbar.component";
import { TaskService } from './services/task.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  firebaseTaskService = inject(TaskService);

  constructor() {
    this.firebaseTaskService.loadAllTasks();//will loads all Tasks from firebase,when App starts
  }
 

}
