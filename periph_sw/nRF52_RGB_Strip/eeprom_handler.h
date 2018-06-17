#ifndef EEPROM_HANDLER_H
#define EEPROM_HANDLER_H

#include <Nffs.h>

#define FILENAME "/settings.txt"
#define CONTENTS "THIS IS TEXT, please save me"

struct Settings
{
    char version[10];
    char name[20];
    unsigned int numpixels;
};

class EEPROM_Handler
{
  public:
    struct Settings settings;

  private:
    NffsFile file;
    int eeAddress;

  public:
    EEPROM_Handler()
    {
    }

    void start()
    {
        Serial.println("starting");
        // Initialize Nffs
        Nffs.begin();
        file.open(FILENAME, FS_ACCESS_READ);

        if (file.exists())
        {
            Serial.println(FILENAME " file exists");

            uint32_t readlen;
            char buffer[64] = {0};
            readlen = file.read(buffer, sizeof(buffer));

            buffer[readlen] = 0;
            Serial.println(buffer);
        }
        else
        {
            Serial.print("Open " FILENAME " file to write ... ");

            if (file.open(FILENAME, FS_ACCESS_WRITE))
            {
                Serial.println("OK");
                file.write(CONTENTS, strlen(CONTENTS));
                file.close();
            }
            else
            {
                Serial.println("Failed (hint: path must start with '/') ");
                Serial.print("errnum = ");
                Serial.println(file.errnum);
            }
        }

        eeAddress = 0;
        default_settings();
    }

    void save()
    {
        // EEPROM.put(eeAddress, settings);
    }

    void load()
    {
        // Serial.println("Loading settings");
        // EEPROM.get(eeAddress, settings);
        // char version = check_version();
        // if(version == 0)
        // {
        //     Serial.println("UNKNOWN Version - Loading defaults");
        //     default_settings();
        // }
    }

  private:
    void default_settings()
    {
        // strcpy(settings.version, String("VERSION1").c_str());
        // strcpy(settings.name, String("MyFahrrad").c_str());
        // settings.numpixels = 50;
    }

    char check_version()
    {
        // char version = 0;
        // String version_str = String(settings.version);
        // if (version_str.substr(0, 7) == "VERSION")
        // {
        //     version = settings.version[8];
        // }
        // return version;
    }
};

#endif