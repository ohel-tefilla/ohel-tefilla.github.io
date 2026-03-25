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
                    document.getElementById("parasha").innerHTML = "פרשת " + element.hebrew;
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

// --- New: two methods: CSV-based and API-based ---

/**
 * Parse a date and time from CSV into a Date object (local time).
 * dateStr: YYYY-MM-DD, timeStr: HH:MM:SS
 */
function parseDateTimeFromCsv(dateStr, timeStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const [hh, mm, ss] = (timeStr || '00:00:00').split(':').map(Number);
    return new Date(y, m - 1, d, hh || 0, mm || 0, ss || 0);
}

/**
 * Read the local CSV file and return the row for the nearest next date (>= today).
 * Returns null if none found.
 */
async function fetchZmanimFromCsv() {
    try {
        const resp = await fetch('/assets/data/zmanim.csv');
        if (!resp.ok) return null;
        const text = await resp.text();
        const lines = text.trim().split('\n');
        if (lines.length < 2) return null;
        const header = lines[0].split(',').map(h => h.trim());
        const rows = lines.slice(1).map(line => line.split(',').map(c => c.trim()));

        // Build objects keyed by header
        const objs = rows.map(cols => {
            const obj = {};
            header.forEach((h, i) => obj[h] = cols[i] || '');
            return obj;
        });

        const today = new Date();
        // Zero out time for comparison by date only (we want next date >= today)
        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        let chosen = null;
        for (const r of objs) {
            if (!r.Date) continue;
            const [y, mo, d] = r.Date.split('-').map(Number);
            const rowDate = new Date(y, mo - 1, d);
            if (rowDate >= todayDateOnly) {
                chosen = r;
                break;
            }
        }

        if (!chosen) return null;

        // Map CSV columns to data structure
        const out = {};
        out.parasha = chosen['Parasha'] || '';
        out.candleLight = parseDateTimeFromCsv(chosen['Date'], chosen['Candle Lighting (40 min before)']);
        out.mincha = parseDateTimeFromCsv(chosen['Date'], chosen['Mincha and Kabbalat Shabbat']);
        out.shacharit = parseDateTimeFromCsv(chosen['Date'], chosen['Shacharit']);
        out.shochenAd = parseDateTimeFromCsv(chosen['Date'], chosen['Shochen Ad']);
        out.sofZmanShma = parseDateTimeFromCsv(chosen['Date'], chosen['Sof Zman Shma']);
        out.dafYomiShabbat = parseDateTimeFromCsv(chosen['Date'], chosen['Daf Yomi']);
        out.shabbatMincha = parseDateTimeFromCsv(chosen['Date'], chosen['Mincha']);
        out.shkia = parseDateTimeFromCsv(chosen['Date'], chosen['Shkia']);
        out.maariv = parseDateTimeFromCsv(chosen['Date'], chosen['Maariv']);
        out.avotUbanim = parseDateTimeFromCsv(chosen['Date'], chosen['Avot Ubanim']);

        return out;
    } catch (e) {
        console.error('Error reading CSV for zmanim:', e);
        return null;
    }
}

/**
 * Use the original hebcal APIs as a fallback. Split into two functions so they can be used independently.
 */
