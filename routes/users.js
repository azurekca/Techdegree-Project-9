const express = require('express');
const router = express.Router();
const bcryptjs = require('bcryptjs');
const { asyncHandler, authenticateUser } = require('../middleware');
const { User } = require('../models');


// Route that returns the currently authenticated user.
router.get('/', authenticateUser, (req, res) => {
  const { password, ...user } = req.currentUser
  res.json(user);
});

// create new users
router.post('/', asyncHandler(async(req, res, next) => {
  // get the user from the request body
  let user = req.body;
  try {
    if (user.password) user.password = bcryptjs.hashSync(user.password);
    user = await User.create(user);
    res.location('/');
    res.status(201).end();
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      // validation error
      res.status(400).json({ error: error.errors[0].message });
    } else {
      // server error
     next(error);
    }
  }
}));

module.exports = router;
