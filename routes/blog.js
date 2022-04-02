const middleware = require('../middleware');
const express = require('express'),
  router = express.Router();
const { 
  blogsPageLoad,
  blogsCreatePage,
  blogsCreate,
  blogsDelete,
  blogsSave,
  blogsUnsave,
  blogsSavedLoadMore,
  blogsHeart,
  blogsUserLoadMore,
  blogsDisplayPublishPage,
  blogsApprove,
  blogsRemove,
} = require('../controllers/blog');

if (process.env.ENVIRONMENT === "dev") {
  var { upload } = require("../config/cloudinary.js");
} else if (process.env.ENVIRONMENT === "prod") {
  var { upload } = require("../config/s3.js");
}

router.get('/blogs', middleware.isLoggedIn, blogsPageLoad);
router.get('/blogs/new', middleware.isLoggedIn, blogsCreatePage);
router.post('/blogs/new', middleware.isLoggedIn, blogsCreate);
router.get('/blogs/publish', middleware.isLoggedIn, blogsDisplayPublishPage);
router.put('/blogs/publish/approve', middleware.isLoggedIn, blogsApprove);
router.put('/blogs/publish/remove', middleware.isLoggedIn, blogsRemove);
router.get('/blogs/saved', middleware.isLoggedIn, blogsSavedLoadMore);
router.get('/blogs/user/:userId', middleware.isLoggedIn, blogsUserLoadMore);
router.delete('/blogs/:bucket/:blog', middleware.isLoggedIn, blogsDelete);
router.put('/blogs/:bucket/:blog/save', middleware.isLoggedIn, blogsSave);
router.put('/blogs/:bucket/:blog/unsave', middleware.isLoggedIn, blogsUnsave);
router.put('/blogs/:bucket/:blog/heart', middleware.isLoggedIn, blogsHeart);



module.exports = router;
