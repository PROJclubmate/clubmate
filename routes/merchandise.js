const express = require('express'),
  router      = express.Router(),
  middleware  = require('../middleware');

const {
  displayNewlyArrivedMerchandise,
  displayAllMerchandise,
  addNewMerchandise,
  displayParticularMerchandiseType,
  displayParticularMerchandiseSubtype,
  uploadNewMerchandise,
  displayMerchandise,
  updateMerchandise,
  deleteMerchandise
} = require('../controllers/merchandise');

if (process.env.ENVIRONMENT === "dev") {
  var { upload } = require("../config/cloudinary.js");
} else if (process.env.ENVIRONMENT === "prod") {
  var { upload } = require("../config/s3.js");
}


// Show index page for the newly arrived merchandise
router.get('/merchandise', middleware.isLoggedIn, displayNewlyArrivedMerchandise);

// Show index page for all the merchandise
router.get('/merchandise/all', middleware.isLoggedIn, displayAllMerchandise);

// Show page to add new merchandise
router.get('/merchandise/add', middleware.isLoggedIn, addNewMerchandise);

// Show - only a particular category, i.e. Wearables, Accesories or Stickers
router.get('/merchandise/:type', middleware.isLoggedIn, displayParticularMerchandiseType);

// Show - filtered by subtype
router.get('/merchandise/:type/subtype/:subtype', middleware.isLoggedIn, displayParticularMerchandiseSubtype);

// Create new merch item and Upload corresponding images to display
router.post('/merchandise', upload.array('images', 10), middleware.isLoggedIn, uploadNewMerchandise);

// Show detailed view of merch item
router.get('/merchandise/:type/:merch_id', middleware.isLoggedIn, displayMerchandise);

// Update merch item details like avaliability
router.put('/merchandise/:type/:merch_id', middleware.isLoggedIn, updateMerchandise);

// Delete merch item
router.delete('/merchandise/:type/:merch_id', middleware.isLoggedIn, deleteMerchandise);

module.exports = router;

