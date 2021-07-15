const Comment     = require("../models/comment"),
  logger          = require('../logger'),
  mbxGeocoding    = require('@mapbox/mapbox-sdk/services/geocoding'),
  geocodingClient = mbxGeocoding({ accessToken: process.env.MAPBOX_TOKEN });

function escapeRegExp(str){
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

// all the middleare goes here
var middlewareObj = {};

middlewareObj.isLoggedIn = function(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  req.flash('error', 'Please Login First');
  res.redirect('/login');
};

middlewareObj.checkCommentOwnership = function(req, res, next){
  if(req.isAuthenticated()){
    Comment.findOne({_id: req.params.bucket_id}, {comments: {$elemMatch: {_id: req.params.comment_id}}},
    function(err, foundBucket){
    if(err || !foundBucket){
      logger.error('(middleware-1)foundBucket err => '+err);
      req.flash('error', 'Comment Bucket not found');
      res.redirect('back');
    } else{
      if(foundBucket.comments[0].commentAuthor.id.equals(req.user._id)){
        next();
      } else{
        req.flash('error', "You don't have permission to do that");
        res.redirect('back');
      }
    }
    });
  } else{
    req.flash('error', 'Please Login');
    res.redirect('back');
  }
};

middlewareObj.searchAndFilterClubs = async function(req, res, next){
  const queryKeys = Object.keys(req.query); const filterKeys = {};
  if(queryKeys.length){
    const dbQueries = [];
    let {clubs, college, category} = req.query;
    dbQueries.push({isActive: true});
    if(clubs){
      filterKeys['clubs'] = clubs;
      clubs = new RegExp(escapeRegExp(clubs), 'gi');
      dbQueries.push({name: clubs});
    }
    if(college){
      filterKeys['college'] = college;
      college = new RegExp(escapeRegExp(college), 'gi');
      dbQueries.push({'clubKeys.college': college});
    }
    if(category){
      filterKeys['category'] = category;
      category = new RegExp(escapeRegExp(category), 'gi');
      dbQueries.push({'clubKeys.category': category});
    }
    res.locals.dbQuery = dbQueries.length ? { $and: dbQueries } : {};
  }
  // res.locals.query = req.query;
  res.locals.moreClubsUrl = req.originalUrl;
  res.locals.filterKeys = filterKeys;
  next();
};

middlewareObj.searchAndFilterPeople = async function(req, res, next){
  const queryKeys = Object.keys(req.query); const filterKeys = {};
  if(queryKeys.length){
    const dbQueries = [];
    let {users, college, batch, house, branch, school, hometown, distance} = req.query;
    dbQueries.push({isVerified: true});
    if(users){
      filterKeys['users'] = users;
      users = new RegExp(escapeRegExp(users), 'gi');
      dbQueries.push({fullName: users});
    }
    if(college){
      filterKeys['college'] = college;
      college = new RegExp(escapeRegExp(college), 'gi');
      dbQueries.push({'userKeys.college': college});
    }
    if(batch){
      filterKeys['batch'] = batch;
      batch = new RegExp(escapeRegExp(batch), 'gi');
      dbQueries.push({'userKeys.batch': batch});
    }
    if(house){
      filterKeys['house'] = house;
      house = new RegExp(escapeRegExp(house), 'gi');
      dbQueries.push({'userKeys.house': house});
    }
    if(branch){
      filterKeys['branch'] = branch;
      branch = new RegExp(escapeRegExp(branch), 'gi');
      dbQueries.push({'userKeys.branch': branch});
    }
    if(school){
      filterKeys['school'] = school;
      school = new RegExp(escapeRegExp(school), 'gi');
      dbQueries.push({'userKeys.school': school});
    }
    if(hometown){
      filterKeys['hometown'] = hometown;
      var coordinates;
      try{
        hometown = JSON.parse(hometown);
        coordinates = hometown;
      } catch(err){
        const response = await geocodingClient.forwardGeocode({
          query: hometown,
          limit: 1
        }).send();
        coordinates = response.body.features[0].geometry.coordinates;
      }
      if(distance){
        filterKeys['distance'] = distance;
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
    res.locals.dbQuery = dbQueries.length ? { $and: dbQueries } : {};
  }
  // res.locals.query = req.query;
  res.locals.coordinates = coordinates;
  res.locals.morePeopleUrl = req.originalUrl;
  res.locals.filterKeys = filterKeys;
  next();
};

module.exports = middlewareObj;