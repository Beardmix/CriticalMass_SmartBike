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
  START = 0x23 // #
};

enum Services
{
  MODE = 0x4D, // M
  TIME = 0x54 // T
};

enum LEDMode
{
  OFF_MODE        = 0x00,
  ON_MODE         = 0x01,
  FLASH_MODE      = 0x02,
  PULSE_MODE      = 0x03
};

uint8_t ledMode = OFF_MODE;

CtrlLED led;
BLEUart bleuart;

// Function prototypes for packetparser.cpp
uint8_t readPacket (BLEUart *ble_uart, uint16_t timeout);
float   parsefloat (uint8_t *buffer);
void    printHex   (const uint8_t * data, const uint32_t numBytes);

// Packet buffer
extern uint8_t packetbuffer[];

void setup() 
{
  Serial.begin(115200);

  Serial.println("--- Peripheral---\n");

  Bluefruit.begin();
  Bluefruit.setTxPower(4); // Set max power. Accepted values are: -40, -30, -20, -16, -12, -8, -4, 0, 4
  Bluefruit.setName("MyFahrrad2");
  
  bleuart.begin();

  led.configure(LED_BUILTIN, 9, 9);
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
  Bluefruit.Advertising.setInterval(32, 244);    // in unit of 0.625 ms
  Bluefruit.Advertising.setFastTimeout(30);      // number of seconds in fast mode
  Bluefruit.Advertising.start(0);                // 0 = Don't stop advertising after n seconds  
}

void readUART()
{
  // Wait for new data to arrive
  uint8_t len = readPacket(&bleuart, 500);
  if (len == 0) return;
  printHex(packetbuffer, len);

  // Check that it is a valid command
  if(packetbuffer[0] == START)
  {
    // Switch to the correct service
    switch (packetbuffer[1])
    {
    case TIME:
      Serial.println("[SERVICE] TIME");
      break;
    case MODE:
      Serial.println("[SERVICE] MODE");
      ledMode = packetbuffer[2] - '0';
      Serial.print("[MODE] ");
      Serial.println(ledMode);
      break;
    default:
      Serial.println("[SERVICE] unknown");  
      delay(1000);  
      break; 
    }
  }

}

void loop() 
{
  // Reads UART to collect new messages
  readUART();
  
  switch (ledMode)
  {
    case OFF_MODE:
      led.switchOff();
      break;
    case ON_MODE:
      led.white();
      break;
    case FLASH_MODE:
      led.flash(100);
      delay(1000 - 100);
      break;
    case PULSE_MODE:
      led.pulse(1000);
      break;
    default:
      Serial.println("[MODE] unknown");  
      delay(2000);  
      break;  
  }
}

