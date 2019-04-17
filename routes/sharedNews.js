import express from 'express'
import joi from 'joi'
import authHelper from './authHelper';

const router = express.Router()

/**
 * @swagger
 * /sharednews:
 *    get:
 *      tags:
 *      - "sharedNews"
 *      description: Get all of the shared news stories
 *      security:
 *      - jwt: []    
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

/**
 * @swagger
 * /sharednews/{storyId}:
 *    delete:
 *      tags:
 *      - "sharedNews"
 *      summary: Delete a shared news stories
 *      operationId: "deleteStory"
 *      produces:
 *      - "application/json"
 *      parameters:
 *        - in: path
 *          name: storyId
 *          schema:
 *            type: string
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
router.delete('/:sid', authHelper.checkAuth, (req, res, next) => {
  req.app.db.collection.findOneAndDelete({ 
    type: 'SHAREDSTORY_TYPE',
    _id: req.params.sid
  }, (err, result) => {
    if (err) {
      console.log("+++POSSIBLE CONTENTION ERROR?+++ err:", err)
      return next(err)
    } else if (result.ok != 1) {
      console.log("+++POSSIBLE CONTENTION ERROR?+++ result:", result)
      return next(new Error('Shared story deletion failure'))
    }
    res.status(201).json({msg:'Shared story deleted'})
  })
})

/**
 * @swagger
 * /sharednews/{storyId}/comments:
 *    post:
 *      tags:
 *      - "sharedNews"
 *      summary: Add a comment to a specified shared news story
 *      operationId: "addComment"
 *      produces:
 *      - "application/json"
 *      parameters:
 *        - in: path
 *          name: storyId
 *          schema:
 *            type: string
 *          required: true
 *          description: ID of the story
 *        - in: "body"
 *          name: "body"
 *          description: "Comment string"
 *          required: true
 *          schema:
*             $ref: "#/definitions/Comment"
 *      security:
 *      - jwt: [] 
 *      responses:
 *        407:
 *          description: "Invalid user id"
 *        201:
 *          description: "successful operation"   
 */
router.post('/:sid/comments', authHelper.checkAuth, (req, res, next) => {
  // Validate the body
  const schema = {
    comment: joi.string().max(250).required()
  }

  joi.validate(req.body, schema, (err) => {
    if (err) return next(err)

    const xferComment = {
      displayName: req.auth.displayName,
      userId: req.auth.userId,
      dateTime: Date.now(),
      comment: req.body.comment.substring(0,250)
    }

    // Not allowed at free tier!!! req.app.db.collection.findOneAndUpdate({
    //  type: 'SHAREDSTORY_TYPE',
    //  _id: req.params.sid, 
    //  $where: 'this.comments.length < 29'
    //})
    req.app.db.collection.findOneAndUpdate({
      type: 'SHAREDSTORY_TYPE',
      _id: req.params.sid
    }, { $push: { comments: xferComment }},
    (err, result) => {
      if (result && result.value == null) {
        return next(new Error('Comment limit reached'))  
      } else if (err) {
        console.log("+++POSSIBLE CONTENTION ERROR?+++ err:", err)
        return next(err)  
      } else if ( result.ok != 1 ) {
        console.log("+++POSSIBLE CONTENTION ERROR?+++ result:", result)
        return next(new Error('Comment save failure'))  
      }
      res.status(201).json({msg: 'Comment added' })
    })
  })
})

export default router