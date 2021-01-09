require('dotenv').config()        // process.env
//const config = require('./config.js');
const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require('bcrypt');
const validUrl = require('valid-url');
const {nanoid} = require('nanoid');
const jwt = require('jsonwebtoken');

const nodemailer = require('nodemailer');//importing node mailer
const {google} = require('googleapis');
const {OAuth2}  = google.auth;
console.log('process.env',process.env.CLIENT_ID);
const CLIENT_ID = `${process.env.CLIENT_ID}`;
const CLIENT_SECRET = `${process.env.CLIENT_SECRET}`;
const REDIRECT_URI = `${process.env.REDIRECT_URI}`;
const REFRESH_TOKEN = `${process.env.REFRESH_TOKEN}`;

const ShortUrl = require("./models/shortUrls");
const generateURLId = require("./utils");

const RegisterUser = require("./models/registerUser");
const UserPasswordReset = require('./models/userPasswordReset');
// const registerRoutes = require('./routes/register');

const app = express();

const corsOptions = {
  // origin : 'http://127.0.0.1:5500'
  origin: "*",
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(cookieParser());

const mongoURI = `${process.env.mongoURI}`;

const connectToMongoDb = async () => {
  try {
    const result = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    app.listen(process.env.PORT || 8585, "0.0.0.0");
    console.log(`Back end server running on ${process.env.PORT}`);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.log(err);
  }
};

function updateCounter() {}

connectToMongoDb();
 
app.post('/register',async (req, res) => {
  console.log('/register',req.body);

  if(req.body.username === undefined || req.body.username === '' || req.body.password === undefined || req.body.password === '' ){
    res.status(400).json({message: "Enter valid credentials"});
  } else {

    const user = await RegisterUser.findOne({username: req.body.username});

    if(user){
      res.status(409).json({message: "Username already exists"});
    } else {
      try{
        const hash = await bcrypt.hash(req.body.password, 10);
        console.log(hash, req.body.password);
        const registerUser = new RegisterUser({
          username: req.body.username,
          password: hash
        });
    
        registerUser.save()
                      .then(result => res.json({username: result.username}))
                      .catch(err => console.log(err));
      } catch(err){
        console.error('error while hashing or storing user info into db',err);
      } 
    }      
  }
});

// app.get("/test", (req, res) => {
//   res
//     .status(404)
//     .sendFile(path.join(__dirname, "views", "page-not-found.html"));
// });

app.post('/confirmEmailResetPassword', async (req, res) => { 
  
  if(req.body.username === undefined || req.body.username === ''){
    res.status(400).json({message: "Enter valid email ID"});
  } else{
    const user = await RegisterUser.findOne({ username: req.body.username});
    if(!user){
      return res.status(400).json({message: "User doesn't  exists"});
    } else {
      //As the user exists, 
      // Create a random 10 digit number and store it in the user document as an object with values {key: randomNumber, username: userEmail}
      const randomKey = nanoid(10).toLowerCase();
      const userPasswordResetObj = new UserPasswordReset({
          randomKey: randomKey,
          username: user.username,
          expirationDate: addMinutes(new Date(), 10)
      });
      
      await userPasswordResetObj.save();

      const resetPasswordLink = `${process.env.backEndUrl}/reset/${user.username}/${randomKey}`;
      console.log('resetPasswordLink',resetPasswordLink)
      // Create a link the reset/:email/:randomnumber route on the backend and send it to the user email using nodemailer 

      const oAuth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
      oAuth2Client.setCredentials({refresh_token: REFRESH_TOKEN});
      const accessToken = await oAuth2Client.getAccessToken();

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: 'OAuth2',
          user: "ravikiransjce.code@gmail.com", //replace with your email
          clientId: CLIENT_ID,
          clientSecret: CLIENT_SECRET,
          refreshToken: REFRESH_TOKEN,
          accessToken: accessToken
        },
        tls : { rejectUnauthorized: false }
      });

      const mailOptions = {
        from: "<ravikriansjce.code@gmail.com>", //replace with your email
        to: `${user.username}`, //replace with your email
        subject: `PASSWORD RESET`,
        html: `<p> Please click the link to reset your password or copy paste ${resetPasswordLink} in a browser window</p><br>
                <a href=${resetPasswordLink}></a>`,
      };

      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
          return res.json({message: "User doesn't  exists"}) // if error occurs send error as response to client
        }
        else {
          console.log('Email sent: ' + info.response);
          return res.json({message:"Sent Successfully"})//if mail is sent successfully send Sent successfully as response
        }
      });
     // return res.status(200).json({message: "Check your email for reset options"});
    }
  }  
});

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes*60000);
}

app.get('/reset/:username/:randomKey', async (req, res) => {
  console.log('req.params ',req.params);
  const result = await UserPasswordReset.find({username: req.params.username}).sort({createdAt: "desc"});
  console.log(result);
  const latestResetObj = result[0];
  if(latestResetObj.expirationDate > new Date()){
    res.status(302).redirect(`${process.env.frontEndUrl}/resetPassword.html?username=${latestResetObj.username}&key=${latestResetObj.randomKey}`);
  } else {
    res.status(302).redirect(`${process.env.frontEndUrl}/confirmEmail.html`);
  }
});

