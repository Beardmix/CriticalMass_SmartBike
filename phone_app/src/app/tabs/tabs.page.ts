import { Component } from '@angular/core';

import { BleService } from '../BleService/ble.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss']
})
export class TabsPage {

  constructor(private bleService: BleService) {
  }
  
  listConnectedPeriphs() {
    return this.bleService.listConnectedPeriphs;
  }


}
