const mongoose = require('mongoose'),
  Schema       = mongoose.Schema;

const audioroomSchema = new Schema({  
  roomName: String,
  roomDesc: String,
  roomColor: String,
  timestamp: Number,
  // usersInside: [{
  //   type: Schema.Types.ObjectId,
  //   ref: "User"
  // }],
  // speakers: [{
  //   type: Schema.Types.ObjectId,
  //   ref: "User"
  // }],
  initialModerators: [{
    type: Schema.Types.ObjectId,
    ref: "User"
  }],
  audioroomClub: {
    type: Schema.Types.ObjectId,
    ref: 'Club'
  },
  audioroomCreator: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  capacity: Number,
  isClubExclusive: {type: Boolean, default: true},
  createdAt: {type: Date, default: Date.now},
});

audioroomSchema.index({audioroomClub: 1});
audioroomSchema.index({createdAt: 1});

module.exports = mongoose.model('Audioroom', audioroomSchema);