import { Component, OnInit, ChangeDetectorRef, Input } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';

import { PeriphClass } from '../PeriphClass/periph-class';

@Component({
  selector: 'app-periph-modal',
  templateUrl: './periph-modal.component.html',
  styleUrls: ['./periph-modal.component.scss'],
})
export class PeriphModal implements OnInit {
  periph: PeriphClass;
  
  trafficBoundaries = { min: 1, max: 1 };
  trafficValues = {
      front: { lower: this.trafficBoundaries.min, upper: this.trafficBoundaries.min },
      rear: { lower: this.trafficBoundaries.min, upper: this.trafficBoundaries.min}
  };

  constructor(public modalController: ModalController,
              public params: NavParams,
              private cdr: ChangeDetectorRef) { 
    this.periph = this.params.get('periph');
    this.trafficValues = {
      front: {
        lower: this.periph.traffic_front_lower,
        upper: this.periph.traffic_front_upper
      },
      rear: {
        lower: this.periph.traffic_rear_lower,
        upper: this.periph.traffic_rear_upper
      }
    };

    this.trafficBoundaries.max = this.periph.num_pixels;
  }

  ngOnInit() {}

  async dismiss() {
    await this.modalController.dismiss();
  }

  async save() {
    // Device name validation.
    this.periph.name = this.periph.name.substr(0, 10);
    if ((this.periph.name.length == 0) || (this.periph.name.indexOf('#') !== -1 ) || (this.periph.name.indexOf('!') !== -1)) {
      this.periph.name = "MyFahrrad";
    }
    // Number of pixels validation.
    this.periph.num_pixels = Math.max(this.periph.num_pixels, 1);
    this.periph.num_pixels = Math.min(this.periph.num_pixels, 99);
    // Traffic mode.
    this.periph.traffic_front_lower = this.trafficValues.front.lower;
    this.periph.traffic_front_upper = this.trafficValues.front.upper;
    this.periph.traffic_rear_lower = this.trafficValues.rear.lower;
    this.periph.traffic_rear_upper = this.trafficValues.rear.upper;
    
    await this.modalController.dismiss({
      periph: this.periph
    });
  }

  // Device name validator.
  validateName(value) {
    this.cdr.detectChanges();
    this.periph.name = (value.length > 10) ? value.substring(0, 10)
      : (((value.indexOf('#') !== -1 ) || (value.indexOf('!') !== -1))
      ? value.substring(0, value.length - 1) : value);
  }

  // Number of pixels validator.
  validatePixels(value) {
    this.cdr.detectChanges();
    this.periph.num_pixels = (value.length > 2) ? value.substring(0, 2) : ((value < 0) ? 1 : value);
  }
}
