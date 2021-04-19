import mongojs from "mongojs";
let db = mongojs("vehicle", ["car"]);
db.car.find((err, data) => {
  console.log(data);
});
