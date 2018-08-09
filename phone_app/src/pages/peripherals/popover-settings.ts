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
    
    signalisationBoundaries = { min: 1, max: 1 };
    signalisationValues = {
        front: { lower: this.signalisationBoundaries.min, upper: this.signalisationBoundaries.min },
        rear: { lower: this.signalisationBoundaries.min, upper: this.signalisationBoundaries.min}
    };

    constructor(public viewCtrl: ViewController, public params: NavParams) { 
        this.periph = this.params.get('periph');
        this.signalisationValues = {
            front: {
                lower: this.periph.traffic_front_lower,
                upper: this.periph.traffic_front_upper
            },
            rear: {
                lower: this.periph.traffic_rear_lower,
                upper: this.periph.traffic_rear_upper
            }
        };

        this.signalisationBoundaries.max = this.periph.num_pixels;
    }

    close() {
        this.viewCtrl.dismiss();
    }

    save() {
        this.periph.traffic_front_lower = this.signalisationValues.front.lower;
        this.periph.traffic_front_upper = this.signalisationValues.front.upper;
        this.periph.traffic_rear_lower = this.signalisationValues.rear.lower;
        this.periph.traffic_rear_upper = this.signalisationValues.rear.upper;
        this.viewCtrl.dismiss(this.periph);
    }
}