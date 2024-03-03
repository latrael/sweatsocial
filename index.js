const express = require("express"); // To build an application server or API
const app = express();
const { Pool } = require('pg');
const pgp = require("pg-promise")(); // To connect to the Postgres DB from the node server
const bodyParser = require("body-parser");
const session = require("express-session"); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require("bcrypt"); //  To hash passwords
const axios = require("axios"); // To make HTTP requests from our server. We'll learn more about it in Part B.
const request = require('request');
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

app.get("/logout", function (req, res) {
    req.session.user = null;
    console.log(req.session);
    res.render("pages/login", { message: "Successfully logged out", userlog: req.session.user});
  });


app.get("/addexercise", (req, res) => {
    res.render("pages/addexercise", {data: null, userlog: req.session.user});
  });

app.get("/myexercises", async (req, res) => {
  if(req.session.user == undefined){
    res.render("pages/login", {message: "Log in to view exercises", error: "danger", userlog: req.session.user
  });
} else {
  const query = "SELECT * FROM users_to_exercises WHERE user_id = $1";
    try {
        const exercises = await db.any(query, [req.session.user.user_id]);
        res.render("pages/myexercises", {data: exercises, userlog: req.session.user});
    } catch(error) {
        console.error("Error: " + error);
    }
}
    
    
});

app.post("/add_exercise_to_user", async (req, res) => {
  
  const user1 = req.session.user.user_id;
  var name1 = req.body.name
  var exercise1 = req.body.type;
  var muscle1 = req.body.muscle;
  var equipment1 = req.body.equipment;
  var difficulty1 = req.body.difficulty;
  var instructions1 = req.body.instructions;
  console.log(name1 + "This is the name of the exercise");
  try{
    const query = "INSERT INTO users_to_exercises(user_id, exercise_name, exercise_type, muscle_group, equipment ,difficulty, instructions) VALUES ($1, $2, $3 , $4 , $5 , $6 , $7) RETURNING *";
    await db.one(query, [user1, name1,exercise1,muscle1,equipment1,difficulty1,instructions1]);
    res.redirect("/myexercises");
  }
  catch (error) {
    console.error("Error: " + error);

  }
});

app.post("/addexercise", async (req, res) => {
    var muscle = req.body.muscle;
    var exercise = req.body.exercise_type;
    var difficulty = req.body.difficulty;
    request.get({
        url: 'https://api.api-ninjas.com/v1/exercises?muscle=' + muscle + '&type=' + exercise + '&difficulty=' + difficulty,
        headers: {
            'X-Api-Key': process.env.API_KEY
        },
    },function(error, response, body) {
        if(error) return console.error('Request failed:', error);
        else if(response.statusCode != 200) return console.error('Error:', response.statusCode, body.toString('utf8'));
        res.render("pages/addexercise", { data: JSON.parse(body), userlog: req.session.user});
});

});

