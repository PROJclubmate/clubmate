const cloudinary = require('cloudinary'),
  multer         = require('multer');

// Multer config
const storage = multer.diskStorage({
  filename: function(req, file, cb){
    cb(null, Date.now() + file.originalname);
  }
});
const fileFilter = function (req, file, cb) {
  // accept image files only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)){
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
}
const upload = multer({storage, fileFilter});

// Clodinary config
cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_ID, 
  api_secret: process.env.API_SECRET,
});

module.exports = {cloudinary, upload}