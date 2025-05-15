import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { generateInitials } from '../../models/contact.model';
import { ElementRef, HostListener, ViewChild } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive], 
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  menuOpen: boolean = false;
  authServics = inject(AuthService);
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  initials: string = '';
  @ViewChild('menuRef') menuRef!: ElementRef;
  menuHover: boolean = false;


  constructor(private router: Router) { }
  
  ngOnInit() {
    onAuthStateChanged(this.auth, async (user: User | null) => {
      if (!user) return;

      const uid = user.uid;

      // Check Firestore for user contact
      const docRef = doc(this.firestore, 'contacts', uid);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        this.initials = generateInitials(data?.['name'] ?? '');
      } else if (user.isAnonymous) {
        this.initials = 'GU';
      } else {
        this.initials = '??';
      }
    });
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  navigateTo(route: string) {
    this.menuOpen = false;
    this.router.navigate([route]);
  }

  logout() {
    this.authServics.logout();
    console.log('You are Successfully Logout!');
    
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInside = this.menuRef?.nativeElement.contains(event.target);
    const clickedButton = (event.target as HTMLElement).closest('.btnHamburgerMenu');

    if (!clickedInside && !clickedButton) {
      this.menuOpen = false;
    }
  }
  
}
