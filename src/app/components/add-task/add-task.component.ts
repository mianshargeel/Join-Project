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

  async createNewTask() {
    const taskData = {
      title: this.title,
      description: this.description,
      category: this.category,
      priority: this.priority,
      status: this.status,
      duedate: Timestamp.fromDate(new Date(this.duedate)),
      assignees: this.selectedAssignees,
    };

    // Map the addedSubtasks into Subtask objects
    const subtasks = this.addedSubtasks.map(title => ({
      title,
      isdone: false,
    }));

    await this.firebaseTaskService.addTaskWithSubtaskToDatabase(
      this.firebaseTaskService.firestore,
      taskData,
      subtasks
    );

    console.log('Task and Subtasks added');
    this.resetForm(); //to keep empty fields after submiting form
    this.router.navigate(['/board']); //redirecting to board
  }

  async deleteTask(taskId: string) {
    await this.firebaseTaskService.deleteTaskByIdFromDatabase(taskId);
  }

  enableTyping() {
    this.isTyping = true;
  }

  cancelSubtask() {
    this.subtasksInput = '';
    this.isTyping = false;
  }

  confirmSubtask() {
    const trimmed = this.subtasksInput.trim();
    if (trimmed) {
      this.addedSubtasks.push(trimmed);
      this.subtasksInput = '';
      this.isTyping = false;
    }
  }

  saveEdit(index: number) {
    if (this.editedSubtaskText.trim()) {
      this.addedSubtasks[index] = this.editedSubtaskText.trim();
      this.editIndex = null;
      this.editedSubtaskText = '';
    }
  }
  startEdit(index: number) {
    this.editIndex = index;
    this.editedSubtaskText = this.addedSubtasks[index];
  }
  cancelEdit() {
    this.editIndex = null;
    this.editedSubtaskText = '';
  }

  deleteSubtask(index: number) {
    this.addedSubtasks.splice(index, 1);
  }

  resetForm() {
    this.title = '';
    this.description = '';
    this.duedate = '';
    this.priority = 'medium';  // default value
    this.category = '';
    this.subtasksInput = '';
    this.selectedAssignees = [];
    this.dropdownOpen = false;
    this.subtasks = [];
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
    console.log('toggle triggered');

  }

  handleInputClick() {
    if (this.inputClicked) {
      this.dropdownOpen = false;
      this.inputClicked = false;
    } else {
      this.dropdownOpen = true;
      this.inputClicked = true;
    }
  }

  getSelectedContactNames(): { initials: string; color: string }[] {
    return this.firebaseTaskService.contactList
      .filter(contact => contact.id && this.selectedAssignees.includes(contact.id))
      .map(contact => ({
        initials: generateInitials(contact.name),
        color: generateRandomColor()
      }));
  }

  onCheckboxChange(event: any) {
    const id = event.target.value;

    if (event.target.checked) {
      // If checked, add the ID
      this.selectedAssignees.push(id);
    } else {
      // If unchecked, remove the ID
      this.selectedAssignees = this.selectedAssignees.filter(a => a !== id);
    }
  }

  getAvatarColor(id: string): string {
    const contact = this.firebaseTaskService.contactList.find(contact => contact.id === id);
    return contact?.color ?? "#000000";
  }

  //to get exact id of select name to assign creating following function
  getContactInitials(contactId: string): string {
    const contact = this.firebaseTaskService.contactList.find(c => c.id === contactId);
    return contact ? generateInitials(contact.name) : '?';
  }

  //Funktion von Valeriya
  ngAfterViewInit(): void {
    this.setTodayAsMinDate();
  }

  private setTodayAsMinDate(): void {
    const today = new Date().toISOString().split('T')[0];
    if (this.dueDateInput?.nativeElement) {
      this.dueDateInput.nativeElement.min = today;
    }
  }

  validateDueDate(): void {
    const input = this.dueDateInput?.nativeElement;
    if (input) {
      const dateValue = input.value;
      if (dateValue) {
        const selectedDate = new Date(dateValue);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Prüfen, ob das gewählte Datum in der Vergangenheit liegt
        if (selectedDate < today) {
          // Wenn ja, setze das Datum auf heute
          input.value = today.toISOString().split('T')[0];
          console.log('Selected date was in the past. Reset to today.');
        } else {
          // Formatieren und ausgeben
          const formattedDate = selectedDate.toLocaleDateString('en-US');
          console.log('Formatted Selected Date:', formattedDate);
        }
      }
    }
  }

  get filteredContacts(): ContactInterface[] {
    // Prevent error if contactList is not yet loaded
    if (!this.firebaseTaskService.contactList) return [];

    const term = this.contactSearchTerm.toLowerCase().trim();

    // Return full list if search term is empty
    if (!term) return this.firebaseTaskService.contactList;

    // Filter by name (case-insensitive)
    return this.firebaseTaskService.contactList.filter(contact =>
      contact.name.toLowerCase().includes(term)
    );
  }
  
  //when user click outside of dropdown in assignees-field, its automatically closes 
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInside = this.assigneeDropdownRef?.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.dropdownOpen = false;
    }
  }

  removeAssignee(id: string) {
    this.selectedAssignees = this.selectedAssignees.filter(a => a !== id);
  }
}