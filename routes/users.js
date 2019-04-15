import  express from 'express'
import bcrypt from 'bcryptjs'
import async from 'async'
import joi from 'joi'
import authHelper from './authHelper'
const ObjectId = require('mongodb').ObjectID

const router = express.Router()

/**
 * @swagger
 * definitions:
 *  User:
 *    type: "object"
 *    properties:
 *      email: 
 *        type: "string"
 *      password:
 *        type: "string"
 *      displayName:
 *        type: "string"
 */ 

/**
 * @swagger
 * /users:
 *    get:
 *      tags:
 *      - "users"
 *      summary: This should return all users
 *      description: ""
 *      operationId: "getUsers"
 *      produces:
 *      - "application/json"
 *      parameters: []
 *      responses:
 *        200:
 *          description: "successful operation"
 *          schema:
 *            type: "array"
 *            items:
 */
router.get('/', (req, res) => {
  res.send('Users')
})

/**
 * @swagger
 * /users:
 *    post:
 *      tags:
 *      - "users"
 *      summary: "Create a user with the passed in JSON of the HTTP body"
 *      description: "User register. Email should be unique."
 *      operationId: "addUser"
 *      consumes:
 *      - "application/json"
 *      produces:
 *      - "application/json"
 *      parameters:
 *      - in: "body"
 *        name: "body"
 *        description: "User object that needs to be added. Include email,password and display name"
 *        required: true
 *        schema:
 *          $ref: "#/definitions/User"
 *      responses:
 *        405:
 *          description: "Email account already registered."
 *        406:
 *          description: "Validation error"
 *        200:
 *          description: "successful operation"
 */
router.post('/', (req, res, next) => {
  // Password must be 7 to 15 characters in length and contain at least one 
  // numeric digit and a special character
  const schema = {
    displayName: joi.string().alphanum().min(3).max(50).required(),
    email: joi.string().email().min(7).max(50).required(),
    password: joi.string().regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{7,15}$/).required()
  }
  joi.validate(req.body, schema, (err, value) => {
    if (err) {
      const error = new Error('Invalid field: display name 3 to 50 alphanumeric, valid email and password 7 to 15 (one number, one special character)')
      error.status = 406
      return next(error)
    }  
  })

  req.db.collection.findOne({
    type:'USER_TYPE',
    email:req.body.email
  }, (err, doc) => {
    if (err) {      
      return next(err)
    }

    if (doc) {
      const error = new Error('Email account already registered')
      error.status = 405
      return next(error)
    }

    const xferUser = {
      type:'USER_TYPE',
      displayName:req.body.displayName,
      email:req.body.email,
      passwordHash:null,
      date:Date.now(),
      complete:false,
      settings: {
        requireWIFI:true,
        enableAlerts:false
      },
      newsFilters:[{
        name:'Technology Companies',
        keyWords:['Apple','Microsoft','IBM','Amazon','Google','Intel'],
        enableAlert:false,
        alertFrequency:0,
        enableAutoDelete:false,
        deleteTime:0,
        timeOfLastScan:0,
        newsStories:[]
      }],
      savedStories:[]
    }

    bcrypt.hash(req.body.password,10, (err, hash) => {
      if (err) {
        return next(err)
      }

      xferUser.passwordHash = hash
      req.body.collection.insertOne(xferUser, (err, result) => {
        if (err) {
          return next(err)
        }

        req.node2.send({
          msg: 'REFERSH_STORIES',
          doc: result.ops[0]
        })
        res.status(201).json(result.ops[0])
      })
    })
  })
})

/**
 * @swagger
 * /users:
 *    delete:
 *      tags:
 *      - "users" 
 *      summary: Delete a single specified user
 */
router.delete('/:id', (req, res) => {
  res.send('Delete a single specified user')
})

/**
 * @swagger
 * /users/:id:
 *    get:
 *      tags:
 *      - "users"
 *      summary: Return the JSON of a single specified user
 */
router.get('/:id', (req, res) => {
  res.send('Return the JSON of a single specified user')
})

/**
 * @swagger
 * /users/:id:
 *    put:
 *      tags:
 *      - "users"
 *      summary: Replace a user with the passed-in JSON of the HTTP body
 */
router.put('/:id', (req, res) => {
  res.send('Replace a user with the passed-in JSON of the HTTP body')
})

/**
 * @swagger
 * /users/:id:
 *    delete:
 *      tags:
 *      - "users"
 *      summary: Delete a story that the user had previously saved
 */
router.delete('/:id/savedstories/:sid', (req, res) => {
  res.send('Delete a story that the user had previously saved')
})

module.exports = router