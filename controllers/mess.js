const mongoose = require("mongoose"),
  Mess = require("../models/mess"),
  User = require("../models/user"),
  CollegePage = require("../models/college-page");

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

const timeSortOrder = ["Breakfast", "Lunch", "Snacks", "Dinner"];
const timeMapping = {};
for (let i = 0; i < timeSortOrder.length; i++) {
  timeMapping[timeSortOrder[i]] = i;
}

const dayMapping = {};
for (let i = 0; i < weekDay.length; i++) {
  dayMapping[weekDay[i]] = i;
}

module.exports = {
  async messShowFull(req, res, next) {
    const foundMess = await Mess.findOne({
      college: req.user.userKeys.college,
    });
    if (foundMess == null) {
      logger.error(
        req.user._id +
        " : (mess-1)foundMess err => " +
        "No mess document found for given college"
      );
      req.flash("error", "Something went wrong :(");
      return res.redirect("back");
    }

    res.render("mess/show_mess", { mess: foundMess.mess });
  },

  messUserSelect(req, res, next) {
    User.updateOne(
      { _id: req.user._id },
      { "userKeys.mess": req.body.mess },
      function (err) {
        if (err) {
          logger.error(
            req.user._id + " : (mess-2)updateMess err => " + err
          );
          req.flash("error", "Something went wrong :(");
          return res.redirect("back");
        }
      }
    );
  },

  async messEditPage(req, res, next) {
    if (!req.user.isCollegeLevelAdmin) {
      req.flash("error", "You are not authorized to change the menu");
      return res.redirect("/mess");
    }

    const foundCollege = await CollegePage.find({
      name: req.user.userKeys.college,
    }).select({ messes: 1 });
    if (foundCollege == null) {
      logger.error(
        req.user._id +
        " : (mess-3)foundCollege err => " +
        "No mess document found for given college"
      );
      req.flash("error", "Something went wrong :(");
      return res.redirect("back");
    }
    messNames = foundCollege[0].messes;
    res.render("mess/edit_mess", { messNames: messNames });
  },

  async messUpdateMenu(req, res, next) {
    const messName = req.body.mess;
    const day = req.body.day;
    const time = req.body.time;
    const dishes = req.body.dishes.split(",");

    const foundMess = await Mess.findOne({
      college: req.user.userKeys.college,
    });
    if (foundMess == null) {
      logger.error(
        req.user._id +
        " : (mess-4)foundMess err => " +
        "No mess document found for given college"
      );
      req.flash("error", "Something went wrong :(");
      return res.redirect("back");
    }

    let messFound = false;
    for (var i = 0; i < foundMess.mess.length; i++) {
      if (foundMess.mess[i].name === messName) {
        messFound = true;

        const mess = foundMess.mess[i];
        let timingFound = false;
        for (var j = 0; j < mess.menu.length; j++) {
          if (mess.menu[j].day == day && mess.menu[j].time == time) {
            timingFound = true;
            mess.menu[j].dishes = dishes;
            break;
          }
        }
        if (!timingFound) {
          mess.menu.push({ day: day, time: time, dishes: dishes });
          mess.menu.sort(function (a, b) {
            if (dayMapping[a.day] === dayMapping[b.day]) {
              return timeMapping[a.time] - timeMapping[b.time];
            }
            return dayMapping[a.day] - dayMapping[b.day];
          });
        }
        break;
      }
    }

    if (!messFound) {
      foundMess.mess.push({
        name: messName,
        menu: [{ day: day, time: time, dishes: dishes }],
      });
    }

    foundMess.save(function (err) {
      if (err) {
        logger.error(
          req.user._id + " : (mess-5) updateMess err => " + err
        );
      }
    });

    req.flash("success", "Mess menu updated");
    res.redirect("/mess/change");
  },

  async quickmessData(req, res, next) {
    const foundMess = await Mess.findOne({
      college: req.user.userKeys.college,
    });
    if (foundMess == null) {
      logger.error(
        req.user._id +
        " : (mess-6)foundMess err => " +
        "No mess document found for given college"
      );
      req.flash("error", "Something went wrong :(");
      return res.redirect("back");
    }

    let mess = "";
    if (
      req.user.userKeys.mess !== "" &&
      req.user.userKeys.mess != undefined
    ) {
      for (var i = 0; i < foundMess.mess.length; i++) {
        if (foundMess.mess[i].name == req.user.userKeys.mess) {
          mess = foundMess.mess[i];
          break;
        }
      }
    } else if (foundMess.mess.length > 0) {
      mess = foundMess.mess[0];
    } else {
      logger.error(
        req.user._id +
        " : (mess-7)foundMess err => " +
        "No mess object created for given college"
      );
      req.flash("error", "Something went wrong :(");
      return res.redirect("back");
    }

    const menu = mess.menu.filter(function (menuItem) {
      return menuItem.day === dateData.day
    });

    res.json({ messName: mess.name, menu: menu, day: dateData.day });
  },

  async addNewMess(req, res, next) {
    res.render('mess/add_mess');
  }
};
