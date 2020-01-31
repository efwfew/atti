var express = require('express');
var multer = require('multer');
var router = express.Router();
var util = require("../util");
var User = require("../models/user");
var fs = require ('fs');
var crypto = require('crypto');
var hash = crypto.createHash('md5');
var Fileinfo = require('../models/fileinfo');
var Wallet = require("../models/wallet")
var async = require('async')
// var fd = fs.createReadStream('/ path and file name.name');

//Infura HttpProvider Endpoint
var Web3 = new web3(new web3.providers.HttpProvider("https://ropsten.infura.io/v3/66f5bc220371494cb3465fca20893eb4"));

router.get("/", util.isLoggedin, function (req, res) {
    Wallet.find({})
        .populate("owner")
        .sort("-createdAt")
        .exec(function (err, wallet) {
            if (err) return res.json(err);
            res.render("wallet/index", { wallet: wallet });
        });
});

router.get("/:username", util.isLoggedin, function(req, res){
    req.body.owner = req.user._id;
    User.findOne({ _id: req.user._id }, function (err, user) {
        if (err) {
            return res.json(err);
        } else {
        fs.readdir(`uploads/${req.user.username}`, 'utf8' , function (error, filelist) {
            console.log(filelist)
            var length = filelist.length
            Wallet.findOne(req.body)
                .populate("owner")
                .exec(function (err, wallet) {
                    console.log(user);
                    res.render("files/uploads", {user:user, filelist, length, wallet:wallet});
                });
            })
        }
    });
});


var _storage = multer.diskStorage({
    destination : function (req, file, cb) {
        cb(null, `uploads/${req.user.username}`)
    },
        filename : function(req, file, cb) {
        cb(null, new Date() + ' ' + file.originalname)
    }
});
var upload = multer({storage:_storage})

router.post('/:username', util.isLoggedin, upload.single('userfile'), function(req, res){
    // req.body.owner = req.user._id;
    User.findOne({ _id: req.user._id }, function (err, user) {
        if(err) return res.json(err);
        let filename = req.file.filename;
        let originalname = req.file.originalname;
        let filetype = req.file.mimetype;
        const myAccount = "0xdee5F53B29FDB3996fb546026fDdf49adc6D4a89"
        let pKey = req.body.privateKey;
        // console.log(req.session.passport.user)
        const dbValue = req.session.passport.user;
        const data = {
            'owner': dbValue
        }

        Wallet.findOne(data)
            .populate("owner")
            .exec(async function (err, wallet) {
                if (err) return res.json(err);
                console.log(wallet);
                let input = fs.createReadStream(`${req.file.path}`);
                input.on('readable', async function() {
                    var data = input.read();
                    if (data) {
                        hash.update(data);
                    } else {
                        let fileHash = hash.digest('hex')
                        // console.log(`${hash.digest('hex')}`);
                        await Web3.eth.accounts.signTransaction({
                            to: myAccount,
                            value: 100000,
                            gas: 210000,
                            data: '0x'+ fileHash
                        }, wallet.privateKey, async function (err, result) {
                            if (err) {
                                console.error(err);
                                return;
                            }
                            console.log(`rawTransaction ${result.rawTransaction}`);
                            await Web3.eth.sendSignedTransaction(result.rawTransaction, function (err, result3) {
                                if (err) {
                                    console.error(err);
                                    return;
                                } else {
                                    let result4 = result3;
                                    let fileinfo = new Fileinfo({
                                        uploader: user._id,
                                        uploadername: user.username,
                                        originalname: req.file.originalname,
                                        filename: req.file.filename,
                                        filehash: fileHash,
                                        Txhash: result3,
                                        // fileTx: false
                                    });
                                    fileinfo.save(function (err, fileinfo) {
                                        if (err){
                                            req.flash("fileinfo", req.body);
                                            req.flash("errors", util.parseError(err));
                                            return console.error(err);
                                        }
                                        res.render("files/redirect", {
                                            user,
                                            filename,
                                            originalname,
                                            filetype,
                                            result4,
                                            fileHash
                                        })
                                    })
                                }
                        })
                    })
                }
            })
        })
    })
})

