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
 *  Register:
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
 * definitions:
 *  Settings:
 *    type: "object"
 *    properties:
 *      requireWIFI: 
 *        type: boolean
 *        default: true
 *      enableAlerts:
 *        type: boolean
 *        default: false
 */ 

/**
 * @swagger
 * definitions:
 *  Filter:
 *    type: "object"
 *    properties:
 *      name: 
 *        type: string
 *      keyWords:
 *        type: array
 *        items:
 *          type: string
 *      enableAlert:
 *        type: boolean
 *        default: false
 *      alertFrequency:
 *        type: "integer"
 *        format: "int32"
 *      enableAutoDelete:
 *        type: boolean
 *        default: false
 *      deleteTime:
 *        type: integer
 *        format: int32
 *      timeOfLastScan:
 *        type: integer
 *        format: int32
 *      newsStories:
 *        type: array
 *        items:
 *          type: string 
 */ 

/**
 * @swagger
 * definitions:
 *  User:
 *    type: "object"
 *    properties:
 *      "type":
 *         type: string
 *      displayName:
 *         type: string
 *      email:
 *         type: string
 *      settings:
 *         $ref: '#/definitions/Settings'
 *      savedStories:
 *        type: array
 *        items:
 *          type: string
 *      filters:
 *          type: array
 *          items:
 *            $ref: "#/definitions/Filter"
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
 *      security:
 *      - jwt: []  
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
 *      operationId: "register"
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
 *          $ref: "#/definitions/Register"
 *      responses:
 *        405:
 *          description: "Email account already registered."
 *        406:
 *          description: "Validation error"
 *        201:
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

  req.app.db.collection.findOne({
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
      req.app.db.collection.insertOne(xferUser, (err, result) => {
        if (err) {
          return next(err)
        }

        // TODO:
        // req.node2.send({
        //   msg: 'REFERSH_STORIES',
        //   doc: result.ops[0]
        // })
        res.status(201).json(result.ops[0])
      })
    })
  })
})

/**
 * @swagger
 * /users/{userId}:
 *    delete:
 *      tags:
 *      - "users" 
 *      summary: Delete a single specified user
 *      operationId: "deleteUser"
 *      produces:
 *      - "application/json"
 *      parameters:
 *        - in: path
 *          name: userId
 *          schema:
 *            type: integer
 *          required: true
 *          description: Numeric ID of the user to get
 *      security:
 *      - jwt: []
 *      responses:
 *        407:
 *          description: "Invalid user id"
 *        201:
 *          description: "successful operation"
 */
router.delete('/:id', authHelper.checkAuth, (req, res) => {
  // Verfiy that the passed in id to delete is the same as that in the auth token
  if (req.params.id != req.auth.userId)
    return next(new Error('Invalid request for account deletion'))

  // MongoDB should do the work of queing this up and retrying if there is a conflict,
  // According to their documentation.
  // This requires a write lock on their part.
  req.app.db.collection.findOneAndDelete({
    type: 'USER_TYPE',
    _id: ObjectId(req.auth.userId)
  }, (err, result) => {
    if (err) {
      console.log('Possible User deleteion contention? err:', err)
      return next(err)
    } else if (result.ok != 1) {
      console.log('Possible User deletetion error? result:', result)
      return next(new Error('Account deletion failure'))         
    }
    res.status(200).json({msg:'User Deleted'})
  })  
})

/**
 * @swagger
 * /users/{userId}:
 *    get:
 *      tags:
 *      - "users"
 *      summary: Return the JSON of a single specified user
 *      operationId: "getUser"
 *      produces:
 *      - "application/json"
 *      parameters:
 *        - in: path
 *          name: userId
 *          schema:
 *            type: integer
 *          required: true
 *          description: Numeric ID of the user to get
 *      security:
 *      - jwt: [] 
 *      responses:
 *        407:
 *          description: "Invalid user id"
 *        201:
 *          description: "successful operation"  
 */
