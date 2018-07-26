
export class Color {
    r = 0;
    g = 0;
    b = 0;
    brightness = 100;
    saturation = 100;
    r_final = 0;
    g_final = 0;
    b_final = 0;

    constructor(r, g, b) {
        this.setRGB(r, g, b);
    }

    setRGB(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.computeFinalRGB();
    }

    setBrightness(brightness) {
        this.brightness = brightness;
        this.computeFinalRGB();
    }

    computeFinalRGB() {
        var r = this.r;
        var g = this.g;
        var b = this.b;
        var max_val = Math.max(r, g, b);
        r = r + (max_val - r) * (100 - this.saturation) / 100.0;
        g = g + (max_val - g) * (100 - this.saturation) / 100.0;
        b = b + (max_val - b) * (100 - this.saturation) / 100.0;
        r = r * this.brightness / 100.0;
        g = g * this.brightness / 100.0;
        b = b * this.brightness / 100.0;
        this.r_final = Math.round(r);
        this.g_final = Math.round(g);
        this.b_final = Math.round(b);
        console.log("changeColor", this.r_final, this.g_final, this.b_final);
    }

    getRGBstring() {
        return "rgb(" + String(this.r_final) + "," + String(this.g_final) + "," + String(this.b_final) + ")";
    }
}
