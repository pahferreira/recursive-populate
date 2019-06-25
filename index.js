import express from 'express'
import mongoose from 'mongoose'
import bodyParser from 'body-parser'
import router from './route'

const db = 'mongodb://localhost:27017/teste'
const app = express()
app.use(bodyParser.json())
mongoose
  .connect(db, { useNewUrlParser: true })
  .then(() => console.log('Database Connected!!!'))
  .catch(err => console.log(err))

app.use('', router)
app.listen(5000, () => console.log('Server Started'))