router.get('/:id', authHelper.checkAuth, (req, res, next) => {
  // verifiy the the passed in id is the same as the auth token
  if (req.params.id != req.auth.userId) {
    const error = new Error('Invalid request for account fetch')
    error.status = 407
    return next(error)
  }

  req.app.db.collection.findOne({
    type: 'USER_TYPE',
    _id: ObjectId(req.auth.userId)
  }, (err,doc) => {
    if (err) return next(err)

    const xferProfile = {
      email: doc.email,
      displayName: doc.displayName,
      date: doc.date,
      settings: doc.settings,
      newsFilters: doc.newsFilters,
      savedStories: doc.savedStories
    }

    res.header('Cache-Control','no-cache,no-store,must-revalidate')
    res.header('Pragma', 'no-cache')
    res.header('Expires',0)
    res.status(200).json(xferProfile)
  })
})

/**
 * @swagger
 * /users/{userId}:
 *    put:
 *      tags:
 *      - "users"
 *      summary: Replace a user with the passed-in JSON of the HTTP body
 *      operationId: "changeUser"
 *      produces:
 *      - "application/json"
 *      parameters:
 *        - in: path
 *          name: userId
 *          schema:
 *            type: integer
 *          required: true
 *          description: Numeric ID of the user to get
 *        - in: "body"
 *          name: "body"
 *          description: "User object"
 *          required: true
 *          schema:
 *            $ref: "#/definitions/User"
 *      security:
 *      - jwt: [] 
 *      responses:
 *        407:
 *          description: "Invalid user id"
 *        408:
 *          description: "Too many news filters"
 *        201:
 *          description: "successful operation"   
 */
router.put('/:id', authHelper.checkAuth, (req, res, next) => {
  // verifiy the the passed in id is the same as the auth token
  if (req.params.id != req.auth.userId) {
    const error = new Error('Invalid request for account fetch')
    error.status = 407
    return next(error)
  }

  // Limit the number of newsFilters
  if (req.body.newsFilters.length > process.env.MAX_FILTERS) {
    const error = new Error('Too many news newsFilters')
    error.status = 408
    return next(error)
  }

  // clear out leading and trailing spaces
  for (let i = 0; i < req.body.newsFilters.length; i++) {
    if ("keyWords" in req.body.newsFilters[i] && 
      req.body.newsFilters[i].keyWords[0] != "") {

      for (let j = 0; j < req.body.newsFilters[i].keyWords.length; j++) {
        req.body.newsFilters[i].keyWords[j] = req.body.newsFilters[i].keyWords[j].trim()
      }
    }
  }

  // Validate the newsFilters
  const schema = {
    name: joi.string().min(1).max(30).regex(/^[-_a-zA-Z0-9]+$/).required(),
    keyWords: joi.array().max(10).items(joi.string().max(20)).required(),
    enableAlert: joi.boolean,
    alertFrequency: joi.number().min(0),
    enableAutoDelete: joi.boolean(),
    deleteTime: joi.date(),
    timeOfLastScan: joi.date(),
    newsStories: joi.array(),
    keywordsStr: joi.string().min(1).max(100)
  }

  async.eachOfSeries(req.body.newsFilters, (filter, innerCallback) => {
    joi.validate(filter, schema, (err) => {
      innerCallback(err)
    })
  }, (err) => {
    if (err) {
      return next(err)
    } else {
      // MongoDB implements optimistic concurrency for us.
      // We were not holding on to the document anyway, so we just do a
      // quick read and replace of just those properties and not the 
      // complete document.
      // It matters if news stories were updated in the mean time (i.e. user
      // sat there taking their time updating their news profile)
      // because we will force that to update as part of this operation.
      // We need the { returnOriginal: false }, so a test could verify what
      // happened, otherwise the default is to return the original.
      req.app.db.collection.findOneAndUpdate({
        type: 'USER_TYPE',
        _id: ObjectId(req.auth.userId)
      }, {$set: {
        settings: {
          requireWIFI: req.body.requireWIFI,
          enableAlert: req.body.enableAlert
        }, newsFilters: req.body.newsFilters
      }}, { returnOriginal: false }, (err, result) => {
        if (err) {
          console.log("+++POSSIBLE USER PUT CONTENTION ERROR?+++ err:", err)
          return next(err)
        } else if ( result.ok != 1 ) {
          console.log("+++POSSIBLE CONTENTION ERROR?+++ result:", result)
          return next(new Error('User PUT failure'))
        }

        // TODO: send to node2
        req.app.node2.send({
          msg:'REFERSH_STORIES',
          doc: result.value
        })
        res.status(200).json(result.value)
      })
    }
  })
})

