import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TabPeripheralsPage } from './tabPeripherals.page';
import { PeriphModalModule } from '../PeriphModal/periph-modal.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    PeriphModalModule,
    RouterModule.forChild([{ path: '', component: TabPeripheralsPage }])
  ],
  declarations: [
    TabPeripheralsPage
  ]
})
export class TabPeripheralsPageModule {}
