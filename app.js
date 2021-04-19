import express from "express";
import http from "http";
const app = express();
const router = express.Router();
import path from "path";
const __dirname = path.resolve();
import expressErrorHandler from "express-error-handler";
import cookieParser from "cookie-parser";
import expressSession from "express-session";
import cors from "cors";
import fs from "fs";
import multer from "multer";
import Mongodb from "mongodb";
const MongoClient = Mongodb.MongoClient;
app.set("port", 3001);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(cors()); // 크로스 도메인 문제 해결
app.use("/", express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
//세션을 사용하기 위해서는 쿠키가 반드시 필요하다
app.use(cookieParser());
app.use(
  expressSession({
    secret: "my key",
    resave: true,
    saveUninitialized: true,
  })
);

//multer 미들웨어 사용 : 미들웨어 사용 순서
//body-parser -> multer -> router
//router 설정 위에 multer 설정이 있어야한다.
let storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "uploads");
  },
  filename: function (req, file, callback) {
    callback(null, Date.now() + "_" + file.originalname);
  },
});

//multer 객체 생성(파일제한)
let upload = multer({
  storage: storage,
  limits: {
    files: 10,
    fieldSize: 1024 * 1024 * 1024, //1gb
  },
});

let dbUrl = "mongodb://localhost";
let db = null;

const dbConnection = () => {
  MongoClient.connect(dbUrl, { useUnifiedTopology: true }, (err, client) => {
    if (err) throw err;
    //mongodb v.3.x에서는 db() 를 이용한다.
    db = client.db("account");

    console.log("db connected!", dbUrl);
  });
};

///////////////////////////////router 설정
app.use("/", router);
const errorHandler = expressErrorHandler({
  static: { 404: "./public/404.html" },
});
app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);

const users = [
  {
    id: "BTS",
    password: 1234,
  },
];

const authUser = (database, id, password, callback) => {
  console.log("authUser 호출됨.");

  let users = database.collection("users");
  users.find({ id: id, password: password }).toArray((err, docs) => {
    if (err) {
      callback(err, null);
      return;
    }
    if (docs.length > 0) {
      console.log(`아이디 ${id} 비밀번호 ${password}`);
      callback(null, docs);
    } else {
      console.log(`일치하는 사용자가 없다`);
      callback(null, null);
    }
  });
};

router.route("/photo").post(upload.array("photo", 1), (req, res) => {
  //함수 body가 없어도 파일 업로드가 된다.
  console.log("/photo 호출 됨");

  res.send("업로드 완료");
});

router.route("/product").get((req, res) => {
  console.log("/product 호출");

  if (!req.session.user) {
    console.log(req.session.user);
    res.redirect("/login.html");
  } else {
    req.app.render("product", {}, (err, html) => {
      res.end(html);
    });
  }
});
router.route("/home").get((req, res) => {
  console.log("/home 호출");
  req.app.render("home", {}, (err, html) => {
    res.end(html);
  });
});
router.route("/login").get((req, res) => {
  console.log("/login 호출");
  res.redirect("/login.html");
});
router.route("/fileUpload").get((req, res) => {
  console.log("/fileUpload 호출");
  res.redirect("/photo.html");
});

router.route("/process/login").post((req, res) => {
  console.log("/process/login 요청");

  if (req.session.user) {
    console.log("이미 로그인 되어있습니다.");
    res.redirect("/product");
  } else {
    if (db) {
      const id = req.body.id;
      const password = req.body.password;
      authUser(db, id, password, (err, docs) => {
        if (err) throw err;
        if (docs) {
          req.session.user = {
            id: id,
            name: docs["name"],
            authorized: true,
          };
          console.log("로그인 완료");
          res.redirect("/product");
        } else {
          console.log("로그인 실패");
          res.redirect("/login");
        }
      });
    } else {
      console.log("db연결 실패");
      res.redirect("/login");
    }
  }
});

router.route("/process/logout").get((req, res) => {
  console.log("/process/logout 요청");
  if (req.session.user) {
    req.session.destroy((err) => {
      if (err) throw err;
      console.log("로그아웃 완료");
    });
  }
  res.redirect("/login.html");
});

router.route("/process/setUserCookie").get((req, res) => {
  console.log("사용자 쿠키 설정하기");
  //쿠키는 클라이언트에 저장된다.(res로 보낸다)
  res.cookie("user", {
    id: "BTS",
    name: "방탄소년단",
    authorized: true,
  });
  res.redirect("/process/showCookie");
});
router.route("/process/showCookie").get((req, res) => {
  console.log("설정 된 쿠키 확인하기");
  //클라이언트의 쿠키 정보를 서버에서 확인(req로 확인)
  res.send(req.cookies);
});

const server = http.createServer(app);
server.listen(app.get("port"), () => {
  console.log("start server - http://localhost:", app.get("port"));
  dbConnection();
});
