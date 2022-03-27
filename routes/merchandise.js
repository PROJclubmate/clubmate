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

middleware = require('../middleware');
const express = require('express'),
  router = express.Router();
if (process.env.ENVIRONMENT === "dev") {
  var { upload } = require("../config/cloudinary.js");
} else if (process.env.ENVIRONMENT === "prod") {
  var { upload } = require("../config/s3.js");
}
router.get('/merchandise', middleware.isLoggedIn, displayNewlyArrivedMerchandise);
router.get('/merchandise/all', middleware.isLoggedIn, displayAllMerchandise);
router.get('/merchandise/add', middleware.isLoggedIn, addNewMerchandise);
router.get('/merchandise/:type', middleware.isLoggedIn, displayParticularMerchandiseType);
router.get('/merchandise/:type/subtype/:subtype', middleware.isLoggedIn, displayParticularMerchandiseSubtype);
router.post('/merchandise', upload.array('images', 10), middleware.isLoggedIn, uploadNewMerchandise);
router.get('/merchandise/:type/:merch_id', middleware.isLoggedIn, displayMerchandise);
router.put('/merchandise/:type/:merch_id', middleware.isLoggedIn, updateMerchandise);
router.delete('/merchandise/:type/:merch_id', middleware.isLoggedIn, deleteMerchandise);

module.exports = router;

