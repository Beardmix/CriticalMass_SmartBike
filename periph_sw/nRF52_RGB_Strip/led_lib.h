#ifndef LED_H
#define LED_H

#define __ASSERT_USE_STDERR

#include <assert.h>
#include <Adafruit_NeoPixel.h>

#include "eeprom_handler.h"

class CtrlLED
{
  public:
    int pinDebug;
    int pinData;
    const Settings * p_settings;

    long time_offset = 0;
    long time_overflow_offset = 0;
    long time_offsets[10] = {0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
    unsigned char time_offset_idx = 0;

    Adafruit_NeoPixel strip;

    CtrlLED(int pinData, int pinDebug, Settings const * const p_settings)
    {
        assert(NULL != p_settings);

        this->pinDebug = pinDebug;
        this->pinData = pinData;
        this->p_settings = p_settings;

        // declare the ledPin as an OUTPUT:
        pinMode(pinData, OUTPUT);
        pinMode(pinDebug, OUTPUT);

        strip.begin(); // This initializes the NeoPixel library.
    }

    void configure(void)
    {
        setRGB(255, 255, 255);
        neoPixelType pixelType = NEO_GRB + NEO_KHZ800;

        strip.updateLength(p_settings->num_pixels);
        strip.updateType(pixelType);
        strip.setPin(pinData);
    }

    // Cyclic update from the library.
    void update(void)
    {
        pixel_t idx = ((global_millis() % (int)period_ms) / (float)period_ms) * p_settings->num_pixels;
        
        if (true == p_settings->strip_reversed)
        {
            running_pxl = (p_settings->num_pixels - 1) - idx;
        }
        else
        {
            running_pxl = idx;
        }
    }
    
    // Return the index of the pixel following pxl wrt the strip orientation.
    pixel_t nextPixel(pixel_t pxl)
    {   
        int strip_dir = (true == p_settings->strip_reversed) ? (-1) : (+1);
        return (pxl + strip_dir + p_settings->num_pixels) % p_settings->num_pixels;
    }

    // Return the index of the pixel preceding pxl wrt the strip orientation.
    pixel_t prevPixel(pixel_t pxl)
    {   
        int strip_dir = (true == p_settings->strip_reversed) ? (-1) : (+1);
        return (pxl + (-strip_dir) + p_settings->num_pixels) % p_settings->num_pixels;
    }

    void randomColor()
    {
        setRGB(random(256), random(256), random(256), this->color.i);
    }

    void pulse()
    {
        int intensity = (sin(3.1415f * 2 * (float)(global_millis()) / period_ms) + 1.0f) * 127;
        int valR = 0;
        int valG = 0;
        int valB = 0;

        valR = map(intensity, 0, 255, 0, this->color.r);
        valG = map(intensity, 0, 255, 0, this->color.g);
        valB = map(intensity, 0, 255, 0, this->color.b);

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
            valR = map(intensity, 0, 255, 0, this->color.r);
            valG = map(intensity, 0, 255, 0, this->color.g);
            valB = map(intensity, 0, 255, 0, this->color.b);

            analogWrite(pinDebug, valR);
            writeEach(this->rgbiToColor(valR, valG, valB, this->color.i));
        }
        else
        {
            switchOff();
        }
    }

    void lightLED()
    {
        analogWrite(pinDebug, this->color.r);
        writeEach(strip.Color(this->color.r, this->color.g, this->color.b));
    }

    void setRGB(int r, int g, int b, int i = 255)
    {
        // Pre-compute RGB colors.
        this->color.r = r * i / 255.0f;
        this->color.g = g * i / 255.0f;
        this->color.b = b * i / 255.0f;

        // Save intensity.
        this->color.i = i;
    }

    void white()
    {
        analogWrite(pinDebug, 255);
        writeEach(strip.Color(255, 255, 255));
    }

    // Set all pixels off. Not calling show.
    void setPixelsOff(void)
    {
        for (pixel_t i = 0; i < p_settings->num_pixels; ++i)
        {
            strip.setPixelColor(i, strip.Color(0, 0, 0));
        }
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
        writeEach(this->rgbiToColor(valR, valG, valB, this->color.i));
    }

    /* Dimmed multi chase. */
    void dimmedMultiChase(unsigned int nbChases = 2, unsigned int trainLength = 5)
    {
        // Constraint parameters.
        nbChases = constrain(nbChases, 1, p_settings->num_pixels);
        trainLength = constrain(trainLength, 1, p_settings->num_pixels);

        // Compute useful info.
        const int gapBetweenChases = (p_settings->num_pixels / nbChases);
        const int intensityStep = 0xFF / trainLength;

        setPixelsOff(); // Init: switch evertyhing off.
        
        for (pixel_t chaseIdx = 0; chaseIdx < nbChases; ++chaseIdx)
        {
            pixel_t leaderIdx = (running_pxl + (chaseIdx * gapBetweenChases)) % p_settings->num_pixels;
            // Switch on the leds.
            for (pixel_t followerIdx = 1; followerIdx < (trainLength + 1); ++followerIdx)
            {
                pixel_t ledIdx = (leaderIdx + followerIdx) % p_settings->num_pixels;
                int ledIntensity = intensityStep * followerIdx;
                strip.setPixelColor(ledIdx,
                                    rgbiToColor(this->color.r, this->color.g, this->color.b, ledIntensity));
            }
        }

        strip.show();
    }

    void pileUp()
    {
        const pixel_t stop_pxl = prevPixel(running_pxl);

        for (pixel_t pxl = running_pxl; pxl != stop_pxl; pxl = nextPixel(pxl))
        {
            int intensity = 0x00;
            if (true == p_settings->strip_reversed)
            {
                intensity = (pxl >= running_pxl) ? this->color.i : 0x00;
            }
            else
            {
                intensity = (pxl <= running_pxl) ? this->color.i : 0x00;
            }

            strip.setPixelColor(pxl,
                                rgbiToColor(this->color.r, this->color.g, this->color.b, intensity));
        }

        strip.show(); // This sends the updated pixel color to the hardware.
    }