router.get("/:username/fileinfo", function(req, res){
    var page = Math.max(1,req.query.page)>1?parseInt(req.query.page):1;
    var limit = Math.max(1,req.query.limit)>1?parseInt(req.query.limit):20;
    var search = createSearch(req.query);
    let user = req.user.username;
    async.waterfall([function(callback) {
        Fileinfo.count(search.findPost, function(err, count) {
            if(err) callback;
            var skip = (page-1)*limit;
            var maxPage = Math.ceil(count/limit);
            callback(null, skip, maxPage);
            });
    }, function(skip, maxPage, callback) {
        Fileinfo.find(search.findPost)
        .populate("uploader")
        .sort("-createdAt")
        .skip(skip)
        .limit(limit)            // 1
        .exec(function(err, fileinfoes){    // 1
            if(err) return res.json(err);
            res.render("files/index", {
                fileinfoes:fileinfoes, page:page, maxPage:maxPage,
                user, urlQuery:req._parsedUrl.query, search:search
            });
        });
    }], function(err){
        if (err) return res.json({success:false, message:err});
    })
})

var _storage1 = multer.diskStorage({
    destination : function (req, file, cb) {
        cb(null, `uploads/${req.user.username}`)
    },
        filename : function(req, file, cb) {
        cb(null, file.originalname)
    }
});
var upload1 = multer({storage:_storage1})

router.post('/:username/fileinfo', util.isLoggedin, upload1.single('verify'), function(req, res){
    let filename = req.file.filename;
    var page = Math.max(1,req.query.page)>1?parseInt(req.query.page):1;
    var limit = Math.max(1,req.query.limit)>1?parseInt(req.query.limit):20;
    var search = createSearch(req.query);
    let user = req.user.username;
    async.waterfall([function(callback) {
        Fileinfo.count(search.findPost, function(err, count) {
            if(err) callback;
            var skip = (page-1)*limit;
            var maxPage = Math.ceil(count/limit);
            callback(null, skip, maxPage);
            });
    }, function(skip, maxPage, callback) {
        Fileinfo.find(search.findPost)
        .populate("uploader")
        .sort("-createdAt")
        .skip(skip)
        .limit(limit)            // 1
        .exec(function(err, fileinfoes){
            let input = fs.createReadStream(`${req.file.path}`);
                input.on('readable', async function() {
                    var data = input.read();
                    if (data) {
                        hash.update(data);
                    } else {
                        let fileHash = hash.digest('hex')
                        fs.unlink(`${req.file.path}`, (err) => {
                            if (err) {
                                console.error(err)
                                return
                            }
                            if(err) return res.json(err);
                            res.redirect(`?searchType=filehash&searchText=${fileHash}`)
                        })
                    }});
                })
            }], function(err){
                if (err) return res.json({success:false, message:err});
    })
})




router.get("/fileinfo/:id", function(req, res){
    Fileinfo.findOne({_id:req.params.id})
    .populate("uploader")
    .exec(async function(err, fileinfo){
        if(err) return res.json(err);
        await Web3.eth.getTransaction(fileinfo.Txhash, function(err, result){
            let result2 = result.input;
            res.render("files/show", {fileinfo:fileinfo, 
                urlQuery:req._parsedUrl.query, result2,});
        })
    });
});

module.exports = router;

function createSearch(queries){
    var findPost = {};
    if(queries.searchType && queries.searchText && queries.searchText.length >= 3){
      var searchTypes = queries.searchType.toLowerCase().split(",");
      var postQueries = [];
      if(searchTypes.indexOf("uploadername")>=0){
        postQueries.push({ uploadername : { $regex : new RegExp(queries.searchText, "i") } });
      }
      if(searchTypes.indexOf("originalname")>=0){
        postQueries.push({ originalname : { $regex : new RegExp(queries.searchText, "i") } });
      }
      if(searchTypes.indexOf("filehash")>=0){
        postQueries.push({ filehash : { $regex : new RegExp(queries.searchText, "i") } });
      }
      if(postQueries.length > 0) findPost = {$or:postQueries};
    }
    return { searchType:queries.searchType, searchText:queries.searchText,
      findPost:findPost};
  }