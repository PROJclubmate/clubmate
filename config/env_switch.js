// CAUTION
// Use value 'dev' unless pushing code to production, then use 'prod'
// dev  --> db = ghost_dev & image server = cloudinary
// prod --> db = ghost_prod & image server = s3 bucket, cdn = cloudfront, thumbnails = imagekit

const environment = 'dev';


module.exports = {environment}