    // Rainbox mode: chases of the preset colors.
    void modeRainbow(void)
    {
        // Determine parameters according to the number of configured leds and colors.
        unsigned int nbChases = constrain(NB_PRESET_COLORS, 1, p_settings->num_pixels);
        unsigned int trainLength = constrain(p_settings->num_pixels / nbChases, 1, p_settings->num_pixels);

        /* Two partitions have to be distinguished.
        * Chases might have different trainLength due to a non-null rest of the divison p_settings->num_pixels/nbChases.
        * The left-hand-side of the partition will have a (trainLength + 1) length to use the pixels left. */
        unsigned int partitionIdx = floor(p_settings->num_pixels / nbChases);

        setPixelsOff(); // Init: switch evertyhing off.

        for (unsigned int chaseIdx = 0; chaseIdx < nbChases; ++chaseIdx)
        {
            Color rgb = presetColors[chaseIdx];
            pixel_t leaderIdx = (running_pxl + (chaseIdx * trainLength)) % p_settings->num_pixels; // Chase start.
            pixel_t lastIdx = leaderIdx + trainLength;
            if (chaseIdx < partitionIdx) {
                lastIdx += 1;
            }

            // Switch on the leds.
            for (pixel_t i = leaderIdx; i < lastIdx; ++i)
            {
                pixel_t ledIdx = i % p_settings->num_pixels;
                strip.setPixelColor(ledIdx, rgbiToColor(rgb.r, rgb.g, rgb.b, this->color.i));
            }
        }

        strip.show();
    }

    void modeTraffic(void)
    {
        setPixelsOff(); // Init: switch everything off.

        pixel_t front_lower = p_settings->traffic_front_lower;
        pixel_t front_upper = p_settings->traffic_front_upper;
        pixel_t rear_lower = p_settings->traffic_rear_lower;
        pixel_t rear_upper = p_settings->traffic_rear_upper;

        if (true == p_settings->strip_reversed)
        {
            rear_lower  = p_settings->traffic_front_lower;
            rear_upper  = p_settings->traffic_front_upper;
            front_lower = p_settings->traffic_rear_lower;
            front_upper = p_settings->traffic_rear_upper;
        }

        // Front.
        for (pixel_t i = std::max(front_lower - 1, 0U); i < front_upper; ++i)
        {
            strip.setPixelColor(i, this->rgbiToColor(255, 180, 50, this->color.i));
        }
        // Rear.
        for (pixel_t i = std::max(rear_lower - 1, 0U); i < rear_upper; ++i)
        {
            strip.setPixelColor(i, this->rgbiToColor(255, 0, 0, this->color.i));
        }
        
        strip.show();
    }

    void setTimeOffset(int utc_millis)
    {
        bool first_sync = false;
        long new_time_offset = (millis() - utc_millis) % 1000;
        // first sync
        if (time_overflow_offset == 0)
        {
            time_overflow_offset = 500 - new_time_offset; // center around 500 millis to avoid overflows
            first_sync = true;
        }
        new_time_offset = time_overflow_offset - (new_time_offset + time_overflow_offset) % 1000;
        time_offsets[time_offset_idx] = new_time_offset;
        time_offset_idx = (time_offset_idx + 1) % 10;

        time_offset = 0;
        if (first_sync == true)
        {
            for (size_t i = 1; i < 10; i++)
            {
                time_offsets[i] = time_offsets[0];
            }
        }

        for (size_t i = 0; i < 10; i++)
        {
            time_offset += time_offsets[i];
        }
        time_offset = time_offset / 10;
        // Serial.println(time_offset);
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
    class Color
    {
        public:
            unsigned int r; // Value pre-computed with intensity.
            unsigned int g; // Value pre-computed with intensity.
            unsigned int b; // Value pre-computed with intensity.
            unsigned int i; // Intensity, mainly used for the rainbow mode.

            Color(unsigned int r=255, unsigned int g=255, unsigned int b=255, unsigned int i=255)
            {
                this->r = r;
                this->g = g;
                this->b = b;
                this->i = i;
            }
    };

    float period_ms = 1000; // Strip period.
    unsigned int running_pxl = 0; // Pixel running along the strip based on the period and current timestamp wrt strip direction.

    static const unsigned int NB_PRESET_COLORS = 9;
    static const Color presetColors[NB_PRESET_COLORS];
    Color color;

    unsigned long global_millis()
    {
        return millis() + time_offset;
    }

    void writeEach(uint32_t color)
    {
        for (pixel_t i = 0; i < p_settings->num_pixels; i++)
        {
            strip.setPixelColor(i, color);
        }
        strip.show(); // This sends the updated pixel color to the hardware.
    }

    uint32_t rgbiToColor(int r, int g, int b, int i)
    {
        r = map(r, 0, 255, 0, i);
        g = map(g, 0, 255, 0, i);
        b = map(b, 0, 255, 0, i);
        return strip.Color(r, g, b);
    }
};

const CtrlLED::Color CtrlLED::presetColors[CtrlLED::NB_PRESET_COLORS] = {
    Color(255, 0, 0), // red
    Color(0, 255, 0), // green
    Color(0, 0, 255), // blue
    Color(255, 255, 255), // white
    Color(255, 128, 0), // orange
    Color(255, 255, 0), // yellow
    Color(51, 153, 255), // lightblue
    Color(255, 0, 255), // fuschia
    Color(0, 255, 255) // aqua
};

#endif
