#include <bluefruit.h>
#include "led_lib.h"

/*
 * Advertising packets can be simulated with the "nRF Connect for Mobile" app
 * https://play.google.com/store/apps/details?id=no.nordicsemi.android.mcp
 * 
 * Simulation:
 *  Service name: Cycling Speed and Cadence 0x1816
 *  Data:
 *    0x00 - off
 *    0x01 - on
 *    0x02 - flash
 *    0x03 - pulse
 */

enum SpecialChars
{
    CHAR_START = '#',
    CHAR_END = '!'
};

enum Services
{
    COLOR = 'C',
    MODE = 'M',
    TIME = 'S',
    TEMPO = 'T'
};

enum LEDMode
{
    OFF_MODE = '0',
    ON_MODE = '1',
    FLASH_MODE = '2',
    PULSE_MODE = '3',
    HUE_FLOW = '4'
};

const int pinDebug = LED_BUILTIN;
const int pinRed = 11;
const int pinGreen = 27;
const int pinBlue = 16;

uint8_t ledMode = FLASH_MODE;
unsigned long last_sent = 0;
int local_time_offset = 1000;
#define NB_OFFSETS (10)
unsigned int local_time_offsets[NB_OFFSETS];
unsigned int local_time_delays[NB_OFFSETS];
uint8_t local_time_offset_idx = 0;

CtrlLED led;
BLEUart bleuart;

// Function prototypes for packetparser.cpp
uint16_t readPacket(BLEUart *ble_uart);
float parsefloat(uint8_t *buffer);
void printHex(const uint8_t *data, const uint32_t numBytes);

// Packet buffer
extern uint8_t packetbuffer[];

unsigned long global_millis()
{
    return millis() + local_time_offset;
}

void setup()
{
    Serial.begin(115200);

    Serial.println("--- Peripheral---\n");

    Bluefruit.begin();
    Bluefruit.setTxPower(4); // Set max power. Accepted values are: -40, -30, -20, -16, -12, -8, -4, 0, 4
    Bluefruit.setName("MyFahrrad2");

    bleuart.begin();

    led.configure(pinRed, pinGreen, pinBlue, pinDebug);
    led.setRGB(255, 255, 255);

    // Set up and start advertising
    startAdv();
}

// Advertising packet
void startAdv(void)
{
    Bluefruit.Advertising.addFlags(BLE_GAP_ADV_FLAGS_LE_ONLY_GENERAL_DISC_MODE);
    Bluefruit.Advertising.addTxPower();
    Bluefruit.Advertising.addService(bleuart);
    Bluefruit.ScanResponse.addName();

    /* Start Advertising
   * - Enable auto advertising if disconnected
   * - Interval:  fast mode = 20 ms, slow mode = 152.5 ms
   * - Timeout for fast mode is 30 seconds
   * - Start(timeout) with timeout = 0 will advertise forever (until connected)
   * 
   * For recommended advertising interval
   * https://developer.apple.com/library/content/qa/qa1931/_index.html   
   */
    Bluefruit.Advertising.restartOnDisconnect(true);
    Bluefruit.Advertising.setInterval(32, 244); // in unit of 0.625 ms
    Bluefruit.Advertising.setFastTimeout(30);   // number of seconds in fast mode
    Bluefruit.Advertising.start(0);             // 0 = Don't stop advertising after n seconds
}

void readUART()
{
    unsigned int server_clock_ms = 0;
    unsigned int local_clock_ms = 0;
    unsigned long local_clock = 0;
    unsigned int new_time_offset = 0;
    unsigned int delay_transm = 0;
    uint8_t r = 0;
    uint8_t g = 0;
    uint8_t b = 0;
    uint8_t tempo = 0;
    // Wait for new data to arrive
    uint16_t len = readPacket(&bleuart);
    if (len == 0)
        return;

    // Switch to the correct service
    switch (packetbuffer[0])
    {
    case TIME:
        local_clock = (last_sent + millis()) / 2;
        delay_transm = (millis() - last_sent) / 2;
        Serial.println("[SERVICE] TIME");
        Serial.print("[TIME] Delay [ms]: ");
        Serial.println(delay_transm);
        Serial.print("[TIME] server clock [ms]: ");
        for (uint16_t i = 0; i < (len - 1); i++)
        {
            server_clock_ms += (packetbuffer[1 + i] - '0') * pow(10, (len - 1) - i - 1);
        }
        Serial.println(server_clock_ms);
        local_clock_ms = 1000 * ((local_clock) / 1000.0 - int((local_clock) / 1000.0));
        Serial.print("[TIME] local clock [ms]: ");
        Serial.println(local_clock_ms);
        new_time_offset = server_clock_ms - local_clock_ms;
        new_time_offset -= 1.04 * delay_transm; // it seems that there is a correlation between the offset and the delay
        if (new_time_offset < 0)
        {
            new_time_offset = 999 + new_time_offset;
        }
        Serial.print("[TIME] new offset: ");
        Serial.println(new_time_offset);
        if (local_time_offset == 1000) // first synchronisation
        {
            for (uint8_t i = 0; i < NB_OFFSETS; i++)
            {
                local_time_offsets[i] = new_time_offset;
                local_time_delays[i] = delay_transm;
            }
            ledMode = PULSE_MODE;
        }
        else
        {
            local_time_offsets[local_time_offset_idx] = new_time_offset;
            local_time_delays[local_time_offset_idx] = delay_transm;
            local_time_offset_idx = (local_time_offset_idx + 1) % NB_OFFSETS;
        }
        Serial.print("[TIME]  delays: ");
        for (uint8_t i = 0; i < NB_OFFSETS; i++)
        {
            Serial.print(local_time_delays[i]);
            Serial.print("|");
        }
        Serial.println("");
        Serial.print("[TIME] offsets: ");
        local_time_offset = 0;
        for (uint8_t i = 0; i < NB_OFFSETS; i++)
        {
            local_time_offset += local_time_offsets[i];
            Serial.print(local_time_offsets[i]);
            Serial.print("|");
        }
        local_time_offset = local_time_offset / NB_OFFSETS;
        led.setTimeOffset(local_time_offset);
        Serial.println(local_time_offset);
        break;
    case MODE:
        Serial.println("[SERVICE] MODE");
        ledMode = packetbuffer[1];
        Serial.print("[MODE] ");
        Serial.println(ledMode);
        break;
    case COLOR:
        Serial.println("[SERVICE] COLOR");
        r = packetbuffer[1];
        g = packetbuffer[2];
        b = packetbuffer[3];
        led.setRGB(r, g, b);
        Serial.print("[COLOR] ");
        Serial.print(r);
        Serial.print('-');
        Serial.print(g);
        Serial.print('-');
        Serial.print(b);
        break;
    case TEMPO:
        Serial.println("[SERVICE] TEMPO");
        tempo = packetbuffer[1];
        led.setTempo(tempo);
        Serial.print("[TEMPO] ");
        Serial.println(tempo);
        break;
    default:
        Serial.println("[SERVICE] unknown");
        delay(1000);
        break;
    }
}

void sendUART()
{
    char str[5] = "#-R!";
    str[1] = TIME;

    if (millis() - last_sent > 10000) // every 10 seconds
    {
        Serial.print("Local Time [ms]: ");
        Serial.println(global_millis());
        last_sent = millis();

        // Forward data from our peripheral to Mobile
        Serial.print("Sending: ");
        Serial.println(str);
        bleuart.print(str);
    }
}

void loop()
{
    // Reads UART to collect new messages
    readUART();

    sendUART();

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
    default:
        Serial.println("[MODE] unknown");
        delay(2000);
        break;
    }
}
