import { Routes } from '@angular/router';

import { HomeComponent } from './components/home/home.component';
import { LegalNoticeComponent } from './legal/legal-notice/legal-notice.component';
import { PrivacyPolicyComponent } from './legal/privacy-policy/privacy-policy.component';
import { SummaryComponent } from './components/summary/summary.component';
import { AddTaskComponent } from './components/add-task/add-task.component';
import { BoardComponent } from './components/board/board.component';
import { HelpComponent } from './components/help/help.component';

export const routes: Routes = [
  { path: 'summary', component: SummaryComponent },
  { path: 'add-task', component: AddTaskComponent },
  { path: 'board', component: BoardComponent },
  { path: 'contacts', component: HomeComponent },
  { path: 'legal-notice', component: LegalNoticeComponent },
  { path: 'privacy-policy', component: PrivacyPolicyComponent },
  { path: 'help', component: HelpComponent },
];
