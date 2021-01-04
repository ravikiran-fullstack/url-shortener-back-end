const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const registerUserSchema = new Schema({
  username: {
    type: String, 
    required: true
  }, 
  password: {
    type: String, 
    required: true
  }
}, {timestamps: true});

const RegisterUser = mongoose.model('RegisterUser', registerUserSchema);

module.exports = RegisterUser;