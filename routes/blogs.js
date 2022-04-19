const express = require('express'),
  router      = express.Router(),
  middleware  = require('../middleware');

const { 
  blogsLoadPage,
  blogsCreateBlogPage,
  blogsCreateNewsPage,
  blogsCreate,
  blogsDelete,
  blogsSave,
  blogsSavedPage,
  blogsHeart,
  blogsUserPage,
  blogsPublishPage,
  blogsApprove,
  blogsRemove,
} = require('../controllers/blogs');

if (process.env.ENVIRONMENT === "dev") {
  var { upload } = require("../config/cloudinary.js");
} else if (process.env.ENVIRONMENT === "prod") {
  var { upload } = require("../config/s3.js");
}

// INITIAL PAGE RENDER + AJAX
router.get('/colleges/:college_name/blogs', middleware.isInCollege, blogsLoadPage);

router.get('/colleges/:college_name/blogs/add', middleware.isInCollege, blogsCreateBlogPage);

router.get('/colleges/:college_name/news/add', middleware.isCollegeLevelAdmin, blogsCreateNewsPage);

router.post('/colleges/:college_name/blogs/new', upload.single("image"), middleware.isInCollege, blogsCreate);

router.get('/colleges/:college_name/blogs/publish', middleware.isCollegeLevelAdmin, blogsPublishPage);

router.put('/colleges/:college_name/blogs/publish/approve', middleware.isCollegeLevelAdmin, blogsApprove);

router.put('/colleges/:college_name/blogs/publish/remove', middleware.isCollegeLevelAdmin, blogsRemove);

// INITIAL PAGE RENDER + AJAX
router.get('/colleges/:college_name/blogs/saved', middleware.isInCollege, blogsSavedPage);

// INITIAL PAGE RENDER + AJAX
router.get('/colleges/:college_name/blogs/user/:user_id', middleware.isInCollege, blogsUserPage);

// AJAX
router.put('/colleges/:college_name/blogs/:bucket_id/:blog_id/save', middleware.isInCollege, blogsSave);

// AJAX
router.put('/colleges/:college_name/blogs/:bucket_id/:blog_id/heart', middleware.isInCollege, blogsHeart);

router.delete('/colleges/:college_name/blogs/:bucket_id/:blog_id', middleware.isInCollege, blogsDelete);



module.exports = router;
