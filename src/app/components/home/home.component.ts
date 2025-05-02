import { Component } from '@angular/core';
import { ContactsListComponent } from '../contacts-list/contacts-list.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ContactsListComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})

export class HomeComponent {

}
