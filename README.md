# CriticalMass_SmartBike
RGB Lights controled via Bluetooth.

# Android App
https://play.google.com/store/apps/details?id=de.schnitzellab.criticalmass_sb

# Beta testers
https://play.google.com/apps/internaltest/4700354087248222113

# Install on MAC
## BSP Installation

There are two methods that you can use to install this BSP. We highly recommend the first option unless you wish to participate in active development of this codebase via Github.

### Recommended: Adafruit nRF52 BSP via the Arduino Board Manager

 1. [Download and install the Arduino IDE](https://www.arduino.cc/en/Main/Software) (At least v1.6.12)
 2. Start the Arduino IDE
 3. Go into Preferences
 4. Add https://www.adafruit.com/package_adafruit_index.json as an 'Additional Board Manager URL'
 5. Restart the Arduino IDE
 6. Open the Boards Manager from the Tools -> Board menu and install 'Adafruit nRF52 by Adafruit'
 7. Once the BSP is installed, select 'Adafruit Bluefruit nRF52 Feather' from the Tools -> Board menu, which will update your system config to use the right compiler and settings for the nRF52.

### nrfutil

Check you Python Install due to old version from Python as a basics on MAC OS Systems the TLS 1.2 is not working but required : more details [on stackoverflow](https://stackoverflow.com/questions/16370583/pip-issue-installing-almost-any-library/16370731)
Install Python directly from official python installer for Mac

The Adafruit nRF52 BSP includes a [python wrapper](https://github.com/NordicSemiconductor/pc-nrfutil)
for Nordic's `nrfutil`, which is used to flash boards. Go into the BSP folder
(`hardware/Adafruit/Adafruit_nRF52_Arduino/tools/nrfutil-0.5.2`), and run the following to make
this available to the Arduino IDE:

```
$ cd ~/Library/Arduino15/packages/adafruit/hardware/nrf52
$ cd tools/nrfutil-0.5.2
$ sudo pip install -r requirements.txt
$ sudo python setup.py install
$ sudo ln -s /opt/local/Library/Frameworks/Python.framework/Versions/2.7/bin/nrfutil /usr/local/bin/nrfutil
```

**Nota** : Don't install nrfutil from the pip package (ex. `sudo pip install nrfutil`). The
latest nrfutil does not support DFU via Serial, and you should install the local copy of 0.5.2
included with the BSP via the `python setup.py install` command above.


## ionic installation

ionic is a SW that will compile the App for your phone

### Install Node.js

Download the 'Recommanded for all users SW' : https://nodejs.org/en/
Make sure that /usr/local/bin is in your $PATH
Don't forget to get admin rights : 
$ npm install -g ionic cordova
or
$ sudo npm install -g ionic cordova

### Install Android Studio or Only Line Command

Download directly from Google : https://developer.android.com/studio/#downloads
Start a new project app and install Android SDK Tools
Create a Android Emulator and Start the New app on it

- or - 

Download the Command line tools only from https://developer.android.com/studio/#downloads

Extract the zip in a folder:
I used : ~/android-sdk

Install the SDK 26:
$ ~/android-sdk/bin/sdkmanager "platforms;android-26" 


### Get Gradle

Install Gradle : https://gradle.org/install/

Easy way on mac:
$ brew install gradle

### Configure Xcode with your AppleID

Start Xcode > Preferences
In the tab Account you should connect you AppleID
You should get at least a 'Free' Role
Click on 'view details' at the bottom of the Account tab
Download a iOS Development signing ID

Run a production build of your app with ionic cordova build ios --prod
Open the .xcodeproj file in platforms/ios/ in Xcode
Connect your phone via USB and select it as the run target
Click the play button in Xcode to try to run your app

The App won't compile because you didn't signed it

Click the ‘Fix Issue’ button, then select your ‘Personal Team’ profile.

### Compile the App for you phone

$ ionic cordova run android --device
$ ionic cordova run ios --device

nota: the parameter '--device' is to start the build and run on a device if no device connected or detected, it won't try anything else and just quit

### Activate developer mode on your Android

Go to your parameter > About your phone
Click a few times on the Build Version

### Trust your signature on your iOS device

Open the ‘Settings’ app on your iOS device
Go to ‘General > Device Management’. You’ll see the email address associated with the Apple ID or Apple Developer account you used to code sign your app.
Tap the email address
Tap ‘Trust <your_email>’

