import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PeriphModal }from './periph-modal.component';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule
  ],
  declarations: [
    PeriphModal
  ],
  entryComponents: [
    PeriphModal
  ]
})
export class PeriphModalModule {}
