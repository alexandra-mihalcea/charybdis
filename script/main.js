//global variables
let img_url = ''
const dateFormat = 'ddd, DD MMM'

let settings = {
    'wallpaperAbyssApiKey' : '',
    'wallpaperUpdateEvery': 5,
    'preloadedWallpaper': '',
    'hexclock': false
}
let categories = {
    'list':[],
    'lastUpdatedAt':'',
    'active': 1,
    'pages': 100
}

let bookmarks = [
    {
        'url':'https://www.reddit.com',
        'image':'https://i.imgur.com/ws2kAA0.png',
        'title':'reddit'
    },

    {
        'url':'https://www.youtube.com/',
        'image':'http://www.myiconfinder.com/uploads/iconsets/256-256-3a1eef40f04875d93dd6545f2f1b727e-youtube.png',
        'title':'youtube'
    }
]

let bookmark ={
    'url': '',
    'image': '',
    'title': ''
}

let wHistory = []
let wHistoryPos = 0
let menu = false

let dataStorage = 'online'

const bookmarkTemplate = `
    <div class="bookmark">
        <a href="[[URL]]"><img src="[[URL]]"></a>
    </div>
`

function generateBookmarks(){
    if(bookmarks && bookmarks.length){
        for(let x =0; x< bookmarks.length; x++){
            let html = bookmarkTemplate.replace('[[URL]]', bookmarks[x].url);
            html = html.replace('[[URL]]', bookmarks[x].image)
            $('#bookmarksMenu').append(html)
        }
    }
}

function getBookmarks(){

}

function setBookmarks(){

}

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
        if (res && res.categories && res.categories.list) {
            categories = res.categories
            generateCategories()
        } else {
            getCategories()
        }
        getWallpaper()
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
            console.log('Warning: there was an error!')
        }
    })
}

$(document).ready(function(){
    updateSettings()
    trackStorage()
    getHistory()
    startTime()
    formatDate()
    generateBookmarks();
    $('#refresh').click(function(){
        getWallpaper(true)
    })
    $('#copy').click(function(){
        let copyText = document.getElementById('clipboardText')
        //copyText.value = wHistory[wHistory.length -1]
        copyText.focus()
        copyText.select()
        document.execCommand("copy")
        generateNotification('copied to clipboard')
    })
    $('#historyForward').click(function(){
        browseHistory(1)
    })
    $('#historyBack').click(function(){
        browseHistory(-1)
    })

    $('#historyClear').click(function(){
        clearHistory()
        generateNotification('wallpaper history cleared')
    })
    $('#hexclock').click(function(){
        let res = $('#hexclock').is(':checked')
        $('#hexclock').val(res)
        console.log(res)
        settings.hexclock = res
        setStorage('settings', settings)
        if(!res){1
            $('.overlay').css('background-color','unset')
            document.getElementById('hexclock').innerHTML =''
        }
        else{
            startTime()
        }
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
    let d = today.getDay()
    let h = today.getHours()
    let m = today.getMinutes()
    let s = today.getSeconds()
    if(settings && settings.hexclock && settings.hexclock === 'true' && s%10 === 0){
        let hextime = '#' + (h * 10000 + m * 100 + s)
        $('.overlay').css('background-color',  hextime)
        document.getElementById('hexclockDiv').innerHTML = hextime
    }
    h = formatTime(h)
    m = formatTime(m)
    document.getElementById('clock').innerHTML =
        h + ':' + m
    setTimeout(startTime, 1000)
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
        if(duration.asMinutes() > settings.wallpaperUpdateEvery || refresh || !wHistory.length) {
            if(preloaded) {
                updateBackground(settings.preloadedWallpaper.url_image)
                setHistory(settings.preloadedWallpaper.url_image)
                settings.preloadedWallpaper = ''
            }
            const timestamp = new moment().toISOString()
            setStorage('wallpaperLastChanged', timestamp)
                $.ajax({
                    //url:'https://wall.alphacoders.com/api2.0/get.php?auth='+wallpaperAbyssApiKey+'&method=random&info_level=1&count=1&category=anime',
                    url: 'https://wall.alphacoders.com/api2.0/get.php?auth=' + settings.wallpaperAbyssApiKey + '&method=category&id='+categories.active+'&page=' + randomInt(1, categories.pages) +'&info_level=3',
                    complete: function (response) {
                        const result = JSON.parse(response.responseText)
                        console.log(result)
                        settings.preloadedWallpaper = result.wallpapers[randomInt(0, 29)]
                        setStorage('settings', settings)
                        const wallpaper = result.wallpapers[randomInt(0, 29)]
                        img_url = wallpaper.url_image
                        console.log(wallpaper)
                        if(!preloaded) {
                            updateBackground(img_url)
                            setHistory(img_url)
                        }
                    },
                    error: function () {
                        console.log('Warning: there was an error!')
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
    $('#clipboardText').val(img)
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

function clearHistory(){
    wHistory = []
    setStorage('wallpaperHistory', [])
}

function browseHistory(amount = 1){
    let newPos = wHistoryPos + amount
    if(newPos <= wHistory.length -1 && newPos >= 0 ) {
        updateBackground(wHistory[newPos])
        wHistoryPos = newPos

    }
}

// notification
var animationTimer, clearTimer
function generateNotification(innerText = ''){
    clearNotifications()
    let el = $('<div class="notification">'+ innerText +'</div>').appendTo('body')

    animationTimer = setTimeout( function(){
        $(el).addClass('slide-out')
    }, 1500)
}

function clearNotifications(){
     $($(".notification").splice(0,$(".notification").length - 1 - 1)).remove()
     $(".notification").addClass('slide-out')
}
