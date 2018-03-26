import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { BLE } from '@ionic-native/ble';

const SERVICE_UUID_UART = '6E400001-B5A3-F393-­E0A9-­E50E24DCCA9E';
const CHARAC_UUID_UART_RX = '0x0003';
const CHARAC_UUID_UART_TX = '0x0002';

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

    constructor(public navCtrl: NavController, private ble: BLE) {
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
            var reply = Date.now(); // Time since 1970 in milliseconds
            this.writeBLE(periph, "" + reply)
            .then(data => {
                console.log("success", data);            
            })
            .catch(err => {
                console.log("error", err);            
            }) 
        });
    }

    switchOn(){
        console.log("switchOn");
        this.listConnectedPeriphs.forEach(periph => {
            this.writeBLE(periph, "42")
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
        
    }
    flash(){
        console.log("flash");
        
    }
    pulse(){
        console.log("pulse");
        
    }

    private writeBLE(periph : Periph, message: string)
    {
        return this.ble.write(periph.id, SERVICE_UUID_UART, CHARAC_UUID_UART_TX, this.stringToBytes(message)); 
    }

    // ASCII only
    private stringToBytes(string) {
        var array = new Uint8Array(string.length);
        for (var i = 0, l = string.length; i < l; i++) {
            array[i] = string.charCodeAt(i);
        }
        return array.buffer;
    }

    // ASCII only
    private bytesToString(buffer) {
        return String.fromCharCode.apply(null, new Uint8Array(buffer));
    }
}
