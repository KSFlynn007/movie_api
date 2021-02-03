const express = require('express');
const MovieRouter = express.Router();
const Models = require ('../models.js');
const Movies = Models.Movie;
const passport = require('passport');

MovieRouter //all endpoints have /movies implied as they are within the movies-router
.get('/',
//  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Movies.find()
        .then((movies) => {
            res.status(201).json(movies);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
})
//get data about single movie by title
.get('/:Title', (req, res) => {
    Movies.findOne({ Title: req.params.Title })
        .then((movie) => {
            res.json(movie);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
})
//get data about genre by title "thriller"
.get('/genres/:Name', (req, res) => {
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
})
//get data about a director, same format as above by searching in nested content?
.get('/directors/:Name', (req, res) => {
    Movies.findOne({ 'Director.Name': req.params.Name })
    .then((movie) => {
        res.status(201).json(movie.Director.Name + ': ' + movie.Director.Bio);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

module.exports = MovieRouter;