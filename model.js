import mongoose from 'mongoose'

const Schema = mongoose.Schema

const ScreenSchema = new Schema({
  title: String,
  description: String,
  children: [
    {
      type: Schema.Types.ObjectId,
      ref: 'screen'
    }
  ],
  parent: {
    type: Schema.Types.ObjectId,
    ref: 'screen'
  }
})

const autoPopulated = function(next) {
  this.populate('children')
  next()
}

ScreenSchema.pre('find', autoPopulated).pre('findOne', autoPopulated)

export default mongoose.model('screen', ScreenSchema)
