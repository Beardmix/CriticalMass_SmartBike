import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';

import { BLE } from '@ionic-native/ble';
import { DeviceMotion } from '@ionic-native/device-motion';
import { BackgroundMode } from '@ionic-native/background-mode';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { BleServiceProvider } from '../providers/ble-service';

@NgModule({
  declarations: [
    MyApp,
    HomePage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    BLE,
    DeviceMotion,
    BackgroundMode,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    BleServiceProvider
  ]
})
export class AppModule {}
