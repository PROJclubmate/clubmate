const fetch = require('node-fetch');
fetch("https://jam.systems/_/pantry/api/v1/rooms/test4", {
  method: "POST",
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({moderators: [], speakers: []})
}).then(res => {
  console.log(res.status);
  res.text().then(text => console.log(text));
});
