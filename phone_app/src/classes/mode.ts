
export class Mode {
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
        "OFF":          Mode.craft('0', false, false, false, false),
        "ON":           Mode.craft('1', true, true, false, false),
        "FLASH":        Mode.craft('2', true, true, true, true),
        "PULSE":        Mode.craft('3', true, true, true, true),
        "HUE_FLOW":     Mode.craft('4', false, true, true, true),
        "THEATER_CHASE":Mode.craft('5', true, true, true, true),
        "PILE_UP":      Mode.craft('6', true, true, true, true),
        "RAINBOW_MODE": Mode.craft('7', false, true, true, true),
        "TRAFFIC_MODE": Mode.craft('8', false, true, false, false)
    };

    constructor() {}
};
