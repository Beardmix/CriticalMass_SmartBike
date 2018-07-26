
export class Mode {
    public static list = {
        "OFF": { val: '0', color_picker: false, tempo_picker: false },
        "ON": { val: '1', color_picker: true, tempo_picker: false },
        "FLASH": { val: '2', color_picker: true, tempo_picker: true },
        "PULSE": { val: '3', color_picker: true, tempo_picker: true },
        "HUE_FLOW": { val: '4', color_picker: false, tempo_picker: true },
        "THEATER_CHASE": { val: '5', color_picker: true, tempo_picker: true },
        "PILE_UP": { val: '6', color_picker: true, tempo_picker: true },
        "RAINBOW_MODE": { val: '7', color_picker: false, tempo_picker: true },
        "SIGNALISATION_MODE": { val: '8', color_picker: false, tempo_picker: false }
    };

    constructor() {}
};
