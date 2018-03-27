/* Based on Adafruit's
* https://github.com/adafruit/Adafruit_nRF52_Arduino/blob/master/libraries/Bluefruit52Lib/examples/Peripheral/controller/packetParser.cpp
*/

#include <string.h>
#include <Arduino.h>
#include <bluefruit.h>


#define PACKET_ACC_LEN                  (15)
#define PACKET_GYRO_LEN                 (15)
#define PACKET_MAG_LEN                  (15)
#define PACKET_QUAT_LEN                 (19)
#define PACKET_BUTTON_LEN               (5)
#define PACKET_COLOR_LEN                (6)
#define PACKET_LOCATION_LEN             (15)

//    READ_BUFSIZE            Size of the read buffer for incoming packets
#define READ_BUFSIZE                    (20)


/* Buffer to hold incoming characters */
uint8_t packetbuffer[READ_BUFSIZE+1];

/**************************************************************************/
/*!
    @brief  Casts the four bytes at the specified address to a float
*/
/**************************************************************************/
float parsefloat(uint8_t *buffer) 
{
  float f;
  memcpy(&f, buffer, 4);
  return f;
}

/**************************************************************************/
/*! 
    @brief  Prints a hexadecimal value in plain characters
    @param  data      Pointer to the byte data
    @param  numBytes  Data length in bytes
*/
/**************************************************************************/
void printHex(const uint8_t * data, const uint32_t numBytes)
{
  uint32_t szPos;
  for (szPos=0; szPos < numBytes; szPos++) 
  {
    Serial.print(F("0x"));
    // Append leading 0 for small values
    if (data[szPos] <= 0xF)
    {
      Serial.print(F("0"));
      Serial.print(data[szPos] & 0xf, HEX);
    }
    else
    {
      Serial.print(data[szPos] & 0xff, HEX);
    }
    // Add a trailing space if appropriate
    if ((numBytes > 1) && (szPos != numBytes - 1))
    {
      Serial.print(F(" "));
    }
  }
  Serial.println();
}

/**************************************************************************/
/*!
    @brief  Waits for incoming data and parses it
*/
/**************************************************************************/
uint8_t readPacket(BLEUart *ble_uart) 
{
  static uint16_t replyidx = -1;
  boolean packet_complete = false;

  memset(packetbuffer, 0, READ_BUFSIZE);

  while (ble_uart->available()) {
    char c =  ble_uart->read();
    if(c == '#')
    {
      replyidx = 0;
      break;
    }
    else if (replyidx == -1)
    {
      break;
    }
    if(c == '!')
    {
      packet_complete = true;
      replyidx = -1;
      break;
    }
    packetbuffer[replyidx] = c;
    replyidx++;
  }
  
  if(packet_complete == true)
  {
    packetbuffer[replyidx] = 0;  // null term to close the packet - used only to display in the terminal
    return replyidx;
  }
  else
  {
    return 0;
  }
}
