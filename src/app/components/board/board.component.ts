
import { TaskService } from '../../services/task.service';
import { Component, inject } from '@angular/core';
import { CdkDragDrop, CdkDrag, CdkDropList, CdkDropListGroup, moveItemInArray, transferArrayItem, } from '@angular/cdk/drag-drop';
import { FirebaseService } from '../../services/firebase.service';
import { CommonModule } from '@angular/common';
import { Task } from '../../interfaces/task';
import { FormsModule } from '@angular/forms';
import { generateRandomColor } from '../../models/contact.model';
import { BoardDialogComponent } from './board-dialog/board-dialog.component';
import { TaskDialogComponent } from './task-dialog/task-dialog.component';


@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CdkDropListGroup, CdkDropList, CdkDrag, CommonModule, FormsModule, BoardDialogComponent, TaskDialogComponent],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss', './board.responsive.scss']
})

export class BoardComponent {
  firebaseTaskService = inject(TaskService);
  selectedTask: Task | null = null;
  dialogOpen = false;
  showDialog = false;
  public selectedAssignees: { id: string, name: string, initials: string, color: string }[] = [];

  openDialog(task: Task) {
    this.selectedTask = task;
    this.dialogOpen = true;
     this.selectedAssignees = this.getTaskAssignees(task);
  }

  closeDialog() {
    this.dialogOpen = false;
    this.selectedTask = null;
  }

  private avatarColorCache: { [id: string]: string } = {};


  constructor(public firebaseService: FirebaseService) { }
  //When the app starts, it reads the status of each task from Firebase and places it into the correct column.
  ngOnInit() {
    this.firebaseTaskService.loadAllTasks();

    this.firebaseTaskService.tasks$.subscribe((tasks) => {
      this.firebaseTaskService.allTasks = tasks;
      this.updateColumnsFromFirebase(); // Group tasks when they are actually loaded
    });
  }

  async deleteTask(taskId: string) {
    await this.firebaseTaskService.deleteTaskByIdFromDatabase(taskId);
  }

  async updateTask(taskId: string) {
    const updatedData = {
      title: 'Database',
      priority: 'low',
      status: 'in progress',
    };

    await this.firebaseTaskService.updateTaskInDatabase(taskId, updatedData);
  }

  async updateSubtask(taskId: string, subtaskId: string) {
    const updatedSubtask = {
      title: 'Creating Database',
      isdone: false,
    };

    await this.firebaseTaskService.updateSubtaskInDatabase(taskId, subtaskId, updatedSubtask);
  }

  //drag n drop + cards detail functionalities
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
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      const movedTask = event.container.data[event.currentIndex];

      // // Persist the new status in Firebase
      this.firebaseTaskService.updateTaskInDatabase(movedTask.id, {
        status: columnTitle
      });
    }
  }

  updateColumnsFromFirebase(): void {
    // Clear columns
    this.columns.forEach(col => col.tasks = []);

    for (const task of this.firebaseTaskService.allTasks) {
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
    if (!this.avatarColorCache[id]) {
      this.avatarColorCache[id] = generateRandomColor();
    }
    return this.avatarColorCache[id];
  } //This guarantees that each assigneeId always gets the same color every time Angular runs change detection.


  getConnectedColumns() {
    return this.columns.map(c => c.title);
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

}

