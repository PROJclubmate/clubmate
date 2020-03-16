const express     = require('express'),
  router          = express.Router(),
  User            = require('../models/user'),
  Club            = require('../models/club'),
  Post            = require('../models/post'),
  OrgPage         = require('../models/organization-page'),
  Subscription    = require('../models/subscription'),
  mongoose        = require('mongoose'),
  {cloudinary}    = require('../public/js/cloudinary.js'),
  webpush         = require('web-push'),
  mbxGeocoding    = require('@mapbox/mapbox-sdk/services/geocoding'),
  geocodingClient = mbxGeocoding({ accessToken: process.env.MAPBOX_TOKEN });


const publicVapidKey = 'BIlA75fh7DBK0PTVj3oMSnSEVfP8M7HHM6wZFvcUYr_CWnMiQPrZAjP34V-iMGJMCKhBIXlOnfUK5PfR__kjcwM';
const privateVapidKey = 'JVEoDpfY8snHhRhwWhx7gThMWNBxohn9CcdXE0yAqgU';

webpush.setVapidDetails('mailto:team@clubmate.co.in', publicVapidKey, privateVapidKey);


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
        return console.log(Date.now()+' : '+'(index-1)foundUsers err:- '+JSON.stringify(err, null, 2));
      }
    });
    // Send 201-resource created
    res.status(201).json({});
  },

  indexRoot(req, res, next){
    if(req.user){
      res.redirect('/users/'+req.user._id);
    } else{
      res.render('landing');
    }
  },

  indexHelp(req, res, next){
    res.render('help');
  },

  indexFAQ(req, res, next){
    res.render('faq');
  },

  indexSearch(req, res, next){
    const query = req.query.search;
    User.find({$text: {$search: query}}, {score: {$meta: 'textScore'}}).sort({score: {$meta: 'textScore'}})
    .select({isVerified: 1, fullName: 1, profilePic: 1, profilePicId: 1, userKeys: 1, note: 1}).limit(3)
    .exec(function(err, foundUsers){
    if(err || !foundUsers){
      console.log(Date.now()+' : '+'(index-2)foundUsers err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      var Users_100_profilePic = [];
      for(var l=0;l<foundUsers.length;l++){
        Users_100_profilePic[l] = cloudinary.url(foundUsers[l].profilePicId,
        {width: 200, height: 200, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
      }
      Club.find({$text: {$search: query}, isActive: true}, {score: {$meta: 'textScore'}}).sort({score: {$meta: 'textScore'}})
      .select({name: 1, avatar: 1, avatarId: 1, clubKeys: 1, banner: 1}).limit(3)
      .exec(function(err, foundClubs){
      if(err || !foundClubs){
        console.log(Date.now()+' : '+'(index-3)foundClubs err:- '+JSON.stringify(err, null, 2));
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      } else{
        var Clubs_100_Avatar = [];
        for(var l=0;l<foundClubs.length;l++){
          Clubs_100_Avatar[l] = cloudinary.url(foundClubs[l].avatarId,
          {width: 200, height: 200, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
        }
        OrgPage.find({$text: {$search: query}, clubCount: {$gt: 0}}, {score: {$meta: 'textScore'}})
        .sort({score: {$meta: 'textScore'}}).exec(function(err, foundOrgPages){
        if(err || !foundOrgPages){
          console.log(Date.now()+' : '+'(index-4)foundOrgPages err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        } else{
          res.render('search/index',{users: foundUsers, clubs: foundClubs, org_pages: foundOrgPages, query,
          Users_100_profilePic, Clubs_100_Avatar});
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
      console.log(Date.now()+' : '+'(index-5)foundUsers err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      var foundUserIds = foundUsers.map(function(user){
        return user._id;
      });
      var Users_100_profilePic = [];
      for(var l=0;l<foundUsers.length;l++){
        Users_100_profilePic[l] = cloudinary.url(foundUsers[l].profilePicId,
        {width: 200, height: 200, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
      }
      res.render('search/people',{users: foundUsers, query, foundUserIds, filter: false, morePeopleUrl: '',
      emailSearch: true, Users_100_profilePic});
    }
    });
  },

  indexSearchPeople(req, res, next){
    const query = req.query.people;
    User.find({$text: {$search: query}}, {score: {$meta: 'textScore'}}).sort({score: {$meta: 'textScore'}})
    .select({isVerified: 1, fullName: 1, profilePic: 1, profilePicId: 1, userKeys: 1, note: 1, email: 1}).limit(10)
    .exec(function(err, foundUsers){
    if(err || !foundUsers){
      console.log(Date.now()+' : '+'(index-6)foundUsers err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      var foundUserIds = foundUsers.map(function(user){
        return user._id;
      });
      var Users_100_profilePic = [];
      for(var l=0;l<foundUsers.length;l++){
        Users_100_profilePic[l] = cloudinary.url(foundUsers[l].profilePicId,
        {width: 200, height: 200, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
      }
      res.render('search/people',{users: foundUsers, query, foundUserIds, filter: false, morePeopleUrl: '',
      emailSearch: false, Users_100_profilePic});
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
    User.find({$text: {$search: query}, _id: {$nin: seenIds}}, {score: {$meta: 'textScore'}}).sort({score: {$meta: 'textScore'}})
    .select({isVerified: 1, fullName: 1, profilePic: 1, profilePicId: 1, userKeys: 1, note: 1, email: 1}).limit(10)
    .exec(function(err, foundUsers){
    if(err || !foundUsers){
      console.log(Date.now()+' : '+'(index-7)foundUsers err:- '+JSON.stringify(err, null, 2));
      return res.sendStatus(500);
    } else{
      var foundUserIds = foundUsers.map(function(user){
        return user._id;
      });
      var currentUser = req.user;
      var Users_100_profilePic = [];
      for(var l=0;l<foundUsers.length;l++){
        Users_100_profilePic[l] = cloudinary.url(foundUsers[l].profilePicId,
        {width: 200, height: 200, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
      }
      return res.json({users: foundUsers, query, foundUserIds, currentUser, filter: false, emailSearch: false,
      Users_100_profilePic});
    }
    });
  },

  indexFilterSearchPeople(req, res, next){
    const query = req.query;
    const {dbQuery} = res.locals;
    const morePeopleUrl = res.locals.morePeopleUrl;
    const filterKeys = res.locals.filterKeys;
    delete res.locals.dbQuery;
    delete res.locals.morePeopleUrl;
    delete res.locals.moreClubsUrl;
    User.find(dbQuery).select({isVerified: 1, fullName: 1, profilePic: 1, profilePicId: 1, userKeys: 1, note: 1, email: 1})
    .limit(10).exec(function(err, foundUsers){
    if(err){
      console.log(Date.now()+' : '+'(index-8)foundUsers err:- '+JSON.stringify(err, null, 2));
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
        Users_100_profilePic[l] = cloudinary.url(foundUsers[l].profilePicId,
        {width: 200, height: 200, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
      }
      res.render('search/people',{users: foundUsers, query, foundUserIds, filter: true, morePeopleUrl, filterKeys,
      emailSearch: false, Users_100_profilePic});
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
      var workplace = urlEqualsSplit[3];
      if(workplace.split('&')[0]){
        workplace = new RegExp(escapeRegExp(workplace.split('&')[0].replace(/\+/g, ' ').replace(/\%20/g, ' ')), 'gi');
        dbQueries.push({'userKeys.workplace': workplace});
      }
      var school = urlEqualsSplit[4];
      if(school.split('&')[0]){
        school = new RegExp(escapeRegExp(school.split('&')[0].replace(/\+/g, ' ').replace(/\%20/g, ' ')), 'gi');
        dbQueries.push({'userKeys.school': school});
      }
      var location = urlEqualsSplit[5];
      if(location.split('&')[0]){
        let coordinates;
        try{
          if(location.split('&')[0].includes('\+')){
            // replacing ascii characters of [, ]
            location = JSON.parse(location.split('&')[0].replace(/\+/g, ' ').replace(/\%5B/g, '[')
            .replace(/\%5D/g, ']').replace(/\%2C/g, ','));
          } else{
            location = location.split('&')[0].replace(/\%20/g, ' ');
            location = JSON.parse(location);
          }
          coordinates = location;
        } catch(err){
          const response = await geocodingClient.forwardGeocode({
            query: location,
            limit: 1
          }).send();
          coordinates = response.body.features[0].geometry.coordinates;
        }
        if(urlEqualsSplit[6]){
          var distance = Number(urlEqualsSplit[9]);
        }
        let maxDistance = distance || 25;
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
      console.log(Date.now()+' : '+'(index-9)foundUsers err:- '+JSON.stringify(err, null, 2));
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
        Users_100_profilePic[l] = cloudinary.url(foundUsers[l].profilePicId,
        {width: 200, height: 200, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
      }
      return res.json({users: foundUsers, query, foundUserIds, filter: true, emailSearch: false, currentUser,
      Users_100_profilePic});
    }
    });
  },

  indexSearchClubs(req, res, next){
    const query = req.query.clubs;
    Club.find({$text: {$search: query}, isActive: true}, {score: {$meta: 'textScore'}}).sort({score: {$meta: 'textScore'}})
    .select({name: 1, avatar: 1, avatarId: 1, categories: 1, clubKeys: 1, banner: 1}).limit(10)
    .exec(function(err, foundClubs){
    if(err || !foundClubs){
      console.log(Date.now()+' : '+'(index-10)foundClubs err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      var foundClubIds = foundClubs.map(function(club){
        return club._id;
      });
      var Clubs_100_Avatar = [];
      for(var l=0;l<foundClubs.length;l++){
        Clubs_100_Avatar[l] = cloudinary.url(foundClubs[l].avatarId,
        {width: 200, height: 200, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
      }
      res.render('search/clubs',{clubs: foundClubs, query, foundClubIds, filter: false, moreClubsUrl: '',
      Clubs_100_Avatar});
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
      console.log(Date.now()+' : '+'(index-11)foundClubs err:- '+JSON.stringify(err, null, 2));
      return res.sendStatus(500);
    } else{
      var foundClubIds = foundClubs.map(function(club){
        return club._id;
      });
      var currentUser = req.user;
      var Clubs_100_Avatar = [];
      for(var l=0;l<foundClubs.length;l++){
        Clubs_100_Avatar[l] = cloudinary.url(foundClubs[l].avatarId,
        {width: 200, height: 200, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
      }
      return res.json({clubs: foundClubs, query, foundClubIds, currentUser, filter: false, Clubs_100_Avatar});
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
    delete res.locals.moreClubsUrl;
    Club.find(dbQuery).select({name: 1, avatar: 1, avatarId: 1, clubKeys: 1, banner: 1, categories: 1})
    .limit(10).exec(function(err, foundClubs){
    if(err){
      console.log(Date.now()+' : '+'(index-12)foundClubs err:- '+JSON.stringify(err, null, 2));
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
        Clubs_100_Avatar[l] = cloudinary.url(foundClubs[l].avatarId,
        {width: 200, height: 200, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
      }
      res.render('search/clubs',{clubs: foundClubs, query, foundClubIds, filter: true, moreClubsUrl, filterKeys,
      Clubs_100_Avatar});
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
      var clubs = urlEqualsSplit[1];
      if(clubs.split('&')[0]){
        clubs = new RegExp(escapeRegExp(clubs.split('&')[0].replace(/\+/g, ' ')), 'gi');
        dbQueries.push({name: clubs});
      }
      var organization = urlEqualsSplit[2];
      if(organization.split('&')[0]){
        organization = new RegExp(escapeRegExp(organization.split('&')[0].replace(/\+/g, ' ').replace(/\%20/g, ' ')), 'gi');
        dbQueries.push({'clubKeys.organization': organization});
      }
      var category = urlEqualsSplit[3];
      if(category.split('&')[0]){
        category = new RegExp(escapeRegExp(category.split('&')[0].replace(/\+/g, ' ').replace(/\%20/g, ' ')), 'gi');
        dbQueries.push({'clubKeys.category': category});
      }
      var location = urlEqualsSplit[4];
      if(location.split('&')[0]){ 
        let coordinates;
        try{
          if(location.split('&')[0].includes('\+')){
            // replacing ascii characters of [, ]
            location = JSON.parse(location.split('&')[0].replace(/\+/g, ' ').replace(/\%5B/g, '[')
            .replace(/\%5D/g, ']').replace(/\%2C/g, ','));
          } else{
            location = location.split('&')[0].replace(/\%20/g, ' ');
            location = JSON.parse(location);
          }
          coordinates = location;
        } catch(err){
          const response = await geocodingClient.forwardGeocode({
            query: location,
            limit: 1
          }).send();
          coordinates = response.body.features[0].geometry.coordinates;
        }
        if(urlEqualsSplit[5]){
          var distance = Number(urlEqualsSplit[5]);
        }
        let maxDistance = distance || 25;
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
    Club.find({$and: dbQueries})
    .select({name: 1, avatar: 1, avatarId: 1, clubKeys: 1, banner: 1, categories: 1})
    .limit(10).exec(function(err, foundClubs){
    if(err){
      console.log(Date.now()+' : '+'(index-13)foundClubs err:- '+JSON.stringify(err, null, 2));
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
        Clubs_100_Avatar[l] = cloudinary.url(foundClubs[l].avatarId,
        {width: 200, height: 200, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
      }
      return res.json({clubs: foundClubs, query, foundUserIds, filter: true, currentUser, Clubs_100_Avatar});
    }
    });
  },

  indexSearchOrgPages(req, res, next){
    const query = req.query.org_pages;
    OrgPage.find({$text: {$search: query}, clubCount: {$gt: 0}}, {score: {$meta: 'textScore'}})
    .sort({score: {$meta: 'textScore'}}).limit(10).exec(function(err, foundOrgPages){
    if(err || !foundOrgPages){
      console.log(Date.now()+' : '+'(index-14)foundOrgPages err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      var foundOrgPageIds = foundOrgPages.map(function(orgPage){
        return orgPage._id;
      });
      var matchArr = [];
      if(req.user){
        for(var i=0;i<foundOrgPages.length;i++){
          if(req.user.userKeys.college == foundOrgPages[i].name){
            matchArr[i] = true;
          }
        }
      }
      res.render('search/org_pages',{org_pages: foundOrgPages, query, foundOrgPageIds, matchArr});
    }
    });
  },

  indexSearchMoreOrgPages(req, res, next){
    const query = req.params.query;
    if(req.query.ids.split(',') != ''){
      var seenIds = req.query.ids.split(',');
    } else{
      var seenIds = [];
    }
    OrgPage.find({$text: {$search: query}, clubCount: {$gt: 0}, _id: {$nin: seenIds}}, {score: {$meta: 'textScore'}})
    .sort({score: {$meta: 'textScore'}}).limit(10).exec(function(err, foundOrgPages){
    if(err || !foundOrgPages){
      console.log(Date.now()+' : '+'(index-15)foundOrgPages err:- '+JSON.stringify(err, null, 2));
      return res.sendStatus(500);
    } else{
      var foundOrgPageIds = foundOrgPages.map(function(orgPage){
        return orgPage._id;
      });
      var matchArr = [];
      if(req.user){
        for(var i=0;i<foundOrgPages.length;i++){
          if(req.user.userKeys.college == foundOrgPages[i].name){
            matchArr[i] = true;
          }
        }
      }
      var currentUser = req.user;
      return res.json({org_pages: foundOrgPages, query, foundOrgPageIds, matchArr});
    }
    });
  },

  indexRequests(req, res, next){
    // CLUB INVITES
    if(req.body.clubId){
      var clubIduserId = req.body.clubId.split(',');
      var adminClubId = mongoose.Types.ObjectId(clubIduserId[0]);
      var invitedUserId = mongoose.Types.ObjectId(clubIduserId[1]);
      User.updateOne({_id: invitedUserId},{$addToSet: {clubInvites: adminClubId}}, function(err, foundUser){
        if(err || !foundUser){
          console.log(Date.now()+' : '+req.user._id+' => (index-16)foundUser err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
        } else{
          Club.findById(adminClubId, function(err, foundClub){
          if(err || !foundClub){
            console.log(Date.now()+' : '+req.user._id+' => (index-17)foundClub err:- '+JSON.stringify(err, null, 2));
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
            var CI_50_clubAvatar = cloudinary.url(foundClub.avatarId, {width: 100, height: 100, 
              quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
            var title = foundClub.name+' sent you an invite';
            var openUrl = 'https://www.clubmate.co.in/clubs/'+clubIduserId[0];
            webpush.setVapidDetails('mailto:team@clubmate.co.in',
            'BIlA75fh7DBK0PTVj3oMSnSEVfP8M7HHM6wZFvcUYr_CWnMiQPrZAjP34V-iMGJMCKhBIXlOnfUK5PfR__kjcwM',
            'JVEoDpfY8snHhRhwWhx7gThMWNBxohn9CcdXE0yAqgU');
            Subscription.find({userId: invitedUserId}).sort({'createdAt': -1}).limit(1)
            .exec(function(err, foundSubscriptions){
            if(err || !foundSubscriptions){
              console.log(Date.now()+' : '+req.user._id+' => (index-18)foundSubscriptions err:- '+JSON.stringify(err, null, 2));
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
                      console.log(Date.now()+' : '+req.user._id+' => (index-19)foundSubscription err:- '+JSON.stringify(err, null, 2));
                      req.flash('error', 'Something went wrong :(');
                      return res.redirect('back');
                    }
                    });
                  } else{
                    console.log(Date.now()+' : '+err);
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
      User.updateOne({_id: invitedUserId},{$pull: {clubInvites: adminClubId}}, function(err, foundUser){
        if(err || !foundUser){
          console.log(Date.now()+' : '+req.user._id+' => (index-20)foundUser err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
        }
      });
    }
    if(req.body.removeInvite){
      var removeInvite = mongoose.Types.ObjectId(req.body.removeInvite);
      User.updateOne({_id: req.user._id},{$pull: {clubInvites: removeInvite}}, function(err, foundUser){
        if(err || !foundUser){
          console.log(Date.now()+' : '+req.user._id+' => (index-21)foundUser err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
        }
      });
    };
    if(req.body.acceptInvite){
      var acceptInvite = mongoose.Types.ObjectId(req.body.acceptInvite);
      User.findOneAndUpdate({_id: req.user._id},{$pull: {clubInvites: acceptInvite}}, {new: true}, function(err, foundUser){
      if(err || !foundUser){
        console.log(Date.now()+' : '+req.user._id+' => (index-22)foundUser err:- '+JSON.stringify(err, null, 2));
        req.flash('error', 'Something went wrong :(');
      } else{
        Club.findById(acceptInvite, function(err, foundClub){
        if(err || !foundClub){
          console.log(Date.now()+' : '+req.user._id+' => (index-23)foundClub err:- '+JSON.stringify(err, null, 2));
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
      User.updateOne({_id: friendReq},{$addToSet: {friendRequests: req.user._id}}, function(err, foundUser){
        if(err || !foundUser){
          console.log(Date.now()+' : '+req.user._id+' => (index-24)foundUser err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
        } else{
          User.findById(req.user._id).select({fullName: 1, profilePic: 1, profilePicId: 1})
          .exec(function(err, foundUser){
          if(err || !foundUser){
            console.log(Date.now()+' : '+req.user._id+' => (index-25)foundUser err:- '+JSON.stringify(err, null, 2));
            req.flash('error', 'Something went wrong :(');
          } else{
            var FR_50_profilePic = cloudinary.url(foundUser.profilePicId, {width: 100, height: 100, 
              quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
            var title = foundUser.fullName+' sent you a request';
            var openUrl = 'https://www.clubmate.co.in/users/'+req.user._id;
            webpush.setVapidDetails('mailto:team@clubmate.co.in',
            'BIlA75fh7DBK0PTVj3oMSnSEVfP8M7HHM6wZFvcUYr_CWnMiQPrZAjP34V-iMGJMCKhBIXlOnfUK5PfR__kjcwM',
            'JVEoDpfY8snHhRhwWhx7gThMWNBxohn9CcdXE0yAqgU');
            Subscription.find({userId: friendReq}).sort({'createdAt': -1})
            .exec(function(err, foundSubscriptions){
            if(err || !foundSubscriptions){
              console.log(Date.now()+' : '+req.user._id+' => (index-26)foundSubscriptions err:- '+JSON.stringify(err, null, 2));
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
                      console.log(Date.now()+' : '+req.user._id+' => (index-27)foundSubscription err:- '+JSON.stringify(err, null, 2));
                      req.flash('error', 'Something went wrong :(');
                      return res.redirect('back');
                    }
                    });
                  } else{
                    console.log(Date.now()+' : '+err);
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
      User.updateOne({_id: cancelReq},{$pull: {friendRequests: req.user._id}}, function(err, foundUser){
        if(err || !foundUser){
          console.log(Date.now()+' : '+req.user._id+' => (index-28)foundUser err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
        }
      });
    };
    if(req.body.removeReq){
      var removeReq = mongoose.Types.ObjectId(req.body.removeReq);
      User.updateOne({_id: req.user._id},{$pull: {friendRequests: removeReq}}, function(err, foundUser){
        if(err || !foundUser){
          console.log(Date.now()+' : '+req.user._id+' => (index-29)foundUser err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
        }
      });
    };
    if(req.body.acceptReq){
      var acceptReq = mongoose.Types.ObjectId(req.body.acceptReq);
      User.updateOne({_id: req.user._id}, 
      {$pull: {friendRequests: acceptReq}, $addToSet: {friends: acceptReq}, $inc: {friendsCount: 1}}, 
      function(err, foundUser){
      if(err || !foundUser){
        console.log(Date.now()+' : '+req.user._id+' => (index-30)foundUser err:- '+JSON.stringify(err, null, 2));
        req.flash('error', 'Something went wrong :(');
      } else{
        User.updateOne({_id: acceptReq}, 
        {$addToSet: {friends: req.user._id}, $inc: {friendsCount: 1}}, function(err, foundUser){
          if(err || !foundUser){
            console.log(Date.now()+' : '+req.user._id+' => (index-31)foundUser err:- '+JSON.stringify(err, null, 2));
            req.flash('error', 'Something went wrong :(');
          }
        });
      }
      });
    };
    if(req.body.unFriendReq){
      var unFriendReq = mongoose.Types.ObjectId(req.body.unFriendReq);
      User.updateOne({_id: req.user._id}, 
      {$pull: {friends: unFriendReq}, $inc: {friendsCount: -1}}, function(err, foundUser){
      if(err || !foundUser){
        console.log(Date.now()+' : '+req.user._id+' => (index-32)foundUser err:- '+JSON.stringify(err, null, 2));
        req.flash('error', 'Something went wrong :(');
      } else{
        User.updateOne({_id: unFriendReq}, 
        {$pull: {friends: req.user._id}, $inc: {friendsCount: -1}}, function(err, foundUser){
          if(err || !foundUser){
            console.log(Date.now()+' : '+req.user._id+' => (index-33)foundUser err:- '+JSON.stringify(err, null, 2));
            req.flash('error', 'Something went wrong :(');
          }
        });
      }
      });
    };
    // res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.redirect('back');
  },

  indexMemberRequests(req, res, next){
    if(req.body.memberReq){
      var obj = {};
        obj['userId'] = req.user._id;
        obj['message'] = req.body.message;
      var memberReq = mongoose.Types.ObjectId(req.body.memberReq);
      Club.updateOne({_id: memberReq}, {$addToSet: {memberRequests: obj}}, function(err, foundClub){
        if(err || !foundClub){
          console.log(Date.now()+' : '+req.user._id+' => (index-34)foundClub err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
        }
      });
    } else if(req.body.cancelReq){
      var cancelReq = mongoose.Types.ObjectId(req.body.cancelReq);
      Club.updateOne({_id: cancelReq}, {$pull: {memberRequests: {userId: req.user._id}}}, function(err, foundClub){
        if(err || !foundClub){
          console.log(Date.now()+' : '+req.user._id+' => (index-35)foundClub err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
        }
      });
    } else if(req.body.acceptReq){
      var acceptReq = mongoose.Types.ObjectId(req.body.acceptReq);
      var clubId = mongoose.Types.ObjectId(req.params.id);
      Club.updateOne({_id: clubId}, {$pull: {memberRequests: {userId: acceptReq}}}, function(err, foundClub){
        if(err || !foundClub){
          console.log(Date.now()+' : '+req.user._id+' => (index-36)foundClub err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
        } else{
          User.updateOne({_id: acceptReq}, {$addToSet: {clubInvites: clubId}}, function(err, foundUser){
            if(err || !foundUser){
              console.log(Date.now()+' : '+req.user._id+' => (index-37)foundUser err:- '+JSON.stringify(err, null, 2));
              req.flash('error', 'Something went wrong :(');
            }
          });
        }
      });
    } else if(req.body.declineReq){
      var declineReq = mongoose.Types.ObjectId(req.body.declineReq);
      var clubId = mongoose.Types.ObjectId(req.params.id);
      Club.updateOne({_id: clubId}, {$pull: {memberRequests: {userId: declineReq}}}, function(err, foundClub){
        if(err || !foundClub){
          console.log(Date.now()+' : '+req.user._id+' => (index-38)foundClub err:- '+JSON.stringify(err, null, 2));
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
        console.log(Date.now()+' : '+req.user._id+' => (index-39)foundClub err:- '+JSON.stringify(err, null, 2));
        req.flash('error', 'Something went wrong :(');
      } else{
        var owner, admin, ownerTransfer = false;
        owner = checkRank(foundClub.clubUsers,req.user._id,0);
        if(owner){
          if(newRank == 0){
            for(var i=0;i<foundClub.clubUsers.length;i++){
              if(!foundClub.clubUsers[i].id.equals(req.user._id)){
                // IF ANYONE OTHER THAN OWNER HAS FOUNDERSHIP; MAKE ADMIN AND LOG REPORT
                if(foundClub.clubUsers[i].userRank == 0){
                  foundClub.clubUsers[i].userRank = 1;
                  User.updateOne({_id: userId, userClubs: {$elemMatch: {id: clubId}}}, 
                  {$set: {'userClubs.$.rank': 1}}, function(err, foundUser){
                  if(err || !foundUser){
                    console.log(Date.now()+' : '+req.user._id+' => (index-40)foundUser err:- '+JSON.stringify(err, null, 2));
                    req.flash('error', 'Something went wrong :(');
                  } else{
                    console.log(Date.now()+' : '+'Double ownership of'+userId+
                    ' found by: '+req.user.fullName+' User ID: '+req.user._id);
                    foundClub.save();
                  }
                  });
                // TRANSFERRING OWNERSHIP
                } else if(foundClub.clubUsers[i].userRank != 0 && foundClub.clubUsers[i].id.equals(userId)){
                  foundClub.clubUsers[i].userRank = newRank;
                  User.updateOne({_id: userId, userClubs: {$elemMatch: {id: clubId}}}, 
                  {$set: {'userClubs.$.rank': newRank}}, function(err, foundUser){
                  if(err || !foundUser){
                    console.log(Date.now()+' : '+req.user._id+' => (index-41)foundUser err:- '+JSON.stringify(err, null, 2));
                    req.flash('error', 'Something went wrong :(');
                  } else{
                    for(var j=0;j<foundClub.clubUsers.length;j++){
                      if(foundClub.clubUsers[j].id.equals(req.user._id)){
                        foundClub.clubUsers[j].userRank = 1;
                        User.updateOne({_id: req.user._id, userClubs: {$elemMatch: {id: clubId}}}, 
                        {$set: {'userClubs.$.rank': 1}}, function(err, foundUser){
                        if(err || !foundUser){
                          console.log(Date.now()+' : '+req.user._id+' => (index-42)foundUser err:- '+JSON.stringify(err, null, 2));
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
            ownerTransfer = true;
          }
        }
        if(!owner){
          admin = checkRank(foundClub.clubUsers,req.user._id,1);
        }
        if((admin || owner) && !ownerTransfer){
          if(0<newRank && newRank<5){
            for(var i=0;i<foundClub.clubUsers.length;i++){
              if(foundClub.clubUsers[i].id.equals(userId)){
                foundClub.clubUsers[i].userRank = newRank;
                User.updateOne({_id: userId, userClubs: {$elemMatch: {id: clubId}}}, 
                {$set: {'userClubs.$.rank': newRank}}, function(err, foundUser){
                if(err || !foundUser){
                  console.log(Date.now()+' : '+req.user._id+' => (index-43)foundUser err:- '+JSON.stringify(err, null, 2));
                  req.flash('error', 'Something went wrong :(');
                } else{
                  foundClub.save();
                }
                });
                break;
              }
            }
          }
        } else if(!owner){
          console.log(Date.now()+' : '+'Unauthorized rank change attempt of: '+userId+
          ' by: '+req.user.fullName+' User ID: '+req.user._id);
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
        {$set: {'userClubs.$.status': status}}, function(err, foundUser){
        if(err || !foundUser){
          console.log(Date.now()+' : '+req.user._id+' => (index-44)foundUser err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
        } else{
          Club.updateOne({_id: clubId, clubUsers: {$elemMatch: {id: userId}}}, 
          {$set: {'clubUsers.$.userStatus': status}}, function(err, foundClub){
            if(err || !foundClub){
              console.log(Date.now()+' : '+req.user._id+' => (index-45)foundClub err:- '+JSON.stringify(err, null, 2));
              req.flash('error', 'Something went wrong :(');
            }
          });
        }
        });
      } else{
        console.log(Date.now()+' : '+'Unauthorized status change attempt of: '+userId+
        ' by: '+req.user.fullName+' User ID: '+req.user._id);
      }
    }
    if(req.body.leave){
      var userIdclubId = req.body.leave.split(',');
      var userId = userIdclubId[0];
      var clubId = userIdclubId[1];
      Club.findById(clubId, function(err, foundClub){
      if(err || !foundClub){
        console.log(Date.now()+' : '+req.user._id+' => (index-46)foundClub err:- '+JSON.stringify(err, null, 2));
        req.flash('error', 'Something went wrong :(');
      } else{
        var admin = checkRank(foundClub.clubUsers,req.user._id,1);
        if(admin || req.user._id.equals(mongoose.Types.ObjectId(userId))){
          for(var i=foundClub.clubUsers.length-1;i>=0;i--){
            if(foundClub.clubUsers[i].id.equals(mongoose.Types.ObjectId(userId))){
              foundClub.clubUsers.splice(i,1);
              foundClub.membersCount -= 1;
              User.updateOne({_id: userId, userClubs: {$elemMatch: {id: clubId}}}, 
              {$pull: {userClubs: {id: clubId}}}, function(err, foundUser){
              if(err || !foundUser){
                console.log(Date.now()+' : '+req.user._id+' => (index-47)foundUser err:- '+JSON.stringify(err, null, 2));
                req.flash('error', 'Something went wrong :(');
              } else{
                foundClub.save();
              }
              });
              break;
            }
          }
        } else{
          console.log(Date.now()+' : '+'Unauthorized club member removal attempt of: '+userId+
          ' by: '+req.user.fullName+' User ID: '+req.user._id);
        }
      }
      });
    }
    res.redirect('back');
  },

  indexViewAllFriends(req, res, next){
    var perPage = 12;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery : 1;
    User.findById(req.params.id, function(err, foundUser){
    if(err || !foundUser){
      console.log(Date.now()+' : '+'(index-48)foundUser err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      if(foundUser._id.equals(req.user._id) || foundUser.friends.includes(req.user._id)){
        User.find({_id: {$in: foundUser.friends}})
        .skip((perPage * pageNumber) - perPage).limit(perPage).sort({fullName: 1})
        .select({fullName: 1, profilePic: 1, profilePicId: 1, userKeys: 1, note: 1, isLoggedIn: 1})
        .exec(function(err, foundFriends){
        if(err || !foundFriends){
          console.log(Date.now()+' : '+'(index-49)foundFriends err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        } else{
          var count = foundUser.friends.length;
          var foundFriendIds = foundFriends.map(function(user){
            return user._id;
          });
          var Friends_100_profilePic = [];
          for(var l=0;l<foundFriends.length;l++){
            Friends_100_profilePic[l] = cloudinary.url(foundFriends[l].profilePicId,
            {width: 200, height: 200, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
          }
          var userName = foundUser.fullName, userId = foundUser._id, friendsCount = foundUser.friendsCount;
          res.render('users/all_friends',{users: foundFriends, userName, userId, foundFriendIds, friendsCount,
          current: pageNumber, Friends_100_profilePic, pages: Math.ceil(count / perPage)});
        }
        });
      } else{
        req.flash('success', 'You are not a friend with this person :/');
        return res.redirect('back');
      }
    }
    });
  },

  indexViewOrgPage(req, res, next){
    var nameEsc = req.params.org_name.replace(/\+/g, ' ').replace(/\%20/g, ' ');
    OrgPage.findOne({name: nameEsc, clubCount: {$gt: 0}})
    .populate({path: 'allClubs.categoryClubIds', select: 'name avatar avatarId banner membersCount'})
    .exec(function(err, foundOrgPage){
    if(err){
      console.log(Date.now()+' : '+'(index-50)foundOrgPage err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else if(!foundOrgPage){
      req.flash('error', 'College page either does not exist or has no listed clubs :(');
      return res.redirect('back');
    } else{
      var Clubs_50_clubAvatar = []; var match = false; var following = false;
      var allClubsArr = foundOrgPage.allClubs.sort(function(a, b) {
        return parseFloat(a.categoryCount) - parseFloat(b.categoryCount);
      });
      for(var i=0;i<allClubsArr.length;i++){
        var arr2D = [];
        for(var j=0;j<allClubsArr[i].categoryClubIds.length;j++){
          arr2D[j] = cloudinary.url(allClubsArr[i].categoryClubIds[j].avatarId,
          {width: 100, height: 100, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp'});
        }
        Clubs_50_clubAvatar[i] = arr2D;
      }
      if(req.user){
        if(req.user.userKeys.college == foundOrgPage.name){
          match = true;
        }
        for(var k=0;k<foundOrgPage.allFollowerIds.length;k++){
          if(foundOrgPage.allFollowerIds[k].equals(req.user._id)){
            for(var l=0;l<req.user.followingOrgKeys.length;l++){
              if(req.user.followingOrgKeys[l] == foundOrgPage.name){
                following = true;
                break;
              }
            }
            if(following === true){
              break;
            }
          }
        }
      }
      res.render('org_pages/index',{org_page: foundOrgPage, Clubs_50_clubAvatar, allClubs: allClubsArr, match, 
      following});
    }
    });
  },

  indexFollowOrgPage(req, res, next){
    if(req.user && req.user._id.equals(req.params.user_id)){
      OrgPage.findOne({_id: req.params.org_id, clubCount: {$gt: 0}})
      .populate({path: 'allClubs.categoryClubIds', select: 'name avatar avatarId banner membersCount'})
      .exec(function(err, foundOrgPage){
      if(err || !foundOrgPage){
        console.log(Date.now()+' : '+'(index-50)foundOrgPage err:- '+JSON.stringify(err, null, 2));
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      } else{
        if(req.body.follow == 'true'){
          // LoopCheck for duplicate followerIds, if found return back to page
          for(var i=0;i<foundOrgPage.allFollowerIds.length;i++){
            if(foundOrgPage.allFollowerIds[i].equals(req.user._id)){
              req.flash('success', 'Succesfully following this page');
              return res.redirect(/org_pages/+foundOrgPage.name);
              break;
            }
          }
          User.updateOne({_id: req.user._id}, {$addToSet: {followingOrgKeys: foundOrgPage.name}}, 
          function(err, foundUser){
          if(err || !foundUser){
            console.log(Date.now()+' : '+req.user._id+' => (index-44)foundUser err:- '+JSON.stringify(err, null, 2));
            req.flash('error', 'Something went wrong :(');
          } else{
            foundOrgPage.followerCount += 1;
            foundOrgPage.allFollowerIds.push(req.user._id);
            foundOrgPage.save();
            res.redirect(/org_pages/+foundOrgPage.name);
          }
          });
        } else if(req.body.follow == 'false'){
          User.updateOne({_id: req.user._id}, {$pull: {followingOrgKeys: foundOrgPage.name}}, 
          function(err, foundUser){
          if(err || !foundUser){
            console.log(Date.now()+' : '+req.user._id+' => (index-44)foundUser err:- '+JSON.stringify(err, null, 2));
            req.flash('error', 'Something went wrong :(');
          } else{
            for(var i=0;i<foundOrgPage.allFollowerIds.length;i++){
              if(foundOrgPage.allFollowerIds[i].equals(req.user._id)){
                foundOrgPage.allFollowerIds.splice(i,1);
                break;
              }
            }
            foundOrgPage.followerCount -= 1;
            foundOrgPage.save();
            res.redirect(/org_pages/+foundOrgPage.name);
          }
          });
        }
      }
      });
    }
  }
};

//*******************FUNCTIONS***********************
function escapeRegExp(str){
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function checkRank(clubUsers,userId,rank){
  var ok;
  clubUsers.forEach(function(user){
    if(user.id.equals(userId) && user.userRank <= rank){
      ok = true;
    }
  });
  return ok;
};