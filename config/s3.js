const S3     = require('aws-sdk/clients/s3'),
  fs         = require('fs'),
  path       = require('path'),
  util       = require('util'),
  unlinkFile = util.promisify(fs.unlink),
  multer     = require('multer'),
  sharp      = require('sharp');

// Multer config
const storage = multer.diskStorage({
  destination: './tmp_uploads/',
  filename: function(req, file, cb){
    cb(null, file.originalname);
  }
});
const fileFilter = function (req, file, cb) {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)){
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
}
const upload = multer({storage, fileFilter});

// AWS config
const s3 = new S3({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET,
  region: process.env.AWS_REGION
});
async function uploadFile(file, folder, size, fit){
  let fileNameWithoutExt = file.originalname.substring(0, file.originalname.lastIndexOf('.'));
  const {data, info} = await sharp(file.path)
  .resize(size, size, {fit: fit})
  .webp()
  .toBuffer({resolveWithObject: true});

  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Body: data,
    Key: folder+Date.now()+'_'+fileNameWithoutExt+'_'+size+'.'+info.format,
    ContentType: 'image/'+info.format,
    ContentLength: info.size
  }
  return s3.upload(uploadParams).promise();
}
function removeTmpUpload(filePath){
  return unlinkFile(filePath);
}
function deleteFile(fileKey){
  const deleteParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileKey
  }
  return s3.deleteObject(deleteParams).promise();
}

module.exports = {upload, uploadFile, removeTmpUpload, deleteFile};