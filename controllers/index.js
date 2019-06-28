const express  = require('express'),
  router     = express.Router(),
  User       = require('../models/user'),
  Club       = require('../models/club'),
  Post       = require('../models/post'),
  mongoose   = require('mongoose');

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
    // const regex = new RegExp(escapeRegex(req.query.search), 'gi');
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
          res.render('search/index',{users: foundUsers, clubs: foundClubs, query: query});
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
      console.log('(index-3)foundUsers err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      var foundUserIds = foundUsers.map(function(user){
        return user._id;
      });
      res.render('search/people',{users: foundUsers, query: query, foundUserIds: foundUserIds});
    }
    });
  },

  indexSearchPeople(req, res, next){
    const query = req.query.people;
    User.find({$text: {$search: query}}, {score: {$meta: 'textScore'}}).sort({score: {$meta: 'textScore'}})
    .select({fullName: 1, profilePic: 1, profilePicId: 1, userKeys: 1, note: 1, email: 1}).limit(10)
    .exec(function(err, foundUsers){
    if(err || !foundUsers){
      console.log('(index-4)foundUsers err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      var foundUserIds = foundUsers.map(function(user){
        return user._id;
      });
      res.render('search/people',{users: foundUsers, query: query, foundUserIds: foundUserIds});
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
      console.log('(index-5)foundUsers err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      var foundUserIds = foundUsers.map(function(user){
        return user._id;
      });
      var currentUser = req.user;
      res.json({users: foundUsers, query: query, foundUserIds: foundUserIds, currentUser: currentUser});
    }
    });
  },

  indexSearchClubs(req, res, next){
    const query = req.query.clubs;
    Club.find({$text: {$search: query}}, {score: {$meta: 'textScore'}}).sort({score: {$meta: 'textScore'}})
    .select({name: 1, avatar: 1, avatarId: 1, categories: 1, clubKeys: 1, banner: 1}).limit(10)
    .exec(function(err, foundClubs){
    if(err || !foundClubs){
      console.log('(index-6)foundClubs err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      var foundClubIds = foundClubs.map(function(club){
        return club._id;
      });
      res.render('search/clubs',{clubs: foundClubs, query: query, foundClubIds: foundClubIds});
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
      console.log('(index-7)foundClubs err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      var foundClubIds = foundClubs.map(function(club){
        return club._id;
      });
      var currentUser = req.user;
      res.json({clubs: foundClubs, query: query, foundClubIds: foundClubIds, currentUser: currentUser});
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
          console.log(req.user._id+' => (index-8)foundUser err:- '+JSON.stringify(err, null, 2));
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
          console.log(req.user._id+' => (index-9)foundUser err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          // return res.redirect('back');
        }
      });
    }
    if(req.body.removeInvite){
      var removeInvite = mongoose.Types.ObjectId(req.body.removeInvite);
      User.updateOne({_id: req.user._id},{$pull: {clubInvites: removeInvite}}, function(err, foundUser){
        if(err || !foundUser){
          console.log(req.user._id+' => (index-10)foundUser err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          // return res.redirect('back');
        }
      });
    };
    if(req.body.acceptInvite){
      var acceptInvite = mongoose.Types.ObjectId(req.body.acceptInvite);
      User.findOneAndUpdate({_id: req.user._id},{$pull: {clubInvites: acceptInvite}}, {new: true}, function(err, foundUser){
      if(err || !foundUser){
        console.log(req.user._id+' => (index-11)foundUser err:- '+JSON.stringify(err, null, 2));
        req.flash('error', 'Something went wrong :(');
        // return res.redirect('back');
      } else{
        Club.findById(acceptInvite, function(err, foundClub){
        if(err || !foundClub){
          console.log(req.user._id+' => (index-12)foundClub err:- '+JSON.stringify(err, null, 2));
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
          console.log(req.user._id+' => (index-13)foundUser err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          // return res.redirect('back');
        }
      });
    };
    if(req.body.cancelReq){
      var cancelReq = mongoose.Types.ObjectId(req.body.cancelReq);
      User.updateOne({_id: cancelReq},{$pull: {friendRequests: req.user._id}}, function(err, foundUser){
        if(err || !foundUser){
          console.log(req.user._id+' => (index-14)foundUser err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          // return res.redirect('back');
        }
      });
    };
    if(req.body.removeReq){
      var removeReq = mongoose.Types.ObjectId(req.body.removeReq);
      User.updateOne({_id: req.user._id},{$pull: {friendRequests: removeReq}}, function(err, foundUser){
        if(err || !foundUser){
          console.log(req.user._id+' => (index-15)foundUser err:- '+JSON.stringify(err, null, 2));
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
        console.log(req.user._id+' => (index-16)foundUser err:- '+JSON.stringify(err, null, 2));
        req.flash('error', 'Something went wrong :(');
        // return res.redirect('back');
      } else{
        User.updateOne({_id: acceptReq}, 
        {$push: {friends: req.user._id}, $inc: {friendsCount: 1}}, function(err, foundUser){
          if(err || !foundUser){
            console.log(req.user._id+' => (index-17)foundUser err:- '+JSON.stringify(err, null, 2));
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
        console.log(req.user._id+' => (index-18)foundUser err:- '+JSON.stringify(err, null, 2));
        req.flash('error', 'Something went wrong :(');
        // return res.redirect('back');
      } else{
        User.updateOne({_id: unFriendReq}, 
        {$pull: {friends: req.user._id}, $inc: {friendsCount: -1}}, function(err, foundUser){
          if(err || !foundUser){
            console.log(req.user._id+' => (index-19)foundUser err:- '+JSON.stringify(err, null, 2));
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
        console.log(req.user._id+' => (index-20)foundClub err:- '+JSON.stringify(err, null, 2));
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
                  console.log(req.user._id+' => (index-21)foundUser err:- '+JSON.stringify(err, null, 2));
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
          console.log(req.user._id+' => (index-22)foundUser err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          // return res.redirect('back');
        } else{
          Club.updateOne({_id: clubId, clubUsers: {$elemMatch: {id: userId}}}, 
          {$set: {'clubUsers.$.userStatus': status}}, function(err, foundClub){
            if(err || !foundClub){
              console.log(req.user._id+' => (index-23)foundClub err:- '+JSON.stringify(err, null, 2));
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
        console.log(req.user._id+' => (index-24)foundClub err:- '+JSON.stringify(err, null, 2));
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
                console.log(req.user._id+' => (index-25)foundUser err:- '+JSON.stringify(err, null, 2));
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
      console.log('(index-26)foundUser err:- '+JSON.stringify(err, null, 2));
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    } else{
      if(foundUser._id.equals(req.user._id) || foundUser.friends.includes(req.user._id)){
        User.find({_id: {$in: foundUser.friends}})
        .skip((perPage * pageNumber) - perPage).limit(perPage)
        .exec(function(err, foundFriends){
        if(err || !foundFriends){
          console.log('(index-27)foundFriends err:- '+JSON.stringify(err, null, 2));
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        } else{
          var count = foundUser.friends.length;
          var foundFriendIds = foundFriends.map(function(user){
            return user._id;
          });
          var userName = foundUser.fullName, userId = foundUser._id, friendsCount = foundUser.friendsCount;
          res.render('users/all_friends',{users: foundFriends, userName: userName, userId: userId,
          foundFriendIds: foundFriendIds, friendsCount: friendsCount, current: pageNumber,
          pages: Math.ceil(count / perPage)});
        }
        });
      } else{
        req.flash('success', 'You are not a friend with this person :(');
        return res.redirect('back');
      }
    }
    });
  }
};

//*******************FUNCTIONS***********************
function escapeRegex(text){
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

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