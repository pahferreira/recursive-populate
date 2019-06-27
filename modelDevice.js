import mongoose from 'mongoose'

const Schema = mongoose.Schema

const DeviceSchema = new Schema({
  title: String,
  description: String,
  map: {
    type: Schema.Types.ObjectId,
    ref: 'screen'
  }
})

const autoPopulated = function(next) {
  this.populate('map')
  next()
}

DeviceSchema.pre('find', autoPopulated).pre('findOne', autoPopulated)

export default mongoose.model('device', DeviceSchema)
