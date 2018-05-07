#ifndef LED_H
#define LED_H

#include <Adafruit_NeoPixel.h>

class CtrlLED
{
  public:
    int pinDebug;
    int pinData;
    int numpixels;

    int valRed;
    int valGreen;
    int valBlue;

    long time_offset = 0;
    float period_ms = 1000;

    Adafruit_NeoPixel pixels;

    void configure(int numpixels, int pinData, int pinDebug)
    {
        this->pinDebug = pinDebug;
        this->pinData = pinData;
        this->numpixels = numpixels;

        pixels = Adafruit_NeoPixel(numpixels, pinData, NEO_GRB + NEO_KHZ800);

        // declare the ledPin as an OUTPUT:
        pinMode(pinData, OUTPUT);
        pinMode(pinDebug, OUTPUT);

        valRed = 0;
        valGreen = 0;
        valBlue = 0;

        white();
        delay(1000);
        switchOff();
        delay(1000);

        
        pixels.begin(); // This initializes the NeoPixel library.
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

        analogWrite(pinDebug, valR);
        writeEach(pixels.Color(valR, valG, valB));
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

            analogWrite(pinDebug, valR);
            writeEach(pixels.Color(valR, valG, valB));
        }
        else
        {
            switchOff();
        }
    }

    void lightLED()
    {
        analogWrite(pinDebug, valRed);
        writeEach(pixels.Color(valRed, valGreen, valBlue));
    }

    void setRGB(int valRed, int valGreen, int valBlue)
    {
        this->valRed = valRed;
        this->valGreen = valGreen;
        this->valBlue = valBlue;
    }

    void white()
    {
        analogWrite(pinDebug, 255);
        writeEach(pixels.Color(255, 255, 255));
    }

    void switchOff()
    {
        analogWrite(pinDebug, 0);
        writeEach(pixels.Color(0, 0, 0));
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

        analogWrite(pinDebug, valR);
        writeEach(pixels.Color(valR, valG, valB));
    }

    void setTimeOffset(int utc_millis)
    {
        time_offset = utc_millis - millis() ;
    }

    void setTempo(uint8_t tempo)
    {
        period_ms = 60000.0f / (float)tempo;
    }
    
    int getGlobalTimerModulusMs()
    {
        return global_millis() % 1000;
    }

  private:
    unsigned long global_millis()
    {
        return millis() + time_offset;
    }

    void writeEach(uint32_t color) 
    {
        for(int i = 0; i < numpixels; i++)
        {
            pixels.setPixelColor(i, color);
        }
        pixels.show(); // This sends the updated pixel color to the hardware.
    }
};

#endif
