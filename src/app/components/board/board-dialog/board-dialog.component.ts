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

  /** Emits the close event to parent component. */
onClose() {
  this.close.emit();
}

/** Initializes the dialog component by parsing the due date and preparing the editable task. */
ngOnInit() {
  this.dueDateInput = this.parseDueDate(this.task.duedate);

  this.editableTask = {
    ...this.task,
    subtasks: this.task.subtasks.map(sub => ({
      ...sub,
      id: sub.id || 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2)
    }))
  };
}

/** Safely converts various date formats to a yyyy-MM-dd string (for form input binding). */
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

/** Toggles the visibility of the assignee dropdown. */
toggleDropdown() {
  this.dropdownOpen = !this.dropdownOpen;
}

/** Returns the correct priority icon path based on the given level. */
priorityIcon(p: string) {
  switch (p.toLowerCase()) {
    case 'low': return '/assets/img/board/low.svg';
    case 'medium': return '/assets/img/board/medium.svg';
    default: return '/assets/img/board/urgent.svg';
  }
}

/** Returns class object for category-based CSS styling. */
categoryClass(category: string) {
  const key = category?.toLowerCase();
  return {
    'user-story': key === 'user story',
    'technical-task': key === 'technical task'
  };
}

/** Deletes the current task from Firestore and closes the dialog. */
async onDelete() {
  if (!this.task?.id) return;
  await this.firebaseTaskService.deleteTaskByIdFromDatabase(this.task.id);
  this.close.emit(); 
}

/** Enables task edit mode by cloning the task object. */
enableEditMode() {
  this.editableTask = structuredClone(this.task); 
  this.editableTask.assignees = this.editableTask.assignees ?? [];
  this.editMode = true;
}

/** Disables edit mode and switches back to view mode. */
disableEditMode() {
  this.editMode = false;
}

/** Sets the task's priority to the specified level. */
setPriority(level: 'urgent' | 'medium' | 'low') {
  this.editableTask.priority = level;
}

/** Submits all task edits including main task and subtasks, and closes the dialog. */
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

/** Converts due date input string into Firestore Timestamp. */
private prepareDueDate(): void {
  this.editableTask.duedate = Timestamp.fromDate(new Date(this.dueDateInput));
}

/** Returns a task update object based on editable form fields. */
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

/** Updates the main task document in Firestore. */
private async updateMainTask(data: Partial<Task>): Promise<void> {
  await this.firebaseTaskService.updateTaskInDatabase(this.task.id, data);
}

