const mongoose = require("mongoose"),
    Mess = require("../models/mess");

let today = new Date();
const weekDay = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];
let Day = weekDay[today.getDay()];

const dateData = {
    day: Day,
    todayDate: today,
};

const data = async (req, res) => {
    const query = await Mess.find({ "menu.day": Day });
    console.log(query);
    res.json(query);
};

module.exports = { data };
