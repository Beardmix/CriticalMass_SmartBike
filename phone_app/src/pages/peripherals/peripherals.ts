import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { PopoverController } from 'ionic-angular';
import { PopoverSettings } from './popover-settings';

import { BleServiceProvider, BLE_SERVICES } from '../../providers/ble-service';
import { Periph } from '../../classes/periph';

@Component({
    selector: 'page-peripherals',
    templateUrl: 'peripherals.html'
})
export class PeripheralsPage {
    isScanning: any = false;

    constructor(public navCtrl: NavController,
        private popoverCtrl: PopoverController,
        private bleService: BleServiceProvider) {
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
        if (this.bleService.isScanningNewPeriphs()) {
            console.log("Rescanning all new devices");
            this.bleService.connectAll();
        }
    }

    listConnectedPeriphs() {
        return this.bleService.listConnectedPeriphs;
    }


    setSettings(periph: Periph) {
        console.log("changeSettings");
        // check again that only one device is connected
        this.bleService.writeBLE(periph, BLE_SERVICES.DEV_SETTINGS,
            String.fromCharCode(periph.num_pixels) + ";" + periph.name)
            .then(data => {
                console.log("success", data);
            })
            .catch(err => {
                console.log("error", err);
            })
    }

    openPopoverSettings(clickEvent, periph: Periph) {
        let popover = this.popoverCtrl.create(PopoverSettings, { "periph": periph });
        popover.present({
            ev: clickEvent
        });
        popover.onDidDismiss((periph: Periph) => {
            if (periph != null) {
                this.setSettings(periph);
            }
        });
    }
}
