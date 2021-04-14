const express   = require('express'),
  router        = express.Router({mergeParams: true}),
  middleware    = require('../middleware'),
  {environment} = require('../config/env_switch.js'),
  {discussionsNew, discussionsPagination, discussionsVote} = require('../controllers/discussions');

if(environment === 'dev'){
  var {upload} = require('../config/cloudinary.js');
} else if (environment === 'prod'){
  var {upload} = require('../config/s3.js');
}


//	================================	/posts/:post_id/discussions  ====================================

// Create a new subPost in discussion
router.post('/clubs/:club_id/posts/:post_id/discussions', middleware.isLoggedIn, upload.array('images', 10), 
discussionsNew);

// Navigate pages(AJAX)
router.get('/clubs/:club_id/posts/:post_id/m-sP', middleware.isLoggedIn, discussionsPagination);

// Vote subPosts(AJAX)
router.put('/subposts/:bucket_id/:subpost_id/vote', middleware.isLoggedIn, discussionsVote);

module.exports = router;