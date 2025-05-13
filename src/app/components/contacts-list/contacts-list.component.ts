import { AddContactComponent } from './add-contact/add-contact.component';
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, HostListener } from '@angular/core';
import { Contact } from '../../models/contact.model';
import { ContactService } from '../../services/contact.service';
import { EditContactsComponent } from './edit-contacts/edit-contacts.component';
import { IContact } from '../../interfaces/contact';
import { FirebaseService } from '../../services/firebase.service';
import { generateInitials, generateRandomColor } from '../../models/contact.model';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';


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
  auth: Auth = inject(Auth);
  firestore: Firestore = inject(Firestore);

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
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.loadContacts(); // ✅ only load when user is known
      }
    });
  }

  loadContacts() {
    const contactsRef = collection(this.firestore, 'contacts');
    // console.log('collectionRef type:', contactsRef.constructor.name);
  
    collectionData(contactsRef, { idField: 'id' }).subscribe((data: any[]) => {
      // console.log('FIRESTORE WORKS:', data);
  
      this.contacts = data.map(c => ({
        ...c,
        name: c.name ?? 'Unnamed',
        mail: c.mail ?? '',
        phone: c.phone ?? '',
        color: c.color ?? generateRandomColor(),
        initials: c.initials ?? generateInitials(c.name ?? 'U'),
      }));
  
      this.groupContactsByFirstLetter(); // if you're grouping
    });
  }
  
  
  groupContactsByFirstLetter() {
    const groupsMap = new Map<string, Contact[]>();
  
    this.contacts.forEach(contact => {
      if (!contact.name || typeof contact.name !== 'string') return; //  skip invalid
  
      const firstLetter = contact.name.charAt(0).toUpperCase();
  
      if (!groupsMap.has(firstLetter)) {
        groupsMap.set(firstLetter, []);
      }
  
      groupsMap.get(firstLetter)?.push(contact);
    });
  
    this.contactGroups = Array.from(groupsMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
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
