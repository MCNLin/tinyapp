
//==================== Helper Functions ================================//

//function to check if email is in the database
const getUserByEmail = function(email, database) {
  for (const user in database) {
    if (database[user].email === email) {
      return user; // true
    }
  }
  return undefined;
};

//function to check if it's user's url 
const urlsForUser = function(id, urlDatabase) {
  const userURLs = {};
  if (!id) {
    return null;
  }
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      userURLs[key] = urlDatabase[key];
    }
  }
  return userURLs;
};

//random sting generator
const generateRandomString = function(length) {
  const elements = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const elementsLength = elements.length;
  let randomString = '';
  for (let i = 0; i < length; i++) {
    randomString += elements.charAt(Math.floor(Math.random() * elementsLength));
  } return randomString;
};

module.exports = {getUserByEmail, urlsForUser, generateRandomString};
