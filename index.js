const express = require("express"); // To build an application server or API
const app = express();
const { Pool } = require('pg');
const pgp = require("pg-promise")(); // To connect to the Postgres DB from the node server
const bodyParser = require("body-parser");
const session = require("express-session"); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require("bcrypt"); //  To hash passwords
const axios = require("axios"); // To make HTTP requests from our server. We'll learn more about it in Part B.
app.use(express.static("src"));
// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

// database configuration
const dbConfig = {
  host: "db", // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
db.connect()
  .then((obj) => {
    console.log("Database connection successful"); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch((error) => {
    console.log("ERROR:", error.message || error);
  });

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

app.set("view engine", "ejs"); // set the view engine to EJS
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// API ROUTES HERE


async function loadProfile(arg) {
    const fquery = `
    SELECT *
    FROM friends
    RIGHT JOIN users
    ON friends.useridB = users.user_id
    WHERE userIDA = $1`;
    const friendInfo = await db.query(fquery, [arg.user_id]);
    const userInfo = arg;
      return {
        uList: userInfo,
        fList: friendInfo
      };
  }

app.get("/", (req, res) => {
    res.render("pages/home");
  });

  app.get("/login", (req, res) => {
    if (req.session.user == undefined) {
      res.render("pages/login");
    } else {
      res.render("pages/profile", {
        data: req.session.user,
        message: "Already logged in",
      });
    }
  });

  app.post("/login", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    try {
      const user = await db.oneOrNone("SELECT * FROM users WHERE username = $1", [
        req.body.username,
      ]);
  
      if (!user) {
        res.render("pages/login", { message: "User not found", error: "danger" });
      }
  
      const match = await bcrypt.compare(password, user.password);
      console.log(password);
      console.log(user.password);
      console.log(match);
      if (match == false) {
        console.log("Incorrect password");
        res.render("pages/login", {
          message: "Incorrect password",
          error: "danger",
        });
      } else {
        req.session.user = user;
        req.session.save();
        res.render("pages/profile", {
          data: await loadProfile(req.session.user),
          message: "Successfully logged in",
        });
      }
    } catch (error) {
      console.error("Error: " + error);
    }
  });

  app.get("/register", (req, res) => {
    res.render("pages/register");
  });

  app.post("/register", async (req, res) => {
    try {
      //hash the password using bcrypt library
      const hash = await bcrypt.hash(req.body.password, 10);
        console.log(req.body.username);
      const user_exists = await db.oneOrNone(
        "SELECT * FROM users WHERE username = $1",
        [req.body.username]
      );
  
    if (user_exists) {
        res.render("pages/register", {
          message: "Username already exists. Enter alternate username",
          error: "danger",
        });
      } else {
        const query =
          "INSERT INTO users (full_name, username, password) VALUES ($1, $2, $3)";
        await db.query(query, [
          req.body.full_name,
          req.body.username,
          hash,
        ]);
        res.render("pages/login", {
          data: req.session.user,
          message: "Successfully registered",
        });
      }
    } catch (error) {
      console.error("Error while registering user: " + error);
      res
        .status(500)
        .json({ error: "An error occurred while registering the user." });
    }
  });




  app.get("/profile", async (req, res) => {
    console.log(req.session.user);
    if (req.session.user == undefined) {
      res.render("pages/login", {
        message: "Log in to view profile",
        error: "danger",
      });
    } else {
      try {
        res.render("pages/profile", {
          data: await loadProfile(req.session.user),
        });
      } catch (error) {
        console.error("Error in /profile route:", error);
        res.status(500).send("Internal Server Error");
      }
    }
  });



//start server
app.listen(3000);
console.log('Server is listening on port 3000');