import { Component } from '@angular/core';
import { ViewController } from 'ionic-angular';
import {NavParams} from 'ionic-angular';
import { Periph } from '../../classes/periph';

@Component({
    templateUrl: 'popover-settings.html'
})

export class PopoverSettings {
    periph: Periph;

    constructor(public viewCtrl: ViewController, public params: NavParams) { 
        this.periph = this.params.get('periph');
    }

    close() {
        this.viewCtrl.dismiss();
    }

    save() {
        this.viewCtrl.dismiss(this.periph);
    }
}