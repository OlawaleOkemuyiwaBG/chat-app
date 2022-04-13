//helper functions to track users i.e. what users is in what room with what username

const users = [];

//addUser to track a new user
const addUser = ({ id, username, room }) => {
  //clear the data
  username = username.trim().toLowerCase();
  room = room.trim().toLowerCase();

  //validate the incoming data
  if (!username || !room) {
    return {
      error: "Username and room are required",
    };
  }

  //make sure the name is unique by checking for an exisiting user in the room
  const exisitingUser = users.find(
    user => user.room === room && user.username === username
  );
  if (exisitingUser) {
    return {
      error: "Username is already in used. Choose another",
    };
  }

  //store the new user
  const newUser = { id, username, room };
  users.push(newUser);
  return { newUser };
};

//removeUser to stop tracking a user when a user leaves
const removeAUser = id => {
  const userIndex = users.findIndex(user => user.id === id);

  if (userIndex !== -1) {
    return users.splice(userIndex, 1)[0];
  }
};

//getUser to fetch existing user details
const getUser = id => users.find(user => user.id === id);

//getUsersInRoom to fetch all users in a room in order to display in sidebar
const getUsersInRoom = room => {
  room = room.trim().toLowerCase();
  return users.filter(user => user.room === room);
};

module.exports = {
  addUser,
  removeAUser,
  getUser,
  getUsersInRoom,
};
