import Mongodb from "mongodb";
const MongoClient = Mongodb.MongoClient;

let dbUrl = "mongodb://localhost";
let db = null;
MongoClient.connect(dbUrl, { useUnifiedTopology: true }, (err, client) => {
  if (err) throw err;
  //mongodb v.3.x에서는 db() 를 이용한다.
  db = client.db("vehicle");
  //db.collection()객체를 이용해서 컬렉션 선택
  let cars = db.collection("car");
  cars.findOne({}, (err2, result) => {
    if (err2) throw err2;
    console.log(result["name"], result["company"]);
    client.close();
  });
});
