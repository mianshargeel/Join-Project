import { Injectable } from '@angular/core';
import { Contact } from '../models/contact.model';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})

export abstract class ContactService {
    abstract getContacts(): Observable<Contact[]>;
    abstract addContact(contact: Omit<Contact, 'id' | 'initials' | 'color'>): Observable<Contact>;
}