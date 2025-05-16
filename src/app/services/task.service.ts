import { Injectable, inject, OnDestroy } from '@angular/core';
import { Firestore, collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, Timestamp } from '@angular/fire/firestore';
import { ContactInterface } from '../interfaces/contact-interface';
import { Subtask, Task } from '../interfaces/task';
import { getDocs } from 'firebase/firestore';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  unsubscribe;
  firestore: Firestore = inject(Firestore);
  contactList: ContactInterface[] = [];
  allTasks: Task[] = [];
  subtaskUnsubscribe: { [id: string]: () => void } = {};
  allSubtasks: Subtask[] = [];
  tasks$ = new BehaviorSubject<Task[]>([]);

  constructor() {
    this.unsubscribe = onSnapshot(collection(this.firestore, 'contacts'), (querySnap) => {
      this.contactList = [];
      querySnap.forEach((element) => {
        this.contactList.push(this.setNewContactObject(element.id, element.data()))
      });
      // console.log(this.contactList);
    });
  }
   setNewContactObject(id: string, obj: any): ContactInterface {
    return {
        id: id,
        name: obj.name,
        mail: obj.mail,
        phone: obj.phone,
        color: obj.color
      };
    }
  
    loadAllTasks() {
      const tasksRef = collection(this.firestore, 'tasks');
    
      onSnapshot(tasksRef, (querySnap) => {
        const changes = querySnap.docChanges();//This gives us a list of only the changed docs Each with a type: 'added' | 'modified' | 'removed', This avoids having to clear and rebuild the whole list every time
    
        for (const change of changes) {
          const doc = change.doc;
          const task = this.setTaskObject(doc.data(), doc.id);
          const index = this.allTasks.findIndex(t => t.id === task.id);
    
          if (change.type === 'added') {
            this.allTasks.push(task);
          } else if (change.type === 'modified') {
            if (index !== -1) {
              this.allTasks[index] = task;
            }
          } else if (change.type === 'removed') {
            if (index !== -1) {
              this.allTasks.splice(index, 1);
            }
          }
    
          // Subtasks setup (always refresh for modified/added tasks)
          const subtaskRef = collection(this.firestore, `tasks/${task.id}/subtasks`);
          this.subtaskUnsubscribe[task.id]?.(); // Unsubscribe previous
          this.subtaskUnsubscribe[task.id] = onSnapshot(subtaskRef, (subSnap) => {
            const subtasks: Subtask[] = subSnap.docs.map((sdoc) => ({
              id: sdoc.id,
              ...(sdoc.data() as Omit<Subtask, 'id'>),
            }));
    
            const taskIndex = this.allTasks.findIndex(t => t.id === task.id);
            if (taskIndex !== -1) {
              this.allTasks[taskIndex].subtasks = subtasks;
            }
    
            this.tasks$.next(this.allTasks); //Still needed to trigger update
          });
        }
        // Only push tasks$ once after task-level changes
        this.tasks$.next(this.allTasks);
      });
    }

  setTaskObject(task: any, id: string): Task {
      return {
        id: id,
        title: task.title || "",
        description: task.description || "",
        category: task.category || "",
        priority: task.priority || "",
        status: task.status || "",
        duedate: task.duedate || 0,
        assignees: Array.isArray(task.assignees) ? task.assignees : [],
        subtasks: task.subtasks || "",
    };
    // If it’s undefined, null, or anything not an array → default to an empty array []
  }

  async addTaskWithSubtaskToDatabase(firestore: Firestore, taskData: Omit<Task, 'id' | 'subtasks'>, subtasks: Omit<Subtask, 'id'>[]) {

    try {
        // Create a reference to the 'tasks' collection
      const taskCollectionRef = collection(firestore, 'tasks');

      //adding task-document to database
      const taskDocRef = await addDoc(taskCollectionRef, { ...taskData });
      console.log('Task added with ID:', taskDocRef.id);

      // Adding each subtask to the 'subtasks' subcollection
      const subTaskCollectionRef = collection(firestore, `tasks/${taskDocRef.id}/subtasks`);
      for (let subtask of subtasks) {
        await addDoc(subTaskCollectionRef, subtask);
    }
    console.log('Subtasks added successfully.');
      } catch (error) {
      console.error('Error adding task and subtasks:', error);
    }
    
  }
  //using this function to add new subtask's title through edit-dialog
  async addSubtaskToDatabase(taskId: string, subtaskData: Omit<Subtask, 'id'>) {
    const subtaskCollection = collection(this.firestore, 'tasks', taskId, 'subtasks');
    return await addDoc(subtaskCollection, subtaskData);
  }

  async deleteTaskByIdFromDatabase(taskId: string) {
    try {
      const taskDocRef = doc(this.firestore, 'tasks', taskId);

      //get all subtasks to delete also
      const subTasksCollectionRef = collection(this.firestore, `tasks/${taskId}/subtasks`);
      const subtaskSnapshot = await getDocs(subTasksCollectionRef);

      const deletePromise = subtaskSnapshot.docs.map((eachSubtask) => {
        deleteDoc(eachSubtask.ref); //getting Reffernce to delete each doc in subCollection from firebase
      });
      await Promise.all(deletePromise);
      //  Deleting the main task
      await deleteDoc(taskDocRef);

      console.log('Task with ID: ', taskId, ' Deleted');
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }

  async updateTaskInDatabase(taskId: string, updateData: Partial<Task>) { //only updating Task
    try {
      const taskDocRef = doc(this.firestore, 'tasks', taskId);
      await updateDoc(taskDocRef, updateData);

      console.log('Task updated successfully');
    } catch (error) {
       console.error('Error updating task:', error);
    }
  }

  //to update subtasks
  async updateSubtaskInDatabase(taskId: string, subTaskId: string, updateData: Partial<Subtask>) {
    try {
      const subtaskDocRef = doc(this.firestore, 'tasks', taskId, 'subtasks', subTaskId);
      await updateDoc(subtaskDocRef, updateData);

      console.log('Subtask updated successfully');
    } catch (error) {
      console.error('Error updating subtask:', error);
    }
  }

  //firebase contacts functionalities

  async addNewContactToDatabase(contact: ContactInterface) {
    await addDoc(collection(this.firestore, 'contacts'), contact);
  }

  async editContactInDatabase(id: string, contact: ContactInterface) {
      await updateDoc(doc(this.firestore, 'contacts', id), {
        name: contact.name,
        mail: contact.mail,
        phone: contact.phone
      });
  } 
  
  async deleteContactFromDatabase(id: string) {
    await deleteDoc(doc(this.firestore, 'contacts', id));
  }

  async deleteSubtaskFromDatabase(taskId: string, subtaskId: string) {
    try {
      const subtaskRef = doc(this.firestore, 'tasks', taskId, 'subtasks', subtaskId);
      await deleteDoc(subtaskRef);
      console.log('Subtask deleted from Firebase:', subtaskId);
    } catch (error) {
      console.error('Error deleting subtask:', error);
    }
  }



  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    for (const unsub of Object.values(this.subtaskUnsubscribe)) {
      unsub();
    }
  }
}
