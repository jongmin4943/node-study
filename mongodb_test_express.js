import Mongodb from "mongodb";
const MongoClient = Mongodb.MongoClient;
import express from "express";
const app = express();
import http from "http";
const router = express.Router();

app.set("port", 3001);

let dbUrl = "mongodb://localhost";
let db = null;

const dbConnection = () => {
  MongoClient.connect(dbUrl, { useUnifiedTopology: true }, (err, client) => {
    if (err) throw err;
    //mongodb v.3.x에서는 db() 를 이용한다.
    db = client.db("vehicle");

    console.log("db connected!", dbUrl);
  });
};

//라우팅설정
router.route("/car/list").get((req, res) => {
  let cars = db.collection("car");
  let carData = null;
  cars.find({}).toArray((err2, result) => {
    if (err2) throw err2;
    res.send(result);
  });

  // cars.findOne({}, (err2, result) => {
  //   if (err2) throw err2;
  //   carData = result;
  //   res.send(carData);
  // });
});
app.use("/", router);

const server = http.createServer(app);
server.listen(app.get("port"), () => {
  console.log(`Server running on http://localhost:${app.get("port")}`);
  dbConnection();
  //서버가 실행 됨과 동시에 db연결한다.
});
