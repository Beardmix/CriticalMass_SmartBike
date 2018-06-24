#include <Arduino.h>
#include <bluefruit.h>
#include "led_lib.h"
#include "ble_handler.h"
#include "eeprom_handler.h"

/* Need to undefine min and max in order to compile <String>. */
#undef max
#undef min
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
    PILE_UP_MODE = '6'
};

bool debug = true;

const int pinDebug = LED_BUILTIN;
const int pinData = 2;

long local_time_offset = 0;
unsigned long server_clock_ms = 0;

CtrlLED led(pinData, pinDebug);
BLE_Handler ble;
EEPROM_Handler eeprom;
Settings settings;

void setup()
{
    Serial.begin(115200);

    Serial.println("--- Peripheral---\n");

    Bluefruit.begin(1, 0);
    // Bluefruit module must be initialized for Nffs to work 
    // since Bluefruit's SOC event handling task is required for flash operation (creating the FS the first time)
    eeprom.load(settings);
    
    ble.configure_ble(&settings);

    // Set up and start advertising
    ble.startAdv();

    // Initialise the LED strip.
    led.configure(settings.num_pixels);
}

void readUART(uint8_t *const p_ledMode)
{
    uint8_t r = 0;
    uint8_t g = 0;
    uint8_t b = 0;
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
        for (uint16_t i = 0; i < 3; i++)
        {
            server_clock_ms += (packetPayload[i]) * pow(10, 2 - i);
        }
        local_time_offset = server_clock_ms;
        led.setTimeOffset(local_time_offset);
        ble.sendPacket(ble.Services::TIME, String(led.getGlobalTimerModulusMs() % 10) +
                           String((led.getGlobalTimerModulusMs() / 10) % 10) +
                           String((led.getGlobalTimerModulusMs() / 100) % 10));
        // Serial.println(local_time_offset);
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
        led.setRGB(r, g, b);
        ble.sendPacket(ble.Services::COLOR, String(r) + ',' + String(g) + ',' + String(b));
        break;
    case ble.Services::TEMPO:
        // Serial.println("TEMPO");
        tempo = packetPayload[0];
        led.setTempo(tempo);
        ble.sendPacket(ble.Services::TEMPO, String(tempo));
        break;
    case ble.Services::DEV_SETTINGS:
        // Serial.println("DEV_SETTINGS");
        // If the central just sends the Service without payload, it means that it requests for an update.
        // Else, read the new values for the settings.
        if(len_payload > 0)
        {
            settings.num_pixels = packetPayload[0];
            settings.device_name = "";
            for (int i = 2; i < len_payload; i++)
            {
                settings.device_name += char(packetPayload[i]);
            }
            Serial.println(settings.device_name);
            eeprom.save(settings);
        }
        ble.sendPacket(ble.Services::DEV_SETTINGS, String(settings.num_pixels) + ";" + settings.device_name);
        break;
    default:
        Serial.println("[SERVICE] unknown");
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
    default:
        Serial.println("[MODE] unknown");
        // delay(2000);
        break;
    }
}
