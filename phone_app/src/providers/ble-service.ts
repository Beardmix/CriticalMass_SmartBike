import { Injectable } from '@angular/core';
import { BLE } from '@ionic-native/ble';
import { Subject } from 'rxjs/Subject';
import { Platform } from 'ionic-angular';

import { LocationAccuracy } from '@ionic-native/location-accuracy';

import { Periph } from '../classes/periph';
import { Mode } from '../classes/mode';

const SERVICE_UUID_UART = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const CHARAC_UUID_UART_RX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
const CHARAC_UUID_UART_TX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';

const CHAR_START = '#'
const CHAR_END = '!'

export const BLE_SERVICES = {
    TIME_SERVER: 'S',
    MODE: 'M',
    COLOR: 'C',
    TEMPO: 'T',
    DEV_SETTINGS: 'D',
    REVERSE: 'R'
}

@Injectable()
export class BleServiceProvider {
    public listConnectedPeriphs: Periph[] = [];
    public listAvailablePeriphs: Periph[] = [];

    private intervalScanNewDevices_ID = -1;
    public intervalScanNewDevices_ms = 5000;
    private intervalSendServerTime_ID = -1;
    private intervalSendServerTime_ms = 4000;

    public newPeriphObs = new Subject();
    public scanObs = new Subject();

    public time_offset_cue = 0;

