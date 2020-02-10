var express  = require('express');
var router = express.Router();
var Daycare = require('../models/Daycare');
var User = require('../models/User');
var Comment = require('../models/Comment');
var util = require('../util');

// Home
router.get('/', function(req, res){
  res.render('contact/index');
});

// Index
// router.get('/', async function(req, res){
//   var page = Math.max(1, parseInt(req.query.page));
//   var limit = Math.max(1, parseInt(req.query.limit));
//   page = !isNaN(page)?page:1;
//   limit = !isNaN(limit)?limit:10;

//   var skip = (page-1)*limit;
//   var maxPage = 0;
//   var searchQuery = await createSearchQuery(req.query);
//   var daycares = [];

//   if(searchQuery) {
//     var count = await Daycare.countDocuments(searchQuery);
//     maxPage = Math.ceil(count/limit);
//     daycares = await Daycare.find(searchQuery)
//       .populate('name')
//       .sort('-createdAt')
//       .skip(skip)
//       .limit(limit)
//       .exec();
//   }

//   res.render('daycares/index', {
//     daycares:daycares,
//     currentPage:page,
//     maxPage:maxPage,
//     limit:limit,
//     searchType:req.query.searchType,
//     searchText:req.query.searchText
//   });
// });

// New
router.get('/new', util.isLoggedin, function(req, res){
  var daycare = req.flash('daycare')[0] || {};
  var errors = req.flash('errors')[0] || {};
  res.render('daycare/new', { daycare:daycare, errors:errors });
});

// create
// router.post('/', util.isLoggedin, function(req, res){
//   req.body.author = req.user._id;
//   Daycare.create(req.body, function(err, daycare){
//     if(err){
//       req.flash('daycare', req.body);
//       req.flash('errors', util.parseError(err));
//       return res.redirect('/daycares/new'+res.locals.getPostQueryString());
//     }
//     res.redirect('/daycares'+res.locals.getPostQueryString(false, { page:1, searchText:'' }));
//   });
// });

// show
router.get('/:id', function(req, res){
  var commentForm = req.flash('commentForm')[0] || { _id: null, form: {} };
  var commentError = req.flash('commentError')[0] || { _id:null, parentComment: null, errors:{} };

  Promise.all([
      Daycare.findOne({_id:req.params.id}).populate({ path: 'author', select: 'username' }),
      Comment.find({daycare:req.params.id}).sort('createdAt').populate({ path: 'author', select: 'username' })
    ])
    .then(([daycare, comments]) => {
      var commentTrees = util.convertToTrees(comments, '_id','parentComment','childComments');
      res.render('daycares/show', { daycare:daycare, commentTrees:commentTrees, commentForm:commentForm, commentError:commentError});
    })
    .catch((err) => {
      return res.json(err);
    });
});

// edit
router.get('/:id/edit', util.isLoggedin, checkPermission, function(req, res){
  var daycare = req.flash('daycare')[0];
  var errors = req.flash('errors')[0] || {};
  if(!daycare){
    Daycare.findOne({_id:req.params.id}, function(err, daycare){
        if(err) return res.json(err);
        res.render('daycares/edit', { daycare:daycare, errors:errors });
      });
  }
  else {
    daycare._id = req.params.id;
    res.render('daycares/edit', { daycare:daycare, errors:errors });
  }
});

// update
router.put('/:id', util.isLoggedin, checkPermission, function(req, res){
  req.body.updatedAt = Date.now();
  Daycare.findOneAndUpdate({_id:req.params.id}, req.body, {runValidators:true}, function(err, daycare){
    if(err){
      req.flash('daycare', req.body);
      req.flash('errors', util.parseError(err));
      return res.redirect('/daycares/'+req.params.id+'/edit'+res.locals.getPostQueryString());
    }
    res.redirect('/daycares/'+req.params.id+res.locals.getPostQueryString());
  });
});

// destroy
router.delete('/:id', util.isLoggedin, checkPermission, function(req, res){
  Daycare.deleteOne({_id:req.params.id}, function(err){
    if(err) return res.json(err);
    res.redirect('/daycares'+res.locals.getPostQueryString());
  });
});

module.exports = router;

// private functions
function checkPermission(req, res, next){
  Daycare.findOne({_id:req.params.id}, function(err, daycare){
    if(err) return res.json(err);
    if(daycare.author != req.user.id) return util.noPermission(req, res);

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
