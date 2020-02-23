const Post        = require("../models/post"),
  Comment         = require("../models/comment"),
  User            = require("../models/user"),
  Club            = require("../models/club"),
  mbxGeocoding    = require('@mapbox/mapbox-sdk/services/geocoding'),
  geocodingClient = mbxGeocoding({ accessToken: process.env.MAPBOX_TOKEN });

function escapeRegExp(str){
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

// all the middleare goes here
var middlewareObj = {};

// Authentication middleware
middlewareObj.checkPostOwnership = function(req, res, next){
 if(req.isAuthenticated()){
  Post.findById(req.params.post_id).populate('postAuthor.id').exec(function(err, foundPost){
  if(err || !foundPost){
    console.log('(middleware-1)foundPost err:- '+JSON.stringify(err, null, 2));
    req.flash('error', 'Post not found');
    res.redirect('back');
  } else{
    if(foundPost.postAuthor.id._id.equals(req.user._id)){
      next();
    } else{
      req.flash('error', "You don't have permission to do that");
      res.redirect('back');
    }
  }
  });
  } else{
    req.flash('error', 'Please Login First');
    res.redirect('back');
  }
};

middlewareObj.checkCommentOwnership = function(req, res, next){
  if(req.isAuthenticated()){
    Comment.findOne({_id: req.params.bucket_id}, {comments: {$elemMatch: {_id: req.params.comment_id}}},
    function(err, foundBucket){
    if(err || !foundBucket){
      console.log('(middleware-2)foundBucket err:- '+JSON.stringify(err, null, 2));
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

middlewareObj.checkClubOwnership = function(req, res, next){
  if(req.isAuthenticated()){
    Club.findById(req.params.club_id, function(err, foundClub){
    if(err || !foundClub){
      console.log('(middleware-3)foundClub err:- '+JSON.stringify(err, null, 2));
      req.flash("error", "Club not found");
      res.redirect("back");
    } else{
      var ok;
      foundClub.clubUsers.forEach(function(user){
        if(user.id.equals(req.user._id) && user.userRank == 0){
          ok = true;
        }
      });
      if(ok == true){
        next();
      } else{
        req.flash("error", "You don't have permission to do that");
        res.redirect("back");
      }
    }
    });
  } else{
    req.flash("error", "Please Login");
    res.redirect("back");
  }
};

middlewareObj.checkClubAdminship = function(req, res, next){
  if(req.isAuthenticated()){
    Club.findById(req.params.id, function(err, foundClub){
    if(err || !foundClub){
      console.log('(middleware-4)foundClub err:- '+JSON.stringify(err, null, 2));
      req.flash("error", "Club not found");
      res.redirect("back");
    } else{
      var ok;
      foundClub.clubUsers.forEach(function(user){
        if(user.id.equals(req.user._id) && user.userRank <= 1){
          ok = true;
        }
      });
      if(ok == true){
        next();
      } else{
        req.flash("error", "You don't have permission to do that");
        res.redirect("back");
      }
    }
    });
  } else{
    req.flash("error", "Please Login");
    res.redirect("back");
  }
};

middlewareObj.checkClubModeratorship = function(req, res, next){
  if(req.isAuthenticated()){
    Club.findById(req.params.id, function(err, foundClub){
    if(err || !foundClub){
      console.log('(middleware-4)foundClub err:- '+JSON.stringify(err, null, 2));
      req.flash("error", "Club not found");
      res.redirect("back");
    } else{
      var ok;
      foundClub.clubUsers.forEach(function(user){
        if(user.id.equals(req.user._id) && user.userRank <= 2){
          ok = true;
        }
      });
      if(ok == true){
        next();
      } else{
        req.flash("error", "You don't have permission to do that");
        res.redirect("back");
      }
    }
    });
  } else{
    req.flash("error", "Please Login");
    res.redirect("back");
  }
};

middlewareObj.checkAccountOwnership = function(req, res, next){
  if(req.isAuthenticated()){
    User.findById(req.params.id, function(err, foundUser){
    if(err || !foundUser){
      console.log('(middleware-5)foundUser err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'User account does not exist');
      res.redirect('back');
    } else{
      // does user own the account?
      if(foundUser._id.equals(req.user._id)) {
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

middlewareObj.isLoggedIn = function(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  req.flash('error', 'Please Login First');
  res.redirect('/login');
};

middlewareObj.searchAndFilterClubs = async function(req, res, next){
  const queryKeys = Object.keys(req.query); const filterKeys = {};
  if(queryKeys.length){
    const dbQueries = [];
    let {clubs, organization, category, location, distance} = req.query;
    if(clubs){
      filterKeys['clubs'] = clubs;
      clubs = new RegExp(escapeRegExp(clubs), 'gi');
      dbQueries.push({name: clubs});
    }
    if(organization){
      filterKeys['organization'] = organization;
      organization = new RegExp(escapeRegExp(organization), 'gi');
      dbQueries.push({'clubKeys.organization': organization});
    }
    if(category){
      filterKeys['category'] = category;
      category = new RegExp(escapeRegExp(category), 'gi');
      dbQueries.push({'clubKeys.category': category});
    }
    if(location){
      filterKeys['location'] = location;
      let coordinates;
      try{
        location = JSON.parse(location);
        coordinates = location;
      } catch(err){
        const response = await geocodingClient.forwardGeocode({
          query: location,
          limit: 1
        }).send();
        coordinates = response.body.features[0].geometry.coordinates;
      }
      if(distance){
        filterKeys['distance'] = distance;
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
    res.locals.dbQuery = dbQueries.length ? { $and: dbQueries } : {};
  }
  res.locals.query = req.query;
  res.locals.moreClubsUrl = req.originalUrl;
  res.locals.filterKeys = filterKeys;
  next();
};

middlewareObj.searchAndFilterPeople = async function(req, res, next){
  const queryKeys = Object.keys(req.query); const filterKeys = {};
  if(queryKeys.length){
    const dbQueries = [];
    let {users, college, workplace, school, location, distance} = req.query;
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
    if(workplace){
      filterKeys['workplace'] = workplace;
      workplace = new RegExp(escapeRegExp(workplace), 'gi');
      dbQueries.push({'userKeys.workplace': workplace});
    }
    if(school){
      filterKeys['school'] = school;
      school = new RegExp(escapeRegExp(school), 'gi');
      dbQueries.push({'userKeys.school': school});
    }
    if(location){
      filterKeys['location'] = location;
      let coordinates;
      try{
        location = JSON.parse(location);
        coordinates = location;
      } catch(err){
        const response = await geocodingClient.forwardGeocode({
          query: location,
          limit: 1
        }).send();
        coordinates = response.body.features[0].geometry.coordinates;
      }
      if(distance){
        filterKeys['distance'] = distance;
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
    res.locals.dbQuery = dbQueries.length ? { $and: dbQueries } : {};
  }
  res.locals.query = req.query;
  res.locals.morePeopleUrl = req.originalUrl;
  res.locals.filterKeys = filterKeys;
  next();
};

module.exports = middlewareObj;