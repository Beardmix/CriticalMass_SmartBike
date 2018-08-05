import { Component } from '@angular/core';
import { ViewController } from 'ionic-angular';
import {NavParams} from 'ionic-angular';
import { Periph } from '../../classes/periph';

@Component({
    selector: 'page-peripheral',
    templateUrl: 'popover-settings.html'
})

export class PopoverSettings {
    periph: Periph;
    
    signalisationBoundaries = { min: 0, max: 1 };
    signalisationValues = {
        front: { lower: 0, upper: 0 },
        rear: { lower: 0, upper: 0}
    };

    constructor(public viewCtrl: ViewController, public params: NavParams) { 
        this.periph = this.params.get('periph');
        this.signalisationValues = {
            front: {
                lower: this.periph.sig_front_lower,
                upper: this.periph.sig_front_upper
            },
            rear: {
                lower: this.periph.sig_rear_lower,
                upper: this.periph.sig_rear_upper
            }
        };

        this.signalisationBoundaries.max = this.periph.num_pixels;
    }

    close() {
        this.viewCtrl.dismiss();
    }

    save() {
        this.periph.sig_front_lower = this.signalisationValues.front.lower;
        this.periph.sig_front_upper = this.signalisationValues.front.upper;
        this.periph.sig_rear_lower = this.signalisationValues.rear.lower;
        this.periph.sig_rear_upper = this.signalisationValues.rear.upper;
        this.viewCtrl.dismiss(this.periph);
    }
}