    constructor(private ble: BLE,
        public platform: Platform,
        private locationAccuracy: LocationAccuracy) {
        console.log('Hello BleServiceProvider Provider');
        
        // If the device is not a computer
        if (!this.platform.is('core')) {
            // Bluetooth activation.
            this.ble.isEnabled().then(() => {
                console.log('Bluetooth already enabled.');
            },
                (err) => { // Bluetooth disabled, try to enable it.
                    // Android only.
                    if (this.platform.is('android')) {
                        this.ble.enable().then(() => {
                            console.log('Bluetooth now enabled.');
                        },
                            (err) => {
                                console.log('Cannot enable Bluetooth: ' + err);
                            });
                    }
                });

            // Localization activation.
            // https://ionicframework.com/docs/native/location-accuracy/
            this.locationAccuracy.canRequest().then((canRequest: boolean) => {
                if (canRequest) {
                    // the accuracy option will be ignored by iOS
                    this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
                        () => console.log('Request successful'),
                        error => console.log('Error requesting location permissions', error)
                    );
                }

            });
        }
    }

    connect(periph: Periph) {
        this.removePeriphFromList(this.listAvailablePeriphs, periph);
        this.ble.connect(periph.id).subscribe(
            data => {
                console.log("connected", data);
                this.addPeriphToList(this.listConnectedPeriphs, periph);
                this.startNotificationUART(periph);
                this.newPeriphObs.next(periph);
            },
            error => {
                this.removePeriphFromList(this.listConnectedPeriphs, periph);
                console.log("error", error);
            },
            () => {
                console.log("finished");
            });
    }

    disconnect(periph: Periph) {
        this.ble.disconnect(periph.id)
            .then(() => {
                this.removePeriphFromList(this.listConnectedPeriphs, periph);
                periph.last_scan = 0;
                this.addPeriphToList(this.listAvailablePeriphs, periph);
            })
            .catch(() => {
                this.removePeriphFromList(this.listConnectedPeriphs, periph);
            })
    }

    // connects to all devices that are compatible
    private scan() {
        this.scanObs.next(true);
        this.ble.startScan([]).subscribe(
            periph => {
                if (periph.advertising) {
                    var adv = this.bytesToString(periph.advertising);
                    if (adv.indexOf("MF@CM") >= 0) // searches for MF@CM in the advertising of the device
                    {
                        console.log("scan", periph);
                        var new_periph = new Periph(periph.id, periph.name);
                        this.addPeriphToList(this.listAvailablePeriphs, new_periph);
                    }
                }
            },
            error => {
                console.log("scan_error", error);
                this.scanObs.next(false);
            });
        setTimeout(() => {
            this.ble.stopScan();
            this.scanObs.next(false);
        }, this.intervalScanNewDevices_ms * 0.8);
    }

    sendServerTime() {
        // If no interval has been set yet, start sending Time at regular intervals
        if (this.intervalSendServerTime_ID == -1) {
            this.intervalSendServerTime_ID = setInterval(() => {
                console.log("Sending server time to devices");
                var startTstamp = (new Date()).getTime() - this.time_offset_cue; // Time milliseconds
                var timestamp_str = "" + (startTstamp % 1000);
                while (timestamp_str.length < 3) {
                    timestamp_str = "0" + timestamp_str;
                }
                this.listConnectedPeriphs.forEach((periph, idx) => {
                    this.writeBLE(periph, BLE_SERVICES.TIME_SERVER, timestamp_str)
                        .then(data => {
                            // console.log("success", data);
                        })
                        .catch(err => {
                            console.log("error", err);
                        });
                });
            }, this.intervalSendServerTime_ms);
        }
    }

    startScan() {
        this.scan();
        if (this.intervalScanNewDevices_ID == -1) {
            this.sendServerTime();
            this.intervalScanNewDevices_ID = setInterval(() => {
                this.scan();
            }, this.intervalScanNewDevices_ms);
        }
    }

    stopScan() {
        this.ble.stopScan();
        this.scanObs.next(false);
        // remove interval to stop connecting to new devices
        if (this.intervalScanNewDevices_ID != -1) {
            clearTimeout(this.intervalScanNewDevices_ID);
            this.intervalScanNewDevices_ID = -1;
        }
        // // remove interval to save battery
        // if (this.intervalSendServerTime_ID != -1) {
        //     clearTimeout(this.intervalSendServerTime_ID);
        //     this.intervalSendServerTime_ID = -1;
        // }
    }

    public isScanningNewPeriphs(){
        return this.intervalScanNewDevices_ID != -1;
    }

    public writeBLE(periph: Periph, service: string, message: string) {
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

    startNotificationUART(periph: Periph) {
        this.ble.startNotification(periph.id, SERVICE_UUID_UART, CHARAC_UUID_UART_RX).subscribe((data) => {
            // Data from the peripheral received
            var string_received = this.bytesToString(data);
            console.log("string_received", string_received);

            if (this.stringRecValid(string_received)) {
                var payload = this.getPayload(string_received);

                if (this.isService(string_received, BLE_SERVICES.TIME_SERVER)) {
                    periph.globalTimerModulusMs = payload;
                }
                else if (this.isService(string_received, BLE_SERVICES.MODE)) {
                    periph.mode = Mode.list[Number(payload)];
                }
                else if (this.isService(string_received, BLE_SERVICES.COLOR)) {
                    var colors = payload.split(",");
                    periph.color_r = Number(colors[0]);
                    periph.color_g = Number(colors[1]);
                    periph.color_b = Number(colors[2]);
                    periph.color_rgb = "rgb(" + String(periph.color_r) + "," + String(periph.color_g) + "," + String(periph.color_b) + ")";
                }
                else if (this.isService(string_received, BLE_SERVICES.TEMPO)) {
                    periph.tempo = payload;
                }
                else if (this.isService(string_received, BLE_SERVICES.DEV_SETTINGS)) {
                    var settings = payload.split(";");
                    switch (settings[0])
                    {
                        case "1":
                            periph.num_pixels = parseInt(settings[1]);
                            periph.strip_reversed = Boolean(parseInt(settings[2]));
                            periph.name = String(settings[3]);
                            console.log("[DEV_SETTINGS] Received param. "
                                        + "num_pixel (" + String(periph.num_pixels) +  "), "
                                        + "strip_reversed (" + String(periph.strip_reversed) +  "), "
                                        + "name (" + periph.name + ").");
                            this.writeBLE(periph, BLE_SERVICES.DEV_SETTINGS, settings[0])
                                .then(data => {
                                    console.log("[DEV_SETTINGS] " + settings[0] + " success.", data);
                                })
                                .catch(err => {
                                    console.log("[DEV_SETTINGS] " + settings[0] + " failed.", data);
                                })
                            break;
                        case "2":
                            periph.traffic_front_lower = parseInt(settings[1]);
                            periph.traffic_front_upper = parseInt(settings[2]);
                            periph.traffic_rear_lower = parseInt(settings[3]);
                            periph.traffic_rear_upper = parseInt(settings[4]);
                            console.log("[DEV_SETTINGS] Received param: traffic param."
                                        + "traffic_front_lower (" + String(periph.traffic_front_lower) + "), "
                                        + "traffic_front_upper (" + String(periph.traffic_front_upper) + "), "
                                        + "traffic_rear_lower (" + String(periph.traffic_rear_lower) + "), "
                                        + "traffic_rear_upper (" + String(periph.traffic_rear_upper) + ").");
                            this.writeBLE(periph, BLE_SERVICES.DEV_SETTINGS, settings[0])
                                .then(data => {
                                    console.log("[DEV_SETTINGS] " + settings[0] + " success.", data);
                                })
                                .catch(err => {
                                    console.log("[DEV_SETTINGS] " + settings[0] + " failed.", data);
                                })
                            break;
                            case "A":
                                console.log("[DEV_SETTINGS] Sending param: num_pixel, name.");
                                this.writeBLE(periph, BLE_SERVICES.DEV_SETTINGS,
                                            settings[0]
                                            + String.fromCharCode(periph.num_pixels) + ";"
                                            + periph.name)
                                    .then(data => {
                                        console.log("[DEV_SETTINGS] " + settings[0] + " success.", data);
                                    })
                                    .catch(err => {
                                        console.log("[DEV_SETTINGS] " + settings[0] + " failed.", data);
                                    })
                                    break;
                        case "B":
                            console.log("[DEV_SETTINGS] Sending param: traffic indices, strip_reversed.");
                            this.writeBLE(periph, BLE_SERVICES.DEV_SETTINGS,
                                        settings[0]
                                        + String.fromCharCode(periph.traffic_front_lower) + ";"
                                        + String.fromCharCode(periph.traffic_front_upper) + ";"
                                        + String.fromCharCode(periph.traffic_rear_lower) + ";"
                                        + String.fromCharCode(periph.traffic_rear_upper) + ";"
                                        + ((true == periph.strip_reversed) ? "1" : "0"))
                                .then(data => {
                                    console.log("[DEV_SETTINGS] " + settings[0] + " success.", data);
                                })
                                .catch(err => {
                                    console.log("[DEV_SETTINGS] " + settings[0] + " failed.", data);
                                })
                                break;
                        default:
                            console.log("[DEV_SETTINGS] Received " + settings[0] + ", do nothing.");
                            break;
                    }
                }
                else {
                    console.log("unknown service", string_received);
                }
            }
            else {
                console.log("non supported message (note: only 20 Bytes can be sent over BLE.)", string_received);
            }

        });
    }


    private getPayload(string_received): string {
        return string_received.substr(2, string_received.length - 3);
    }

    private isService(string_received, code_service): boolean {
        return string_received[1] == code_service;
    }

    private stringRecValid(string_received): boolean {
        return ((string_received[0] == CHAR_START) && (string_received[string_received.length - 1] == CHAR_END));
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

    private addPeriphToList(list, periph) {
        var index = -1;
        list.forEach((periphlist, idx) => {
            if (periph.id == periphlist.id) {
                index = idx;
            }
        });
        periph.last_scan = (new Date()).getTime();
        if (index == -1) {
            list.push(periph);
        } else {
            list[index] = periph;
        }
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
