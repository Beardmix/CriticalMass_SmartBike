#include <Arduino.h>
#include <bluefruit.h>
#include "led_lib.h"
#include "ble_handler.h"
#include "eeprom_handler.h"

#include <String>

#define READ_BUFSIZE (40) /* Size of the read buffer for incoming packets */

enum LEDMode
{
    OFF_MODE = '0',
    ON_MODE = '1',
    FLASH_MODE = '2',
    PULSE_MODE = '3',
    HUE_FLOW = '4',
    THEATER_CHASE_MODE = '5',
    PILE_UP_MODE = '6',
    RAINBOW_MODE = '7',
    TRAFFIC_MODE = '8'
};

bool debug = true;

const int pinDebug = LED_BUILTIN;
const int pinData = 2;

unsigned long server_clock_ms = 0;

BLE_Handler ble;
EEPROM_Handler eeprom;
Settings settings;
CtrlLED led(pinData, pinDebug, &settings);

void setup()
{
    Serial.begin(115200);

    Serial.println("--- Peripheral---\n");

    Bluefruit.begin(1, 0);
    // Bluefruit module must be initialized for Nffs to work 
    // since Bluefruit's SOC event handling task is required for flash operation (creating the FS the first time)
    eeprom.configure();
    eeprom.load(settings);
    
    ble.configure_ble(&settings);

    // Set up and start advertising
    ble.startAdv();

    // Initialise the LED strip.
    led.configure();
}

void readUART(uint8_t *const p_ledMode)
{
    uint8_t r = 0;
    uint8_t g = 0;
    uint8_t b = 0;
    uint8_t intensity = 0;
    uint8_t tempo = 0;
    /* Buffer to hold incoming characters */
    uint8_t packetService;
    uint8_t packetPayload[READ_BUFSIZE + 1];
    // Wait for new data to arrive
    int16_t len_payload = ble.readPacket(&packetService, packetPayload, READ_BUFSIZE);
    if (len_payload == -1)
        return;

    // Switch to the correct service
    switch (packetService)
    {
    case ble.Services::TIME:
        // Serial.println("TIME");
        server_clock_ms = 0;
        server_clock_ms += (packetPayload[2] - '0') * 1;
        server_clock_ms += (packetPayload[1] - '0') * 10;
        server_clock_ms += (packetPayload[0] - '0') * 100;
        led.setTimeOffset(server_clock_ms);
        ble.sendPacket(ble.Services::TIME, String(led.getGlobalTimerModulusMs() % 10) +
                           String((led.getGlobalTimerModulusMs() / 10) % 10) +
                           String((led.getGlobalTimerModulusMs() / 100) % 10));
        // Serial.print("server_clock_ms: ");
        // Serial.println(server_clock_ms);
        break;
    case ble.Services::MODE:
        // Serial.println("MODE");
        *p_ledMode = packetPayload[0];
        ble.sendPacket(ble.Services::MODE, String(char(*p_ledMode)));
        break;
    case ble.Services::COLOR:
        // Serial.println("COLOR");
        r = packetPayload[0];
        g = packetPayload[1];
        b = packetPayload[2];
        intensity = packetPayload[3] * 2.55f;
        led.setRGB(r, g, b, intensity);
        ble.sendPacket(ble.Services::COLOR,
                       String(r) + ',' + String(g) + ',' + String(b) + ',' + String(intensity));
        break;
    case ble.Services::TEMPO:
        // Serial.println("TEMPO");
        tempo = packetPayload[0];
        led.setTempo(tempo);
        ble.sendPacket(ble.Services::TEMPO, String(tempo));
        break;
    case ble.Services::REVERSE:
        settings.strip_reversed = (bool)(packetPayload[0] - '0');
        break;
    case ble.Services::DEV_SETTINGS:
        // As BLE allows us to only transfer 20 Bytes, we split the config in chunks.
        switch (packetPayload[0])
        {
            case '?': // The Central asks for values.
                Serial.println("[SETTINGS] request cfg, will send chunk#1");
                ble.sendPacket(ble.Services::DEV_SETTINGS,
                               String("1;")
                               + String(settings.num_pixels) + ";"
                               + String(settings.strip_reversed) + ";"
                               + settings.device_name);
                break;
            case '1':
                Serial.println("[SETTINGS] request cfg, will send chunk#2");
                ble.sendPacket(ble.Services::DEV_SETTINGS,
                               String("2;")
                               + settings.traffic_front_lower + ";"
                               + settings.traffic_front_upper + ";"
                               + settings.traffic_rear_lower + ";"
                               + settings.traffic_rear_upper);
                break;
            case '2':
                Serial.println("[SETTINGS] request cfg done.");
                break;
            case '=': // The Central tells us values.
                Serial.println("[SETTINGS] ready to get cfg chunk#1");
                ble.sendPacket(ble.Services::DEV_SETTINGS, "A");
                break;
            case 'A':
                Serial.println("[SETTINGS] getting cfg chunk#1 ask for chunk#2");
                led.setPixelsOff(); // First switch pixels off to avoid reminiscence.
                settings.num_pixels = packetPayload[1];
                //Serial.println(String(settings.num_pixels));
                settings.device_name = "";
                for (int i = 3; i < len_payload; i++)
                {
                    settings.device_name += char(packetPayload[i]);
                }
                //Serial.println(settings.device_name);
                ble.sendPacket(ble.Services::DEV_SETTINGS, "B");
                break;
            case 'B':
                Serial.println("[SETTINGS] getting chunk#2");
                settings.traffic_front_lower = packetPayload[1];
                //Serial.println(String(settings.traffic_front_lower));
                settings.traffic_front_upper = packetPayload[3];
                //Serial.println(String(settings.traffic_front_upper));
                settings.traffic_rear_lower = packetPayload[5];
                //Serial.println(String(settings.traffic_rear_lower));
                settings.traffic_rear_upper = packetPayload[7];
                //Serial.println(String(settings.traffic_rear_upper));
                /* Once traffic indices are updated, we can eventually update the strip reverse flag. */
                settings.strip_reversed = (bool)(packetPayload[9] - '0');
                //Serial.println(String(settings.strip_reversed));
                // Save all settings once done.
                eeprom.save(settings);
                // Reconfigure to update the max number of pixels
                led.configure();
                break;
            default:
                Serial.println("[SETTINGS] unknown");
                break;
        }
        break;
    default:
        Serial.println("[SERVICE] unknown");
        Serial.print("Payload: ");
        for (int i = 0; i < len_payload; i++)
        {
            Serial.print(packetPayload[i]);
        }
        Serial.println();
        // delay(1000);
        break;
    }
}

void loop()
{
    static uint8_t ledMode = FLASH_MODE;

    if (ble.is_connected())
    {
        readUART(&ledMode);
    }

    led.update();

    switch (ledMode)
    {
    case OFF_MODE:
        led.switchOff();
        break;
    case ON_MODE:
        led.lightLED();
        break;
    case FLASH_MODE:
        led.flash();
        break;
    case PULSE_MODE:
        led.pulse();
        break;
    case HUE_FLOW:
        led.hueFlow();
        break;
    case THEATER_CHASE_MODE:
        led.dimmedMultiChase();
        break;
    case PILE_UP_MODE:
        led.pileUp();
        break;
    case RAINBOW_MODE:
        led.modeRainbow();
        break;
    case TRAFFIC_MODE:
        led.modeTraffic();
        break;
    default:
        Serial.println("[MODE] unknown");
        // delay(2000);
        break;
    }
}
