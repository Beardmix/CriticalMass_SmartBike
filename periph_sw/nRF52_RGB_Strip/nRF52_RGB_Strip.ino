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
    TIME_ADJUST = 'A',
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

bool debug = true;

const int pinDebug = LED_BUILTIN;
const int pinData = 15;
const int numpixels = 48;

uint8_t ledMode = FLASH_MODE;
unsigned long last_sent = 0;
long local_time_offset = 0;
unsigned long server_clock_ms = 0;
unsigned long server_clock_adjust_ms = 0xFFFF;
    
CtrlLED led;
BLEUart bleuart;

// Function prototypes for packetparser.cpp
uint16_t readPacket(BLEUart *ble_uart);
float parsefloat(uint8_t *buffer);
void printHex(const uint8_t *data, const uint32_t numBytes);

// Packet buffer
extern uint8_t packetbuffer[];

void setup()
{
    Serial.begin(115200);

    //Serial.println("--- Peripheral---\n");

    Bluefruit.begin();
    Bluefruit.setTxPower(4); // Set max power. Accepted values are: -40, -30, -20, -16, -12, -8, -4, 0, 4
    Bluefruit.setName("MyFahrrad2");

    bleuart.begin();

    led.configure(numpixels, pinData, pinDebug);
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
        server_clock_ms = 0;
        for (uint16_t i = 0; i < (len - 1); i++)
        {
            server_clock_ms += (packetbuffer[1 + i] - '0') * pow(10, (len - 1) - i - 1);
        }
        local_time_offset = server_clock_ms;
        break;
    case TIME_ADJUST:
        // First sync.
        if (0xFFFF == server_clock_adjust_ms)
        {
            ledMode = PULSE_MODE;
        }
    
        server_clock_adjust_ms = 0;
        for (uint16_t i = 0; i < (len - 1); i++)
        {
            server_clock_adjust_ms += (packetbuffer[1 + i] - '0') * pow(10, (len - 1) - i - 1);
        }
        
        local_time_offset += server_clock_adjust_ms;
        led.setTimeOffset(local_time_offset);
        break;
    case MODE:
        ledMode = packetbuffer[1];
        break;
    case COLOR:
        r = packetbuffer[1];
        g = packetbuffer[2];
        b = packetbuffer[3];
        led.setRGB(r, g, b);
        break;
    case TEMPO:
        tempo = packetbuffer[1];
        led.setTempo(tempo);
        break;
    default:
        Serial.println("[SERVICE] unknown");
        delay(1000);
        break;
    }
}

void sendUART()
{
    char payload[8] = "#-R000!";
    payload[1] = TIME;

    if (millis() - last_sent > 10000 || last_sent == 0) // every 10 seconds
    {
        last_sent = millis();
        int globalTimerModulusMs = led.getGlobalTimerModulusMs() % 1000;
        
        // Write %1000 ms.
        int u = globalTimerModulusMs % 10;
        int d = (globalTimerModulusMs / 10) % 10;
        int c = (globalTimerModulusMs / 100) % 10;
        
        payload[3] = c + '0';
        payload[4] = d + '0';
        payload[5] = u + '0';
        
        // Forward data from our peripheral to Mobile
        //Serial.print("Sending: ");
        //Serial.println(payload);
        bleuart.print(payload);
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
        //Serial.println("[MODE] unknown");
        delay(2000);
        break;
    }

    // led.theaterchase();
}
