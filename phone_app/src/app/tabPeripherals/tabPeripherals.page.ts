import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { OverlayEventDetail } from '@ionic/core';

import { PeriphModal } from '../PeriphModal/periph-modal.component';
import { BleService, BLE_SERVICES } from '../BleService/ble.service';
import { PeriphClass } from '../PeriphClass/periph-class';

@Component({
  selector: 'app-tabPeripherals',
  templateUrl: 'tabPeripherals.page.html',
  styleUrls: ['tabPeripherals.page.scss']
})
export class TabPeripheralsPage {
  isScanning: any = false;
  isControlling: boolean = false;

  constructor(private modalController: ModalController,
              private bleService: BleService) {
    this.bleService.scanObs.subscribe(
      value => {
        this.isScanning = value;
      },
      error => {
        console.log('Observer: onError: ', error)
      },
      () => {
        console.log('Observer: onCompleted');
      }
    );
  }

  ionViewDidEnter() {
    this.bleService.startScan();
  }

  ionViewWillLeave() {
    this.bleService.stopScan();
  }

  connect(periph: PeriphClass) {
    this.bleService.connect(periph)
  }

  disconnect(periph: PeriphClass) {
    this.bleService.disconnect(periph)
  }

  listConnectedPeriphs() {
    return this.bleService.listConnectedPeriphs;
  }

  listAvailablePeriphs() {
    return this.bleService.listAvailablePeriphs;
  }

  isOld(periph: PeriphClass) {
    return ((new Date()).getTime() - periph.last_scan) > this.bleService.intervalScanNewDevices_ms * 2.2;
  }


  setSettings(periph: PeriphClass) {
    console.log("setSettings");
    // todo: ? check again that only one device is connected
    this.bleService.writeBLE(periph, BLE_SERVICES.DEV_SETTINGS, String("="))
      .then(data => {
        console.log("success", data);
      })
      .catch(err => {
        console.log("error", err);
      })
  }

  async openPeriphModal(clickEvent, periph: PeriphClass) {
    let modal = await this.modalController.create({
      component: PeriphModal,
      componentProps: { periph: periph },
      backdropDismiss: false
    });
    
    modal.onDidDismiss().then((modalData: OverlayEventDetail) => {
      if ((modalData != null) && (modalData.data)) {
        this.setSettings(modalData.data.periph);
      }
    });

    await modal.present();
  }
}
