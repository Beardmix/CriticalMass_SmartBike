import { Component, ChangeDetectorRef } from '@angular/core';
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

    constructor(public viewCtrl: ViewController,
                public params: NavParams,
                private cdr: ChangeDetectorRef) { 
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
        // Device name validation.
        this.periph.name = this.periph.name.substr(0, 10);
        if ((this.periph.name.length == 0) || (this.periph.name.indexOf('#') !== -1 ) || (this.periph.name.indexOf('!') !== -1)) {
            this.periph.name = "MyFahrrad";
        }
        // Number of pixels validation.
        this.periph.num_pixels = Math.max(this.periph.num_pixels, 1);
        this.periph.num_pixels = Math.min(this.periph.num_pixels, 99);
        // Traffic mode.
        this.periph.traffic_front_lower = this.signalisationValues.front.lower;
        this.periph.traffic_front_upper = this.signalisationValues.front.upper;
        this.periph.traffic_rear_lower = this.signalisationValues.rear.lower;
        this.periph.traffic_rear_upper = this.signalisationValues.rear.upper;
        this.viewCtrl.dismiss(this.periph);
    }

    // Device name validator.
    validateName(value) {
        this.cdr.detectChanges();
        this.periph.name =
            (value.length > 10) ? value.substring(0, 10)
            : (((value.indexOf('#') !== -1 ) || (value.indexOf('!') !== -1))
            ? value.substring(0, value.length - 1) : value);
    }

    // Number of pixels validator.
    validatePixels(value) {
        this.cdr.detectChanges();
        this.periph.num_pixels =
            (value.length > 2) ? value.substring(0, 2) : ((value < 0) ? 1 : value);
    }
}