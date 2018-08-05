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
    unsigned int sig_front_lower;
    unsigned int sig_front_upper;
    unsigned int sig_rear_lower;
    unsigned int sig_rear_upper;

    Settings()
    {
        set_defaults();
    }

    void set_defaults()
    {
        num_pixels = 50;
        device_name = "MyFahrrad";
        sig_front_lower = 0;
        sig_rear_upper = num_pixels - 1;
        sig_front_upper = int(num_pixels/4) - sig_front_lower;
        sig_rear_lower = sig_rear_upper - int(num_pixels/4);
    }
};

class EEPROM_Handler
{
  public:
    EEPROM_Handler()
    {
    }

    void configure(void)
    {
        // Initialize Nffs
        Nffs.begin();
    }

    void static load(Settings &settings)
    {
        NffsFile file;
        file.open(FILENAME, FS_ACCESS_READ);

        if (file.exists())
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
        NffsFile file;
        
        Serial.println("Open " FILENAME " file to write ... ");

        if (file.open(FILENAME, FS_ACCESS_WRITE))
        {
            file.seek(0);
            write_setting(file, "num_pixels", String(settings.num_pixels));
            write_setting(file, "d_name", settings.device_name);
            write_setting(file, "sig_fl", String(settings.sig_front_lower));
            write_setting(file, "sig_fu", String(settings.sig_front_upper));
            write_setting(file, "sig_rl", String(settings.sig_rear_lower));
            write_setting(file, "sig_ru", String(settings.sig_rear_upper));
            file.close();
        }
        else
        {
            Serial.println("Failed (hint: error 3 means not enough memory space left) ");
            Serial.print("errnum = ");
            Serial.println(file.errnum);
        }
    }

  private:
    void static write_setting(NffsFile &file, String name, String val)
    {
        String setting = name + "=" + val + ";";
        Serial.println("Writting Setting: " + setting);
        int len_written = file.write(setting.c_str(), setting.length());
        if (len_written != setting.length())
        {
            Serial.println("Error - len_written: " + String(len_written) + " | file.errnum: " + String(file.errnum));
        }
    }

    String static read_content(NffsFile &file)
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
            else if (setting_name == "d_name")
            {
                settings.device_name = setting_val;
            }
            else if (setting_name == "sig_fl")
            {
                settings.sig_front_lower = setting_val.toInt();
            }
            else if (setting_name == "sig_fu")
            {
                settings.sig_front_upper = setting_val.toInt();
            }
            else if (setting_name == "sig_rl")
            {
                settings.sig_rear_lower = setting_val.toInt();
            }
            else if (setting_name == "sig_ru")
            {
                settings.sig_rear_upper = setting_val.toInt();
            }
            else
            {
                Serial.println("Unknown Setting To Load");
            }
        }
    }
};

#endif