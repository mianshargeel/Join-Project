
import { TaskService } from '../../services/task.service';
import { Component, inject } from '@angular/core';
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
  styleUrls: ['./board.component.scss', './board.responsive.scss']
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

  /**
 * Opens the task dialog for viewing/editing the given task.
 * Skips if a drag operation is in progress.
 */
  openDialog(task: Task) {
    if (this.dragging) {
      return;
    }
    this.selectedTask = task;
    this.dialogOpen = true;
    this.selectedAssignees = this.getTaskAssignees(task);
  }
  /**
 * Closes the open task dialog and resets the selected task.
 */
  closeDialog() {
    this.dialogOpen = false;
    this.selectedTask = null;
  }

  constructor() { }

  /**
 * Angular lifecycle method called after component initialization.
 * Subscribes to task updates, sets up real-time task loading, and screen width detection.
 */
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
  /**
 * Checks current screen width to determine mobile view.
 */
  checkScreenWidth() {
    this.isMobileView = window.innerWidth <= 1500;
  }
  /**
 * Deletes the task with the given ID from Firestore.
 */
  async deleteTask(taskId: string) {
    await this.firebaseTaskService.deleteTaskByIdFromDatabase(taskId);
  }
  /**
 * Returns the contact name for a given contact ID.
 * Returns 'unknown' if the contact is not found.
 */
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
  /**
 * Handles drag-and-drop movement of tasks between or within columns.
 * Updates the task's status if moved to a different column.
 */
  drop(event: CdkDragDrop<Task[]>, columnTitle: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      const movedTask = event.container.data[event.currentIndex];
      this.firebaseTaskService.updateTaskInDatabase(movedTask.id, {
        status: columnTitle.toLowerCase()
      });
    }
  }
  /**
 * Moves a task to a different column (triggered from dropdown menu).On Mobile-screen
 */
  moveToColumn(task: Task, targetColumn: string) {
    if (task.status === targetColumn.toLowerCase()) return;
  
    this.firebaseTaskService.updateTaskInDatabase(task.id, {
      status: targetColumn.toLowerCase()
    });
  
    this.dropdownTaskId = null;
  }
  /**
 * Toggles the dropdown menu for a specific task (for mobile).
 */
  toggleTaskDropdown(taskId: string) {
    this.dropdownTaskId = this.dropdownTaskId === taskId ? null : taskId;
  }
  /**
 * Organizes tasks into their corresponding columns based on status.
 */
  updateColumnsFromFirebase(): void {
    this.columns.forEach(col => col.tasks = []);
    for (const task of this.filteredTasks) {
      const status = task.status?.toLowerCase();
      const column = this.columns.find(col =>
        col.title.toLowerCase() === status
      );
      if (column) {
        column.tasks.push(task);
      } else {
        this.columns[0].tasks.push(task);
      }
    }
  }
  /**
 * Returns the avatar background color for a given contact ID.
 */
  getAvatarColor(id: string): string {
    const contact = this.firebaseTaskService.contactList.find(contact => contact.id === id);
    return contact?.color ?? "#000000";
  } 
  /**
 * Returns a list of connected column IDs for drag-and-drop linking.
 */
  getConnectedColumns() {
    return this.columns.map(c => this.normalizeId(c.title));
  }
  /**
 * Converts a column title to a lowercase hyphenated ID (e.g., 'To do' -> 'to-do').
 */
  normalizeId(title: string) {
    return title.toLowerCase().replace(/\s+/g, '-');
  }
  /**
 * Returns the count of completed subtasks for a given task.
 */
  getCompletedSubtasksCount(task: Task): number {
    return task.subtasks.filter(sub => sub.isdone).length;
  }
  /**
 * Returns initials (e.g., "AB") for a contact based on their name.
 */
  getContactInitials(contactId: string): string {
    const contact = this.firebaseTaskService.contactList.find(c => c.id === contactId);
    if (!contact) return '?';
    return contact.name.split(' ').map(n => n[0]).join('');
  }
  /**
 * Returns the label text shown in an empty column.
 */
  emptyLabel(title: string): string {
    switch (title.toLowerCase()) {
      case 'to do': return 'No tasks to do';
      case 'in progress': return 'No tasks in progress';
      case 'await feedback': return 'No tasks awaiting feedback';
      case 'done': return 'No tasks done';
      default: return 'No tasks';
    }
  }
  /**
 * Returns full contact details for each assignee of a task.
 */
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
  /**
 * Filters tasks based on the current search term.
 */
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
    for (let colIndex = 0; colIndex < this.columns.length; colIndex++) {
      const column = this.columns[colIndex];
      const taskIndex = column.tasks.findIndex(t => t.id === updatedTask.id);
      if (taskIndex !== -1) {
        const clonedTask = JSON.parse(JSON.stringify(updatedTask));
        const updatedTasks = [...column.tasks];
        updatedTasks[taskIndex] = clonedTask;
        this.columns[colIndex] = { ...column, tasks: updatedTasks };
        this.columns = [...this.columns];
        break;
      }
    }
  }
  /**
 * Opens the add-task modal and sets the initial column status in Board on addTask-btn
 */
  openAddTaskDialog(status: string) {
    this.showAddTaskDialog = true;
    document.body.classList.add('modal-open');
    this.dialogTaskStatus = status;
    console.log(status);
  }
  /**
 * Closes the add-task modal.
 */
  closeAddTaskDialog() {
    this.showAddTaskDialog = false;
    document.body.classList.remove('modal-open');
  }
  /**
 * Closes the dropdown menu if user clicks outside of it.
 */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInside = this.menuRef?.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.dropdownTaskId = null;
    }
  }

}
