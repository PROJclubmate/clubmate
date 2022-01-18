const Club = require('../models/club'),
  logger = require('../logger'),
  User = require('../models/user'),
  Audioroom = require('../models/audioroom');

module.exports = {

  async newAudioroom(req, res, next) {
    /*
      "club_id" in params,
      body : {
        roomName,
        roomId,
        capacity,
      }
    */

    Club.findById(req.params.club_id, function (err, foundClub) {
      if (err || !foundClub) {
        logger.error(req.user._id + ' : (stories-2)foundClub err => ' + err);
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      }
      else {
        for (let i = foundClub.clubUsers.length - 1; i >= 0; i--) {
          if (foundClub.clubUsers[i].id.equals(req.user._id) && foundClub.clubUsers[i].userRank <= 2) {
            let audioroom = new Audioroom({
              roomName: req.body.roomName,
              roomId: req.body.roomId,
              timestamp: Date.now(),
              audioroomClub: foundClub._id,
              audioroomCreator: req.user._id,
              capacity: req.body.capacity,
            });
            audioroom.save();
            foundClub.audiorooms.addToSet(audioroom);
            foundClub.save();
          }
        }
        return res.redirect('/clubs/' + req.params.club_id);
      }
    });
  },

  async audioroomsLobby(req, res, next) {
    // req.user._id
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
                roomName: "Wow"
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
        return res.render('audio_rooms/lobby', { audioroomsData });
      }
    });
  },

  joinAudioRoom(req, res, next) {
    res.render('audio_test.ejs');
  }
};