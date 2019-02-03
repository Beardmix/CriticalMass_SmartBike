
export class Color {
    r = 0;
    g = 0;
    b = 0;
    i = 100;

    constructor(r, g, b) {
        this.setRGB(r, g, b);
    }

    setRGB(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }

    setIntensity(i) {
        this.i = i;
    }

    /* CSS - background-color property */
    getRGBstring() {
        return "rgb(" + String(this.r) +
                "," + String(this.g) +
                "," + String(this.b) + ")";
    }
}
