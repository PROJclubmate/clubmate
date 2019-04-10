var Post = require("../models/post");
var Comment = require("../models/comment");
var User = require("../models/user");
var Club = require("../models/club");

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
    // does user own the post?
    if(foundPost.postAuthor.id._id.equals(req.user._id)){
      next();
    } else{
      console.log('foundPost author match failed');
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
      // is user the founder
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
      // is user an admin||founder
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

module.exports = middlewareObj;