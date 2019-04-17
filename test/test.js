import assert from 'assert'

// To hit production AWS!
//var request = require('supertest')('https://www.newswatcherfs.com/');

// run locally, like in vscode debugger and test against that
//var request = require('supertest')('http://localhost:3000');

// To self launch app and test against it
import app from '../server'
import supertest from 'supertest'

const request = supertest(app)

