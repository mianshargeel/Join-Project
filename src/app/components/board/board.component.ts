
import { TaskService } from '../../services/task.service';
import { Component, inject, } from '@angular/core';
import { CdkDragDrop, CdkDrag, CdkDropList, CdkDropListGroup, moveItemInArray, transferArrayItem, } from '@angular/cdk/drag-drop';
import { FirebaseService } from '../../services/firebase.service';
import { CommonModule } from '@angular/common';
import { Task } from '../../interfaces/task';
import { FormsModule } from '@angular/forms';
import { generateRandomColor } from '../../models/contact.model';
import { BoardDialogComponent } from './board-dialog/board-dialog.component';
import { ContactInterface } from '../../interfaces/contact-interface';
import { AddTaskComponent } from '../add-task/add-task.component';
import { ElementRef, HostListener, ViewChild } from '@angular/core';


@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CdkDropListGroup, CdkDropList, CdkDrag, CommonModule, FormsModule, BoardDialogComponent, AddTaskComponent],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss', './board.responsive.scss', './add-task-dialog.scss']
})

export class BoardComponent {
  firebaseTaskService = inject(TaskService);
  firebaseService = inject(FirebaseService); //in case if used somewhere in this file
  selectedTask: Task | null = null;
  dialogOpen = false;
  showDialog = false;
  dragging = false;
  public selectedAssignees: { id: string, name: string, initials: string, color: string }[] = [];
  contacts: ContactInterface[] = [];
  searchTerm = ""; // Marian Search
  tasks = []; // Marian Search
  private avatarColorCache: { [id: string]: string } = {};
  showAddTaskDialog: boolean = false;
  dialogTaskStatus: string = 'To do';
  isMobileView = false;
  dropdownTaskId: string | null = null;
  @ViewChild('menuRef') menuRef!: ElementRef;

  openDialog(task: Task) {
    if (this.dragging) {
      return;
    }
    this.selectedTask = task;
    this.dialogOpen = true;
    this.selectedAssignees = this.getTaskAssignees(task);
  }

  closeDialog() {
    this.dialogOpen = false;
    this.selectedTask = null;
  }

  constructor() { }

  //When the app starts, it reads the status of each task from Firebase and places it into the correct column.
  ngOnInit() {
    this.contacts = this.firebaseTaskService.contactList;

    this.firebaseTaskService.tasks$.subscribe((tasks) => {
      this.firebaseTaskService.allTasks = tasks;
      this.updateColumnsFromFirebase();
    });

    this.firebaseTaskService.loadAllTasks(); // set up realtime listener

    this.checkScreenWidth();
    window.addEventListener('resize', this.checkScreenWidth.bind(this));
  }

  checkScreenWidth() {
    this.isMobileView = window.innerWidth <= 1500;
  }

  async deleteTask(taskId: string) {
    await this.firebaseTaskService.deleteTaskByIdFromDatabase(taskId);
  }

  getContactNameById(id: string): string {
    let contact = this.firebaseTaskService.contactList.find(c => c.id === id);
    return contact ? contact.name : 'unknown';
  }

  columns: { title: string; tasks: Task[] }[] = [
    { title: 'To do', tasks: [] },
    { title: 'In progress', tasks: [] },
    { title: 'Await feedback', tasks: [] },
    { title: 'Done', tasks: [] }
  ];

