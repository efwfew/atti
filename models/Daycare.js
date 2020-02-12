var mongoose = require('mongoose');

// schema
var daycareSchema = mongoose.Schema({
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
  contract:{type:Boolean},
  bitch:{type:Boolean},
  msg:{type:String},
  author:{type:String, },
  createdAt:{type:Date, default:Date.now},
  updatedAt:{type:Date},
});

// model & export
var Daycare = mongoose.model('Daycare', daycareSchema);
module.exports = Daycare;
