import express from 'express'

const router = express.Router()

/**
 * @swagger
 * /homenews:
 *    get:
 *      tags:
 *      - "homeNews"
 *      description: Get all the homepage news stories
 *      responses:
 *        201:
 *          description: "successful operation"    
 */
router.get('/', (req, res, next) => {
  req.app.db.collection.findOne({
    _id: process.env.GLOBAL_STORIES_ID
  }, { homeNewsStories: 1 }, (err, doc) => {
    if (err) return next(err)

    if (doc) {
      res.status(200).json(doc.homeNewsStories)
    } else {
      return next(new Error('No home news story found'))
    }    
  })
})

export default router