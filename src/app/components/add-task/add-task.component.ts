import { Timestamp } from '@angular/fire/firestore';
import { TaskService } from '../../services/task.service';
import { Component, inject, ElementRef, ViewChild, AfterViewInit, Input, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { generateInitials, generateRandomColor } from '../../models/contact.model';
import { Router } from '@angular/router';
import { ContactInterface } from '../../interfaces/contact-interface';

@Component({
  selector: 'app-add-task',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-task.component.html',
  styleUrl: './add-task.component.scss'
})
export class AddTaskComponent implements AfterViewInit {
  firebaseTaskService = inject(TaskService);
  @ViewChild('dueDateInput') dueDateInput!: ElementRef<HTMLInputElement>;
  generateInitials = generateInitials;
  generateRandomColor = generateRandomColor;
  avatarColors: { [contactId: string]: string } = {};
  router = inject(Router);
  subtasks: { title: string; isdone: boolean }[] = [];
  isTyping: boolean = false;
  addedSubtasks: string[] = [];
  hoveredSubtask: string = '';
  hoveredIndex = -1;
  editIndex: number | null = null;
  editedSubtaskText = '';
  @Input() status: string = 'To do';
  @ViewChild('assigneeDropdown') assigneeDropdownRef!: ElementRef;
  contactSearchTerm = '';

  title = '';
  description = '';
  duedate: string = '';
  priority = 'medium';
  assignees = '';
  category = '';
  subtasksInput = '';
  selectedAssignees: string[] = [];
  dropdownOpen = false;
  inputClicked = false;

  /**
  * Creates a new task along with its subtasks and navigates back to the board.
  */
  async createNewTask() {
    const taskData = this.buildTaskData();
    const subtasks = this.buildSubtasks();

    await this.firebaseTaskService.addTaskWithSubtaskToDatabase(
      this.firebaseTaskService.firestore,
      taskData,
      subtasks
    );

    this.resetForm();
    this.router.navigate(['/board']);
  }

  /**
   * Builds and returns task data based on form input.
   */
  private buildTaskData() {
    return {
      title: this.title,
      description: this.description,
      category: this.category,
      priority: this.priority,
      status: this.status,
      duedate: Timestamp.fromDate(new Date(this.duedate)),
      assignees: this.selectedAssignees,
    };
  }

  /**
   * Transforms added subtask titles into subtask objects.
   */
  private buildSubtasks() {
    return this.addedSubtasks.map(title => ({
      title,
      isdone: false,
    }));
  }

  /**
   * Deletes a task by its ID from Firestore.
   */
  async deleteTask(taskId: string) {
    await this.firebaseTaskService.deleteTaskByIdFromDatabase(taskId);
  }

  /**
   * Enables typing mode for adding a subtask.
   */
  enableTyping() {
    this.isTyping = true;
  }

  /**
   * Cancels subtask input and resets state.
   */
  cancelSubtask() {
    this.subtasksInput = '';
    this.isTyping = false;
  }

  /**
   * Confirms subtask input and adds it to the subtask list.
   */
  confirmSubtask() {
    const trimmed = this.subtasksInput.trim();
    if (trimmed) {
      this.addedSubtasks.push(trimmed);
      this.subtasksInput = '';
      this.isTyping = false;
    }
  }

  /**
   * Saves edits made to a subtask at a specific index.
   */
  saveEdit(index: number) {
    if (this.editedSubtaskText.trim()) {
      this.addedSubtasks[index] = this.editedSubtaskText.trim();
      this.editIndex = null;
      this.editedSubtaskText = '';
    }
  }

  /**
   * Starts editing a specific subtask.
   */
  startEdit(index: number) {
    this.editIndex = index;
    this.editedSubtaskText = this.addedSubtasks[index];
  }

  /**
   * Cancels the subtask edit mode.
   */
  cancelEdit() {
    this.editIndex = null;
    this.editedSubtaskText = '';
  }

  /**
   * Deletes a subtask from the list.
   */
  deleteSubtask(index: number) {
    this.addedSubtasks.splice(index, 1);
  }

  /**
   * Resets the entire form back to initial default state.
   */
  resetForm() {
    this.title = '';
    this.description = '';
    this.duedate = '';
    this.priority = 'medium';
    this.category = '';
    this.subtasksInput = '';
    this.selectedAssignees = [];
    this.dropdownOpen = false;
    this.subtasks = [];
  }

  /**
   * Toggles visibility of the assignee dropdown.
   */
  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  /**
   * Handles input click for assignee dropdown; toggles open/close state.
   */
  handleInputClick() {
    this.dropdownOpen = !this.inputClicked;
    this.inputClicked = !this.inputClicked;
  }

  /**
   * Returns selected contacts with their initials and random colors.
   */
  getSelectedContactNames(): { initials: string; color: string }[] {
    return this.firebaseTaskService.contactList
      .filter(contact => contact.id && this.selectedAssignees.includes(contact.id))
      .map(contact => ({
        initials: generateInitials(contact.name),
        color: generateRandomColor()
      }));
  }

  /**
   * Handles checkbox interaction for adding/removing assignee ID.
   */
  onCheckboxChange(event: any) {
    const id = event.target.value;

    if (event.target.checked) {
      this.selectedAssignees.push(id);
    } else {
      this.selectedAssignees = this.selectedAssignees.filter(a => a !== id);
    }
  }

  /**
   * Returns the avatar color for a specific contact.
   */
  getAvatarColor(id: string): string {
    const contact = this.firebaseTaskService.contactList.find(contact => contact.id === id);
    return contact?.color ?? "#000000";
  }

  /**
   * Returns the initials for a given contact ID.
   */
  getContactInitials(contactId: string): string {
    const contact = this.firebaseTaskService.contactList.find(c => c.id === contactId);
    return contact ? generateInitials(contact.name) : '?';
  }

  /**
   * Sets the minimum selectable date in the due date input field.
   */
  private setTodayAsMinDate(): void {
    const today = new Date().toISOString().split('T')[0];
    if (this.dueDateInput?.nativeElement) {
      this.dueDateInput.nativeElement.min = today;
    }
  }

  /**
   * Called after view initialization; sets minimum due date.
   */
  ngAfterViewInit(): void {
    this.setTodayAsMinDate();
  }

  /**
   * Ensures the selected due date is not in the past.
   */
  validateDueDate(): void {
    const input = this.dueDateInput?.nativeElement;
    if (!input || !input.value) return;

    const selectedDate = new Date(input.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      input.value = this.formatDateToInput(today);
    } else {
      this.formatDateToInput(selectedDate);
    }
  }

  /**
   * Converts a date object to an input-ready date string.
   */
  private formatDateToInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Filters contacts based on search input.
   */
  get filteredContacts(): ContactInterface[] {
    if (!this.firebaseTaskService.contactList) return [];
    const term = this.contactSearchTerm.toLowerCase().trim();

    if (!term) return this.firebaseTaskService.contactList;

    return this.firebaseTaskService.contactList.filter(contact =>
      contact.name.toLowerCase().includes(term)
    );
  }

  /**
   * Closes the dropdown when clicking outside of the assignee field.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInside = this.assigneeDropdownRef?.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.dropdownOpen = false;
    }
  }

  /**
   * Removes an assignee from the selected list.
   */
  removeAssignee(id: string) {
    this.selectedAssignees = this.selectedAssignees.filter(a => a !== id);
  }
}