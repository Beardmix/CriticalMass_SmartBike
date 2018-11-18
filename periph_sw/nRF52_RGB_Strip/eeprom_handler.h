#ifndef EEPROM_HANDLER_H
#define EEPROM_HANDLER_H

#include <FileIO.h>
/* Need to undefine min and max in order to compile <String>. */
#undef max
#undef min
#include <String>

#define FILENAME "/settings.txt"

typedef unsigned int pixel_t;

class Settings
{
  public:
    pixel_t num_pixels;
    bool strip_reversed;
    String device_name;
    // TrafficMode indices, [1; num_pixels].
    pixel_t traffic_front_lower;
    pixel_t traffic_front_upper;
    pixel_t traffic_rear_lower;
    pixel_t traffic_rear_upper;

    Settings()
    {
        set_defaults();
    }

    void set_defaults()
    {
        num_pixels = 50;
        strip_reversed = false;
        device_name = "MyFahrrad";
        traffic_front_lower = 1;
        traffic_rear_upper = num_pixels;
        traffic_front_upper = int(num_pixels/4) - traffic_front_lower;
        traffic_rear_lower = traffic_rear_upper - int(num_pixels/4);
    }
};

class EEPROM_Handler
{
  public:
    EEPROM_Handler()
    {
    }

    void static configure(void)
    {
        InternalFS.begin();
    }

    void static load(Settings &settings)
    {
        File file(InternalFS);
        file.open(FILENAME, FILE_READ);

        if (file)
        {
            Serial.println(FILENAME " file exists. List of the settings:");
            String content = read_content(file);
            file.close();
            int start_idx = 0;
            int end_idx = 0;
            do
            {
                end_idx = content.indexOf(";", start_idx);
                if (end_idx != -1)
                {
                    extract_setting(settings, content.substring(start_idx, end_idx));
                }
                start_idx = end_idx + 1;
            } while (end_idx > 0);
        }
        else
        {
            Serial.println("File " FILENAME " not found.");
            settings.set_defaults();
        }
    }

    void static save(Settings &settings)
    {
        File file(InternalFS);
        
        Serial.println("Open " FILENAME " file to write ... ");

        if (file.open(FILENAME, FILE_WRITE))
        {
            file.seek(0);
            write_setting(file, "num_pixels", String(settings.num_pixels));
            write_setting(file, "strip_rev", String(settings.strip_reversed));
            write_setting(file, "d_name", settings.device_name);
            write_setting(file, "traffic_fl", String(settings.traffic_front_lower));
            write_setting(file, "traffic_fu", String(settings.traffic_front_upper));
            write_setting(file, "traffic_rl", String(settings.traffic_rear_lower));
            write_setting(file, "traffic_ru", String(settings.traffic_rear_upper));
            file.close();
        }
        else
        {
            Serial.println("Failed to open the file to save the settings to");
        }
    }

  private:
    void static write_setting(File &file, String name, String val)
    {
        String setting = name + "=" + val + ";";
        size_t len_written = file.write(setting.c_str(), setting.length());
        if (len_written != setting.length())
        {
            Serial.println("Error writting: " + setting + "- len_written: " + String(len_written));
        }
    }

    String static read_content(File &file)
    {
        String content = "";
        uint32_t readlen;
        do
        {
            char buffer[64] = {0};
            readlen = file.read(buffer, sizeof(buffer));
            buffer[readlen] = 0;
            content += String(buffer);
        } while (readlen > 0);

        return content;
    }

    void static extract_setting(Settings &settings, String setting)
    {
        Serial.println(setting);
        int equ_idx = setting.indexOf("=");
        if (equ_idx != -1)
        {
            String setting_name = setting.substring(0, equ_idx);
            String setting_val = setting.substring(equ_idx + 1);

            if (setting_name == "num_pixels")
            {
                settings.num_pixels = setting_val.toInt();
            }
            else if (setting_name == "strip_rev")
            {
                settings.strip_reversed = (bool)setting_val.toInt();
            }
            else if (setting_name == "d_name")
            {
                settings.device_name = setting_val;
            }
            else if (setting_name == "traffic_fl")
            {
                settings.traffic_front_lower = setting_val.toInt();
            }
            else if (setting_name == "traffic_fu")
            {
                settings.traffic_front_upper = setting_val.toInt();
            }
            else if (setting_name == "traffic_rl")
            {
                settings.traffic_rear_lower = setting_val.toInt();
            }
            else if (setting_name == "traffic_ru")
            {
                settings.traffic_rear_upper = setting_val.toInt();
            }
            else
            {
                Serial.println("Unknown Setting To Load");
            }
        }
    }
};

#endif