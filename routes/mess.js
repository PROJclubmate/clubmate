const data = require("../controllers/mess");
middleware = require("../middleware");
const express = require("express"),
    router = express.Router();
router.get("/mess", middleware.isLoggedIn, data);

module.exports = router;
