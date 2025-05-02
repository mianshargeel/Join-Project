import { Component, EventEmitter, inject, Output, Input } from '@angular/core';
import { IContact } from '../../../interfaces/contact';
import { FormsModule } from '@angular/forms';
import { Contact } from '../../../models/contact.model';
import { FirebaseService } from '../../../services/firebase.service';

@Component({
  selector: 'app-edit-contacts',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './edit-contacts.component.html',
  styleUrl: './edit-contacts.component.scss'
})
export class EditContactsComponent {
  @Input() contact!: Contact;
  @Output() close = new EventEmitter<void>(); 
  @Output() save = new EventEmitter<IContact>();
  @Output() delete = new EventEmitter<Contact>();
  
  constructor (private firebaseService: FirebaseService) {

  }

  onSave() {
    this.firebaseService.updateContactInFirebase(this.contact.id, this.contact);
    this.save.emit(this.contact);
  }

  onDelete() {
    this.firebaseService.deleteContactInFirebase(this.contact.id);
    this.delete.emit(this.contact);
  }

  onClose() {
    this.close.emit();
  }

  getInitials(fullName: string): string {
    if (!fullName) return '';
    const names = fullName.trim().split(' ');
    return names.length >= 2
      ? (names[0][0] + names[1][0]).toUpperCase()
      : names[0][0].toUpperCase();
  }

}
