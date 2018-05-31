import { Component, NgZone } from '@angular/core';
import { NavController } from 'ionic-angular';

import { BLE } from '@ionic-native/ble';
import { BleServiceProvider } from '../../providers/ble-service';
import { Periph } from '../../classes/periph';

var LEDMode =
    {
        OFF_MODE: '0',
        ON_MODE: '1',
        FLASH_MODE: '2',
        PULSE_MODE: '3',
        HUE_FLOW: '4',
        THEATER_CHASE_MODE: '5'
    };

const SERVICE_COLOR = 'C';
const SERVICE_MODE = 'M';
const SERVICE_TEMPO = 'T';

@Component({
    selector: 'page-home',
    templateUrl: 'home.html'
})
export class HomePage {
    displayConnectedPeriphs: boolean = false; // Display the list of connected devices with their properties.
    tempo: number = 60;
    hue = 0;
    brightness = 100;
    saturation = 0;
    hexcolor = "rgb(255,255,255)";
    r = 255;
    g = 255;
    b = 255;
    mode = LEDMode.OFF_MODE;


    constructor(public navCtrl: NavController,
        private bleService: BleServiceProvider,
        private zone: NgZone, // UI updated when wrapped up in this.zone.run().
    ) {
        this.bleService.newPeriphObs.subscribe(
            value => {
                this.callbackNewPeriph(value);
            },
            error => {
                console.log('Observer: onError: ', error)
            },
            () => {
                console.log('Observer: onCompleted');
            }
        );
    }

    listConnectedPeriphs() {
        return this.bleService.listConnectedPeriphs;
    }

    callbackNewPeriph(periph: any) {
        this.changeTempo(periph);
        this.changeColor(periph);
        this.changeMode(periph);

        // To refresh the UI
        this.zone.run(() => {
            this.displayConnectedPeriphs = this.displayConnectedPeriphs;
        });
    }

    connectAll() {
        console.log("Connecting all new devices");
        this.bleService.connectAll();
    }

    disconnectAll() {
        console.log("Disconnecting all devices");
        this.bleService.disconnectAll();
    }

    switchOff() {
        console.log("switchOff");
        this.mode = LEDMode.OFF_MODE;
        this.bleService.listConnectedPeriphs.forEach(periph => {
            this.changeMode(periph);
        });
    }
    switchOn() {
        console.log("switchOn");
        this.mode = LEDMode.ON_MODE;
        this.bleService.listConnectedPeriphs.forEach(periph => {
            this.changeMode(periph);
        });
    }
    flash() {
        console.log("flash");
        this.mode = LEDMode.FLASH_MODE;
        this.bleService.listConnectedPeriphs.forEach(periph => {
            this.changeMode(periph);
        });
    }
    pulse() {
        console.log("pulse");
        this.mode = LEDMode.PULSE_MODE;
        this.bleService.listConnectedPeriphs.forEach(periph => {
            this.changeMode(periph);
        });
    }
    hueFlow() {
        console.log("hueFlow");
        this.mode = LEDMode.HUE_FLOW;
        this.bleService.listConnectedPeriphs.forEach(periph => {
            this.changeMode(periph);
        });
    }
    theaterChase() {
        console.log("theaterChase");
        this.mode = LEDMode.THEATER_CHASE_MODE;
        this.bleService.listConnectedPeriphs.forEach(periph => {
            this.changeMode(periph);
        });
    }
    setColor() {
        var rgb = this.hue2rgb(this.hue);
        var r = rgb[0];
        var g = rgb[1];
        var b = rgb[2];
        var max_val = Math.max(r, g, b);
        r = r + (max_val - r) * (100 - this.saturation) / 100.0;
        g = g + (max_val - g) * (100 - this.saturation) / 100.0;
        b = b + (max_val - b) * (100 - this.saturation) / 100.0;
        r = r * this.brightness / 100.0;
        g = g * this.brightness / 100.0;
        b = b * this.brightness / 100.0;
        this.r = Math.round(r * 255);
        this.g = Math.round(g * 255);
        this.b = Math.round(b * 255);
        console.log("changeColor", this.r, this.g, this.b);

        this.bleService.listConnectedPeriphs.forEach(periph => {
            this.changeColor(periph);
        });
        this.hexcolor = "rgb(" + this.r + "," + this.g + "," + this.b + ")";
    }
    private hue2rgb(h) {
        var r, g, b;
        h = h / 60.0;
        var t = h - Math.floor(h);
        if (h < 1) {
            r = 1;
            g = t;
            b = 0;
        }
        else if (h < 2) {
            r = 1 - t;
            g = 1;
            b = 0;
        }
        else if (h < 3) {
            r = 0;
            g = 1;
            b = t;
        }
        else if (h < 4) {
            r = 0;
            g = 1 - t;
            b = 1;
        }
        else if (h < 5) {
            r = t;
            g = 0;
            b = 1;
        }
        else if (h < 6) {
            r = 1;
            g = 0;
            b = 1 - t;
        }
        else {
            r = 1;
            g = 0;
            b = 0;
        }
        return [r, g, b];
    }

    setTempo() {
        console.log("changeTempo", this.tempo);
        this.bleService.listConnectedPeriphs.forEach(periph => {
            this.changeTempo(periph);
        });
    }

    private changeTempo(periph) {
        this.bleService.writeBLE(periph, SERVICE_TEMPO, String.fromCharCode(this.tempo))
            .then(data => {
                console.log("success", data);
            })
            .catch(err => {
                console.log("error", err);
            })
    }

    private changeColor(periph) {
        this.bleService.writeBLE(periph, SERVICE_COLOR, String.fromCharCode(this.r, this.g, this.b))
            .then(data => {
                console.log("success", data);
            })
            .catch(err => {
                console.log("error", err);
            })
    }

    private changeMode(periph) {
        this.bleService.writeBLE(periph, SERVICE_MODE, this.mode)
            .then(data => {
                console.log("success", data);
            })
            .catch(err => {
                console.log("error", err);
            })
    }

    /*
    *   Buttons actions.
    */
    public displayConnectedPeriphsClick() {
        this.displayConnectedPeriphs = !this.displayConnectedPeriphs;
    }
}
