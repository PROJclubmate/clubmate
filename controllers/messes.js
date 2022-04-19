const mongoose = require('mongoose'),
  Mess         = require('../models/mess'),
  User         = require('../models/user'),
  CollegePage  = require('../models/college_page');

let today = new Date();
const weekDay = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
let Day = weekDay[today.getDay()];

const dateData = {
  day: Day,
  todayDate: today,
};

const timeSortOrder = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];
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
    const foundMess = await Mess.findOne({college: req.user.userKeys.college});
    if (foundMess == null) {
      logger.error(req.user._id+' : (mess-1)foundMess err => '+'No mess document found for given college');
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    }

    const messName = req.user.userKeys.mess;
    res.render('mess/show', { mess: foundMess.mess, collegeName: req.user.userKeys.college, messName: messName});
  },

  async messUserChange(req, res, next) {
    const messName = req.body.messName;

    const foundMess = await Mess.findOne({ college: req.user.userKeys.college });
    if (!foundMess) {
      logger.error(req.user._id+' : (mess-1)foundMess err => '+'No mess document found for given college');
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    }

    const messNames = foundMess.mess.map(elem => elem.name);
    if (!messNames.includes(messName)) {
      req.flash('Invalid mess');
      return res.redirect('back');
    }

    const foundUser = await User.findById(req.user._id).select('userKeys');
    if (!foundUser) {
      logger.error(req.user._id+' : (mess-1)foundUser err => '+'User not found!');
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    }

    foundUser.userKeys.mess = messName;

    await foundUser.save(function (err) {
      if (err) {
        logger.error(req.user._id+' : (mess-1)saveUser err => '+'Error saving user');
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      }

    res.redirect('back');

    });
  },

  async messEditPage(req, res, next) {

    const day = req.query.day;
    const time = req.query.time;
    const messName = req.query.messName;
    
    const foundMess = await Mess.findOne({college: req.user.userKeys.college});
    if (foundMess == null) {
      logger.error(req.user._id+' : (mess-4)foundMess err => '+'No mess document found for given college');
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    }

    const messNames = foundMess.mess.map(elem => elem.name);

    res.render('mess/edit', { messNames: messNames, foundMess, collegeName: req.user.userKeys.college, day: day, time: time , messName: messName});
  },

  async messUpdateMenu(req, res, next) {
    const messName = req.body.mess;
    const day = req.body.day;
    const time = req.body.time;
    const dishes = req.body.dishes;

    const foundMess = await Mess.findOne({
      college: req.user.userKeys.college,
    });
    if (foundMess == null) {
      logger.error(req.user._id+' : (mess-5)foundMess err => '+'No mess document found for given college');
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
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
            mess.menu[j].dishes = dishes.filter(n => n);
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
      req.flash('error', 'Mess not found');
      res.redirect('back');
    }

    foundMess.save(function (err) {
      if (err) {logger.error(req.user._id+' : (mess-6)updateMess err => '+err);}
    });

    req.flash('success', 'Mess menu updated');
    res.redirect('/colleges/'+req.user.userKeys.college+`/mess/edit?messName=${messName}&day=${day}&time=${time}`);
  },

  async quickmessData(req, res, next) {
    if(req.user.userKeys.college == req.params.college_name){
      const foundMess = await Mess.findOne({
        college: req.user.userKeys.college,
      });
      if (foundMess == null) {
        logger.error(req.user._id+' : (mess-7)foundMess err => '+'No mess document found for given college');
        return res.sendStatus(500);
      }

      let mess = '';
      if (
        req.user.userKeys.mess !== '' &&
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
        logger.error(req.user._id+' : (mess-8)foundMess err => '+'No mess object created for given college');
        return res.sendStatus(500);
      }

      res.json({ messName: mess.name, mess: mess });
    } else{
      return res.sendStatus(403);
    }
  },

  messAddPage(req, res, next) {
    res.render('mess/add', { collegeName: req.user.userKeys.college});
  },

  async addNewMess(req, res, next) {
    const messName = req.body.messName.toLowerCase();
    if (!messName) {
      req.flash('error', 'Mess name cannot be empty');
      return res.redirect('back');
    }

    const foundCollege = await CollegePage.findOne({ name: req.user.userKeys.college }).select('messes');
    if (foundCollege == null) {
      logger.error(req.user._id + ' : (mess-9)foundCollege err => ' + 'No college_page document found for given college name');
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    }

    const messNames = foundCollege.messes;

    if (messNames.includes(messName)) {
      req.flash('error', 'Mess with this name already exists');
      res.redirect('back');
    }

    messNames.push(messName);
    await foundCollege.save(function (err) {
      if (err) {
        logger.error(req.user._id + ' : (mess-9)saveCollege err => ' + 'Error saving college document');
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      }
    });

    const foundMess = await Mess.findOne({ college: req.user.userKeys.college });
    if (!foundMess) {
      Mess.create({ college: req.user.userKeys.college, mess: [{ name: messName, menu: [] }] });
    } else {
      const mess = foundMess.mess.push({ name: messName, menu: [] });
      await foundMess.save(function (err) {
        if (err) {
          logger.error(req.user._id + ' : (mess-9)saveMess err => ' + 'Error saving mess document');
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }
      });
    }

    req.flash('success', 'Mess added successfully');
    res.redirect('/colleges/'+req.user.userKeys.college+'/mess/add');
  }
};
