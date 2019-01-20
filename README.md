# Sunrise alarm with Hue and Alexa
This script starts a sunrise with your Hue light bulbs 30 mintes before the alarm of your Alexa device triggers. So you can just say "Alexa, wake me up at 6 o'clock" and the sunrise will start at 5:30.

# How does it work?
The script is triggered every five minutes and uses the Alexa2 adapter to collect the enabled alarm times from the Alexa device configured as "alexaDevice". These alarm times are stored in a list. Once the current time reaches one of the alarm times minus the "durationInMinutes", the sunrise will be triggered.
Currently the sunrise is set up for Hue White Ambience bulbs and just sets the brightness and temperature of the light. For Hue Color bulbs the sunrise may have to be configured differently.

# Installation

## Prerequisites
- A running ioBroker instance (http://www.iobroker.net/)
- The Alexa2 Adapter (https://github.com/Apollon77/ioBroker.alexa2) to be able to read the alarm times
- The Hue Adapter (https://github.com/ioBroker/ioBroker.hue) for the sunrise

## Installation procedure
- Just add a new script to you Javascript-Adapter and paste the contents of the sunrise.js to it.
- Set the variable "alexaDevice" to the id of the Alexa device to be used for the alarm.
- Set the variable "hueDevice" to the id of the Hue device or group to be used for the sunrise.
- Optional: Set the durationInMinutes if you want to configure a different duration for the sunrise.
- Press the "play" button to start the script.