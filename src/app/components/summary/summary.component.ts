import { Component } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';



@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss'
})


export class SummaryComponent {
  contact = {};

  name = "";
  mail = "";
  phone = "";

  selectedContactIndex: number | null = null;
  contactId?: string = '';
  editedContact = {
    name: '',
    mail: '',
    phone: '',
  };


  constructor(public firebaseService: FirebaseService){

  }

  addContactFormToFirebase() {
    let contact = {
      name: this.name,
      mail: this.mail,
      phone: this.phone,
    }
    this.firebaseService.addContactToFirebase(contact);
  }

  saveEditedContactFormToFirebase(index: number) {
      this.selectedContactIndex = index;
      this.contactId = this.firebaseService.contacts[index].id;
      this.editedContact = {
        name: this.firebaseService.contacts[index].name,
        mail: this.firebaseService.contacts[index].mail,
        phone: this.firebaseService.contacts[index].phone,
      };
      if (this.contactId) {
      this.firebaseService.updateContactInFirebase(this.contactId, this.editedContact);
    }
  }

  deleteContactFromFirebase(index: number) {
    this.selectedContactIndex = index;
    this.contactId = this.firebaseService.contacts[index].id;
    if (this.contactId) {
    this.firebaseService.deleteContactInFirebase(this.contactId);
  }
}
 
  // Chat GPT
  getContactNameById(id: string): string {
    let contact = this.firebaseService.contacts.find(c => c.id === id);
    return contact ? contact.name : 'Unbekannt';
  }


}
