var _storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // 파일 타입에 따른 경로 지정 ex) .jpg - uploads/image, .txt - uploads/text
    var path = "uploads/" + file.mimetype.split("/")[0] + "/";
    // 파일 경로 존재 확인
    if (!fs.existsSync(path)) {
      // 없으면 폴더 생성
      fs.mkdir(path, function(err) {
        if (err) {
          console.log("failed to create directory", err);
        }
      });
    }
    cb(null, path);
  },
  filename: function(req, file, cb) {
    var path = "uploads/" + file.mimetype.split("/")[0] + "/";
    // 파일이 저장경로 있는지 확인
    fs.readdir(path, function(err, files) {
      if (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
      }
      var cnt = 0;
      for (var i = 0; i < files.length; i++) {
        // 저장 경로의 파일 탐색 후 있으면 같은 이름의 파일이 몇개인지 cnt
        if (files[i].indexOf(file.originalname) == 0) {
          cnt++;
        }
      }
      // 여러 개의 파일이 존재 시 마지막 파일의 카운트 보다 큰 넘버를 추가하고 파일 이름 저장
      if (cnt > 0) {
        cb(null, file.originalname + " - " + cnt);
        // 아니면 그냥 저장
      } else {
        cb(null, file.originalname);
      }
    });
  }
});
