var mongoose = require('mongoose');

// schema
var daycareSchema = mongoose.Schema({
<<<<<<< HEAD
  check:{type:boolean},
=======
  check:{type:Boolean},
>>>>>>> 30c604c21bb3c5c707f9c443d2db2bca71967082
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
<<<<<<< HEAD
  bitch:{type:boolean},
=======
  bitch:{type:Boolean},
>>>>>>> 30c604c21bb3c5c707f9c443d2db2bca71967082
  mine:{type:String},
  msg:{type:String},
  author:{type:mongoose.Schema.Types.ObjectId, ref:'user', required:true},
  createdAt:{type:Date, default:Date.now},
  updatedAt:{type:Date},
});

// model & export
var Daycare = mongoose.model('daycare', daycareSchema);
module.exports = Daycare;
