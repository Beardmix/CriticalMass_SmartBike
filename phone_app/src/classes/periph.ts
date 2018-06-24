

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

    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
}