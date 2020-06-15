var mongoose = require('mongoose');

// schema
var commentrSchema = mongoose.Schema({
  report:{type:mongoose.Schema.Types.ObjectId, ref:'report', required:true},
  author:{type:mongoose.Schema.Types.ObjectId, ref:'user', required:true},
  parentCommentr:{type:mongoose.Schema.Types.ObjectId, ref:'commentr'},
  text:{type:String, required:[true,'text is required!']},
  isDeleted:{type:Boolean},
  createdAt:{type:Date, default:Date.now},
  updatedAt:{type:Date},
},{
  toObject:{virtuals:true}
});

commentrSchema.virtual('childCommentsr')
  .get(function(){ return this._childCommentsr; })
  .set(function(value){ this._childCommentsr=value; });

// model & export
var Commentr = mongoose.model('commentr',commentrSchema);
module.exports = Commentr;
