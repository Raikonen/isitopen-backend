const express = require('express')

require('dotenv').config()

// Express Middleware
const helmet = require('helmet') // creates headers that protect from attacks (security)
const bodyParser = require('body-parser') // turns response into usable format
const cors = require('cors')  // allows/disallows cross-site communication
const morgan = require('morgan') // logs requests

const { Pool } = require('pg')
const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true
  });

// db Connection w/ localhost
// const { Pool } = require('pg')
// const db = new Pool({
//     user: 'postgres',
//     host: 'localhost',
//     database: 'restaurants',
//     password: 'password',
//     port: 5432,
// })

// Controllers - aka, the db queries
const main = require('./controllers/main')

// App
const app = express()

// App Middleware
const whitelist = ['http://localhost:3001']
const corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    }
}
app.use(helmet())
app.use(cors(corsOptions))
app.use(bodyParser.json())
app.use(morgan('combined')) // use 'tiny' or 'combined'

// App Routes
app.get('/stores', (req, res) => main.getStores(req, res, db))
app.post('/store_info', (req, res) => main.getStoreInfo(req, res, db))
app.post('/filter', (req, res) => main.filterByDateTime(req, res, db))
app.post('/add_user', (req, res) => main.addUser(req, res, db))
app.post('/validate_email', (req, res) => main.validateEmail(req, res, db))
app.post('/validate_password', (req, res) => main.validatePassword(req, res, db))

// App Server Connection
app.listen(process.env.PORT || 3000, () => {
    console.log(`app is running on port ${process.env.PORT || 3000}`)
})
