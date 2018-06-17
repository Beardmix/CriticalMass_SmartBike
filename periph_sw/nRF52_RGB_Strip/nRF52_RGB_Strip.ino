#include <Arduino.h>
#include <bluefruit.h>
#include "led_lib.h"
#include "ble_handler.h"
/* Need to undefine min and max in order to compile <String>. */
#undef max
#undef min
#include <String>

#define READ_BUFSIZE (20) /* Size of the read buffer for incoming packets */


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
const int numpixels = 51;

long local_time_offset = 0;
unsigned long server_clock_ms = 0;

CtrlLED led(numpixels, pinData, pinDebug);
BLE_Handler ble;

void setup()
{
    Serial.begin(115200);

    Serial.println("--- Peripheral---\n");

    ble.configure();

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
    uint8_t tempo = 0;
    /* Buffer to hold incoming characters */
    uint8_t packetService;
    uint8_t packetPayload[READ_BUFSIZE + 1];
    // Wait for new data to arrive
    uint16_t len = ble.readPacket(&packetService, packetPayload, READ_BUFSIZE);
    if (len == 0)
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
    default:
        Serial.println("[SERVICE] unknown");
        Serial.println(packetPayload[0]);
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
