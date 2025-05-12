import { Routes } from '@angular/router';

import { HomeComponent } from './components/home/home.component';
import { LegalNoticeComponent } from './legal/legal-notice/legal-notice.component';
import { PrivacyPolicyComponent } from './legal/privacy-policy/privacy-policy.component';
import { SummaryComponent } from './components/summary/summary.component';
import { AddTaskComponent } from './components/add-task/add-task.component';
import { BoardComponent } from './components/board/board.component';
import { HelpComponent } from './components/help/help.component';

import { authGuard } from './guards/auth.guard'; // import your guard

export const routes: Routes = [
  { path: '', redirectTo: 'sign-in', pathMatch: 'full' },

  // Lazy-load standalone components
  { path: 'sign-in', loadComponent: () => import('./components/sign-in/sign-in.component').then(m => m.SignInComponent) },
  { path: 'sign-up', loadComponent: () => import('./components/sign-up/sign-up.component').then(m => m.SignUpComponent) },

  // Protected routes
  { path: 'summary', component: SummaryComponent, canActivate: [authGuard] },
  { path: 'add-task', component: AddTaskComponent, canActivate: [authGuard] },
  { path: 'board', component: BoardComponent, canActivate: [authGuard] },
  { 
    path: 'contacts', 
    loadComponent: () => import('./components/contacts-list/contacts-list.component').then(m => m.ContactsListComponent), 
    canActivate: [authGuard] 
  },

  // Legal/help routes (usually public)
  { path: 'legal-notice', component: LegalNoticeComponent },
  { path: 'privacy-policy', component: PrivacyPolicyComponent },
  { path: 'help', component: HelpComponent },

  // Wildcard fallback
  { path: '**', redirectTo: 'sign-in' }
];
