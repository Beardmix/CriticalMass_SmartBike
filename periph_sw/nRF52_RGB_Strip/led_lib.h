#ifndef LED_H
#define LED_H

class CtrlLED {
public:
  int ledRed;
  int ledGreen;
  int ledBlue;

  int valRed;
  int valGreen;
  int valBlue;

  unsigned long time_offset = 0;
  
  void configure(int pinRed, int pinGreen, int pinBlue) {
    ledRed = pinRed;
    ledGreen = pinGreen;
    ledBlue = pinBlue;
    // declare the ledPin as an OUTPUT:
    pinMode(ledRed, OUTPUT);
    pinMode(ledGreen, OUTPUT);
    pinMode(ledBlue, OUTPUT);

    valRed = 0;
    valGreen = 0;
    valBlue = 0;
    
    white();
    delay(1000);
    switchOff();
    delay(1000);
  }

  void randomColor()
  {
    setRGB(random(256), random(256), random(256));
  }

  void pulse(float period_ms)
  {
    int intensity = (sin(3.1415f * (float)(global_millis()) / period_ms) + 1.0f) * 127;
    int valR = 0;
    int valG = 0;
    int valB = 0;
    
    valR = map(intensity, 0, 255, 0, this->valRed);
    valG = map(intensity, 0, 255, 0, this->valGreen);
    valB = map(intensity, 0, 255, 0, this->valBlue);

    analogWrite(ledRed, valR);
    analogWrite(ledGreen, valG);
    analogWrite(ledBlue, valB);
  }

  void flash(float max_duration)
  {
    long start_time = global_millis();
    int valR = 0;
    int valG = 0;
    int valB = 0;
    int intensity = 0;

    while(global_millis() - start_time < max_duration)
    {
      intensity = (sin(3.1415f * (float)(global_millis() - start_time) / max_duration)) * 255;
      
      valR = map(intensity, 0, 255, 0, this->valRed);
      valG = map(intensity, 0, 255, 0, this->valGreen);
      valB = map(intensity, 0, 255, 0, this->valBlue);
  
      analogWrite(ledRed, valR);
      analogWrite(ledGreen, valG);
      analogWrite(ledBlue, valB);
    }
    switchOff();
  }

  void lightLED()
  {
    analogWrite(ledRed, valRed);
    analogWrite(ledGreen, valGreen);
    analogWrite(ledBlue, valBlue);
  }
  
  void setRGB(int valRed, int valGreen, int valBlue)
  {
    this->valRed = valRed;
    this->valGreen = valGreen;
    this->valBlue = valBlue;
  }
  
  void white()
  {
    analogWrite(ledRed, 255);
    analogWrite(ledGreen, 255);
    analogWrite(ledBlue, 255);
  }
  
  void switchOff()
  {
    analogWrite(ledRed, 0);
    analogWrite(ledGreen, 0);
    analogWrite(ledBlue, 0);
  }

  void hueFlow()
  {
    float period_ms = 2000;
    int intensity = 255;
    
    int valR = (sin(3.1415f * global_millis() / period_ms) + 1.0f) * 127;
    int valG = (sin(3.1415f * global_millis() / period_ms + 3.1415f / 3.0f) + 1.0f) * 127;
    int valB = (sin(3.1415f * global_millis() / period_ms + 2.0f * 3.1415f / 3.0f) + 1.0f) * 127;
      
    valR = map(valR, 0, 255, 0, intensity);
    valG = map(valG, 0, 255, 0, intensity);
    valB = map(valB, 0, 255, 0, intensity);

    analogWrite(ledRed, valR);
    analogWrite(ledGreen, valG);
    analogWrite(ledBlue, valB);
  }

  void setTimeOffset(unsigned long offset)
  {
    time_offset = offset;
  }

private:
  unsigned long global_millis()
  {
    return millis() + time_offset;
  }
  
};

#endif
