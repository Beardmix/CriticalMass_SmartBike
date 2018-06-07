#include <Arduino.h>
#include <bluefruit.h>
#include "led_lib.h"
/* Need to undefine min and max in order to compile <String>. */
#undef max
#undef min
#include <String>

#define READ_BUFSIZE (20) /* Size of the read buffer for incoming packets */
#define PAYLOAD_LENGTH 10

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
unsigned long server_clock_adjust_ms = 0xFFFF;
    
CtrlLED led(numpixels, pinData, pinDebug);
BLEUart bleuart;

void setup()
{
    Serial.begin(115200);

    Serial.println("--- Peripheral---\n");

    // BSP configuration - bluefruit.h
    // - https://learn.adafruit.com/bluefruit-nrf52-feather-learning-guide/hathach-memory-map.
    // Functions affecting SoftDevice SRAM usage
    // Bluefruit.configUuid128Count(6); // Default is: 10.
    // Bluefruit.configPrphBandwidth(BANDWIDTH_LOW); // default is: BANDWIDTH_NORMAL.
    Bluefruit.begin(1, 0);
    Bluefruit.printInfo();
    Bluefruit.setTxPower(4); // Set max power. Accepted values are: -40, -30, -20, -16, -12, -8, -4, 0, 4
    Bluefruit.setName("MyFahrrad2");
    Bluefruit.setConnectCallback(connect_callback);
    // Bluefruit.setDisconnectCallback(disconnect_callback);

    // BLE UART.
    bleuart.begin();

    // Set up and start advertising
    startAdv();
    
    // Initialise the LED strip.
    led.configure();
}

void connect_callback(uint16_t conn_handle)
{
    char central_name[32] = { 0 };
    Bluefruit.Gap.getPeerName(conn_handle, central_name, sizeof(central_name));
    Serial.println("+++ Connected +++");
    Serial.println(central_name);
}
 
void disconnect_callback(uint16_t conn_handle, uint8_t reason)
{
    Serial.println("--- Disconnected ---");
    Serial.println(conn_handle);
    Serial.println(reason);
}

// Advertising packet
void startAdv(void)
{
    Serial.println("startAdv");
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

/**************************************************************************/
/*!
    @brief  Waits for incoming data and parses it
*/
/**************************************************************************/
uint16_t readPacket(BLEUart *ble_uart, uint8_t* p_packetbuffer, uint8_t packetbuffer_size)
{
    uint16_t packet_length = 0;
    
    memset(p_packetbuffer, 0, packetbuffer_size);

    if (ble_uart->available())
    {
        packet_length = ble_uart->read(p_packetbuffer, packetbuffer_size);
    
        // Verify starting and ending characters.
        if (!(('#' == char(p_packetbuffer[0])) && ('!' == char(p_packetbuffer[packet_length - 1]))))
        {
            Serial.println("Invalid packet");
            packet_length = 0;
        }

        // todo: implement checksum verification.
    }
    
    return packet_length;
}

void readUART(uint8_t* const p_ledMode)
{
    uint8_t r = 0;
    uint8_t g = 0;
    uint8_t b = 0;
    uint8_t tempo = 0;
    /* Buffer to hold incoming characters */
    uint8_t packetbuffer[READ_BUFSIZE + 1];
    // Wait for new data to arrive
    uint16_t len = readPacket(&bleuart, packetbuffer, READ_BUFSIZE);
    if (len == 0)
        return;

    // Switch to the correct service
    switch (packetbuffer[1])
    {
    case TIME:
        // Serial.println("TIME");
        server_clock_ms = 0;
        for (uint16_t i = 0; i < 3; i++)
        {
            server_clock_ms += (packetbuffer[2 + i]) * pow(10, 2 - i);
        }
        local_time_offset = server_clock_ms;
        // Serial.println(local_time_offset);
        break;
    case TIME_ADJUST:    
        // Serial.println("TIME"_ADJUST);
       server_clock_adjust_ms = 0;
       for (uint16_t i = 0; i < 3; i++)
       {
           server_clock_adjust_ms += (packetbuffer[2 + i]) * pow(10, 2 - i);
       }
       
       local_time_offset += server_clock_adjust_ms;
       led.setTimeOffset(local_time_offset);
       
       sendUART(TIME, String(led.getGlobalTimerModulusMs() % 10) +
                      String((led.getGlobalTimerModulusMs() / 10) % 10) +
                      String((led.getGlobalTimerModulusMs() / 100) % 10));
       break;
    case MODE:
        // Serial.println("MODE");
        *p_ledMode = packetbuffer[2];
        sendUART(MODE, String(*p_ledMode));
        break;
    case COLOR:
        // Serial.println("COLOR");
        r = packetbuffer[2];
        g = packetbuffer[3];
        b = packetbuffer[4];
        led.setRGB(r, g, b);
        sendUART(COLOR, String(r) + String(g) + String(b));
        break;
    case TEMPO:
        // Serial.println("TEMPO");
        tempo = packetbuffer[2];
        led.setTempo(tempo);
        sendUART(TEMPO, String(tempo));
        break;
    default:
        Serial.println("[SERVICE] unknown");
        Serial.println(packetbuffer[2]);
        // delay(1000);
        break;
    }
}

// Send data from peripheral to master.
void sendUART(Services service, String msg)
{
  // todo: to be implemented.
}

void loop()
{
    static uint8_t ledMode = FLASH_MODE;
    
    if (Bluefruit.connected() && bleuart.notifyEnabled())
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
