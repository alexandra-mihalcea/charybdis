//const days = require(['days.json'])
 //const moment = require(['moment.js'])
// require('moment-lunar')

const days = [
    {
        "name": "Senshō",
        "code": "se",
        "kanji": "先勝",
        "description": "Good luck before noon, bad luck after noon. Good day for beginnings (in the morning)."
    },
    {
        "name": "Tomobiki",
        "code": "to",
        "kanji": "友引",
        "description": "Bad things may happen to friends. Funerals are best avoided on this day."
    },
    {
        "name": "Sakimake",
        "code": "sm",
        "kanji": "先負",
        "description": "Bad luck before noon, good luck after noon."
    },
    {
        "name": "Butsumetsu",
        "code": "bu",
        "kanji": "仏滅",
        "description": "The day Buddha died and therefore the most unlucky day. Weddings are best avoided."
    },
    {
        "name": "Taian",
        "code": "ta",
        "kanji": "大安",
        "description": "The luckiest day. Suitable for weddings and events."
    },
    {
        "name": "Shakkō",
        "code": "sk",
        "kanji": "赤口",
        "description": "Bad luck all day except in the hour of the horse (11AM - 1PM)."
    }
]

function today() {
    return getByMoment(moment())
}

function getByDate(year, month, day){
    month = month -1;
    const date = moment().year(year).month(month).date(day)
    return getByMoment(date)
}

function getByMoment(date){
    date = date.lunar()
    const day = date.date()
    const month = date.month() + 1
    const order = (day%6 - 1 + month%6 - 1 )%6
    return days[order]
}

//module.exports = {today, getByDate, getByMoment}
