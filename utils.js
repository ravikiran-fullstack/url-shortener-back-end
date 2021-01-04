const base64 = require('base-64');

function generateURLId() {
  const urlIdLength = 5;
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < urlIdLength; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function generateUrlIdUsingBtoa(){
  const timestamp = new Date().getTime().toString();
  // console.log(timestamp);
  const id = base64.encode(timestamp);
  console.log(timestamp, id);
  return id;
}

module.exports = generateURLId;