const middleware = require('../middleware');
const express = require('express'),
  router = express.Router();
const { blogsDisplay } = require('../controllers/blog');

if (process.env.ENVIRONMENT === "dev") {
  var { upload } = require("../config/cloudinary.js");
} else if (process.env.ENVIRONMENT === "prod") {
  var { upload } = require("../config/s3.js");
}

router.get('/blogs', middleware.isLoggedIn, blogsDisplay);

module.exports = router;
