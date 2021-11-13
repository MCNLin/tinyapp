const express = require("express");
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const morgan = require("morgan");
const bcrypt = require('bcryptjs');
const {getUserByEmail, urlsForUser, generateRandomString} = require('./helpers');

const app = express();

const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cookieSession({
  name: 'session',
  keys: ["youCanDoIt"]
}));


const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "123"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
  "aJ48lW":{
    id: "aJ48lW",
    email: "user3@example.com",
    password: "123"
  }
};

//updated and hashed passwords for sample users
users["userRandomID"].password = bcrypt.hashSync('123',10);
users["user2RandomID"].password = bcrypt.hashSync('dishwasher-funk',10);
users["aJ48lW"].password = bcrypt.hashSync('123',10);

//=========================== GET ROUTES ========================================

app.get("/", (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    return res.redirect("/urls");
  }
  return res.redirect("/login");
});
  
//JSON URL database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    return res.status(401).send("Please <a href='/login'>login</a> first.");
  }
  const userShortUrl = urlsForUser(userID, urlDatabase);

  const templateVars = {
    urls: userShortUrl,
    user_id: userID,
    users
  };
  
  res.render("urls_index", templateVars);
});

//Login Page
app.get("/login", (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    res.redirect("/urls");
  }
  const templateVars = {
    user_id: userID,
    users
  };
  res.render("urls_login", templateVars);
});

//Registration Page
app.get("/register", (req, res) => {
  const userID = req.session.user_id;

  if (userID) {
    res.redirect("/urls"); //if user is logged in, show their urls page
  }
  const templateVars = {//else creates a new account
    user_id: userID,
    users };
  res.render("urls_register", templateVars);
});

//goes to create tinyurl page
app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    email: getUserByEmail(userID),
    user_id: userID,
    users
  };
  if (!userID) {//redirects if not registered
    return res.redirect("/login");
  }
  
  res.render("urls_new", templateVars);
});

//shows users saved urls as well as check if user has access to the urls
app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session.user_id;
  const shortURL = req.params.shortURL;
  const urlObject = urlDatabase[shortURL];
  
  if (!urlObject) {
    return res.send("Unauthorized Access");
  }
  if (urlObject.userID !== userID) {
    return res.send("Unauthorized Access");
  }
  if (urlObject.userID === userID) {
    const templateVars = {
      shortURL,
      longURL: urlObject.longURL,
      users,
      user_id: userID
    };
    res.render("urls_show", templateVars);
  }
});

//redirect the shortURL to orginal longUrl page
app.get("/u/:shortURL", (req, res) => {
  const urlObj = urlDatabase[req.params.shortURL];
  const longURL =  urlObj ? urlObj.longURL : null;
  if (!longURL) {
    return res.status(404).send("URL not found");
  }
  res.redirect(longURL);
});


//=================== POST ROUTES ==============================

/*recieves a POST request to /urls, and responds with redirection
to /urls/:shortURL, where shortURL is the random string generated*/
app.post("/urls", (req, res) => {
  const userID = req.session.user_id;
  const longURL = req.body.longURL;
  const shortURL = generateRandomString(6);
  urlDatabase[shortURL] = {
    longURL,
    userID: userID
  };
  res.redirect(`/urls/${shortURL}`);
});

//when client logs in, checks the database to ensure UN&PW match, then get access to page
app.post("/login", (req, res) => {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;

  if (!enteredEmail) {
    return res.status(403).send("Please enter a valid email");
  } else if (getUserByEmail(enteredEmail, users)) { //
    const userID = getUserByEmail(enteredEmail, users);
    const user = users[userID];
    if (!bcrypt.compareSync(enteredPassword, user.password)) {
      return res.status(403).send("Invalid Password");
    } else {
      req.session.user_id = userID;
      res.redirect('/urls');
    }
  } else {
    return res.status(400).send("Email not found");
  }
});

//checks to see if email/password exist in database, if not create a new account
app.post("/register", (req, res) => {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;
  const hashPassword = bcrypt.hashSync(enteredPassword,10);

  if (!enteredEmail || !enteredPassword) {
    res.status(400).send("400: Account already exists");
  } else if (getUserByEmail(enteredEmail, users)) {
    res.status(400).send("400: Account already exists");
  } else {
    const user = {
      id: generateRandomString(6),
      email: req.body.email,
      password: hashPassword
    };
    users[user.id] = user;
    req.session.user_id = user.id;
    res.redirect('/urls');
  }
});

//Check to see if url is in user urldatabase, can edit
app.post("/urls/:shortURL", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    return res.status(401).send("You must <a href='/login'>login</a> first.");
  }
  const longURL = req.body.longURL;
  const shortURL = req.params.shortURL;
  const usersURL = urlsForUser(userID, urlDatabase);
  if (shortURL in usersURL) {
    urlDatabase[shortURL] = {
      longURL,
      userID: userID
    };
    res.redirect("/urls");
  }
});

//delete a shortURL from own userlist
app.post('/urls/:shortURL/delete', (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    return res.status(401).send("You must <a href='/login'>login</a> first.");
  }
  const shortURL = req.params.shortURL;
  const usersURL = urlsForUser(userID, urlDatabase);
  if (shortURL in usersURL) {
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  } else {
    return res.status(404).send("Not Authorized");
  }
});

//delete cookie when logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});


//Server Listen
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});