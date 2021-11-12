const express = require("express");
var cookieSession = require('cookie-session');
// const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const bcrypt = require('bcryptjs');


const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(cookieParser());
app.use(morgan("dev"))
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

}

const getUserByEmail = function (email, database) {
  for (const user in database) {
    if (database[user].email === email) {
      return user; // true
    }
  }
  return false;
}
const urlsForUser = function (id) {
  const userURLs = {};
  if(!id) {
    return null;
  }
  for(let key in urlDatabase) {
    if(urlDatabase[key].userID === id) {
      userURLs[key] = urlDatabase[key];
    } 
  }
  return userURLs
}

//random sting generator
function generateRandomString(length) {
  const elements = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const elementsLength = elements.length;
  let randomString = '';
  for (let i = 0; i < length; i++) {
    randomString += elements.charAt(Math.floor(Math.random() * elementsLength));
  } return randomString;
}

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
  console.log("userID-------------->",userID)
  console.log("users----->",users)
  if(!userID){
    return res.status(401).send("You must <a href='/login'>login</a> first.")
  }
  const userShortUrl = urlsForUser(userID)

  const templateVars = {
    urls: userShortUrl,
    user_id: userID,
    users
  };
  
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    email: getUserByEmail(userID),
    user_id: userID,
    users
  };
  if(!userID) {//redirects if not registered
    return res.redirect("/login");
  }
  
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user_id: userID,
    users
  };
  res.render("urls_show", templateVars);
});

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
  console.log("urlDatabase:",urlDatabase)
  res.redirect(`/urls/${shortURL}`);
});

//redirect the shortURL to orginal longUrl page
app.get("/u/:shortURL", (req, res) => {
  const urlObj = urlDatabase[req.params.shortURL]
  const longURL =  urlObj? urlObj.longURL : null
  console.log(longURL)
  if(!longURL){
    return res.status(404).send("URL not found")
  }
  res.redirect(longURL);
});

//delete a shortURL from userlist
app.post('/urls/:shortURL/delete', (req, res) => {
  const userID = req.session.user_id;
  if(!userID) {
    return res.status(401).send("You must <a href='/login'>login</a> first.")
  }
  const shortURL = req.params.shortURL;
  const usersURL = urlsForUser(userID)
  if(shortURL in usersURL) {
    delete urlDatabase[shortURL];
    res.redirect('/urls'); 
  } else {
  return res.status(404).send("Not Authorized")
  }
});

//Edit/update the url for the shortURL page
app.post("/urls/:shortURL", (req, res) => {
  const userID = req.session.user_id;
  if(!userID) {
    return res.status(401).send("You must <a href='/login'>login</a> first.")
  }
  const longURL = req.body.longURL;
  const shortURL = req.params.shortURL;
  const usersURL = urlsForUser(userID)
  if(shortURL in usersURL) {
    console.log(longURL);
    // const longURL = req.body.longURL;
  urlDatabase[shortURL] = {
    longURL,
    userID: userID
  };
  res.redirect("/urls") 
  }
  
});

app.get("/login", (req, res) => {
  const userID = req.session.user_id;
  if(userID) {
    res.redirect("/urls")
  }
  const templateVars = {
    user_id: userID,
    users
  }
  res.render("urls_login", templateVars)
});

//add cookie when login
app.post("/login", (req, res) => {
  // const userID = req.session.user_id;
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;

  if (!enteredEmail) { //if no email is entered.  // "user@example.com"
    return res.status(403).send("Please enter a valid email");
  } else if (getUserByEmail(enteredEmail, users)) { // if email matches our records, returns "user/key which has the same value as the user.id" 
    const userID = getUserByEmail(enteredEmail, users);
    // console.log("userID@219--->",userID)
    const user = users[userID]
    // console.log("user--->", user)
    if (!bcrypt.compareSync(enteredPassword, user.password)) {
      return res.status(403).send("Invalid Password");
    } else {
      req.session.user_id = userID;
      // console.log("user@225--->",userID)
      res.redirect('/urls');
    }
  } else {
    return res.status(400).send("Email not found")
  }
});

//delete cookie when logout
app.post("/logout", (req, res) => {
  req.session = null;
  // res.clearCookie('user_id', req.cookies["user_id"]);
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  let id = generateRandomString(6);
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;
  const hashPassword = bcrypt.hashSync(enteredPassword,10)

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
    // console.log(users);
    req.session.user_id = user.id;
    // console.log("user@259------>",user.id)
    // console.log("user---->", user)
    res.redirect('/urls');
  }
});

app.get("/register", (req, res) => {
  const userID = req.session.user_id;
  if(userID) {
    res.redirect("/urls")
  }
  const templateVars = { 
    user_id: userID,
    users }
  res.render("urls_register", templateVars)
});


//example of using html code to send to browser
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//Server Listen
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
