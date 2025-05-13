const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const app = express();
app.use(cors());

const PORT = process.env.PORT || 5000;

connectDB();

app.use(express.json({ extended: false }));

app.get("/", (req, res) => {
  res.send("Hello Developer...!");
});

app.use("/api/users", require("./routes/api/users"));
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/profile", require("./routes/api/profile"));
app.use("/api/posts", require("./routes/api/posts"));

app.listen(PORT, () => {
  console.log(`Listening on the ${PORT}`);
});
