import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';

import { LocationAccuracy } from '@ionic-native/location-accuracy';

import { BackgroundMode } from '@ionic-native/background-mode';


import { BLE } from '@ionic-native/ble';

import { MyApp } from './app.component';
import { TabsPage } from '../pages/tabs/tabs';
import { HomePage } from '../pages/home/home';
import { PeripheralsPage } from '../pages/peripherals/peripherals';
import { SingleUserPage } from '../pages/single_user/single_user';
import { PopoverSettings } from '../pages/peripherals/popover-settings';
import { BleServiceProvider } from '../providers/ble-service';
import { CommonServiceProvider } from '../providers/common-service';

@NgModule({
  declarations: [
    MyApp,
    TabsPage,
    HomePage,
    PeripheralsPage,
    SingleUserPage,
    PopoverSettings
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    TabsPage,
    HomePage,
    PeripheralsPage,
    SingleUserPage,
    PopoverSettings
  ],
  providers: [
    StatusBar,
    SplashScreen,
    BLE,
    BackgroundMode,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    BleServiceProvider,
    CommonServiceProvider,
    LocationAccuracy
  ]
})
export class AppModule {}