/**
 * @swagger
 * /users/{userId}/savedstories/{storyId}:
 *    delete:
 *      tags:
 *      - "users"
 *      summary: Delete a story that the user had previously saved
 *      operationId: "deleteStory"
 *      produces:
 *      - "application/json"
 *      parameters:
 *        - in: path
 *          name: userId
 *          schema:
 *            type: integer
 *          required: true
 *          description: Numeric ID of the user to get
 *        - in: path
 *          name: storyId
 *          schema:
 *            type: integer
 *          required: true
 *          description: Numeric ID of the story
 *      security:
 *      - jwt: [] 
 *      responses:
 *        407:
 *          description: "Invalid user id"
 *        201:
 *          description: "successful operation"   
 */
router.delete('/:id/savedstories/:sid', authHelper.checkAuth, (req, res, next) => {
  if (req.params.id != req.auth.userId) {
    return next(new Error('Invalid request for deletion of saved story'))
  }

  req.app.db.collection.findOneAndUpdate({ type: 'USER_TYPE',
    _id: ObjectId(req.auth.userId)},
    { $pull: { savedStories: { storyID: req.params.sid }}},
    { returnOriginal: true },
    (err,result) => {
      if (err) {
        console.log("+++POSSIBLE CONTENTION ERROR?+++ err:", err)
        return next(err)
      } else if (result.ok != 1) {
        console.log("+++POSSIBLE CONTENTION ERROR?+++ result:", result)
        return next(new Error('Story delete failure'))
      }

      res.status(200).json(result.value)
    })
})

/**
 * @swagger
 * /users/{userId}/savedstories:
 *    post:
 *      tags:
 *      - "users"
 *      summary: Post stories
 *      operationId: "postStory"
 *      produces:
 *      - "application/json"
 *      parameters:
 *        - in: path
 *          name: userId
 *          schema:
 *            type: integer
 *          required: true
 *          description: Numeric ID of the user to get
 *      security:
 *      - jwt: [] 
 *      responses:
 *        407:
 *          description: "Invalid user id"
 *        201:
 *          description: "successful operation"   
 */
router.post('/:id/savedstories', authHelper.checkAuth, (req, res, next) => {
  // Verify the id is the same as in the auth token
  if (req.params.id != req.auth.userId) {
    return next(new Error('Invalid request for saving story'))
  }

  // Validate the body
  const schema = {
    contentSnippet: joi.string().max(200).required(),
    date: joi.date().required(),
    hours: joi.string().max(20),
    imageUrl: joi.string().max(300).required(),
    keep: joi.boolean().required(),
    link: joi.string().max(300).required(),
    source: joi.string().max(50).required(),
    storyID: joi.string().max(100).required(),
    title: joi.string().max(200).required()
  }

  joi.validate(req.body, schema, (err) => {
    if (err) return next(err)

    // make sure:
    // A. Story is not already in there
    // B. We limit the number of saved stories to 30
    // Not allowed at free tier!!!
    // req.app.db.collection.findOneAndUpdate(
    //  { type: 'USER_TYPE', _id: ObjectId(req.auth.userId)},
    //  $where: 'this.savedStories.length < 29' },
    req.app.db.collection.findOneAndUpdate({ type: 'USER_TYPE',
      _id: ObjectId(req.auth.userId)},
      { $addToSet: {savedStories: req.body}},
      { returnOriginal: true },
      (err, result) => {
        if (result && result.value == null) {
          return next(new Error('Over the save limit, or story already saved'))
        } else if (err) {
          console.log('+++POSSIBLE CONTENTION ERROR?+++ err:',err)
          return next(err)
        } else if (result.ok != 1) {
          console.log('+++POSSIBLE CONTENTION ERROR?+++ result:',result)
          return next(new Error('Story save failure'))
        }
        res.status(200).json(result.value)
      })
  })
})

export default router