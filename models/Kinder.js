var mongoose = require('mongoose');

// schema
var kinderSchema = mongoose.Schema({
  check:{type:Boolean},
  name:{type:String, required:[true,'Title is required!']},
  owner:{type:String, required:[true,'Body is required!']},
  type:{type:String, required:[true,'Body is required!']},
  address:{type:String, required:[true,'Body is required!']},
  phone:{type:String, required:[true,'Body is required!']},
  fax:{type:String},
  city:{type:String, required:[true,'Body is required!']},
  street:{type:String, required:[true,'Body is required!']},
  max:{type:String, required:[true,'Body is required!']},
  now:{type:String, required:[true,'Body is required!']},
  contract:{type:String},
  bitch:{type:Boolean},
  mine:{type:String},
  msg:{type:String},
  author:{type:mongoose.Schema.Types.ObjectId, ref:'user', required:true},
  createdAt:{type:Date, default:Date.now},
  updatedAt:{type:Date},
});

// model & export
var Kinder = mongoose.model('kinder', kinderSchema);
module.exports = Kinder;
