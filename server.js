// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan")
var mongoose = require("mongoose");
var path = require("path");

// Requiring Note and Article and Routes models
var Note = require("./models/Note");
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
app.use(bodyParser.urlencoded({
    extended: false
}));

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
            result.summary = $(this)
                .children("a")
                .text();

            // create a new article
            var entry = new Article(result);

            // saving new article to db
            entry.save(function (error, doc) {
                if (error) {
                    console.log(error)
                }
                else {
                    console.log(doc)
                }
            })


        });
        res.send("Scrape Complete");
    });
});


// route for getting all articles from the db
app.get("/articles", function (req, res) {
    db.Article.find({}, function (error, doc) {
        if (error) {
            console.log(error)
        }
        else {
            res.json(doc)
        }
    });
});

// grab article by its object id
app.get("/articles/:id", function (req, res) {
    Article.findOne({ " _id": req.params.id }).populate("note").exec(function (error, doc) {
        if (error) {
            console.log(error);
        }
        else {
            res.json(doc);
        }
    });
});

// save the article
app.post("/articles/save/:id", function (req, res) {
    Article.findOneAndUpdate({ "_id": req.params.id }, { "saved": true }).exec(function (error, doc) {
        if (error) {
            console.log(error);
        }
        else {
            res.send(doc);
        }
    });
});

// Delete an article
app.post("/articles/delete/:id", function (req, res) {
    Article.findOneAndUpdate({ "_id": req.params.id }, { "saved": false, "notes": [] }).exec(function (error, doc) {
        if (error) {
            console.log(error);
        }
        else {
            res.send(doc);
        }
    });
});

// create a new note
app.post("/notes/save/:id", function (req, res) {
    var newNote = new Note({
        body: req.body.text,
        article: req.params.id
    });
    console.log(req.body);

    newNote.save(function (error, note) {
        if (error) {
            console.log(error);
        }
        else {
            Article.findOneAndUpdate({ "_id": req.params.id }, { $push: { "notes": note } }).exec(function (error) {
                if (error) {
                    console.log(error);
                    res.send(error);
                }
                else {
                    res.send(note);
                }
            });
        }
    });
});

// delete a note
app.delete("/note/delete/:note_id/:article_id", function (req, res) {
    Note.findOneAndRemove({ "_id": req.params.note_id }, function (error) {
        if (error) {
            console.log(error);
            res.send(error);
        }
        else {
            Article.findOneAndUpdate({ "_id": req.params.article_id }, { $pull: { "notes": req.params.note_id } }).exec(function (error) {
                if (error) {
                    console.log("Note Deleted")
                }
            });
        }
    });
});


// Listen on Port
app.listen(port, function () {
    console.log("App running on Port " + port);
});