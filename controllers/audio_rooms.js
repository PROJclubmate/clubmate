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
    User.findById(req.user._id, async function (err, foundUser) {
      if (err || !foundUser) {
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      }
      else {
        let audioroomsData = [
          {
            club_name: "JPEG",
            audio_rooms: [
              {
                roomName: "Room JPEG 1",
                roomId: "abcdefghijklmn",   // Take it as the id of the room, unique key mongodb
              },
              {
                roomName: "Room Jpeg 2",
                roomId: "wowthisisthekey"
              }
            ],
          },
          {
            club_name : "Backpack ready",
            audio_rooms: [
              {
                roomName: "Wow",
                roomId: "priyamroomid1"
              }
            ]
          }
        ];
        // for(var i = 0; i < foundUser.userClubs.length; i++){
        //   let foundClub = await Club.findById(foundUser.userClubs[i]._id).exec();
        //   if(foundClub && foundClub.audiorooms.length){
        //     audioroomsData[foundClub.name] = []
        //     for(var j = 0; j < foundClub.audiorooms.length; j++){
        //       let foundAudioroom = await Audioroom.findById(foundClub.audiorooms[j]._id).exec();
        //       audioroomsData[foundClub.name].push(foundAudioroom);
        //     }
        //   }
        // }
        // TODO Pranshu
        return res.render('audio_rooms/lobby', { audioroomsData });
      }
    });
  },

  joinAudioRoom(req, res, next) {
    // TODO, check if the audio room exists
    // Also, is the user allowed to enter or not

    res.render('audio_rooms/audio_room.ejs', { room_id: req.params.room_id, user: req.user });
  },

  getClubAudioRooms(req, res, next) {
    //  TODO, get the audio rooms of a specific club provided params.club_id

    return res.json([
      {
        roomId: "abcdef",
        name: "Name 1",
        desc: "Room description 1"
      },
      {
        roomId: "abafaf",
        name: "Name 2",
        desc: "Room description 2"
      },
      {
        roomId: "ghfajj",
        name: "Name 3",
        desc: "Room description 3"
      },
    ]);
  },

  deleteAudioRoom(req, res, next) {
    // TODO: delete an audio room

    res.json({"hello": "world"});
  }
};