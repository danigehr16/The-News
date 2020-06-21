// Dependencies
var express = require("express");
var mongoose = require("mongoose");

// Requiring Note and Article models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");
var routes = require("./routes/routes");

// Scraping tools
var request = require("request");
var cheerio = require("cheerio");

// set mongoose to leverage built in Javascript Es6 Promises
mongoose.Promise = Promise;

// Define port
var port = process.env.PORT || 3000

// Initialize Express
var app = express();

// Set Handlebars
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({
    defaultLayout: "main",
    partialsDir: Path.join(_dirname, "/views/layouts/partials")
}));
app.set("view engine", "handlebars");

// Database configuration with mongoose
mongoose.connect("insert the heroku mlab.com");
// mongoose.connect("kmongodb://localhost/mongoscraper")
var db = mongoose.connection;

// show any mongoose errors
db.on("error", function (error){
    console.log("Mongoose Error: ", error);
});

// once logged into the db through mongoose, log a success message
db.once("open", function(){
    console.log("Mongoose connection successful");
});




// Listen on Port
app.listen(port, function(){
    console.log("App running on Port " + port);
});