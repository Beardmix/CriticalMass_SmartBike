export class ModeClass {
  public static craft(index: string, colorPicker: boolean, intensityPicker: boolean, tempoPicker: boolean, autoPicker: boolean) {
    return {
      val: index,
      color_picker: colorPicker,
      intensity_picker: intensityPicker,
      tempo_picker: tempoPicker,
      auto_picker: autoPicker
    };
  };

  public static list = {
    "OFF":            ModeClass.craft('0', false, false, false, false),
    "ON":             ModeClass.craft('1', true, true, false, false),
    "FLASH":          ModeClass.craft('2', true, true, true, true),
    "PULSE":          ModeClass.craft('3', true, true, true, true),
    "HUE_FLOW":       ModeClass.craft('4', false, true, true, true),
    "THEATER_CHASE":  ModeClass.craft('5', true, true, true, true),
    "PILE_UP":        ModeClass.craft('6', true, true, true, true),
    "RAINBOW_MODE":   ModeClass.craft('7', false, true, true, true),
    "TRAFFIC_MODE":   ModeClass.craft('8', false, true, false, false)
  };

  constructor() {}
};
