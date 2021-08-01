const express   = require('express'),
  router        = express.Router(),
  middleware    = require('../middleware'),
  {storiesNew} = require('../controllers/stories');

if(process.env.ENVIRONMENT === 'dev'){
  var {upload} = require('../config/cloudinary.js');
} else if (process.env.ENVIRONMENT === 'prod'){
  var {upload} = require('../config/s3.js');
}

// Get create story page
router.get('/clubs/:club_id/story/new', middleware.isLoggedIn, storiesNew);

module.exports = router;