  drop(event: CdkDragDrop<Task[]>, columnTitle: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Clone task to avoid reference issues
      const originalTask = event.previousContainer.data[event.previousIndex];
      const movedTask: Task = { ...originalTask, status: columnTitle.toLowerCase() };
  
      // Remove from old and insert into new
      event.previousContainer.data.splice(event.previousIndex, 1);
      event.container.data.splice(event.currentIndex, 0, movedTask);
  
      // Update Firestore
      setTimeout(() => {
        this.firebaseTaskService.updateTaskInDatabase(movedTask.id, { status: movedTask.status });
      }, 100);
    }
  }
  
  //Without trackBy, Angular assumes every item in a list is new whenever the array changes
  trackByTaskId(index: number, task: Task): string {
    return task.id;
  }

  moveToColumn(task: Task, targetColumn: string) {
    if (task.status === targetColumn.toLowerCase()) return;

    this.firebaseTaskService.updateTaskInDatabase(task.id, {
      status: targetColumn.toLowerCase()
    });

    this.dropdownTaskId = null;
  }


  toggleTaskDropdown(taskId: string) {
    this.dropdownTaskId = this.dropdownTaskId === taskId ? null : taskId;
  }

  updateColumnsFromFirebase(): void {
    // Clear columns
    this.columns.forEach(col => col.tasks = []);

    for (const task of this.filteredTasks) {
      const status = task.status?.toLowerCase();

      const column = this.columns.find(col =>
        col.title.toLowerCase() === status
      );

      if (column) {
        column.tasks.push(task);
      } else {
        // If no matching column, put it into "To do"
        this.columns[0].tasks.push(task);
      }
    }
  }

  getAvatarColor(id: string): string {
    const contact = this.firebaseTaskService.contactList.find(contact => contact.id === id);
    return contact?.color ?? "#000000";
  } //This guarantees that each assigneeId always gets the same color every time Angular runs change detection.

  getConnectedColumns() {
    return this.columns.map(c => this.normalizeId(c.title));
  }
  //Taher for you: Fixed drag-and-drop error by assigning explicit id to each cdkDropList, ensuring they match the values returned by getConnectedColumns()
  normalizeId(title: string) {
    return title.toLowerCase().replace(/\s+/g, '-');
  }

  getCompletedSubtasksCount(task: Task): number {
    return task.subtasks.filter(sub => sub.isdone).length;
  }


  getContactInitials(contactId: string): string {
    const contact = this.firebaseTaskService.contactList.find(c => c.id === contactId);
    if (!contact) return '?';
    return contact.name.split(' ').map(n => n[0]).join('');
  }

  emptyLabel(title: string): string {
    switch (title.toLowerCase()) {
      case 'to do': return 'No tasks to do';
      case 'in progress': return 'No tasks in progress';
      case 'await feedback': return 'No tasks awaiting feedback';
      case 'done': return 'No tasks done';
      default: return 'No tasks';
    }
  }
  //You want to pass enriched assignee info (name, initials, avatar color) to the dialog so it can display the full assignee details without having to re-implement logic from the BoardComponent
  getTaskAssignees(task: Task) {
    return task.assignees.map(id => {
      const contact = this.firebaseTaskService.contactList.find(c => c.id === id);
      return {
        id,
        name: contact ? contact.name : 'Unknown',
        initials: this.getContactInitials(id),
        color: this.getAvatarColor(id)
      };
    });
  }

  get filteredTasks(): Task[] {
    if (this.searchTerm) {
      let term = this.searchTerm.toLowerCase();
      return this.firebaseTaskService.allTasks.filter(task =>
        task.title.toLowerCase().includes(term) ||
        task.description?.toLowerCase().includes(term));
    } else {
      return this.firebaseTaskService.allTasks;
    }
  }

  /**
   * Updates a specific task within the board's columns when a subtask is modified (e.g., toggled complete).
   * This ensures the task's visual representation (e.g., progress bar) is updated immediately in the UI.
   *
   * Steps:
   * 1. Locates the task within its column using the task ID.
   * 2. Deep clones the updated task to trigger Angular change detection.
   * 3. Replaces the task in its column with the updated clone.
   * 4. Replaces the entire column and columns array to force UI refresh.
   *
   * This method is triggered when the BoardDialogComponent emits a (taskUpdated) event.
   */

  handleTaskUpdate(updatedTask: Task) {
    // console.log('Board received updated task:', updatedTask);
    for (let colIndex = 0; colIndex < this.columns.length; colIndex++) { //looping through each column to find where this task currently exists (based on matching id).
      const column = this.columns[colIndex];
      const taskIndex = column.tasks.findIndex(t => t.id === updatedTask.id);

      if (taskIndex !== -1) {
        const clonedTask = JSON.parse(JSON.stringify(updatedTask));

        const updatedTasks = [...column.tasks];
        updatedTasks[taskIndex] = clonedTask;

        this.columns[colIndex] = {
          ...column,
          tasks: updatedTasks
        };

        this.columns = [...this.columns];
        break;
      }
    }
  }

  // To Limit the numer of Avatars shown in the card
  getDisplayedAssignees(assignees: string[]): string[] {
    return assignees.slice(0, 5);
  }

  //Marian: Add Task Dialog
  openAddTaskDialog(status: string) {
    this.showAddTaskDialog = true;
    document.body.classList.add('modal-open');
    this.dialogTaskStatus = status;
    console.log(status);
  }

  closeAddTaskDialog() {
    this.showAddTaskDialog = false;
    document.body.classList.remove('modal-open');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInside = this.menuRef?.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.dropdownTaskId = null;
    }
  }
  handleBackdropClick(event: MouseEvent) { // to close add-task-dialog on click outside it
    this.closeAddTaskDialog();
  }

}
