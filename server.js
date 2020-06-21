// Dependencies
var express = require("express");
var logger = require("morgan")
var mongoose = require("mongoose");

// Requiring Note and Article and Routes models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");

// Scraping tools
var axios = require("axios");
var cheerio = require("cheerio");

// set mongoose to leverage built in Javascript Es6 Promises
// mongoose.Promise = Promise;

// Define port
var port = process.env.PORT || 3000

// Initialize Express
var app = express();

// Use morgan logger for logging requests
app.use(logger("dev"));

// parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to Mongo DB
mongoose.connect("mongodb://localhost/unit18Populater", { useNewUrlParser: true });

// Database configuration with mongoose
// mongoose.connect("insert the heroku mlab.com");
var db = mongoose.connection;

// Set Handlebars
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({
    defaultLayout: "main",
    partialsDir: Path.join(_dirname, "/views/layouts/partials")
}));
app.set("view engine", "handlebars");


// show any mongoose errors
db.on("error", function (error) {
    console.log("Mongoose Error: ", error);
});

// once logged into the db through mongoose, log a success message
db.once("open", function () {
    console.log("Mongoose connection successful");
});

// Routes

// A GET route for scraping the website
app.get("/scrape", function (req, res) {
    axios.get("https://www.newsbreak.com/pennsylvania/denver").then(function (response) {
        var $ = cheerio.load(response.data);

        // Grab the articles
        $("h3.SummaryCard_title_3CZHF").each(function (i, element) {
            var result = {};

            // adding the text and the href of every link, and save them as properties of the result object
            result.title = $(this)
                .children("a")
                .text();
            result.link = $(this)
                .children("a")
                .attr("href");

            // create a new article using the result object built from scraping
            db.Article.create(result)
                .then(function (dbArticle) {
                    console.log(dbArticle);
                })
                .catch(function (error) {
                    console.log(error)
                });

        });
        res.send("Scrape Complete");
    });
});


// route for getting all articles from the db
app.get("/articles", function(req, res){
    db.Article.find({})
    .then(function(dbArticle){
        res.json(dbArticle);
    });
});


// Listen on Port
app.listen(port, function () {
    console.log("App running on Port " + port);
});