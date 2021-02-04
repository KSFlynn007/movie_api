require('dotenv').config();

const express = require('express'),
    morgan = require('morgan'),
    uuid = require('uuid'),
    cors = require('cors'),
    mongoose = require('mongoose'),
    config = require('./config'),
    movieRouter = require('./movies/movies-router'),
    userRouter = require('./users/users-router'),
    app = express();

const passport = require('passport');

app.use(morgan('common'));
app.use(cors());
app.use(express.json());
require('./passport');
app.use('/movies', movieRouter);
app.use('/users', userRouter);

const auth = require('./auth')(app);


//connects to existing MongoDB database LOCAL
// mongoose.connect(process.env.LOCAL_DB, { useNewUrlParser: true, useUnifiedTopology: true});

// connects to MongoDB Atlas database
mongoose.connect( process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true});

//homepage
app.get('/', (req, res) => {
    // throw new Error('I broke');
    // console.log(req);
    res.send('Welcome to myFlix app!');
});

//serves documentation.html file using express.static, keyword searching in "public" folder
app.use(express.static('public'));

//middleware error handling always goes LAST in app.use chain
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Uh oh, something went wrong!');
})

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0',() => {
    console.log('Listening on Port ' + port);
});

