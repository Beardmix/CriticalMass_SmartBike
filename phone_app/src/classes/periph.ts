

export class Periph {
    name: string = "";
    id: string = "";
    last_scan: number = 0;
    num_pixels: number = 0;
    strip_reversed: boolean = false; // Lightning direction.
    globalTimerModulusMs;
    mode: string = "";
    color_r: number = 0;
    color_g: number = 0;
    color_b: number = 0;
    color_rgb: string = "";
    tempo: string = "";
    traffic_front_lower: number = 0;
    traffic_front_upper: number = 0;
    traffic_rear_lower: number = 0;
    traffic_rear_upper: number = 0;

    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
}