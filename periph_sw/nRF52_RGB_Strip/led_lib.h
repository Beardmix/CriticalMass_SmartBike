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

    Adafruit_NeoPixel strip;

    CtrlLED(int numpixels, int pinData, int pinDebug)
    {
        this->pinDebug = pinDebug;
        this->pinData = pinData;
        this->numpixels = numpixels;

        // declare the ledPin as an OUTPUT:
        pinMode(pinData, OUTPUT);
        pinMode(pinDebug, OUTPUT);

        valRed = 0;
        valGreen = 0;
        valBlue = 0;

        strip.begin(); // This initializes the NeoPixel library.
    }

    void configure()
    {
        setRGB(255, 255, 255);
        neoPixelType pixelType = NEO_GRB + NEO_KHZ800;

        strip.updateLength(this->numpixels);
        strip.updateType(pixelType);
        strip.setPin(this->pinData);
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
        writeEach(strip.Color(valR, valG, valB));
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
            writeEach(strip.Color(valR, valG, valB));
        }
        else
        {
            switchOff();
        }
    }

    void lightLED()
    {
        analogWrite(pinDebug, valRed);
        writeEach(strip.Color(valRed, valGreen, valBlue));
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
        writeEach(strip.Color(255, 255, 255));
    }

    void switchOff()
    {
        analogWrite(pinDebug, 0);
        writeEach(strip.Color(0, 0, 0));
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
        writeEach(strip.Color(valR, valG, valB));
    }

    /* Dimmed multi chase. */
    void dimmedMultiChase(unsigned int nbChases = 2, unsigned int trainLength = 5)
    {
        // Minimum parameter values.
        nbChases = max(1, nbChases);
        trainLength = max(1, trainLength);

        // Compute useful info.
        int offset = ((global_millis() % (int)period_ms) / (float)period_ms) * numpixels;
        int gapBetweenChases = (this->numpixels / nbChases);
        int intensityStep = 0xFF / trainLength;

        // Init: switch evertyhing off.
        for (int i = 0; i < numpixels; i++)
        {
            strip.setPixelColor(i, strip.Color(0, 0, 0));
        }

        for (int chaseIdx = 0; chaseIdx < nbChases; ++chaseIdx)
        {
            // Get first chase
            int leaderIdx = (offset + (chaseIdx * gapBetweenChases)) % this->numpixels;
            // Switch on the leds.
            for (int followerIdx = 1; followerIdx < (trainLength + 1); ++followerIdx)
            {
                int ledIdx = (leaderIdx + followerIdx) % this->numpixels;
                int ledIntensity = intensityStep * followerIdx;
                strip.setPixelColor(ledIdx, rgbiToColor(valRed, valGreen, valBlue, ledIntensity));
            }
        }

        strip.show();
    }

    void pileUp()
    {
        int offset = ((global_millis() % (int)period_ms) / (float)period_ms) * (numpixels);
        for (int i = 0; i < numpixels; i++)
        {
            int intensity = 0;
            if (i <= offset)
            {
                intensity = 255;
            }
            strip.setPixelColor(i, rgbiToColor(valRed, valGreen, valBlue, intensity));
        }
        strip.show(); // This sends the updated pixel color to the hardware.
    }

    void setTimeOffset(int utc_millis)
    {
        time_offset = utc_millis - millis();
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
        for (int i = 0; i < numpixels; i++)
        {
            strip.setPixelColor(i, color);
        }
        strip.show(); // This sends the updated pixel color to the hardware.
    }

    uint32_t rgbiToColor(int r, int g, int b, int intensity)
    {
        r = map(r, 0, 255, 0, intensity);
        g = map(g, 0, 255, 0, intensity);
        b = map(b, 0, 255, 0, intensity);
        return strip.Color(r, g, b);
    }
};

#endif
