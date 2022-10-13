const express = require('express'),
	app = express(),
	bodyParser = require('body-parser'),
	uuid = require('uuid'),
	morgan = require('morgan'),
	mongoose = require('mongoose')
  const bcrypt = require('bcrypt'),
	Models = require('./models.js');
  const { check, validationResult } = require('express-validator');

  const Movies = Models.Movie,
	Users = Models.User;

  const cors = require('cors');
  app.use(cors());
let auth = require('./auth')(app);
app.use(bodyParser.json());
app.use(morgan('common'));

// mongoose.connect('mongodb://127.0.0.1/myFlixDB', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect( 'process.env.CONNECTION_URI', { useNewUrlParser: true, useUnifiedTopology: true });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const passport = require('passport');
require('./passport');

// let users = [
//     {
//   "Username": 'Thor',
//   "Password": 'GodofThunder',
//   "Email": 'thorthunder@email.com',
//   "Birthday": '0',
//   "FavoriteMovies": 'Interstellar'
//     },
//     {
//   "Username": 'Black Widow',
//   "Password": 'spiders',
//   "Email": 'blackspider@email.com',
//   "Birthday": '1975',
//   "FavoriteMovies": 'Inception'
//     },
//     {
//   "Username": 'Iron Man',
//   "Password": 'robots',
//   "Email": 'tonystark@email.com',
//   "Birthday": '1963',
//   "FavoriteMovies": []
//     },
// ]


// let movies = [
//   {
// Title: 'Interstellar',
// Description: 'A team of explorers travel through a wormhole in space in an attempt to ensure the survival of the human race.',
// "Genre": {
//   "Name":'SciFi',
//   "Descripton": 'Science fiction (or sci-fi) is a film genre that uses speculative, fictional science-based depictions of phenomena that are not fully accepted by mainstream science, such as extraterrestrial lifeforms, spacecraft, robots, cyborgs, interstellar travel or other technologies.'
// },
// Director: 'Christopher Nolan', 
// Bio: 'Christopher Nolan is a British-American film director, producer, and screenwriter. His films have grossed more than US$5 billion worldwide and have garnered 11 Academy Awards from 36 nominations.'
//   },

//   {
// Title: 'Inception',
// Description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project and his team to disaster.',
// "Genre": {
//   "Name": 'SciFi',
//   "Description": 'Science fiction (or sci-fi) is a film genre that uses speculative, fictional science-based depictions of phenomena that are not fully accepted by mainstream science, such as extraterrestrial lifeforms, spacecraft, robots, cyborgs, interstellar travel or other technologies.'
// },
// Director: 'Christopher Nolan',
// Bio: 'Christopher Nolan is a British-American film director, producer, and screenwriter. His films have grossed more than US$5 billion worldwide and have garnered 11 Academy Awards from 36 nominations.'
// },

//   {
// Title: 'The Return of the King',
// Description: 'Gandalf and Aragorn lead the World of Men against Sauron and his army to draw his gaze from Frodo and Sam as they approach Mount Doom with the One Ring.',
// Genre: {
//   Name: 'Action',
//   "Description": 'Action film is a film genre in which the protagonist is thrust into a series of events that typically involve violence and physical feats. The genre tends to feature a mostly resourceful hero struggling against incredible odds, which include life-threatening situations, a dangerous villain, or a pursuit which usually concludes in victory for the hero.'
// },
// Director: 'Peter Jackson',
// Bio: 'Sir Peter Robert Jackson is a New Zealand film director, screenwriter and producer.'
// },
  
// ];

//READ
app.get('/',(req,res) => {
  res.send('Welcome to MyFlix!');
});

app.get('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
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
            Password: req.body.Password,
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
    Users.findOneAndUpdate({ Username: req.params.Username }, { $set:
      {
        Username: req.body.Username,
        Password: req.body.Password,
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