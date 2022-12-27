const express = require('express'),
	app = express(),
	bodyParser = require('body-parser'),
	uuid = require('uuid'),
	morgan = require('morgan'),
	mongoose = require('mongoose'),
  // bcrypt = require('bcrypt'),	
  dotenv = require('dotenv'),
  Models = require('./models.js');
  const { check, validationResult } = require('express-validator');

  dotenv.config({ path: './config.env' });
  const Movies = Models.Movie,
	Users = Models.User;

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  const cors = require('cors');
  // let allowedOrigins = ['http://localhost:8080', 'http://testsite.com', 'http://localhost:1234', 'https://myflix14.netlify.app'];
  
  app.use(cors());

let auth = require('./auth')(app);
app.use(bodyParser.json());
app.use(morgan('common'));

// mongoose.connect('mongodb://127.0.0.1/myFlixDB', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect(process.env.CONNECTION_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const passport = require('passport');
require('./passport');

//READ
app.get('/',(req,res) => {
  res.send('Welcome to MyFlix!');
});

app.get('/movies', passport.authenticate('jwt', { session: false }),(req, res) => {
		Movies.find()
			.then((movies) => {
				res.status(200).json(movies);
			})
			.catch((err) => {
				console.error(err);
				res.status(500).send('Error: ' + err);
			});
	});

//read
app.get('/users', passport.authenticate('jwt', { session: false }),(req, res) => {
  Users.find()
    .then((users) => {
      res.status(201).json(users);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

//read
app.get('/users/:Username', passport.authenticate('jwt', { session: false }),(req, res) => {
  Users.findOne({ Username: req.params.Username })
    .then((user) => {
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

//READ
app.get('/movies/:Title', passport.authenticate('jwt', { session: false }),(req, res) => {
		Movies.findOne({ Title: req.params.Title })
			.then((movie) => {
				res.json(movie);
			})
			.catch((err) => {
				console.error(err);
				res.status(500).send('Error: ' + err);
			});
	});

//READ
app.get('/movies/genre/:genreName', passport.authenticate('jwt', { session: false }),(req, res) => {
		Movies.findOne({ 'Genre.Name': req.params.genreName })
			.then((movie) => {
				res.json(movie.Genre);
			})
			.catch((err) => {
				console.error(err);
				res.status(500).send('Error: ' + err);
			});
	});

//READ
app.get('/movies/directors/:directorName', passport.authenticate('jwt', { session: false }),(req, res) => {
		Movies.findOne({ 'Director.Name': req.params.directorName })
			.then((movie) => {
				res.json(movie.Director);
			})
			.catch((err) => {
				console.error(err);
				res.status(500).send('Error: ' + err);
			});
	});

//create
app.post('/users', [
  check('Username', 'Username is required').isLength({min: 5}),
  check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
  check('Password', 'Password is required').not().isEmpty(),
  check('Email', 'Email does not appear to be valid').isEmail()
], (req, res) => {

// check the validation object for errors
  let errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  let hashedPassword = Users.hashPassword(req.body.Password);
  Users.findOne({ Username: req.body.Username })
    .then((user) => {
      if (user) {
        return res.status(400).send(req.body.Username + 'already exists');
      } else {
        Users
          .create({
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday
          })
          .then((user) =>{res.status(201).json(user) })
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

//create
app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }),(req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username }, {
     $push: { FavoriteMovies: req.params.MovieID }
   },
   { new: true }, // This line makes sure that the updated document is returned
  (err, updatedUser) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error: ' + err);
    } else {
      res.json(updatedUser);
    }
  });
});

//update
  app.put('/users/:Username', passport.authenticate('jwt', { session: false }),[
    check("Username", "Username is required").isLength({ min: 5 }),
    check(
      "Username",
      "Username contains non alphanumeric characters - not allowed."
    ).isAlphanumeric(),
    check("Password", "Password is required").not().isEmpty(),
    check("Email", "Email does not appear to be valid").isEmail(),
  ],
  (req, res) => {
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOneAndUpdate({ Username: req.params.Username }, { $set:
      {
        Username: req.body.Username,
        Password: hashedPassword,
        Email: req.body.Email,
        Birthday: req.body.Birthday
      }
    },
    { new: true }, // This line makes sure that the updated document is returned
    (err, updatedUser) => {
      if(err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
      } else {
        res.json(updatedUser);
      }
    });
  });

//DELETE
  app.delete('/users/:Username', passport.authenticate('jwt', { session: false }),(req, res) => {
    Users.findOneAndRemove({ Username: req.params.Username })
      .then((user) => {
        if (!user) {
          res.status(400).send(req.params.Username + ' was not found');
        } else {
          res.status(200).send(req.params.Username + ' was deleted.');
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });

  // Delete
  app.delete('/users/:Username/movies/:MovieID',passport.authenticate('jwt', { session: false }),(req, res) => {
      Users.findOneAndUpdate(
        { Username: req.params.Username },
        {
          $pull: { FavoriteMovies: req.params.MovieID },
        },
        { new: true },
        (err, updatedUser) => {
          if (err) {
            console.error(err);
            res.status(500).send('Error: ' + err);
          } else {
            res.json(updatedUser);
          }
        });
    });


app.get("/documentation", (req, res) => {
  res.sendFile("public/documentation.html", { root: __dirname });
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0',() => {
 console.log('Listening on Port ' + port);
});

// process.env.CONNECTION_URI
// mongodb://localhost:27017

// mongodb+srv://myflix14:jayner14@myflix14.6bqfhv4.mongodb.net/myFlixDB?retryWrites=true&w=majority

// mongoimport --uri mongodb+srv://myflix14:jayner14@myflix14.6bqfhv4.mongodb.net/myflix14 --collection movies --type json --file ../Documents/movies.json

// mongoimport --uri mongodb+srv://myflix14:Superman%401@myflix14.6bqfhv4.mongodb.net/myflix14 --collection movies --type json --file ../Documents/movies.json

// mongodb+srv://myflix14:Superman%401@myflix14.6bqfhv4.mongodb.net/myflix14?retryWrites=true&w=majority

// passport.authenticate('jwt', { session: false }), ADD BACK TO GET MOVIES