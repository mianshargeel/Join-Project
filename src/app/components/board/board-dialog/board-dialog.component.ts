import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { Subtask, Task } from '../../../interfaces/task';
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
  @Output() taskUpdated = new EventEmitter<Task>();
  dueDateInput!: string;

  onClose() {
    this.close.emit();
  }

  ngOnInit() {
  const raw: any = this.task.duedate;

  let dateObj: Date;

  try {
    if (raw?.toDate && typeof raw.toDate === 'function') {
      dateObj = raw.toDate();
    } else if (raw?.seconds !== undefined && raw?.nanoseconds !== undefined) {
      // It's a plain object from Firestore that looks like a Timestamp
      const ts = new Timestamp(raw.seconds, raw.nanoseconds);
      dateObj = ts.toDate();
    } else if (typeof raw === 'string' || raw instanceof Date) {
      dateObj = new Date(raw);
    } else {
      throw new Error('Invalid date format in task:');
    }

    this.dueDateInput = dateObj.toISOString().split('T')[0];
  } catch (err) {
    console.warn('Invalid date format in task:', raw);
    this.dueDateInput = '';
  }

  this.editableTask = { ...this.task };
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

  setPriority(level: 'urgent' | 'medium' | 'low') {
    this.editableTask.priority = level;
  }

  async submitEdit() {
    if (!this.task?.id) return;

    this.prepareDueDate();
    const updatedTaskData = this.buildUpdatedTaskData();

    try {
      await this.updateMainTask(updatedTaskData);
      await this.syncSubtasks();
      await this.removeDeletedSubtasks();
      this.finalizeViewState();
    } catch (error) {
      console.error('Error during submitEdit:', error);
    }
  }

  private prepareDueDate(): void {
    this.editableTask.duedate = Timestamp.fromDate(new Date(this.dueDateInput));
  }

  private buildUpdatedTaskData(): Partial<Task> {
    return {
      title: this.editableTask.title,
      description: this.editableTask.description,
      duedate: this.editableTask.duedate,
      assignees: this.editableTask.assignees,
      status: this.task.status,
      priority: this.editableTask.priority,
    };
  }

  private async updateMainTask(data: Partial<Task>): Promise<void> {
    await this.firebaseTaskService.updateTaskInDatabase(this.task.id, data);
  }

  private async syncSubtasks(): Promise<void> {
    for (const subtask of this.editableTask.subtasks) {
      if (subtask.id) {
        await this.firebaseTaskService.updateSubtaskInDatabase(
          this.task.id,
          subtask.id,
          { title: subtask.title, isdone: subtask.isdone }
        );
      } else {
        const docRef = await this.firebaseTaskService.addSubtaskToDatabase(
          this.task.id,
          { title: subtask.title, isdone: subtask.isdone }
        );
        subtask.id = docRef.id;
      }
    }
  }

  private async removeDeletedSubtasks(): Promise<void> {
    for (const subtaskId of this.deletedSubtaskIds) {
      await this.firebaseTaskService.deleteSubtaskFromDatabase(this.task.id, subtaskId);
    }
    this.deletedSubtaskIds = [];
  }

  private finalizeViewState(): void {
    this.assignees = this.getTaskAssignees({ ...this.editableTask });
    this.task = {
      ...this.editableTask,
      subtasks: [...this.editableTask.subtasks],
    };
    this.disableEditMode();
    this.close.emit();
  }
  /**
 * Returns a user-friendly due date string (dd/MM/yyyy) for display in the view dialog.
 * Safely handles Firestore Timestamp, string, or Date formats to prevent runtime errors.
 * Used as a read-only computed property for clean binding in the template.
 */
  get formattedDueDate(): string {
  const raw: any = this.task.duedate;

  try {
    if (raw?.toDate && typeof raw.toDate === 'function') {
      // Firestore Timestamp
      return raw.toDate().toLocaleDateString('en-GB');
    } else if (typeof raw === 'string' || raw instanceof Date) {
      // String or native Date
      return new Date(raw).toLocaleDateString('en-GB');
    } else {
      return 'Invalid date';
    }
  } catch {
    return 'Invalid date';
  }
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

   getAvatarColor(id: string): string {
    const contact = this.firebaseTaskService.contactList.find(contact => contact.id === id);
    return contact?.color ?? "#000000";
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
    this.editableTask.subtasks.splice(index, 1); //UI update
  }

  async onSubtaskToggle(subtask: Subtask) {
    if (!this.task) return;

    try {
      // Update in Firebase
      await this.firebaseTaskService.updateSubtaskInDatabase(
        this.task.id,
        subtask.id,
        { isdone: subtask.isdone }
      );
      // Emit updated task to parent
      this.taskUpdated.emit({ ...this.task });
    } catch (error) {
      console.error('Error updating subtask in Firebase:', error);
    }
  }

}
