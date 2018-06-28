import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { BleServiceProvider } from '../../providers/ble-service';

@Component({
  selector: 'page-peripherals',
  templateUrl: 'peripherals.html'
})
export class PeripheralsPage {

  constructor(public navCtrl: NavController,
              private bleService: BleServiceProvider) {

  }

  listConnectedPeriphs() {
    return this.bleService.listConnectedPeriphs;
  }
}
