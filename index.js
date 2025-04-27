require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
let mongoose = require('mongoose');
let bodyParser = require('body-parser');
let dns = require('dns');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Basic Configuration
const port = process.env.PORT || 3000;

const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: { type: String, required: true }
});

let urlModel = mongoose.model("url", urlSchema)

app.use("/", bodyParser.urlencoded({ extended: false }));

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get("/api/shorturl/:short_url", (req, res) => {
  let short_url = req.params.short_url;
  urlModel.findOne({ short_url: short_url }).then((foundURL) => {
    if (foundURL) {
      let original_url = foundURL.original_url;
      res.redirect(original_url);
    } else {
      res.json({ message: "The short url does not exist" });
    }
  });
})

// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
  let url = req.body.url;
  try {
    urlObj = new URL(url);
    dns.lookup(urlObj.hostname, (err, address, family) => {
      if (!address){
        res.json({ error: 'invalid url' })
      } 
      else {
        let original_url = urlObj.href; 
        urlModel.findOne({original_url: original_url}).then(
          (foundURL) => {
            if (foundURL) {
              res.json(
                {
                  original_url: foundURL.original_url,
                  short_url: foundURL.short_url
                })
          } 
          else {
            let short_url = 1;
            urlModel.find({}).sort(
              {short_url: "desc"}).limit(1).then(
                (latestURL) => {
                if (latestURL.length > 0){
                  short_url = parseInt(latestURL[0].short_url) + 1;
                }
                resObj = {
                  original_url: original_url,
                  short_url: short_url
                }
                let newURL = new urlModel(resObj);
                newURL.save();
                res.json(resObj);
                }
            )
          }
        })
      }
    })
  }
  catch {
    res.json({ error: 'invalid url' })
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
