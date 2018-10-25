//declare API keys
const wallpaperAbyssApiKey = ''

//global variables
let img_url = ''
const dateFormat = 'ddd, DD MMM'

let wHistory = []
let wHistoryPos = 0

$(document).ready(function(){
    getHistory()
    startTime()
    formatDate()
    getWallpaper()
    $('#refresh').click(function(){
        getWallpaper(true)
    })
    $('#historyForward').click(function(){
        browseHistory(1)
    })
    $('#historyBack').click(function(){
        browseHistory(-1)
    })


})

function formatDate(){2
    $('#date').html(moment().format("ddd, DD MMM"))
}

function startTime() {
    let today = new Date()
    let h = today.getHours()
    let m = today.getMinutes()
    h = formatTime(h)
    m = formatTime(m)
    document.getElementById('clock').innerHTML =
        h + ':' + m
    setTimeout(startTime, 6000)
}
function formatTime(i) {
    if (i < 10) {i = '0' + i}  // add zero in front of numbers < 10
    return i
}

function randomInt(min, max){
    return Math.floor((Math.random() * max) + min)
}

function getWallpaper(refresh = false){
    chrome.storage.local.get('wallpaperLastChanged', function(result) {
        const now =  new moment()
        const lastUpdated = moment(result.wallpaperLastChanged)
        const duration = moment.duration(now.diff(lastUpdated))
        if(duration.asMinutes() > 0 || refresh) {
            const timestamp = new moment().toISOString()
            chrome.storage.local.set({'wallpaperLastChanged': timestamp}, function () {
                $.ajax({
                    //url:'https://wall.alphacoders.com/api2.0/get.php?auth='+wallpaperAbyssApiKey+'&method=random&info_level=1&count=1&category=anime',
                    url: 'https://wall.alphacoders.com/api2.0/get.php?auth=' + wallpaperAbyssApiKey + '&method=category&id=3&page=' + randomInt(1, 1000),
                    complete: function (response) {
                        const result = JSON.parse(response.responseText)
                        const wallpaper = result.wallpapers[randomInt(0, 29)]
                        img_url = wallpaper.url_image
                        const website_url = wallpaper.url_page
                        updateBackground(img_url)
                        setHistory(img_url)
                    },
                    error: function () {
                        console.log('Bummer: there was an error!')
                    }
                })
            })
        }
        else{
            updateBackground(wHistory[wHistory.length - 1])
        }
    })
}

function updateBackground(img){
    $('#background').css('background-image', 'url(' + img + ')')
    $('#download').attr('href', img)
}

function getHistory(){
    chrome.storage.local.get('wallpaperHistory', function(result) {
        wHistory  = result.wallpaperHistory
        wHistoryPos  = wHistory.length-1
    })
}

function setHistory(item){
    debugger;
    if(item) {
        if (wHistory.length >= 10) {
            wHistory = wHistory.slice(wHistory.length - 9, wHistory.length)
        }
        wHistory.push(item)
        wHistoryPos = wHistory.length - 1
    }
    chrome.storage.local.set({'wallpaperHistory': wHistory})
}

function cleanHistory(){
    wHistory = []
    chrome.storage.local.set({'wallpaperHistory': wHistory})
}

function browseHistory(amount = 1){
    let newPos = wHistoryPos + amount
    console.log(wHistory[newPos], wHistory.length -1, newPos)
    if(newPos <= wHistory.length -1 && newPos >= 0 ) {
        updateBackground(wHistory[newPos])
        wHistoryPos = newPos

    }
}