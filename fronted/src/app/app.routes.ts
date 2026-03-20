import { Routes } from '@angular/router';
import { AdminComponent } from './features/admin/admin.component';
import { AgendaComponent } from './features/agenda/agenda.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { FavoritesComponent } from './features/favorites/favorites.component';
import { HomeComponent } from './features/home/home.component';
import { EventCreateComponent } from './features/owner/event-create/event-create.component';
import { PlaceCreateComponent } from './features/owner/place-create/place-create.component';
import { PlaceEditComponent } from './features/owner/place-edit/place-edit.component';
import { EventEditComponent } from './features/owner/event-edit/event-edit.component';
import { PlaceDetailComponent } from './features/place-detail/place-detail.component';
import { PlansComponent } from './features/plans/plans.component';
import { PlansSuccessComponent } from './features/plans/plans-success.component';
import { authGuard, roleGuard } from './core/guards/auth.guard';
import { ProfileComponent } from './features/profile/profile.component';
import { ShellComponent } from './shared/layout/shell.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'agenda', component: AgendaComponent },
      { path: 'places/:id', component: PlaceDetailComponent },
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'plans', component: PlansComponent },
      { path: 'plans/success', component: PlansSuccessComponent, canActivate: [authGuard] },
      { path: 'favorites', component: FavoritesComponent, canActivate: [authGuard] },
      { path: 'owner/place/new', component: PlaceCreateComponent, canActivate: [roleGuard('OWNER', 'ADMIN')] },
      { path: 'owner/place/edit/:id', component: PlaceEditComponent, canActivate: [roleGuard('OWNER', 'ADMIN')] },
      { path: 'owner/event/new', component: EventCreateComponent, canActivate: [roleGuard('OWNER', 'ADMIN')] },
      { path: 'owner/event/edit/:id', component: EventEditComponent, canActivate: [roleGuard('OWNER', 'ADMIN')] },
      { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
      { path: 'admin', component: AdminComponent, canActivate: [roleGuard('ADMIN')] },
    ],
  },
  { path: '**', redirectTo: '' },
];

