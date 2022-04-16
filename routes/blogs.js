const middleware = require('../middleware');
const express = require('express'),
  router = express.Router();
const { 
  blogsLoadPage,
  blogsCreatePage,
  blogsCreate,
  blogsDelete,
  blogsSave,
  blogsSavedPage,
  blogsHeart,
  blogsUserPage,
  blogsPublishPage,
  blogsApprove,
  blogsRemove,
} = require('../controllers/blog');

if (process.env.ENVIRONMENT === "dev") {
  var { upload } = require("../config/cloudinary.js");
} else if (process.env.ENVIRONMENT === "prod") {
  var { upload } = require("../config/s3.js");
}

router.get('/colleges/:collegeName/blogs', middleware.isLoggedIn, blogsLoadPage);
router.get('/colleges/:collegeName/blogs/new', middleware.isLoggedIn, blogsCreatePage);
router.post('/colleges/:collegeName/blogs/new', upload.single("image"), middleware.isLoggedIn, blogsCreate);
router.get('/colleges/:collegeName/blogs/publish', middleware.isLoggedIn, blogsPublishPage);
router.put('/colleges/:collegeName/blogs/publish/approve', middleware.isLoggedIn, blogsApprove);
router.put('/colleges/:collegeName/blogs/publish/remove', middleware.isLoggedIn, blogsRemove);
router.get('/colleges/:collegeName/blogs/saved', middleware.isLoggedIn, blogsSavedPage);
router.get('/colleges/:collegeName/blogs/user/:userId', middleware.isLoggedIn, blogsUserPage);
router.put('/colleges/:collegeName/blogs/:bucket/:blog/save', middleware.isLoggedIn, blogsSave);
router.put('/colleges/:collegeName/blogs/:bucket/:blog/heart', middleware.isLoggedIn, blogsHeart);
router.delete('/colleges/:collegeName/blogs/:bucket/:blog', middleware.isLoggedIn, blogsDelete);



module.exports = router;
