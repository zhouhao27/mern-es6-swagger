import express from 'express'
import path from 'path'
import logger from 'morgan'
import bodyParser from 'body-parser'
import cp from 'child_process'
import responseTime from 'response-time'
import assert from 'assert'
import helmet from 'helmet'
import RateLimit from 'express-rate-limit'
import csp from 'helmet-csp'
import swagger from './swagger'
import users from './routes/users'
import session from './routes/session'
import sharedNews from './routes/sharedNews'
import homeNews from './routes/homeNews'

const app = express()
// don't use load balancer IP, use actual machine IP instead
app.enable('trust proxy')

// load environment variables from .env file
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

// enable document autogeneration
swagger(app)

// setup middleware
const limiter = new RateLimit({
  windowMs: 15*60*100,  // 15 minutes
  max: 100, // each IP to 100 requests per windowMS
  delayMs: 0 // disable delaying - full speed until the max limit
})
app.use(limiter)
app.use(helmet())

app.use(csp({
  directives:{
    defaultSrc:["'self'"],
    scriptSrc:['"self"','"unsafe-inline"','ajax.googleapis.com'],
    styleSrc:['"self"', '"unsafe-inline"', 'maxcdn.bootstrapcdn.com'],
    fontSrc:['"self"', 'maxcdn.bootstrapcdn.com'],
    imgSrc:['*']
  }
}))

// Adds an X-Response-Time header
app.use(responseTime())

// logs all HTTP requests. The "dev" option gives it a specific styling
app.use(logger('dev'))

// Sets up the response object in routes to contain a body property with an
// object of what is parsed from a JSON body request payload
// There is no need for allowing a huge body, it might be some attack,
// so use the limit option
app.use(bodyParser.json({'limit':'100kb'}))

// setup database
import { MongoClient } from 'mongodb'

let db = {}
if (process.env.NODE_ENV !== 'production') {
  app.set('uri', process.env.LOCAL_MONGODB_CONNECT_URL)
} else {
  app.set('uri', process.env.MONGODB_CONNECT_URL)
}

const client = new MongoClient(app.get('uri'), { useNewUrlParser: true })
db.client = client
client.connect(err => {
  assert.equal(null,err)
  db.collection = db.client.db("newswatcherdb").collection("newswatcher")
  console.log(`Connected to MongoDB server at ${app.get('uri')}`)
})

// routes
app.get('/', (req,res) => {
  console.log("Home")
  // res.sendFile(path.join(__dirname, 'build', 'index.html'))
  res.send("Home")
})

// Rest API routes
app.use('/api/users', users)
app.use('/api/sessions', session)
app.use('/api/sharednews', sharedNews)
app.use('/api/homenews', homeNews)

// Serving up of static content such as HTML for the React SPA,
// images, CSS files and JavaScript files
app.use(express.static(path.join(__dirname,'build')))

// Forking a child process
let node2 = cp.fork('./worker/app_FORK.js')
node2.on('exit', (code) => {  // in case it stops, restart it
  node2 = undefined
  node2 = cp.fork('./worker/app_FORK.js')
})

// error handling
app.use( (req,res,next) => {
  const err = new Error('Not found!')
  err.status = 404
  next(err)
})

// error handling for development
if (app.get('env') === 'development') {
  app.use((err,req,res,next) => {
    res.status(err.status || 500).json({
      message: err.toString(),
      error: err
    })
    console.error(err)
  })
}

// production error handling with no stacktraces exposed to users
app.use((err,req,res,next) => {
  res.status(err.status || 500).json({
    message: err.toString(),
    error: {}
  })
  console.error(err)
})

app.set('port', process.env.PORT)

const server = app.listen(app.get('port'), () => {
  console.log(`Express server listening on port ${server.address().port}`)
})

app.db = db
// server.db = db
// server.node2 = node2
// module.exports = server
