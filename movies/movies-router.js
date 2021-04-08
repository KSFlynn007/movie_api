const express = require('express');
const MovieRouter = express.Router();
const Models = require ('../models.js');
const Movies = Models.Movie;
const passport = require('passport');

/**
 * all endpoints have /movies implied as they are within the movies-router
 */
MovieRouter 
.get('/', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.find()
    /**
     * @returns either status 201 for GET movies or 500 for error
     */
        .then((movies) => {
            res.status(201).json(movies);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
})
/**
 * get data about a single movie by title:
 */
.get('/:Title', (req, res) => {
    Movies.findOne({ Title: req.params.Title })
    /**
     * @returns either movie info by title or status 500 error
     */
        .then((movie) => {
            res.json(movie);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
})
/**
 * get data about genre by title
 */
.get('/genres/:Name', (req, res) => {
    Movies.findOne({ 'Genre.Name': req.params.Name })
    /**
     * @returns either status 201 for movie-specific genre info or error
     */
    .then((movie) => {
        res.status(201).json(movie.Genre.Name + ": " + movie.Genre.Description);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
})
/**
 * get datra about director by name
 */
.get('/directors/:Name', (req, res) => {
    Movies.findOne({ 'Director.Name': req.params.Name })
    /**
     * @returns either status 201 for director info or error
     */
    .then((movie) => {
        res.status(201).json(movie.Director.Name + ': ' + movie.Director.Bio);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

module.exports = MovieRouter;