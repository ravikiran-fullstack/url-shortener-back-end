const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userPasswordResetSchema = new Schema({
  randomKey: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  expirationDate: {
    type: Date,
    required: true
  }
}, {timestamps: true});

const UserPasswordReset = mongoose.model('UserPasswordReset', userPasswordResetSchema);

module.exports = UserPasswordReset;