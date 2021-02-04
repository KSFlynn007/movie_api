//endpoint logic for existing users to login
const express = require('express');
const app = express();

const jwtSecret = process.env.JWT_SECRET; //This has to be the same key in passport.js JWTStrategy

const jwt = require('jsonwebtoken'),
    passport = require('passport');

require('./passport'); //local passport file

let generateJWTToken = (user) => {
    return jwt.sign(user, jwtSecret, {
        subject: user.Username, //Username encoding in the JWT
        expiresIn: '7d',
        algorithm: 'HS256'
    });
}

// POST login
module.exports = (router) => {
    router.post('/login', (req, res) => {
        passport.authenticate('local', { session: false }, (error, user, info) => {
            if (error || !user) {
                return res.status(400).json({
                    message: 'Something is not right here.',
                    user: user
                });
            }
            req.login(user, { session: false }, (error) => {
                if (error) {
                    res.send(error);
                }
                let token = generateJWTToken(user.toJSON());
                return res.json({ user, token }); //shorthand for res.json({ user: user, token: token })
            });
        }) (req, res);
    });
}