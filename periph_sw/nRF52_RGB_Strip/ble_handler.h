#ifndef BLE_HANDLER_H
#define BLE_HANDLER_H

#include <bluefruit.h>

#define PAYLOAD_LENGTH 20

class BLE_Handler
{
  private:
    BLEUart bleuart;

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
        DEV_SETTINGS = 'D'
    };

    BLE_Handler() {}

    void configure_ble(const char* name)
    {
        // BSP configuration - bluefruit.h
        // - https://learn.adafruit.com/bluefruit-nrf52-feather-learning-guide/hathach-memory-map.
        // Functions affecting SoftDevice SRAM usage
        // Bluefruit.configUuid128Count(6); // Default is: 10.
        // Bluefruit.configPrphBandwidth(BANDWIDTH_LOW); // default is: BANDWIDTH_NORMAL.
        Bluefruit.printInfo();
        Bluefruit.setTxPower(4); // Set max power. Accepted values are: -40, -30, -20, -16, -12, -8, -4, 0, 4
        Bluefruit.setName(name);
        Bluefruit.setConnectCallback(connect_callback);
        // Bluefruit.setDisconnectCallback(disconnect_callback);

        // BLE UART.
        bleuart.begin();
    }

    void static connect_callback(uint16_t conn_handle)
    {
        char central_name[32] = {0};
        Bluefruit.Gap.getPeerName(conn_handle, central_name, sizeof(central_name));
        Serial.println("+++ Connected +++");
        Serial.println(central_name);
    }

    void static disconnect_callback(uint16_t conn_handle, uint8_t reason)
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

    bool is_connected()
    {
        return Bluefruit.connected() && bleuart.notifyEnabled();
    }

    /**
     * Reads incomming messages and parses them for correctness checks
     * /return packet_length The length of the payload
     */
    int16_t readPacket(uint8_t *p_service, uint8_t *p_packetbuffer, uint8_t packetbuffer_size)
    {
        int16_t packet_length = -1;

        memset(p_packetbuffer, 0, packetbuffer_size);

        if (bleuart.available())
        {
            packet_length = bleuart.read(p_packetbuffer, packetbuffer_size);

            // Verify starting and ending characters.
            if (packet_length < 3 || !(('#' == char(p_packetbuffer[0])) && ('!' == char(p_packetbuffer[packet_length - 1]))))
            {
                Serial.println("Invalid packet");
                packet_length = -1;
            }
            else
            {
                bool checksum_correct = true;

                // todo: implement checksum verification here

                if (checksum_correct)
                {
                    (*p_service) = p_packetbuffer[1];

                    // remove the special characters from the packet to keep only the payload
                    for (int i = 0; i < packet_length - 3; ++i)
                    {
                        p_packetbuffer[i] = p_packetbuffer[i + 2];
                    }
                    packet_length = packet_length - 3;
                }
            }
        }

        return packet_length;
    }

    // Send data from peripheral to master.
    void sendPacket(Services service, String msg)
    {
        char uart_payload[PAYLOAD_LENGTH + 1];
        String payload = String(char(CHAR_START)) + String(char(service)) + String(msg) + String(char(CHAR_END));

        if (payload.length() < PAYLOAD_LENGTH)
        {
            payload.toCharArray(uart_payload, PAYLOAD_LENGTH);
            // Serial.printf("Send payload: %s\n", uart_payload);
            bleuart.write(uart_payload, strlen(uart_payload) * sizeof(char));
        }
        else
        {
            Serial.println("[ERROR] Payload too long");
        }
    }
};

#endif