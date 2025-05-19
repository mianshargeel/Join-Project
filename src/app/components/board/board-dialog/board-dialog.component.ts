import { Component, inject, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
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
export class BoardDialogComponent implements AfterViewInit {
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
  contactSearchTerm: string = '';

  @ViewChild('editDueDateInput') editDueDateInput!: ElementRef<HTMLInputElement>;
  todayString = new Date().toISOString().split('T')[0];

  onClose() {
    this.close.emit();
  }

  ngOnInit() {
    this.dueDateInput = this.parseDueDate(this.task.duedate);
    this.editableTask = this.prepareEditableTask(this.task);
  }
  
  private parseDueDate(raw: any): string {
    try {
      if (raw?.toDate instanceof Function) return raw.toDate().toISOString().split('T')[0];
      if (raw?.seconds !== undefined && raw?.nanoseconds !== undefined)
        return new Timestamp(raw.seconds, raw.nanoseconds).toDate().toISOString().split('T')[0];
      if (typeof raw === 'string' || raw instanceof Date)
        return new Date(raw).toISOString().split('T')[0];
      throw new Error('Invalid date format in task');
    } catch {
      return '';
    }
  }
  
  private prepareEditableTask(task: Task): Task {
    return {
      ...task,
      subtasks: Array.isArray(task.subtasks)
        ? task.subtasks.map(sub => ({
            ...sub,
            id: sub.id || 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2)
          }))
        : []
    };
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
  /**
 * Synchronizes all subtasks of the current editable task with Firestore.
 * - If a subtask has a temporary `local-` ID, it is considered new and will be added to Firestore.
 * - If a subtask has a valid Firestore ID, it is considered existing and will be updated.replace local ID with real Firestore ID
 * After adding a new subtask, its ID is replaced with the generated Firestore document ID.
 * @private
 * @async
 * @returns {Promise<void>} A promise that resolves when all subtasks have been processed.
 */
  private async syncSubtasks(): Promise<void> {
    for (const subtask of this.editableTask.subtasks) {
      if (subtask.id.startsWith('local-')) {
        const docRef = await this.firebaseTaskService.addSubtaskToDatabase(
          this.task.id,
          { title: subtask.title, isdone: subtask.isdone }
        );
        subtask.id = docRef.id; 
      } else {
        await this.firebaseTaskService.updateSubtaskInDatabase(
          this.task.id,
          subtask.id,
          { title: subtask.title, isdone: subtask.isdone }
        );
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
    const trimmed = this.editedSubtaskInput.trim();
    if (!trimmed) return;

    this.editableTask.subtasks.push({
      id: 'local-' + Date.now() + '-' + Math.random().toString(36).substring(2),//generating random id to store new title 
      title: trimmed,
      isdone: false
    });
    // console.log('Subtasks:', this.editableTask.subtasks.map(s => s.id));
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

  startEdit(subtaskId: string) {
    const index = this.editableTask.subtasks.findIndex(sub => sub.id === subtaskId);
    if (index !== -1) {
      this.subtaskEditIndex = index;
      this.editedSubtaskText = this.editableTask.subtasks[index].title;
    }
  }

  saveEdit(subtaskId: string) {
    if (!this.editedSubtaskText.trim()) return;

    const index = this.editableTask.subtasks.findIndex(sub => sub.id === subtaskId);
    if (index !== -1) {
      this.editableTask.subtasks[index].title = this.editedSubtaskText.trim();
    }
    this.subtaskEditIndex = -1;
    this.editedSubtaskText = '';
  }

  deleteSubtask(subtaskId: string) {
    const index = this.editableTask.subtasks.findIndex(sub => sub.id === subtaskId);
    if (index !== -1) {
      const deleted = this.editableTask.subtasks[index];
      if (deleted.id && !deleted.id.startsWith('local-')) {
        this.deletedSubtaskIds.push(deleted.id);
      }
      this.editableTask.subtasks.splice(index, 1);
    }
    // Exit edit mode if it was the edited one
    this.subtaskEditIndex = -1;
    this.editedSubtaskText = '';
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

  ngAfterViewInit(): void {
    if (this.editDueDateInput?.nativeElement) {
      this.editDueDateInput.nativeElement.min = this.todayString;
    }
  }

  validateDueDateEdit(): void {
    const inputEl = this.editDueDateInput?.nativeElement;
    if (!inputEl) { return; }

    const value = inputEl.value;
    if (!value) { return; }

    const chosen = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (chosen < today) {
      const todayISO = this.todayString;
      inputEl.value = todayISO;
      this.dueDateInput = todayISO;
      console.warn('Selected date was in the past – resetting to today.');
    }
  }

  removeAssignee(id: string) { //in edit-dialog uset can remove selected Initial just by click
    this.editableTask.assignees = this.editableTask.assignees.filter(aid => aid !== id);
  }

  get filteredContacts(): ContactInterface[] {
    const term = this.contactSearchTerm.toLowerCase();
    return this.firebaseTaskService.contactList.filter(contact =>
      contact.name.toLowerCase().includes(term)
    );
  }

  toggleContactSelection(contactId: string) {
    const index = this.editableTask.assignees.indexOf(contactId);
    if (index === -1) {
      this.editableTask.assignees.push(contactId);
    } else {
      this.editableTask.assignees.splice(index, 1);
    }
  }


}
