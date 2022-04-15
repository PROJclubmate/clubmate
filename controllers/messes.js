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
    res.render('mess/show', { mess: foundMess.mess, collegeName: req.user.userKeys.college });
  },

  messUserSelect(req, res, next) {
    User.updateOne({ _id: req.user._id }, { 'userKeys.mess': req.body.mess }, function (err){
    if (err) {
      logger.error(req.user._id+' : (mess-2)updateMess err => '+err);
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      return res.redirect('/colleges/'+req.user.userKeys.college+'/mess');
    }
    });
  },

  async messEditPage(req, res, next) {
    if (!req.user.isCollegeLevelAdmin) {
      req.flash('error', 'You are not authorized to change the menu');
      return res.redirect('/colleges/'+req.user.userKeys.college+'/mess');
    }

    const foundCollege = await CollegePage.findOne({ name: req.user.userKeys.college }).select('messes');
    if (foundCollege == null) {
      logger.error(req.user._id + ' : (mess-3)foundCollege err => ' + 'No college_page document found for given college name');
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    }
    
    const foundMess = await Mess.findOne({college: req.user.userKeys.college});
    if (foundMess == null) {
      logger.error(req.user._id+' : (mess-4)foundMess err => '+'No mess document found for given college');
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    }

    res.render('mess/edit', { messNames: foundCollege.messes, foundMess, collegeName: req.user.userKeys.college });
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
      foundMess.mess.push({
        name: messName,
        menu: [{ day: day, time: time, dishes: dishes }],
      });
    }

    foundMess.save(function (err) {
      if (err) {logger.error(req.user._id+' : (mess-6)updateMess err => '+err);}
    });

    req.flash('success', 'Mess menu updated');
    res.redirect('/colleges/'+req.user.userKeys.college+'/mess/edit');
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
  }
};
