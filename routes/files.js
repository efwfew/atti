var express = require("express");
var multer = require("multer");
var router = express.Router();
var util = require("../util");
var User = require("../models/User");
var fs = require("fs");
var Comment = require("../models/Comment");
// var fd = fs.createReadStream('/ path and file name.name');

//Index
router.get("/", function(req, res) {
  fs.readdir("storages/", "utf8", function(error, filelist) {
    console.log(filelist);
    var sort = ['기타', '녹음/음원', '사진/그림', '문서/글자', '영상/녹화']
    res.render("files/index", { filelist: filelist, sort });
  });
});

//audio
router.get("/audio", function(req, res) {
  fs.readdir("storages/audio", "utf8", function(error, filelist) {
    res.render("files/audio", { filelist: filelist });
  });
});

router.get("/audio/:id", function(req, res) {
    var filename = req.params.id;
    filepath ="./storages/audio/"+filename;
      res.download(filepath);
});

//video
router.get("/video", function(req, res) {
  fs.readdir("storages/video", "utf8", function(error, filelist) {
    res.render("files/video", { filelist: filelist });
  });
});

router.get("/video/:id", function(req, res) {
    var filename = req.params.id;
    filepath ="./storages/video/"+filename;
      res.download(filepath);
});


//image
router.get("/image", function(req, res) {
  fs.readdir("storages/image", "utf8", function(error, filelist) {
    res.render("files/image", { filelist: filelist });
  });
});

router.get("/image/:id", function(req, res) {
    var filename = req.params.id;
    filepath ="./storage/image"+filename;
      res.download(filepath);
});

//text
router.get("/text", function(req, res) {
  fs.readdir("storages/text", "utf8", function(error, filelist) {
    res.render("files/text", { filelist: filelist });
  });
});

router.get("/text/:id", function(req, res) {
    var filename = req.params.id;
    filepath ="./storages/text/"+filename;
      res.download(filepath);
});

//application
router.get("/application", function(req, res) {
  fs.readdir("storages/application", "utf8", function(error, filelist) {
    res.render("files/application", { filelist: filelist });
  });
});

router.get("/application/:id", function(req, res) {
    var filename = req.params.id;
    filepath ="./storages/application/"+filename;
      res.download(filepath);
});


var _storage = multer.diskStorage({
  destination: function(req, file, cb) {
    var path = "storages/" + file.mimetype.split("/")[0] + "/";
    if (!fs.existsSync(path)) {
      fs.mkdir(path, function(err) {
        if (err) {
          console.log("failed to create directory", err);
        }
      });
    }
    cb(null, path);
  },
  filename: function(req, file, cb) {
    var path = "storages/" + file.mimetype.split("/")[0] + "/";
    fs.readdir(path, function(err, files) {
      if (err) {
        console.log(err);
        res.status(500).send("Server error");
      }
      var cnt = 0;
      for (var i = 0; i < files.length; i++) {
        if (files[i].indexOf(req.user.name+req.user.position + " " + file.originalname) == 0) {
          cnt++;
        }
      }
      console.log(req.user)
      if (cnt > 0) {
        cb(null, req.user.name+req.user.position + " " + file.originalname + " - " + cnt);
      } else {
        cb(null, req.user.name+req.user.position + " " + file.originalname);
      }
    });
  }
});

var upload = multer({ storage: _storage });

router.post("/", upload.single("userfile"), function(req, res) {
  res.render("files/done");
});

module.exports = router;
