const Club = require('../models/club'),
  Story    = require('../models/story')
  mongoose = require('mongoose'),
  clConfig = require('../config/cloudinary'),
  s3Config = require('../config/s3'),
  logger   = require('../logger');

// if (process.env.ENVIRONMENT === 'dev') {
//   var cdn_prefix = 'https://res.cloudinary.com/dubirhea4/';
// } else if (process.env.ENVIRONMENT === 'prod') {
//   var cdn_prefix = 'https://d367cfssgkev4p.cloudfront.net/';
// }


module.exports = {
  storiesEdit(req, res, next) {
    Club.findById(req.params.club_id, function (err, foundClub) {
      if (err || !foundClub) {
        logger.error(req.user._id + ' : (stories-1)foundClub err => ' + err);
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      } else {
        for (var i = foundClub.clubUsers.length - 1; i >= 0; i--) {
          if (foundClub.clubUsers[i].id.equals(req.user._id) && foundClub.clubUsers[i].userRank <= 2) {
            if (foundClub.clubUsers[i].storyDraftImage) {
              var storyDraftImage = foundClub.clubUsers[i].storyDraftImage;
              var aspectRatio = foundClub.clubUsers[i].storyDraftAspectRatio || '1_1';
              var clubId = req.params.club_id;
              return res.render('stories/edit', { storyDraftImage, aspectRatio, clubId });
            } else {
              var storyDraftImage = ''
              var aspectRatio = foundClub.clubUsers[i].storyDraftAspectRatio || '1_1';
              var clubId = req.params.club_id;
              return res.render('stories/edit', { storyDraftImage, aspectRatio, clubId });
            }
          }
        }
      }
    });
  },

  storiesDraft(req, res, next) {
    Club.findById(req.params.club_id, function (err, foundClub) {
      if (err || !foundClub) {
        logger.error(req.user._id + ' : (stories-2)foundClub err => ' + err);
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      } else {
        // for loop does not wait for an asynchronous operation to complete before continuing on to the next iteration
        // FIX  -->  Cannot use var, use let instead so that it creates a unique value of i for each invocation
        for (let i = foundClub.clubUsers.length - 1; i >= 0; i--) {
          if (foundClub.clubUsers[i].id.equals(req.user._id) && foundClub.clubUsers[i].userRank <= 2) {
            var x = Number(req.body.aspectRatio.split('_')[0]);
            var y = Number(req.body.aspectRatio.split('_')[1]);
            if ((x == 4 && y == 3) || (x == 1 && y == 1) || (x == 3 && y == 4) || (x == 9 && y == 16)) {
              var aspectRatio = req.body.aspectRatio;
            } else {
              var aspectRatio = '1_1';
            }
            (async () => {
              try {
                if (process.env.ENVIRONMENT === 'dev') {
                  clConfig.cloudinary.v2.uploader.destroy(foundClub.clubUsers[i].storyDraftImageId);
                  var result = await clConfig.cloudinary.v2.uploader.upload(req.body.image, clConfig.clubStories_obj);
                  foundClub.clubUsers[i].storyDraftImage = result.secure_url;
                  foundClub.clubUsers[i].storyDraftImageId = result.public_id;
                  foundClub.clubUsers[i].storyDraftAspectRatio = aspectRatio;
                  foundClub.save();
                  return res.sendStatus(200);
                } else if (process.env.ENVIRONMENT === 'prod') {
                  s3Config.deleteFile(foundClub.clubUsers[i].storyDraftImageId);
                  var result = await s3Config.clubStoriesUpload(req.body.image);
                  foundClub.clubUsers[i].storyDraftImage = result.Location;
                  foundClub.clubUsers[i].storyDraftImageId = result.Key;
                  foundClub.clubUsers[i].storyDraftAspectRatio = aspectRatio;
                  foundClub.save();
                  return res.sendStatus(200);
                }
              } catch (err) {
                logger.error(req.user._id + ' : (stories-3)storyDraftImageUpload err => ' + err);
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              }
            })();
          }
        }
      }
    });
  },

  storiesOptions(req, res, next) {
    Club.findById(req.params.club_id, function (err, foundClub) {
      if (err || !foundClub) {
        logger.error(req.user._id + ' : (stories-4)foundClub err => ' + err);
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      } else {
        for (var i = foundClub.clubUsers.length - 1; i >= 0; i--) {
          if (foundClub.clubUsers[i].id.equals(req.user._id) && foundClub.clubUsers[i].userRank <= 2) {
            if (foundClub.clubUsers[i].storyDraftImage) {
              var storyDraftImage = foundClub.clubUsers[i].storyDraftImage;
              var clubId = req.params.club_id;
              return res.render('stories/options', { storyDraftImage, clubId });
            } else {
              req.flash('error', 'Please Create a story first before setting options');
              return res.redirect('/clubs/' + req.params.club_id + '/story/create/edit');
            }
          }
        }
      }
    });
  },

  async storiesPublish(req, res, next) {
    Club.findById(req.params.club_id, function (err, foundClub) {
      if (err || !foundClub) {
        logger.error(req.user._id + ' : (stories-5)foundClub err => ' + err);
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      }
      else {
        if(req.body.album == '') req.body.album = 'Misc';
        if(req.body.isClubExclusive == 'College') {
          var isClubExclusiveBoolean = false;
        } else {
          var isClubExclusiveBoolean = true;
        }
        if(req.body.isSaved == 'true') {
          var isSavedBoolean = true;
        } else {
          var isSavedBoolean = false;
        }
        for (let i = foundClub.clubUsers.length - 1; i >= 0; i--) {
          if (foundClub.clubUsers[i].id.equals(req.user._id) && foundClub.clubUsers[i].userRank <= 2) {
            story = new Story({
              image: foundClub.clubUsers[i].storyDraftImage,
              imageId: foundClub.clubUsers[i].storyDraftImageId,
              aspectRatio: foundClub.clubUsers[i].storyDraftAspectRatio,
              storyClub: foundClub._id,
              createdAt: Date.now(),
              link: req.body.link,
              linkText: req.body.linkText,
              storyAuthor: req.user._id,
              authorName: req.user.fullName,
              eventDate: req.body.eventDate,
              eventTime: req.body.eventTime,
              eventNotice: req.body.eventNotice,
              isSaved: isSavedBoolean,
              isClubExclusive: isClubExclusiveBoolean,
              album: req.body.album
            });
            story.save();
            foundClub.stories.addToSet(story);
            foundClub.storyArchives.addToSet(story);
            foundClub.albums.addToSet(req.body.album);

            // Story media was already uploaded (after clicking Next)
            // & its url stored in foundClub.clubUsers[i].storyDraftImage
            // Now that, the currentUser has published the draft of his story
            // i.e. (copied url of storyDraftImage to new document in stories collection)
            // --> Reset the draft of currentUser in this club by setting to empty string
            foundClub.clubUsers[i].storyDraftImage = '';
            foundClub.clubUsers[i].storyDraftImageId = '';
            foundClub.clubUsers[i].storyDraftAspectRatio = '';
            foundClub.save();
          }
        }
        return res.redirect('/clubs/' + req.params.club_id);
      }
    });
  },

  storiesDelete(req, res, next) {
    // Takes club_id in params and story_id in POST body

    var rank = currentRank2(req.params.club_id, req.user.userClubs);
    if(0<=rank && rank<=1){
      Story.findOneAndDelete( { _id: req.body.story_id }, async function(err, foundStory){
      if(err || !foundStory){
        logger.error(req.user._id+' : (stories-6)foundStory err => '+err);
        return res.sendStatus(500);
      } else{
        if(process.env.ENVIRONMENT === 'dev'){
          clConfig.cloudinary.v2.uploader.destroy(foundStory.imageId);
        } else if (process.env.ENVIRONMENT === 'prod'){
          s3Config.deleteFile(foundStory.imageId);
        }
        var storyId = mongoose.Types.ObjectId(req.body.story_id);
        Club.updateOne( { _id: req.params.club_id }, 
        { $pull: { stories: storyId, storyArchives: storyId } }, 
        function (err, docs) {
        if (err) {
          logger.error(req.user._id + ' : (stories-7)updateClub err => ' + err);
          return res.sendStatus(500);
        }
        else {
          return res.json({ success: true });
        }
        });
      }
      });
    }
  },

  storySeen(req, res, next) {
    Story.updateOne(
      { _id: req.params.story_id },
      { $addToSet: { seenByUserIds: req.user._id } },
      function (err, docs) {
        if (err) console.log(err);
      }
    );
    return res.json({ success: true });
  },

  storiesUserGet(req, res, next) {
    // TODO as we did in app.js
    return [];
  },

  async storiesClubGet(req, res, next) {
    let foundClub = await Club.findById(req.params.club_id).exec();
    const clubStories = await getClubStories(foundClub);
    return res.json(clubStories);
  },

  async archivesClubGet(req, res, next) {
    let foundClub = await Club.findById(req.params.club_id).select({storyArchives: 1}).exec();
    archiveData = {};
    if(foundClub.storyArchives){
      for(let i = 0; i < foundClub.storyArchives.length; i++){
        let foundStory = await Story.findById(foundClub.storyArchives[i]).exec();
        if(archiveData[foundStory.album])
          archiveData[foundStory.album].push(foundStory);
        else
          archiveData[foundStory.album] = [foundStory];
      }
    }
    return res.json(archiveData);
  },

  async storiesClubAlbums(req, res, next) {
    let foundClub = await Club.findById(req.params.clubs_id).select({albums: 1}).exec();
    return res.json({
      albums : foundClub.albums
    })
  }
};

//*******************FUNCTIONS***********************

function currentRank2(clubId, userClubs){
  var rank;
  userClubs.forEach(function(club){
    if(club.id.equals(clubId)){
      rank = club.rank;
    }
  });
  return rank;
};


async function getClubStories(foundClub) {
  const clubStories = [];
  for (var j = 0; j < foundClub.stories.length; j++) {
    let foundStory = await Story.findById(foundClub.stories[j]).exec();

    // TODO add check if the user has already seen it or not, and give that also in the result
    if (foundStory) clubStories.push(foundStory);
  }

  return clubStories;
}

/*
complete storiesClubAlbums (DONE)
complete archiveClubGet (DONE)
change storiesPublish to store album names as well (DONE)
change app.js to check date and remove old stories from stories array (DONE)
change storiesPublish to add new story to both into archives and stories (DONE)
in storiesDelete, delete from both the archive array and the stories array (DONE)
*/