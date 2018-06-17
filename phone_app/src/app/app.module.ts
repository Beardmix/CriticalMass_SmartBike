import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';

import { LocationAccuracy } from '@ionic-native/location-accuracy';

import { BLE } from '@ionic-native/ble';

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
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    BleServiceProvider,
    LocationAccuracy
  ]
})
export class AppModule {}
