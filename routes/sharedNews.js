import express from 'express'

const router = express.Router()

/**
 * @swagger
 * /sharedNews:
 *    get:
 *      tags:
 *      - "sharedNews"
 *      description: Get all of the shared news stories
 */
router.get('/', (req, res) => {
  res.send('Get all of the shared news stories')
})

// Share a news story as contained in the JSON body
router.post('/', (req, res) => {
  res.send('Share a news story as contained in the JSON body')
})

// Get all of the shared news stories
router.delete('/:id', (req, res) => {
  res.send('Get all of the shared news stories')
})

// Add a comment to a specified shared news story
router.post('/:sid/comments', (req, res) => {
  res.send('Add a comment to a specified shared news story')
})

module.exports = router