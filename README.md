# MERN ES6 Swagger

Please refer to [Full-Stack Node.js MERN with the AWS Platform (2nd edition)](https://github.com/eljamaki01/NewsWatcher2RWeb).

## Features

- Mongodb
- Express
- React, React-native
- Node
- Swagger document for API
- ES6

## Installation

> yarn install

## Setup

- Create local database

> mkdir local_db

- Create database **newswatcherdb**
- Create collection **newswatcher**
- Create a .env file

```
MONGODB_CONNECT_URL=mongodb+srv://username:password@url/test?retryWrites=true
LOCAL_MONGODB_CONNECT_URL=mongodb://localhost:27017/test
PORT=3000
JWT_SECRET=<You Secret>
NEWYORKTIMES_API_KEY=<You API Key>
GLOBAL_STORIES_ID=MASZTER_STORIES_DO_NOT_DELETE
MAX_SHARED_STORIES=30
MAX_COMMENTS=30
MAX_FILTERS=5
MAX_FILTER_STORIES=15
```

## Run

### Run Mongodb first

`yarn run-db`

### Run in development mode

`yarn dev`

## Notice

> The different eslint version in root may affect the react web so I change the version in package.json to 5.12.0

`"eslint": "5.12.0",`

## Reference

### Enable ES6 

[Enable ES6 (and beyond) syntax with Node and Express](https://medium.freecodecamp.org/how-to-enable-es6-and-beyond-syntax-with-node-and-express-68d3e11fe1ab)

### Generate API document

[Express API with autogenerated OpenAPI doc through Swagger](http://www.acuriousanimal.com/2018/10/20/express-swagger-doc.html)

[Setting Up Swagger to API Test In a JavaScript Application](https://itnext.io/setting-up-swagger-in-a-node-js-application-d3c4d7aa56d4)

### Show process using certain port

`lsof -nP -i4TCP:27017 | grep LISTEN`

### Kill process by name

`pkill "mongod"`

## TODO

- Make strings as constants
- Error code as constants
- Local MongoDB

