const
  User = require('../models/user'),
  CollegePage = require('../models/college_page')
  Blog = require('../models/blog'),
  clConfig = require('../config/cloudinary'),
  s3Config = require('../config/s3'),
  logger = require('../logger');

if (process.env.ENVIRONMENT === 'dev') {
  var cdn_prefix = 'https://res.cloudinary.com/dubirhea4/';
} else if (process.env.ENVIRONMENT === 'prod') {
  var cdn_prefix = 'https://d367cfssgkev4p.cloudfront.net/';
}

const maxBucketSize = 100;
const blogsToLoadCount = 20;

function last(arr) {
  return arr[arr.length - 1];
}

module.exports = {

  async blogsLoadPage(req, res, next) {

    // index of previously loaded bucket
    let bucketIndex = req.query.bucket;
    bucketIndex = parseInt(bucketIndex);

    CollegePage.
      findOne({ name: req.user.userKeys.college }).
      select('blogBuckets').
      lean().
      exec(function (err, foundCollegePage) {

        if (err || !foundCollegePage) {
          logger.error(req.user._id + ' : (blog-1)foundCollegePage err => ' + err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }


        if (isNaN(bucketIndex)) {
          return res.render('blogs/show', {college: req.user.userKeys.college, bucket: foundCollegePage.blogBuckets.length});
        }

        if (!bucketIndex) {
          return res.json(null);
        }

        if (bucketIndex < 0) {
          req.flash('error', 'Invalid bucket');
          return res.redirect('back');
        }

        if (bucketIndex > foundCollegePage.blogBuckets.length) {
          req.flash('error', 'Invalid bucket');
          return res.redirect('back');
        }
        bucketIndex--;

        Blog.
        findById(foundCollegePage.blogBuckets[bucketIndex]).
        lean().
        exec(function (err, foundBlog) {

          if (err || !foundBlog) {
            logger.error(req.user._id + ' : (blog-2)foundBlog err => ' + err);
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          }

          User.
          findById(req.user._id).
          select('savedBlogs heartedBlogs').
          exec(async function (err, foundUser) {

            if (err || !foundUser) {
              logger.error(req.user._id + ' : (blog-3)foundUser err => ' + err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }

            const authorIds = [];
            for (let i=0; i<foundBlog.blogs.length; i++) {
              blog = foundBlog.blogs[i];
              if (blog.author) {
                idx = authorIds.findIndex(elem => elem.equals(blog.author.id));
                if (idx === -1) {
                  authorIds.push(blog.author.id);
                }
              }
            }

            foundAuthor = await User.find().where('_id').in(authorIds).select('profilePic profilePicId userKeys').lean();

            let bucketId = foundBlog._id;
            let blogId, heartedBlogIndex, savedBucketIndex, savedBlogIndex;
            for (let i = 0; i < foundBlog.blogs.length; i++) {

              blogId = foundBlog.blogs[i]._id;

              let changesMade = false;
              if (!foundUser.heartedBlogs) {
                changesMade = true;
                foundUser.heartedBlogs = [];
              }
              if (!foundUser.savedBlogs) {
                changesMade = true;
                foundUser.savedBlogs = [];
              }

              heartedBlogIndex = foundUser.heartedBlogs.findIndex(elem => (elem.bucketId.equals(bucketId) && elem.blogId.equals(blogId)) );
              if (heartedBlogIndex === -1) {
                foundBlog.blogs[i].hearted = false;
              } else {
                foundBlog.blogs[i].hearted = true;
              }

              savedBucketIndex = foundUser.savedBlogs.findIndex(elem => (elem.bucketId.equals(bucketId)));
              if (savedBucketIndex === -1) {
                foundBlog.blogs[i].saved = false;
              } else {
                savedBlogIndex = foundUser.savedBlogs[savedBucketIndex].blogIds.findIndex(elem => (elem.equals(blogId)));
                if (savedBlogIndex === -1) {
                  foundBlog.blogs[i].saved = false;
                } else {
                  foundBlog.blogs[i].saved = true;
                }
              }

              author = foundBlog.blogs[i].author;
              if (author) {
                userIndex = foundAuthor.findIndex(elem => elem._id.equals(author.id));
                user = foundAuthor[userIndex];

                if(process.env.ENVIRONMENT === 'dev'){
                  author.profilePic = clConfig.cloudinary.url(user.profilePicId, clConfig.thumb_100_obj);
                } else if (process.env.ENVIRONMENT === 'prod'){
                  author.profilePic = s3Config.thumb_100_prefix+user.profilePicId;
                }

                author.sex = user.userKeys.sex;

              }

              foundBlog.blogs[i].bucketId = bucketId;

              if (changesMade) {
                foundUser.save(function (err) {
                  if (err) {
                    logger.error(req.user._id + ' : (blog-4)saveUser err => ' + err);
                    req.flash('error', 'Something went wrong :(');
                    return res.redirect('back');
                  }
                });
              }

            }

            return res.json({ blogs: foundBlog.blogs, bucket: bucketIndex, college: req.user.userKeys.college })

          });

        });

      });

  },

  async blogsCreatePage(req, res, next) {

    res.render('blogs/add_blog', {college: req.user.userKeys.college});

  },

  async blogsCreate(req, res, next) {

    const title = req.body.title;
    const description = req.body.description;
    const url = req.body.url;
    const urlName = req.body.urlName;
    const content = req.body.content ? req.body.content : null;
    const isNews = (req.body.isNews === 'false') ? false : true;
    const readTime = isNews ? 0 : parseInt(req.body.readTime);
    const author = isNews ? null : {id: req.user._id, name: req.user.fullName};

    if (isNaN(readTime)) {
      req.flash('error', 'Invalid read time');
      return res.redirect('back');
    }

    if (!title) {
      req.flash('error', 'Please enter title');
      return res.redirect('back');
    }

    if (!description) {
      req.flash('error', 'Please enter description');
      return res.redirect('back');
    }

    if (!isNews) {
      if (!url || !urlName) {
        req.flash('error', 'Please enter a URL for the blog');
        return res.redirect('back');
      }
    } else {
      if (url && !urlName) {
        req.flash('error', 'Please enter a URL name');
        return res.redirect('back');
      }
    }

    if (!isNews && !req.file) {
      req.flash("error", "Please upload atleast one image");
      return res.redirect("back");
    }

    let image, imageId;

    CollegePage.
      findOne({ name: req.user.userKeys.college }).
      select('unapprovedBlogBucket blogBuckets').
      exec(async function (err, foundCollegePage) {

        if (err || !foundCollegePage) {
          logger.error(req.user._id + ' : (blog-5)foundCollegePage err => ' + err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }

        try{
          if(process.env.ENVIRONMENT === 'dev'){
            var result = await clConfig.cloudinary.v2.uploader.upload(req.file.path, clConfig.blogImages_400_obj);
            image = result.secure_url;
            imageId = result.public_id;
          } else if (process.env.ENVIRONMENT === 'prod'){
            var result = await s3Config.uploadFile(req.file, 'blogImages/', 400);
            s3Config.removeTmpUpload(req.file.path);
            image = result.Location;
            imageId = result.Key;
          }
        } catch(err){
          logger.error(req.user._id+' : (posts-17)imageUpload err => '+err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }

        if (!foundCollegePage.unapprovedBlogBucket) {

          Blog.
            create({
              college: req.user.userKeys.college,
              blogs: [{
                title: title,
                description: description,
                image: image,
                imageId: imageId,
                url: url,
                urlName: urlName,
                content: content,
                readTime: readTime,
                author: author,
              }],
            }, function (err, createdBlog) {

              if (err || !createdBlog) {

                try {
                  if(process.env.ENVIRONMENT === 'dev'){
                    clConfig.cloudinary.v2.uploader.destroy(imageId);
                  } else if (process.env.ENVIRONMENT === 'prod'){
                    s3Config.deleteFile(imageId);
                  }
                } catch (err) {
                  logger.error(req.user._id + ' : (blog-6)imageDestroy err => ' + err);
                }

                logger.error(req.user._id + ' : (blog-7)createdBlog err => ' + err);
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');

              }

              foundCollegePage.unapprovedBlogBucket = createdBlog._id;

              foundCollegePage.save(function (err) {
                if (err) {
                  logger.error(req.user._id + ' : (blog-8)saveCollegePage err => ' + err);
                  req.flash('error', 'Something went wrong :(');
                  return res.redirect('back');
                }
              });

              req.flash('success', 'Blog created successfully');
              res.redirect('back');

            });

        } else {

          Blog.
            findById(foundCollegePage.unapprovedBlogBucket).
            exec(function (err, foundBlog) {

              if (err || !foundBlog) {
                logger.error(req.user._id + ' : (blog-9)foundBlog err => ' + err);
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              }

              foundBlog.blogs.push({
                title: title,
                description: description,
                image: image,
                imageId: imageId,
                url: url,
                urlName: urlName,
                content: content,
                readTime: readTime,
                author: author,
              });

              foundBlog.save(function (err) {
                if (err) {

                  try {
                    if(process.env.ENVIRONMENT === 'dev'){
                      clConfig.cloudinary.v2.uploader.destroy(imageId);
                    } else if (process.env.ENVIRONMENT === 'prod'){
                      s3Config.deleteFile(imageId);
                    }
                  } catch (err) {
                    logger.error(req.user._id + ' : (blog-10)imageDestroy err => ' + err);
                  }

                  logger.error(req.user._id + ' : (blog-11)saveBlog err => ' + err);
                  req.flash('error', 'Something went wrong :(');
                  return res.redirect('back');
                  
                }

                req.flash('success', 'Blog created successfully');
                return res.redirect('back');
              });

            });

        }

      });

  },

  async blogsDelete(req, res, next) {

    if (!req.user.isCollegeLevelAdmin) {
      req.flash("error", "You are not authorized to delete a blog");
      return res.redirect("/");
    }

    const bucketId = req.params.bucket;
    const blogId = req.params.blog;
    let blogAuthor = null;

    Blog.
      findById(bucketId).
      exec(async function (err, foundBlog) {

        if (err || !foundBlog) {
          logger.error(req.user._id + ' : (blog-12)foundBlog err => ' + err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }

        const blogIndex = foundBlog.blogs.findIndex(elem => elem._id.equals(blogId));
        if (blogIndex === -1) {

          req.flash('error', 'Blog does not exist');
          res.redirect('back');

        } else if (foundBlog.blogs.length <= 1) {

          blogAuthor = foundBlog.blogs[0].author;

          try {
            if(process.env.ENVIRONMENT === 'dev'){
              clConfig.cloudinary.v2.uploader.destroy(foundBlog.blogs[0].imageId);
            } else if (process.env.ENVIRONMENT === 'prod'){
              s3Config.deleteFile(foundBlog.blogs[0].imageId);
            }
          } catch (err) {
            logger.error(req.user._id + ' : (blog-13)imageDestroy err => ' + err);
          }

          await Blog.findByIdAndDelete(bucketId, async function (err) {

            if (err) {
              logger.error(req.user._id + ' : (blog-14)deleteBlog err => ' + err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }

            await CollegePage.findOneAndUpdate({ name: req.user.userKeys.college }, { $pull: { blogBuckets: bucketId } }).exec(function (err) {
              if (err) {
                logger.error(req.user._id + ' : (blog-15)saveCollegePage err => ' + err);
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              }
            });

          });

        } else {

          blogAuthor = foundBlog.blogs[blogIndex].author;

          foundBlog.blogs.splice(blogIndex, 1);

          try {
            if(process.env.ENVIRONMENT === 'dev'){
              clConfig.cloudinary.v2.uploader.destroy(foundBlog.blogs[blogIndex].imageId);
            } else if (process.env.ENVIRONMENT === 'prod'){
              s3Config.deleteFile(foundBlog.blogs[blogIndex].imageId);
            }
          } catch (err) {
            logger.error(req.user._id + ' : (blog-16)imageDestroy err => ' + err);
          }

          foundBlog.save(function (err) {
            if (err) {
              logger.error(req.user._id + ' : (blog-17)saveBlog err => ' + err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }
          });

        }

        if (blogAuthor) {

          User.
            findById(blogAuthor.id).
            select('createdBlogs').
            exec(function (err, foundUser) {

              if (err || !foundUser) {
                logger.error(req.user._id + ' : (blog-18)foundUser err => ' + err);
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              }

              const bucketIndex = foundUser.createdBlogs.findIndex(elem => elem.bucketId.equals(bucketId));

              if (bucketIndex !== -1) {

                if (foundUser.createdBlogs[bucketIndex].blogIds.length <= 1) {

                  foundUser.createdBlogs.splice(bucketIndex, 1);

                } else {

                  const blogIndex = foundUser.createdBlogs[bucketIndex].blogIds.findIndex(elem => elem.equals(blogId));

                  if (blogIndex !== -1) {
                    foundUser.createdBlogs[bucketIndex].blogIds.splice(blogIndex, 1);
                  }

                }

                foundUser.save(function (err) {
                  if (err) {
                    logger.error(req.user._id + ' : (blog-19)saveUser err => ' + err);
                    req.flash('error', 'Something went wrong :(');
                    return res.redirect('back');
                  }
                });

              }


            });

        }

        req.flash('success', 'Blog deleted successfully');
        res.redirect('back');

      });

  },

  async blogsSave(req, res, next) {

    const blogId = req.params.blog;
    const bucketId = req.params.bucket;

    let saved = true;
    User.
      findById(req.user._id).
      select('savedBlogs').
      exec(async function (err, foundUser) {

        if (err || !foundUser) {
          logger.error(req.user._id + ' : (blog-20)foundUser err => ' + err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }

        const savedBucketIndex = foundUser.savedBlogs.findIndex(elem => elem.bucketId.equals(bucketId));

        if (savedBucketIndex !== -1) {
          const savedBlogIndex = foundUser.savedBlogs[savedBucketIndex].blogIds.findIndex(elem => elem.equals(blogId));
          if (savedBlogIndex !== -1) {
            foundUser.savedBlogs[savedBucketIndex].blogIds.splice(savedBlogIndex, 1);
            saved = false;
          }
          if (foundUser.savedBlogs[savedBucketIndex].blogIds.length === 0) {
            foundUser.savedBlogs.splice(savedBucketIndex, 1);
          }
        }

        if (saved) {
          if (savedBucketIndex === -1) {
            foundUser.savedBlogs.push({
              bucketId: bucketId,
              blogIds: [blogId],
            });
          } else {
            const savedBlogIndex = foundUser.savedBlogs[savedBucketIndex].blogIds.findIndex(elem => elem.equals(blogId));
            if (savedBlogIndex === -1) {
              foundUser.savedBlogs[savedBucketIndex].blogIds.push(blogId);
            }
          }
        }

        await foundUser.save(function (err) {
          if (err) {
            logger.error(req.user._id + ' : (blog-21)saveUser err => ' + err);
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          }
        });

        if (saved) {
          req.flash('success', 'Blog saved successfully');
        } else {
          req.flash('success', 'Blog unsaved successfully');
        }
        return res.json({ saved: saved });

      });

  },

  async blogsSavedPage(req, res, next) {

    // pointers to last previously loaded bucket and corresponding blog
    const oldBucketIndex = parseInt(req.query.bucket);
    const oldBlogIndex = parseInt(req.query.index);

    User.
      findById(req.user._id).
      select('savedBlogs heartedBlogs').
      exec(async function (err, foundUser) {

        if (err || !foundUser) {
          logger.error(req.user._id + ' : (blog-22)foundUser err => ' + err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }
      
        // if user document don't have savedBlogs or heartedBlogs attributes, make them
        let changesMade = false;
        if (!foundUser.heartedBlogs) {
          changesMade = true;
          foundUser.heartedBlogs = [];
        }
        if (!foundUser.savedBlogs) {
          changesMade = true;
          foundUser.savedBlogs = [];
        }
        if (changesMade) {
          foundUser.save(function (err) {
            if (err) {
              logger.error(req.user._id + ' : (blog-23)saveUser err => ' + err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }
          });
        }

        // if query is empty, that means only page renedering has to be done and no bucket needs to fetched
        if (isNaN(oldBucketIndex) || isNaN(oldBlogIndex)) {
          return res.render('blogs/saved', {college: req.user.userKeys.college, bucket: foundUser.savedBlogs.length, index: 0});
        }

        // if all blogs have been loaded or user has no saved blogs, return null
        if ((!oldBucketIndex && !oldBlogIndex) || !foundUser.savedBlogs.length ) {
          return res.json(null);
        }

        // perform sanity checks
        if (oldBucketIndex > foundUser.savedBlogs.length || oldBucketIndex < 0) {
          req.flash('Invalid bucket');
          return res.redirect('back');
        }
        if (
          (oldBucketIndex !== foundUser.savedBlogs.length && oldBlogIndex > foundUser.savedBlogs[oldBucketIndex].blogIds.length) ||
          (oldBucketIndex === foundUser.savedBlogs.length && oldBlogIndex !== 0) ||
          (oldBlogIndex < 0)
        ) {
          req.flash('Invalid index');
          return res.redirect('back');
        }

        let newBucketIndex = oldBucketIndex;
        let newBlogIndex = oldBlogIndex;
        let count = 0;

        const foundUserCopy = JSON.parse(JSON.stringify(foundUser));

        // get pointers to bucket and blog such that it is 20 blogs behind the previously loaded bucket and blog
        while (count !== blogsToLoadCount) {

          if (newBlogIndex >= blogsToLoadCount - count) {
            newBlogIndex = newBucketIndex - blogsToLoadCount;
            break;
          }

          count += newBlogIndex;
          newBucketIndex--;
          if (newBucketIndex >= 0) {
            newBlogIndex = foundUser.savedBlogs[newBucketIndex].blogIds.length;
          } else {
            newBucketIndex = 0;
            newBlogIndex = 0;
            break;
          }

        }

        foundUserCopy.savedBlogs = foundUser.savedBlogs.slice(newBucketIndex, oldBucketIndex + 1);
        foundUserCopy.savedBlogs[0].blogIds.splice(0, newBlogIndex);
        if (newBucketIndex === oldBucketIndex) {
          foundUserCopy.savedBlogs[foundUserCopy.savedBlogs.length - 1].blogIds.splice(oldBlogIndex)
        }

        // populate those new 20 blogs and store them into array 'blogs'
        // update for any bucket or blog entry which has been deleted but still exists in savedBlogs
        // also retrieve heart count for all blogs
        const blogs = [];

        changesMade = false;
        for (let i = 0; i < foundUserCopy.savedBlogs.length; i++) {

          let foundBlog = await Blog.findById(foundUser.savedBlogs[i].bucketId).lean();
          let bucketIndex = foundUser.savedBlogs.findIndex(elem=> elem.bucketId.equals(foundUserCopy.savedBlogs[i].bucketId));
          if (!foundBlog) {
            changesMade = true;
            foundUser.savedBlogs.splice(bucketIndex, 1);
            i--;
            continue;
          }

          for (let j = 0; j < foundUserCopy.savedBlogs[i].blogIds.length; j++) {

            let blogIndex = foundUser.savedBlogs[bucketIndex].blogIds.findIndex(elem => elem.equals(foundUser.savedBlogs[i].blogIds[j]));
            let foundBlogIndex = foundBlog.blogs.findIndex(elem => elem._id.equals(foundUser.savedBlogs[i].blogIds[j]));
            if (foundBlogIndex === -1) {
              changesMade = true
              foundUser.savedBlogs[bucketIndex].blogIds.splice(blogIndex, 1);
              j--;
              continue;
            }

            heartedBlogIndex = foundUser.heartedBlogs.findIndex(elem => (elem.bucketId.equals(foundBlog._id) && elem.blogId.equals(foundBlog.blogs[foundBlogIndex]._id)) );
            if (heartedBlogIndex === -1) {
              foundBlog.blogs[foundBlogIndex].hearted = false;
            } else {
              foundBlog.blogs[foundBlogIndex].hearted = true;
            }

            foundBlog.blogs[foundBlogIndex].saved = true;
            foundBlog.blogs[foundBlogIndex].bucketId = foundBlog._id;
            blogs.push(foundBlog.blogs[foundBlogIndex]);
          }
        }

        const authorIds = [];
        for (let i=0; i<blogs.length; i++) {
          blog = blogs[i];
          if (blog.author) {
            idx = authorIds.findIndex(elem => elem.equals(blog.author.id));
            if (idx === -1) {
              authorIds.push(blog.author.id);
            }
          }
        }

        foundAuthor = await User.find().where('_id').in(authorIds).select('profilePic profilePicId userKeys').lean();

        for (let i=0; i<blogs.length; i++) {

          blog = blogs[i];

          if (blog.author) {

            userIndex = foundAuthor.findIndex(elem => elem._id.equals(blog.author.id));
            user = foundAuthor[userIndex];

            if(process.env.ENVIRONMENT === 'dev'){
              blog.author.profilePic = clConfig.cloudinary.url(user.profilePicId, clConfig.thumb_100_obj);
            } else if (process.env.ENVIRONMENT === 'prod'){
              blog.author.profilePic = s3Config.thumb_100_prefix+user.profilePicId;
            }

            blog.author.sex = user.userKeys.sex;

          }
        }

        if (changesMade) {
          await foundUser.save(function (err) {
            if (err) {
              logger.error(req.user._id + ' : (blog-24)saveUser err => ' + err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }
          })
        }

        res.json({ blogs: blogs, index: newBlogIndex, bucket: newBucketIndex });

      });

  },

  async blogsHeart(req, res, next) {

    const blogId = req.params.blog;
    const bucketId = req.params.bucket;

    let hearted = false;
    Blog
      .findById(bucketId)
      .exec(async function (err, foundBlog) {

        if (err || !foundBlog) {
          logger.error(req.user._id + ' : (blog-25)foundBlog err => ' + err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }

        User.
          findById(req.user._id).
          select('heartedBlogs').
          exec(async function (err, foundUser) {

            if (err || !foundUser) {
              logger.error(req.user._id + ' : (blog-26)foundUser err => ' + err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }

            const heartedBlogIndex = foundUser.heartedBlogs.findIndex(elem => elem.bucketId.equals(bucketId) && elem.blogId.equals(blogId));
            if (heartedBlogIndex !== -1) {
              foundUser.heartedBlogs.splice(heartedBlogIndex, 1);
              foundBlog.blogs.id(blogId).heartCount--;
              hearted = false;
            } else {
              foundUser.heartedBlogs.push({ bucketId: bucketId, blogId: blogId });
              foundBlog.blogs.id(blogId).heartCount++;
              hearted = true;
            }

            await foundUser.save(function (err) {
              if (err) {
                logger.error(req.user._id + ' : (blog-27)saveUser err => ' + err);
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              }
            });

            await foundBlog.save(function (err) {
              if (err) {
                logger.error(req.user._id + ' : (blog-28)saveBlog err => ' + err);
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              }
            });

            return res.json({hearted: hearted});

          });

      });

  },

  async blogsUserPage(req, res, next) {

    const oldBucketIndex = parseInt(req.query.bucket);
    const oldBlogIndex = parseInt(req.query.index);
    const userId = req.params.userId;

    User.
      findById(userId).
      select('createdBlogs').
      exec(async function (err, foundUser) {

        if (err || !foundUser) {
          logger.error(req.user._id + ' : (blog-29)foundUser err => ' + err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }

        // if user document don't have createdBlog attribute, make it
        let changesMade = false;
        if (!foundUser.createdBlogs) {
          changesMade = true;
          foundUser.createdBlogs = [];
        }
        if (changesMade) {
          foundUser.save(function (err) {
            if (err) {
              logger.error(req.user._id + ' : (blog-30)saveUser err => ' + err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }
          });
        }

        // if query is empty, that means only page renedering has to be done and no bucket needs to fetched
        if (isNaN(oldBucketIndex) || isNaN(oldBlogIndex)) {
          return res.render('blogs/user', {college: req.user.userKeys.college, bucket: foundUser.createdBlogs.length, index: 0, userId: userId});
        }

        // if all blogs have been loaded or user has no saved blogs, return null
        if ((!oldBucketIndex && !oldBlogIndex) || !foundUser.createdBlogs.length ) {
          return res.json(null);
        }

        // perform sanity checks
        if (oldBucketIndex > foundUser.createdBlogs.length || oldBucketIndex < 0) {
          req.flash('Invalid bucket');
          return res.redirect('back');
        }
        if (
          (oldBucketIndex !== foundUser.createdBlogs.length && oldBlogIndex > foundUser.createdBlogs[oldBucketIndex].blogIds.length) ||
          (oldBucketIndex === foundUser.createdBlogs.length && oldBlogIndex !== 0) ||
          (oldBlogIndex < 0)
        ) {
          req.flash('Invalid index');
          return res.redirect('back');
        }

        let newBucketIndex = oldBucketIndex;
        let newBlogIndex = oldBlogIndex;
        let count = 0;

        const foundUserCopy = JSON.parse(JSON.stringify(foundUser));

        // get pointers to bucket and blog such that it is 20 blogs behind the previously loaded bucket and blog
        while (count !== blogsToLoadCount) {

          if (newBlogIndex >= blogsToLoadCount - count) {
            newBlogIndex = newBucketIndex - blogsToLoadCount;
            break;
          }

          count += newBlogIndex;
          newBucketIndex--;
          if (newBucketIndex >= 0) {
            newBlogIndex = foundUser.createdBlogs[newBucketIndex].blogIds.length;
          } else {
            newBucketIndex = 0;
            newBlogIndex = 0;
            break;
          }

        }

        foundUserCopy.createdBlogs = foundUser.createdBlogs.slice(newBucketIndex, oldBucketIndex + 1);
        foundUserCopy.createdBlogs[0].blogIds.splice(0, newBlogIndex);
        if (newBucketIndex === oldBucketIndex) {
          foundUserCopy.createdBlogs[foundUserCopy.createdBlogs.length - 1].blogIds.splice(oldBlogIndex)
        }

        // populate those new 20 blogs and store them into array 'blogs'
        // update for any bucket or blog entry which has been deleted but still exists in savedBlogs
        // also retrieve heart count for all blogs
        const blogs = [];

        const foundCurrUser = await User.findById(req.user._id).select('savedBlogs heartedBlogs');
        changesMade = false;
        if (!foundCurrUser.heartedBlogs) {
          changesMade = true;
          foundCurrUser.heartedBlogs = [];
        }
        if (!foundCurrUser.savedBlogs) {
          changesMade = true;
          foundCurrUser.savedBlogs = [];
        }
        if (changesMade) {
          foundCurrUser.save(function (err) {
            if (err) {
              logger.error(req.user._id + ' : (blog-31)saveUser err => ' + err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }
          });
        }

        changesMade = false;
        for (let i = 0; i < foundUserCopy.createdBlogs.length; i++) {

          let foundBlog = await Blog.findById(foundUser.createdBlogs[i].bucketId).lean();
          let bucketIndex = foundUser.createdBlogs.findIndex(elem=> elem.bucketId.equals(foundUserCopy.createdBlogs[i].bucketId));
          if (!foundBlog) {
            changesMade = true;
            foundUser.createdBlogs.splice(bucketIndex, 1);
            i--;
            continue;
          }

          for (let j = 0; j < foundUserCopy.createdBlogs[i].blogIds.length; j++) {

            let blogIndex = foundUser.createdBlogs[bucketIndex].blogIds.findIndex(elem => elem.equals(foundUser.createdBlogs[i].blogIds[j]));
            let foundBlogIndex = foundBlog.blogs.findIndex(elem => elem._id.equals(foundUser.createdBlogs[i].blogIds[j]));
            if (foundBlogIndex === -1) {
              changesMade = true
              foundUser.createdBlogs[bucketIndex].blogIds.splice(blogIndex, 1);
              j--;
              continue;
            }

            heartedBlogIndex = foundCurrUser.heartedBlogs.findIndex(elem => (elem.bucketId.equals(foundBlog._id) && elem.blogId.equals(foundBlog.blogs[foundBlogIndex]._id)) );
            if (heartedBlogIndex === -1) {
              foundBlog.blogs[foundBlogIndex].hearted = false;
            } else {
              foundBlog.blogs[foundBlogIndex].hearted = true;
            }

            savedBlogIndex = foundCurrUser.savedBlogs.findIndex(function (elem) {

              if (elem.bucketId.equals(foundBlog._id)) {

                for (let z = 0; z < elem.blogIds.length; z++) {
                  if (elem.blogIds[z].equals(foundBlog.blogs[foundBlogIndex]._id)) {
                    return true;
                  }
                }

              } else {
                return false;
              }

              return false;

            });
            if (savedBlogIndex === -1) {
              foundBlog.blogs[foundBlogIndex].saved = false;
            } else {
              foundBlog.blogs[foundBlogIndex].saved = true;
            }

            foundBlog.blogs[foundBlogIndex].bucketId = foundBlog._id;

            blogs.push(foundBlog.blogs[foundBlogIndex]);
          }
        }

        const authorIds = [];
        for (let i=0; i<blogs.length; i++) {
          blog = blogs[i];
          if (blog.author) {
            idx = authorIds.findIndex(elem => elem.equals(blog.author.id));
            if (idx === -1) {
              authorIds.push(blog.author.id);
            }
          }
        }

        foundAuthor = await User.find().where('_id').in(authorIds).select('profilePic profilePicId userKeys').lean();

        for (let i=0; i<blogs.length; i++) {

          blog = blogs[i];

          if (blog.author) {

            userIndex = foundAuthor.findIndex(elem => elem._id.equals(blog.author.id));
            user = foundAuthor[userIndex];

            if(process.env.ENVIRONMENT === 'dev'){
              blog.author.profilePic = clConfig.cloudinary.url(user.profilePicId, clConfig.thumb_100_obj);
            } else if (process.env.ENVIRONMENT === 'prod'){
              blog.author.profilePic = s3Config.thumb_100_prefix+user.profilePicId;
            }

            blog.author.sex = user.userKeys.sex;

          }
        }

        if (changesMade) {
          await foundUser.save(function (err) {
            if (err) {
              logger.error(req.user._id + ' : (blog-32)saveUser err => ' + err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }
          })
        }

        res.json({ blogs: blogs, index: newBlogIndex, bucket: newBucketIndex });

      });

  },

  async blogsPublishPage(req, res, next) {

    if (!req.user.isCollegeLevelAdmin) {
      req.flash("error", "You are not authorized to approve blogs");
      return res.redirect("/");
    }

    CollegePage.
      findOne({ name: req.user.userKeys.college }).
      select('unapprovedBlogBucket').
      populate('unapprovedBlogBucket').
      lean().
      exec(async function (err, foundCollegePage) {

        if (err || !foundCollegePage) {
          logger.error(req.user._id + ' : (blog-33)foundCollegePage err => ' + err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }

        if (!foundCollegePage.unapprovedBlogBucket) {
          foundCollegePage.unapprovedBlogBucket = { blogs: [] };
        }

        const authorIds = [];
        for (let i=0; i<foundCollegePage.unapprovedBlogBucket.blogs.length; i++) {
          blog = foundCollegePage.unapprovedBlogBucket.blogs[i];
          if (blog.author) {
            idx = authorIds.findIndex(elem => elem.equals(blog.author.id));
            if (idx === -1) {
              authorIds.push(blog.author.id);
            }
          }
        }

        foundUser = await User.find().where('_id').in(authorIds).select('profilePic profilePicId userKeys').lean();

        for (let i=0; i<foundCollegePage.unapprovedBlogBucket.blogs.length; i++) {
          blog = foundCollegePage.unapprovedBlogBucket.blogs[i];
          if (blog.author) {

            userIndex = foundUser.findIndex(elem => elem._id.equals(blog.author.id));
            user = foundUser[userIndex];

            if(process.env.ENVIRONMENT === 'dev'){
              blog.author.profilePic = clConfig.cloudinary.url(user.profilePicId, clConfig.thumb_100_obj);
            } else if (process.env.ENVIRONMENT === 'prod'){
              blog.author.profilePic = s3Config.thumb_100_prefix+user.profilePicId;
            }

            blog.author.sex = user.userKeys.sex;

          }
        }

        res.render('blogs/publish_blog', { blogs: foundCollegePage.unapprovedBlogBucket.blogs, college: req.user.userKeys.college });

      });

  },

  async blogsApprove(req, res, next) {

    if (!req.user.isCollegeLevelAdmin) {
      req.flash("error", "You are not authorized to approve blogs");
      return res.redirect("/");
    }

    const blogId = req.body.blogId;

    CollegePage.
      findOne({ name: req.user.userKeys.college }).
      select('blogBuckets unapprovedBlogBucket').
      exec(async function (err, foundCollegePage) {

        if (err || !foundCollegePage) {
          logger.error(req.user._id + ' : (blog-34)foundCollegePage err => ' + err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }

        Blog.
          findById(foundCollegePage.unapprovedBlogBucket).
          exec(async function (err, foundBlog) {

            if (err || !foundBlog) {
              logger.error(req.user._id + ' : (blog-35)foundBlog err => ' + err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }

            const blogIds = foundBlog.blogs.map(elem => elem._id);
            const blogIndex = blogIds.indexOf(blogId);
            if (blogIndex === -1) {
              req.flash('error', 'Blog does not exist');
              return res.redirect('back');
            }

            const [blog] = foundBlog.blogs.splice(blogIndex, 1);
            let insertionBucketId;

            if (foundCollegePage.blogBuckets.length === 0) {

              Blog.create({
                college: req.user.userKeys.college,
                blogs: [blog],
              }, async function (err, createdBlog) {

                if (err || !createdBlog) {
                  logger.error(req.user._id + ' : (blog-36)createdBlog err => ' + err);
                  req.flash('error', 'Something went wrong :(');
                  return res.redirect('back');
                }

                insertionBucketId = createdBlog._id;
                foundCollegePage.blogBuckets.push(createdBlog._id);

                await foundCollegePage.save(function (err) {
                  if (err) {
                    logger.error(req.user._id + ' : (blog-37)saveCollegePage err => ' + err);
                    req.flash('error', 'Something went wrong :(');
                    return res.redirect('back');
                  }
                });

              });

            } else {

              Blog.
                findById(last(foundCollegePage.blogBuckets)).
                exec(async function (err, foundLastBlog) {

                  if (err || !foundLastBlog) {
                    logger.error(req.user._id + ' : (blog-38)foundBlog err => ' + err);
                    req.flash('error', 'Something went wrong :(');
                    return res.redirect('back');
                  }

                  if (foundLastBlog.blogs.length >= 20) {

                    Blog.
                      create({
                        college: req.user.userKeys.college,
                        blogs: [blog],
                      }, async function (err, createdBlog) {

                        if (err || !createdBlog) {
                          logger.error(req.user._id + ' : (blog-39)createdBlog err => ' + err);
                          req.flash('error', 'Something went wrong :(');
                          return res.redirect('back');
                        }

                        insertionBucketId = createdBlog._id;
                        foundCollegePage.blogBuckets.push(createdBlog._id);

                        await foundCollegePage.save(function (err) {
                          if (err) {
                            logger.error(req.user._id + ' : (blog-40)saveCollegePage err => ' + err);
                            req.flash('error', 'Something went wrong :(');
                            return res.redirect('back');
                          }
                        });

                      });

                  } else {

                    insertionBucketId = foundLastBlog._id;
                    foundLastBlog.blogs.push(blog);
                    
                    await foundLastBlog.save(function (err) {
                      if (err) {
                        logger.error(req.user._id + ' : (blog-41)saveBlog err => ' + err);
                        req.flash('error', 'Something went wrong :(');
                        return res.redirect('back');
                      }
                    });

                  }

                });

            }

            await foundBlog.save(function (err) {
              if (err) {
                logger.error(req.user._id + ' : (blog-42)saveBlog err => ' + err);
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              }
            });

            if (blog.author.id) {
              User.
                findById(blog.author.id).
                select('createdBlogs').
                exec(async function (err, foundUser) {

                  if (err || !foundUser) {
                    logger.error(req.user._id + ' : (blog-43)foundUser err => ' + err);
                    req.flash('error', 'Something went wrong :(');
                    return res.redirect('back');
                  }

                  if (!foundUser.createdBlogs) {

                    foundUser.createdBlogs = [{ bucketId: insertionBucketId, blogIds: [blog._id] }]

                  } else {

                    bucketIndex = foundUser.createdBlogs.findIndex(elem => (elem.bucketId.equals(insertionBucketId)));
                    if (bucketIndex === -1) {
                      foundUser.createdBlogs.push({ bucketId: insertionBucketId, blogIds: [blog._id] });
                    } else {
                      foundUser.createdBlogs[bucketIndex].blogIds.push(blog._id);
                    }

                  }

                  await foundUser.save(function (err) {
                    if (err) {
                      logger.error(req.user._id + ' : (blog-44)saveUser err => ' + err);
                      req.flash('error', 'Something went wrong :(');
                      return res.redirect('back');
                    }
                  });

                });
            }

            req.flash('success', 'Blog published successfully');
            res.redirect('back');

          });

      });

  },

  async blogsRemove(req, res, next) {

    if (!req.user.isCollegeLevelAdmin) {
      req.flash("error", "You are not authorized to approve blogs");
      return res.redirect("/");
    }

    const blogId = req.body.blogId;

    CollegePage.
      findOne({ name: req.user.userKeys.college }).
      select('unapprovedBlogBucket').
      exec(async function (err, foundCollegePage) {

        if (err || !foundCollegePage) {
          logger.error(req.user._id + ' : (blog-45)foundCollegePage err => ' + err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }

        Blog.
          findById(foundCollegePage.unapprovedBlogBucket).
          exec(async function (err, foundBlog) {

            if (err || !foundBlog) {
              logger.error(req.user._id + ' : (blog-46)foundBlog err => ' + err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }

            const blogIndex = foundBlog.blogs.findIndex(elem => (elem._id == blogId));
            if (blogIndex === -1) {
              req.flash('error', 'Blog does not exist');
              return res.redirect('back');
            }

            const [blog] = foundBlog.blogs.splice(blogIndex, 1);

            try {
              if(process.env.ENVIRONMENT === 'dev'){
                clConfig.cloudinary.v2.uploader.destroy(blog.imageId);
              } else if (process.env.ENVIRONMENT === 'prod'){
                s3Config.deleteFile(blog.imageId);
              }
            } catch (err) {
              logger.error(req.user._id + ' : (blog-47)imageDestroy err => ' + err);
            }

            await foundBlog.save(function (err) {
              if (err) {
                logger.error(req.user._id + ' : (blog-48)saveBlog err => ' + err);
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              }
            });

            req.flash('success', 'Blog deleted successfully');
            res.redirect('back');

          });

      });

  },

}

// iterate in reverse in ejs
// pass req.params.colleg_name instead of req.user.userKeys.college to ejs files
// sanity checks
