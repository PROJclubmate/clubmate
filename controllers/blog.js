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
          return res.render('blogs/index', {college: req.user.userKeys.college, bucket: foundCollegePage.blogBuckets.length});
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
          exec(function (err, foundUser) {

            if (err || !foundUser) {
              logger.error(req.user._id + ' : (blog-3)foundUser err => ' + err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }

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

              heartedBlogIndex = foundUser.heartedBlogs.findIndex(elem => (elem.bucketId === bucketId && elem.blogId === blogId) );
              if (heartedBlogIndex === -1) {
                foundBlog.blogs[i].hearted = false;
              } else {
                foundBlog.blogs[i].hearted = true;
              }

              savedBucketIndex = foundUser.savedBlogs.findIndex(elem => (elem.bucketId === bucketId));
              if (savedBucketIndex === -1) {
                foundBlog.blogs[i].saved = false;
              } else {
                savedBlogIndex = foundUser.savedBlogs[savedBucketIndex].blogIds.findIndex(elem => (elem === blogId));
                if (savedBlogIndex === -1) {
                  foundBlog.blogs[i].saved = false;
                } else {
                  foundBlog.blogs[i].saved = true;
                }
              }

              if (changesMade) {
                foundUser.save(function (err) {
                  if (err) {
                    logger.error(req.user._id + ' : (blog-2)saveUser err => ' + err);
                    req.flash('error', 'Something went wrong :(');
                    return res.redirect('back');
                  }
                });
              }

            }

            return res.json({ blogBucket: foundBlog, bucket: bucketIndex })

          });

        });

      });

  },

  async blogsCreatePage(req, res, next) {

    res.render('blogs/new', {college: req.user.userKeys.college});

  },

  async blogsCreate(req, res, next) {

    const title = req.body.title;
    const description = req.body.description;
    const image = req.body.image ? req.body.image : null;
    const imageId = req.body.imageId ? req.body.image: null;
    const url = req.body.url;
    const content = req.body.content ? req.body.content : null;
    const isNews = (req.body.isNews === 'false') ? false : true;
    const readTime = isNews ? 0 : parseInt(req.body.readTime);
    const author = isNews ? null : {id: req.user._id, name: req.user.fullName};

    if (!title || !description || !url || isNaN(readTime)) {
      req.flash('success', 'Invalid read time');
      return res.redirect('back');
    }

    CollegePage.
      findOne({ name: req.user.userKeys.college }).
      select('unapprovedBlogBucket blogBuckets').
      exec(function (err, foundCollegePage) {

        if (err || !foundCollegePage) {
          logger.error(req.user._id + ' : (blog-4)foundCollegePage err => ' + err);
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
                content: content,
                readTime: readTime,
                author: author,
              }],
            }, function (err, createdBlog) {

              if (err || !createdBlog) {
                logger.error(req.user._id + ' : (blog-5)createdBlog err => ' + err);
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              }

              foundCollegePage.unapprovedBlogBucket = createdBlog._id;


              foundCollegePage.save(function (err) {
                if (err) {
                  logger.error(req.user._id + ' : (blog-9)saveCollegePage err => ' + err);
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
                logger.error(req.user._id + ' : (blog-6)foundBlog err => ' + err);
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              }

              foundBlog.blogs.push({
                title: title,
                description: description,
                image: image,
                imageId: imageId,
                url: url,
                content: content,
                readTime: readTime,
                author: author,
              });

              foundBlog.save(function (err) {
                if (err) {
                  logger.error(req.user._id + ' : (blog-9)saveBlog err => ' + err);
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

    Blog.
      findById(bucketId).
      exec(function (err, foundBlog) {

        if (err || !foundBlog) {
          logger.error(req.user._id + ' : (blog-7)foundBlog err => ' + err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }

        const blogIds = foundBlog.blogs.map(elem => elem._id);
        const blogIndex = blogIds.indexOf(blogId);
        if (blogIndex === -1) {

          req.flash('error', 'Blog does not exist');
          res.redirect('back');

        } else if (foundBlog.blogs.length <= 1) {

          const blogAuthor = foundBlog.blogs[0].author;

          Blog.findByIdAndDelete(bucketId, function (err) {

            if (err) {
              logger.error(req.user._id + ' : (blog-8)deleteBlog err => ' + err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }

            College.findOneAndUpdate({ name: req.user.userKeys.college }, { $pull: { blogBuckets: bucketId } });

          });

        } else {

          const blogAuthor = foundBlog.blogs[blogIndex].author;

          foundBlog.blogs.splice(blogIndex, 1);

          foundBlog.save(function (err) {
            if (err) {
              logger.error(req.user._id + ' : (blog-9)saveBlog err => ' + err);
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
                logger.error(req.user._id + ' : (blog-10)foundUser err => ' + err);
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              }

              const bucketIds = foundUser.createdBlogs.map(elem => elem.bucketId);
              const bucketIndex = foundUser.createdBlogs.indexOf(bucketId);

              if (bucketIndex !== -1) {

                if (foundUser.createdBlogs[bucketIndex].length <= 1) {

                  foundUser.createdBlogs.splice(bucketIndex, 1);

                } else {

                  const blogIds = foundUser.createdBlogs[bucketIndex].blogIds;
                  const blogIndex = blogIds.indexOf(blogId);

                  if (blogIndex !== -1) {
                    foundUser.createdBlogs[bucketIndex].blogIds.splice(blogIndex, 1);
                  }

                }

                foundUser.save(function (err) {
                  if (err) {
                    logger.error(req.user._id + ' : (blog-11)saveUser err => ' + err);
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

    User.
      findById(req.user._id).
      select('savedBlogs').
      exec(function (err, foundUser) {

        if (err || !foundUser) {
          logger.error(req.user._id + ' : (blog-12)foundUser err => ' + err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }

        const savedBucketIds = foundUser.savedBlogs.map(elem => elem.bucketId);
        const savedBucketIndex = savedBucketIds.indexOf(bucketIndex);

        if (savedBucketIndex === -1) {
          foundUser.savedBlogs.push({
            bucketId: bucketId,
            blogIds: [blogId],
          });
        } else {
          const savedBlogIndex = foundUser.savedBlogs[savedBucketIndex].blogIds.indexOf(blogId);
          if (savedBlogIndex === -1) {
            foundUser.savedBlogs[savedBucketIndex].blogIds.push(blogId);
          }
        }

        foundUser.save(function (err) {
          if (err) {
            logger.error(req.user._id + ' : (blog-13)saveUser err => ' + err);
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          }
        });

        req.flash('success', 'Blog saved successfully');

      });

  },

  async blogsUnsave(req, res, next) {

    const blogId = req.params.blog;
    const bucketId = req.params.bucket;

    User.
      findById(req.user._id).
      select('savedBlogs').
      exec(function (err, foundUser) {

        if (err || !foundUser) {
          logger.error(req.user._id + ' : (blog-14)foundUser err => ' + err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }

        const savedBucketIds = foundUser.savedBlogs.map(elem => elem.bucketId);
        const savedBucketIndex = savedBucketIds.indexOf(bucketIndex);

        if (savedBucketIndex !== -1) {
          const savedBlogIndex = foundUser.savedBlogs[savedBucketIndex].blogIds.indexOf(blogId);
          if (savedBlogIndex !== -1) {
            foundUser.savedBlogs[savedBucketIndex].blodIds.splice(savedBlogIndex, 1);
          }
          if (foundUser.savedBlogs[savedBucketIndex].blogIds.length === 0) {
            foundUser.savedBlogs.splice(savedBucketIndex, 1);
          }
        }

        foundUser.save(function (err) {
          if (err) {
            logger.error(req.user._id + ' : (blog-15)saveUser err => ' + err);
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          }
        });

        req.flash('success', 'Blog unsaved successfully');

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
          logger.error(req.user._id + ' : (blog-16)foundUser err => ' + err);
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
              logger.error(req.user._id + ' : (blog-16)saveUser err => ' + err);
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
        const bucketIds = foundUser.savedBlogs.map(elem => elem.bucketId);

        changesMade = false;
        for (let i = 0; i < foundUser.savedBlogs.length; i++) {

          const foundBlog = await Blog.findById(foundUser.savedBlogs[i].bucketId).lean();
          if (!foundBlog) {
            changesMade = true;
            foundUser.savedBlogs.splice(i, 1);
            i--;
            continue;
          }

          for (let j = 0; j < foundUser.savedBlogs[i].blogIds.length; j++) {

            let blogIndex = foundBlog.blogs.findIndex(elem => elem._id.equals(foundUser.savedBlogs[i].blogIds[j]));
            if (blogIndex === -1) {
              changesMade = true
              foundUser.savedBlogs[i].blogIds.splice(j, 1);
              j--;
              continue;
            }

            heartedBlogIndex = foundUser.heartedBlogs.findIndex(elem => (elem.bucketId === foundBlog._id && elem.blogId === foundBlog.blogs[blogIndex]._id) );
            if (heartedBlogIndex === -1) {
              foundBlog.blogs[blogIndex].hearted = false;
            } else {
              foundBlog.blogs[blogIndex].hearted = true;
            }

            foundBlog.blogs[blogIndex].saved = true;
            blogs.push(foundBlog.blogs[blogIndex]);
          }
        }

        if (changesMade) {
          await foundUser.save(function (err) {
            if (err) {
              logger.error(req.user._id + ' : (blog-17)saveUser err => ' + err);
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

    Blog
      .findById(bucketId)
      .exec(function (err, foundBlog) {

        if (err || !foundBlog) {
          logger.error(req.user._id + ' : (blog-18)foundBlog err => ' + err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }

        User.
          findById(req.user._id).
          select('heartedBlogs').
          exec(function (err, foundUser) {

            if (err || !foundUser) {
              logger.error(req.user._id + ' : (blog-19)foundUser err => ' + err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }

            const [heartedBlog] = foundUser.heartedBlogs.filter(elem => { return (elem.bucketId === bucketId && elem.blogId === blogId) });
            if (heartedBlog) {
              const heartedBlogIndex = foundUser.heartedBlogs.findIndex(elem => { return (elem.bucketId === bucketId && elem.blogId === blogId) });
              foundUser.heartedBlogs.splice(heartedBlogIndex, 1);
              foundBlog.blogs.id(blogId).heartCount--;
            } else {
              foundUser.heartedBlogs.push({ bucketId: bucketId, blogId: blogId });
              foundBlog.blogs.id(blogId).heartCount++;
            }

            foundUser.save(function (err) {
              if (err) {
                logger.error(req.user._id + ' : (blog-20)saveUser err => ' + err);
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              }
            });

          });

        foundBlog.save(function (err) {
          if (err) {
            logger.error(req.user._id + ' : (blog-21)saveBlog err => ' + err);
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          }
        });

      });

  },

  async blogsUserPage(req, res, next) {

    const oldBucketIndex = req.query.bucket;
    const oldBlogIndex = req.query.index;
    const userId = req.params.userId;

    User.
      findById(userId).
      select('createdBlogs').
      exec(async function (err, foundUser) {

        if (err || !foundUser) {
          logger.error(req.user._id + ' : (blog-22)foundUser err => ' + err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }

        let newBucketIndex = oldBucketIndex;
        let newBlogIndex = oldBlogIndex;
        let count = 0;

        while (count !== blogsToLoadCount || newBucketIndex !== -1) {

          if (foundUser.createdBlogs[newBucketIndex].blogIds.length >= blogsToLoadCount - count) {
            newBlogIndex = oldBlogIndex - blogsToLoadCount;
            break;
          }
          newBucketIndex--;
          count += foundUser.createdBlogs[newBucketIndex].blogIds.length;

        }

        if (newBucketIndex === -1) {
          newBucketIndex = 0;
          newBlogIndex = 0;
        }

        foundUser.createdBlogs = foundUser.createdBlogs.slice(newBucketIndex, oldBucketIndex + 1);
        foundUser.createdBlogs[0].splice(0, newBlogIndex);
        foundUser.createdBlogs[foundUser.createdBlogs.length - 1].splice(oldBlogIndex);

        await foundUser.populate('createdBlogs');

        User.
          findById(req.user._id).
          select('heartedBlogs savedBlogs').
          exec(function (err, foundCurrUser) {

            let blogId, bucketId;
            for (let i = 0; i < foundUser.createdBlogs.length; i++) {

              bucketId = foundUser.createdBlogs[i].bucketId._id;

              for (let j = 0; j < foundUser.createdBlogs[i].blogIds.length; j++) {

                blogId = foundUser.createdBlogs[i].blogIds[j]._id;

                heartedBlogIndex = foundCurrUser.heartedBlogs.findIndex(elem => { return (elem.bucketId === bucketId && elem.blogId === blogId) });
                if (heartedBlogIndex === -1) {
                  foundUser.savedBlogs[i].blogIds[j].hearted = false;
                } else {
                  foundUser.savedBlogs[i].blogIds[j].hearted = true;
                }

                savedBucketIndex = foundUser.savedBlogs.indexOf(elem => { return (elem.bucketId === bucketId) });
                  if (savedBucketIndex === -1) {
                    foundUser.savedBlogs[i].blogIds[j].saved = false;
                  } else {
                    savedBlogIndex = foundUser.savedBlogs[savedBucketIndex].blogIds.indexOf(elem => { return (elem === blogId) });
                    if (savedBlogIndex === -1) {
                      foundUser.savedBlogs[i].blogIds[j].saved = false;
                    } else {
                      foundUser.savedBlogs[i].blogIds[j].saved = true;
                    }
                  }



              }
            }

          });



        res.json({ blogs: createdBlogs, index: newBlogIndex, bucket: newBucketIndex });

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
      exec(function (err, foundCollegePage) {

        if (err || !foundCollegePage) {
          logger.error(req.user._id + ' : (blog-23)foundCollegePage err => ' + err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }

        if (!foundCollegePage.unapprovedBlogBucket) {
          foundCollegePage.unapprovedBlogBucket = { blogs: [] };
        }

        res.render('blogs/publish', { blogs: foundCollegePage.unapprovedBlogBucket.blogs, college: req.user.userKeys.college });

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
          logger.error(req.user._id + ' : (blog-24)foundCollegePage err => ' + err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }

        Blog.
          findById(foundCollegePage.unapprovedBlogBucket).
          exec(async function (err, foundBlog) {

            if (err || !foundBlog) {
              logger.error(req.user._id + ' : (blog-25)foundBlog err => ' + err);
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

            if (foundCollegePage.blogBuckets.length === 0) {

              Blog.create({
                college: req.user.userKeys.college,
                blogs: [blog],
              }, async function (err, createdBlog) {

                if (err || !createdBlog) {
                  logger.error(req.user._id + ' : (blog-27)createdBlog err => ' + err);
                  req.flash('error', 'Something went wrong :(');
                  return res.redirect('back');
                }

                foundCollegePage.blogBuckets.push(createdBlog._id);

                await foundCollegePage.save(function (err) {
                  if (err) {
                    logger.error(req.user._id + ' : (blog-29)saveCollegePage err => ' + err);
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
                    logger.error(req.user._id + ' : (blog-28)foundBlog err => ' + err);
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
                          logger.error(req.user._id + ' : (blog-29)createdBlog err => ' + err);
                          req.flash('error', 'Something went wrong :(');
                          return res.redirect('back');
                        }

                        foundCollegePage.blogBuckets.push(createdBlog._id);

                        await foundCollegePage.save(function (err) {
                          if (err) {
                            logger.error(req.user._id + ' : (blog-29)saveCollegePage err => ' + err);
                            req.flash('error', 'Something went wrong :(');
                            return res.redirect('back');
                          }
                        });

                      });

                  } else {

                    foundLastBlog.blogs.push(blog);
                    
                    await foundLastBlog.save(function (err) {
                      if (err) {
                        logger.error(req.user._id + ' : (blog-29)saveBlog err => ' + err);
                        req.flash('error', 'Something went wrong :(');
                        return res.redirect('back');
                      }
                    });

                  }

                });

            }

            await foundBlog.save(function (err) {
              if (err) {
                logger.error(req.user._id + ' : (blog-29)saveBlog err => ' + err);
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
                    logger.error(req.user._id + ' : (blog-29)foundUser err => ' + err);
                    req.flash('error', 'Something went wrong :(');
                    return res.redirect('back');
                  }

                  if (!foundUser.createdBlogs) {

                    foundUser.createdBlogs = [{ bucketId: foundBlog._id, blogIds: [blog._id] }]

                  } else {

                    bucketIndex = foundUser.createdBlogs.findIndex(elem => (elem.bucketId.equals(foundBlog._id)));
                    if (bucketIndex === -1) {
                      foundUser.createdBlogs.push({ bucketId: foundBlog._id, blogIds: [blog._id] });
                    } else {
                      foundUser.createdBlogs[bucketIndex].blogIds.push(blog._id);
                    }

                  }

                  await foundUser.save(function (err) {
                    if (err) {
                      logger.error(req.user._id + ' : (blog-29)saveUser err => ' + err);
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
          logger.error(req.user._id + ' : (blog-30)foundCollegePage err => ' + err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }

        Blog.
          findById(foundCollegePage.unapprovedBlogBucket).
          exec(async function (err, foundBlog) {

            if (err || !foundBlog) {
              logger.error(req.user._id + ' : (blog-31)foundBlog err => ' + err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }

            const blogIndex = foundBlog.blogs.findIndex(elem => (elem._id == blogId));
            if (blogIndex === -1) {
              req.flash('error', 'Blog does not exist');
              return res.redirect('back');
            }

            const blog = foundBlog.blogs.splice(blogIndex, 1);

            await foundBlog.save(function (err) {
              if (err) {
                logger.error(req.user._id + ' : (blog-32)saveBlog err => ' + err);
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
