import { Timestamp } from '@angular/fire/firestore';
import { TaskService } from '../../services/task.service';
import { Component,inject, ElementRef, ViewChild, AfterViewInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { generateInitials, generateRandomColor } from '../../models/contact.model';
import { Router } from '@angular/router';

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

  title = '';
  description = '';
  duedate: string = '';
  priority = 'medium';
  assignees = '';
  category = '';
  subtasksInput = '';
  selectedAssignees: string[] = [];
  dropdownOpen = false;

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

  getAvatarColor(contactId: string): string {
    if (!this.avatarColors[contactId]) {
      this.avatarColors[contactId] = this.generateRandomColor();
    }
    return this.avatarColors[contactId];
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
}


































// import { Timestamp } from '@angular/fire/firestore';
// import { TaskService } from '../../services/task.service';
// import { Component,inject, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { NgSelectModule } from '@ng-select/ng-select';

// @Component({
//   selector: 'app-add-task',
//   standalone: true,
//   imports: [CommonModule, FormsModule, NgSelectModule],
//   templateUrl: './add-task.component.html',
//   styleUrl: './add-task.component.scss'
// })
// export class AddTaskComponent implements AfterViewInit {
//   firebaseTaskService = inject(TaskService);
//   @ViewChild('dueDateInput') dueDateInput!: ElementRef<HTMLInputElement>;

//   title : string = '';
//   description : string = '';
//   duedate: string = '';
//   priority : string = 'medium';
//   category : string = '';
//   subtasksInput : {
//     title : string,
//     isdone : boolean
//   }[] = [];
//   selectedAssignees: string[] = [];

//    async createNewTask() {
//     const taskData = {
//       title: this.title,
//       description: this.description,
//       category: this.category,
//       priority: this.priority,
//       status: 'open',
//       duedate: Timestamp.fromDate(new Date(this.duedate)),
//       assignees: this.selectedAssignees,
//     };

//      await this.firebaseTaskService.addTaskWithSubtaskToDatabase(
//       this.firebaseTaskService.firestore, 
//       taskData, 
//       this.subtasksInput
//     );

//      console.log('Task and Subtasks added');
//      this.resetForm();
//   }
  
//   resetForm() {
//     this.title = '';
//     this.description = '';
//     this.duedate = '';
//     this.priority = 'medium';
//     this.category = '';
//     this.subtasksInput = [];
//     this.selectedAssignees = [];
//   }


//   ngAfterViewInit(): void {
//     this.setTodayAsMinDate();
//   }

//   private setTodayAsMinDate(): void {
//     const today = new Date().toISOString().split('T')[0];
//     if (this.dueDateInput?.nativeElement) {
//       this.dueDateInput.nativeElement.min = today;
//     }
//   }

//   validateDueDate(): void {
//     const input = this.dueDateInput?.nativeElement;
//     if (input) {
//       const dateValue = input.value;
//       if (dateValue) {
//         const selectedDate = new Date(dateValue);
//         const today = new Date();
//         today.setHours(0, 0, 0, 0);


//         if (selectedDate < today) {

//           input.value = today.toISOString().split('T')[0];
//           console.log('Selected date was in the past. Reset to today.');
//         } else {

//           const formattedDate = selectedDate.toLocaleDateString('en-US');
//           console.log('Formatted Selected Date:', formattedDate);
//         }
//       }
//     }
//   }
// }
