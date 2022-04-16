const cloudinary = require('cloudinary'),
  path = require('path'),
  multer = require('multer');

// Multer config
const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname);
  }
});
const fileFilter = function (req, file, cb) {
  const filetypes = /jpg|jpeg|png|gif|bmp|webp/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  if (!(mimetype && extname)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
}
const upload = multer({ storage, fileFilter });

// Clodinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_ID,
  api_secret: process.env.API_SECRET,
});

const profilePics_1080_obj = {
  folder: 'profilePics/',
  use_filename: true, width: 1080, height: 1080, quality: 'auto:eco', effect: 'sharpen:25', format: 'webp', crop: 'limit'
};
const clubAvatars_1080_obj = {
  folder: 'clubAvatars/',
  use_filename: true, width: 1080, height: 1080, quality: 'auto:eco', effect: 'sharpen:25', format: 'webp', crop: 'limit'
};
const roomAvatars_400_obj = {
  folder: 'roomAvatars/',
  use_filename: true, width: 400, height: 400, quality: 'auto:eco', effect: 'sharpen:25', format: 'webp', crop: 'limit'
};
const featuredClubPhotos_1080_obj = {
  folder: 'featuredClubPhotos/',
  use_filename: true, width: 1080, height: 1080, quality: 'auto:eco', effect: 'sharpen:25', format: 'webp', crop: 'limit'
};
const postImages_1080_obj = {
  folder: 'postImages/',
  use_filename: true, width: 1080, height: 1080, quality: 'auto:eco', effect: 'sharpen:25', format: 'webp', crop: 'limit'
};
const subPostImages_1080_obj = {
  folder: 'subPostImages/',
  use_filename: true, width: 1080, height: 1080, quality: 'auto:eco', effect: 'sharpen:25', format: 'webp', crop: 'limit'
};
const clubStories_obj = {
  folder: 'clubStories/',
  use_filename: true, width: 1080, height: 1080, quality: 'auto:eco', effect: 'sharpen:25', crop: 'limit'
};
const merchItems_1080_obj = {
  folder: 'merchItems/',
  use_filename: true, width: 1080, height: 1080, quality: 'auto:eco', effect: 'sharpen:25', crop: 'limit'
};
const blogImages_400_obj = {
  folder: 'blogImages/',
  use_filename: true, width: 400, height: 400, quality: 'auto:eco', effect: 'sharpen:25', crop: 'limit'
};
const thumb_100_obj = { width: 100, height: 100, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp' };
const thumb_200_obj = { width: 200, height: 200, quality: 90, effect: 'sharpen:50', secure: true, crop: 'fill', format: 'webp' };

module.exports = {
  cloudinary, upload, profilePics_1080_obj, clubAvatars_1080_obj, roomAvatars_400_obj,
  featuredClubPhotos_1080_obj, postImages_1080_obj, subPostImages_1080_obj, clubStories_obj, merchItems_1080_obj, blogImages_400_obj,
  thumb_100_obj, thumb_200_obj
}
