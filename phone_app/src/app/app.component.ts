import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { TabsPage } from '../pages/tabs/tabs';

import * as firebase from 'firebase';

const config = {
    apiKey: "AIzaSyCbd5CsJn2oZv2mWXX3wSqzRNS_J4FVqhQ",
    authDomain: "criticalmass-smartbike.firebaseapp.com",
    databaseURL: "https://criticalmass-smartbike.firebaseio.com",
    projectId: "criticalmass-smartbike",
    storageBucket: "criticalmass-smartbike.appspot.com",
    messagingSenderId: "604346175605"
  };

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage:any = TabsPage;

  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      splashScreen.hide();
    });
    firebase.initializeApp(config);
  }
}

