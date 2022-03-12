const {MessData,Validation,ChangeMenu} = require('../controllers/mess');
const{data} = require('../controllers/quickmess');

middleware    = require('../middleware');
const express   = require('express'),
  router        = express.Router();

router.get('/mess',middleware.isLoggedIn,MessData);
router.get('/mess/change',middleware.isLoggedIn,Validation);
router.put('/mess/change',middleware.isLoggedIn,ChangeMenu);
router.get('/quickmess',data);

module.exports = router;

