const S3 = require('aws-sdk/clients/s3'),
  fs     = require('fs'),
  multer = require('multer');

// Multer config
const storage = multer.diskStorage({
  filename: function(req, file, callback){
    callback(null, Date.now() + file.originalname);
  }
});
const imageFilter = function (req, file, cb) {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)){
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
}
const upload = multer({ storage: storage, fileFilter: imageFilter});

// AWS config
const s3 = new S3({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET,
  region: process.env.AWS_REGION
});
function uploadFile(file, folder){
  const fileStream = fs.createReadStream(file.path);
  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Body: fileStream,
    Key: folder+file.filename,
    ContentType: file.mimetype,
    ContentLength: file.size,
    ContentEncoding: file.encoding
  }
  return s3.upload(uploadParams).promise();
}
function deleteFile(fileKey){
  const deleteParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileKey
  }
  return s3.deleteObject(deleteParams).promise();
}

module.exports = {upload, uploadFile, deleteFile};