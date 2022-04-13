/*
//create a connection with the socket.io server by calling io() provided by the socket client-side library loaded in the index.html file
const socket = io();

const btn = document.getElementById("increment");

//3. receive the countUpdated event emitted from the server. When it is receieved, the callback func of socket.on is executed. This func has access to the data(if there is any) emitted with the event from the server
socket.on("countUpdated", receivedUpdatedCount => {
  console.log("The count has been updated!", receivedUpdatedCount);
});

btn.addEventListener("click", () => {
  console.log("Clicked");

  //1. emit an increment event with no data from the client to be received in the server
  socket.emit("increment");
});
*/

const socket = io();

//HTML ELEMENTS
const messageForm = document.querySelector(".message-form");
const messageInput = document.querySelector(".message-input");
const messageFormBtn = document.querySelector(".message-btn");
const sendLocationBtn = document.querySelector("#send-location");
const $messages = document.getElementById("messages");
const sidebar = document.getElementById("sidebar");

//HTML TEMPLATES
const messageTemplate = document.getElementById(
  "msg-template-script"
).innerHTML;
const locationMessageTemplate = document.getElementById(
  "loc-template-script"
).innerHTML;
const sidebarTemplate = document.getElementById(
  "sidebar-template-script"
).innerHTML;

//OPTIONS: to parse the query/search section of the URL into its individual key/value. The query is gotten when the action attribute in index.html form executes
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoScroll = () => {
  //get new msg element
  const $newMsg = $messages.lastElementChild;

  //get the height of the new msg element
  const newMsgStyles = getComputedStyle($newMsg);
  const newMsgMargin = parseInt(newMsgStyles.marginBottom, 10);
  const newMsgHeight = $newMsg.offsetHeight + newMsgMargin;

  //get the visible height of the $messages container
  const visibleHeight = $messages.offsetHeight;

  //get the total height we're able to scroll for the messages container
  const containerHeight = $messages.scrollHeight;

  //get how far i have scrolled (how close to the bottom of the $message container i.e distance from top to the bottom of scroll bar)
  //scrollTop is the distance from the top of $messages container to the the top of the scroll bar
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMsgHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.on("message", message => {
  //mus.render provides messageTemplate html markup with the {{message}} variable needed and returns a markup with dynamic message values
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });

  $messages.insertAdjacentHTML("beforeend", html);

  autoScroll();
});

socket.on("locationMessage", locationDetails => {
  const html = Mustache.render(locationMessageTemplate, {
    username: locationDetails.username,
    url: locationDetails.url,
    createdAt: moment(locationDetails.createdAt).format("h:mm a"),
  });

  $messages.insertAdjacentHTML("beforeend", html);

  autoScroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });

  sidebar.innerHTML = html;
});

messageForm.addEventListener("submit", event => {
  event.preventDefault();

  messageFormBtn.setAttribute("disabled", "disabled");

  socket.emit("sendMessage", messageInput.value, error => {
    messageFormBtn.removeAttribute("disabled");
    messageInput.value = "";
    messageInput.focus();

    if (error) {
      return console.log(error);
    }
    console.log("Message delivered!");
  });
});

sendLocationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser.");
  }

  navigator.geolocation.getCurrentPosition(position => {
    sendLocationBtn.disabled = true;

    const locationData = {
      long: position.coords.longitude,
      lat: position.coords.latitude,
    };

    socket.emit("sendLocation", locationData, () => {
      sendLocationBtn.disabled = false;
      console.log("Location shared!");
    });
  });
});

socket.emit("join", { username, room }, error => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
