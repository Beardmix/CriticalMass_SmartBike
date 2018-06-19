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

    Settings() {
        set_defaults();
    }

    void set_defaults()
    {
        num_pixels = 50;
        device_name = "MyFahrrad";
    }
};

class EEPROM_Handler
{
  public:
    Settings settings;

  private:
  public:
    EEPROM_Handler()
    {
    }

    void load()
    {
        // Initialize Nffs
        Nffs.begin();
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
                    extract_setting(content.substring(start_idx, end_idx));
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

    void save()
    {
        NffsFile file;
        Serial.println("Open " FILENAME " file to write ... ");

        if (file.open(FILENAME, FS_ACCESS_WRITE))
        {
            file.seek(0);
            write_setting(file, "num_pixels", String(settings.num_pixels));
            write_setting(file, "device_name", settings.device_name);
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
    void write_setting(NffsFile &file, String name, String val)
    {
        String setting = name + "=" + val + ";";
        Serial.println("Writting Setting: " + setting);
        int len_written = file.write(setting.c_str(), setting.length());
        if(len_written != setting.length())
        {
            Serial.println("Error - len_written: " + String(len_written) + " | file.errnum: " + String(file.errnum));
        }
    }

    String read_content(NffsFile &file)
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