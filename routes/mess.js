const { messShowFull, messUserSelect, messEditPage, messUpdateMenu, quickmessData, addNewMess } = require('../controllers/mess');

middleware = require('../middleware');
const express = require('express'),
  router = express.Router();

router.get('/mess', middleware.isLoggedIn, messShowFull);
router.put('/mess', middleware.isLoggedIn, messUserSelect);
router.get('/mess/add', middleware.isLoggedIn, addNewMess);
router.get('/mess/change', middleware.isLoggedIn, messEditPage);
router.put('/mess/change', middleware.isLoggedIn, messUpdateMenu);
router.get('/quickmess', quickmessData);


module.exports = router;

