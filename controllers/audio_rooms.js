const Club = require('../models/club'),
  logger = require('../logger'),
  User = require('../models/user'),
  Audioroom = require('../models/audioroom'),
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
      }
    */

    // console.log(req);
    Club.findById(req.params.club_id, function (err, foundClub) {
      if (err || !foundClub) {
        logger.error(req.user._id + ' : (stories-2)foundClub err => ' + err);
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      }
      else {
        for (let i = foundClub.clubUsers.length - 1; i >= 0; i--) {
          if (foundClub.clubUsers[i].id.equals(req.user._id) && foundClub.clubUsers[i].userRank <= 2) {
            let success = true;
            let audioroom = new Audioroom({
              roomName: req.body.roomName,
              roomDesc: req.body.roomDesc,
              roomColor: req.body.roomColor,
              timestamp: Date.now(),
              audioroomClub: foundClub._id,
              audioroomCreator: req.user._id,
              capacity: 50
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
              body: JSON.stringify({moderators: [], speakers: []})
            }).then(res => {
              if(res.status != 200) success = false;
              console.log(res.status);
              res.text().then(text => console.log(text));
            });


            if (!success)
              return res.json({success: false, msg: "Error message"});
            else
              return res.json({success: true, roomId: audioroom._id});
          }
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
    for(var i = 0; i < foundUser.userClubs.length; i++){
      let foundClub = await Club.findById(foundUser.userClubs[i].id).exec();
      if(foundClub && foundClub.audiorooms.length){
        let clubData = {};
        clubData["club_name"] = foundClub.name;
        clubData["audio_rooms"] = []
        for(var j = 0; j < foundClub.audiorooms.length; j++){
          let foundAudioroom = await Audioroom.findById(foundClub.audiorooms[j]._id).exec();
          clubData["audio_rooms"].push({
            roomId : String(foundAudioroom._id),
            roomName : foundAudioroom.roomName
          });
        }
        audioroomsData.push(clubData);
      }
    }
    return res.render('audio_rooms/lobby', { audioroomsData });
  },

  async joinAudioRoom(req, res, next) {
    // TODO, check if the audio room exists
    // Also, is the user allowed to enter or not
    // Done and tested. When user is not allowed, or room doesn't exist, success false is sent
    var success = false;
    let foundUser = await User.findById(req.user._id).exec();
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
    if(success) res.render('audio_rooms/audio_room.ejs', { room_id: req.params.room_id, user: req.user });
    else res.json({success : false});
  },

  async getClubAudioRooms(req, res, next) {
    //  TODO, get the audio rooms of a specific club provided params.club_id
    //  Done
    //  Tested, works well.
    
    var rooms = [];
    let foundClub = await Club.findById(req.params.club_id).exec();
    for(let i = 0; i < foundClub.audiorooms.length; i++){
      let foundAudioroom = await (await Audioroom.findById(foundClub.audiorooms[i])).execPopulate();
      rooms.push({
        roomId : foundAudioroom._id,
        name: foundAudioroom.roomName,
        desc: foundAudioroom.roomDesc
      })
    }
    return res.json(rooms);
  },

  async deleteAudioRoom(req, res, next) {
    // TODO: delete an audio room
    // Done, Not tested. Add club_id in params from frontend
    console.log("Deleting story", req.body.room_id, " from ", req.params.club_id);

    Audioroom.find({ _id: req.body.room_id }).deleteOne().exec();
    Club.updateOne({ _id: req.params.club_id }, {
      $pullAll: {
        audiorooms: [req.params.room_id],
      }
    }, function (err, docs) {
      if (err) {
        console.log(err);
        return res.sendStatus(500);
      }
      else {
        return res.json({ success: true });
      }
    });
  },

  async setUserJamKey(req, res, next) {
    // req.body.public_key. Tested. Works Good.
    console.log(req.body);
    let foundUser = await User.findById(req.user._id).exec();
    foundUser.jamKey = req.body.public_key;
    foundUser.save();
    res.json({ success: true });
  }
};