/** Creates or updates all subtasks in Firestore. */
private async syncSubtasks(): Promise<void> {
  for (const subtask of this.editableTask.subtasks) {
    if (subtask.id.startsWith('local-')) {
      const docRef = await this.firebaseTaskService.addSubtaskToDatabase(this.task.id, { title: subtask.title, isdone: subtask.isdone });
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

/** Deletes all subtasks marked for removal. */
private async removeDeletedSubtasks(): Promise<void> {
  for (const subtaskId of this.deletedSubtaskIds) {
    await this.firebaseTaskService.deleteSubtaskFromDatabase(this.task.id, subtaskId);
  }
  this.deletedSubtaskIds = [];
}

/** Finalizes edit process: updates UI, switches to view mode, emits close. */
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
 * Returns a localized due date string in dd/MM/yyyy format for display.
 * Handles both Firestore Timestamp and raw date formats safely.
 */
get formattedDueDate(): string {
  const raw: any = this.task.duedate;

  try {
    if (raw?.toDate && typeof raw.toDate === 'function') {
      return raw.toDate().toLocaleDateString('en-GB');
    } else if (typeof raw === 'string' || raw instanceof Date) {
      return new Date(raw).toLocaleDateString('en-GB');
    } else {
      return 'Invalid date';
    }
  } catch {
    return 'Invalid date';
  }
}

/** Adds or removes assignee based on checkbox selection. */
onCheckboxChange(event: Event) {
  const checkbox = event.target as HTMLInputElement;
  const contactId = checkbox.value;

  if (checkbox.checked) {
    if (!this.editableTask.assignees.includes(contactId)) {
      this.editableTask.assignees.push(contactId);
    }
  } else {
    this.editableTask.assignees = this.editableTask.assignees.filter(id => id !== contactId);
  }
}

/** Returns the avatar color for a contact ID. */
getAvatarColor(id: string): string {
  const contact = this.firebaseTaskService.contactList.find(contact => contact.id === id);
  return contact?.color ?? "#000000";
}

/** Returns contact initials by ID. */
getContactInitials(contactId: string): string {
  const contact = this.firebaseTaskService.contactList.find(c => c.id === contactId);
  return contact ? generateInitials(contact.name) : '?';
}

/** Returns a list of assignee info objects for display (name, initials, color). */
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

/** Confirms creation of a new subtask and appends it to the task. */
confirmSubtask() {
  const trimmed = this.editedSubtaskInput.trim();
  if (!trimmed) return;

  this.editableTask.subtasks.push({
    id: 'local-' + Date.now() + '-' + Math.random().toString(36).substring(2),
    title: trimmed,
    isdone: false
  });
  this.editedSubtaskInput = '';
  this.isTyping = false;
}

/** Cancels subtask input editing. */
cancelSubtask() {
  this.editedSubtaskInput = '';
  this.isTyping = false;
}

/** Enables the input field for a new subtask. */
enableTyping() {
  this.isTyping = true;
}

/** Enables edit mode for a specific subtask by ID. */
startEdit(subtaskId: string) {
  const index = this.editableTask.subtasks.findIndex(sub => sub.id === subtaskId);
  if (index !== -1) {
    this.subtaskEditIndex = index;
    this.editedSubtaskText = this.editableTask.subtasks[index].title;
  }
}

/** Saves edited subtask title back into the list. */
saveEdit(subtaskId: string) {
  if (!this.editedSubtaskText.trim()) return;

  const index = this.editableTask.subtasks.findIndex(sub => sub.id === subtaskId);
  if (index !== -1) {
    this.editableTask.subtasks[index].title = this.editedSubtaskText.trim();
  }
  this.subtaskEditIndex = -1;
  this.editedSubtaskText = '';
}

/** Deletes a subtask and adds its ID to the deletion queue if already stored in Firebase. */
deleteSubtask(subtaskId: string) {
  const index = this.editableTask.subtasks.findIndex(sub => sub.id === subtaskId);
  if (index !== -1) {
    const deleted = this.editableTask.subtasks[index];
    if (deleted.id && !deleted.id.startsWith('local-')) {
      this.deletedSubtaskIds.push(deleted.id);
    }
    this.editableTask.subtasks.splice(index, 1);
  }
  this.subtaskEditIndex = -1;
  this.editedSubtaskText = '';
}

/** Toggles the `isdone` property of a subtask and updates it in Firestore. */
async onSubtaskToggle(subtask: Subtask) {
  if (!this.task) return;

  try {
    await this.firebaseTaskService.updateSubtaskInDatabase(
      this.task.id,
      subtask.id,
      { isdone: subtask.isdone }
    );
    this.taskUpdated.emit({ ...this.task });
  } catch (error) {
    console.error('Error updating subtask in Firebase:', error);
  }
}

/** Lifecycle hook to restrict the due date picker to today or later. */
ngAfterViewInit(): void {
  if (this.editDueDateInput?.nativeElement) {
    this.editDueDateInput.nativeElement.min = this.todayString;
  }
}

/** Ensures selected due date is not before today (used in edit mode). */
validateDueDateEdit(): void {
  const inputEl = this.editDueDateInput?.nativeElement;
  if (!inputEl) return;
  const value = inputEl.value;
  if (!value) return;

  const chosen = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (chosen < today) {
    const todayISO = this.todayString;
    inputEl.value = todayISO;
    this.dueDateInput = todayISO;
  }
}

/** Removes an assignee by ID from the task. */
removeAssignee(id: string) { 
  this.editableTask.assignees = this.editableTask.assignees.filter(aid => aid !== id);
}

/** Returns contact list filtered by search input term. */
get filteredContacts(): ContactInterface[] {
  const term = this.contactSearchTerm.toLowerCase();
  return this.firebaseTaskService.contactList.filter(contact =>
    contact.name.toLowerCase().includes(term)
  );
}

/** Toggles a contact's selection in the assignee list. */
toggleContactSelection(contactId: string) {
  const index = this.editableTask.assignees.indexOf(contactId);
  if (index === -1) {
    this.editableTask.assignees.push(contactId);
  } else {
    this.editableTask.assignees.splice(index, 1);
  }
}


}
