const express = require('express');
const UsersRouter = express.Router();
const Models = require('../models.js');
const Users = Models.User;
const passport = require('passport');
const { check, validationResult } = require('express-validator');

UsersRouter //all endpoints have /user implied initially
//allow new users to register, no authorization here, because anonymous users need to register for the first time!
.post('/', 
    [
        check('Username', 'Username is required').isLength({min:5}),
        check('Username', 'Username contains non alphanumeric characters - not allowed').isAlphanumeric(),
        check('Password', 'Password is not required').not().isEmpty(),
        check('Email', 'Email does not appear to be valid').isEmail()
    ],
     (req, res) => {
    //check validation object for errors
    let errors = validationResult(req);

    console.log(req.body, errors);

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
})
//get all users
.get('/', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.find()
        .then((users) => {
            res.status(201).json(users);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
})
//get a user by Username
.get('/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOne({ Username: req.params.Username })
        .then((user) => {
            res.json(user);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
})
//allow users to update their user info(username)
.put('/:Username', 
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
})
//allow users to add a movie to their favorite list - EXACT SAME CODE AS REMOVE MOVIE, EXCEPT NEEDS $PULL OPERATOR!
.post('/:Username/FavoriteMovies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
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
})
//allow users to remove a movie from their favorite list
.delete('/:Username/FavoriteMovies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
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
})
//allow users to deregister
.delete('/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
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

module.exports = UsersRouter;