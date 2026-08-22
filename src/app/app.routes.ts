import { Routes } from '@angular/router';

import { Layout } from './shared/layout/layout';
import { Dashboard } from './pages/dashboard/dashboard';
import { Clientes } from './pages/clientes/clientes';
import { OrdensServico } from './pages/ordens-servico/ordens-servico';
import { Financeiro } from './pages/financeiro/financeiro';
import { Vendas } from './pages/vendas/vendas';
import { Fiados } from './pages/fiados/fiados';
import { Login } from './pages/login/login';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    component: Login,
  },

  {
    path: '',
    component: Layout,
    canActivate: [authGuard],

    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        component: Dashboard,
      },
      {
        path: 'clientes',
        component: Clientes,
      },
      {
        path: 'ordens-servico',
        component: OrdensServico,
      },
      {
        path: 'vendas',
        component: Vendas,
      },
      {
        path: 'fiados',
        component: Fiados,
      },
      {
        path: 'financeiro',
        component: Financeiro,
      },
    ],
  },

  {
    path: '**',
    redirectTo: 'login',
  },
];