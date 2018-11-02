import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { BleServiceProvider, BLE_SERVICES } from '../../providers/ble-service';
import { Periph } from '../../classes/periph';
import { Color } from '../../classes/color';
import { Mode } from '../../classes/mode';


import * as firebase from 'Firebase';

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
    isReversed = false; // Strip logical direction.
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
        private bleService: BleServiceProvider
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
        var starCountRef = firebase.database().ref('events/');
        var ref = this;
        starCountRef.on('child_added', function (snapshot) {
            let value = snapshot.val();
            console.log(value); 
            ref.cloudEvent(value); 
        });
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

    cloudEvent(event) {
        var now = new Date().getTime();
        var delay_ms = event.time - now;
        
        if (delay_ms < 0) {
            delay_ms = 0; // it means that we already missed the event date, but we sync with the last received.
        }

        setTimeout(() => {
            this.bleService.listConnectedPeriphs.forEach(periph => {
                this.bleService.writeBLE(periph, BLE_SERVICES.MODE, Mode.list[event.mode].val)
                    .then(data => {
                        console.log("success", data);
                    })
                    .catch(err => {
                        console.log("error", err);
                    })
            });

            this.bleService.listConnectedPeriphs.forEach(periph => {
                this.bleService.writeBLE(periph,
                    BLE_SERVICES.COLOR,
                    String.fromCharCode(event.rgb[0], event.rgb[1], event.rgb[2]))
                    .then(data => {
                        console.log("success", data);
                    })
                    .catch(err => {
                        console.log("error", err);
                    })
            });

            this.bleService.listConnectedPeriphs.forEach(periph => {
                this.bleService.writeBLE(periph, BLE_SERVICES.TEMPO, String.fromCharCode(event.tempo))
                    .then(data => {
                        console.log("success", data);
                    })
                    .catch(err => {
                        console.log("error", err);
                    })
            });
        }, delay_ms);
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

    sendEvent() {
        var time = new Date().getTime();
        time = time + 500;  // offset of 500ms for synchronisation

        var json = {
            "time": time, // ISO format: "2018-09-16T09:48:16.388Z"
            "mode": this.mode,
            "rgb": [this.rgb.r_final, this.rgb.g_final, this.rgb.b_final],
            "tempo": this.tempo
        }
        console.log(json);

        let newInfo = firebase.database().ref('events/').push();
        newInfo.set(json, function (error) {
            if (error) {
                console.error(error);
            }
        });
    }

    modeChanged(mode) {
        console.log("Mode changed to " + mode);
        this.mode = mode;
        
        this.sendEvent();
        // this.bleService.listConnectedPeriphs.forEach(periph => {
        //     this.changeMode(periph);
        // });
    }

    setColor(in_color: Color) {
        this.rgb.setRGB(in_color.r, in_color.g, in_color.b);

        this.sendEvent();

        // this.bleService.listConnectedPeriphs.forEach(periph => {
        //     this.changeColor(periph);
        // });
    }

    setBrightness(brightness) {
        this.rgb.setBrightness(brightness);

        this.sendEvent();
        
        // this.bleService.listConnectedPeriphs.forEach(periph => {
        //     this.changeColor(periph);
        // });
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
                var modes = Object.keys(Object.keys(Mode.list).reduce(function (filtered, key) {
                    if (Mode.list[key].auto_picker == true) filtered[key] = Mode.list[key];
                    return filtered;
                }, {}));
                var idx_color = Math.round(Math.random() * (this.colorsPresetsList.length - 1));
                this.setColor(this.colorsPresetsList[idx_color]);
                var idx = Math.round(Math.random() * (modes.length - 1));
                this.modeChanged(modes[idx]);
                this.automatic();
            }, this.intervalAutomode_s * 1000);
        }
    }

    // Reverse the strip logical direction.
    reverse() {
        console.log("Strip reversed for: " + this.isReversed.toString());
        this.bleService.listConnectedPeriphs.forEach(periph => {
            this.bleService.writeBLE(periph, BLE_SERVICES.REVERSE, this.isReversed ? "1" : "0")
            .then(data => {
                console.log("Strip direction reversed.", data);
            })
            .catch(err => {
                console.log("! Strip direction could not be reversed.", err);
            })
        });
    }

    isModeSelected(mode: string) {
        var style = "4px solid #f4f4f4";

        if (mode == this.mode) {
            style = "4px solid #0096ff";
        }

        return style;
    }
    
    /*
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
    */

    setTempo() {
        console.log("changeTempo", this.tempo);
        this.bleService.listConnectedPeriphs.forEach(periph => {
            this.changeTempo(periph);
        });
    }

    tapTempo() {
        var current_millis = (new Date()).getTime();
        this.bleService.time_offset_cue = current_millis;
        this.taps[this.taps_idx] = current_millis;
        this.taps_idx = (this.taps_idx + 1) % this.NB_TAPS;
        var bpms = [];
        for (var i = 0; i < this.NB_TAPS; i++) {
            var prev_tap = this.taps[(i > 0) ? (i - 1) : (this.NB_TAPS - 1)];
            var delta_ms = this.taps[i] - prev_tap;
            if (delta_ms > 0 && (current_millis - this.taps[i]) < 60000) {
                var beats_elapsed = Math.round(this.tempo * delta_ms / (60 * 1000));
                var click_predicted_offset_ms = prev_tap + beats_elapsed * (60 * 1000) / this.tempo;
                var error_rel = (click_predicted_offset_ms - this.taps[i]) / delta_ms;
                var bpm = (error_rel + 1) * this.tempo;
                bpms.push(bpm);
            }
        }
        if (bpms.length >= 3) {
            var average = 0;
            bpms.forEach((bpm) => {
                average += bpm;
            })
            average = average / bpms.length;
            average = Math.round(average);
            this.tempo = average;
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
                String.fromCharCode(this.colorsPresetsList[shuffled[colorIdx]].r_final,
                                    this.colorsPresetsList[shuffled[colorIdx]].g_final,
                                    this.colorsPresetsList[shuffled[colorIdx]].b_final))
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
