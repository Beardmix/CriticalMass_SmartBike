#ifndef EEPROM_HANDLER_H
#define EEPROM_HANDLER_H

#include <Nffs.h>
/* Need to undefine min and max in order to compile <String>. */
#undef max
#undef min
#include <String>

#define FILENAME "/settings.txt"

class Settings
{
  public:
    unsigned int num_pixels;
    String device_name;
    Settings() {}
};

class EEPROM_Handler
{
  public:
    Settings settings;

  private:
    NffsFile file;

  public:
    EEPROM_Handler()
    {
        default_settings();
    }

    void load()
    {
        Serial.println("starting");
        // Initialize Nffs
        Nffs.begin();
        file.open(FILENAME, FS_ACCESS_READ);

        if (file.exists())
        {
            Serial.println(FILENAME " file exists");
            String content = read_content();
            int start_idx = 0;
            int end_idx = 0;
            do
            {
                end_idx = content.indexOf(";", start_idx);
                if (end_idx != -1)
                {
                    extract_setting(content.substring(start_idx, end_idx));
                }
                start_idx = end_idx + 1;
            } while (end_idx > 0);
        }
        else
        {
            default_settings();
            Serial.print("Open " FILENAME " file to write ... ");

            if (file.open(FILENAME, FS_ACCESS_WRITE))
            {
                Serial.println("Settings file created");
                save();
                file.close();
            }
            else
            {
                Serial.println("Failed (hint: error 3 means not enough memory space left) ");
                Serial.print("errnum = ");
                Serial.println(file.errnum);
            }
        }
    }

    void save()
    {
        write_setting("num_pixels", String(settings.num_pixels));
        write_setting("device_name", settings.device_name);
    }

  private:
    void write_setting(String name, String val)
    {
        String setting = name + "=" + val + ";";
        file.write(setting.c_str(), setting.length());
    }

    void default_settings()
    {
        settings.num_pixels = 50;
        settings.device_name = "MyFahrrad2";
    }

    String read_content()
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

    void extract_setting(String setting)
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
            else if (setting_name == "device_name")
            {
                settings.device_name = setting_val;
            }
            else
            {
                Serial.println("Unknown Setting To Load");
            }
        }
    }
};

#endif