import { Component } from '@angular/core';

import { BleServiceProvider } from '../../providers/ble-service';

import { HomePage } from '../home/home';
import { PeripheralsPage } from '../peripherals/peripherals';
import { SingleUserPage } from '../single_user/single_user';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {

  tab1Root = HomePage;
  tab2Root = PeripheralsPage;
  tab3Root = SingleUserPage;

  constructor(private bleService: BleServiceProvider) {

  }
  
  listConnectedPeriphs() {
    return this.bleService.listConnectedPeriphs;
  }
}
