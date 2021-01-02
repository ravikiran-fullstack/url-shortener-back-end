const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");

const ShortUrl = require("./models/shortUrls");
const generateURLId = require("./utils");

const app = express();

const corsOptions = {
  // origin : 'http://127.0.0.1:5500'
  origin: "*",
};
app.use(cors(corsOptions));
app.use(bodyParser.json());

const mongoURI ="mongodb+srv://ravi:test123@urlshortener.6jhak.mongodb.net/urldb?retryWrites=true&w=majority";

const connectToMongoDb = async () => {
  try {
    const result = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    app.listen(process.env.PORT || 8585, "0.0.0.0");
    console.log("Connected to MongoDB");
  } catch (err) {
    console.log(err);
  }
};

connectToMongoDb();

// Route to post new url to be shortened
app.post("/url", (req, res) => {
  console.log("req.ip", req.ip);
  if (req.body.url === undefined || req.body.url === "") {
    res.status(400).json({ message: "Url is undefined or empty" });
  } else {
    const shortUrl = new ShortUrl({
      url: req.body.url,
      shortUrl: generateURLId(),
      visitCount: 0,
    });
    shortUrl
      .save()
      .then((result) => {
        console.log(result);
        res.send(`https://rk-url-shortener-back-end.herokuapp.com/${result.shortUrl}`);
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

// Route to show home page
app.get("/", (req, res) => {
  console.log("req.ip", req.ip);
  res.json({ message: "working" });
});

app.get("/favicon.ico", (req, res) => {
  res.send();
});

// Route to show last few shortened urls along with original url and visit count
app.get("/recent", (req, res) => {
  console.log("req.ip /recent", req.ip);
  ShortUrl.find()
    .limit(5)
    .sort({ createdAt: "desc" })
    .then((result) => {
      //console.log(result);
      res.json(result);
    })
    .catch((err) => console.log(err));
});

// Route to search for original url when shortened url is passed and also to update the visitCount
app.get("/:shortUrl", (req, res) => {
  console.log("req.ip /shortUrl", req.ip);
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
