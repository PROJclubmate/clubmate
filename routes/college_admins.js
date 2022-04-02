const express = require('express'),
  router      = express.Router(),
  middleware  = require('../middleware');

const {
  showAdminConsole
} = require('../controllers/college_admins');

if (process.env.ENVIRONMENT === "dev") {
  var { upload } = require("../config/cloudinary.js");
} else if (process.env.ENVIRONMENT === "prod") {
  var { upload } = require("../config/s3.js");
}


// Show index page for the college level admin
router.get('/colleges/:college_name/admin/console', middleware.isCollegeLevelAdmin, showAdminConsole);

module.exports = router;

