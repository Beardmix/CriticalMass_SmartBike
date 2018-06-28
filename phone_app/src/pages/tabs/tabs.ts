import { Component } from '@angular/core';

import { BleServiceProvider } from '../../providers/ble-service';

import { HomePage } from '../home/home';
import { PeripheralsPage } from '../peripherals/peripherals';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {

  tab1Root = HomePage;
  tab2Root = PeripheralsPage;

  constructor(private bleService: BleServiceProvider) {

  }
  
  listConnectedPeriphs() {
    return this.bleService.listConnectedPeriphs;
  }
}
