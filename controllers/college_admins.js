const mongoose = require("mongoose"),
  Club         = require("../models/club"),
  CollegePage  = require("../models/college_page"),
  clConfig     = require("../config/cloudinary"),
  s3Config     = require('../config/s3');

if (process.env.ENVIRONMENT === "dev") {
  var cdn_prefix = "https://res.cloudinary.com/dubirhea4/";
} else if (process.env.ENVIRONMENT === "prod") {
  var cdn_prefix = "https://d367cfssgkev4p.cloudfront.net/";
}



module.exports = {
	async showAdminConsole(req, res, next) {
    res.render("college_pages/admin_console");
  }
};