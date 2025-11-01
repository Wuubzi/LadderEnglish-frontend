import { Routes } from '@angular/router';
import { Login } from './Pages/Login/login';
import { alreadyAuthGuard } from './Guards/Already-Auth';
import { authGuard } from './Guards/Auth';
import { Dashboard } from './Pages/Dashboard/dashboard';

export const routes: Routes = [
    {
        path: 'login',
        title: 'Login',
        component: Login,
        canActivate: [alreadyAuthGuard]
    }, {
        path: '',
        title: 'Home',
        component: Dashboard,
        canActivate: [authGuard]
    }
];
