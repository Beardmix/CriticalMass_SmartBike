#ifndef BLE_HANDLER_H
#define BLE_HANDLER_H

#include <bluefruit.h>
#include "eeprom_handler.h"

#define PAYLOAD_LENGTH 20

class BLE_Handler
{
  private:
    static BLEUart bleuart;
    static Settings *p_settings;

    enum SpecialChars
    {
        CHAR_START = '#',
        CHAR_END = '!'
    };

  public:
    enum Services
    {
        COLOR = 'C',
        MODE = 'M',
        TIME = 'S',
        TEMPO = 'T',
        DEV_SETTINGS = 'D',
        REVERSE = 'R'
    };

    BLE_Handler() {}

    void static configure_ble(Settings *f_p_settings);

    void static connect_callback(uint16_t conn_handle);

    void static disconnect_callback(uint16_t conn_handle, uint8_t reason);

    // Advertising packet
    void static startAdv(void);

    bool static is_connected();

    /**
     * Reads incomming messages and parses them for correctness checks
     * /return packet_length The length of the payload
     */
    int16_t static readPacket(uint8_t *p_service, uint8_t *p_packetbuffer, uint8_t packetbuffer_size);

    // Send data from peripheral to master.
    void static sendPacket(Services service, String msg);
};

#endif