app.post('/reset', async (req, res) => {
  // req.body should have valid password, email and random number generated in the previous step
  console.log(req.body);
})

app.post('/resetPassword', async (req, res) => {
  const result = await UserPasswordReset.find({username: req.body.username}).sort({createdAt: "desc"});
  const latestResetObj = result[0];
  console.log(latestResetObj, req.body);
  if(latestResetObj.expirationDate > new Date()){
    const hash = await bcrypt.hash(req.body.password, 10);
    const dbResult = await RegisterUser.updateOne({username: latestResetObj.username}, {password: hash});
    res.json({message: "Password reset successfully", username: latestResetObj.username});
  } 
});

app.post('/login', async (req, res) => {
  console.log('/login',req.body);
  if(req.body.username === undefined || req.body.username === '' || req.body.password === undefined || req.body.password === '' ){
    res.status(400).json({message: "Enter valid credentials"});
  } else{
    const user = await RegisterUser.findOne({ username: req.body.username });
    if(!user){
      res.status(400).json({message: "Invalid username or password"});
    } else {
      const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
      if(isPasswordValid){
        const token = jwt.sign({
                        exp: Math.floor(Date.now() / 1000) + (60 * 60),
                        data: user.username
                      }, process.env.JWT_SECRET); //jwt.sign({username: user.username}, process.env.JWT_SECRET);
        console.log('token',token);
        //res.cookie("jwt", token, {secure: true, httpOnly: true})
        // res.setHeader({'accessToken': accessToken});
        res.json({username: user.username, token});
      } else {
        res.status(400).json({message: "Invalid username or password"});
      }
    }
  }
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1];
  console.log('token', token);
  if (token == null) return res.sendStatus(401) // if there isn't any token
  
  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      return res.sendStatus(403).redirect('/login.html');
    } else {
      console.log(payload);
      res.locals.username = payload.data;
      next() // pass the execution off to whatever request the client intended
    }
  })
}

// Route to post new url to be shortened
app.post("/url",authenticateToken,(req, res) => {
  if (req.body.url === undefined || req.body.url === "") {
    res.status(400).json({ message: "Url is undefined or empty" });
  } else {

    if (!validUrl.isUri(req.body.url)){
      return res.status(404).json({message: "Url does not exists"});
    }

    console.log('res.locals.username', res.locals.username);
    const shortUrl = new ShortUrl({
      url: req.body.url,
      shortUrl: nanoid(5),//generateURLId(),
      username: res.locals.username,
      visitCount: 0,
    });
    shortUrl
      .save()
      .then((result) => {
        res.json({
          shortenedUrl: `${process.env.backEndUrl}/${result.shortUrl}`,
          originalUrl: result.url,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

app.get("/favicon.ico", (req, res) => {
  res.send();
});

// Route to show last few shortened urls along with original url and visit count
app.get("/recent/:username",authenticateToken, (req, res) => {
  const username = req.params.username; 
  if(username === undefined || req.body.username === ''){
    res.status(400).json({message: "Invalid credentials"});
  } else {
    ShortUrl.find({ username: username })
    .limit(5)
    .sort({ createdAt: "desc" })
    .then((result) => {
      res.json(result);
    })
    .catch((err) => console.log(err));
  }
});

app.get('/recentAll', authenticateToken, (req, res) => {
  ShortUrl.find()
    .limit(5)
    .sort({ createdAt: "desc" })
    .then((result) => {
      res.json(result);
    })
    .catch((err) => console.log(err));
})

// Route to search for original url when shortened url is passed and also to update the visitCount
app.get("/:shortUrl", (req, res) => {
  console.log(':shortUrl', req.params.shortUrl);
  const shortURLParam = req.params.shortUrl;

  ShortUrl.find({ shortUrl: shortURLParam })
    .then(async (result) => {
      if (result.length > 0) {
        //res.json(result[0].url);
        res.status(302).redirect(result[0].url);
        let visitCount = result[0].visitCount + 1;
        await ShortUrl.updateOne(
          { shortUrl: shortURLParam },
          { visitCount: visitCount }
        );
      } else {
        throw new Error("URL not stored in the db");
      }
    })
    .catch((err) => {
      console.log(err);
      res.json({ message: "url not found" });
    });
});

// Route to show home page
app.get("/", (req, res) => {
  res.redirect(`${process.env.frontEndUrl}/login.html`);
});

app.post('/authenticateSession', (req, res) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1];
  console.log('token', token);
  if (token == null) return res.sendStatus(401) // if there isn't any token
  
  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      return res.sendStatus(403).redirect('/login.html');
    } else {
      console.log(payload);
      res.status(200).send({message: "OK"}); // pass the execution off to whatever request the client intended
    }
  })
});


