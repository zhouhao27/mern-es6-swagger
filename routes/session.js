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

/**
 * @swagger
 * definitions:
 *   Login:
 *     type: "object"
 *     properties:
 *       email: 
 *         type: "string"
 *       password:
 *         type: "string"
 */ 

/**
 * @swagger
 * /sessions:
 *    post:
 *      tags:
 *      - "sessions"
 *      summary: User login
 *      description: "Create a login session token Create a security token as the user logs in that can be passed to the
 *      client and used on subsequence calls. The user email and password are sent in the body of the request"
 *      operationId: "login"
 *      produces:
 *      - "application/json"
 *      parameters:
 *      - in: "body"
 *        name: "body"
 *        description: ""
 *        required: true
 *        schema:
 *          $ref: "#/definitions/Login"
 *      responses:
 *        407:
 *          description: "Email not registered."
 *        408:
 *          description: "Wrong password"
 *        201:
 *          description: "successful operation"
 */
router.post('/', (req,res,next) => {
  console.log("User logging in...")
  // Password must be 7 to 15 characters in length and
  // contain at least one numeric digit and a special character
  const schema = {
    email: joi.string().email().min(7).max(50).required(),
    password: joi.string().regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{7,15}$/).required()
  }
  joi.validate(req.body, schema, (err) => {
    if (err) {
      const error = new Error('Invalid field: password 7 to 15 (one number, one special character)')
      error.status = 406
      return next(error)
    }
  })

  req.app.db.collection.findOne({
    type:'USER_TYPE',
    email: req.body.email
  }, (err, user) => {
    if (err) {
      return next(err)
    } 

    if (!user) {
      const error = new Error('User was not found.')
      error.status = 407
      return next(error)
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
        const error = new Error('Wrong password')
        error.status = 408
        return next(error)
      }
    })
  })
})

/**
 * @swagger
 * /sessions/{userId}:
 *    delete:
 *      tags:
 *      - "sessions"
 *      summary: Delete a login session token
 *      description: "Delete the token as a user logs out"
 *      operationId: "logout"
 *      produces:
 *      - "application/json"
 *      parameters:
 *        - in: path
 *          name: userId
 *          schema:
 *            type: integer
 *          required: true
 *          description: Numeric ID of the user to get
 *      responses:
 *        407:
 *          description: "Invalid user id"
 *        201:
 *          description: "successful operation"
 */
router.delete('/:id', authHelper.checkAuth, (req,res,next) => {
  console.log("Logging out...")  
  // Verify the passed in id is the same as that in the auth token
  if (req.params.id != req.auth.userId) {
    const error = new Error('Invalid request for logout')
    error.status = 407
    return next(error)
  }
  res.status(200).json({
    msg: 'Logged out'
  })    
})

module.exports = router