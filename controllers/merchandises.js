const mongoose = require("mongoose"),
  Merchandise  = require("../models/merchandise"),
  Club         = require("../models/club"),
  CollegePage  = require("../models/college_page"),
  clConfig     = require("../config/cloudinary"),
  s3Config     = require('../config/s3');

if (process.env.ENVIRONMENT === "dev") {
  var cdn_prefix = "https://res.cloudinary.com/dubirhea4/";
} else if (process.env.ENVIRONMENT === "prod") {
  var cdn_prefix = "https://d367cfssgkev4p.cloudfront.net/";
}


const newlyArrivedCount = 4;

module.exports = {
	async displayNewlyArrivedMerchandise(req, res, next) {
    const foundMerch = await Merchandise.findOne({
      college: req.user.userKeys.college,
    });
    if (foundMerch == null) {
      logger.error(req.user._id+" : (merchandise-1)findMerchandise err => "+"No merchandise document found");
      req.flash("error", "Something went wrong :(");
      return res.redirect("back");
    }

    const allMerchItems = [];
    const categories = getCategories();
    for (let i = 0; i < categories.length; i++) {
      allMerchItems.push(...foundMerch[categories[i]]);
    }
    let merchItems = allMerchItems.sort(function (merch1, merch2) {
      return merch1.createdAt - merch2.createdAt;
    });
    if (merchItems.length > newlyArrivedCount) {
      merchItems = merchItems.slice(0, newlyArrivedCount);
    }

    res.render("merch/index", { merchItems: merchItems, name: "New Arrivals", collegeName: req.user.userKeys.college });
  },

	async displayAllMerchandise(req, res, next) {
    const foundMerch = await Merchandise.findOne({
      college: req.user.userKeys.college,
    });
    if (foundMerch == null) {
      logger.error(req.user._id+" : (merchandise-2)findMerchandise err => "+"No merchandise document found");
      req.flash("error", "Something went wrong :(");
      return res.redirect("back");
    }

    const allMerchItems = [];
    const categories = getCategories();
    for (let i = 0; i < categories.length; i++) {
      allMerchItems.push(...foundMerch[categories[i]]);
    }
    const merchItems = allMerchItems.sort(function (merch1, merch2) {
      return merch1.createdAt - merch2.createdAt;
    });

    res.render("merch/index", { merchItems: merchItems, name: "All Products", collegeName: req.user.userKeys.college });
  },

  async addNewMerchandise(req, res, next) {
    const foundCollegePages = await CollegePage.findOne({ name: req.user.userKeys.college }).select('allClubs');
    const allClubIds = [];
    for (let i = 0; i < foundCollegePages.allClubs.length; i++) {
      allClubIds.push(...foundCollegePages.allClubs[i].categoryClubIds);
    }
    const foundClubs = await Club.find().where('_id').in(allClubIds).select('name').exec();
    if (foundClubs == null) {
      req.flash("error", "No clubs present in college :(");
      return req.redirect("/merchandise");
    }

    res.render("merch/add", { clubs: foundClubs, collegeName: req.user.userKeys.college });
  },

  async displayParticularMerchandiseType(req, res, next) {
    const reqCategory = req.params.type;
    const categories = getCategories();
    if (!categories.includes(reqCategory)) {
      req.flash("error", "Invalid category");
      return res.redirect("back");
    }

    const foundMerch = await Merchandise.findOne({
      college: req.user.userKeys.college,
    }).select(reqCategory);
    if (foundMerch == null) {
      logger.error(req.user._id+" : (merchandise-3)findMerchandise err => "+"No merchandise document found");
      req.flash("error", "Something went wrong :(");
      return res.redirect("back");
    }

    const merchItems = foundMerch[reqCategory];
    res.render("merch/index", { merchItems: merchItems, name: capitalCase(reqCategory), collegeName: req.user.userKeys.college });
  },

  async displayParticularMerchandiseSubtype(req, res, next) {
    const reqCategory = req.params.type;
    const reqSubCategory = req.params.subtype.toUpperCase();
    const categories = getCategories();
    if (!categories.includes(reqCategory)) {
      req.flash("error", "Invalid category");
      return res.redirect("back");
    }

    const foundMerch = await Merchandise.findOne({ college: req.user.userKeys.college}).select(reqCategory);
    if (foundMerch == null) {
      logger.error(req.user._id+" : (merchandise-4)findMerchandise err => "+"No merchandise document found");
      req.flash("error", "Something went wrong :(");
      return res.redirect("back");
    }
    const merchTypeItems = foundMerch[reqCategory];
    const merchItems = merchTypeItems.filter(function (merch) {
      if (merch.subCategory === reqSubCategory) return true;
    });
		const name = capitalCase(reqCategory) + "  /" + capitalCase(reqSubCategory);

    res.render("merch/index", { merchItems: merchItems, name: name, collegeName: req.user.userKeys.college });
  },

  async uploadNewMerchandise(req, res, next) {
    if (!req.user.isCollegeLevelAdmin) {
      req.flash("error", "You are not authorized to add an item");
      return res.redirect("/merchandise");
    }

    const title = req.body.title;
    const description = req.body.description;
    const category = req.body.category.toLowerCase();
    const subCategory = req.body.subCategory.toUpperCase();
    const contact = req.body.contact;
    const price = req.body.price;
    const posted = req.body.posted.split("#$#");

    if (!title || !description || !category || !posted) {
      req.flash("error", "Please fill in the required details");
      return res.redirect("back");
    }

    if (!req.files) {
      req.flash("error", "Please upload atleast one image");
      return res.redirect("back");
    }

    const foundMerch = await Merchandise.findOne({
      college: req.user.userKeys.college,
    });
    if (foundMerch == null) {
      logger.error(req.user._id+" : (merchandise-5)findMerchandise err => "+"No merchandise document found");
      req.flash("error", "Something went wrong :(");
      return res.redirect("back");
    }

    const images = [];
    const imageIds = [];
    if (req.files) {
      try {
        // upload images
        for (var file of req.files) {
          if (process.env.ENVIRONMENT === "dev") {
            var result =
              await clConfig.cloudinary.v2.uploader.upload(
                file.path,
                clConfig.merchItems_1080_obj
              );
            // add images to arrays
            images.push(result.secure_url);
            imageIds.push(result.public_id);
          } else if (process.env.ENVIRONMENT === "prod") {
            var result = await s3Config.uploadFile(
              file,
              "merchItems/",
              1080
            );
            s3Config.removeTmpUpload(file.path);
            // add images to arrays
            images.push(result.secure_url);
            imageIds.push(result.public_id);
          }
        }
      } catch (err) {
        logger.error(req.user._id+" : (merchandise-6)uploadMerchandise err => "+err);
        req.flash("error", "Something went wrong :(");
        return res.redirect("back");
      }
    }

    const clubId = mongoose.Types.ObjectId(posted[0]);
    const clubName = posted[1];
    const club = { clubId: clubId, clubName: clubName };

    if (category === "wearables") {
      const sizes = req.body.sizes;
      const colors = filterEmptyStrings(req.body.colors.split(","));

      foundMerch[category].push({
        images: images,
        imageIds: imageIds,
        title: title,
        description: description,
        category: category,
        subCategory: subCategory,
        contact: contact,
        price: price,
        sizes: sizes,
        colors: colors,
        inStock: true,
        club: club,
      });
    } else if (category === "accessories") {
      const colors = filterEmptyStrings(req.body.colors.split(","));
      foundMerch[category].push({
        images: images,
        imageIds: imageIds,
        title: title,
        description: description,
        category: category,
        subCategory: subCategory,
        contact: contact,
        colors: colors,
        price: price,
        inStock: true,
        club: club,
      });
    } else if (category === "stickers") {
      foundMerch[category].push({
        images: images,
        imageIds: imageIds,
        title: title,
        description: description,
        category: category,
        subCategory: subCategory,
        contact: contact,
        price: price,
        inStock: true,
        club: club,
      });
    } else {
      req.flash("error", "Invalid merch type");
      return res.redirect("back");
    }

    await foundMerch.save();

    req.flash("success", "Uploaded New Merchandise");
    res.redirect("/merchandise");
  },

  async displayMerchandise(req, res, next) {
    const merchId = req.params.merch_id;

    const reqCategory = req.params.type;
    const categories = getCategories();
    if (!categories.includes(reqCategory)) {
      req.flash("error", "Invalid category");
      return res.redirect("back");
    }

    const foundMerch = await Merchandise.findOne({ college: req.user.userKeys.college }).select(reqCategory);
    if (foundMerch == null) {
      logger.error(req.user._id+" : (merchandise-7)findMerchandise err => "+"No merchandise document found");
      req.flash("error", "Something went wrong :(");
      return res.redirect("back");
    }
    const merchItem = foundMerch[reqCategory].id(merchId);
    if (!merchItem) {
      req.flash("error", "Merch not found");
      return res.redirect("back");
    }

    res.render("merch/show", { merchItem: merchItem, collegeName: req.user.userKeys.college });
  },

  async updateMerchandise(req, res, next) {
    if (!req.user.isCollegeLevelAdmin) {
      req.flash("error", "You are not authorized to update the merchandise");
      return res.redirect("back");
    }

    const merchId = req.params.merch_id;
    const inStock = req.body.inStock;
    const price = req.body.price;

    const reqCategory = req.params.type;
    const categories = getCategories();
    if (!categories.includes(reqCategory)) {
      req.flash("error", "Invalid category");
      return res.redirect("back");
    }

    const foundMerch = await Merchandise.findOne({
      college: req.user.userKeys.college,
    }).select(reqCategory);
    if (foundMerch == null) {
      logger.error(req.user._id+" : (merchandise-8)findMerchandise err => "+"No merchandise document found");
      req.flash("error", "Something went wrong :(");
      return res.redirect("back");
    }

    const merchItem = foundMerch[reqCategory].id(merchId);
    if (!merchItem) {
      req.flash("error", "Merch item doesn't exist");
      res.redirect("back");
    }

    if (price) {
      merchItem.price = price;
    }
    if (inStock === "true") {
      merchItem.inStock = true;
    }
    if (inStock === "false") {
      merchItem.inStock = false;
    }
    await foundMerch.save();

    req.flash("success", "Merch updated successfully");
    res.redirect("back");
  },

  async deleteMerchandise(req, res, next) {
    if (!req.user.isCollegeLevelAdmin) {
      req.flash("error", "You are not authorized to delete the item");
      return res.redirect("/merchandise");
    }

    const reqMerchId = req.params.merch_id;
    const reqCategory = req.params.type;
    const categories = getCategories();
    if (!categories.includes(reqCategory)) {
      req.flash("error", "Invalid category");
      return res.redirect("back");
    }

    const update = { $pull: {} };
    update.$pull[reqCategory] = { _id: mongoose.Types.ObjectId(reqMerchId) };

    const foundMerch = await Merchandise.findOneAndUpdate({ college: req.user.userKeys.college }, update);
    if (foundMerch == null) {
      logger.error(req.user._id + " : (merchandise-9)findMerchandise err => " + "No merchandise document found");
      req.flash("error", "Something went wrong :(");
      return res.redirect("back");
    }

    try {
      const images =
        foundMerch[reqCategory].id(reqMerchId).images;
      const imageIds =
        foundMerch[reqCategory].id(reqMerchId).imageIds;
      if (images.length !== imageIds.length) {
        throw (
          "Unequal array sizes for merch_id: " +
          reqMerchId
        );
      }
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const imageId = imageIds[i];
        if (process.env.ENVIRONMENT === "dev") {
          clConfig.cloudinary.v2.uploader.destroy(imageId);
        } else if (process.env.ENVIRONMENT === "prod") {
          s3Config.deleteFile(imageId);
        }
      }
    } catch (err) {
      logger.error(req.user._id + " : (merchandise-10)deleteImage err => " + err);
    }

    req.flash("success", "Merchandise deleted!");
    return res.redirect("/merchandise");
  },
};

function capitalCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function filterEmptyStrings(arr) {
  return arr.filter(function (elem) {
    return (elem !== "");
  });
}

function getCategories() {
  const categories = ["wearables", "accessories", "stickers"];
  return categories;
}