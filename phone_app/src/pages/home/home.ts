import { Component, NgZone } from '@angular/core';
import { NavController } from 'ionic-angular';

import { BleServiceProvider, BLE_SERVICES } from '../../providers/ble-service';
import { Periph } from '../../classes/periph';
import { Color } from '../../classes/color';
import { Mode } from '../../classes/mode';

@Component({
    selector: 'page-home',
    templateUrl: 'home.html'
})
export class HomePage {
    tempo: number = 60;
    hue = 0;
    rgb = new Color(255, 255, 255);
    mode = "PULSE";
    isAuto: boolean = false;
    isControlling: boolean = false;
    private intervalAutomode_ID = -1;
    private intervalAutomode_s = 2;
    private NB_TAPS = 10;
    private taps_idx = 0;
    private taps = new Array(this.NB_TAPS);

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
        return Mode.list[this.mode].color_picker;
    }

    showTempo() {
        return Mode.list[this.mode].tempo_picker;
    }

    scanToggle() {
        if (this.bleService.isScanningNewPeriphs()) {
            console.log("Disconnecting all devices");
            this.bleService.disconnectAll();
            this.isControlling = false;
        }
        else {
            console.log("Connecting all new devices");
            this.bleService.connectAll();
            this.isControlling = true;
        }
    }

    modeChanged(mode) {
        console.log("Mode changed to " + mode);
        this.mode = mode;
        this.bleService.listConnectedPeriphs.forEach(periph => {
            this.changeMode(periph);
        });
    }

    setColor(in_color: Color) {
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
        var style = "4px solid #f4f4f4";

        if ((color.r == this.rgb.r) && (color.g == this.rgb.g) && (color.b == this.rgb.b)) {
            style = "4px solid grey";
        }

        return style;
    }

    isBrightnessSelected(brightness: number) {
        var style = "4px solid #f4f4f4";

        if (brightness == this.rgb.brightness) {
            style = "4px solid #0096ff";
        }

        return style;
    }

    automatic() {
        clearTimeout(this.intervalAutomode_ID);
        if (this.isAuto) {
            this.intervalAutomode_ID = setTimeout(() => {
                var modes = Object.keys(Mode.list);
                var idx_color = Math.round(Math.random() * (this.colorsPresetsList.length - 1));
                this.setColor(this.colorsPresetsList[idx_color]);
                var idx = 2 + Math.round(Math.random() * (modes.length - 1 - 2));
                this.modeChanged(modes[idx]);
                this.automatic();
            }, this.intervalAutomode_s * 1000);
        }
    }

    isModeSelected(mode: string) {
        var style = "4px solid #f4f4f4";

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

    tapTempo(){
        this.taps[this.taps_idx] = new Date().getTime();
        this.taps_idx = (this.taps_idx + 1) % this.NB_TAPS;
        var bpms = [];
        for (var i = 1; i < this.NB_TAPS; i++) {
            var delta = this.taps[i] - this.taps[i-1];
            if(delta > 0 && (new Date().getTime() - this.taps[i]) < 5000)
            {
                var bpm = (60 * 1000) / delta;
                bpms.push(bpm);
            }
        }
        if(bpms.length > 2)
        {
            var average = 0;
            bpms.forEach((bpm) => {
                average += bpm;
            })
            average = average / bpms.length;
            average = Math.round(average * 100) / 100.0;
            this.tempo = average;
            console.log(average);
        }
    }

    // Attribute a different color from colorsPresetsList[] to each Peripheral.
    // If there are Peripherals than preset colors, attributed colors are not unique.
    attributeRdmColors() {
        // Fisher-Yates Shuffle over [0..presets]
        let shuffled = Array.from(Array(this.colorsPresetsList.length - 1).keys());
        let cnt = shuffled.length;
        while (cnt > 0) {
            let index = Math.floor(Math.random() * cnt);
            cnt--;
            let temp = shuffled[cnt];
            shuffled[cnt] = shuffled[index];
            shuffled[index] = temp;
        }
        // Send each Peripheral a different color, starting from 0 and looping over.
        let colorIdx = 0;
        this.bleService.listConnectedPeriphs.forEach(periph => {
            this.bleService.writeBLE(periph,
                BLE_SERVICES.COLOR,
                String.fromCharCode(this.colorsPresetsList[colorIdx].r_final,
                                    this.colorsPresetsList[colorIdx].g_final,
                                    this.colorsPresetsList[colorIdx].b_final))
                .then(data => {
                    console.log("success", data);
                })
                .catch(err => {
                    console.log("error", err);
                })
                colorIdx++;
                colorIdx %= shuffled.length;
            }
        );
    }

    requestSettings(periph: Periph) {
        console.log("requestSettings");
        // check again that only one device is connected
        this.bleService.writeBLE(periph, BLE_SERVICES.DEV_SETTINGS, "?")
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
        this.bleService.writeBLE(periph, BLE_SERVICES.MODE, Mode.list[this.mode].val)
            .then(data => {
                console.log("success", data);
            })
            .catch(err => {
                console.log("error", err);
            })
    }
}
