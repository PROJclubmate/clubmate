const User         = require('../models/user'),
  Club             = require('../models/club'),
  CollegePage      = require('../models/college-page'),
  ClubConversation = require('../models/club-conversation'),
  Subscription     = require('../models/subscription'),
  clConfig         = require('../config/cloudinary'),
  s3Config         = require('../config/s3')
  logger           = require('../logger'),
  mongoose         = require('mongoose'),
  webpush          = require('web-push'),
  mbxGeocoding     = require('@mapbox/mapbox-sdk/services/geocoding'),
  geocodingClient  = mbxGeocoding({ accessToken: process.env.MAPBOX_TOKEN });

if(process.env.ENVIRONMENT === 'dev'){
  var cdn_prefix = 'https://res.cloudinary.com/dubirhea4/';
} else if (process.env.ENVIRONMENT === 'prod'){
  var cdn_prefix = 'https://d367cfssgkev4p.cloudfront.net/';
}


module.exports = {
  indexSubscription(req, res, next){
    // Check the request body has at least an endpoint.
    if (!req.body || !req.body.endpoint){
      // Not a valid subscription.
      res.status(400);
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({
        error: {
          id: 'no-endpoint',
          message: 'Subscription must have an endpoint.'
        }
      }));
      return false;
    }
    req.body.userId = mongoose.Types.ObjectId(req.user._id);
    const subscription = new Subscription(req.body);
    // Save the verification token
    subscription.save(function(err){
      if(err){
        return logger.error('(index-1)foundUsers err => '+err);
      }
    });
    // Send 201-resource created
    res.status(201).json({});
  },

  indexRoot(req, res, next){
    if(req.user){
      if(req.user.userKeys.college){
        return res.redirect('/colleges/'+req.user.userKeys.college);
      } else{
        return res.redirect('/users/'+req.user._id);
      }
    } else{
      return res.render('landing');
    }
  },

  indexAbout(req, res, next){
    return res.render('about');
  },

  indexHelp(req, res, next){
    return res.render('help');
  },

  indexSearch(req, res, next){
    const query = req.query.search;
    User.find({$text: {$search: query}, isVerified: true}, 
      {score: {$meta: 'textScore'}}).sort({score: {$meta: 'textScore'}})
    .select({isVerified: 1, fullName: 1, profilePic: 1, profilePicId: 1, userKeys: 1, note: 1}).limit(3)
    .exec(function(err, foundUsers){
    if(err || !foundUsers){
      logger.error('(index-2)foundUsers err => '+err);
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      var Users_100_profilePic = [];
      for(var l=0;l<foundUsers.length;l++){
        if(process.env.ENVIRONMENT === 'dev'){
          Users_100_profilePic[l] = clConfig.cloudinary.url(foundUsers[l].profilePicId, clConfig.thumb_200_obj);
        } else if (process.env.ENVIRONMENT === 'prod'){
          Users_100_profilePic[l] = s3Config.thumb_200_prefix+foundUsers[l].profilePicId;
        }
      }
      Club.find({$text: {$search: query}, isActive: true}, {score: {$meta: 'textScore'}}).sort({score: {$meta: 'textScore'}})
      .select({name: 1, avatar: 1, avatarId: 1, clubKeys: 1, banner: 1}).limit(3)
      .exec(function(err, foundClubs){
      if(err || !foundClubs){
        logger.error('(index-3)foundClubs err => '+err);
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      } else{
        var Clubs_100_Avatar = [];
        for(var l=0;l<foundClubs.length;l++){
          if(process.env.ENVIRONMENT === 'dev'){
            Clubs_100_Avatar[l] = clConfig.cloudinary.url(foundClubs[l].avatarId, clConfig.thumb_200_obj);
          } else if (process.env.ENVIRONMENT === 'prod'){
            Clubs_100_Avatar[l] = s3Config.thumb_200_prefix+foundClubs[l].avatarId;
          }
        }
        CollegePage.find({$text: {$search: query}, clubCount: {$gt: 0}}, {score: {$meta: 'textScore'}})
        .sort({score: {$meta: 'textScore'}}).exec(function(err, foundCollegePages){
        if(err || !foundCollegePages){
          logger.error('(index-4)foundCollegePages err => '+err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        } else{
          res.render('search/index',{users: foundUsers, clubs: foundClubs, college_pages: foundCollegePages, query,
          Users_100_profilePic, Clubs_100_Avatar, cdn_prefix});
          if(req.user){
            return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
          }
        }
        });
      }
      });
    }
    });
  },

  indexSearchEmail(req, res, next){
    const query = req.query.email;
    User.find({email: req.query.email})
    .select({isVerified: 1, fullName: 1, profilePic: 1, profilePicId: 1, userKeys: 1, note: 1, email: 1}).limit(10)
    .exec(function(err, foundUsers){
    if(err || !foundUsers){
      logger.error('(index-5)foundUsers err => '+err);
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      var foundUserIds = foundUsers.map(function(user){
        return user._id;
      });
      var Users_100_profilePic = [];
      for(var l=0;l<foundUsers.length;l++){
        if(process.env.ENVIRONMENT === 'dev'){
          Users_100_profilePic[l] = clConfig.cloudinary.url(foundUsers[l].profilePicId, clConfig.thumb_200_obj);
        } else if (process.env.ENVIRONMENT === 'prod'){
          Users_100_profilePic[l] = s3Config.thumb_200_prefix+foundUsers[l].profilePicId;
        }
      }
      res.render('search/people',{users: foundUsers, query, foundUserIds, filter: false, morePeopleUrl: '',
      emailSearch: true, Users_100_profilePic, cdn_prefix});
      if(req.user){
        return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
      }
    }
    });
  },

  indexSearchPeople(req, res, next){
    const query = req.query.user;
    User.find({$text: {$search: query}, isVerified: true}, 
      {score: {$meta: 'textScore'}}).sort({score: {$meta: 'textScore'}})
    .select({isVerified: 1, fullName: 1, profilePic: 1, profilePicId: 1, userKeys: 1, note: 1, email: 1}).limit(10)
    .exec(function(err, foundUsers){
    if(err || !foundUsers){
      logger.error('(index-6)foundUsers err => '+err);
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      var foundUserIds = foundUsers.map(function(user){
        return user._id;
      });
      var Users_100_profilePic = [];
      for(var l=0;l<foundUsers.length;l++){
        if(process.env.ENVIRONMENT === 'dev'){
          Users_100_profilePic[l] = clConfig.cloudinary.url(foundUsers[l].profilePicId, clConfig.thumb_200_obj);
        } else if (process.env.ENVIRONMENT === 'prod'){
          Users_100_profilePic[l] = s3Config.thumb_200_prefix+foundUsers[l].profilePicId;
        }
      }
      res.render('search/people',{users: foundUsers, query, foundUserIds, filter: false, morePeopleUrl: '',
      emailSearch: false, Users_100_profilePic, cdn_prefix});
      if(req.user){
        return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
      }
    }
    });
  },

  indexSearchMorePeople(req, res, next){
    const query = req.params.query;
    if(req.query.ids.split(',') != ''){
      var seenIds = req.query.ids.split(',');
    } else{
      var seenIds = [];
    }
    User.find({$text: {$search: query}, isVerified: true, _id: {$nin: seenIds}}, 
      {score: {$meta: 'textScore'}}).sort({score: {$meta: 'textScore'}})
    .select({isVerified: 1, fullName: 1, profilePic: 1, profilePicId: 1, userKeys: 1, note: 1, email: 1}).limit(10)
    .exec(function(err, foundUsers){
    if(err || !foundUsers){
      logger.error('(index-7)foundUsers err => '+err);
      return res.sendStatus(500);
    } else{
      var foundUserIds = foundUsers.map(function(user){
        return user._id;
      });
      var currentUser = req.user;
      var Users_100_profilePic = [];
      for(var l=0;l<foundUsers.length;l++){
        if(process.env.ENVIRONMENT === 'dev'){
          Users_100_profilePic[l] = clConfig.cloudinary.url(foundUsers[l].profilePicId, clConfig.thumb_200_obj);
        } else if (process.env.ENVIRONMENT === 'prod'){
          Users_100_profilePic[l] = s3Config.thumb_200_prefix+foundUsers[l].profilePicId;
        }
      }
      res.json({users: foundUsers, query, foundUserIds, currentUser, filter: false, 
      emailSearch: false, Users_100_profilePic, csrfToken: res.locals.csrfToken, cdn_prefix});
      if(req.user){
        return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
      }
    }
    });
  },

  indexFilterSearchPeople(req, res, next){
    const query = req.query;
    const {dbQuery} = res.locals;
    const morePeopleUrl = res.locals.morePeopleUrl;
    const filterKeys = res.locals.filterKeys;
    delete res.locals.dbQuery;
    delete res.locals.coordinates;
    delete res.locals.morePeopleUrl;
    delete res.locals.filterKeys;
    User.find(dbQuery).select({isVerified: 1, fullName: 1, profilePic: 1, profilePicId: 1, userKeys: 1, note: 1, email: 1})
    .limit(10).exec(function(err, foundUsers){
    if(err){
      logger.error('(index-8)foundUsers err => '+err);
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else if(!foundUsers && res.locals.query){
      req.flash('success', 'No results found :|');
      return res.redirect('back');
    } else{
      var foundUserIds = foundUsers.map(function(user){
        return user._id;
      });
      var Users_100_profilePic = [];
      for(var l=0;l<foundUsers.length;l++){
        if(process.env.ENVIRONMENT === 'dev'){
          Users_100_profilePic[l] = clConfig.cloudinary.url(foundUsers[l].profilePicId, clConfig.thumb_200_obj);
        } else if (process.env.ENVIRONMENT === 'prod'){
          Users_100_profilePic[l] = s3Config.thumb_200_prefix+foundUsers[l].profilePicId;
        }
      }
      res.render('search/people',{users: foundUsers, query, foundUserIds, filter: true, morePeopleUrl, filterKeys,
      emailSearch: false, Users_100_profilePic, cdn_prefix});
      if(req.user){
        return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
      }
    }
    });
  },

  async indexFilterSearchMorePeople(req, res, next){
    const query = req.query;
    const dbQueries = [];
    if(req.query.ids.split(',') != ''){
      var seenIds = req.query.ids.split(',');
    } else{
      var seenIds = [];
    }
    // creating mongoDB query
    if(req.query.url.split('=') != ''){
      const urlEqualsSplit = req.query.url.split('=');
      dbQueries.push({isVerified: true});
      var users = urlEqualsSplit[1];
      if(users.split('&')[0]){
        users = new RegExp(escapeRegExp(users.split('&')[0].replace(/\+/g, ' ').replace(/\%20/g, ' ')), 'gi');
        dbQueries.push({fullName: users});
      }
      var college = urlEqualsSplit[2];
      if(college.split('&')[0]){
        college = new RegExp(escapeRegExp(college.split('&')[0].replace(/\+/g, ' ').replace(/\%20/g, ' ')), 'gi');
        dbQueries.push({'userKeys.college': college});
      }
      var batch = urlEqualsSplit[3];
      if(batch.split('&')[0]){
        batch = new RegExp(escapeRegExp(batch.split('&')[0].replace(/\+/g, ' ').replace(/\%20/g, ' ')), 'gi');
        dbQueries.push({'userKeys.batch': batch});
      }
      var house = urlEqualsSplit[4];
      if(house.split('&')[0]){
        house = new RegExp(escapeRegExp(house.split('&')[0].replace(/\+/g, ' ').replace(/\%20/g, ' ')), 'gi');
        dbQueries.push({'userKeys.house': house});
      }
      var branch = urlEqualsSplit[5];
      if(branch.split('&')[0]){
        branch = new RegExp(escapeRegExp(branch.split('&')[0].replace(/\+/g, ' ').replace(/\%20/g, ' ')), 'gi');
        dbQueries.push({'userKeys.branch': branch});
      }
      var school = urlEqualsSplit[6];
      if(school.split('&')[0]){
        school = new RegExp(escapeRegExp(school.split('&')[0].replace(/\+/g, ' ').replace(/\%20/g, ' ')), 'gi');
        dbQueries.push({'userKeys.school': school});
      }
      var hometown = urlEqualsSplit[7];
      if(hometown.split('&')[0]){
        let coordinates;
        try{
          if(hometown.split('&')[0].includes('\+')){
            // replacing ascii characters of [, ]
            hometown = JSON.parse(hometown.split('&')[0].replace(/\+/g, ' ').replace(/\%5B/g, '[')
            .replace(/\%5D/g, ']').replace(/\%2C/g, ','));
          } else{
            hometown = hometown.split('&')[0].replace(/\%20/g, ' ');
            hometown = JSON.parse(hometown);
          }
          coordinates = hometown;
        } catch(err){
          const response = await geocodingClient.forwardGeocode({
            query: hometown,
            limit: 1
          }).send();
          coordinates = response.body.features[0].geometry.coordinates;
        }
        if(urlEqualsSplit[7]){
          var distance = Number(urlEqualsSplit[8]);
        }
        let maxDistance = distance || 100;
        maxDistance *= 1000;
        dbQueries.push({
          geometry: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates
              },
              $maxDistance: maxDistance
            }
          }
        });
      }
      dbQueries.push({_id: {$nin: seenIds}})
    }
    User.find({$and: dbQueries})
    .select({isVerified: 1, fullName: 1, profilePic: 1, profilePicId: 1, userKeys: 1, note: 1, email: 1})
    .limit(10).exec(function(err, foundUsers){
    if(err){
      logger.error('(index-9)foundUsers err => '+err);
      return res.sendStatus(500);
    } else if(!foundUsers && res.locals.query){
      req.flash('success', 'No results found :|');
      return res.redirect('back');
    } else{
      var foundUserIds = foundUsers.map(function(user){
        return user._id;
      });
      var currentUser = req.user;
      var Users_100_profilePic = [];
      for(var l=0;l<foundUsers.length;l++){
        if(process.env.ENVIRONMENT === 'dev'){
          Users_100_profilePic[l] = clConfig.cloudinary.url(foundUsers[l].profilePicId, clConfig.thumb_200_obj);
        } else if (process.env.ENVIRONMENT === 'prod'){
          Users_100_profilePic[l] = s3Config.thumb_200_prefix+foundUsers[l].profilePicId;
        }
      }
      res.json({users: foundUsers, query, foundUserIds, filter: true, emailSearch: false, 
      currentUser, Users_100_profilePic, csrfToken: res.locals.csrfToken, cdn_prefix});
      if(req.user){
        return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
      }
    }
    });
  },

  indexSearchClubs(req, res, next){
    const query = req.query.club;
    Club.find({$text: {$search: query}, isActive: true}, {score: {$meta: 'textScore'}}).sort({score: {$meta: 'textScore'}})
    .select({name: 1, avatar: 1, avatarId: 1, categories: 1, clubKeys: 1, banner: 1}).limit(10)
    .exec(function(err, foundClubs){
    if(err || !foundClubs){
      logger.error('(index-10)foundClubs err => '+err);
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      var foundClubIds = foundClubs.map(function(club){
        return club._id;
      });
      var Clubs_100_Avatar = [];
      for(var l=0;l<foundClubs.length;l++){
        if(process.env.ENVIRONMENT === 'dev'){
          Clubs_100_Avatar[l] = clConfig.cloudinary.url(foundClubs[l].avatarId, clConfig.thumb_200_obj);
        } else if (process.env.ENVIRONMENT === 'prod'){
          Clubs_100_Avatar[l] = s3Config.thumb_200_prefix+foundClubs[l].avatarId;
        }
      }
      res.render('search/clubs',{clubs: foundClubs, query, foundClubIds, filter: false, moreClubsUrl: '',
      Clubs_100_Avatar, cdn_prefix});
      if(req.user){
        return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
      }
    }
    });
  },

  indexSearchMoreClubs(req, res, next){
    const query = req.params.query;
    if(req.query.ids.split(',') != ''){
      var seenIds = req.query.ids.split(',');
    } else{
      var seenIds = [];
    }
    Club.find({$text: {$search: query}, _id: {$nin: seenIds}}, {score: {$meta: 'textScore'}}).sort({score: {$meta: 'textScore'}})
    .select({name: 1, avatar: 1, avatarId: 1, categories: 1, clubKeys: 1, banner: 1}).limit(10)
    .exec(function(err, foundClubs){
    if(err || !foundClubs){
      logger.error('(index-11)foundClubs err => '+err);
      return res.sendStatus(500);
    } else{
      var foundClubIds = foundClubs.map(function(club){
        return club._id;
      });
      var currentUser = req.user;
      var Clubs_100_Avatar = [];
      for(var l=0;l<foundClubs.length;l++){
        if(process.env.ENVIRONMENT === 'dev'){
          Clubs_100_Avatar[l] = clConfig.cloudinary.url(foundClubs[l].avatarId, clConfig.thumb_200_obj);
        } else if (process.env.ENVIRONMENT === 'prod'){
          Clubs_100_Avatar[l] = s3Config.thumb_200_prefix+foundClubs[l].avatarId;
        }
      }
      res.json({clubs: foundClubs, query, foundClubIds, currentUser, filter: false, 
      Clubs_100_Avatar, csrfToken: res.locals.csrfToken, cdn_prefix});
      if(req.user){
        return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
      }
    }
    });
  },

  indexFilterSearchClubs(req, res, next){
    const query = req.query;
    const {dbQuery} = res.locals;
    const moreClubsUrl = res.locals.moreClubsUrl;
    const filterKeys = res.locals.filterKeys;
    delete res.locals.dbQuery;
    delete res.locals.moreClubsUrl;
    delete res.locals.filterKeys;
    Club.find(dbQuery).select({name: 1, avatar: 1, avatarId: 1, clubKeys: 1, banner: 1, categories: 1})
    .limit(10).exec(function(err, foundClubs){
    if(err){
      logger.error('(index-12)foundClubs err => '+err);
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else if(!foundClubs && res.locals.query){
      req.flash('success', 'No results found :|');
      return res.redirect('back');
    } else{
      var foundClubIds = foundClubs.map(function(user){
        return user._id;
      });
      var Clubs_100_Avatar = [];
      for(var l=0;l<foundClubs.length;l++){
        if(process.env.ENVIRONMENT === 'dev'){
          Clubs_100_Avatar[l] = clConfig.cloudinary.url(foundClubs[l].avatarId, clConfig.thumb_200_obj);
        } else if (process.env.ENVIRONMENT === 'prod'){
          Clubs_100_Avatar[l] = s3Config.thumb_200_prefix+foundClubs[l].avatarId;
        }
      }
      res.render('search/clubs',{clubs: foundClubs, query, foundClubIds, filter: true, moreClubsUrl, filterKeys,
      Clubs_100_Avatar, cdn_prefix});
      if(req.user){
        return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
      }
    }
    });
  },

  async indexFilterSearchMoreClubs(req, res, next){
    const query = req.query;
    const dbQueries = [];
    if(req.query.ids.split(',') != ''){
      var seenIds = req.query.ids.split(',');
    } else{
      var seenIds = [];
    }
    // creating mongoDB query
    if(req.query.url.split('=') != ''){
      const urlEqualsSplit = req.query.url.split('=');
      dbQueries.push({isActive: true});
      var clubs = urlEqualsSplit[1];
      if(clubs.split('&')[0]){
        clubs = new RegExp(escapeRegExp(clubs.split('&')[0].replace(/\+/g, ' ')), 'gi');
        dbQueries.push({name: clubs});
      }
      var college = urlEqualsSplit[2];
      if(college.split('&')[0]){
        college = new RegExp(escapeRegExp(college.split('&')[0].replace(/\+/g, ' ').replace(/\%20/g, ' ')), 'gi');
        dbQueries.push({'clubKeys.college': college});
      }
      var category = urlEqualsSplit[3];
      if(category.split('&')[0]){
        category = new RegExp(escapeRegExp(category.split('&')[0].replace(/\+/g, ' ').replace(/\%20/g, ' ')), 'gi');
        dbQueries.push({'clubKeys.category': category});
      }
      dbQueries.push({_id: {$nin: seenIds}})
    }
    Club.find({$and: dbQueries})
    .select({name: 1, avatar: 1, avatarId: 1, clubKeys: 1, banner: 1, categories: 1})
    .limit(10).exec(function(err, foundClubs){
    if(err){
      logger.error('(index-13)foundClubs err => '+err);
      return res.sendStatus(500);
    } else if(!foundClubs && res.locals.query){
      req.flash('success', 'No results found :|');
      return res.redirect('back');
    } else{
      var foundUserIds = foundClubs.map(function(user){
        return user._id;
      });
      var currentUser = req.user;
      var Clubs_100_Avatar = [];
      for(var l=0;l<foundClubs.length;l++){
        if(process.env.ENVIRONMENT === 'dev'){
          Clubs_100_Avatar[l] = clConfig.cloudinary.url(foundClubs[l].avatarId, clConfig.thumb_200_obj);
        } else if (process.env.ENVIRONMENT === 'prod'){
          Clubs_100_Avatar[l] = s3Config.thumb_200_prefix+foundClubs[l].avatarId;
        }
      }
      res.json({clubs: foundClubs, query, foundUserIds, filter: true, currentUser, Clubs_100_Avatar, 
      csrfToken: res.locals.csrfToken, cdn_prefix});
      if(req.user){
        return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
      }
    }
    });
  },

  indexSearchCollegePages(req, res, next){
    const query = req.query.college;
    CollegePage.find({$text: {$search: query}, clubCount: {$gt: 0}}, {score: {$meta: 'textScore'}})
    .sort({score: {$meta: 'textScore'}}).limit(10).exec(function(err, foundCollegePages){
    if(err || !foundCollegePages){
      logger.error('(index-14)foundCollegePages err => '+err);
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      var foundCollegePageIds = foundCollegePages.map(function(collegePage){
        return collegePage._id;
      });
      var matchArr = [];
      if(req.user){
        for(var i=0;i<foundCollegePages.length;i++){
          if(req.user.userKeys.college == foundCollegePages[i].name){
            matchArr[i] = true;
          }
        }
      }
      res.render('search/college_pages',{college_pages: foundCollegePages, query, foundCollegePageIds, matchArr,
      cdn_prefix});
      if(req.user){
        return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
      }
    }
    });
  },

  indexSearchMoreCollegePages(req, res, next){
    const query = req.params.query;
    if(req.query.ids.split(',') != ''){
      var seenIds = req.query.ids.split(',');
    } else{
      var seenIds = [];
    }
    CollegePage.find({$text: {$search: query}, clubCount: {$gt: 0}, _id: {$nin: seenIds}}, {score: {$meta: 'textScore'}})
    .sort({score: {$meta: 'textScore'}}).limit(10).exec(function(err, foundCollegePages){
    if(err || !foundCollegePages){
      logger.error('(index-15)foundCollegePages err => '+err);
      return res.sendStatus(500);
    } else{
      var foundCollegePageIds = foundCollegePages.map(function(collegePage){
        return collegePage._id;
      });
      var matchArr = [];
      if(req.user){
        for(var i=0;i<foundCollegePages.length;i++){
          if(req.user.userKeys.college == foundCollegePages[i].name){
            matchArr[i] = true;
          }
        }
      }
      var currentUser = req.user;
      res.json({college_pages: foundCollegePages, query, foundCollegePageIds, matchArr, 
      csrfToken: res.locals.csrfToken, cdn_prefix});
      if(req.user){
        return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
      }
    }
    });
  },

  indexRequests(req, res, next){
    // CLUB INVITES
    if(req.body.clubId){
      var clubIduserId = req.body.clubId.split(',');
      var adminClubId = mongoose.Types.ObjectId(clubIduserId[0]);
      var invitedUserId = mongoose.Types.ObjectId(clubIduserId[1]);
      User.updateOne({_id: invitedUserId}, {$addToSet: {clubInvites: adminClubId}}, function(err, updateUser){
        if(err || !updateUser){
          logger.error(req.user._id+' : (index-16)updateUser err => '+err);
          req.flash('error', 'Something went wrong :(');
        } else{
          Club.findById(adminClubId, function(err, foundClub){
          if(err || !foundClub){
            logger.error(req.user._id+' : (index-17)foundClub err => '+err);
            req.flash('error', 'Something went wrong :(');
          } else{
            // Check & remove Member request
            for(var i=0;i<foundClub.memberRequests.length;i++){
              if(foundClub.memberRequests[i].userId.equals(invitedUserId)){
                foundClub.memberRequests.splice(i,1);
              }
            }
            foundClub.save();
            // Send CI notification
            if(process.env.ENVIRONMENT === 'dev'){
              var CI_50_clubAvatar = clConfig.cloudinary.url(foundClub.avatarId, clConfig.thumb_100_obj);
            } else if (process.env.ENVIRONMENT === 'prod'){
              var CI_50_clubAvatar = s3Config.thumb_100_prefix+foundClub.avatarId;
            }
            var title = foundClub.name+' sent you an invite';
            var openUrl = 'https://clubmate.co.in/clubs/'+clubIduserId[0];
            webpush.setVapidDetails('mailto:team@clubmate.co.in',
            'BIlA75fh7DBK0PTVj3oMSnSEVfP8M7HHM6wZFvcUYr_CWnMiQPrZAjP34V-iMGJMCKhBIXlOnfUK5PfR__kjcwM',
            'JVEoDpfY8snHhRhwWhx7gThMWNBxohn9CcdXE0yAqgU');
            Subscription.find({userId: invitedUserId}).sort({'createdAt': -1}).limit(1)
            .exec(function(err, foundSubscriptions){
            if(err || !foundSubscriptions){
              logger.error(req.user._id+' : (index-18)foundSubscriptions err => '+err);
              req.flash('error', 'Something went wrong :(');
            } else{
              for(var i=0;i<foundSubscriptions.length;i++){
                var pushConfig = {
                  endpoint: foundSubscriptions[i].endpoint,
                  keys: {
                    auth: foundSubscriptions[i].keys.auth,
                    p256dh: foundSubscriptions[i].keys.p256dh
                  }
                };
                webpush.sendNotification(pushConfig, JSON.stringify({
                  title: title,
                  content: CI_50_clubAvatar,
                  openUrl: openUrl
                }))
                .catch(function(err){
                  if(err.statusCode === 404 || err.statusCode === 410){
                    Subscription.deleteOne({endpoint: foundSubscriptions[i].endpoint}, function(err){
                    if(err){
                      logger.error(req.user._id+' : (index-19)foundSubscription err => '+err);
                      req.flash('error', 'Something went wrong :(');
                      return res.redirect('back');
                    }
                    });
                  } else{
                    logger.error('(index) => '+err);
                  }
                })
              }
            }
            });
          }
          });
        }
      });
    }
    if(req.body.cancelClubId){
      var clubIduserId = req.body.cancelClubId.split(',');
      var adminClubId = mongoose.Types.ObjectId(clubIduserId[0]);
      var invitedUserId = mongoose.Types.ObjectId(clubIduserId[1]);
      User.updateOne({_id: invitedUserId},{$pull: {clubInvites: adminClubId}}, function(err){
        if(err){
          logger.error(req.user._id+' : (index-20)updateUser err => '+err);
          req.flash('error', 'Something went wrong :(');
        }
      });
    }
    if(req.body.removeInvite){
      var removeInvite = mongoose.Types.ObjectId(req.body.removeInvite);
      User.updateOne({_id: req.user._id},{$pull: {clubInvites: removeInvite}}, function(err){
        if(err){
          logger.error(req.user._id+' : (index-21)updateUser err => '+err);
          req.flash('error', 'Something went wrong :(');
        }
      });
    };
    if(req.body.acceptInvite){
      var acceptInvite = mongoose.Types.ObjectId(req.body.acceptInvite);
      User.findOneAndUpdate({_id: req.user._id},{$pull: {clubInvites: acceptInvite}}, {new: true}, function(err, foundUser){
      if(err || !foundUser){
        logger.error(req.user._id+' : (index-22)foundUser err => '+err);
        req.flash('error', 'Something went wrong :(');
      } else{
        Club.findById(acceptInvite, function(err, foundClub){
        if(err || !foundClub){
          logger.error(req.user._id+' : (index-23)foundClub err => '+err);
          req.flash('error', 'Something went wrong :(');
        } else{
          //pushing user details into club
          var obja = {}; var oka = true;
          obja['id'] = foundUser._id;
          obja['userRank'] = 4;
          for(var i=0;i<foundClub.clubUsers.length;i++){
            if(foundClub.clubUsers[i].id.equals(foundUser._id)){
              oka = false;
              break;
            }
          }
          if(oka == true){
            foundClub.clubUsers.push(obja);
            foundClub.membersCount += 1;
            foundClub.save();
          }
          //pushing club details into users
          var objb = {}; var okb = true;
          objb['id'] = foundClub._id;
          objb['rank'] = 4;
          objb['clubName'] = foundClub.name;
          if(foundClub.conversationId){
            objb['conversationId'] = foundClub.conversationId;
            ClubConversation.findOne({_id: foundClub.conversationId, isActive: true}, 
            function(err, foundClubConversation){
            if(err){
              logger.error(req.user._id+' : (index-24)foundClubConversation err => '+err);
              req.flash('error', 'Something went wrong :(');
            } else{
              var objc = {};
              objc['id'] = foundUser._id;
              objc['cursor'] = foundClubConversation.messageCount;
              foundClubConversation.seenMsgCursors.push(objc);
              foundClubConversation.save();
            }
            });
          }
          for(var j=0;j<foundUser.userClubs.length;j++){
            if(foundUser.userClubs[j].id.equals(foundClub._id)){
              okb = false;
              break;
            }
          }
          if(okb == true){
            foundUser.userClubs.push(objb);
            foundUser.save();
          }
        }
        });
      }
      });
    };
    // FRIEND REQUESTS
    if(req.body.friendReq){
      var friendReq = mongoose.Types.ObjectId(req.body.friendReq);
      User.updateOne({_id: friendReq},{$addToSet: {friendRequests: req.user._id}}, function(err){
        if(err){
          logger.error(req.user._id+' : (index-25)updateUser err => '+err);
          req.flash('error', 'Something went wrong :(');
        } else{
          User.findById(req.user._id).select({fullName: 1, profilePic: 1, profilePicId: 1})
          .exec(function(err, foundUser){
          if(err || !foundUser){
            logger.error(req.user._id+' : (index-26)foundUser err => '+err);
            req.flash('error', 'Something went wrong :(');
          } else{
            if(process.env.ENVIRONMENT === 'dev'){
              var FR_50_profilePic = clConfig.cloudinary.url(foundUser.profilePicId, clConfig.thumb_100_obj);
            } else if (process.env.ENVIRONMENT === 'prod'){
              var FR_50_profilePic = s3Config.thumb_100_prefix+foundUser.profilePicId;
            }
            var title = foundUser.fullName+' sent you a request';
            var openUrl = 'https://clubmate.co.in/users/'+req.user._id;
            webpush.setVapidDetails('mailto:team@clubmate.co.in',
            'BIlA75fh7DBK0PTVj3oMSnSEVfP8M7HHM6wZFvcUYr_CWnMiQPrZAjP34V-iMGJMCKhBIXlOnfUK5PfR__kjcwM',
            'JVEoDpfY8snHhRhwWhx7gThMWNBxohn9CcdXE0yAqgU');
            Subscription.find({userId: friendReq}).sort({'createdAt': -1})
            .exec(function(err, foundSubscriptions){
            if(err || !foundSubscriptions){
              logger.error(req.user._id+' : (index-27)foundSubscriptions err => '+err);
              req.flash('error', 'Something went wrong :(');
            } else{
              for(var i=0;i<foundSubscriptions.length;i++){
                var pushConfig = {
                  endpoint: foundSubscriptions[i].endpoint,
                  keys: {
                    auth: foundSubscriptions[i].keys.auth,
                    p256dh: foundSubscriptions[i].keys.p256dh
                  }
                };
                webpush.sendNotification(pushConfig, JSON.stringify({
                  title: title,
                  content: FR_50_profilePic,
                  openUrl: openUrl
                }))
                .catch(function(err){
                  if(err.statusCode === 404 || err.statusCode === 410){
                    Subscription.deleteOne({endpoint: foundSubscriptions[i].endpoint}, function(err){
                    if(err){
                      logger.error(req.user._id+' : (index-28)foundSubscription err => '+err);
                      req.flash('error', 'Something went wrong :(');
                      return res.redirect('back');
                    }
                    });
                  } else{
                    logger.error('(index) => '+err);
                  }
                })
              }
            };
            });
          }
          });
        }
      });
    };
    if(req.body.cancelReq){
      var cancelReq = mongoose.Types.ObjectId(req.body.cancelReq);
      User.updateOne({_id: cancelReq},{$pull: {friendRequests: req.user._id}}, function(err){
        if(err){
          logger.error(req.user._id+' : (index-29)updateUser err => '+err);
          req.flash('error', 'Something went wrong :(');
        }
      });
    };
    if(req.body.removeReq){
      var removeReq = mongoose.Types.ObjectId(req.body.removeReq);
      User.updateOne({_id: req.user._id},{$pull: {friendRequests: removeReq}}, function(err){
        if(err){
          logger.error(req.user._id+' : (index-30)updateUser err => '+err);
          req.flash('error', 'Something went wrong :(');
        }
      });
    };
    if(req.body.acceptReq){
      var acceptReq = mongoose.Types.ObjectId(req.body.acceptReq);
      User.updateOne({_id: req.user._id}, 
      {$pull: {friendRequests: acceptReq}, $addToSet: {friends: acceptReq}, $inc: {friendsCount: 1}}, 
      function(err){
      if(err){
        logger.error(req.user._id+' : (index-31)updateUser err => '+err);
        req.flash('error', 'Something went wrong :(');
      } else{
        User.updateOne({_id: acceptReq}, 
        {$addToSet: {friends: req.user._id}, $inc: {friendsCount: 1}}, function(err){
          if(err){
            logger.error(req.user._id+' : (index-32)updateUser err => '+err);
            req.flash('error', 'Something went wrong :(');
          }
        });
      }
      });
    };
    if(req.body.unFriendReq){
      var unFriendReq = mongoose.Types.ObjectId(req.body.unFriendReq);
      User.updateOne({_id: req.user._id}, 
      {$pull: {friends: unFriendReq}, $inc: {friendsCount: -1}}, function(err){
      if(err){
        logger.error(req.user._id+' : (index-33)updateUser err => '+err);
        req.flash('error', 'Something went wrong :(');
      } else{
        User.updateOne({_id: unFriendReq}, 
        {$pull: {friends: req.user._id}, $inc: {friendsCount: -1}}, function(err){
          if(err){
            logger.error(req.user._id+' : (index-34)updateUser err => '+err);
            req.flash('error', 'Something went wrong :(');
          }
        });
      }
      });
    };
    return res.redirect('back');
  },

  indexMemberRequests(req, res, next){
    if(req.body.memberReq){
      var obj = {};
      obj['userId'] = req.user._id;
      obj['message'] = req.body.message;
      var memberReq = mongoose.Types.ObjectId(req.body.memberReq);
      Club.updateOne({_id: memberReq}, {$addToSet: {memberRequests: obj}}, function(err){
        if(err){
          logger.error(req.user._id+' : (index-35)updateClub err => '+err);
          req.flash('error', 'Something went wrong :(');
        }
      });
    } else if(req.body.cancelReq){
      var cancelReq = mongoose.Types.ObjectId(req.body.cancelReq);
      Club.updateOne({_id: cancelReq}, {$pull: {memberRequests: {userId: req.user._id}}}, function(err){
        if(err){
          logger.error(req.user._id+' : (index-36)updateClub err => '+err);
          req.flash('error', 'Something went wrong :(');
        }
      });
    } else if(req.body.acceptReq){
      var acceptReq = mongoose.Types.ObjectId(req.body.acceptReq);
      var clubId = mongoose.Types.ObjectId(req.params.id);
      Club.updateOne({_id: clubId}, {$pull: {memberRequests: {userId: acceptReq}}}, function(err){
        if(err){
          logger.error(req.user._id+' : (index-37)updateClub err => '+err);
          req.flash('error', 'Something went wrong :(');
        } else{
          User.updateOne({_id: acceptReq}, {$addToSet: {clubInvites: clubId}}, function(err){
            if(err){
              logger.error(req.user._id+' : (index-38)updateUser err => '+err);
              req.flash('error', 'Something went wrong :(');
            }
          });
        }
      });
    } else if(req.body.declineReq){
      var declineReq = mongoose.Types.ObjectId(req.body.declineReq);
      var clubId = mongoose.Types.ObjectId(req.params.id);
      Club.updateOne({_id: clubId}, {$pull: {memberRequests: {userId: declineReq}}}, function(err){
        if(err){
          logger.error(req.user._id+' : (index-39)updateClub err => '+err);
          req.flash('error', 'Something went wrong :(');
        }
      });
    }
    res.redirect('/clubs/' + req.params.id);
  },

  indexMemberInfo(req, res, next){
    if(req.body.userRank){
      var userRankuserIdclubIdRank = req.body.userRank.split(',');
      var newRank = userRankuserIdclubIdRank[0];
      var userId = userRankuserIdclubIdRank[1];
      var clubId = userRankuserIdclubIdRank[2];
      Club.findById(clubId, function(err, foundClub){
      if(err || !foundClub){
        logger.error(req.user._id+' : (index-40)foundClub err => '+err);
        req.flash('error', 'Something went wrong :(');
      } else{
        var president, admin, presidentTransfer = false;
        president = checkRank(foundClub.clubUsers,req.user._id,0);
        if(president){
          if(newRank == 0){
            for(var i=0;i<foundClub.clubUsers.length;i++){
              if(!foundClub.clubUsers[i].id.equals(req.user._id)){
                // IF ANYONE OTHER THAN PRESIDENT HAS OWNERSHIP; MAKE ADMIN AND LOG REPORT
                if(foundClub.clubUsers[i].userRank == 0){
                  foundClub.clubUsers[i].userRank = 1;
                  User.updateOne({_id: userId, userClubs: {$elemMatch: {id: clubId}}}, 
                  {$set: {'userClubs.$.rank': 1}}, function(err){
                  if(err){
                    logger.error(req.user._id+' : (index-41)updateUser err => '+err);
                    req.flash('error', 'Something went wrong :(');
                  } else{
                    logger.warn('Double ownership of'+userId+' found by: '+req.user.fullName+' User ID: '+req.user._id);
                    foundClub.save();
                  }
                  });
                // TRANSFERRING OWNERSHIP
                } else if(foundClub.clubUsers[i].userRank != 0 && foundClub.clubUsers[i].id.equals(userId)){
                  foundClub.clubUsers[i].userRank = newRank;
                  User.updateOne({_id: userId, userClubs: {$elemMatch: {id: clubId}}}, 
                  {$set: {'userClubs.$.rank': newRank}}, function(err){
                  if(err){
                    logger.error(req.user._id+' : (index-42)updateUser err => '+err);
                    req.flash('error', 'Something went wrong :(');
                  } else{
                    for(var j=0;j<foundClub.clubUsers.length;j++){
                      if(foundClub.clubUsers[j].id.equals(req.user._id)){
                        foundClub.clubUsers[j].userRank = 1;
                        User.updateOne({_id: req.user._id, userClubs: {$elemMatch: {id: clubId}}}, 
                        {$set: {'userClubs.$.rank': 1}}, function(err){
                        if(err){
                          logger.error(req.user._id+' : (index-43)updateUser err => '+err);
                          req.flash('error', 'Something went wrong :(');
                        } else{
                          foundClub.save();
                        }
                        })
                      }
                    }
                  }
                  });
                }
              }
            }
            presidentTransfer = true;
          }
        }
        if(!president){
          admin = checkRank(foundClub.clubUsers,req.user._id,1);
        }
        if((admin || president) && !presidentTransfer){
          if(0<newRank && newRank<5){
            for(var i=0;i<foundClub.clubUsers.length;i++){
              if(foundClub.clubUsers[i].id.equals(userId)){
                foundClub.clubUsers[i].userRank = newRank;
                User.updateOne({_id: userId, userClubs: {$elemMatch: {id: clubId}}}, 
                {$set: {'userClubs.$.rank': newRank}}, function(err){
                if(err){
                  logger.error(req.user._id+' : (index-44)updateUser err => '+err);
                  req.flash('error', 'Something went wrong :(');
                } else{
                  foundClub.save();
                }
                });
                break;
              }
            }
          }
        } else if(!president){
          logger.warn('Unauthorized rank change attempt of: '+userId+' by: '+req.user.fullName+' User ID: '+req.user._id);
        }
      }
      });
    }
    if(req.body.statusId){
      var userIdclubId = req.body.statusId.split(',');
      var userId = userIdclubId[0];
      var clubId = userIdclubId[1];
      if(req.user._id.equals(mongoose.Types.ObjectId(userId))){
        if(!req.body.status){
          var status = '';
        } else{
          var status = req.body.status;
        }
        User.updateOne({_id: userId, userClubs: {$elemMatch: {id: clubId}}}, 
        {$set: {'userClubs.$.status': status}}, function(err){
        if(err){
          logger.error(req.user._id+' : (index-45)updateUser err => '+err);
          req.flash('error', 'Something went wrong :(');
        } else{
          Club.updateOne({_id: clubId, clubUsers: {$elemMatch: {id: userId}}}, 
          {$set: {'clubUsers.$.userStatus': status}}, function(err){
            if(err){
              logger.error(req.user._id+' : (index-46)updateClub err => '+err);
              req.flash('error', 'Something went wrong :(');
            }
          });
        }
        });
      } else{
        logger.warn('Unauthorized status change attempt of: '+userId+' by: '+req.user.fullName+' User ID: '+req.user._id);
      }
    }
    if(req.body.leave){
      var userIdclubId = req.body.leave.split(',');
      var userId = userIdclubId[0];
      var clubId = userIdclubId[1];
      Club.findById(clubId, function(err, foundClub){
      if(err || !foundClub){
        logger.error(req.user._id+' : (index-47)foundClub err => '+err);
        req.flash('error', 'Something went wrong :(');
      } else{
        var admin = checkRank(foundClub.clubUsers,req.user._id,1);
        if(admin || req.user._id.equals(mongoose.Types.ObjectId(userId))){
          for(var i=foundClub.clubUsers.length-1;i>=0;i--){
            if(foundClub.clubUsers[i].id.equals(mongoose.Types.ObjectId(userId))){
              foundClub.clubUsers.splice(i,1);
              foundClub.membersCount -= 1;
              User.updateOne({_id: userId, userClubs: {$elemMatch: {id: clubId}}}, 
              {$pull: {userClubs: {id: clubId}}}, function(err){
              if(err){
                logger.error(req.user._id+' : (index-48)updateUser err => '+err);
                req.flash('error', 'Something went wrong :(');
              } else{
                ClubConversation.updateOne({_id: foundClub.conversationId, isActive: true, 
                seenMsgCursors: {$elemMatch: {id: userId}}}, {$pull: {seenMsgCursors: {id: userId}}}, 
                function(err){
                if(err){
                  logger.error(req.user._id+' : (index-49)foundClubConversation err => '+err);
                  req.flash('error', 'Something went wrong :(');
                }
                });
                foundClub.save();
              }
              });
              break;
            }
          }
        } else{
          logger.warn('Unauthorized club member removal attempt of: '+userId+' by: '+req.user.fullName+' User ID: '+req.user._id);
        }
      }
      });
    }
    return res.redirect('back');
  },

  indexViewAllFriends(req, res, next){
    var perPage = 12;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery : 1;
    User.findById(req.params.id, function(err, foundUser){
    if(err || !foundUser){
      logger.error('(index-50)foundUser err => '+err);
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      if(foundUser._id.equals(req.user._id) || foundUser.friends.includes(req.user._id)){
        User.find({_id: {$in: foundUser.friends}})
        .skip((perPage * pageNumber) - perPage).limit(perPage).sort({fullName: 1})
        .select({fullName: 1, profilePic: 1, profilePicId: 1, userKeys: 1, note: 1, lastActive: 1})
        .exec(function(err, foundFriends){
        if(err || !foundFriends){
          logger.error('(index-51)foundFriends err => '+err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        } else{
          var count = foundUser.friends.length;
          var foundFriendIds = foundFriends.map(function(user){
            return user._id;
          });
          var Friends_100_profilePic = [];
          for(var l=0;l<foundFriends.length;l++){
            if(process.env.ENVIRONMENT === 'dev'){
              Friends_100_profilePic[l] = clConfig.cloudinary.url(foundFriends[l].profilePicId, clConfig.thumb_200_obj);
            } else if (process.env.ENVIRONMENT === 'prod'){
              Friends_100_profilePic[l] = s3Config.thumb_200_prefix+foundFriends[l].profilePicId;
            }
          }
          var match = foundUser._id.equals(req.user._id);
          var userName = foundUser.fullName, userId = foundUser._id, friendsCount = foundUser.friendsCount;
          if(match){
            User.countDocuments({_id: {$in: foundUser.friends}, 
            lastActive: {$gt:new Date(Date.now() - 120*1000)}}, function(err, onlineFriendsCount){
              res.render('users/all_friends',{users: foundFriends, userName, userId, foundFriendIds, friendsCount,
              current: pageNumber, Friends_100_profilePic, pages: Math.ceil(count / perPage), match, onlineFriendsCount,
              cdn_prefix});
              return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
            });
          } else{
            res.render('users/all_friends',{users: foundFriends, userName, userId, foundFriendIds, friendsCount,
            current: pageNumber, Friends_100_profilePic, pages: Math.ceil(count / perPage), match, cdn_prefix});
            return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
          }
        }
        });
      } else{
        req.flash('success', 'You are not a friend with this person');
        return res.redirect('back');
      }
    }
    });
  },

  indexViewAllStudents(req, res, next){
    var perPage = 12;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery : 1;
    if(req.user.userKeys.college == req.params.college_key){
      const {dbQuery} = res.locals;
      const coordinates = JSON.stringify(res.locals.coordinates, null, 2);
      delete res.locals.dbQuery;
      delete res.locals.coordinates;
      delete res.locals.morePeopleUrl;
      delete res.locals.filterKeys;
      if(req.query.batch){
        var queryName = 'batch';
        var queryValue = req.query.batch;
        var dbQuery2 = dbQuery; 
      } else if(req.query.branch){
        var queryName = 'branch';
        var queryValue = req.query.branch;
        var dbQuery2 = dbQuery;
      } else if(req.query.house){
        var queryName = 'house';
        var queryValue = req.query.house;
        var dbQuery2 = dbQuery;
      } else if(req.query.school){
        var queryName = 'school';
        var queryValue = req.query.school;
        var dbQuery2 = dbQuery;
      } else if(req.query.hometown){
        var queryName = 'hometown';
        var queryValue = req.query.hometown;
        // Had to make custom query because countDocuments does not work with $near, replace with $geoWithin
        var dbQueryTemplate = `{"$and":[{"isVerified":true},{"geometry":{"$geoWithin":{"$center":[${coordinates}, 100000]}}}]}`;
        var dbQuery2 = JSON.parse(dbQueryTemplate);
      }
      User.countDocuments(dbQuery2).exec(function(err, count){
        User.find(dbQuery)
        .skip((perPage * pageNumber) - perPage).limit(perPage).sort({fullName: 1})
        .select({fullName: 1, profilePic: 1, profilePicId: 1, userKeys: 1, note: 1, lastActive: 1})
        .exec(function(err, foundStudents){
        if(err || !foundStudents){
          logger.error('(index-52)foundStudents err => '+err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        } else{
          var Students_100_profilePic = []; var collegeKey = req.params.college_key;
          for(var i=0;i<foundStudents.length;i++){
            if(process.env.ENVIRONMENT === 'dev'){
              Students_100_profilePic[i] = clConfig.cloudinary.url(foundStudents[i].profilePicId, clConfig.thumb_200_obj);
            } else if (process.env.ENVIRONMENT === 'prod'){
              Students_100_profilePic[i] = s3Config.thumb_200_prefix+foundStudents[i].profilePicId;
            }
          }
          res.render('users/all_students',{users: foundStudents, current: pageNumber, Students_100_profilePic,
          studentsCount: count, queryName, queryValue, pages: Math.ceil(count / perPage), collegeKey, cdn_prefix});
          return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
        }
        });
      });
    }
  },

  indexViewCollegePage(req, res, next){
    var nameEsc = req.params.college_name.replace(/\+/g, ' ').replace(/\%20/g, ' ');
    CollegePage.findOne({name: nameEsc, clubCount: {$gt: 0}})
    .populate({path: 'allClubs.categoryClubIds', select: 'name avatar avatarId banner chatRoomsCount clubUsers.id'})
    .exec(function(err, foundCollegePage){
    if(err){
      logger.error('(index-53)foundCollegePage err => '+err);
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else if(!foundCollegePage){
      req.flash('error', 'College page has no listed clubs');
      return res.redirect('back');
    } else{
      var Clubs_50_clubAvatar = []; var clubUserIdsArr = []; var friendsInClubArr = []; 
      var match = false; var following = false;
      var allClubsArr = foundCollegePage.allClubs.sort(function(a, b) {
        return parseFloat(a.categoryCount) - parseFloat(b.categoryCount);
      });
      if(req.user){
        if(req.user.userKeys.college == foundCollegePage.name){
          match = true;
        }
        currentUserId = req.user._id;
        var keyValue = 0;
        if(req.user.collegePagesView){
          keyValue = req.user.collegePagesView;
        }
        if(keyValue == 1){
          User.countDocuments({_id: {$in: foundCollegePage.allUserIds}, 
          lastActive: {$gt:new Date(Date.now() - 24*3600*1000)}}, function(err, todayActiveCount){
            for(var i=0;i<allClubsArr.length;i++){
              var arr2D = [];
              for(var j=0;j<allClubsArr[i].categoryClubIds.length;j++){
                if(process.env.ENVIRONMENT === 'dev'){
                  arr2D[j] = clConfig.cloudinary.url(allClubsArr[i].categoryClubIds[j].avatarId, clConfig.thumb_100_obj);
                } else if (process.env.ENVIRONMENT === 'prod'){
                  arr2D[j] = s3Config.thumb_100_prefix+allClubsArr[i].categoryClubIds[j].avatarId;
                }
              }
              Clubs_50_clubAvatar[i] = arr2D;
            }
            var thisCollegePageFollowingClubIdsArr = [];
            for(var j=foundCollegePage.allClubs.length-1;j>=0;j--){
              for(var k=foundCollegePage.allClubs[j].categoryClubIds.length-1;k>=0;k--){
                for(var l=0;l<req.user.followingClubCount;l++){
                  if(foundCollegePage.allClubs[j].categoryClubIds[k]._id.equals(req.user.followingClubIds[l])){
                    thisCollegePageFollowingClubIdsArr.push(foundCollegePage.allClubs[j].categoryClubIds[k]._id);
                    break;
                  }
                }
              }
            }
            var foundFriendsPicArr = []; var clubUserIdsArr = [];
            res.render('college_pages/index',{college_page: foundCollegePage, Clubs_50_clubAvatar, allClubs: allClubsArr,
            match, currentUserId, keyValue, thisCollegePageFollowingClubIdsArr, foundFriendsPicArr, clubUserIdsArr,
            todayActiveCount, cdn_prefix});
            return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
          });
        } else if(keyValue == 2){
          for(var i=0;i<allClubsArr.length;i++){
            var arr12D = []; var arr22D = [];
            for(var j=0;j<allClubsArr[i].categoryClubIds.length;j++){
              var arr23D = [];
              if(process.env.ENVIRONMENT === 'dev'){
                arr12D[j] = clConfig.cloudinary.url(allClubsArr[i].categoryClubIds[j].avatarId, clConfig.thumb_100_obj);
              } else if (process.env.ENVIRONMENT === 'prod'){
                arr12D[j] = s3Config.thumb_100_prefix+allClubsArr[i].categoryClubIds[j].avatarId;
              }
              // Very heavy (4 nested loops O_o)
              for(var k=0;k<allClubsArr[i].categoryClubIds[j].clubUsers.length;k++){
                for(var l=0;l<req.user.friends.length;l++){
                  if(req.user.friends[l].equals(allClubsArr[i].categoryClubIds[j].clubUsers[k].id)){
                    arr23D.push(allClubsArr[i].categoryClubIds[j].clubUsers[k].id);
                    friendsInClubArr.push(req.user.friends[l]);
                  }
                }
              }
            arr22D[j] = arr23D;
            }
            clubUserIdsArr[i] = arr22D;
            Clubs_50_clubAvatar[i] = arr12D;
          }
          User.find({_id: {$in: friendsInClubArr}})
          .select({_id: 1, fullName: 1, profilePic: 1, profilePicId: 1}).exec(function(err, foundFriends){
            if(err || !foundFriends){
              logger.error('(index-54)foundUser err => '+err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            } else{
              var thisCollegePageFollowingClubIdsArr = [];
              for(var j=foundCollegePage.allClubs.length-1;j>=0;j--){
                for(var k=foundCollegePage.allClubs[j].categoryClubIds.length-1;k>=0;k--){
                  for(var l=0;l<req.user.followingClubCount;l++){
                    if(foundCollegePage.allClubs[j].categoryClubIds[k]._id.equals(req.user.followingClubIds[l])){
                      thisCollegePageFollowingClubIdsArr.push(foundCollegePage.allClubs[j].categoryClubIds[k]._id);
                      break;
                    }
                  }
                }
              }
              var foundFriendsPicArr = [];
              for(var i=0;i<foundFriends.length;i++){
                var obj = {};
                obj['id'] = foundFriends[i]._id;
                obj['name'] = foundFriends[i].fullName;
                if(process.env.ENVIRONMENT === 'dev'){
                  obj['url'] = clConfig.cloudinary.url(foundFriends[i].profilePicId, clConfig.thumb_100_obj);
                } else if (process.env.ENVIRONMENT === 'prod'){
                  obj['url'] = s3Config.thumb_100_prefix+foundFriends[i].profilePicId;
                }
                foundFriendsPicArr.push(obj);
              }
              res.render('college_pages/index',{college_page: foundCollegePage, Clubs_50_clubAvatar, allClubs: allClubsArr,
              match, currentUserId, keyValue, thisCollegePageFollowingClubIdsArr, foundFriendsPicArr, clubUserIdsArr,
              cdn_prefix});
              return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
            }
          });
        } else if(keyValue == 0){
          for(var i=0;i<allClubsArr.length;i++){
            var arr2D = [];
            for(var j=0;j<allClubsArr[i].categoryClubIds.length;j++){
              if(process.env.ENVIRONMENT === 'dev'){
                arr2D[j] = clConfig.cloudinary.url(allClubsArr[i].categoryClubIds[j].avatarId, clConfig.thumb_100_obj);
              } else if (process.env.ENVIRONMENT === 'prod'){
                arr2D[j] = s3Config.thumb_100_prefix+allClubsArr[i].categoryClubIds[j].avatarId;
              }
            }
            Clubs_50_clubAvatar[i] = arr2D;
          }
          var thisCollegePageFollowingClubIdsArr = [];
          for(var j=foundCollegePage.allClubs.length-1;j>=0;j--){
            for(var k=foundCollegePage.allClubs[j].categoryClubIds.length-1;k>=0;k--){
              for(var l=0;l<req.user.followingClubCount;l++){
                if(foundCollegePage.allClubs[j].categoryClubIds[k]._id.equals(req.user.followingClubIds[l])){
                  thisCollegePageFollowingClubIdsArr.push(foundCollegePage.allClubs[j].categoryClubIds[k]._id);
                  break;
                }
              }
            }
          }
          res.render('college_pages/index',{college_page: foundCollegePage, Clubs_50_clubAvatar, allClubs: allClubsArr,
          match, currentUserId, keyValue, thisCollegePageFollowingClubIdsArr, cdn_prefix});
          return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
        }
      } else{
        for(var i=0;i<allClubsArr.length;i++){
          var arr2D = [];
          for(var j=0;j<allClubsArr[i].categoryClubIds.length;j++){
            if(process.env.ENVIRONMENT === 'dev'){
              arr2D[j] = clConfig.cloudinary.url(allClubsArr[i].categoryClubIds[j].avatarId, clConfig.thumb_100_obj);
            } else if (process.env.ENVIRONMENT === 'prod'){
              arr2D[j] = s3Config.thumb_100_prefix+allClubsArr[i].categoryClubIds[j].avatarId;
            }
          }
          Clubs_50_clubAvatar[i] = arr2D;
        }
        currentUserId = '';
        return res.render('college_pages/index',{college_page: foundCollegePage, Clubs_50_clubAvatar,
        allClubs: allClubsArr, match, currentUserId, keyValue, thisCollegePageFollowingClubIdsArr, cdn_prefix});
      }
    }
    });
  },

  indexFollowAllCollegePage(req, res, next){
    if(req.user && req.user._id.equals(req.params.user_id)){
      CollegePage.findOne({_id: req.params.college_id, clubCount: {$gt: 0}}, function(err, foundCollegePage){
      if(err || !foundCollegePage){
        logger.error('(index-55)foundCollegePage err => '+err);
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      } else{
        var notFollowingClubIdsArr = []; var thisCollegeFollowingClubIdsArr = [];
        for(var j=foundCollegePage.allClubs.length-1;j>=0;j--){
          for(var k=foundCollegePage.allClubs[j].categoryClubIds.length-1;k>=0;k--){
            notFollowingClubIdsArr.push(mongoose.Types.ObjectId(foundCollegePage.allClubs[j].categoryClubIds[k]));
            for(var l=0;l<req.user.followingClubCount;l++){
              if(foundCollegePage.allClubs[j].categoryClubIds[k].equals(req.user.followingClubIds[l])){
                thisCollegeFollowingClubIdsArr.push(mongoose.Types.ObjectId(foundCollegePage.allClubs[j].categoryClubIds[k]));
                notFollowingClubIdsArr.pop();
                break;
              }
            }
          }
        }
        var notFollowingClubsLength = notFollowingClubIdsArr.length;
        var thisCollegeFollowingClubsLength = thisCollegeFollowingClubIdsArr.length;

        if(req.body.followAllClubs == 'true'){
          Club.updateMany({_id: {$in: notFollowingClubIdsArr}, isActive: true}, 
          {$addToSet: {allFollowerIds: mongoose.Types.ObjectId(req.params.user_id)}, $inc: {followerCount: 1}}, 
          function(err){
            if(err){
              logger.error('(index-56)updateClubs err => '+err);
              return res.sendStatus(500);
            } else{
              User.updateOne({_id: req.params.user_id}, 
              {$addToSet: {followingClubIds: {$each: notFollowingClubIdsArr}}, 
              $inc: {followingClubCount: notFollowingClubsLength}}, function(err){
              if(err){
              logger.error(req.params.user_id+' : (index-57)updateUser err => '+err);
              req.flash('error', 'Something went wrong :(');
              } else{
                return res.redirect('back');
              }
              });
            }
          });
        } else if(req.body.followAllClubs == 'false'){
          Club.updateMany({_id: {$in: thisCollegeFollowingClubIdsArr}, isActive: true}, 
          {$pull: {allFollowerIds: req.params.user_id}, $inc: {followerCount: -1}}, function(err){
            if(err){
              logger.error('(index-58)updateClubs err => '+err);
              return res.sendStatus(500);
            } else{
              User.updateOne({_id: req.params.user_id}, 
              {$pull: {followingClubIds: {$in: thisCollegeFollowingClubIdsArr}}, 
              $inc: {followingClubCount: -thisCollegeFollowingClubsLength}}, function(err){
              if(err){
              logger.error(req.params.user_id+' : (index-59)updateUser err => '+err);
              req.flash('error', 'Something went wrong :(');
              } else{
                return res.redirect('back');
              }
              });
            }
          });
        }
      }
      });
    }
  },

  indexCollegePageSettings(req, res, next){
    if(req.user && req.user._id.equals(req.params.user_id)){
      if(req.body.initialCheckboxValue){
        if(req.body.initialCheckboxValue == 1){
          var toggleCollegePageViewKey = 2;
        } else if(req.body.initialCheckboxValue == 2){
          var toggleCollegePageViewKey = 1;
        } else{
          var toggleCollegePageViewKey = 1;
        }
        User.updateOne({_id: req.user._id},
        {$set: {'collegePagesView': toggleCollegePageViewKey}}, function(err){
        if(err){
          logger.error(req.user._id+' : (index-60)updateUser err => '+err);
          req.flash('error', 'Something went wrong :(');
        } else{
          return res.redirect('back');
        }
        });
      }
    }
  },

  indexFollowClubs(req, res, next){
    if(req.user && req.user._id.equals(req.params.user_id)){
      if(req.body.followClub == 'true' && followCheck(req.user,req.params.club_id,1)){
        Club.updateOne({_id: req.params.club_id, isActive: true}, 
        {$addToSet: {allFollowerIds: mongoose.Types.ObjectId(req.params.user_id)}, 
        $inc: {followerCount: 1}}, function(err){
        if(err){
          logger.error(req.user._id+' : (index-61)updateClub err => '+err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        } else{
          User.updateOne({_id: req.params.user_id}, 
          {$addToSet: {followingClubIds: mongoose.Types.ObjectId(req.params.club_id)}, 
          $inc: {followingClubCount: 1}}, function(err){
          if(err){
          logger.error(req.params.user_id+' : (index-62)updateUser err => '+err);
          req.flash('error', 'Something went wrong :(');
          } else{
            return res.redirect('back');
          }
          });
        }
        });
      } else if(req.body.followClub == 'false' && followCheck(req.user,req.params.club_id,2)){
        Club.updateOne({_id: req.params.club_id, isActive: true}, 
        {$pull: {allFollowerIds: req.params.user_id}, $inc: {followerCount: -1}}, function(err){
        if(err){
          logger.error(req.user._id+' : (index-63)updateClub err => '+err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        } else{
          User.updateOne({_id: req.params.user_id}, 
          {$pull: {followingClubIds: req.params.club_id}, $inc: {followingClubCount: -1}}, function(err){
          if(err){
          logger.error(req.user._id+' : (index-64)updateUser err => '+err);
          req.flash('error', 'Something went wrong :(');
          } else{
            return res.redirect('back');
          }
          });
        }
        });
      }
    }
  },

  indexShowFollowingClubs(req, res, next){
    if(req.user && req.user._id.equals(req.params.id)){
      Club.find({_id: {$in: req.user.followingClubIds}})
      .select({_id: 1, name: 1}).exec(function(err, followingClubs){
        res.json({followingClubs, csrfToken: res.locals.csrfToken, cdn_prefix});
        return User.updateOne({_id: req.user._id}, {$currentDate: {lastActive: true}}).exec();
      });
    }
  },

  indexSettingsPage(req, res, next){
    res.render("settings");
  },

  indexSettingsPagePost(req, res, next){
    // 1. Dark theme toggler
    if(req.body.theme){
      const toSet = (req.body.theme === "dark") ? true : false;
      User.updateOne({_id: req.user._id}, { darkTheme: toSet }, function(err){
        if(err){
          return res.redirect('back');
        } else{
          return res.redirect('/users/'+req.user._id+'/settings');
        }
      });
    }
  },

  indexFeedbackPage(req, res, next){
    res.render("feedback");
  }
};

//*******************FUNCTIONS***********************
function escapeRegExp(str){
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function checkRank(clubUsers,userId,rank){
  var ok = false;
  clubUsers.forEach(function(user){
    if(user.id.equals(userId) && user.userRank <= rank){
      ok = true;
    }
  });
  return ok;
};

function followCheck(currentUser,clubId,caseNum){
  var ok; var isFollowingClub = false;
  for(var i=0;i<currentUser.followingClubCount;i++){
    if(currentUser.followingClubIds[i].equals(clubId)){
      isFollowingClub = true;
      break;
    }
  }
  if(caseNum == 1){
    if(!isFollowingClub){
      return ok = true;
    } else{
      return ok = false;
    }
  } else if (caseNum == 2){
    if(isFollowingClub){
      return ok = true;
    } else{
      return ok = false;
    }
  }
}

function contains2(array, obj){
  var len = array.length;
  if(len!=0){
    for(var i=0;i<len;i++){
      if(array[i].id.equals(obj)){
        return true;
        break;
      }
    }
    return false;
  } else if(len == 0){return false};
}