const lat = 31.736351
const lon = 34.988310
const elevation = 250
const tz = 'Asia/Jerusalem'

const zmanim_url = "https://www.hebcal.com/zmanim?cfg=json&latitude=" + lat + "&longitude=" + lon + "&tzid=" + tz + "&elev=" + elevation
const parasha_url = "https://www.hebcal.com/shabbat?cfg=json&b=40&&latitude=" + lat + "&longitude=" + lon + "&tzid=" + tz + "&elev=" + elevation + "&M=on&ue=on"

/**
 * Rounds a Date object to the nearest quarter minute (15 seconds).
 * @param {Date} dt - The date object to round
 * @returns {Date} - A new Date object rounded to the nearest quarter minute
 */
function roundToNearestQuarterMinute(dt) {
    // Create a new date to avoid modifying the original
    const rounded = new Date(dt);
    
    // Calculate total seconds from the start of the day
    const startOfDay = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    const secondsSinceMidnight = (dt - startOfDay) / 1000;
    
    // Round to the nearest 15-second interval
    const roundedSeconds = Math.round(secondsSinceMidnight / 15) * 15;
    
    // Create a new date object based on the rounded seconds
    const result = new Date(startOfDay.getTime() + roundedSeconds * 1000);
    
    return result;
}

/**
 * Rounds a Date object down to the previous quarter hour (0, 15, 30, 45 minutes).
 * @param {Date} dt - The date object to round down
 * @returns {Date} - A new Date object rounded down to the previous quarter hour
 */
function roundDownToPreviousQuarterHour(dt) {
    // Create a new date to avoid modifying the original
    const rounded = new Date(dt);
    
    // Round minutes down to the previous quarter hour
    const minute = Math.floor(dt.getMinutes() / 15) * 15;
    
    // Set the rounded minute and reset seconds and milliseconds
    rounded.setMinutes(minute, 0, 0);
    
    return rounded;
}

async function getZmanim() {
    const response = await fetch(zmanim_url);

    // Parsing it to JSON format
    const data = await response.json();
    document.getElementById("sofZmanShma").innerHTML = new Date(data.times.sofZmanShma).toLocaleTimeString([], { hourCycle: 'h23', hour: '2-digit', minute: '2-digit' });
}

async function getParasha() {
    const response = await fetch(parasha_url);

    // Parsing it to JSON format
    const data = await response.json();

    data.items.forEach(element => {
        switch (element.category) {
            case "parashat":
                if (element.hebrew != "") {
                    document.getElementById("parasha").innerHTML = element.hebrew;
                }
                break;
            case "candles":
                let candles = new Date(element.date);
                // candles.setMinutes(candles.getMinutes() + 3);
                document.getElementById("candle-light").innerHTML = new Date(candles).toLocaleTimeString([], { hourCycle: 'h23', hour: '2-digit', minute: '2-digit' });
                // add 20 minutes to candle lighting time
                let mincha = new Date(candles);
                mincha.setMinutes(mincha.getMinutes() + 20);
                document.getElementById("mincha").innerHTML = mincha.toLocaleTimeString([], { hourCycle: 'h23', hour: '2-digit', minute: '2-digit' });

                let shabbatMincha = new Date(candles);
                shabbatMincha = roundDownToPreviousQuarterHour(shabbatMincha);
                document.getElementById("shabbatMincha").innerHTML = shabbatMincha.toLocaleTimeString([], { hourCycle: 'h23', hour: '2-digit', minute: '2-digit' });

                let dafYomiShabbat = new Date(shabbatMincha);
                dafYomiShabbat.setMinutes(dafYomiShabbat.getMinutes() - 60);
                document.getElementById("dafYomiShabbat").innerHTML = dafYomiShabbat.toLocaleTimeString([], { hourCycle: 'h23', hour: '2-digit', minute: '2-digit' });

                let avotUbanim = new Date(shabbatMincha);
                avotUbanim.setMinutes(avotUbanim.getMinutes() - 30);
                document.getElementById("avotUbanim").innerHTML = avotUbanim.toLocaleTimeString([], { hourCycle: 'h23', hour: '2-digit', minute: '2-digit' });
            
                let dafYomiFriday = new Date(candles);
                dafYomiFriday.setMinutes(dafYomiFriday.getMinutes() - 5);
                // document.getElementById("day-yomi-friday").innerHTML = dafYomiFriday.toLocaleTimeString([], { hourCycle: 'h23', hour: '2-digit', minute: '2-digit' });
                break;
            case "havdalah":
                document.getElementById("maariv").innerHTML = new Date(element.date).toLocaleTimeString([], { hourCycle: 'h23', hour: '2-digit', minute: '2-digit' });
                // add 15 minutes to havdalah time
                let maarivB = new Date(element.date);
                maarivB.setMinutes(maarivB.getMinutes() + 15);
                // document.getElementById("maarivB").innerHTML = maarivB.toLocaleTimeString([], { hourCycle: 'h23', hour: '2-digit', minute: '2-digit' });

                break;
            default:
                break;
        }
    });
}

getParasha();
getZmanim();

//Creating dynamic link that automatically click
function downloadURI(uri, name) {
    var link = document.createElement("a");
    link.download = name;
    link.href = uri;
    link.click();
    //after creating link you should delete dynamic link
    //clearDynamicLink(link); 
}

//Your modified code.
function printToFile(div) {
    html2canvas(div).then((canvas) => {
        var myImage = canvas.toDataURL("image/png");
        //create your own dialog with warning before saving file
        //beforeDownloadReadMessage();
        //Then download file
        downloadURI("data:" + myImage, "zmanim.png");
    }
    );
}


// Show the download button only on the specific page
document.getElementById("download").onclick = function () {
    var zmanimDiv = document.getElementById("zmanim");
    printToFile(zmanimDiv);
}

document.addEventListener('DOMContentLoaded', (event) => {
    // The string we are checking for at the end of the URL
    const requiredEnding = 'shabbos-zmanim-publish.html';

    // Get the full URL of the current page
    const currentUrl = window.location.href;

    // Get the button element
    const button = document.getElementById('download');

    // Check if the current URL ends with the required string
    if (currentUrl.endsWith(requiredEnding)) {
        // If it matches, make the button visible
        if (button) {
            button.style.display = 'inline-block';
        }
    }
    // If it does not match, the button remains hidden (display: none)
});



