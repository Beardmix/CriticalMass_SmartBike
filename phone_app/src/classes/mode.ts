
export class Mode {
    public static craft(index: string, colorPicker: boolean, tempoPicker: boolean, autoPicker: boolean) {
        return {
            val: index,
            color_picker: colorPicker,
            tempo_picker: tempoPicker,
            auto_picker: autoPicker
        };
    };

    public static list = {
        "OFF":          Mode.craft('0', false, false, false),
        "ON":           Mode.craft('1', true, false, false),
        "FLASH":        Mode.craft('2', true, true, true),
        "PULSE":        Mode.craft('3', true, true, true),
        "HUE_FLOW":     Mode.craft('4', false, true, true),
        "THEATER_CHASE":Mode.craft('5', true, true, true),
        "PILE_UP":      Mode.craft('6', true, true, true),
        "RAINBOW_MODE": Mode.craft('7', false, true, true),
        "TRAFFIC_MODE": Mode.craft('8', false, false, false)
    };

    constructor() {}
};
