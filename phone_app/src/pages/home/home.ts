import { Component, NgZone } from '@angular/core';
import { NavController } from 'ionic-angular';

import { BLE } from '@ionic-native/ble';

const SERVICE_UUID_UART = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const CHARAC_UUID_UART_RX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
const CHARAC_UUID_UART_TX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';


const CHAR_START = '#'
const CHAR_END = '!'
const SERVICE_COLOR = 'C';
const SERVICE_MODE = 'M';
const SERVICE_TEMPO = 'T';
const SERVICE_TIME_SERVER = 'S';
const SERVICE_TIME_SERVER_ADJUST = 'A';
const SERVICE_TIME_SERVER_REQUEST = 'R';

var LEDMode = 
{
    OFF_MODE: '0',
    ON_MODE: '1',
    FLASH_MODE: '2',
    PULSE_MODE: '3',
    HUE_FLOW: '4',
    THEATER_CHASE_MODE: '5'
};

class Periph {
    name: string = "";
    id: string = "";
    globalTimerModulusMs;

    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
}

@Component({
    selector: 'page-home',
    templateUrl: 'home.html'
})
export class HomePage {

    listPeriphs: Periph[] = [];
    listConnectedPeriphs: Periph[] = [];
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
    intervalScanNewDevices_ID = -1;
    intervalScanNewDevices_ms = 20000;
    intervalSendServerTime_ID = -1;
    intervalSendServerTime_ms = 4000;


    constructor(public navCtrl: NavController,
        private ble: BLE,
        private zone: NgZone, // UI updated when wrapped up in this.zone.run().
    ) {
        this.scan();
    }

    scan() {
        this.listPeriphs = [];
        this.ble.scan([], 5000).subscribe(
            periph => {
                if (periph.name) {
                    if (periph.name.indexOf("MyFahrrad") >= 0) // searches for MyFahrrad in the name of the device
                    {
                        this.listPeriphs.push(new Periph(periph.id, periph.name));
                    }
                }
            },
            error => {
                console.log("scan_error", error);
            },
            () => {
                console.log("scan_finished");
            });
    }

    // connects to all devices that are compatible
    private scanAndConnectAll() {
                this.sendServerTime();
                this.ble.scan([], 5000).subscribe(
                    periph => {
                        if (periph.name) {
                            if (periph.name.indexOf("MyFahrrad") >= 0) // searches for MyFahrrad in the name of the device
                            {
                                console.log("scan", periph);
                                this.connect(new Periph(periph.id, periph.name));
                            }
                        }
                    },
                    error => {
                        console.log("scan_error", error);
                    },
                    () => {
                        console.log("scan_finished");
                    });
    }

    connectAll() {
        console.log("Scanning new devices");
        this.scanAndConnectAll();
        if (this.intervalScanNewDevices_ID == -1) {
            this.intervalScanNewDevices_ID = setInterval(() => {
                this.scanAndConnectAll();
            }, this.intervalScanNewDevices_ms);
        }
    }

    disconnectAll() {
        // remove interval to stop connecting to new devices
        if (this.intervalScanNewDevices_ID != -1) {
            console.log("Disconnecting all devices");
            clearTimeout(this.intervalScanNewDevices_ID);
            this.intervalScanNewDevices_ID = -1;
        }
        // remove interval to save battery
        if (this.intervalSendServerTime_ID != -1) {
            clearTimeout(this.intervalSendServerTime_ID);
            this.intervalSendServerTime_ID = -1;
        }
        this.listConnectedPeriphs.forEach((periph, idx) => {
            this.ble.disconnect(periph.id)
                .then(() => {
                    this.removePeriphFromList(this.listConnectedPeriphs, periph);
                })
                .catch(() => {
                    this.removePeriphFromList(this.listConnectedPeriphs, periph);
                })
        });
    }

    connect(periph: Periph) {
        this.ble.connect(periph.id).subscribe(
            data => {
                console.log("connected", data);
                this.zone.run(() => {
                    this.listConnectedPeriphs.push(periph);
                });
                this.startNotificationUART(periph);
                this.removePeriphFromList(this.listPeriphs, periph);
                this.changeTempo(periph);
                this.changeColor(periph);
                this.changeMode(periph);
            },
            error => {
                console.log("error", error);
            },
            () => {
                console.log("finished");
            });
    }

    startNotificationUART(periph: Periph) {
        this.ble.startNotification(periph.id, SERVICE_UUID_UART, CHARAC_UUID_UART_RX)
            .subscribe((data) => {
                // Data from the peripherique received
                var string_received = this.bytesToString(data);
    	        // The string received is valid
                if (this.stringRecValid(string_received)) {
                    // The string received is about the time service
                    if (this.isService(string_received, SERVICE_TIME_SERVER)) {
                        var payload = this.getPayload(string_received);
                        if (payload[0] == SERVICE_TIME_SERVER_REQUEST) {
                            if (payload.length >= 3) {
                                // this.zone.run(() => {
                                periph.globalTimerModulusMs = payload.substr(1, 3); // Read BLE device ms.
                                // });
                            }
                        }
                    }
                }
                else {
                    console.log("non supported message", string_received);
                }

            });
    }

