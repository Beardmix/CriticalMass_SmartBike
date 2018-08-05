

export class Periph {
    name: string = "";
    id: string = "";
    num_pixels: number = 0;
    globalTimerModulusMs;
    mode: string = "";
    color_r: number = 0;
    color_g: number = 0;
    color_b: number = 0;
    color_rgb: string = "";
    tempo: string = "";
    sig_front_lower: number = 0;
    sig_front_upper: number = 0;
    sig_rear_lower: number = 0;
    sig_rear_upper: number = 0;

    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
}