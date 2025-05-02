import { AddContactComponent } from './add-contact/add-contact.component';
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, HostListener } from '@angular/core';
import { Contact } from '../../models/contact.model';
import { ContactService } from '../../services/contact.service';
import { EditContactsComponent } from './edit-contacts/edit-contacts.component';
import { IContact } from '../../interfaces/contact';
import { FirebaseService } from '../../services/firebase.service';
import { generateInitials } from '../../models/contact.model';

interface ContactGroup {
  letter: string;
  contacts: Contact[];
}

@Component({
  selector: 'app-contacts-list',
  standalone: true,
  imports: [CommonModule, AddContactComponent, EditContactsComponent],
  templateUrl: './contacts-list.component.html',
  styleUrls: ['./contacts-list.component.scss', './responsive.scss'],
})

export class ContactsListComponent implements OnInit {

  contacts: Contact[] = [];
  contactGroups: ContactGroup[] = [];
  showAddContactDialog: boolean = false;
  showEditContactDialog = false;
  selectedContact: Contact | null = null;
  showMobileOptions = false;
  showSuccessMsgDialog: boolean = false;
  showSuccessMsg: string = '';
  dialogState: 'show' | 'hide' = 'show';

  constructor(
    private contactService: ContactService,
    private firebaseService: FirebaseService,
  ) { }

  openAddContactDialog() {
    this.showAddContactDialog = true;
    document.body.style.overflow = 'hidden';
    document.querySelector('.contacts-container')!.classList.add('dialog-open');
  }

  closeAddContactDialog() {
    this.showAddContactDialog = false;
    document.body.style.overflow = '';
    this.showSuccessMsgDialog = false;
    document.querySelector('.contacts-container')!.classList.remove('dialog-open');
  }

  openSuccessDialog(message: string) {
    this.showSuccessMsg = message;
    this.dialogState = 'show';
    this.showSuccessMsgDialog = true;

    setTimeout(() => {
      this.dialogState = 'hide';
    }, 2000);

    setTimeout(() => {
      this.showSuccessMsgDialog = false;
    }, 2400);
  }

  selectContact(contact: Contact) {
    this.selectedContact = this.selectedContact === contact ? null : contact;
    this.showEditContactDialog = false;
    this.showMobileOptions = false;
  }

  openEditContactDialog(contact: Contact) {
    this.selectedContact = contact;
    this.showEditContactDialog = true;
    document.body.style.overflow = 'hidden';
  }

  closeEditContactDialog() {
    this.showEditContactDialog = false;
    document.body.style.overflow = '';
    this.showSuccessMsgDialog = false; 
  }

  saveNewContact(contactData: any) {
    contactData.initials = generateInitials(contactData.name);
    this.firebaseService.addContactToFirebase(contactData);

    this.contacts.push(contactData);
    this.groupContactsByFirstLetter();
    this.selectedContact = contactData;

    this.closeAddContactDialog();
    this.openSuccessDialog('You have added a new Contact');
  }

  editContact(contactData: IContact) {
    this.closeEditContactDialog();
    this.openSuccessDialog('You have updated the Contact');
  }

  deleteContact(contact: Contact) {
    this.firebaseService.deleteContactInFirebase(contact.id);
    this.selectedContact = null
    this.closeEditContactDialog();
    this.openSuccessDialog('The Contact is successfully deleted');
  }

  ngOnInit() {
    this.loadContacts();
  }

  loadContacts() {
    this.contactService.getContacts().subscribe(contacts => {
      this.contacts = contacts;
      this.groupContactsByFirstLetter();
    });
  }

  groupContactsByFirstLetter() {
    const groupsMap = new Map<string, Contact[]>();

    this.contacts.forEach(contact => {
      const firstLetter = contact.name.charAt(0).toUpperCase();
      if (!groupsMap.has(firstLetter)) {
        groupsMap.set(firstLetter, []);
      }
      groupsMap.get(firstLetter)?.push(contact);
    });

    this.contactGroups = Array.from(groupsMap.entries())
      .sort(([letterA], [letterB]) => letterA.localeCompare(letterB))
      .map(([letter, contacts]) => ({ letter, contacts }));
  }

  toggleMobileOptionsMenu() {
    this.showMobileOptions = !this.showMobileOptions;
  }

  goBack() {
    this.selectedContact = null;
    this.showEditContactDialog = false;
    this.showMobileOptions = false;
  }

  @HostListener('document:click', ['$event'])
  menuClick(event: MouseEvent) {
    const inside = (event.target as HTMLElement).closest('.options-wrapper');

    if (!inside) this.showMobileOptions = false;
  }

}