    sendServerTime() {
        // If no interval has been set yet, start sending Time at regular intervals
        if (this.intervalSendServerTime_ID == -1)
        {
            this.intervalSendServerTime_ID = setInterval(() => {
                console.log("Sending server time to devices");
                var startTstamp = (new Date()).getTime(); // Time milliseconds
                let devicesTstamp = [0, 0, 0, 0, 0, 0, 0, 0]; // MAX 8 devices
                this.listConnectedPeriphs.forEach((periph, idx) => {
                    this.writeBLE(periph, SERVICE_TIME_SERVER, "" + (startTstamp % 1000))
                        .then(data => {
                            devicesTstamp[idx] = (new Date()).getTime();
                            // console.log("success", data);
                        })
                        .catch(err => {
                            devicesTstamp[idx] = startTstamp;
                            console.log("error", err);
                        });
                });
    
                setTimeout(() => {
                    console.log("Sending time correction to devices");
                    this.listConnectedPeriphs.forEach((periph, idx) => {
                        this.writeBLE(periph, SERVICE_TIME_SERVER_ADJUST, "" + (devicesTstamp[idx] - startTstamp))
                            .then(data => {
                                // console.log("success", data);
                            })
                            .catch(err => {
                                console.log("error", err);
                            });
                        periph.globalTimerModulusMs = (devicesTstamp[idx] - startTstamp); // Read BLE device ms.
                    });
                }, 500);
            }, this.intervalSendServerTime_ms);
        }
    }

    switchOff() {
        console.log("switchOff");
        this.mode = LEDMode.OFF_MODE;
        this.listConnectedPeriphs.forEach(periph => {
            this.changeMode(periph);
        });
    }
    switchOn() {
        console.log("switchOn");
        this.mode = LEDMode.ON_MODE;
        this.listConnectedPeriphs.forEach(periph => {
            this.changeMode(periph);
        });
    }
    flash() {
        console.log("flash");
        this.mode = LEDMode.FLASH_MODE;
        this.listConnectedPeriphs.forEach(periph => {
            this.changeMode(periph);
        });
    }
    pulse() {
        console.log("pulse");
        this.mode = LEDMode.PULSE_MODE;
        this.listConnectedPeriphs.forEach(periph => {
            this.changeMode(periph);
        });
    }
    hueFlow() {
        console.log("hueFlow");
        this.mode = LEDMode.HUE_FLOW;
        this.listConnectedPeriphs.forEach(periph => {
            this.changeMode(periph);
        });
    }
    theaterChase() {
        console.log("theaterChase");
        this.mode = LEDMode.THEATER_CHASE_MODE;
        this.listConnectedPeriphs.forEach(periph => {
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

        this.listConnectedPeriphs.forEach(periph => {
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
        this.listConnectedPeriphs.forEach(periph => {
            this.changeTempo(periph);
        });
    }

    private changeTempo(periph) {
        this.writeBLE(periph, SERVICE_TEMPO, String.fromCharCode(this.tempo))
            .then(data => {
                console.log("success", data);
            })
            .catch(err => {
                console.log("error", err);
            })
    }

    private changeColor(periph) {
        this.writeBLE(periph, SERVICE_COLOR, String.fromCharCode(this.r, this.g, this.b))
            .then(data => {
                console.log("success", data);
            })
            .catch(err => {
                console.log("error", err);
            })
    }

    private changeMode(periph) {
        this.writeBLE(periph, SERVICE_MODE, this.mode)
            .then(data => {
                console.log("success", data);
            })
            .catch(err => {
                console.log("error", err);
            })
    }

    private writeBLE(periph: Periph, service: string, message: string) {
        var uart_message = CHAR_START + service + message + CHAR_END;

        return new Promise((resolve, reject) => {
            this.ble.isConnected(periph.id)
                .then(() => {
                    return this.ble.write(periph.id, SERVICE_UUID_UART, CHARAC_UUID_UART_TX, this.stringToBytes(uart_message));
                })
                .then(data => {
                    resolve(data);
                })
                .catch(err => {
                    this.removePeriphFromList(this.listConnectedPeriphs, periph);
                    reject(err);
                })
        });
    }

    private getPayload(string_received): string {
        return string_received.substr(2, string_received.length - 2);
    }

    private isService(string_received, code_service): boolean {
        return string_received[1] == code_service;
    }

    private stringRecValid(string_received): boolean {
        return ((string_received[0] == CHAR_START) && (string_received[string_received.length - 1] == CHAR_END));
    }

    /*
    *   Buttons actions.
    */
    public displayConnectedPeriphsClick() {
        this.displayConnectedPeriphs = !this.displayConnectedPeriphs;
    }

    // ASCII only
    private stringToBytes(string) {
        var array = new Uint8Array(string.length);
        for (var i = 0, l = string.length; i < l; i++) {
            array[i] = string.charCodeAt(i);
        }
        console.log(string, array.buffer);

        return array.buffer;
    }

    // ASCII only
    private bytesToString(buffer) {
        return String.fromCharCode.apply(null, new Uint8Array(buffer));
    }

    private removePeriphFromList(list, periph) {
        var index = -1;
        list.forEach((periphlist, idx) => {
            if (periph.id == periphlist.id) {
                index = idx;
            }
        });
        if (index >= 0) {
            list.splice(index, 1);
        }
    }
}