async function fetchZmanimFromApi() {
    try {
        // Fetch both zmanim and parasha endpoints in parallel
        const [zResp, pResp] = await Promise.all([fetch(zmanim_url), fetch(parasha_url)]);
        if (!zResp.ok) return null;
        const zData = await zResp.json();
        let pData = null;
        if (pResp && pResp.ok) {
            pData = await pResp.json();
        }

        const out = {};

        // From hebcal zmanim times
        if (zData && zData.times) {
            if (zData.times.sofZmanShma) out.sofZmanShma = new Date(zData.times.sofZmanShma);
            if (zData.times.sunrise) out.shacharit = new Date(zData.times.sunrise);
            if (zData.times.sunset) out.shkia = new Date(zData.times.sunset);
        }

        // From hebcal parasha endpoint
        if (pData && pData.items) {
            pData.items.forEach(element => {
                switch (element.category) {
                    case 'parashat':
                        if (element.hebrew) out.parasha = element.hebrew;
                        break;
                    case 'candles':
                        out.candleLight = new Date(element.date);
                        break;
                    case 'havdalah':
                        out.maariv = new Date(element.date);
                        break;
                    default:
                        break;
                }
            });
        }

        // Derive items from candleLight when available
        if (out.candleLight) {
            const mincha = new Date(out.candleLight);
            mincha.setMinutes(mincha.getMinutes() + 20);
            out.mincha = mincha;

            out.shabbatMincha = roundDownToPreviousQuarterHour(new Date(out.candleLight));

            out.dafYomiShabbat = new Date(out.shabbatMincha);
            out.dafYomiShabbat.setMinutes(out.dafYomiShabbat.getMinutes() - 60);

            out.avotUbanim = new Date(out.shabbatMincha);
            out.avotUbanim.setMinutes(out.avotUbanim.getMinutes() - 30);
        }

        return out;
    } catch (e) {
        console.error('API zmanim error', e);
        return null;
    }
}

async function fetchParashaFromApi() {
    try {
        const response = await fetch(parasha_url);
        if (!response.ok) return null;
        const data = await response.json();
        return data;
    } catch (e) {
        console.error('API parasha error', e);
        return null;
    }
}

/**
 * Orchestrator: try CSV first, otherwise use API. This fills the DOM elements expected elsewhere in the file.
 */
async function loadZmanimAndParasha() {
    // Try CSV first, then fallback to API. Both fetchers return the same data-shape object.
    let data = await fetchZmanimFromCsv();
    if (!data) data = await fetchZmanimFromApi();

    if (data) {
        fillDomFromZmanim(data);
    }
}

// Fill DOM using a single data object (Dates or strings)
function fillDomFromZmanim(data) {
    const fmt = (dt) => dt instanceof Date ? dt.toLocaleTimeString([], { hourCycle: 'h23', hour: '2-digit', minute: '2-digit' }) : '';

    if (data.sofZmanShma) {
        const el = document.getElementById('sofZmanShma');
        if (el) el.innerHTML = fmt(data.sofZmanShma);
    }

    if (data.parasha && String(data.parasha).toLowerCase() !== 'none') {
        const pEl = document.getElementById('parasha');
        if (pEl) pEl.innerHTML = "פרשת " + data.parasha;
    }

    if (data.candleLight) {
        const el = document.getElementById('candle-light');
        if (el) el.innerHTML = fmt(data.candleLight);
    }

    if (data.mincha) {
        const el = document.getElementById('mincha');
        if (el) el.innerHTML = fmt(data.mincha);
    }

    if (data.shabbatMincha) {
        const el = document.getElementById('shabbatMincha');
        if (el) el.innerHTML = fmt(data.shabbatMincha);

        const dafEl = document.getElementById('dafYomiShabbat');
        if (data.dafYomiShabbat && dafEl) dafEl.innerHTML = fmt(data.dafYomiShabbat);

        const avotEl = document.getElementById('avotUbanim');
        if (data.avotUbanim && avotEl) avotEl.innerHTML = fmt(data.avotUbanim);
    }

    if (data.maariv) {
        const el = document.getElementById('maariv');
        if (el) el.innerHTML = fmt(data.maariv);
    }
}

// Start using CSV-first approach with API fallback
loadZmanimAndParasha();

//Creating dynamic link that automatically click
function downloadURI(uri, name) {
    var link = document.createElement("a");
    link.download = name;
    link.href = uri;
    link.click();
    //after creating link you should delete dynamic link
    //clearDynamicLink(link); 
}

function printToFile(div) {
    html2canvas(div).then((canvas) => {
        // Convert canvas directly to a binary Blob instead of a text string
        canvas.toBlob(function(blob) {
            var blobUrl = URL.createObjectURL(blob);
            downloadURI(blobUrl, "zmanim.png");
            
            // Clean up the temporary URL object from browser memory
            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        }, "image/png");
    });
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



