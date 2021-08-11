const User         = require('../models/user'),
  Club             = require('../models/club'),
  clConfig         = require('../config/cloudinary'),
  s3Config         = require('../config/s3'),
  logger           = require('../logger');

if(process.env.ENVIRONMENT === 'dev'){
  var cdn_prefix = 'https://res.cloudinary.com/dubirhea4/';
} else if (process.env.ENVIRONMENT === 'prod'){
  var cdn_prefix = 'https://d367cfssgkev4p.cloudfront.net/';
}


module.exports = {
  storiesEdit(req, res, next){
    Club.findById(req.params.club_id, function(err, foundClub){
    if(err || !foundClub){
      logger.error(req.user._id+' : (stories-1)foundClub err => '+err);
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      for(var i=foundClub.clubUsers.length-1;i>=0;i--){
        if(foundClub.clubUsers[i].id.equals(req.user._id) && foundClub.clubUsers[i].userRank <= 2){
          if(foundClub.clubUsers[i].storyDraftImage){
            var storyDraftImage = foundClub.clubUsers[i].storyDraftImage;
            var aspectRatio = foundClub.clubUsers[i].storyDraftAspectRatio || '1_1';
            var clubId = req.params.club_id;
            return res.render('stories/edit', {storyDraftImage, aspectRatio, clubId});
          } else{
            var storyDraftImage = ''
            var aspectRatio = foundClub.clubUsers[i].storyDraftAspectRatio || '1_1';
            var clubId = req.params.club_id;
            return res.render('stories/edit', {storyDraftImage, aspectRatio, clubId});
          }
        }
      }
    }
    });
  },

  storiesDraft(req, res, next){
    Club.findById(req.params.club_id, function(err, foundClub){
    if(err || !foundClub){
      logger.error(req.user._id+' : (stories-2)foundClub err => '+err);
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      // for loop does not wait for an asynchronous operation to complete before continuing on to the next iteration
      // FIX  -->  Cannot use var, use let instead so that it creates a unique value of i for each invocation
      for(let i=foundClub.clubUsers.length-1;i>=0;i--){
        if(foundClub.clubUsers[i].id.equals(req.user._id) && foundClub.clubUsers[i].userRank <= 2){
          var x = Number(req.body.aspectRatio.split('_')[0]);
          var y = Number(req.body.aspectRatio.split('_')[1]);
          if((x == 4 && y == 3) || (x == 1 && y == 1) || (x == 3 && y == 4) || (x == 9 && y == 16)){
            var aspectRatio = req.body.aspectRatio;
          } else{
            var aspectRatio = '1_1';
          }
          (async () => {
            try{
              if(process.env.ENVIRONMENT === 'dev'){
                clConfig.cloudinary.v2.uploader.destroy(foundClub.clubUsers[i].storyDraftImageId);
                var result = await clConfig.cloudinary.v2.uploader.upload(req.body.image, clConfig.clubStories_obj);
                foundClub.clubUsers[i].storyDraftImage = result.secure_url;
                foundClub.clubUsers[i].storyDraftImageId = result.public_id;
                foundClub.clubUsers[i].storyDraftAspectRatio = aspectRatio;
                foundClub.save();
                return res.sendStatus(200);
              } else if (process.env.ENVIRONMENT === 'prod'){
                s3Config.deleteFile(foundClub.clubUsers[i].storyDraftImageId);
                var result = await s3Config.clubStoriesUpload(req.body.image);
                foundClub.clubUsers[i].storyDraftImage = result.Location;
                foundClub.clubUsers[i].storyDraftImageId = result.Key;
                foundClub.clubUsers[i].storyDraftAspectRatio = aspectRatio;
                foundClub.save();
                return res.sendStatus(200);
              }
            } catch(err){
              logger.error(req.user._id+' : (stories-3)storyDraftImageUpload err => '+err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }
          })();
        }
      }
    }
    });
  },

  storiesOptions(req, res, next){
    Club.findById(req.params.club_id, function(err, foundClub){
    if(err || !foundClub){
      logger.error(req.user._id+' : (stories-4)foundClub err => '+err);
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      for(var i=foundClub.clubUsers.length-1;i>=0;i--){
        if(foundClub.clubUsers[i].id.equals(req.user._id) && foundClub.clubUsers[i].userRank <= 2){
          if(foundClub.clubUsers[i].storyDraftImage){
            var storyDraftImage = foundClub.clubUsers[i].storyDraftImage;
            var clubId = req.params.club_id;
            return res.render('stories/options', {storyDraftImage, clubId});
          } else{
            req.flash('error', 'Please Create a story first before setting options');
            return res.redirect('/clubs/'+ req.params.club_id +'/story/create/edit');
          }
        }
      }
    }
    });
  }
};

//*******************FUNCTIONS***********************
function checkRank(clubUsers,userId,rank){
  var ok = false;
  clubUsers.forEach(function(user){
    if(user.id.equals(userId) && user.userRank <= rank){
      ok = true;
    }
  });
  return ok;
};