var mongoose = require('mongoose');

// schema
var daycareSchema = mongoose.Schema({
  check:{type:Boolean},
  name:{type:String, required:[true,'Name is required!']},
  owner:{type:String, required:[true,'Owner is required!']},
  type:{type:String, required:[true,'type is required!']},
  address:{type:String, required:[true,'address is required!']},
  phone:{type:String, required:[true,'phone is required!']},
  fax:{type:String},
  city:{type:String, required:[true,'city is required!']},
  street:{type:String, required:[true,'street is required!']},
  max:{type:String, required:[true,'max is required!']},
  now:{type:String, required:[true,'now is required!']},
  contract:{type:Boolean},
  bitch:{type:Boolean},
  msg:{type:String},
  author:{type:mongoose.Schema.Types.ObjectId, ref:'user', required:true},
  createdAt:{type:Date, default:Date.now},
  updatedAt:{type:Date},
});

// model & export
var Daycare = mongoose.model('daycare', daycareSchema);
module.exports = Daycare;