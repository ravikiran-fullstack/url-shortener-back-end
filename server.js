const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const ShortUrl = require('./models/shortUrls');
const generateURLId = require('./utils');

const app = express();
app.use(bodyParser.json());

const mongoURI = "mongodb+srv://ravi:test123@urlshortener.6jhak.mongodb.net/urldb?retryWrites=true&w=majority";

const connectToMongoDb = async () => {
  try{
    const result = await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    app.listen(8585);
    console.log('Connected to MongoDB');
  } catch(err) {
    console.log(err);
  }
}

connectToMongoDb();

app.post('/url', (req,res) => {
  if(req.body.url === undefined || req.body.url === ''){
    res.status(400).json({message: "Url is undefined or empty"});
  } else {
    const shortUrl = new ShortUrl({ url: req.body.url,shortUrl: generateURLId(),visitCount: 0});
    shortUrl.save()
              .then(result => {
                res.send(result);
              }).catch(err => {
                console.log(err)
              });
  }
});

app.get('/', (req, res) => {
  console.log('req received', req.params);
  res.json({message: 'working'});
});

app.get('/:shortUrl', (req, res) => {
  console.log('req received with url', req.params.shortUrl);
  const shortURLParam = req.params.shortUrl;
  ShortUrl.find({shortUrl: shortURLParam})
                            .then(result => {
                              if(result.length > 0){
                                res.json(result[0].url);
                              } else {
                                throw new Error('URL not stored in the db');
                                //res.json({message: 'url not found'})
                              }
                            }).catch(err => {
                              console.log(err);
                              res.json({message: 'url not found'})
                            });
  
  // console.log(result);
  // res.json({message: result});
})