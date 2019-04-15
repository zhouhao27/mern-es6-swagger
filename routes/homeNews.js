import express from 'express'

const router = express.Router()

/**
 * @swagger
 * /homeNews:
 *    get:
 *      tags:
 *      - "homeNews"
 *      description: Get all the homepage news stories
 */
router.get('/', (req, res) => {
  res.send('Get all the homepage news stories')
})

module.exports = router