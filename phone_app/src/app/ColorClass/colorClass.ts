export class ColorClass {
  cssClassName: String;
  r = 0;
  g = 0;
  b = 0;
  i = 100;

  static colorsPresetsList: ColorClass[] = [
    new ColorClass(255, 0, 0, "red"),
    new ColorClass(0, 255, 0, "green"),
    new ColorClass(0, 0, 255, "blue"),
    new ColorClass(255, 255, 255, "white"),
    new ColorClass(255, 128, 0, "orange"),
    new ColorClass(255, 255, 0, "yellow"),
    new ColorClass(51, 153, 255, "lightblue"),
    new ColorClass(255, 0, 255, "fuschia"),
    new ColorClass(0, 255, 255, "aqua")
  ];

  constructor(r: number, g: number, b: number, cssClassName="primary") {
    this.setRGB(r, g, b);
    this.setCssClassName(cssClassName);
  }

  setRGB(r: number, g: number, b: number) {
    this.r = r;
    this.g = g;
    this.b = b;
  }

  setCssClassName(cssClassName: String) {
    this.cssClassName = cssClassName;
  }

  setIntensity(i: number) {
    this.i = i;
  }

  /* CSS - background-color property */
  getRGBstring() {
    return "rgb(" + String(this.r) +
        "," + String(this.g) +
        "," + String(this.b) + ")";
  }

  getCssClassName() {
    return this.cssClassName;
  }

  lookupCssClassName(): String {
    var cssClassName: String = "unknown";
    ColorClass.colorsPresetsList.forEach(color => {
      if ((color.r == this.r) && (color.g == this.g) && (color.b == this.b)) {
        cssClassName = color.cssClassName;
      }
    });

    return cssClassName;
  }
}
