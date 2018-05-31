import { Injectable } from '@angular/core';
import { BLE } from '@ionic-native/ble';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { Periph } from '../classes/periph';

const SERVICE_UUID_UART = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const CHARAC_UUID_UART_RX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
const CHARAC_UUID_UART_TX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';

const CHAR_START = '#'
const CHAR_END = '!'

const SERVICE_TIME_SERVER = 'S';
const SERVICE_TIME_SERVER_ADJUST = 'A';
const SERVICE_TIME_SERVER_REQUEST = 'R';

@Injectable()
export class BleServiceProvider {
  public listConnectedPeriphs: Periph[] = [];

  private intervalScanNewDevices_ID = -1;
  private intervalScanNewDevices_ms = 20000;
  private intervalSendServerTime_ID = -1;
  private intervalSendServerTime_ms = 4000;

  public newPeriphObs = new Subject();

  constructor(private ble: BLE) {
    console.log('Hello BleServiceProvider Provider');
  }

  private connect(periph: Periph) {
    this.ble.connect(periph.id).subscribe(
      data => {
        console.log("connected", data);
        this.listConnectedPeriphs.push(periph);
        // this.startNotificationUART(periph);
        this.newPeriphObs.next(periph);
      },
      error => {
        this.removePeriphFromList(this.listConnectedPeriphs, periph);
        console.log("error", error);
      },
      () => {
        console.log("finished");
      });
  }

  // connects to all devices that are compatible
  private scanAndConnectAll() {
    this.ble.scan([], 5000).subscribe(
      periph => {
        if (periph.name) {
          if (periph.name.indexOf("MyFahrrad") >= 0) // searches for MyFahrrad in the name of the device
          {
            console.log("scan", periph);
            this.connect(new Periph(periph.id, periph.name));
          }
        }
      },
      error => {
        console.log("scan_error", error);
      },
      () => {
        console.log("scan_finished");
      });
  }

  sendServerTime() {
    // If no interval has been set yet, start sending Time at regular intervals
    if (this.intervalSendServerTime_ID == -1) {
      this.intervalSendServerTime_ID = setInterval(() => {
        console.log("Sending server time to devices");
        var startTstamp = (new Date()).getTime(); // Time milliseconds
        let devicesTstamp = [0, 0, 0, 0, 0, 0, 0, 0]; // MAX 8 devices
        this.listConnectedPeriphs.forEach((periph, idx) => {
          this.writeBLE(periph, SERVICE_TIME_SERVER, "" + (startTstamp % 1000))
            .then(data => {
              devicesTstamp[idx] = (new Date()).getTime();
              // console.log("success", data);
            })
            .catch(err => {
              devicesTstamp[idx] = startTstamp;
              console.log("error", err);
            });
        });

        setTimeout(() => {
          console.log("Sending time correction to devices");
          this.listConnectedPeriphs.forEach((periph, idx) => {
            this.writeBLE(periph, SERVICE_TIME_SERVER_ADJUST, "" + (devicesTstamp[idx] - startTstamp))
              .then(data => {
                // console.log("success", data);
              })
              .catch(err => {
                console.log("error", err);
              });
            periph.globalTimerModulusMs = (devicesTstamp[idx] - startTstamp); // Read BLE device ms.
          });
        }, 500);
      }, this.intervalSendServerTime_ms);
    }
  }

  connectAll() {
    this.scanAndConnectAll();
    if (this.intervalScanNewDevices_ID == -1) {
      // this.sendServerTime();
      this.intervalScanNewDevices_ID = setInterval(() => {
        this.scanAndConnectAll();
      }, this.intervalScanNewDevices_ms);
    }
  }

  disconnectAll() {
    // remove interval to stop connecting to new devices
    if (this.intervalScanNewDevices_ID != -1) {
      clearTimeout(this.intervalScanNewDevices_ID);
      this.intervalScanNewDevices_ID = -1;
    }
    // remove interval to save battery
    if (this.intervalSendServerTime_ID != -1) {
      clearTimeout(this.intervalSendServerTime_ID);
      this.intervalSendServerTime_ID = -1;
    }
    this.listConnectedPeriphs.forEach((periph, idx) => {
      this.ble.disconnect(periph.id)
        .then(() => {
          this.removePeriphFromList(this.listConnectedPeriphs, periph);
        })
        .catch(() => {
          this.removePeriphFromList(this.listConnectedPeriphs, periph);
        })
    });
  }

  public writeBLE(periph: Periph, service: string, message: string) {
    var uart_message = CHAR_START + service + message + CHAR_END;

    return new Promise((resolve, reject) => {
      this.ble.isConnected(periph.id)
        .then(() => {
          return this.ble.write(periph.id, SERVICE_UUID_UART, CHARAC_UUID_UART_TX, this.stringToBytes(uart_message));
        })
        .then(data => {
          resolve(data);
        })
        .catch(err => {
          this.removePeriphFromList(this.listConnectedPeriphs, periph);
          reject(err);
        })
    });
  }

  startNotificationUART(periph: Periph) {
    this.ble.startNotification(periph.id, SERVICE_UUID_UART, CHARAC_UUID_UART_RX)
      .subscribe((data) => {
        // Data from the peripherique received
        var string_received = this.bytesToString(data);
        // The string received is valid
        if (this.stringRecValid(string_received)) {
          // The string received is about the time service
          if (this.isService(string_received, SERVICE_TIME_SERVER)) {
            var payload = this.getPayload(string_received);
            if (payload[0] == SERVICE_TIME_SERVER_REQUEST) {
              if (payload.length >= 3) {
                // this.zone.run(() => {
                periph.globalTimerModulusMs = payload.substr(1, 3); // Read BLE device ms.
                // });
              }
            }
          }
        }
        else {
          console.log("non supported message", string_received);
        }

      });
  }


  private getPayload(string_received): string {
    return string_received.substr(2, string_received.length - 2);
  }

  private isService(string_received, code_service): boolean {
    return string_received[1] == code_service;
  }

  private stringRecValid(string_received): boolean {
    return ((string_received[0] == CHAR_START) && (string_received[string_received.length - 1] == CHAR_END));
  }

  // ASCII only
  private stringToBytes(string) {
    var array = new Uint8Array(string.length);
    for (var i = 0, l = string.length; i < l; i++) {
      array[i] = string.charCodeAt(i);
    }
    console.log(string, array.buffer);

    return array.buffer;
  }

  // ASCII only
  private bytesToString(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
  }

  private removePeriphFromList(list, periph) {
    var index = -1;
    list.forEach((periphlist, idx) => {
      if (periph.id == periphlist.id) {
        index = idx;
      }
    });
    if (index >= 0) {
      list.splice(index, 1);
    }
  }

}
