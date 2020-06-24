const express = require('express');
const router = express.Router();
const { asyncHandler, authenticateUser } = require('../middleware');
const { Course, User } = require('../models');
const { handleSequelizeValidationErrors: seqErrors } = require('../helpers');

//  GET /api/courses 200 - Returns a list of courses (including the user that owns each course)
router.get('/', asyncHandler(async (req, res) => {
  const courses = await Course.findAll({
    attributes: {exclude: ['createdAt', 'updatedAt']},
    include: {
      model: User,
      attributes: ['id', 'firstName', 'lastName', 'emailAddress']
    }
  });
  res.json(courses);
}));

// GET /api/courses/:id 200 - Returns a course (including the user that owns the course) for the provided course ID
router.get('/:id', asyncHandler(async (req, res) => {
  const course = await Course.findOne({
    attributes: {exclude: ['createdAt', 'updatedAt']},
    include: {
      model: User,
      attributes: ['id', 'firstName', 'lastName', 'emailAddress']
    },
    where: {
      id: req.params.id
    }
  });
  if (course) {
    res.json(course);
  } else {
    // course not found
    res.sendStatus(404);
  }
}));

// POST /api/courses 201 - Creates a course, sets the Location header to the URI for the course, and returns no content
router.post('/', authenticateUser, asyncHandler( async (req, res, next) => {
  try {
    const course = await Course.create(req.body);
    res.location('/api/courses/' + course.id)
    res.status(201).end();
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      res.status(400).json({ error: seqErrors(error) });
    } else {
      next(error);
    }
  }
}));

// PUT /api/courses/:id 204 - Updates a course and returns no content
router.put('/:id', authenticateUser, asyncHandler (async (req, res, next) => {
  const user = req.currentUser;
  let course = await Course.findByPk(req.params.id, {
    include: User
  });

  if (course) {
    // check course owner matches authenticated user
    // found method to check if data was updated here https://dev.to/nedsoft/performing-crud-with-sequelize-29cf
    if (course.userId === user.id) {
      try {
        const [updated] = await Course.update(req.body, {
          where: { id: req.params.id }
        });
        if (updated) {
          res.status(204).end();
        } else {
          res.sendStatus(400);
        }
      } catch (error) {
        if (error.name === 'SequelizeValidationError') {
          res.status(400).json({ error: seqErrors(error) });
        } else {
          next(error);
        }
      }
    } else {
      // not allowed
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(404);
  }
}));

// DELETE /api/courses/:id 204 - Deletes a course and returns no content
router.delete('/:id', authenticateUser, asyncHandler( async (req, res) => {
  const user = req.currentUser;
  let course = await Course.findByPk(req.params.id, {
    include: User
  });
  if (course) {
    if (course.userId === user.id) {
      await course.destroy();
      res.status(204).end();
    } else {
      // not allowed
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(404);
  }
}));

module.exports = router;
