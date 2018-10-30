//global variables
let img_url = ''
const dateFormat = 'ddd, DD MMM'

let settings = {
    'wallpaperAbyssApiKey' : '',
    'wallpaperUpdateEvery': 5,
    'preloadedWallpaper': ''
}
let categories = {
    'list':[],
    'lastUpdatedAt':'',
    'active': 1,
    'pages': 100
}
let wHistory = []
let wHistoryPos = 0
let menu = false

let dataStorage = 'online'


function updateSettings(){
    getStorage('settings', function(response) {
        updateCategories()
        if (response && response.settings) {
            settings = response.settings
        }
        else {
            setStorage('settings', settings)
        }
        const list = Object.keys(settings)
        list.map(function(key){
            $('#' + key ).val(settings[key])
            $('#' + key ).change(function () {
                const id = $(this).attr('id')
                const value = $(this).val()
                settings[id] = value
                setStorage('settings', settings)
            })
        })
    })

}

function updateCategories(){
    getStorage('categories', function(res) {
        categories = res.categories
        if (!categories || !categories.list) {
            getCategories()
        }
        else{
            generateCategories()
        }
    })
}

function generateCategories(){
    categories.list.map(function (obj) {
        let selected = ''
        if (obj.id == categories.active){
            selected = 'selected="selected"'
        }
        $('#wallpaperCategories').append(' <option value="' + obj.id + '" '+selected+'>' + obj.name +'</option>')
    })
    $('#wallpaperCategories').change(function () {
        const value = $(this).val()
        categories.active = value
        const item = categories.list.find(function(obj){
            return obj.id == categories.active
        })
        settings.preloadedWallpaper = ''
        categories.pages = Math.floor(item.count/30)
        setStorage('categories', categories)
        getWallpaper(true)
    })
}

function getCategories(){
    $.ajax({
        //url:'https://wall.alphacoders.com/api2.0/get.php?auth='+wallpaperAbyssApiKey+'&method=random&info_level=1&count=1&category=anime',
        url: 'https://wall.alphacoders.com/api2.0/get.php?auth=' + settings.wallpaperAbyssApiKey + '&method=category_list',
        complete: function (response) {
            const result = JSON.parse(response.responseText)
            categories.list = result.categories
            setStorage('categories', categories)
            generateCategories()
        },
        error: function () {
            console.log('Bummer: there was an error!')
        }
    })
}

$(document).ready(function(){
    updateSettings()
    trackStorage()
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
    $('#settings').click(function(){
        if(!menu){
            openMenu()
        }
        else{
            closeMenu()

        }
        menu = !menu
    })
})

function formatDate(){
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
    getStorage('wallpaperLastChanged', function(result) {
        const now =  new moment()
        const lastUpdated = moment(result.wallpaperLastChanged)
        const duration = moment.duration(now.diff(lastUpdated))
        const preloaded = settings.preloadedWallpaper && settings.preloadedWallpaper.url_image
        if(preloaded) {
            updateBackground(settings.preloadedWallpaper.url_image)
            setHistory(settings.preloadedWallpaper.url_image)
        }
        if(duration.asMinutes() > settings.wallpaperUpdateEvery || refresh) {
            const timestamp = new moment().toISOString()
            setStorage('wallpaperLastChanged', timestamp)
                $.ajax({
                    //url:'https://wall.alphacoders.com/api2.0/get.php?auth='+wallpaperAbyssApiKey+'&method=random&info_level=1&count=1&category=anime',
                    url: 'https://wall.alphacoders.com/api2.0/get.php?auth=' + settings.wallpaperAbyssApiKey + '&method=category&id='+categories.active+'&page=' + randomInt(1, categories.pages),
                    complete: function (response) {
                        const result = JSON.parse(response.responseText)
                        settings.preloadedWallpaper = result.wallpapers[randomInt(0, 29)]
                        const wallpaper = result.wallpapers[randomInt(0, 29)]
                        img_url = wallpaper.url_image
                        const website_url = wallpaper.url_page
                        if(!preloaded) {
                            updateBackground(img_url)
                            setHistory(img_url)
                        }
                    },
                    error: function () {
                        console.log('Bummer: there was an error!')
                    }
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


function openMenu() {
    $('#settingsMenu').addClass('open')
    $('#background').addClass('menu-open')
}

function closeMenu() {
    $('#settingsMenu').removeClass('open')
    $('#background').removeClass('menu-open')
}


// chrome storage

function trackStorage(){
    chrome.storage.onChanged.addListener(function (changes, areaName){
        console.log('storage updated at', moment().format('HH:mm'), ' with the changes', changes, ' in area', areaName)
    })
}

function setStorage(key, value){
    if(dataStorage == 'online'){
        chrome.storage.sync.set({[key]: value}, function(){})
    }
    else{
        chrome.storage.local.set({[key]: value}, function(){})
    }
}

function getStorage(key, callback){
    if(dataStorage == 'online'){
        chrome.storage.sync.get([key],  callback)
    }
    else{
        chrome.storage.local.get([key], callback)
    }
}

// wallpaper history

function getHistory(){
   getStorage('wallpaperHistory', function(response) {
       if (response && response.wallpaperHistory) {
           wHistory = response.wallpaperHistory
           wHistoryPos = wHistory.length - 1
       }
       else {
           wHistory = []
       }
   })
}

function setHistory(item){
    if(item) {
        if (wHistory.length >= 10) {
            wHistory = wHistory.slice(wHistory.length - 9, wHistory.length)
        }
        wHistory.push(item)
        wHistoryPos = wHistory.length - 1
    }
    setStorage('wallpaperHistory', wHistory)
}

function cleanHistory(){
    setStorage('wallpaperHistory', [])
}

function browseHistory(amount = 1){
    let newPos = wHistoryPos + amount
    if(newPos <= wHistory.length -1 && newPos >= 0 ) {
        updateBackground(wHistory[newPos])
        wHistoryPos = newPos

    }
}
