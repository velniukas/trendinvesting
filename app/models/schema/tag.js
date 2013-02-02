var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var TagSchema = module.exports = new Schema({
  _id: { type: ObjectId },
  title: { type: String, index: true, trim: true, required: true },
  desc: { type: String, trim: true },
  status: { type: String, default: 'draft', enum: ['draft', 'published'], required: true },
  folio: { type: ObjectId, ref: 'Folio', required: true }
}, {
  collection: 'tags'
});