const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const shortUrlSchema = new Schema({
  url: {
    type: String,
    required: true
  },
  shortUrl:{
    type: String, 
    required: true
  },
  username:{
    type: String, 
    required: true
  },
  visitCount: {
    type: Number,
    required: true
  }
}, {timestamps: true});

const ShortUrl = mongoose.model('ShortUrl', shortUrlSchema);

module.exports = ShortUrl;