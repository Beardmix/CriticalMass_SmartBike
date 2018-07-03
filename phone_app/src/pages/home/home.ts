import { Component, NgZone } from '@angular/core';
import { NavController } from 'ionic-angular';

import { BleServiceProvider, BLE_SERVICES } from '../../providers/ble-service';
import { Periph } from '../../classes/periph';

var LED_MODE =
{
    "OFF": { val: '0', color_picker: false, tempo_picker: false },
    "ON": { val: '1', color_picker: true, tempo_picker: false },
    "FLASH": { val: '2', color_picker: true, tempo_picker: true },
    "PULSE": { val: '3', color_picker: true, tempo_picker: true },
    "HUE_FLOW": { val: '4', color_picker: false, tempo_picker: true },
    "THEATER_CHASE": { val: '5', color_picker: true, tempo_picker: true },
    "PILE_UP": { val: '6', color_picker: true, tempo_picker: true }
};


class Color {
    r = 0;
    g = 0;
    b = 0;
    brightness = 100;
    saturation = 100;
    r_final = 0;
    g_final = 0;
    b_final = 0;

    constructor(r, g, b) {
        this.setRGB(r, g, b);
    }

    setRGB(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.computeFinalRGB();
    }

    setBrightness(brightness) {
        this.brightness = brightness;
        this.computeFinalRGB();
    }

    computeFinalRGB() {
        var r = this.r;
        var g = this.g;
        var b = this.b;
        var max_val = Math.max(r, g, b);
        r = r + (max_val - r) * (100 - this.saturation) / 100.0;
        g = g + (max_val - g) * (100 - this.saturation) / 100.0;
        b = b + (max_val - b) * (100 - this.saturation) / 100.0;
        r = r * this.brightness / 100.0;
        g = g * this.brightness / 100.0;
        b = b * this.brightness / 100.0;
        this.r_final = Math.round(r);
        this.g_final = Math.round(g);
        this.b_final = Math.round(b);
        console.log("changeColor", this.r_final, this.g_final, this.b_final);
    }

    getRGBstring() {
        return "rgb(" + String(this.r_final) + "," + String(this.g_final) + "," + String(this.b_final) + ")";
    }
}

@Component({
    selector: 'page-home',
    templateUrl: 'home.html'
})
export class HomePage {
    tempo: number = 60;
    hue = 0;
    rgb = new Color(255, 255, 255);
    mode = "PULSE";
    isAuto:boolean = false;
    private intervalAutomode_ID = -1;
    private intervalAutomode_ms = 20000;

    public colorsPresetsList: Color[] = [
        new Color(255, 0, 0), // red
        new Color(0, 255, 0), // green
        new Color(0, 0, 255), // blue
        new Color(255, 255, 255), // white
        new Color(255, 128, 0), // orange
        new Color(255, 255, 0), // yellow
        new Color(51, 153, 255), // lightblue
        new Color(255, 0, 255), // fuschia
        new Color(0, 255, 255) // aqua
    ];

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
        this.requestSettings(periph);
    }

    showColorPicker() {
        return LED_MODE[this.mode].color_picker;
    }

    showTempo() {
        return LED_MODE[this.mode].tempo_picker;
    }

    scanToggle(item)
    {
        if(this.bleService.isScanningNewPeriphs())
        {
            console.log("Disconnecting all devices");
            this.bleService.disconnectAll();
        }
        else
        {
            console.log("Connecting all new devices");
            this.bleService.connectAll();
        }
    }

    modeChanged(mode) {
        console.log("Mode changed to " + mode);
        this.mode = mode;
        this.bleService.listConnectedPeriphs.forEach(periph => {
            this.changeMode(periph);
        });
    }

    setRGB(r, g, b) {
        this.rgb.setRGB(r, g, b);

        this.bleService.listConnectedPeriphs.forEach(periph => {
            this.changeColor(periph);
        });
    }
    setColor(in_color:Color) {
        this.rgb.setRGB(in_color.r, in_color.g, in_color.b);

        this.bleService.listConnectedPeriphs.forEach(periph => {
            this.changeColor(periph);
        });
    }

    setBrightness(brightness) {
        this.rgb.setBrightness(brightness);

        this.bleService.listConnectedPeriphs.forEach(periph => {
            this.changeColor(periph);
        });
    }

    isColorSelected(color: Color) {
        var style = "4px solid white";

        if ((color.r == this.rgb.r) && (color.g == this.rgb.g) && (color.b == this.rgb.b)) {
            style = "4px solid grey";
        }

        return style;
    }

    isBrightnessSelected(brightness: number) {
        var style = "4px solid white";

        if (brightness == this.rgb.brightness) {
            style = "4px solid #0096ff";
        }

        return style;
    }
    automatic() {
        if (this.isAuto)
        {
            console.log("automatic");
            if (this.intervalAutomode_ID == -1) {
                this.intervalAutomode_ID = setInterval(() => {
                    var modes = Object.keys(LED_MODE);
                    var idx_color = Math.floor(Math.random() * this.colorsPresetsList.length);
                    this.setColor(this.colorsPresetsList[idx_color]);
                    var idx = 2 + Math.floor(Math.random() * (modes.length - 2));
                    this.modeChanged(modes[idx]);
                }, this.intervalAutomode_ms);
            }
        }
        else
        {
            clearTimeout(this.intervalAutomode_ID);
            this.intervalAutomode_ID = -1;
        }

    }

    isModeSelected(mode: string) {
        var style = "4px solid white";

        if (mode == this.mode) {
            style = "4px solid #0096ff";
        }

        return style;
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

    requestSettings(periph: Periph) {
        console.log("requestSettings");
        // check again that only one device is connected
        this.bleService.writeBLE(periph, BLE_SERVICES.DEV_SETTINGS, "")
            .then(data => {
                console.log("success", data);
            })
            .catch(err => {
                console.log("error", err);
            })
    }

    private changeTempo(periph) {
        this.bleService.writeBLE(periph, BLE_SERVICES.TEMPO, String.fromCharCode(this.tempo))
            .then(data => {
                console.log("success", data);
            })
            .catch(err => {
                console.log("error", err);
            })
    }

    private changeColor(periph) {
        this.bleService.writeBLE(periph,
            BLE_SERVICES.COLOR,
            String.fromCharCode(this.rgb.r_final, this.rgb.g_final, this.rgb.b_final))
            .then(data => {
                console.log("success", data);
            })
            .catch(err => {
                console.log("error", err);
            })
    }

    private changeMode(periph) {
        this.bleService.writeBLE(periph, BLE_SERVICES.MODE, LED_MODE[this.mode].val)
            .then(data => {
                console.log("success", data);
            })
            .catch(err => {
                console.log("error", err);
            })
    }
}
