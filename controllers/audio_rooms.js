const Club = require('../models/club'),
  logger = require('../logger'),
  User = require('../models/user'),
  Audioroom = require('../models/audioroom'),
  clConfig         = require('../config/cloudinary'),
  s3Config         = require('../config/s3')
  fetch = require('node-fetch');

module.exports = {
  async postNewAudioroom(req, res, next) {
    /*
      REST API
      "club_id" in params,
      body : {
        roomName,
        roomDesc,
        roomColor,
        isClubExclusive, TODO in frontend, default is true
      }
    */

    Club.findById(req.params.club_id, function (err, foundClub) {
      if (err || !foundClub) {
        logger.error(req.user._id + ' : (audiorooms-1)foundClub err => ' + err);
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      }
      else {
        let exclusive = true;
        if(!(req.body.isClubExclusive)) exclusive = false;
        let clubMatch = false;
        for (let i = foundClub.clubUsers.length - 1; i >= 0; i--) {
          if (foundClub.clubUsers[i].id.equals(req.user._id) && foundClub.clubUsers[i].userRank <= 2) {
            let success = true;
            clubMatch = true;
            let audioroom = new Audioroom({
              roomName: req.body.roomName,
              roomDesc: req.body.roomDesc,
              timestamp: Date.now(),
              audioroomClub: foundClub._id,
              audioroomCreator: req.user._id,
              capacity: 50,
              isClubExclusive: exclusive
            });
            audioroom.save();
            foundClub.audiorooms.addToSet(audioroom);
            foundClub.save();
            // write code to make an api call to audio.clubmate.co.in

            fetch("https://audio.clubmate.co.in/_/pantry/api/v1/rooms/" + audioroom._id, {
              method: "POST",
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({moderators: [req.user.jamKey], speakers: [req.user.jamKey]})
            }).then(res => {
              if(res.status != 200) success = false;
            });


            if (!success){
              logger.error(req.user._id + ' : (audiorooms-2) Room creation failed');
              return res.json({success: false, msg: "Room creation failed"});
            } else
              return res.json({success: true, roomId: audioroom._id});
          }
        }
        if(!clubMatch){
          logger.error(req.user._id + ' : (audiorooms-3) User doesnt has right to make a audio room here');
          return res.json({success: false, msg: "User is not allowed to make rooms here"});
        }
        
      }
    });
  },

  async audioroomsLobby(req, res, next) {
    // req.user._id
    // TODO, also check if this user.find by needed or not
    // Done, user.find is needed coz we only show all the rooms for that particular user.
    // Tested and bugs fixed

    let foundUser = await User.findById(req.user._id).exec();
    let audioroomsData = []
    if(foundUser){
      for(var i = 0; i < foundUser.userClubs.length; i++){
        let foundClub = await Club.findById(foundUser.userClubs[i].id).exec();
        if(foundClub && foundClub.audiorooms.length){
          let clubData = foundClub;

          if(process.env.ENVIRONMENT === 'dev'){
            clubData.avatar_100 = clConfig.cloudinary.url(foundClub.avatarId, clConfig.thumb_100_obj);
          } else if (process.env.ENVIRONMENT === 'prod'){
            clubData.avatar_100 = s3Config.thumb_100_prefix+foundClub.avatarId;
          }

          clubData["audio_rooms"] = []
          for(var j = 0; j < foundClub.audiorooms.length; j++){
            let foundAudioroom = await Audioroom.findById(foundClub.audiorooms[j]._id).exec();
            clubData["audio_rooms"].push({
              roomId : String(foundAudioroom._id),
              roomName : foundAudioroom.roomName,
              roomDesc : foundAudioroom.roomDesc,
            });
          }
          audioroomsData.push(clubData);
        }
      }

      return res.render('audio_rooms/lobby', { audioroomsData });
    }
    else{
      logger.error(req.user._id +' : (audiorooms-4) Invalid request. User not found');
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    }
  },

  async joinAudioRoom(req, res, next) {
    // TODO, check if the audio room exists
    // Also, is the user allowed to enter or not
    // Done and tested. When user is not allowed, or room doesn't exist, success false is sent

    if(process.env.ENVIRONMENT === 'dev'){
      req.user.profilePic_100 = clConfig.cloudinary.url(req.user.profilePicId, clConfig.thumb_100_obj);
    } else if (process.env.ENVIRONMENT === 'prod'){
      req.user.profilePic_100 = s3Config.thumb_100_prefix+req.user.profilePicId;
    }

    var success = false;
    let requestedRoom = await Audioroom.findById(req.params.room_id).exec();
    if(requestedRoom && !(requestedRoom.isClubExclusive)){
      return res.render('audio_rooms/audio_room.ejs', { room_id: req.params.room_id, user: req.user });
    }
    let foundUser = await User.findById(req.user._id).exec();
    if(foundUser){
      for(let i = 0; i < foundUser.userClubs.length; i++){
        var club_id = foundUser.userClubs[i].id;
        let foundClub = await Club.findById(club_id).exec();
        for(let j = 0; j < foundClub.audiorooms.length; j++){
          let audioroom_id = foundClub.audiorooms[j];
          if(audioroom_id == req.params.room_id){
            success = true;
          }
        }
      }
      if(success) return res.render('audio_rooms/audio_room.ejs', { room_id: req.params.room_id, user: req.user });
      else {
        logger.error(req.user._id +' : (audiorooms-6) No audio room with id : ' + req.params.room_id + ' exists.');
        return res.json({success : false});
      }
    }
    else{
      logger.error(req.user._id +' : (audiorooms-7) Invalid request. User not found');
      req.flash('error', 'Something went wrong :(');
      return res.redirect('back');
    }
  },

  async getClubAudioRooms(req, res, next) {
    //  TODO, get the audio rooms of a specific club provided params.club_id
    //  Done
    //  Tested, works well.
    
    var rooms = [];
    let foundClub = await Club.findById(req.params.club_id).exec();
    if(foundClub){
      for(let i = 0; i < foundClub.audiorooms.length; i++){
        let foundAudioroom = await Audioroom.findById(foundClub.audiorooms[i]).exec();
        rooms.push({
          roomId : foundAudioroom._id,
          name: foundAudioroom.roomName,
          desc: foundAudioroom.roomDesc
        })
      }
      return res.json(rooms);
    }
    else{
      logger.error(req.user._id +' : (audiorooms-7) Invalid request. No club with id : ' + req.params.club_id + ' found');
      return res.redirect('back');
    }
  },

  async deleteAudioRoom(req, res, next) {
    // TODO: delete an audio room
    // Done, Not tested. Add club_id in params from frontend

    Audioroom.find({ _id: req.body.room_id }).deleteOne().exec();
    Club.updateOne({ _id: req.params.club_id }, {
      $pullAll: {
        audiorooms: [req.params.room_id],
      }
    }, function (err, docs) {
      if (err) {
        logger.error(req.user._id +' : (audiorooms-8) Room deletion err => ' + err);
        return res.sendStatus(500);
      }
      else {
        return res.json({ success: true });
      }
    });
  },

  async setUserJamKey(req, res, next) {
    // req.body.public_key. Tested. Works Good.

    let foundUser = await User.findById(req.user._id).exec();
    if(foundUser){
      foundUser.jamKey = req.body.public_key;
      foundUser.save();
      res.json({ success: true });
    }
    else{
      logger.error(req.user._id +' : (audiorooms-9) User not found');
      return res.redirect('back');
    }
    
  }
};