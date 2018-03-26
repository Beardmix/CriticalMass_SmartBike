import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { BLE } from '@ionic-native/ble';

const SERVICE_UUID_UART   = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const CHARAC_UUID_UART_RX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
const CHARAC_UUID_UART_TX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';


const HASHTAG_START = "#"
const SERVICE_MODE = "M";
const SERVICE_TIME_SERVER = "T";

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
            //this.startTimeNotification(periph);
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
            console.log(data);
            
            // var reply = Date.now(); // Time since 1970 in milliseconds
            // this.writeBLE(periph, SERVICE_TIME_SERVER, "" + reply)
            // .then(data => {
            //     console.log("success", data);            
            // })
            // .catch(err => {
            //     console.log("error", err);            
            // }) 
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
        return this.ble.write(periph.id, SERVICE_UUID_UART, CHARAC_UUID_UART_TX, this.stringToBytes(HASHTAG_START + service + message)); 
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
