import { Component, inject, OnInit } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task.service';
import { Timestamp } from '@angular/fire/firestore';
import { Task } from '../../interfaces/task';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';



@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss'
})


export class SummaryComponent {
  taskService = inject(TaskService);
  firebaseService = inject(FirebaseService);
  authService = inject(AuthService);
  tasks: Task[] = [];

  totalTasks = 0;
  todoCount = 0;
  doneCount = 0;
  inProgressCount = 0;
  awaitingFeedbackCount = 0;
  urgentCount = 0;
  upcomingDeadline: Date | null = null;
  userName: string = '';
  greeting: string = '';

  constructor() { }

  ngOnInit(): void {
    this.taskService.tasks$.subscribe((tasks: Task[]) => {
      // console.log('SummaryComponent received tasks:', tasks); // debug log
      this.calculateSummary(tasks);
    });
    this.setGreeting();
    this.loadUserName();
  }

  setGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      this.greeting = 'Good morning';
    } else if (hour >= 12 && hour < 17) {
      this.greeting = 'Good afternoon';
    } else if (hour >= 17 && hour < 21) {
      this.greeting = 'Good evening';
    } else {
      this.greeting = 'Good night';
    }
  }

  loadUserName() {
    this.userName = this.authService.getUserName() || 'Guest';
  }

  normalizeStatus(status: string): string {
    return status.toLowerCase().replace(/\s+/g, '-'); // e.g. "To do" → "to-do"
  }

  calculateSummary(tasks: Task[]): void {
    this.totalTasks = tasks.length;
    this.todoCount = tasks.filter(t => this.normalizeStatus(t.status) === 'to-do').length;
    this.doneCount = tasks.filter(t => this.normalizeStatus(t.status) === 'done').length;
    this.inProgressCount = tasks.filter(t => this.normalizeStatus(t.status) === 'in-progress').length;
    this.awaitingFeedbackCount = tasks.filter(t => this.normalizeStatus(t.status) === 'await-feedback').length;
    this.urgentCount = tasks.filter(t => t.priority === 'urgent').length;

    const upcomingDates = tasks
      .filter(t => t.duedate instanceof Timestamp)
      .map(t => (t.duedate as Timestamp).toDate())
      .filter(date => date > new Date())
      .sort((a, b) => a.getTime() - b.getTime());

    this.upcomingDeadline = upcomingDates.length > 0 ? upcomingDates[0] : null;
    // console.log('To Do:', tasks.filter(t => this.normalizeStatus(t.status) === 'to-do'));
  }

  getFormattedDate(date: Date | null): string {
    if (!date) return 'No upcoming deadlines';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}