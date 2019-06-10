
#include "ble_handler.h"

BLEUart BLE_Handler::bleuart = BLEUart();
Settings *BLE_Handler::p_settings = NULL;

void BLE_Handler::connect_callback(uint16_t conn_handle)
{
    // Get the reference to current connection
    BLEConnection* connection = Bluefruit.Connection(conn_handle);

    char central_name[32] = {0};
    connection->getPeerName(central_name, sizeof(central_name));

    Serial.println("+++ Connected +++");
    Serial.println(central_name);
}

void BLE_Handler::disconnect_callback(uint16_t conn_handle, uint8_t reason)
{
    Serial.println("--- Disconnected ---");
    Serial.println(conn_handle);
    Serial.println(reason);
}

void BLE_Handler::configure_ble(Settings *f_p_settings)
{
    BLE_Handler::p_settings = f_p_settings;
    // BSP configuration - bluefruit.h
    // - https://learn.adafruit.com/bluefruit-nrf52-feather-learning-guide/hathach-memory-map.
    // Functions affecting SoftDevice SRAM usage
    // Bluefruit.configUuid128Count(6); // Default is: 10.
    // Bluefruit.configPrphBandwidth(BANDWIDTH_LOW); // default is: BANDWIDTH_NORMAL.
    Bluefruit.printInfo();
    Bluefruit.setTxPower(4); // Set max power. Accepted values are: -40, -30, -20, -16, -12, -8, -4, 0, 4
    Bluefruit.setName(p_settings->device_name.c_str());
    Bluefruit.Periph.setConnectCallback(connect_callback);
    Bluefruit.Periph.setDisconnectCallback(disconnect_callback);

    // BLE UART.
    bleuart.begin();
}

void BLE_Handler::startAdv(void)
{
    Serial.println("startAdv");
    Bluefruit.Advertising.addFlags(BLE_GAP_ADV_FLAGS_LE_ONLY_GENERAL_DISC_MODE);
    Bluefruit.Advertising.addTxPower();
    Bluefruit.Advertising.addService(bleuart);
    Bluefruit.ScanResponse.addName();
    Bluefruit.ScanResponse.addManufacturerData("MF@CM", 5);

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

bool BLE_Handler::is_connected()
{
    return Bluefruit.connected() && bleuart.notifyEnabled();
}

int16_t BLE_Handler::readPacket(uint8_t *p_service, uint8_t *p_packetbuffer, uint8_t packetbuffer_size)
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

void BLE_Handler::sendPacket(Services service, String msg)
{
    char uart_payload[PAYLOAD_LENGTH + 1];
    String payload = String(char(CHAR_START)) + String(char(service)) + String(msg) + String(char(CHAR_END));

    if (payload.length() < PAYLOAD_LENGTH)
    {
        payload.toCharArray(uart_payload, PAYLOAD_LENGTH);
        // Serial.printf("Send payload: %s\n", uart_payload);
        bleuart.write(uart_payload, strlen(uart_payload) * sizeof(char));
        Serial.print("payload sent ");
        Serial.println(uart_payload);
    }
    else
    {
        Serial.println("[ERROR] Payload too long");
    }
}