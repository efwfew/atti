var express  = require('express');
var router = express.Router();
var Commentr = require('../models/Commentr');
var Report = require('../models/Report');
var util = require('../util');

// create
router.post('/', util.isLoggedin, checkPostId, function(req, res){
  var report = res.locals.report;

  req.body.author = req.user._id;
  req.body.report = report._id;

  Commentr.create(req.body, function(err, commentr){
    if(err){
      req.flash('commentrForm', { _id:null, form:req.body });
      req.flash('commentrError', { _id:null, parentCommentr:req.body.parentCommentr, errors:util.parseError(err) });
    }
    return res.redirect('/reports/'+report._id+res.locals.getPostQueryString());
  });
});

// update
router.put('/:id', util.isLoggedin, checkPermission, checkPostId, function(req, res){
  var report = res.locals.report;

  req.body.updatedAt = Date.now();
  Commentr.findOneAndUpdate({_id:req.params.id}, req.body, {runValidators:true}, function(err, commentr){
    if(err){
      req.flash('commentrForm', { _id:req.params.id, form:req.body });
      req.flash('commentrError', { _id:req.params.id, parentCommentr:req.body.parentCommentr, errors:util.parseError(err) });
    }
    return res.redirect('/reports/'+report._id+res.locals.getPostQueryString());
  });
});

// destroy
router.delete('/:id', util.isLoggedin, checkPermission, checkPostId, function(req, res){
  var report = res.locals.report;

  Commentr.findOne({_id:req.params.id}, function(err, commentr){
    if(err) return res.json(err);

    // save updated comment
    commentr.isDeleted = true;
    commentr.save(function(err, commentr){
      if(err) return res.json(err);

      return res.redirect('/reports/'+report._id+res.locals.getPostQueryString());
    });
  });
});

module.exports = router;

// private functions
function checkPermission(req, res, next){
  Commentr.findOne({_id:req.params.id}, function(err, commentr){
    if(err) return res.json(err);
    if(commentr.author != req.user.id) return util.noPermission(req, res);

    next();
  });
}

function checkPostId(req, res, next){
  Report.findOne({_id:req.query.reportId}, function(err, report){
    if(err) return res.json(err);

    res.locals.report = report;
    next();
  });
}
