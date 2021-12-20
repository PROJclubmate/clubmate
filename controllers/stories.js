const User         = require('../models/user'),
  Club             = require('../models/club'),
  clConfig         = require('../config/cloudinary'),
  s3Config         = require('../config/s3'),
  logger           = require('../logger'),
  Story            = require('../models/story');

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
                // story = new Story({ image : result.secure_url , imageId : result.public_id , aspectRatio : aspectRatio , storyClub : foundClub._id , timestamp : Date.now()});
                // story.save();
                // foundClub.stories.push(story);
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
  },
 
  storiesPublish(req, res, next){

    // The object is of this form {
    //   eventDate: '',
    //   eventTime: '',
    //   eventNotice: '',
    //   _csrf: 'gJGDMDvi-xTdxiiOX9j9_dadzhDs0D32sn18',
    //   link: '',
    //   linkText: '',
    //   userKeys: { sex: 'Club' },   // to show whom, everyone or club only, 'Club' or 'College'
    //   savestory: 'true'            // true or does not come
    // }

    console.log(req.body);

    Club.findById(req.params.club_id, function(err, foundClub){
    if(err || !foundClub){
      logger.error(req.user._id+' : (stories-2)foundClub err => '+err);
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } 
    else{
      for(let i=foundClub.clubUsers.length-1;i>=0;i--){
        if(foundClub.clubUsers[i].id.equals(req.user._id) && foundClub.clubUsers[i].userRank <= 2){
          story = new Story({ 
            image : foundClub.clubUsers[i].storyDraftImage , 
            imageId : foundClub.clubUsers[i].storyDraftImageId , 
            aspectRatio : foundClub.clubUsers[i].storyDraftAspectRatio , 
            storyClub : foundClub._id , 
            timestamp : Date.now()
          });
          story.save();
          foundClub.stories.push(story);
          foundClub.save();
        }
      }
      return res.redirect('/clubs/' + req.params.club_id);
    }
    });
  },

  storiesUserGet(req, res, next) {
    // TODO as we did in app.js

    return [];
  },

  storiesDelete(req, res, next){
    // TODO Add authenticity that the user has the proper rights to do so
    console.log("Deleting story", req.body.story_id, " from ", req.params.club_id);

    Story.find({_id: req.body.story_id}).deleteOne().exec();
    Club.updateOne({ _id : req.params.club_id }, {
      $pullAll: {
          stories: [req.params.story_id],
      }, 
    }, function (err, docs) {
      if (err){
        console.log(err);
        return res.sendStatus(500);
      }
      else{
        return res.json({success: true});
      }
    });
  },

  storySeen(req, res, next){
    // req.params.story_id , req.params.user_id , req.params.club_id
    Club.updateOne(
      { _id: req.params.club_id }, 
      { $push: { seenByUserIds: req.params.user_id } }
    );
    return res.statusCode(200);
  },

  async storiesClubGet(req, res, next) {
    let foundClub = await Club.findById(req.params.club_id).exec();
    const clubStories = await getClubStories(foundClub);

    console.log(clubStories);

    return res.json(clubStories);
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


async function getClubStories(foundClub) {
  const clubStories = [];
  for(var j = 0; j < foundClub.stories.length; j++){
    let foundStory = await Story.findById(foundClub.stories[j]).exec();

    console.log("Found story", foundStory);

    // TODO add check if the user has already seen it or not, and give that also in the result
    if(foundStory) clubStories.push(foundStory);
  }

  return clubStories;
}
