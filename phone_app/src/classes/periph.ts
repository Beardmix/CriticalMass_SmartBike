

export class Periph {
    name: string = "";
    id: string = "";
    num_pixels: Number = 0;
    globalTimerModulusMs;
    mode: string = "";
    color_r: Number = 0;
    color_g: Number = 0;
    color_b: Number = 0;
    color_rgb: string = "";
    tempo: string = "";

    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
}