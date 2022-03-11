const mongoose = require("mongoose"),
    Mess = require("../models/mess");

const data = async (req, res) => {
    const query = await Mess.find({});
    res.render("mess", { mess: query });
};

module.exports = data;
