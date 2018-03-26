import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { BLE } from '@ionic-native/ble';

const LIGHTBULB_SERVICE = 'ff10';
const DIMMER_CHARACTERISTIC = 'ff12';

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

    scan ()
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

    switchOn(){
        console.log("switchOn");
        this.listConnectedPeriphs.forEach(periph => {
            this.ble.write(periph.id, "00001530-1212-efde-1523-785feabcd123", "00001531-1212-efde-1523-785feabcd123", this.stringToBytes(42))
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

    // ASCII only
    stringToBytes(string) {
        var array = new Uint8Array(string.length);
        for (var i = 0, l = string.length; i < l; i++) {
            array[i] = string.charCodeAt(i);
        }
        return array.buffer;
    }

    // ASCII only
    bytesToString(buffer) {
        return String.fromCharCode.apply(null, new Uint8Array(buffer));
    }
}
