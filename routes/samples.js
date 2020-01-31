var express  = require('express');
var router = express.Router();
var Sample = require('../models/Sample');
var User = require('../models/User');
var Comment = require('../models/Comment');
var util = require('../util');

// Index
router.get('/', async function(req, res){
  var page = Math.max(1, parseInt(req.query.page));
  var limit = Math.max(1, parseInt(req.query.limit));
  page = !isNaN(page)?page:1;
  limit = !isNaN(limit)?limit:10;

  var skip = (page-1)*limit;
  var maxPage = 0;
  var searchQuery = await createSearchQuery(req.query);
  var samples = [];

  if(searchQuery) {
    var count = await Sample.countDocuments(searchQuery);
    maxPage = Math.ceil(count/limit);
    samples = await Sample.find(searchQuery)
      .populate('author')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .exec();
  }

  res.render('samples/index', {
    samples:samples,
    currentPage:page,
    maxPage:maxPage,
    limit:limit,
    searchType:req.query.searchType,
    searchText:req.query.searchText
  });
});

// New
router.get('/new', util.isLoggedin, function(req, res){
  var sample = req.flash('sample')[0] || {};
  var errors = req.flash('errors')[0] || {};
  res.render('samples/new', { sample:sample, errors:errors });
});

// create
router.post('/', util.isLoggedin, function(req, res){
  req.body.author = req.user._id;
  Sample.create(req.body, function(err, sample){
    if(err){
      req.flash('sample', req.body);
      req.flash('errors', util.parseError(err));
      return res.redirect('/samples/new'+res.locals.getPostQueryString());
    }
    res.redirect('/samples'+res.locals.getPostQueryString(false, { page:1, searchText:'' }));
  });
});

// show
router.get('/:id', function(req, res){
  var commentForm = req.flash('commentForm')[0] || { _id: null, form: {} };
  var commentError = req.flash('commentError')[0] || { _id:null, parentComment: null, errors:{} };

  Promise.all([
      Sample.findOne({_id:req.params.id}).populate({ path: 'author', select: 'username' }),
      Comment.find({sample:req.params.id}).sort('createdAt').populate({ path: 'author', select: 'username' })
    ])
    .then(([sample, comments]) => {
      var commentTrees = util.convertToTrees(comments, '_id','parentComment','childComments');
      res.render('samples/show', { sample:sample, commentTrees:commentTrees, commentForm:commentForm, commentError:commentError});
    })
    .catch((err) => {
      return res.json(err);
    });
});

// edit
router.get('/:id/edit', util.isLoggedin, checkPermission, function(req, res){
  var sample = req.flash('sample')[0];
  var errors = req.flash('errors')[0] || {};
  if(!sample){
    Sample.findOne({_id:req.params.id}, function(err, sample){
        if(err) return res.json(err);
        res.render('samples/edit', { sample:sample, errors:errors });
      });
  }
  else {
    sample._id = req.params.id;
    res.render('samples/edit', { sample:sample, errors:errors });
  }
});

// update
router.put('/:id', util.isLoggedin, checkPermission, function(req, res){
  req.body.updatedAt = Date.now();
  Sample.findOneAndUpdate({_id:req.params.id}, req.body, {runValidators:true}, function(err, sample){
    if(err){
      req.flash('sample', req.body);
      req.flash('errors', util.parseError(err));
      return res.redirect('/samples/'+req.params.id+'/edit'+res.locals.getPostQueryString());
    }
    res.redirect('/samples/'+req.params.id+res.locals.getPostQueryString());
  });
});

// destroy
router.delete('/:id', util.isLoggedin, checkPermission, function(req, res){
  Sample.deleteOne({_id:req.params.id}, function(err){
    if(err) return res.json(err);
    res.redirect('/samples'+res.locals.getPostQueryString());
  });
});

module.exports = router;

// private functions
function checkPermission(req, res, next){
  Sample.findOne({_id:req.params.id}, function(err, sample){
    if(err) return res.json(err);
    if(sample.author != req.user.id) return util.noPermission(req, res);

    next();
  });
}

async function createSearchQuery(queries){
  var searchQuery = {};
  if(queries.searchType && queries.searchText && queries.searchText.length >= 3){
    var searchTypes = queries.searchType.toLowerCase().split(',');
    var sampleQueries = [];
    if(searchTypes.indexOf('title')>=0){
      sampleQueries.push({ title: { $regex: new RegExp(queries.searchText, 'i') } });
    }
    if(searchTypes.indexOf('body')>=0){
      sampleQueries.push({ body: { $regex: new RegExp(queries.searchText, 'i') } });
    }
    if(searchTypes.indexOf('author!')>=0){
      var user = await User.findOne({ username: queries.searchText }).exec();
      if(user) sampleQueries.push({author:user._id});
    }
    else if(searchTypes.indexOf('author')>=0){
      var users = await User.find({ username: { $regex: new RegExp(queries.searchText, 'i') } }).exec();
      var userIds = [];
      for(var user of users){
        userIds.push(user._id);
      }
      if(userIds.length>0) sampleQueries.push({author:{$in:userIds}});
    }
    if(sampleQueries.length>0) searchQuery = {$or:sampleQueries};
    else searchQuery = null;
  }
  return searchQuery;
}
