require('dotenv').config();

const express = require('express'),
    morgan = require('morgan'),
    //cross origin resource sharing - enables other work to reference this backend, including my API
    cors = require('cors'),
    bodyParser = require('body-parser'),
    uuid = require('uuid'),
    mongoose = require('mongoose'),
    Models = require('./models.js'),
    Users = Models.User,
    Movies = Models.Movie;

const app = express();
const { check, validationResult } = require('express-validator');
 
//logs all requests using Morgan, prints in terminal.
app.use(morgan('common'));
app.use(cors());
app.use(bodyParser.json());

//authorization JWT linking:
let auth = require('./auth')(app); //app argument ensures that Express is available to auth.js file too
const passport = require('passport');
require('./passport'); //why is this format different, has an error?

//connects to existing MongoDB database LOCAL
mongoose.connect(process.env.LOCAL_DB, { useNewUrlParser: true, useUnifiedTopology: true});

// connects to MongoDB Atlas database
// mongoose.connect( process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true});

//GET route located at default endpoint / that returns text
app.get('/', (req, res) => {
    // throw new Error('I broke');
    // console.log(req);
    res.send('Welcome to myFlix app!');
});

//serves documentation.html file using express.static, keyword searching in "public" folder
app.use(express.static('public'));

//express routing syntax, express GET route located at '/movies/ that returns JSON object about favMovies array 
app.get('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.find()
        .then((movies) => {
            res.status(201).json(movies);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

//get data about single movie by title
app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({ Title: req.params.Title })
        .then((movie) => {
            res.json(movie);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

//get data about genre by title "thriller"
// should it be as is or just 
app.get('/movies/genres/:Name', passport.authenticate('jwt', { session: false }), (req, res) => {
// This is how it is searched by - by name of GENRE, not name of MOVIE
    Movies.findOne({ 'Genre.Name': req.params.Name })
// This is what is returned in JSON format, I only need Genre Name + Genre Description, not entire movie details
    .then((movie) => {
        res.status(201).json(movie.Genre.Name + ": " + movie.Genre.Description);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//get data about a director, same format as above by searching in nested content?
app.get('/movies/directors/:Name', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({ 'Director.Name': req.params.Name })
    .then((movie) => {
        res.status(201).json(movie.Director.Name + ': ' + movie.Director.Bio);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//allow new users to register, no authorization here, because anonymous users need to register for the first time!
app.post('/users', 
    [
        check('Username', 'Username is required').isLength({min:5}),
        check('Username', 'Username contains non alphanumeric characters - not allowed').isAlphanumeric(),
        check('Password', 'Password is not required').not().isEmpty(),
        check('Email', 'Email does not appear to be valid').isEmail()
    ],
     (req, res) => {

    //check validation object for errors
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array()});
    }

    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOne({ Username: req.body.Username})
        .then((user) => {
            if (user) {
                return res.status(400).send(req.body.Username + ' already exists.');
            } else {
                Users
                    .create({
                        Username: req.body.Username,
                        Password: hashedPassword,
                        Email: req.body.Email,
                        Birthday: req.body.Birthday
                    })
                    .then((user) => {res.status(201).json(user) })
                .catch((error) => {
                    console.error(error);
                    res.status(500).send('Error: ' + error);
                })
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
        });
});

//get all users
app.get('/users', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.find()
        .then((users) => {
            res.status(201).json(users);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

//get a user by Username
app.get('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOne({ Username: req.params.Username })
        .then((user) => {
            res.json(user);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

//allow users to update their user info(username)
app.put('/users/:Username', 
[
    check('Username', 'Username is required.').isLength({min:5}),
    check('Username', 'Username contains nonalphanumeric characters - not allowed').isAlphanumeric(),
    check('Password', 'Password is required.').not().isEmpty(),
    check('Email', 'Email does not appear to be valid.').isEmail()
],
 passport.authenticate('jwt', { session: false }), (req, res) => {
    
    //checks validation code above for errors
    let errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    Users.findOneAndUpdate({ Username: req.params.Username}, { $set:
        {
            Username: req.body.Username,
            Password: req.body.Password,
            Email: req.body.Email,
            Birthday: req.body.Birthday
        }
    },
    { new: true }, //This line makes sure the updated document is returned
    (err, updatedUser) => {
        if(err) {
            console.error(err);
            res.status(500).send('Error: ' + err);
        } else {
            res.json(updatedUser);
        }
    });
});

//allow users to add a movie to their favorite list - EXACT SAME CODE AS REMOVE MOVIE, EXCEPT NEEDS $PULL OPERATOR!
app.post('/users/:Username/FavoriteMovies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.Username }, {
        $push: { FavoriteMovies: req.params.MovieID }
    },
    { new: true },
    (err, updatedUser) => {
        if(err) {
            console.error(err);
            res.status(500).send('Error: ' + error);
        } else {
            res.json(updatedUser);
        }   
    });
});

//allow users to remove a movie from their favorite list
app.delete('/users/:Username/FavoriteMovies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.Username }, {
        $pull: { FavoriteMovies: req.params.MovieID }
    },
    { new: true },
    (err, updatedUser) => {
        if(err) {
            console.error(err);
            res.status(500).send('Error: ' + error);
        } else {
            res.json(updatedUser);
        }
    });
});

//allow users to deregister
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndRemove({ Username: req.params.Username })
    .then((user) => {
        if(!user) {
            res.status(400).send(req.params.Username + ' was not found.');
        } else {
            res.status(200).send(req.params.Username + ' was deleted.');
        }
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//middleware error handling always goes LAST in app.use chain
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Uh oh, something went wrong!');
})

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0',() => {
    console.log('Listening on Port ' + port);
});

