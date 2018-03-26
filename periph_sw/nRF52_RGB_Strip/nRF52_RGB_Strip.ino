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

enum LEDMode
{
  OFF_MODE        = 0x00,
  ON_MODE         = 0x01,
  FLASH_MODE      = 0x02,
  PULSE_MODE      = 0x03
};

uint8_t scannedModeCurr = OFF_MODE;
uint8_t scannedModePrev = OFF_MODE; // Used so as not to break a running mode.

CtrlLED led;

// https://docs.mbed.com/docs/ble-intros/en/latest/Introduction/BLEInDepth/#advertising-and-connected-mode
// Only for one service and data, can be easily extended.
enum dataIndices: uint8_t
{
  LENGTH_IDX,
  TYPE_IDX,
  SERVICE_ID_2_OF_2_IDX,
  SERVICE_ID_1_OF_2_IDX,
  DATA_IDX
};

// UUID in little endian.
const uint8_t BLEUART_UUID_SMART_BIKE[] =
{
    0xFB, 0x34, 0x9B, 0x5F, 0x80, 0x00, 0x00, 0x80,
    0x00, 0x10, 0x00, 0x00, 0x16, 0x18, 0x00, 0x00
};

const uint8_t SMART_BIKE_SERVICE[] = { 0x18, 0x16 };
const uint8_t TIME_SERVICE[] = { 0x18, 0x05 };

void setup() 
{
  Serial.begin(115200);

  Serial.println("Bike scanning as Central (smartphone = Peripheral)");
  Serial.println("--------------------------------\n");

  // Initialize Bluefruit with maximum connections as Peripheral = 0, Central = 1
  // SRAM usage required by SoftDevice will increase dramatically with number of connections
  Bluefruit.begin();
  
  // Set max power. Accepted values are: -40, -30, -20, -16, -12, -8, -4, 0, 4
  Bluefruit.setTxPower(4);
  Bluefruit.setName("MyFahrrad2");

  // Start Central Scan
  Bluefruit.setConnLedInterval(250);
  //Bluefruit.Scanner.setRxCallback(scan_callback);
    //Bluefruit.Scanner.filterUuid(BLEUuid(UUID16_SVC_CYCLING_SPEED_AND_CADENCE), BLEUuid(BLEUART_UUID_SMART_BIKE)); // Need a UUID, not a service(?)
  //Bluefruit.Scanner.filterRssi(-72); // Evtl. filtering other BLE advertising packets from neighbors.
  //Bluefruit.Scanner.start(0);

  Serial.println("Scanning ...");

  led.configure(LED_BUILTIN, 9, 9);
  led.setRGB(255, 255, 255);

  // Set up and start advertising
  startAdv();
}

void startAdv(void)
{  
  // Advertising packet
  Bluefruit.Advertising.addFlags(BLE_GAP_ADV_FLAGS_LE_ONLY_GENERAL_DISC_MODE);
  Bluefruit.Advertising.addTxPower();
  Bluefruit.Advertising.addName();
  
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

#if 0
// todo: really needed? devide MAC might change.
// MAC is in little endian
String readMacAddress(uint8_t const buffer[], int len, char delim)
{
  String macAdd("");
  if (buffer == NULL || len == 0) return String("");
  for(int i=0; i<len; i++) { macAdd += String(buffer[len-1-i], HEX); }
  return macAdd;
}
#endif

void scan_callback(ble_gap_evt_adv_report_t* report)
{
  {
    if (report->dlen)
    {
      // Checking service type.
      if ((report->data[SERVICE_ID_1_OF_2_IDX] == SMART_BIKE_SERVICE[0]) && (report->data[SERVICE_ID_2_OF_2_IDX] == SMART_BIKE_SERVICE[1]))
      {
        scannedModeCurr = report->data[DATA_IDX];

        if (scannedModePrev != scannedModeCurr) {
          //Serial.println("Timestamp Addr              Rssi Data");
          //Serial.printf("%09d \r\n", millis());
          //Serial.println("MAC: " + macAdd);
          Serial.printf("RSSI: %d", report->rssi);
          Serial.println();
      
          // Raw data.
          Serial.printf("%14s %d bytes\n", "PAYLOAD", report->dlen);
          Serial.printBuffer(report->data, report->dlen, '-');
          Serial.println();
          
          Serial.println("[MODE CHANGED] Old: " + String(scannedModePrev) + " New: " + scannedModeCurr);
          scannedModePrev = scannedModeCurr;   
        }
      }
      else if ((report->data[SERVICE_ID_1_OF_2_IDX] == TIME_SERVICE[0]) && (report->data[SERVICE_ID_2_OF_2_IDX] == TIME_SERVICE[1]))
      {
        // Time Sync Service
        unsigned long time_offset = 0;
        unsigned char max_bytes = 4;
        for (unsigned int b = 0; b < max_bytes; b++)
        {
          time_offset += report->data[DATA_IDX + b] << 8 * (max_bytes - b - 1);
        }
        Serial.println(time_offset);
        led.setTimeOffset(time_offset);
      }
      else {
        Serial.println("[NOT EXECUTING] Service: 0x" + String(report->data[SERVICE_ID_1_OF_2_IDX], HEX) + String(report->data[SERVICE_ID_2_OF_2_IDX], HEX));
      }
    }
  }
}

void loop() 
{
  switch (scannedModeCurr)
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
      delay(1000);  
      break;  
  }
}
