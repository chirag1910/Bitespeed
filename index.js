const express = require("express");
const sequelize = require("./db");
const controller = require("./controller");
const validator = require("./validator");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "Hello, World!" });
});

app.post("/identify", validator.validateIdentify, controller.identify);

const port = process.env.PORT || 3000;
sequelize
    .sync({ force: false })
    .then(() => {
        console.log("Database synced!");

        app.listen(port, () => {
            console.log(`Listening at http://localhost:${port}`);
        });
    })
    .catch((err) => {
        console.error("Error syncing database:", err);
    });
