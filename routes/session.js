'use strict'
import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jwt-simple'
import joi from 'joi'
import authHelper from './authHelper'

const router = express.Router()

router.get('/', (req, res) => {
  res.send('Session')
})

// Create a login session token
// Create a security token as the user logs in that can be passed to the
// client and used on subsequence calls
// The user email and password are sent in the body of the request
router.post('/', (req,res,next) => {
  //res.send('Create a login session token')
  // Password must be 7 to 15 characters in length and
  // contain at least one numeric digit and a special character
  const schema = {
    email: joi.string().email().min(7).max(50).required(),
    password: joi.string().regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{7,15}$/).required()
  }
  joi.validate(req.body, schema, (err) => {
    if (err) {
      return next(new Error('Invalid field: password 7 to 15 (one number, one special character)'))
    }
  })

  req.db.collection.findOne({
    type:'USER_TYPE',
    email: req.body.email
  }, (err, user) => {
    if (err) {
      return next(err)
    } 

    if (!user) {
      return next(new Error('User was not found.'))
    }

    bcrypt.compare(req.body.password, user.passwordHash, (err, match) => {
      if (match) {
        try {
          const token = jwt.encode({
            authorized: true,
            sessionIP: req.ip,
            sessionUA: req.headers['user-agent'],
            userId: user._id.toHexString(),
            displayName: user.displayName
          }, process.env.JWT_SECRET)
          res.status(201).json({
            displayName: user.displayName,
            userId: user._id.toHexString(),
            token: token, 
            msg:'Authorized'
          })
        } catch (err) {
          return next(err)
        }
      } else {
        return next(new Error('Wrong password'))
      }
    })
  })
})

// Delete a login session token
// Delete the token as a user logs out
router.delete('/:id', authHelper.checkAuth, (req,res,next) => {
  // Verify the passed in id is the same as that in the auth token
  if (req.params.id != req.auth.userId) {
    return next(new Error('Invalid request for logout'))
    res.status(200).json({
      msg: 'Logged out'
    })
  }
  res.send('Delete a login session token')
})

module.exports = router