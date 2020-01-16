const mongoose = require('mongoose'),
  Schema       = mongoose.Schema;

const subscriptionSchema = new Schema({
	userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  endpoint: {type: String, required: true},
  keys: {
    auth: String,
    p256dh: String
  },
  createdAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Subscription', subscriptionSchema);