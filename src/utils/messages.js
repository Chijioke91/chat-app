const generateMessage = (username, text) => {
  return {
    username,
    text,
    createdAt: new Date().getTime()
  };
};

const generateLocationMessage = (username, locUrl) => {
  return {
    username,
    locUrl,
    createdAt: new Date().getTime()
  };
};

module.exports = {
  generateMessage,
  generateLocationMessage
};
