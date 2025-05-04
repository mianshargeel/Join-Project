import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { Task } from '../../../interfaces/task';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../../services/task.service';

@Component({
  selector: 'app-board-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './board-dialog.component.html',
  styleUrl: './board-dialog.component.scss'
})
export class BoardDialogComponent {
  @Input() task!: Task;
  @Input() assignees: { id: string; name: string; initials: string; color: string }[] = [];
  @Output() close = new EventEmitter();
  firebaseTaskService = inject(TaskService);

  onClose() {
    this.close.emit();
  }

  ngOnInit() {
    // console.log('Assigned IDs:', this.task.assignees);
    // console.log('TaskDialogComponent loaded with task:', this.task);
  }

  priorityIcon(p: string) {
    switch (p.toLowerCase()) {
      case 'low': return '/assets/img/board/low.svg';
      case 'medium': return '/assets/img/board/medium.svg';
      default: return '/assets/img/board/urgent.svg';
    }
  }
  categoryClass(category: string) {
    const key = category?.toLowerCase();
    return {
      'user-story': key === 'user story',
      'technical-task': key === 'technical task'
    };
  }

  async onDelete() {
    if (!this.task?.id) return;
    await this.firebaseTaskService.deleteTaskByIdFromDatabase(this.task.id);
    this.close.emit(); // close the dialog after deletion
  }

}
