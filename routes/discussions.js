const express   = require('express'),
  router        = express.Router({mergeParams: true}),
  middleware    = require('../middleware'),
  {discussionsNew, discussionsPagination, discussionsVote} = require('../controllers/discussions');

if(process.env.ENVIRONMENT === 'dev'){
  var {upload} = require('../config/cloudinary.js');
} else if (process.env.ENVIRONMENT === 'prod'){
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