import { Injectable, inject, OnDestroy } from '@angular/core';
import { Firestore, collection, collectionData, doc, onSnapshot, addDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { ContactService } from './contact.service';
import { from, map, Observable, of } from 'rxjs';
import { Contact, generateInitials, generateRandomColor } from '../models/contact.model';
import { IContact } from '../interfaces/contact';
import { Task } from '../interfaces/task';

@Injectable({
  providedIn: 'root'
})

export class FirebaseService implements ContactService {

  firestore: Firestore = inject(Firestore);

  contacts: IContact[] = [];
  tasks: Task[] = [];

  unsubContacts;
  unsubTasks;

  constructor() {
    this.unsubContacts = this.subContacts();
    this.unsubTasks = this.subTasks();
  }

  getContacts(): Observable<Contact[]> {
    const contactsRef = collection(this.firestore, 'contacts'); //Must be used *directly*
    
    return collectionData(contactsRef, { idField: 'id' }).pipe(
      map((docs: any[]) =>
        docs.map(c => ({
          ...c,
          name: c.name ?? 'Unnamed',
          email: c.email ?? c.mail ?? '',
          phone: c.phone ?? '',
          color: c.color ?? generateRandomColor(),
          initials: c.initials ?? generateInitials(c.name ?? 'U'),
        }))
      )
    );
  }
  
  addContact(contact: Omit<Contact, 'id' | 'initials' | 'color'>): Observable<Contact> {
    const newContact: Contact = {
      ...contact,
      id: '42',
      initials: 'MM',
      color: 'red'
    };
    return of(newContact);
  }

  getContactsRef(colId: string) {
    return collection(this.firestore, colId);
  }

  getSingleContactRef(colId: string, docId: string) {
    return doc(this.firestore, colId, docId);
  }

  setContactObject(contact: any, id: string): IContact {

    const fixedColor = contact.color || generateRandomColor();

    if (!contact.color) {
      updateDoc(this.getSingleContactRef('contacts', id), { color: fixedColor });
    }

    return {
      id: id,
      name: contact.name || "",
      email: contact.email || '',
      phone: contact.phone || "",
      color: fixedColor,
    };
  }

  subContacts() {
    return onSnapshot(this.getContactsRef('contacts'), (contactList) => {
      this.contacts = [];
      contactList.forEach((contact) => {
        this.contacts.push(this.setContactObject(contact.data(), contact.id));
      })
    })
  }

  async addContactToFirebase(newContact: IContact): Promise<void> {
    const contactWithColor: IContact = { ...newContact, color: newContact.color || generateRandomColor() };
    try {
      const docRef = await addDoc(this.getContactsRef('contacts'), contactWithColor);
    } catch (err) {
      console.error(err);
    }
  }

  getCleanJson(changedContact: IContact) {
    return {
      name: changedContact.name,
      email: changedContact.email,
      phone: changedContact.phone,
      color: changedContact.color,
    };
  }

  async updateContactInFirebase(ContactId: string, changedContact: IContact) {
    if (ContactId) {
      await updateDoc(this.getSingleContactRef('contacts', ContactId), this.getCleanJson(changedContact)).catch(
        (err) => { console.error(err); }
      ).then();
    }
  }

  async deleteContactInFirebase(ContactId: string) {
    if (ContactId) {
      await deleteDoc(this.getSingleContactRef('contacts', ContactId)).catch(
        (err) => { console.error(err); }
      ).then();
    }
  }
  
  //Lifecycle Hooks eigentlich nicht in service.ts
  ngOnDestroy() {
    this.unsubContacts();
    this.unsubTasks();
  }
  
  //Task test
  setTaskObject(task: any, id: string): Task {
      return {
        id: id,
        title: task.title || "",
        description: task.description || "",
        category: task.category || "",
        priority: task.priority || "",
        status: task.status || "",
        duedate: task.duedate || 0,
        assignees: task.assignees || "",
        subtasks: task.subtasks || "",
      };
  }
  
  subTasks() {
    return onSnapshot(this.getContactsRef('tasks'), (taskList) => {
      this.tasks = [];
      taskList.forEach((task) => {
        this.tasks.push(this.setTaskObject(task.data(), task.id));
      })
    })
  }

}