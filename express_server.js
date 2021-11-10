const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//random sting generator
function generateRandomString() {
  const elements = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const elementsLength = elements.length;
  let randomString = '';
  for (let i = 0; i < 6; i++) {
    randomString += elements.charAt(Math.floor(Math.random() * elementsLength));
  } return randomString;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});
//JSON URL database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const username = req.cookies["username"];
  const templateVars = {
    urls: urlDatabase,
    username : username };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const username = req.cookies["username"];
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: username
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req,res) =>{
  const username = req.cookies["username"];
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: username
  };
  res.render("urls_show", templateVars);
});

/*recieves a POST request to /urls, and responds with redirection
to /urls/:shortURL, where shortURL is the random string generated*/
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

//redirect the shortURL to orginal longUrl page
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

//delete a shortURL from userlist
app.post('/urls/:shortURL/delete', (req, res) =>{
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

//Edit/update the url for the shortURL page
app.post("/urls/:shortURL", (req,res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect('/urls');
});

//add cookie when login
app.post("/login", (req, res) => {
  const username = req.body.username;
  res.cookie("username", username);
  res.redirect("/urls");
});

//delete cookie when logout
app.post("/logout", (req, res) => {
  const username = req.body.username;
  res.clearCookie('username', username);
  res.redirect("/urls");
});

//example of using html code to send to browser
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//Server Listen
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


