const express     = require('express'),
  router          = express.Router(),
  User            = require('../models/user'),
  Club            = require('../models/club'),
  Post            = require('../models/post'),
  OrgPage         = require('../models/organization-page'),
  mongoose        = require('mongoose'),
  {cloudinary}    = require('../public/js/cloudinary.js'),
  mbxGeocoding    = require('@mapbox/mapbox-sdk/services/geocoding'),
  geocodingClient = mbxGeocoding({ accessToken: process.env.MAPBOX_TOKEN });

module.exports = {
  indexRoot(req, res, next){
    if(req.user){
      res.redirect('/users/'+req.user._id);
    } else{
      res.render('landing');
    }
  },

  indexSearch(req, res, next){
    const query = req.query.search;
    User.find({$text: {$search: query}}, {score: {$meta: 'textScore'}}).sort({score: {$meta: 'textScore'}})
    .select({fullName: 1, profilePic: 1, profilePicId: 1, userKeys: 1, note: 1}).limit(3)
    .exec(function(err, foundUsers){
    if(err || !foundUsers){
      console.log('(index-1)foundUsers err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      Club.find({$text: {$search: query}}, {score: {$meta: 'textScore'}}).sort({score: {$meta: 'textScore'}})
      .select({name: 1, avatar: 1, avatarId: 1, clubKeys: 1, banner: 1}).limit(3)
      .exec(function(err, foundClubs){
      if(err || !foundClubs){
        console.log('(index-2)foundClubs err:- '+JSON.stringify(err, null, 2));
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      } else{
        OrgPage.find({$text: {$search: query}, $or: [{clubCount: {$gt: 0}}, {userCount: {$gt: 0}}]}, {score: {$meta: 'textScore'}})
        .sort({score: {$meta: 'textScore'}}).exec(function(err, foundOrgPages){
        if(err || !foundOrgPages){
          console.log('(index-3)foundOrgPages err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        } else{
          res.render('search/index',{users: foundUsers, clubs: foundClubs, org_pages: foundOrgPages, query});
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
    .select({fullName: 1, profilePic: 1, profilePicId: 1, userKeys: 1, note: 1, email: 1}).limit(1)
    .exec(function(err, foundUsers){
    if(err || !foundUsers){
      console.log('(index-4)foundUsers err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      var foundUserIds = foundUsers.map(function(user){
        return user._id;
      });
      res.render('search/people',{users: foundUsers, query, foundUserIds, filter: false, morePeopleUrl: '',
      emailSearch: true});
    }
    });
  },

  indexSearchPeople(req, res, next){
    const query = req.query.people;
    User.find({$text: {$search: query}}, {score: {$meta: 'textScore'}}).sort({score: {$meta: 'textScore'}})
    .select({fullName: 1, profilePic: 1, profilePicId: 1, userKeys: 1, note: 1, email: 1}).limit(10)
    .exec(function(err, foundUsers){
    if(err || !foundUsers){
      console.log('(index-5)foundUsers err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      var foundUserIds = foundUsers.map(function(user){
        return user._id;
      });
      res.render('search/people',{users: foundUsers, query, foundUserIds, filter: false, morePeopleUrl: '',
      emailSearch: false});
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
    .select({fullName: 1, profilePic: 1, profilePicId: 1, userKeys: 1, note: 1, email: 1}).limit(10)
    .exec(function(err, foundUsers){
    if(err || !foundUsers){
      console.log('(index-6)foundUsers err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      var foundUserIds = foundUsers.map(function(user){
        return user._id;
      });
      var currentUser = req.user;
      res.json({users: foundUsers, query, foundUserIds, currentUser, filter: false, emailSearch: false});
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
    User.find(dbQuery).select({fullName: 1, profilePic: 1, profilePicId: 1, userKeys: 1, note: 1, email: 1})
    .limit(10).exec(function(err, foundUsers){
    if(err){
      console.log('(index-7)foundUsers err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else if(!foundUsers && res.locals.query){
      req.flash('success', 'No results found :|');
      return res.redirect('back');
    } else{
      var foundUserIds = foundUsers.map(function(user){
        return user._id;
      });
      res.render('search/people',{users: foundUsers, query, foundUserIds, filter: true, morePeopleUrl, filterKeys,
      emailSearch: false});
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
      var concentration = urlEqualsSplit[3];
      if(concentration.split('&')[0]){
        concentration = new RegExp(escapeRegExp(concentration.split('&')[0].replace(/\+/g, ' ').replace(/\%20/g, ' ')), 'gi');
        dbQueries.push({'userKeys.concentration': concentration});
      }
      var batch = urlEqualsSplit[4];
      if(batch.split('&')[0]){
        batch = batch.split('&')[0].replace(/\+/g, ' ').replace(/\%20/g, ' ');
        dbQueries.push({'userKeys.batch': batch});
      }
      var workplace = urlEqualsSplit[5];
      if(workplace.split('&')[0]){
        workplace = new RegExp(escapeRegExp(workplace.split('&')[0].replace(/\+/g, ' ').replace(/\%20/g, ' ')), 'gi');
        dbQueries.push({'userKeys.workplace': workplace});
      }
      var school = urlEqualsSplit[6];
      if(school.split('&')[0]){
        school = new RegExp(escapeRegExp(school.split('&')[0].replace(/\+/g, ' ').replace(/\%20/g, ' ')), 'gi');
        dbQueries.push({'userKeys.school': school});
      }
      var location = urlEqualsSplit[7];
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
        if(urlEqualsSplit[8]){
          var distance = Number(urlEqualsSplit[7]);
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
    .select({fullName: 1, profilePic: 1, profilePicId: 1, userKeys: 1, note: 1, email: 1})
    .limit(10).exec(function(err, foundUsers){
    if(err){
      console.log('(index-8)foundUsers err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else if(!foundUsers && res.locals.query){
      req.flash('success', 'No results found :|');
      return res.redirect('back');
    } else{
      var foundUserIds = foundUsers.map(function(user){
        return user._id;
      });
      res.json({users: foundUsers, query, foundUserIds, filter: true, emailSearch: false});
    }
    });
  },

  indexSearchClubs(req, res, next){
    const query = req.query.clubs;
    Club.find({$text: {$search: query}}, {score: {$meta: 'textScore'}}).sort({score: {$meta: 'textScore'}})
    .select({name: 1, avatar: 1, avatarId: 1, categories: 1, clubKeys: 1, banner: 1}).limit(10)
    .exec(function(err, foundClubs){
    if(err || !foundClubs){
      console.log('(index-9)foundClubs err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      var foundClubIds = foundClubs.map(function(club){
        return club._id;
      });
      res.render('search/clubs',{clubs: foundClubs, query, foundClubIds, filter: false, moreClubsUrl: ''});
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
      console.log('(index-10)foundClubs err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      var foundClubIds = foundClubs.map(function(club){
        return club._id;
      });
      var currentUser = req.user;
      res.json({clubs: foundClubs, query, foundClubIds, currentUser, filter: false});
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
      console.log('(index-11)foundClubs err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else if(!foundClubs && res.locals.query){
      req.flash('success', 'No results found :|');
      return res.redirect('back');
    } else{
      var foundClubIds = foundClubs.map(function(user){
        return user._id;
      });
      res.render('search/clubs',{clubs: foundClubs, query, foundClubIds, filter: true, moreClubsUrl, filterKeys});
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
        category = category.split('&')[0].replace(/\+/g, ' ').replace(/\%20/g, ' ');
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
      console.log('(index-12)foundClubs err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else if(!foundClubs && res.locals.query){
      req.flash('success', 'No results found :|');
      return res.redirect('back');
    } else{
      var foundUserIds = foundClubs.map(function(user){
        return user._id;
      });
      res.json({clubs: foundClubs, query, foundUserIds, filter: true});
    }
    });
  },

  indexSearchOrgPages(req, res, next){
    const query = req.query.org_pages;
    OrgPage.find({$text: {$search: query}, $or: [{clubCount: {$gt: 0}}, {userCount: {$gt: 0}}]}, {score: {$meta: 'textScore'}})
    .sort({score: {$meta: 'textScore'}}).limit(10).exec(function(err, foundOrgPages){
    if(err || !foundOrgPages){
      console.log('(index-13)foundOrgPages err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      var foundOrgPageIds = foundOrgPages.map(function(orgPage){
        return orgPage._id;
      });
      res.render('search/org_pages',{org_pages: foundOrgPages, query, foundOrgPageIds, moreClubsUrl: ''});
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
    OrgPage.find({$text: {$search: query}, $or: [{clubCount: {$gt: 0}}, {userCount: {$gt: 0}}], _id: {$nin: seenIds}}, {score: {$meta: 'textScore'}})
    .sort({score: {$meta: 'textScore'}}).limit(10).exec(function(err, foundOrgPages){
    if(err || !foundOrgPages){
      console.log('(index-14)foundOrgPages err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      var foundOrgPageIds = foundOrgPages.map(function(orgPage){
        return orgPage._id;
      });
      var currentUser = req.user;
      res.json({org_pages: foundOrgPages, query, foundOrgPageIds, currentUser});
    }
    });
  },

  indexRequests(req, res, next){
    // CLUB INVITES
    if(req.body.clubId){
      var clubIduserId = req.body.clubId.split(',');
      var adminClubId = mongoose.Types.ObjectId(clubIduserId[0]);
      var invitedUserId = mongoose.Types.ObjectId(clubIduserId[1]);
      User.updateOne({_id: invitedUserId},{$push: {clubInvites: adminClubId}}, function(err, foundUser){
        if(err || !foundUser){
          console.log(req.user._id+' => (index-15)foundUser err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          // return res.redirect('back');
        }
      });
    }
    if(req.body.cancelClubId){
      var clubIduserId = req.body.cancelClubId.split(',');
      var adminClubId = mongoose.Types.ObjectId(clubIduserId[0]);
      var invitedUserId = mongoose.Types.ObjectId(clubIduserId[1]);
      User.updateOne({_id: invitedUserId},{$pull: {clubInvites: adminClubId}}, function(err, foundUser){
        if(err || !foundUser){
          console.log(req.user._id+' => (index-16)foundUser err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          // return res.redirect('back');
        }
      });
    }
    if(req.body.removeInvite){
      var removeInvite = mongoose.Types.ObjectId(req.body.removeInvite);
      User.updateOne({_id: req.user._id},{$pull: {clubInvites: removeInvite}}, function(err, foundUser){
        if(err || !foundUser){
          console.log(req.user._id+' => (index-17)foundUser err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          // return res.redirect('back');
        }
      });
    };
    if(req.body.acceptInvite){
      var acceptInvite = mongoose.Types.ObjectId(req.body.acceptInvite);
      User.findOneAndUpdate({_id: req.user._id},{$pull: {clubInvites: acceptInvite}}, {new: true}, function(err, foundUser){
      if(err || !foundUser){
        console.log(req.user._id+' => (index-18)foundUser err:- '+JSON.stringify(err, null, 2));
        req.flash('error', 'Something went wrong :(');
        // return res.redirect('back');
      } else{
        Club.findById(acceptInvite, function(err, foundClub){
        if(err || !foundClub){
          console.log(req.user._id+' => (index-19)foundClub err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          // return res.redirect('back');
        } else{
          //pushing user details into club
          var obja = {};
          obja['id'] = foundUser._id;
          obja['userRank'] = 4;
          foundClub.clubUsers.push(obja);
          foundClub.membersCount += 1;
          //pushing club details into users
          var objb = {};
          objb['id'] = foundClub._id;
          objb['rank'] = 4;
          objb['clubName'] = foundClub.name;
          foundUser.userClubs.push(objb);
          foundUser.save();
          foundClub.save();
        }
        });
      }
      });
    };
    // FRIEND REQUESTS
    if(req.body.friendReq){
      var friendReq = mongoose.Types.ObjectId(req.body.friendReq);
      User.updateOne({_id: friendReq},{$push: {friendRequests: req.user._id}}, function(err, foundUser){
        if(err || !foundUser){
          console.log(req.user._id+' => (index-20)foundUser err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          // return res.redirect('back');
        }
      });
    };
    if(req.body.cancelReq){
      var cancelReq = mongoose.Types.ObjectId(req.body.cancelReq);
      User.updateOne({_id: cancelReq},{$pull: {friendRequests: req.user._id}}, function(err, foundUser){
        if(err || !foundUser){
          console.log(req.user._id+' => (index-21)foundUser err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          // return res.redirect('back');
        }
      });
    };
    if(req.body.removeReq){
      var removeReq = mongoose.Types.ObjectId(req.body.removeReq);
      User.updateOne({_id: req.user._id},{$pull: {friendRequests: removeReq}}, function(err, foundUser){
        if(err || !foundUser){
          console.log(req.user._id+' => (index-22)foundUser err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          // return res.redirect('back');
        }
      });
    };
    if(req.body.acceptReq){
      var acceptReq = mongoose.Types.ObjectId(req.body.acceptReq);
      User.updateOne({_id: req.user._id}, 
      {$pull: {friendRequests: acceptReq}, $push: {friends: acceptReq}, $inc: {friendsCount: 1}}, 
      function(err, foundUser){
      if(err || !foundUser){
        console.log(req.user._id+' => (index-23)foundUser err:- '+JSON.stringify(err, null, 2));
        req.flash('error', 'Something went wrong :(');
        // return res.redirect('back');
      } else{
        User.updateOne({_id: acceptReq}, 
        {$push: {friends: req.user._id}, $inc: {friendsCount: 1}}, function(err, foundUser){
          if(err || !foundUser){
            console.log(req.user._id+' => (index-24)foundUser err:- '+JSON.stringify(err, null, 2));
            req.flash('error', 'Something went wrong :(');
            // return res.redirect('back');
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
        console.log(req.user._id+' => (index-25)foundUser err:- '+JSON.stringify(err, null, 2));
        req.flash('error', 'Something went wrong :(');
        // return res.redirect('back');
      } else{
        User.updateOne({_id: unFriendReq}, 
        {$pull: {friends: req.user._id}, $inc: {friendsCount: -1}}, function(err, foundUser){
          if(err || !foundUser){
            console.log(req.user._id+' => (index-26)foundUser err:- '+JSON.stringify(err, null, 2));
            req.flash('error', 'Something went wrong :(');
            // return res.redirect('back');
          }
        });
      }
      });
    };
    res.redirect('back');
  },

  indexMemberInfo(req, res, next){
    if(req.body.userRank){
      var userRankuserIdclubIdRank = req.body.userRank.split(',');
      var newRank = userRankuserIdclubIdRank[0];
      var userId = userRankuserIdclubIdRank[1];
      var clubId = userRankuserIdclubIdRank[2];
      Club.findById(clubId, function(err, foundClub){
      if(err || !foundClub){
        console.log(req.user._id+' => (index-27)foundClub err:- '+JSON.stringify(err, null, 2));
        req.flash('error', 'Something went wrong :(');
        // return res.redirect('back');
      } else{
        var admin = checkRank(foundClub.clubUsers,req.user._id,1);
        if(admin){
          if(0<newRank && newRank<5){
            for(var i=0;i<foundClub.clubUsers.length;i++){
              if(foundClub.clubUsers[i].id.equals(userId)){
                foundClub.clubUsers[i].userRank = newRank;
                User.updateOne({_id: userId, userClubs: {$elemMatch: {id: clubId}}}, 
                {$set: {'userClubs.$.rank': newRank}}, function(err, foundUser){
                if(err || !foundUser){
                  console.log(req.user._id+' => (index-28)foundUser err:- '+JSON.stringify(err, null, 2));
                  req.flash('error', 'Something went wrong :(');
                  // return res.redirect('back');
                } else{
                  foundClub.save();
                }
                });
                break;
              }
            }
          }
        } else{
          console.log('Unauthorized rank change attempt of: '+userId+
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
          console.log(req.user._id+' => (index-29)foundUser err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          // return res.redirect('back');
        } else{
          Club.updateOne({_id: clubId, clubUsers: {$elemMatch: {id: userId}}}, 
          {$set: {'clubUsers.$.userStatus': status}}, function(err, foundClub){
            if(err || !foundClub){
              console.log(req.user._id+' => (index-30)foundClub err:- '+JSON.stringify(err, null, 2));
              req.flash('error', 'Something went wrong :(');
              // return res.redirect('back');
            }
          });
        }
        });
      } else{
        console.log('Unauthorized status change attempt of: '+userId+
        ' by: '+req.user.fullName+' User ID: '+req.user._id);
      }
    }
    if(req.body.leave){
      var userIdclubId = req.body.leave.split(',');
      var userId = userIdclubId[0];
      var clubId = userIdclubId[1];
      Club.findById(clubId, function(err, foundClub){
      if(err || !foundClub){
        console.log(req.user._id+' => (index-31)foundClub err:- '+JSON.stringify(err, null, 2));
        req.flash('error', 'Something went wrong :(');
        // return res.redirect('back');
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
                console.log(req.user._id+' => (index-32)foundUser err:- '+JSON.stringify(err, null, 2));
                req.flash('error', 'Something went wrong :(');
                // return res.redirect('back');
              } else{
                foundClub.save();
              }
              });
              break;
            }
          }
        } else{
          console.log('Unauthorized club member removal attempt of: '+userId+
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
    User.findById(req.params.id)
    .exec(function(err, foundUser){
    if(err || !foundUser){
      console.log('(index-33)foundUser err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      if(foundUser._id.equals(req.user._id) || foundUser.friends.includes(req.user._id)){
        User.find({_id: {$in: foundUser.friends}})
        .skip((perPage * pageNumber) - perPage).limit(perPage)
        .exec(function(err, foundFriends){
        if(err || !foundFriends){
          console.log('(index-34)foundFriends err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        } else{
          var count = foundUser.friends.length;
          var foundFriendIds = foundFriends.map(function(user){
            return user._id;
          });
          var userName = foundUser.fullName, userId = foundUser._id, friendsCount = foundUser.friendsCount;
          res.render('users/all_friends',{users: foundFriends, userName, userId, foundFriendIds, friendsCount,
          current: pageNumber, pages: Math.ceil(count / perPage)});
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
    OrgPage.findOne({name: nameEsc})
    .populate({path: 'allClubs.categoryClubIds', select: 'name avatar avatarId banner membersCount'})
    .exec(function(err, foundOrgPage){
    if(err){
      console.log('(index-35)foundOrgPage err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else if(!foundOrgPage){
      req.flash('error', 'College page does not exist :(');
      return res.redirect('back');
    } else{
      var Clubs_50_clubAvatar = []; var match = false;
      for(var i=0;i<foundOrgPage.allClubs.length;i++){
        var arr2D = [];
        for(var j=0;j<foundOrgPage.allClubs[i].categoryClubIds.length;j++){
          arr2D[j] = cloudinary.url(foundOrgPage.allClubs[i].categoryClubIds[j].avatarId,
          {width: 50, height: 50, quality: 100, secure: true, crop: 'fill', format: 'jpg'});
        }
        Clubs_50_clubAvatar[i] = arr2D;
      }
      if(req.user){
        for(var k=0;k<foundOrgPage.allUsers.length;k++){
          if(foundOrgPage.allUsers[k].equals(req.user._id)){
            match = true;
            break;
          }
        }
      }
      res.render('org_pages/index',{org_page: foundOrgPage, Clubs_50_clubAvatar, match});
    }
    });
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

function postPrivacy(foundPosts, foundUser){
  var posts = [];
  var postsLen = foundPosts.length;
  var friendsLen = foundUser.friends.length;
  var clubLen = foundUser.userClubs.length;
  for(i=0;i<postsLen;i++){
    var privacy = foundPosts[i].privacy;
    //Public
    if(privacy == 0){
      posts.push(foundPosts[i]);
    }
    //Friends
    if(privacy == 1){
      var pushed = false;
      if(foundPosts[i].postAuthor.id.equals(foundUser._id) && pushed == false){
        pushed = true;
        posts.push(foundPosts[i]);
      }
      if(friendsLen && pushed == false){
        for(j=0;j<friendsLen;j++){
          if(foundPosts[i].postAuthor.id.equals(foundUser.friends[j])){
            pushed = true;
            posts.push(foundPosts[i]);
            break;
          }
        }
      }
      if(clubLen && pushed == false){
        for(j=0;j<clubLen;j++){
          if(foundPosts[i].postClub._id.equals(foundUser.userClubs[j].id)){
            pushed = true;
            posts.push(foundPosts[i]);
            break;
          }
        }
      }
    }
    //Club(members)
    if(privacy == 2){
      if(foundPosts[i].postAuthor.id.equals(foundUser._id)){
        posts.push(foundPosts[i]);
      } else{
        for(j=0;j<clubLen;j++){
          if(foundPosts[i].postClub._id.equals(foundUser.userClubs[j].id)){
            posts.push(foundPosts[i]);
            break;
          }
        }
      }
    }
    //Club(friends)
    if(privacy == 3){
      if(foundPosts[i].postAuthor.id.equals(foundUser._id)){
        posts.push(foundPosts[i]);
      } else if(friendsLen && clubLen){
        outerLoop:
        for(j=0;j<clubLen;j++){
          for(k=0;k<friendsLen;k++){
            if((foundPosts[i].postClub._id.equals(foundUser.userClubs[j].id) && 
                foundPosts[i].postAuthor.id.equals(foundUser.friends[k])) || 
              (foundPosts[i].postClub._id.equals(foundUser.userClubs[j].id) && 
               0 <= foundUser.userClubs[j].rank && foundUser.userClubs[j].rank <= 1)){
              posts.push(foundPosts[i]);
              break outerLoop;
            }
          }
        }
      }
    }
    //Private
    if(privacy == 4){
      if(foundPosts[i].postAuthor.id.equals(foundUser._id)){
        posts.push(foundPosts[i]);
      }
    }
  }
  return posts;
};

function postModeration(foundPosts, foundUser,limit){
  var posts = [];
  var postsLen = foundPosts.length;
  var clubLen = foundUser.userClubs.length;
  for(i=0;i<postsLen;i++){
    var moderation = foundPosts[i].moderation;
    //Exclusive
    if(moderation == 1){
      if(foundPosts[i].postAuthor.id.equals(foundUser._id)){
        posts.push(foundPosts[i]);
      } else if(clubLen){
        for(j=0;j<clubLen;j++){
          if(foundPosts[i].postClub._id.equals(foundUser.userClubs[j].id)){
            posts.push(foundPosts[i]);
          }
        }
      }
    }
    //Published
    if(moderation == 0){
      posts.push(foundPosts[i]);
    }
    //Hidden
    if(moderation == -1){
      if(foundPosts[i].postAuthor.id.equals(foundUser._id)){
        posts.push(foundPosts[i]);
      } else if(clubLen){
        for(j=0;j<clubLen;j++){
          if((foundPosts[i].postClub._id.equals(foundUser.userClubs[j].id) && 
          0 <= foundUser.userClubs[j].rank && foundUser.userClubs[j].rank <= 1)){
            posts.push(foundPosts[i]);
          }
        }
      }
    }
    if(limit && i == limit-1){
      break;
    }
  }
  return posts;
};