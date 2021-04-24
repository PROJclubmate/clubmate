# clubmate

This project uses Node.js with [Express.js](https://expressjs.com/) as for server backend.
For frontend it uses `ejs` template language which is similar to html.
It uses local mongodb server to store the data, so make sure you have mongodb started.

## How to start the server
1. Installing node dependencies. In the root folder of this project run
```
npm install
```

2. Adding the `.env` file in the root folder.
3. Mongodb setup - To run this app, you need to setup a mongodb local server first with default port. No special configurations.
Load the mongodb dump (provided by the project administrator) to your mongodb server. You can refer [this link](https://stackoverflow.com/questions/6770498/how-to-import-bson-file-format-on-mongodb) for help how to. You can also use mongodb compass.

4. After mongodb server has started, then to run the server
```
npm start
```

The server will get started on _localhost:8080_
