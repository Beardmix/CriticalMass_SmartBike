#ifndef LED_H
#define LED_H

class CtrlLED
{
  public:
    int ledDebug;
    int ledRed;
    int ledGreen;
    int ledBlue;

    int valRed;
    int valGreen;
    int valBlue;

    int time_offset = 0;
    float period_ms = 1000;

    void configure(int pinRed, int pinGreen, int pinBlue, int pinDebug)
    {
        ledRed = pinRed;
        ledGreen = pinGreen;
        ledBlue = pinBlue;
        ledDebug = pinDebug;

        // declare the ledPin as an OUTPUT:
        pinMode(ledRed, OUTPUT);
        pinMode(ledGreen, OUTPUT);
        pinMode(ledBlue, OUTPUT);
        pinMode(ledDebug, OUTPUT);

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

    void pulse()
    {
        int intensity = (sin(3.1415f * 2 * (float)(global_millis()) / period_ms) + 1.0f) * 127;
        int valR = 0;
        int valG = 0;
        int valB = 0;

        valR = map(intensity, 0, 255, 0, this->valRed);
        valG = map(intensity, 0, 255, 0, this->valGreen);
        valB = map(intensity, 0, 255, 0, this->valBlue);

        analogWrite(ledDebug, valR);
        analogWrite(ledRed, valR);
        analogWrite(ledGreen, valG);
        analogWrite(ledBlue, valB);
    }

    void flash()
    {
        float max_duration_ms = period_ms / 10;
        if (global_millis() % (int)period_ms < max_duration_ms)
        {
            int valR = 0;
            int valG = 0;
            int valB = 0;
            int intensity = 0;

            intensity = (sin(3.1415f * (float)(global_millis()) / max_duration_ms)) * 255;
            valR = map(intensity, 0, 255, 0, this->valRed);
            valG = map(intensity, 0, 255, 0, this->valGreen);
            valB = map(intensity, 0, 255, 0, this->valBlue);

            analogWrite(ledDebug, valR);
            analogWrite(ledRed, valR);
            analogWrite(ledGreen, valG);
            analogWrite(ledBlue, valB);
        }
        else
        {
            switchOff();
        }
    }

    void lightLED()
    {
        analogWrite(ledDebug, valRed);
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
        analogWrite(ledDebug, 255);
        analogWrite(ledRed, 255);
        analogWrite(ledGreen, 255);
        analogWrite(ledBlue, 255);
    }

    void switchOff()
    {
        analogWrite(ledDebug, 0);
        analogWrite(ledRed, 0);
        analogWrite(ledGreen, 0);
        analogWrite(ledBlue, 0);
    }

    void hueFlow()
    {
        int intensity = 255;

        int valR = (sin(3.1415f * global_millis() / (2 * period_ms)) + 1.0f) * 127;
        int valG = (sin(3.1415f * global_millis() / (2 * period_ms) + 3.1415f / 3.0f) + 1.0f) * 127;
        int valB = (sin(3.1415f * global_millis() / (2 * period_ms) + 2.0f * 3.1415f / 3.0f) + 1.0f) * 127;

        valR = map(valR, 0, 255, 0, intensity);
        valG = map(valG, 0, 255, 0, intensity);
        valB = map(valB, 0, 255, 0, intensity);

        analogWrite(ledDebug, valR);
        analogWrite(ledRed, valR);
        analogWrite(ledGreen, valG);
        analogWrite(ledBlue, valB);
    }

    void setTimeOffset(int offset)
    {
        time_offset = offset;
    }

    void setTempo(uint8_t tempo)
    {
        period_ms = 60000.0f / (float)tempo;
    }

  private:
    unsigned long global_millis()
    {
        return millis() + time_offset;
    }
};

#endif
