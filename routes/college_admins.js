const express = require('express'),
  router      = express.Router(),
  middleware  = require('../middleware');

const {
  collegeShowAdminConsole,
  collegeUpdateImage,
  collegeUpdateKeys
} = require('../controllers/college_admins');

if (process.env.ENVIRONMENT === "dev") {
  var { upload } = require("../config/cloudinary.js");
} else if (process.env.ENVIRONMENT === "prod") {
  var { upload } = require("../config/s3.js");
}


// Show index page for the college level admin
router.get('/colleges/:college_name/admin/console', middleware.isCollegeLevelAdmin, collegeShowAdminConsole);

// Update college cover image
router.put('/colleges/:college_name/admin/image', middleware.isCollegeLevelAdmin, upload.single('coverImg'), collegeUpdateImage);

// Update college page values from console
router.put('/colleges/:college_name/admin/keys', middleware.isCollegeLevelAdmin, collegeUpdateKeys);

module.exports = router;

