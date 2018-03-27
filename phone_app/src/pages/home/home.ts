import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { BLE } from '@ionic-native/ble';

const SERVICE_UUID_UART   = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
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
    
    constructor(id, name){
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
        this.scan ();
    }

    scan()
    {
        this.listPeriphs = [];
        this.ble.scan([], 10000).subscribe((periph) => {
            this.listPeriphs.push(new Periph(periph.id, periph.name));
            if (periph.name == "MyFahrrad")
            {
                console.log("found", periph);
            }
        });
    }

    connect(periph: Periph){
        this.ble.connect(periph.id).subscribe((data) => {
            console.log("connected", data);
            this.listConnectedPeriphs.push(periph);
            this.startTimeNotification(periph);
            var index = -1;
            this.listPeriphs.forEach((periphlist, idx) => {
                if (periph.id == periphlist.id)
                {
                    index = idx;
                }
            });
            if(index >= 0)
            {
                this.listPeriphs.splice(index, 1);
            }
        });
    }

    startTimeNotification(periph: Periph)
    {        
        this.ble.startNotification(periph.id, SERVICE_UUID_UART, CHARAC_UUID_UART_RX)
        .subscribe((data) => {
            var string_received = this.bytesToString(data);

            if(string_received[0] == CHAR_START && string_received[string_received.length - 1] == CHAR_END)
            {
                if(string_received[1] == SERVICE_TIME_SERVER)
                {
                    if(string_received[2] == SERVICE_TIME_SERVER_REQUEST)
                    {
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
            else
            {
                console.log("non supported message", string_received);
            }
            
        });
    }

    switchOn(){
        console.log("switchOn");
        this.listConnectedPeriphs.forEach(periph => {
            this.writeBLE(periph, SERVICE_MODE, "1")
            .then(data => {
                console.log("success", data);            
            })
            .catch(err => {
                console.log("error", err);            
            }) 
        });
    }

    switchOff(){
        console.log("switchOff");
        this.listConnectedPeriphs.forEach(periph => {
            this.writeBLE(periph, SERVICE_MODE, "0")
            .then(data => {
                console.log("success", data);            
            })
            .catch(err => {
                console.log("error", err);            
            }) 
        });
        
    }
    flash(){
        console.log("flash");
        this.listConnectedPeriphs.forEach(periph => {
            this.writeBLE(periph, SERVICE_MODE, "2")
            .then(data => {
                console.log("success", data);            
            })
            .catch(err => {
                console.log("error", err);            
            }) 
        });
        
    }
    pulse(){
        console.log("pulse");
        this.listConnectedPeriphs.forEach(periph => {
            this.writeBLE(periph, SERVICE_MODE, "3")
            .then(data => {
                console.log("success", data);            
            })
            .catch(err => {
                console.log("error", err);            
            }) 
        });
        
    }

    private writeBLE(periph : Periph, service: string, message: string)
    {
        var uart_message = CHAR_START + service + message + CHAR_END;
        return this.ble.write(periph.id, SERVICE_UUID_UART, CHARAC_UUID_UART_TX, this.stringToBytes(uart_message)); 
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
}
