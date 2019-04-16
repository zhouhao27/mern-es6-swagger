import express from 'express'
import joi from 'joi'
import authHelper from './authHelper';

const router = express.Router()

/**
 * @swagger
 * definitions:
 *  Story:
 *    type: "object"
 *    properties:
 *      contentSnippet: 
 *        type: "string"
 *      date:
 *        type: "string"
 *        format: "date-time"
 *      hours:
 *        type: "string"
 *      imageUrl:
 *        type: "string"
 *      keep:
 *        type: boolean
 *      link:
 *        type: string
 *      source:
 *        type: string
 *      storyID:
 *        type: string
 *      title:
 *        type: string
 */ 

/**
 * @swagger
 * /sharednews:
 *    get:
 *      tags:
 *      - "sharedNews"
 *      description: Get all of the shared news stories
 *      responses:
 *        201:
 *          description: "successful operation"    
 */
router.get('/', authHelper.checkAuth, (req, res, next) => {
  req.app.db.collection.find({ type: 'SHAREDSTORY_TYPE' }).toArray((err,docs) => {
    if (err) return next(err)

    res.status(200).json(docs)
  })
})

/**
 * @swagger
 * /sharednews:
 *    post:
 *      tags:
 *      - "sharedNews"
 *      description: Share a news story as contained in the JSON body
 *      parameters:
 *      - in: "body"
 *        name: "body"
 *        description: "Story object that needs to be added."
 *        required: true
 *        schema:
 *          $ref: "#/definitions/Story" 
 *      security:
 *      - jwt: []   
 *      responses:
 *        201:
 *          description: "successful operation"    
 */
router.post('/', authHelper.checkAuth, (req, res, next) => {
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

    // We first make sure we are not at the count limit
    req.app.db.collection.count({
      type: 'SHAREDSTORY_TYPE'
    }, (err,count) => {
      if (err) return next(err)
      if (count > process.env.MAX_SHARED_STORIES) {
        return next(new Error('Shared story limit reached'))
      }

      // Make sure the story was not already shared
      req.app.db.collection.count({
        type: 'SHAREDSTORY_TYPE',
        _id: req.body.storyID
      }, (err,count) => {
        if (err) return next(err)

        if (count > 0) {
          return next(new Error('Story was already shared.'))
        }

        // We set the id and guarantee uniqueness or failure happens
        const xferStory = {
          _id: req.body.storyID,
          type: 'SHAREDSTORY_TYPE',
          story: req.body,
          comments: [{
            displayName: req.auth.displayName,
            userId: req.auth.userId,
            dateTime: Date.now(),
            comment: req.auth.displayName + " thought everyone might enjoy this"
          }]
        }

        req.app.db.collection.insertOne(xferStory,
          (err, result) => {
            if (err) return next(err)
            res.status(201).json(result.ops[0])
          })
      })
    })
  })
})

// Get all of the shared news stories
router.delete('/:id', (req, res) => {
  res.send('Get all of the shared news stories')
})

// Add a comment to a specified shared news story
router.post('/:sid/comments', (req, res) => {
  res.send('Add a comment to a specified shared news story')
})

export default router