const pool = new Pool({
    host: "db", // the database server
    port: 5432, // the database port
    database: process.env.POSTGRES_DB, // the database name
    user: process.env.POSTGRES_USER, // the user account to connect with
    password: process.env.POSTGRES_PASSWORD, // the password of the user account
  });


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
    res.render("pages/home", {userlog: req.session.user});
  });

  app.get("/login", (req, res) => {
    if (req.session.user == undefined) {
      res.render("pages/login", {userlog: req.session.user});
    } else {
      res.render("pages/profile", {
        data: req.session.user,
        message: "Already logged in",
        error: "danger", userlog: req.session.user
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
        res.render("pages/login", { message: "User not found", error: "danger", userlog: req.session.user});
      }
  
      const match = await bcrypt.compare(password, user.password);
      console.log(password);
      console.log(user.password);
      console.log(match);
      if (match == false) {
        console.log("Incorrect password");
        res.render("pages/login", {
          message: "Incorrect password",
          error: "danger", userlog: req.session.user
        });
      } else {
        req.session.user = user;
        req.session.save();
        res.render("pages/profile", {
          data: await loadProfile(req.session.user),
          message: "Successfully logged in", userlog: req.session.user
        });
      }
    } catch (error) {
      console.error("Error: " + error);
    }
  });

  app.get("/register", (req, res) => {
    res.render("pages/register", {userlog: req.session.user});
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
          error: "danger", userlog: req.session.user
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
          message: "Successfully registered", userlog: req.session.user
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
        error: "danger", userlog: req.session.user
      });
    } else {
      try {
        res.render("pages/profile", {
          data: await loadProfile(req.session.user), userlog: req.session.user
        });
      } catch (error) {
        console.error("Error in /profile route:", error);
        res.status(500).send("Internal Server Error");
      }
    }
  });





  app.get("/friends", async (req, res) => {
    if(req.session.user == undefined){
      res.render("pages/login",{message: "Log in to view friends", error: "danger", userlog: req.session.user});
    }
    else{
      try{
         const allUsers = await db.any("SELECT * FROM users WHERE user_id != $1", [
          req.session.user.user_id,
         ]);
        const friends = await db.any("SELECT * FROM friends JOIN users ON friends.userIDB = users.user_id WHERE friends.userIDA = $1", [
         req.session.user.user_id, 
        ]);
        var all_users = [];
        var hold = 0;
        for(i = 0; i < allUsers.length; i++){
          var add = true;
          for(j=0; j < friends.length; j++){
            if(friends[j].useridb == allUsers[i].user_id){
              add = false;
            }
          }
          if(add == true){
            all_users[hold] = allUsers[i];
            hold = hold + 1;
          }
        }
        if(!friends){
          res.render("pages/friends", {
            user: "empty",
            friend: "no friends",
            empty: " ",
            allUsers: all_users, userlog: req.session.user
          });
        }
        var status = 'friends';
        const friends_check = await db.any("SELECT * FROM friends JOIN users ON friends.userIDB = users.user_id WHERE friends.userIDA = $1 AND friends.status = $2", [
          req.session.user.user_id, status,
         ]);
          res.render("pages/friends", {
            user: "empty",
            friend: friends,
            empty: " ",
            allUsers: all_users, userlog: req.session.user
          });
      }
      catch (error) {
        console.error("Error: " + error);
      }
    }
  }); 

  app.get("/friendProfile/:friendID", async (req, res) => {
    try {
      const profile = req.params.friendID;
      const p = "SELECT * FROM users WHERE user_id = $1";
      const { rows } = await pool.query(p, [profile]);
      const w = "SELECT * FROM users_to_exercises WHERE user_id = $1";
      const workouts = await db.any(w, [profile]);
      console.log(rows[0]);
      console.log(workouts);
      res.render("pages/friendProfile", {
        data: await loadProfile(rows[0]),
        workouts: workouts, userlog: req.session.user
      });
    } catch (error) {
      console.error("Error in /profile route:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  app.post("/add_friend",async (req, res) =>{
    const user1 = req.session.user.user_id;
    try{
      const query = "INSERT INTO friends (userIDA, userIDB, status) VALUES ($1, $2, $3) returning *";
      await db.one(query, [user1, req.body.userADD, 'sent']);
      const query2 = "INSERT INTO friends (userIDA, userIDB, status) VALUES ($1, $2, $3) returning *";
      await db.one(query2, [req.body.userADD,user1, 'pending']);
      res.redirect("/friends");
    }
    catch (error) {
      console.error("Error: " + error);
    }
  });


  app.post("/accept_friend",async (req, res) =>{
    const user1 = req.session.user.user_id;
    try{
      const query = "UPDATE friends SET status = 'friends' WHERE userIDA = $1 AND userIDB = $2 returning *";
      await db.one(query, [user1, req.body.user_id]);
      const query2 = "UPDATE friends SET status = 'friends' WHERE userIDA = $1 AND userIDB = $2 returning *";
      await db.one(query2, [req.body.user_id,user1]);
      res.redirect("/friends");
    }
    catch (error) {
      console.error("Error: " + error);
    }
  });
  
  app.post("/remove_friend",async (req, res) =>{
    try{
      const query = "DELETE FROM friends WHERE userIDB = $1 AND userIDA =$2 returning *";
      await db.one(query, [req.body.user_id,req.session.user.user_id]);
      const query2 = "DELETE FROM friends WHERE userIDA = $1 AND userIDB =$2 returning *";
      await db.one(query2, [req.body.user_id,req.session.user.user_id]);
      res.redirect("/friends");
    }
    catch (error) {
      console.error("Error: " + error);
    }
  });


  app.post("/user_search", async (req, res) =>{
    try{
        const allUsers = await db.any("SELECT * FROM users WHERE user_id != $1", [
          req.session.user.user_id,
         ]);
        const friends = await db.any("SELECT * FROM friends JOIN users ON friends.userIDB = users.user_id WHERE friends.userIDA = $1", [
         req.session.user.user_id, 
        ]);
        var all_users = [];
        var hold = 0;
        for(i = 0; i < allUsers.length; i++){
          var add = true;
          for(j=0; j < friends.length; j++){
            if(friends[j].useridb == allUsers[i].user_id){
              add = false;
            }
          }
          if(add == true){
            all_users[hold] = allUsers[i];
            hold = hold + 1;
          }
        }
  
        var status = 'friends';
        const friends_check = await db.any("SELECT * FROM friends JOIN users ON friends.userIDB = users.user_id WHERE friends.userIDA = $1 AND friends.status = $2", [
          req.session.user.user_id, status,
         ]);
  
        
      const users = await db.oneOrNone("SELECT * FROM users WHERE username = $1", [
        req.body.user,
      ]);
      if(!users || req.body.user == req.session.user.username){
        res.render("pages/friends", {
          user: "NOT_FOUND",
          friend: friends,
          empty: " ",
          allUsers: all_users, userlog: req.session.user
        });
      }
      else{
        if(users.username == req.body.user){
          var friend = "false";
          for(i = 0; i < friends.length; i++){
            if(users.username == friends[i].username){
              if(friends[i].status == "friends"){
                friend = "true";
              }
              else if(friends[i].status == "pending"){
                friend = "pending";
              }
              else{
                friend = "sent";
              }
            }
          }
          res.render("pages/friends", {
            user: users,
            friend: friends,
            empty: friend,
            allUsers: all_users,userlog: req.session.user
          });
        }
        else{
          res.render("pages/friends", {
            user: "empty",
            friend: friends,
            empty: " ",
            allUsers: all_users, userlog: req.session.user
          });
        }
      }
    }
    catch (error) {
      console.error("Error: " + error);
    }
   });

   app.post("/test",async (req, res) =>{
    res.redirect("/friends")
});


//start server
app.listen(3000);
console.log('Server is listening on port 3000');