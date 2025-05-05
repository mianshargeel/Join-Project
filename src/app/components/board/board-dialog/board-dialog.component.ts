import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { Task } from '../../../interfaces/task';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../../services/task.service';
import { ContactInterface } from '../../../interfaces/contact-interface';
import { FormsModule } from '@angular/forms';
import { generateInitials, generateRandomColor } from '../../../models/contact.model';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-board-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './board-dialog.component.html',
  styleUrl: './board-dialog.component.scss'
})
export class BoardDialogComponent {
  @Input() task!: Task;
  @Input() contacts?: ContactInterface[];
  @Input() assignees: { id: string; name: string; initials: string; color: string }[] = [];
  @Output() close = new EventEmitter();
  firebaseTaskService = inject(TaskService);
  editMode = false;
  editableTask!: Task;
  avatarColors: { [contactId: string]: string } = {};
  selectedAssignees: string[] = [];
  generateInitials = generateInitials;
  generateRandomColor = generateRandomColor;
  dropdownOpen = false;
  editedSubtaskInput = '';
  editedSubtaskText = '';
  subtaskEditIndex = -1;
  hoveredSubtaskIndex = -1;
  isTyping = false;
  deletedSubtaskIds: string[] = [];

  onClose() {
    this.close.emit();
  }

  ngOnInit() {
    // console.log('Assigned IDs:', this.task.assignees);
    // console.log('TaskDialogComponent loaded with task:', this.task);
  }

  toggleDropdown() {
  this.dropdownOpen = !this.dropdownOpen;
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

  enableEditMode() {
    this.editableTask = structuredClone(this.task); // deep copy, This allows two-way binding in the edit form without affecting the original until saved.
    this.editableTask.assignees = this.editableTask.assignees ?? [];
    this.editMode = true;
    // console.log('edit mode clicked');
    
  }

  disableEditMode() {
    this.editMode = false;
  }

  /**
 * Converts a given value to a valid Firestore Timestamp.
 *
 * This function ensures the input is safely converted to a Firestore-compatible Timestamp object,
 * regardless of whether it's:
 *   - already a Timestamp,
 *   - a plain object that looks like { seconds, nanoseconds },
 *   - a valid Date string or JavaScript Date object.
 *
 * This avoids runtime errors like "Invalid time value" when editing tasks
 * where the date input might come from form fields, Firestore snapshots, or intermediate states.
 *
 * @param value - The input value to convert (can be string, Date, Timestamp, or object).
 * @returns A valid Firestore Timestamp if conversion is possible, otherwise null.
 */
  safeConvertToTimestamp(value: any): Timestamp | null {
    if (value instanceof Timestamp) return value;

    if (
      typeof value === 'object' &&
      typeof value.seconds === 'number' &&
      typeof value.nanoseconds === 'number'
    ) {
      return new Timestamp(value.seconds, value.nanoseconds);
    }

    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return Timestamp.fromDate(parsed);
    }

    return null;
  }

  setPriority(level: 'urgent' | 'medium' | 'low') {
    this.editableTask.priority = level;
  }

  async submitEdit() {
    if (!this.task?.id) return;

    const dateValue = this.safeConvertToTimestamp(this.editableTask.duedate);

    if (!dateValue) {
      console.error('Invalid date format:', this.editableTask.duedate);
      return;
    }

    const updatedTaskData: Partial<Task> = {
    title: this.editableTask.title,
    description: this.editableTask.description,
    duedate: dateValue,
    assignees: this.editableTask.assignees,
    status: this.task.status, 
    priority: this.editableTask.priority, 
  };

    // Update the main task (without subtasks)
    await this.firebaseTaskService.updateTaskInDatabase(this.task.id, updatedTaskData);

    // Update subtasks individually in the subcollection
    for (const subtask of this.editableTask.subtasks) {
      await this.firebaseTaskService.updateSubtaskInDatabase(
        this.task.id,
        subtask.id,
        { title: subtask.title, isdone: subtask.isdone }
      );
    }
    for (const subtaskId of this.deletedSubtaskIds) {
      await this.firebaseTaskService.deleteSubtaskFromDatabase(this.task.id, subtaskId);
      // console.log('Subtask deleted:', subtaskId);
    }

    // Clear deleted list
    this.deletedSubtaskIds = [];

  // Rebuild display-friendly assignee info for view mode
  this.assignees = this.getTaskAssignees({ ...this.editableTask, assignees: this.editableTask.assignees });
  this.disableEditMode();
  this.close.emit();  // Let parent know to reload task list
}

  onCheckboxChange(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const contactId = checkbox.value;

    if (checkbox.checked) {
      // Add if not already there
      if (!this.editableTask.assignees.includes(contactId)) {
        this.editableTask.assignees.push(contactId);
      }
    } else {
      // Remove if unchecked
      this.editableTask.assignees = this.editableTask.assignees.filter(id => id !== contactId);
    }
  }

  getAvatarColor(contactId: string): string {
    if (!this.avatarColors[contactId]) {
      this.avatarColors[contactId] = this.generateRandomColor();
    }
    return this.avatarColors[contactId];
  }

  getContactInitials(contactId: string): string { 
    const contact = this.firebaseTaskService.contactList.find(c => c.id === contactId);
    return contact ? generateInitials(contact.name) : '?';
  }

  getTaskAssignees(task: Task) {
    return task.assignees.map(id => {
      const contact = this.firebaseTaskService.contactList.find(c => c.id === id);
      return {
        id,
        name: contact?.name || 'Unknown',
        initials: this.getContactInitials(id),
        color: this.getAvatarColor(id)
      };
    });
  }
// following functionality for edit-dialog subtasks
  confirmSubtask() {
    if (!this.editedSubtaskInput.trim()) return;

    this.editableTask.subtasks.push({
      id: '', // placeholder; Firestore will assign it later
      title: this.editedSubtaskInput.trim(),
      isdone: false
    });

    this.editedSubtaskInput = '';
    this.isTyping = false;
  }

  cancelSubtask() {
    this.editedSubtaskInput = '';
    this.isTyping = false;
  }

  enableTyping() {
    this.isTyping = true;
  }

  startEdit(index: number) {
    this.subtaskEditIndex = index;
    this.editedSubtaskText = this.editableTask.subtasks[index].title;
  }

  saveEdit(index: number) {
    if (!this.editedSubtaskText.trim()) return;
    
    // console.log('Saving subtask at index', index, 'with new title:', this.editedSubtaskText);
    this.editableTask.subtasks[index].title = this.editedSubtaskText.trim(); 
    this.subtaskEditIndex = -1;
    this.editedSubtaskText = '';
  }

  deleteSubtask(index: number) {
  const deleted = this.editableTask.subtasks[index];

  if (deleted.id) {
    this.deletedSubtaskIds.push(deleted.id);
  }

  this.editableTask.subtasks.splice(index, 1); // ✅ UI update
}


}
