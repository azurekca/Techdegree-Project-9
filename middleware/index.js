/** Middleware for the Courses REST API */

// import modules to hash, and thus encrypt, users
const bcryptjs = require('bcryptjs');
const auth = require('basic-auth');

// import User db model
const { User } = require('../models');

/* Handler function to wrap each route. */
function asyncHandler(callback) {
	return async (req, res, next) => {
		try {
			await callback(req, res, next);
		} catch (error) {
			res.status(500).send(error);
		}
	};
}

async function authenticateUser(req, res, next) {
  let message = null; // variable to hold any error message

  // Credentials from HTTP Authorization header
  const credentials = auth(req);

  if (credentials) {
    // Try to get the user from the db
    const user = await User.findOne({
      attributes: ['id', 'firstName', 'lastName', 'emailAddress', 'password'],
      where: {
        emailAddress: credentials.name
      },
      raw: true
    });

    if (user) {
      // Use bcryptjs npm package to compare the user's password to what is stored
      const authenticated = bcryptjs.compareSync(credentials.pass, user.password);

      if (authenticated) {
        // Store the retrieved user object on the request object
        req.currentUser = user;
      } else {
        message = `Authentication failure for username: ${user.username}`; // i.e. the passwords didn't match
      }
    } else {
      message = `User not found for username: ${credentials.name}`; // supplied email not found in stored users
    }
  } else {
    message = 'Auth header not found';
  }

  if (message) {
    console.warn(message);

    res.status(401).json({ message: 'Access Denied' });
  } else {
    // If authentication succeeded, proceed
    next();
  }
};

module.exports = { asyncHandler, authenticateUser };