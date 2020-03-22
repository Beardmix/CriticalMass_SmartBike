import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'tabHome',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('../tabHome/tabHome.module').then(m => m.TabHomePageModule)
          }
        ]
      },
      {
        path: 'tabPeripherals',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('../tabPeripherals/tabPeripherals.module').then(m => m.TabPeripheralsPageModule)
          }
        ]
      },
      {
        path: '',
        redirectTo: '/tabs/tabHome',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/tabs/tabHome',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TabsPageRoutingModule {}
