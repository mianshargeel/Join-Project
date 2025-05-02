import { Timestamp } from "@angular/fire/firestore";

export interface Task {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    duedate: Timestamp;
    assignees: string[];
    subtasks: Subtask[];
  }

  export interface Subtask {
    id: string;
    title: string;
    isdone: boolean;
}