import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';

import { BLE } from '@ionic-native/ble';

import { MyApp } from './app.component';
import { TabsPage } from '../pages/tabs/tabs';
import { HomePage } from '../pages/home/home';
import { PeripheralsPage } from '../pages/peripherals/peripherals';
import { PopoverSettings } from '../pages/home/popover-settings';
import { BleServiceProvider } from '../providers/ble-service';

@NgModule({
  declarations: [
    MyApp,
    TabsPage,
    HomePage,
    PeripheralsPage,
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
    PopoverSettings
  ],
  providers: [
    StatusBar,
    SplashScreen,
    BLE,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    BleServiceProvider
  ]
})
export class AppModule {}
