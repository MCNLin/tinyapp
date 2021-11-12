

const getUserByEmail = function (email, database) {
  for (const user in database) {
    if (database[user].email === email) {
      return user; // true
    }
  }
  return undefined;
};


module.exports = {getUserByEmail}