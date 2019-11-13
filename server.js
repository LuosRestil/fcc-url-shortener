'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
let dns = require('dns');
let validUrl = require('valid-url');
const AutoIncrement = require("mongoose-sequence")(mongoose);

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);
mongoose.connect(process.env.ATLAS_URI, {
  useUnifiedTopology: true, 
  useNewUrlParser:true})
  .then(() => console.log('DB Connected!'))
  .catch(err => {
    console.log(`DB Connection Error: ${err.message}`);
  });;

let urlSchema = new mongoose.Schema({
  originalURL: String,
  // shortURL: {type: Number, unique: true}
});
urlSchema.plugin(AutoIncrement, {inc_field: 'shortURL'});

let URL = mongoose.model('URL', urlSchema);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
let bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));




app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

let increment = 1;

app.post("/api/shorturl/new", (req, res) => {
  if (!validUrl.isUri(req.body.url)) {
    res.send({error: "invalid URL"});
  } else {
    let found = URL.findOne({originalURL: req.body.url}, (err, obj) => {
      if (err) return console.error(err);
      if (!obj) {
        let shortURL = new URL({originalURL: req.body.url, shortURL: increment});
        
        shortURL.save()
        .then(data => res.json({original_url: data.originalURL, short_url: data.shortURL}));
      } else {
        res.json({original_url: obj.originalURL, short_url: obj.shortURL});
      }
    });
  }
});

app.get("/api/shorturl/:shortURL", (req, res) => {
  let found = URL.findOne({shortURL: req.params.shortURL}, (err, data) => {
    if (err) return console.error(err);
    if (data) {
      res.redirect(data.originalURL);
    }
  });
})

app.listen(port, function () {
  console.log('Node.js listening ...');
});