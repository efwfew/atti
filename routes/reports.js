var express  = require('express');
var router = express.Router();
var Report = require('../models/Report');
var User = require('../models/User');
var Commentr = require('../models/Commentr');
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
  var reports = [];

  if(searchQuery) {
    var count = await Report.countDocuments(searchQuery);
    maxPage = Math.ceil(count/limit);
    reports = await Report.aggregate([
      { $match: searchQuery },
      { $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'author'
      }},
      { $unwind: '$author'},
      { $sort: {createdAt: -1}},
      { $skip: skip},
      { $limit: limit},
      { $lookup: {
        from: 'commentsr',
        localField: '_id',
        foreignField: 'report',
        as: 'commentsr'
      }},
      { $project: {
        title: 1,
        author: {name: 1,postion: 1},
        createdAt: 1,
        commentrCount: { $size: '$commentsr'}
      }},
    ]).exec();
  }

  res.render('reports/index', {
    reports:reports,
    currentPage:page,
    maxPage:maxPage,
    limit:limit,
    searchType:req.query.searchType,
    searchText:req.query.searchText
  });
});

// New
router.get('/new', util.isLoggedin, function(req, res){
  var report = req.flash('report')[0] || {};
  var errors = req.flash('errors')[0] || {};
  res.render('reports/new', { report:report, errors:errors });
});

// create
router.post('/', util.isLoggedin, function(req, res){
  req.body.author = req.user._id;
  Report.create(req.body, function(err, report){
    if(err){
      req.flash('report', req.body);
      req.flash('errors', util.parseError(err));
      return res.redirect('/reports/new'+res.locals.getPostQueryString());
    }
    res.redirect('/reports'+res.locals.getPostQueryString(false, { page:1, searchText:'' }));
  });
});

// show
router.get('/:id', function(req, res){
  var commentrForm = req.flash('commentrForm')[0] || { _id: null, form: {} };
  var commentrError = req.flash('commentrError')[0] || { _id:null, parentCommentr: null, errors:{} };

  Promise.all([
    Report.findOne({_id:req.params.id}).populate({ path: 'author', select: 'name' }),
      Commentr.find({report:req.params.id}).sort('createdAt').populate({ path: 'author', select: 'name' })
    ])
    .then(([report, commentsr]) => {
      var commentrTrees = util.convertToTrees(commentsr, '_id','parentCommentr','childCommentsr');
      res.render('reports/show', { report:report, commentrTrees:commentrTrees, commentrForm:commentrForm, commentrError:commentrError});
    })
    .catch((err) => {
      return res.json(err);
    });
});

// edit
router.get('/:id/edit', util.isLoggedin, checkPermission, function(req, res){
  var report = req.flash('report')[0];
  var errors = req.flash('errors')[0] || {};
  if(!report){
    Report.findOne({_id:req.params.id}, function(err, report){
        if(err) return res.json(err);
        res.render('reports/edit', { report:report, errors:errors });
      });
  }
  else {
    report._id = req.params.id;
    res.render('reports/edit', { report:report, errors:errors });
  }
});

// update
router.put('/:id', util.isLoggedin, checkPermission, function(req, res){
  req.body.updatedAt = Date.now();
  Report.findOneAndUpdate({_id:req.params.id}, req.body, {runValidators:true}, function(err, report){
    if(err){
      req.flash('report', req.body);
      req.flash('errors', util.parseError(err));
      return res.redirect('/reports/'+req.params.id+'/edit'+res.locals.getPostQueryString());
    }
    res.redirect('/reports/'+req.params.id+res.locals.getPostQueryString());
  });
});

// destroy
router.delete('/:id', util.isLoggedin, checkPermission, function(req, res){
  Report.deleteOne({_id:req.params.id}, function(err){
    if(err) return res.json(err);
    res.redirect('/reports'+res.locals.getPostQueryString());
  });
});

module.exports = router;

// private functions
function checkPermission(req, res, next){
  Report.findOne({_id:req.params.id}, function(err, report){
    if(err) return res.json(err);
    if(report.author != req.user.id) return util.noPermission(req, res);

    next();
  });
}

async function createSearchQuery(queries){
  var searchQuery = {};
  if(queries.searchType && queries.searchText && queries.searchText.length >= 3){
    var searchTypes = queries.searchType.toLowerCase().split(',');
    var postQueries = [];
    if(searchTypes.indexOf('title')>=0){
      postQueries.push({ title: { $regex: new RegExp(queries.searchText, 'i') } });
    }
    if(searchTypes.indexOf('body')>=0){
      postQueries.push({ body: { $regex: new RegExp(queries.searchText, 'i') } });
    }
    if(searchTypes.indexOf('author!')>=0){
      var user = await User.findOne({ username: queries.searchText }).exec();
      if(user) postQueries.push({author:user._id});
    }
    else if(searchTypes.indexOf('author')>=0){
      var users = await User.find({ username: { $regex: new RegExp(queries.searchText, 'i') } }).exec();
      var userIds = [];
      for(var user of users){
        userIds.push(user._id);
      }
      if(userIds.length>0) postQueries.push({author:{$in:userIds}});
    }
    if(postQueries.length>0) searchQuery = {$or:postQueries};
    else searchQuery = null;
  }
  return searchQuery;
}
