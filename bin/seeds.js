const mongoose = require('mongoose');
const User = require('../models/User.model');
const Article = require('../models/Article.model');
const News = require('../models/News.model');
 
require('../configs/db.config');

// const users = [
//   {
//     name: 'John Galt',
//     email: 'user1@example.com'
//   },
//   {
//     name: 'John Doe',
//     email: 'user2@example.com'
//   },
//   {
//     name: 'Rihcard Pied',
//     email: 'user3@example.com'
//   },
//   {
//     name: 'Dagny Taggart',
//     email: 'user4@example.com'
//   }

// ];
 
// User.create(users)
//   .then(articlesFromDB => {
//     console.log(`Created ${articlesFromDB.length} articles`);
 
//     // Once created, close the DB connection
//     mongoose.connection.close();
//   })
//   .catch(err => console.log(`An error occurred while creating users from the DB: ${err}`));






