const mongoose = require("mongoose"),
  User         = require("../models/user"),
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
	collegeShowAdminConsole(req, res, next) {
    CollegePage.findOne({name: req.params.college_name}, function(err, foundCollegePage){
    if(err || !foundCollegePage){
      logger.error('(collegeadmins-1)foundCollegePage err => '+err);
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      res.render('college_pages/admin_console',{college_page: foundCollegePage});
      return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
    }
    });
  },

  collegeUpdateImage(req, res, next) {
    CollegePage.findOne({name: req.params.college_name}, async function(err, foundCollegePage){
    if(err || !foundCollegePage){
      logger.error('(collegeadmins-2)foundCollegePage err => '+err);
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      if(req.file){
        try{
          if(process.env.ENVIRONMENT === 'dev'){
            if(foundCollegePage.coverId != null){
              clConfig.cloudinary.v2.uploader.destroy(foundCollegePage.coverId);
            }
            var result = await clConfig.cloudinary.v2.uploader.upload(req.file.path, clConfig.collegeCovers_1080_obj);
            foundCollegePage.cover = result.secure_url;
            foundCollegePage.coverId = result.public_id;
          } else if (process.env.ENVIRONMENT === 'prod'){
            if(foundCollegePage.coverId != null){
              s3Config.deleteFile(foundCollegePage.coverId);
            }
            var result = await s3Config.uploadFile(req.file, 'collegeCovers/', 1080);
            s3Config.removeTmpUpload(req.file.path);
            foundCollegePage.cover = result.Location;
            foundCollegePage.coverId = result.Key;
          }
        } catch(err){
          logger.error(req.user._id+' : (collegeadmins-3)coverUpload err => '+err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }
      }
      res.redirect('/colleges/'+foundCollegePage.name+'/admin/console');
      return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
    }
    });
  },

  collegeUpdateKeys(req, res, next) {
    CollegePage.findOne({name: req.params.college_name}, function(err, foundCollegePage){
    if(err || !foundCollegePage){
      logger.error('(collegeadmins-4)foundCollegePage err => '+err);
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      if(req.body.branches) { editinfo(1,req.body.branches,foundCollegePage.branches) }
      if(req.body.houses) { editinfo(2,req.body.houses,foundCollegePage.houses) }
      if(req.body.hostels) { editinfo(3,req.body.hostels,foundCollegePage.hostels) }
      // if(req.body.messes) { editinfo(4,req.body.messes,foundCollegePage.messes) }

      function editinfo(count,newData,oldData){
        if(newData){
          oldData=[];
          if(Array.isArray(newData)){
            var oldData = newData.filter(Boolean);
          } else{
            var oldData = [newData].filter(Boolean);;
          }
          // Also capitalise first letter of the word
          var len = oldData.length; for(var i=len-1;i>=0;i--){
            var inputstring = oldData[i].replace(/[^a-zA-Z'()&0-9 .-/]/g, '');
            oldData.splice(i,1,inputstring);
          }
          if(count==1){ foundCollegePage.branches = oldData; }
          else if(count==2){ foundCollegePage.houses = oldData; }
          else if(count==3){ foundCollegePage.hostels = oldData; }
          // else if(count==4){ foundCollegePage.messes = oldData; }
        }
      };
      foundCollegePage.save();
      res.redirect('/colleges/'+foundCollegePage.name+'/admin/console');
    }
    });
  }
};