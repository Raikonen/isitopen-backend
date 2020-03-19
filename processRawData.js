const fs = require('fs');
const csvParser = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Initialise csv writers
const storesCsvWriter = createCsvWriter({
    path: './assets/stores.csv',
    header: [
        { id: 'sid', title: 'SID' },
        { id: 'sname', title: 'SNAME' },
    ]
});

const openingHoursCsvWriter = createCsvWriter({
    path: './assets/openingHours.csv',
    header: [
        { id: 'sid', title: 'SID' },
        { id: 'day', title: 'DAY' },
        { id: 'openingTime', title: 'OPENINGTIME' },
        { id: 'closingTime', title: 'CLOSINGTIME' },
    ]
});

// Global vars
let dataCsv = [];
let dayToIntMap = new Map([
    ["Mon", 0], ["Tue", 1], ["Tues", 1], ["Wed", 2], ["Weds", 2],
    ["Thu", 3], ["Thurs", 3], ["Fri", 4], ["Sat", 5], ["Sun", 6]]);
let parsedStores = []
let parsedOpeningHours = []

// Read, parse and write data
fs.createReadStream('./assets/data.csv')
    .pipe(csvParser(['sname', 'openingHours']))
    .on('data', (row) => {
        dataCsv.push(row)
    })
    .on('end', () => {
        // Parse and store
        parseData()
        storesCsvWriter.writeRecords(parsedStores)
        openingHoursCsvWriter.writeRecords(parsedOpeningHours)
        console.log('CSV file successfully processed');
    });

// Helper function
function parseData() {
    for (let i = 0; i < dataCsv.length; i++) {

        // Append to stores to stores.csv
        parsedStores.push({ sid: i + 1, ...dataCsv[i] })

        // Append to opening hours openingHours.csv
        const splitOpeningHours = dataCsv[i].openingHours.split(",")
        let restArr = []
        splitOpeningHours.forEach((segment) => {
            // For full days
            if (!segment.includes("am") && !segment.includes("pm")) {
                const fullDays = segment.split("-")
                if (fullDays.length === 1) {
                    parsedOpeningHours.push({
                        sid: i + 1,
                        day: dayToIntMap.get(fullDays[0].trim()),
                        openingTime: '00:00',
                        closingTime: '23:59'
                    })
                } else {
                    let a = dayToIntMap.get(fullDays[0].trim())
                    let b = dayToIntMap.get(fullDays[1].trim())
                    if (a > b) b += 6
                    for (let j = a; j <= b; j++) {
                        parsedOpeningHours.push({
                            sid: i + 1,
                            day: j % 7,
                            openingTime: '00:00',
                            closingTime: '23:59'
                        })
                    }
                }
            } else {
                restArr.push(segment)
            }
        })
        let rest = restArr.join(",")

        // For non-full days
        const splitNonFullDays = rest.split('/')
        splitNonFullDays.forEach(nfd => {
            const firstNum = nfd.search(/\d/)
            const daysStr = nfd.substring(0, firstNum)
            const timeStr = nfd.substring(firstNum, nfd.length)
            let openingTime;
            let closingTime;

            // Parse opening and closing time
            const splitTimeStr = timeStr.split('-')
            openingTime = convertTo24Hrs(splitTimeStr[0])
            closingTime = convertTo24Hrs(splitTimeStr[1])
            let compareRes = compare24HourTimeStrings(openingTime, closingTime)
            const splitDayStr = daysStr.split("-")
            if (splitDayStr.length === 1) {
                // For "Mon,Tue" or "Mon" type cases
                splitDayStr[0].split(',').forEach((s) => {
                    if (compareRes === 1) {
                        parsedOpeningHours.push({
                            sid: i + 1,
                            day: dayToIntMap.get(s.trim()),
                            openingTime: openingTime,
                            closingTime: '23:59'
                        })
                        parsedOpeningHours.push({
                            sid: i + 1,
                            day: (dayToIntMap.get(s.trim()) + 1) % 7,
                            openingTime: '00:00',
                            closingTime: closingTime
                        })
                    } else {
                        parsedOpeningHours.push({
                            sid: i + 1,
                            day: dayToIntMap.get(s.trim()),
                            openingTime: openingTime,
                            closingTime: closingTime
                        })
                    }
                })
            } else {
                // For "Mon - Wed" type cases
                let a = dayToIntMap.get(splitDayStr[0].trim())
                let b = dayToIntMap.get(splitDayStr[1].trim())
                if (a > b) b += 6
                for (let j = a; j <= b; j++) {
                    if (compareRes === 1) {
                        parsedOpeningHours.push({
                            sid: i + 1,
                            day: j % 7,
                            openingTime: openingTime,
                            closingTime: '23:59'
                        })
                        parsedOpeningHours.push({
                            sid: i + 1,
                            day: (j + 1) % 7,
                            openingTime: '00:00',
                            closingTime: closingTime
                        })
                    } else {
                        parsedOpeningHours.push({
                            sid: i + 1,
                            day: j % 7,
                            openingTime: openingTime,
                            closingTime: closingTime
                        })
                    }
                }
            }

        })
    }
}

// Convert 12 hours time string to 24 hours time string, ex. 3:00am => 15:00
function convertTo24Hrs(inputTimeStr) {
    if (inputTimeStr.includes("am")) {
        let t = inputTimeStr.split("am")[0]
        let splitT = t.split(":")
        if (splitT.length === 1) {
            // 3am type
            let hours = parseInt(splitT[0].trim())
            return hours === 12
                ? '00:00'
                : hours + ":00"
        } else {
            // 3:30am type
            let hours = parseInt(splitT[0].trim())
            let mins = parseInt(splitT[1].trim())
            return hours === 12
                ? '00:' + mins
                : hours + ':' + mins
        }
    } else {
        let t = inputTimeStr.split('pm')[0]
        let splitT = t.split(':')
        if (splitT.length === 1) {
            // 3pm type
            let hours = parseInt(splitT[0].trim())
            return hours === 12
                ? '12:00'
                : (hours + 12) + ':00'
        } else {
            // 3:30pm type
            let hours = parseInt(splitT[0].trim())
            let mins = parseInt(splitT[1].trim())
            return hours === 12
                ? '12:' + mins
                : (hours + 12) + ':' + mins
        }
    }
}

// Compare 2 24-hour timings
function compare24HourTimeStrings(timeString1, timeString2) {
    const hour1 = parseInt(timeString1.split(':')[0])
    const hour2 = parseInt(timeString2.split(':')[0])
    const min1 = parseInt(timeString1.split(':')[1])
    const min2 = parseInt(timeString2.split(':')[1])
    if (hour1 < hour2) {
        return -1
    } else if (hour1 > hour2) {
        return 1
    } else {
        if (min1 < min2) {
            return -1
        } else if (min1 > min2) {
            return 1
        } else {
            return 0
        }
    }

}
