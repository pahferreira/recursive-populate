import mongoose from 'mongoose'

const Schema = mongoose.Schema

const MapSchema = new Schema({
  root: {
    type: Schema.Types.ObjectId,
    ref: 'screen'
  }
})

export default mongoose.model('map', MapSchema)
