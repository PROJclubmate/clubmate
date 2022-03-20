const mongoose  = require('mongoose'),
    Merchandise = require('../models/merchandise'),
    User          = require('../models/user'),
    clConfig         = require('../config/cloudinary');

if(process.env.ENVIRONMENT === 'dev'){
  var cdn_prefix = 'https://res.cloudinary.com/dubirhea4/';
} else if (process.env.ENVIRONMENT === 'prod'){
  var cdn_prefix = 'https://d367cfssgkev4p.cloudfront.net/';
}

const uploadNewMerchandise = async (req,res)=>{
    // console.log("HI");
    // user = req.user.email;
    // const validate = await User.find({email: user,isCollegeLevelAdmin: true});
    // if(!validate[0]){
    //     req.flash('error', 'You are not authorized upload Merchandise');
    //     res.redirect('/merchandise');
    // }
    // else{
    var cat = req.body.category;
    var title = req.body.description;
    console.log(title);
    if(req.file){
      console.log("hello");
        try{
          if(process.env.ENVIRONMENT === 'dev'){
            var result = await clConfig.cloudinary.v2.uploader.upload(req.file.path, clConfig.merchandise_400_obj);
            console.log("sent");
            req.body.image = result.secure_url;
            req.body.imageId = result.public_id;
            console.log(req.body.image);
            console.log(req.body.imageId);
          } else if (process.env.ENVIRONMENT === 'prod'){
            const result = await s3Config.uploadFile(req.file, 'merchandise/', 1080);
            s3Config.removeTmpUpload(req.file.path);
            req.body.image = result.Location;
            req.body.imageId = result.Key;
          }
        }catch(err){
          // logger.error(req.user._id+' : Merchandise error => '+err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }
      }
else{
  console.log("No file");
}
    const merch = await Merchandise.create({
      description : title , 
      category : cat,
      image : req.body.image,
      imageId:req.body.imageId ,
      contact : req.body.contact,

    })
    console.log(merch);
    req.flash('success','Uploaded New Merchandise');
    res.redirect('/merchandise/upload');
  }


const deleteMerchandise = async (req,res)=>{
  user = req.user.email;
    const validate = await User.find({email: user,isCollegeLevelAdmin: true});
    if(!validate[0]){
        req.flash('error', 'You are not authorized upload Merchandise');
        res.redirect('/merchandise');
    }
    else{
  const merch = await Merchandise.findById(req.params.merch_id);
  if(!merch){
    req.flash('error','Required Merchandise does not exist');
    res.redirect('/merchandise');
  }
  else{
    if(merch.image && merch.imageId){
      try{
        if(process.env.ENVIRONMENT === 'dev'){
          clConfig.cloudinary.v2.uploader.destroy(merch.imageId);
        } else if (process.env.ENVIRONMENT === 'prod'){
          s3Config.deleteFile(foundPost.imageId);
        }
        merch.remove();
        req.flash('success','Merchandise Deleted !');
        res.redirect('/merchandise');
      }
      catch(err){
            req.flash('error', 'Something went wrong :(');
            res.redirect('/merchandise');
      }
    }
    else{
      merch.remove();
      req.flash('success','Merchandise Deleted !');
      res.redirect('/merchandise');
    }
  }
    }
}

const displayMerchandise = async (req,res)=>{
  const merch = await Merchandise.find({});
  const type = await Merchandise.distinct('category');
  res.render('merchandise',{merch : merch , type : type});
}

const displayParticularMerchandise = async (req,res)=>{
   const category = req.params.type;
   const requiredCategory = await Merchandise.find({category:category});
   const type = await Merchandise.distinct('category');
   res.render('merchandise',{merch : requiredCategory , type : type});

}

module.exports = {uploadNewMerchandise,
                  deleteMerchandise,
                  displayMerchandise,
                  displayParticularMerchandise};