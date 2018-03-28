import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { BLE } from '@ionic-native/ble';

const SERVICE_UUID_UART = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const CHARAC_UUID_UART_RX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
const CHARAC_UUID_UART_TX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';


const CHAR_START = '#'
const CHAR_END = '!'
const SERVICE_MODE = 'M';
const SERVICE_TIME_SERVER = 'T';
const SERVICE_TIME_SERVER_REQUEST = 'R';

class Periph {
    name: string = "";
    id: string = "";

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
    d_start_app: number = 0;

    constructor(public navCtrl: NavController, private ble: BLE) {
        this.d_start_app = new Date().getTime(); // "now"
        this.scan();
    }

    scan() {
        this.listPeriphs = [];
        this.ble.scan([], 5000).subscribe((periph) => {
            if (periph.name) {
                if (periph.name.indexOf("MyFahrrad") >= 0) // searches for MyFahrrad in the name of the device
                {
                    this.listPeriphs.push(new Periph(periph.id, periph.name));
                }
            }
        });
    }

    connectAll() {
        this.ble.scan([], 5000).subscribe((periph) => {
            if (periph.name) {
                if (periph.name.indexOf("MyFahrrad") >= 0) // searches for MyFahrrad in the name of the device
                {
                    this.connect(new Periph(periph.id, periph.name));
                }
            }
        });
    }

    disconnectAll()
    {
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
                this.listConnectedPeriphs.push(periph);
                this.startTimeNotification(periph);
                this.removePeriphFromList(this.listPeriphs, periph);
            },
            error => {
                console.log("error", error);
            },
            () => {
                console.log("finished");
            });
    }

    startTimeNotification(periph: Periph) {
        this.ble.startNotification(periph.id, SERVICE_UUID_UART, CHARAC_UUID_UART_RX)
            .subscribe((data) => {
                var string_received = this.bytesToString(data);

                if (this.stringRecValid(string_received)) {
                    if (this.isService(string_received, SERVICE_TIME_SERVER)) {
                        var payload = this.getPayload(string_received);
                        if (payload[0] == SERVICE_TIME_SERVER_REQUEST) {
                            var now = new Date().getTime(); // "now"
                            var reply = Math.abs(now - this.d_start_app); // Time since app start in milliseconds
                            this.writeBLE(periph, SERVICE_TIME_SERVER, "" + reply)
                                .then(data => {
                                    console.log("success", data);
                                })
                                .catch(err => {
                                    console.log("error", err);
                                })
                        }
                    }
                }
                else {
                    console.log("non supported message", string_received);
                }

            });
    }


    switchOff() {
        console.log("switchOff");
        this.changeMode("0");
    }
    switchOn() {
        console.log("switchOn");
        this.changeMode("1");
    }
    flash() {
        console.log("flash");
        this.changeMode("2");
    }
    pulse() {
        console.log("pulse");
        this.changeMode("3");
    }

    private changeMode(code_mode) {
        this.listConnectedPeriphs.forEach(periph => {
            this.writeBLE(periph, SERVICE_MODE, code_mode)
                .then(data => {
                    console.log("success", data);
                })
                .catch(err => {
                    console.log("error", err);
                })
        });
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

    private removePeriphFromList(list, periph)
    {
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
