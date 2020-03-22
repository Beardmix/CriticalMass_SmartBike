import { Component } from '@angular/core';

import { ColorClass } from '../ColorClass/colorClass';
import { BleService, BLE_SERVICES } from '../BleService/ble.service';
import { ModeClass } from '../ModeClass/mode-class';
import { PeriphClass } from '../PeriphClass/periph-class';

import { AngularFireDatabase } from '@angular/fire/database';

@Component({
  selector: 'app-tabHome',
  templateUrl: 'tabHome.page.html',
  styleUrls: ['./tabHome.page.scss']
})
export class TabHomePage {
  tempo: number = 60;
  hue = 0;
  rgb = new ColorClass(255, 255, 255, "white");
  mode = "PULSE";
  isAuto: boolean = false;
  isControlling: boolean = false;
  isReversed = false; // Strip logical direction.
  isCloud = true;
  private mode_cloud_key: string = "MyGroup";
  private automodeIntervalId = null;
  private automodeInterval_s = 2;
  private NB_TAPS = 10;
  private taps_idx = 0;
  private taps = new Array(this.NB_TAPS);
  colorsPresetsList = ColorClass.colorsPresetsList;

  constructor(private bleService: BleService,
              public firebase: AngularFireDatabase) {
    this.bleService.newPeriphObs.subscribe(
      value => {
        this.callbackNewPeriph(value);
      },
      error => {
        console.log('Observer: onError: ', error)
      },
      () => {
        console.log('Observer: onCompleted');
      }
    );
    var starCountRef = this.firebase.database.ref('groups/' + this.mode_cloud_key);
    var ref = this;
    // Get the data on a post that has changed
    starCountRef.on("child_changed", function(snapshot) {
      var value = snapshot.val();
      console.log("The updated mode is ", value);
      if (ref.isCloud) {
        ref.cloudEvent(value);
      }
    });
    starCountRef.on('child_added', function (snapshot) {
      // ref.mode_cloud_key = snapshot.key;
      let value = snapshot.val();
      console.log("The added mode is ", value);
      if (ref.isCloud) {
        ref.cloudEvent(value);
      }
    });
}

listConnectedPeriphs() {
  return this.bleService.listConnectedPeriphs;
}

callbackNewPeriph(periph: any) {
  this.changeTempo(periph);
  this.changeColor(periph);
  this.changeMode(periph);
  this.requestSettings(periph);
}

cloudEvent(event) {
  var now = new Date().getTime();
  var delay_ms = event.time - now;
  
  if (delay_ms < 0) {
      delay_ms = 0; // it means that we already missed the event date, but we sync with the last received.
  }
  
  // Update local variables with Cloud data.
  this.mode = event.mode;
  this.rgb.setRGB(event.rgbi[0], event.rgbi[1], event.rgbi[2]);
  this.rgb.setIntensity(event.rgbi[3]);
  this.rgb.setCssClassName(event.cssClassName);
  this.tempo = event.tempo;
  
  var ref = this;
  window.setTimeout(() => {
    // console.log("Update All Peripherals");            
    ref.bleService.listConnectedPeriphs.forEach(periph => {
      // console.log("Update peripheral: ", periph.id);  
      ref.changeMode(periph);
      ref.changeColor(periph);
      ref.changeTempo(periph);
    });
  }, delay_ms);
}

showColorPicker() {
  return ModeClass.list[this.mode].color_picker;
}

showIntensityPicker() {
  return ModeClass.list[this.mode].intensity_picker;
}

showTempo() {
  return ModeClass.list[this.mode].tempo_picker;
}

cloudToggle() {
  if (this.isCloud) {
    console.log("Disconnecting from the Cloud");
    this.isCloud = false;
  }
  else {
    console.log("Connecting to the cloud");
    this.isCloud = true;
  }
}

sendEvent() {
  var time = new Date().getTime();
  time = time + 500;  // offset of 500ms for synchronisation
  
  var json = {
    "time": time, // ISO format: "2018-09-16T09:48:16.388Z"
    "mode": this.mode,
    "rgbi": [this.rgb.r, this.rgb.g, this.rgb.b, this.rgb.i],
    "cssClassName": this.rgb.cssClassName,
    "tempo": this.tempo
  }
  console.log(json);
  
  var updates = {};
  updates['groups/' + this.mode_cloud_key + '/last_mode/'] = json;
  this.firebase.database.ref().update(updates);
}

modeChanged(mode) {
  console.log("Mode changed to " + mode);
  this.mode = mode;
  
  if (this.isCloud) {
    this.sendEvent();
  } else {
    this.bleService.listConnectedPeriphs.forEach(periph => {
      this.changeMode(periph);
    });
  }
}

setColor(in_color: ColorClass) {
  this.rgb.setRGB(in_color.r, in_color.g, in_color.b);
  this.rgb.setCssClassName(in_color.cssClassName);

  if (this.isCloud) {
    this.sendEvent();
  } else {
    this.bleService.listConnectedPeriphs.forEach(periph => {
      this.changeColor(periph);
    });
  }
}

setIntensity(intensity: number) {
  this.rgb.setIntensity(intensity);

  if (this.isCloud) {
    this.sendEvent();
  } else {
    this.bleService.listConnectedPeriphs.forEach(periph => {
      this.changeColor(periph);
    });
  }
}

isColorSelected(color: ColorClass) {
  return ((color.r == this.rgb.r) && (color.g == this.rgb.g) && (color.b == this.rgb.b));
}

isIntensitySelected(intensity: number) {
  return (intensity == this.rgb.i) ? "4px solid #0096ff" : "4px solid #f4f4f4";
}

automatic() {
  if (this.isAuto && (this.automodeIntervalId == null)) {
    var ref = this;
    this.automodeIntervalId = window.setInterval(() => {
      var modes = Object.keys(Object.keys(ModeClass.list).reduce(function (filtered, key) {
      if (ModeClass.list[key].auto_picker == true) filtered[key] = ModeClass.list[key];
        return filtered;
      }, {}));
      var idx_color = Math.round(Math.random() * (ref.colorsPresetsList.length - 1));
      ref.setColor(ref.colorsPresetsList[idx_color]);
      var idx = Math.round(Math.random() * (modes.length - 1));
      ref.modeChanged(modes[idx]);
    }, this.automodeInterval_s * 1000);
  } else {
    if (this.automodeIntervalId != null) {
      window.clearInterval(this.automodeIntervalId);
      this.automodeIntervalId = null;
    }
  }
}

setAutomodeInterval() {
  window.clearInterval(this.automodeIntervalId);
  this.automodeIntervalId = null;
  this.automatic();
}

// Reverse the strip logical direction.
reverse() {
  console.log("Strip reversed: " + this.isReversed.toString());
  this.bleService.listConnectedPeriphs.forEach(periph => {
  this.bleService.writeBLE(periph, BLE_SERVICES.REVERSE, this.isReversed ? "1" : "0")
    .then(data => {
      console.log("Strip direction reversed.", data);
    })
    .catch(err => {
      console.log("! Strip direction could not be reversed.", err);
    })
  });
}

isModeSelected(mode: string) {
  return (mode == this.mode) ? "4px solid #0096ff" : "4px solid #f4f4f4";
}

setTempo() {
  console.log("changeTempo", this.tempo);

  if (this.isCloud) {
    this.sendEvent();
  } else {
    this.bleService.listConnectedPeriphs.forEach(periph => {
      this.changeTempo(periph);
    });
  }
}

tapTempo() {
  var current_millis = (new Date()).getTime();
  this.bleService.time_offset_cue = current_millis;
  this.taps[this.taps_idx] = current_millis;
  this.taps_idx = (this.taps_idx + 1) % this.NB_TAPS;
  var bpms = [];

  for (var i = 0; i < this.NB_TAPS; i++) {
    var prev_tap = this.taps[(i > 0) ? (i - 1) : (this.NB_TAPS - 1)];
    var delta_ms = this.taps[i] - prev_tap;

    if (delta_ms > 0 && (current_millis - this.taps[i]) < 60000) {
      var beats_elapsed = Math.round(this.tempo * delta_ms / (60 * 1000));
      var click_predicted_offset_ms = prev_tap + beats_elapsed * (60 * 1000) / this.tempo;
      var error_rel = (click_predicted_offset_ms - this.taps[i]) / delta_ms;
      var bpm = (error_rel + 1) * this.tempo;
      bpms.push(bpm);
    }
  }

  if (bpms.length >= 3) {
    var average = 0;
    bpms.forEach((bpm) => {
      average += bpm;
    })
    average = average / bpms.length;
    average = Math.round(average);
    this.tempo = average;
  }
}

// Attribute a different color from colorsPresetsList[] to each Peripheral.
// If there are Peripherals than preset colors, attributed colors are not unique.
attributeRdmColors() {
  // Fisher-Yates Shuffle over [0..presets]
  let shuffled = Array.from(Array(this.colorsPresetsList.length - 1).keys());
  let cnt = shuffled.length;
  while (cnt > 0) {
  let index = Math.floor(Math.random() * cnt);
  cnt--;
  let temp = shuffled[cnt];
  shuffled[cnt] = shuffled[index];
  shuffled[index] = temp;
  }
  // Send each Peripheral a different color, starting from 0 and looping over.
  let colorIdx = 0;
  this.bleService.listConnectedPeriphs.forEach(periph => {
    this.bleService.writeBLE(periph,
                             BLE_SERVICES.COLOR,
                             String.fromCharCode(this.colorsPresetsList[shuffled[colorIdx]].r,
                             this.colorsPresetsList[shuffled[colorIdx]].g,
                             this.colorsPresetsList[shuffled[colorIdx]].b,
                             this.rgb.i))
      .then(data => {
        console.log("success", data);
      })
      .catch(err => {
        console.log("error", err);
      })
      colorIdx++;
      colorIdx %= shuffled.length;
    }
  );
}

requestSettings(periph: PeriphClass) {
  console.log("requestSettings");
  // check again that only one device is connected
  this.bleService.writeBLE(periph, BLE_SERVICES.DEV_SETTINGS, "?")
    .then(data => {
      console.log("success", data);
    })
    .catch(err => {
      console.log("error", err);
    })
}

private changeTempo(periph: PeriphClass) {
  this.bleService.writeBLE(periph, BLE_SERVICES.TEMPO, String.fromCharCode(this.tempo))
    .then(data => {
      console.log("success", data);
    })
    .catch(err => {
      console.log("error", err);
    })
}

private changeColor(periph: PeriphClass) {
  this.bleService.writeBLE(periph,
                           BLE_SERVICES.COLOR,
                           String.fromCharCode(this.rgb.r, this.rgb.g, this.rgb.b, this.rgb.i))
    .then(data => {
      console.log("success", data);
    })
    .catch(err => {
      console.log("error", err);
    })
}

private changeMode(periph: PeriphClass) {
  this.bleService.writeBLE(periph, BLE_SERVICES.MODE, ModeClass.list[this.mode].val)
    .then(data => {
      console.log("success", data);
    })
    .catch(err => {
      console.log("error", err);
    })
}
}
