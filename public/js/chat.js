const socket = io();

const formRef = document.querySelector('#msg-form');
const locBtn = document.querySelector('#send-loc');
const msgBtn = document.querySelector('#msg-btn');
const messages = document.querySelector('#messages');
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;
const sidebar = document.querySelector('#sidebar');

// options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});

// autoscroll function
const autoScroll = () => {
  const newMessage = messages.lastElementChild;

  // height of message
  const newMessageStyle = getComputedStyle(newMessage);
  const newMessageMargin = parseInt(newMessageStyle.marginBottom);
  const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

  // visible height
  const visbleHeight = messages.offsetHeight;

  // height of messages container
  const containerHeight = messages.scrollHeight;

  // how far have I scrolled
  const scrollOffset = messages.scrollTop + visbleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight;
  }
};

socket.on('message', ({ username, text, createdAt }) => {
  const html = Mustache.render(messageTemplate, {
    username,
    message: text,
    createdAt: moment(createdAt).format('h:mm a')
  });
  messages.insertAdjacentHTML('beforeend', html);
  autoScroll();
});

formRef.addEventListener('submit', e => {
  e.preventDefault();

  msgBtn.setAttribute('disabled', 'disabled');

  const val = formRef['msg'].value;

  socket.emit('sendMessage', val, error => {
    msgBtn.removeAttribute('disabled');
    formRef.reset();
    formRef['msg'].focus();
    if (error) {
      console.log(error);
    }
  });
});

socket.on('locationMessage', ({ username, locUrl, createdAt }) => {
  const html = Mustache.render(locationTemplate, {
    username,
    locUrl,
    createdAt: moment(createdAt).format('h:mm a')
  });
  messages.insertAdjacentHTML('beforeend', html);
  autoScroll();
});

locBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser');
  }

  locBtn.setAttribute('disabled', 'disabled');

  navigator.geolocation.getCurrentPosition(location => {
    const { longitude, latitude } = location.coords;
    socket.emit('sendLocation', { longitude, latitude }, msg => {
      locBtn.removeAttribute('disabled');
    });
  });
});

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, { room, users });
  sidebar.innerHTML = html;
});

socket.emit('join', { username, room }, error => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});
