import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { Task } from '../../../interfaces/task';
import { ContactInterface } from '../../../interfaces/contact-interface';


@Component({
  selector: 'app-task-dialog',
  standalone: true,
  imports: [],
  templateUrl: './task-dialog.component.html',
  styleUrl: './task-dialog.component.scss'
})
export class TaskDialogComponent {
  @Input() task!: Task;
  @Input() assignees: { id: string; name: string; initials: string; color: string }[] = [];
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }

  ngOnInit() {
    console.log('Assigned IDs:', this.task.assignees);
  console.log('TaskDialogComponent loaded with task:', this.task);
}


}
