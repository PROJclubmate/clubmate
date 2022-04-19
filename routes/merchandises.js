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
} = require('../controllers/merchandises');

if (process.env.ENVIRONMENT === "dev") {
  var { upload } = require("../config/cloudinary.js");
} else if (process.env.ENVIRONMENT === "prod") {
  var { upload } = require("../config/s3.js");
}


// Show index page for the newly arrived merchandise
router.get('/colleges/:college_name/merchandise', middleware.isInCollege, displayNewlyArrivedMerchandise);

// Show index page for all the merchandise
router.get('/colleges/:college_name/merchandise/all', middleware.isInCollege, displayAllMerchandise);

// Show page to add new merchandise
router.get('/colleges/:college_name/merchandise/add', middleware.isCollegeLevelAdmin, addNewMerchandise);

// Show - only a particular category, i.e. Wearables, Accesories or Stickers
router.get('/colleges/:college_name/merchandise/:type', middleware.isInCollege, displayParticularMerchandiseType);

// Show - filtered by subtype
router.get('/colleges/:college_name/merchandise/:type/subtype/:subtype', middleware.isInCollege, displayParticularMerchandiseSubtype);

// Create new merch item and Upload corresponding images to display
router.post('/colleges/:college_name/merchandise', upload.array('images', 10), middleware.isCollegeLevelAdmin, uploadNewMerchandise);

// Show detailed view of merch item
router.get('/colleges/:college_name/merchandise/:type/:merch_id', middleware.isInCollege, displayMerchandise);

// Update merch item details like avaliability
router.put('/colleges/:college_name/merchandise/:type/:merch_id', middleware.isCollegeLevelAdmin, updateMerchandise);

// Delete merch item
router.delete('/colleges/:college_name/merchandise/:type/:merch_id', middleware.isCollegeLevelAdmin, deleteMerchandise);

module.exports = router;

