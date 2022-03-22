const {uploadNewMerchandise,deleteMerchandise,displayMerchandise,displayParticularMerchandise} = require("../controllers/merchandise");

middleware    = require('../middleware');
const express   = require('express'),
  router        = express.Router();
if (process.env.ENVIRONMENT === "dev") {
    var { upload } = require("../config/cloudinary.js");
} else if (process.env.ENVIRONMENT === "prod") {
    var { upload } = require("../config/s3.js");
}
router.get('/merchandise',middleware.isLoggedIn,displayMerchandise);
router.post('/merchandise',upload.single('image'),middleware.isLoggedIn,uploadNewMerchandise);
router.get('/merchandise/:type',middleware.isLoggedIn,displayParticularMerchandise);
router.delete('/merchandise/:merch_id',middleware.isLoggedIn,deleteMerchandise);

module.exports = router;