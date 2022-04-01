const middleware = require('../middleware');
const express = require('express'),
  router = express.Router();
const { 
  blogsPageLoad,
  blogsLoadMore,
  blogsCreate,
  blogsDelete,
  blogsSave,
  blogsUnsave,
  blogsSavedLoadMore,
  blogsHeart,
  blogsUserLoadMore,
  blogsUnapprovedList,
  blogsApprove,
  blogsDisapprove, 
} = require('../controllers/blog');

if (process.env.ENVIRONMENT === "dev") {
  var { upload } = require("../config/cloudinary.js");
} else if (process.env.ENVIRONMENT === "prod") {
  var { upload } = require("../config/s3.js");
}

router.get('/blogs', middleware.isLoggedIn, blogsLoadMore);
router.post('/blogs/create', middleware.isLoggedIn, blogsCreate);
router.delete('/blogs/:bucket/:blog', middleware.isLoggedIn, blogsDelete);
router.put('/blogs/:bucket/:blog/save', middleware.isLoggedIn, blogsSave);
router.put('/blogs/:bucket/:blog/unsave', middleware.isLoggedIn, blogsUnsave);
router.get('/blogs/saved', middleware.isLoggedIn, blogsSavedLoadMore);
router.put('/blogs/:bucket/:blog/heart', middleware.isLoggedIn, blogsHeart);
router.get('/blogs/:userId', middleware.isLoggedIn, blogsUserLoadMore);
router.put('/blogs/:bucket/:blog/approve', middleware.isLoggedIn, blogsApprove);
router.put('/blogs/:bucket/:blog/disapprove', middleware.isLoggedIn, blogsDisapprove);
router.get('/blogs/publish', middleware.isLoggedIn, blogsUnapprovedList);

module.exports = router;
