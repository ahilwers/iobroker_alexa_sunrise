var inSunrise = false;
var alarmTimes = [];

var alexaDevice = '[The id of your alexa device that is used for the wakeup alarm.]';
var hueDevice = '[The id of the Hue device or group that is used for the sunrise]';
var durationInMinutes = 30;

schedule("*/5 * * * *", function () {
    collectAlarmTimesFromAlexa(alexaDevice);
    processAlarmTimes(hueDevice, durationInMinutes);
});

function collectAlarmTimesFromAlexa(deviceId) {
    console.log("Collecting alarms from "+deviceId);
    var currentAlarmTimes = [];
    collectAlarmTimesOfCategoryFromAlexa(deviceId, 'Alarm', currentAlarmTimes);
    collectAlarmTimesOfCategoryFromAlexa(deviceId, 'MusicAlarm', currentAlarmTimes);
    // Synchronize the global alarm times with the current ones:
    synchronizeAlarmLists(currentAlarmTimes, alarmTimes);
}

function collectAlarmTimesOfCategoryFromAlexa(deviceId, category, currentAlarmTimes) {
    var alarmEntries = $('state[id='+deviceId+'.'+category+'.*]');

    var lastAlarmId = '';
    var isEnabled = false;
    var alarmTime = null;
    
    alarmEntries.each(function (id, i) {
        var alarmId = getId(id);
        if (alarmId!='Alarm') {
            if (alarmId!=lastAlarmId) {
                // Next alarm entry reached - process the current one
                addAlarmTime(isEnabled, alarmTime, currentAlarmTimes);
                // Reset current values to process the next alarm entry:
                isEnabled = false;
                alarmTime = null;
                lastAlarmId = alarmId;
            }

            var state = getState(id);
            var entryType = getEntryType(id);
            if (entryType=='enabled') {
                isEnabled = state.val===true;
            } else if (entryType=='time') {
                alarmTime = getAlarmTime(state.val);
            }
        }
    });
    // The last entry was not processed, so we have to process it now:
    addAlarmTime(isEnabled, alarmTime, currentAlarmTimes);
}

function getId(objectId) {
    var stringParts = objectId.split('.');
    return stringParts[stringParts.length-2];
}

function getEntryType(objectId) {
    var stringParts = objectId.split('.');
    return stringParts[stringParts.length-1];
}

function getAlarmTime(alarmTimeString) {
    // Alexa only stores the time of the alarm. In order to be able to 
    // process this time we have to add the correct date:
    var alarmTime = new Date('1970-01-01T' + alarmTimeString);
    var currentTime = new Date();
    alarmTime.setMonth(currentTime.getMonth());
    alarmTime.setFullYear(currentTime.getFullYear());
    alarmTime.setDate(currentTime.getDate());
    // If the current time is greater than the alarm time the alarm must be on the next day:
    if (currentTime.getTime()>alarmTime.getTime()) {
        alarmTime.setDate(currentTime.getDate()+1);
    }
    return alarmTime;
}

function addAlarmTime(isEnabled, alarmTime, alarmTimes) {
    if (isEnabled && (alarmTime!=null)) {
        alarmTimes.push(alarmTime);
    }        
}

function synchronizeAlarmLists(currentAlarmTimes, allAlarmTimes) {
    // Add all new entries to the global alarm entries:
    currentAlarmTimes.forEach(function (alarmTime) {
        if (!isInList(alarmTime, allAlarmTimes)) {
            console.log("Adding alarm at "+alarmTime);
            allAlarmTimes.push(alarmTime);
        }
    });
    // Remove the global alarm entries that don't exist anymore:
    var i = allAlarmTimes.length;
    while (i--) {
        var alarmTime = allAlarmTimes[i];
        console.log(i+': '+alarmTime);
        if (!isInList(alarmTime, currentAlarmTimes)) {
            console.log("Removing alarm at "+alarmTime+" because it doesn't exist anymore.");
            allAlarmTimes.splice(i, 1);
        }
    }
}

function isInList(alarmTime, alarmTimes) {
    for (var alarmTimeFromList of alarmTimes) {
        if (timesAreEqual(alarmTime, alarmTimeFromList)) {
            return true;
        }
    }
    return false;
}

function timesAreEqual(time1, time2) {
    // Alexa only stores the time for the alarm but we need the date as well.
    // So for checking if a time already exists in the list we only compare the time.
     return ((time1.getHours()==time2.getHours()) && (time1.getMinutes()==time2.getMinutes()));
}

function processAlarmTimes(hueGroupId, durationInMinutes) {
    if (!inSunrise) {
        alarmTimes.forEach(function(alarmTime) {
            processAlarmTime(alarmTime, hueGroupId, durationInMinutes);
        });
    }
}

function processAlarmTime(alarmTime, hueGroupId, durationInMinutes) {
    console.log('Alarm will be triggered at '+alarmTime);
    var startTime = new Date(alarmTime);
    startTime.setMilliseconds(alarmTime.getMilliseconds()-(durationInMinutes*60000))
    console.log('Sunrise starts at '+startTime);
    var currentTime = new Date();
    console.log('Current time is '+currentTime);
    if (currentTime>=startTime) {
        doSunrise(hueGroupId, durationInMinutes);
    }
}

function doSunrise(hueGroupId, durationInMinutes) {
    console.log('Initiating sunrise...');
    inSunrise = true;
    var steps = 10;
    var intervalTime = (durationInMinutes*60000)/steps;
    var brightness = 1;
    var temperature = 2200;
    var tempSpan = (6000-2200); //temperature span of the hue bulb

    setState(hueGroupId+'.on', true, false);
    setState(hueGroupId+'.level', brightness, false);
    setState(hueGroupId+'.ct', temperature, false);

    var interval = setInterval(function () {
        brightness = Math.round(brightness+100/steps);
        temperature = Math.round(temperature+tempSpan/steps);

        if (brightness>101) {
            clearInterval(interval);
            inSunrise = false;
        }

        console.log('Brightness: '+brightness);
        console.log('Temperature: '+temperature);

        setState(hueGroupId+'.level', brightness, false);
        setState(hueGroupId+'.ct', temperature, false);
    }, intervalTime);
}
