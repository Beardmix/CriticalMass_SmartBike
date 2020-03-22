import { ColorClass }from '../ColorClass/colorClass';

export class PeriphClass {
  name: string = "";
  id: string = "";
  last_scan: number = 0;
  num_pixels: number = 0;
  strip_reversed: boolean = false; // Lightning direction.
  globalTimerModulusMs;
  mode: string = "";
  rgb: ColorClass;
  tempo: string = "";
  traffic_front_lower: number = 0;
  traffic_front_upper: number = 0;
  traffic_rear_lower: number = 0;
  traffic_rear_upper: number = 0;

  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.rgb = new ColorClass(0, 0, 0, "white");
  }
}