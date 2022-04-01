const
  User = require('../models/user'),
  CollegePage = require('../models/college-page')
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

  async blogsPageLoad(req, res, next) {

    // res.render()
  },

  async blogsLoadMore(req, res, next) {

    // index of previously loaded bucket
    let bucketIndex = req.query.index;

    CollegePage.
      findOne({ name: req.user.userKeys.college }).
      select('blogBuckets').
      exec(function (err, foundCollegePage) {

        if (err || !foundCollegePage) {
          logger.error(req.user._id + ' : (blog-5)foundCollegePage err => ' + err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }

        if (bucketIndex === '' || bucketIndex === undefined) {
          bucketIndex = last(foundCollegePage.blogBuckets);
        }

        if (bucketIndex === 0) {
          res.json(null);
        }
    
        if (bucketIndex < 0) {
          req.flash('error', 'Invalid bucket');
          res.redirect('back');
        }

        if (bucketIndex > foundCollegePage.blogBuckets.length) {
          req.flash('error', 'Invalid bucket');
          res.redirect('back');
        }
        bucketIndex--;

        Blog.
          findById(foundCollegePage[bucketIndex]).
          exec(function (err, foundBlog) {

            if (err || !foundBlog) {
              logger.error(req.user._id + ' : (blog-5)foundBlog err => ' + err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }

            User.
              findById(req.user._id).
              select('savedBlogs heartedBlogs').
              exec(function (err, foundUser) {

                if (err || !foundUser) {
                  logger.error(req.user._id + ' : (blog-5)foundUser err => ' + err);
                  req.flash('error', 'Something went wrong :(');
                  return res.redirect('back');
                }

                let bucketId = foundBlog._id;
                let blogId, heartedBlogIndex, savedBucketIndex, savedBlogIndex;
                for (let i = 0; i < foundBlog.blogs.length; i++) {

                  blogId = foundBlog.blogs[i]._id;

                  heartedBlogIndex = foundUser.heartedBlogs.indexOf(elem => { return (elem.bucketId === bucketId && elem.blogId === blogId) });
                  if (heartedBlogIndex === -1) {
                    foundBlog.blogs[i].hearted = false;
                  } else {
                    foundBlog.blogs[i].hearted = true;
                  }

                  savedBucketIndex = foundUser.savedBlogs.indexOf(elem => { return (elem.bucketId === bucketId) });
                  if (savedBucketIndex === -1) {
                    foundBlog.blogs[i].saved = false;
                  } else {
                    savedBlogIndex = foundUser.savedBlogs[savedBucketIndex].blogIds.indexOf(elem => { return (elem === blogId) });
                    if (savedBlogIndex === -1) {
                      foundBlog.blogs[i].saved = false;
                    } else {
                      foundBlog.blogs[i].saved = true;
                    }
                  }

                }

                res.json({ blogBucket: foundBlog, bucket: bucketIndex })

              });

          });

      });

  },

  async blogsCreate(req, res, next) {

    const title = req.body.title;
    const description = req.body.description;
    const image = req.body.image;
    const imageId = req.body.imageId;
    const url = req.body.url;
    const content = req.body.content;
    const isNews = req.body.isNews;
    if (isNews) {
      const readTime = 0;
      const author = null;
    } else {
      const readTime = req.body.readTime;
      const author = req.user._id;
    }

    CollegePage.
      findOne({ name: req.user.userKeys.college }).
      select('blogBuckets').
      exec(function (err, foundCollegePage) {

        if (err || !foundCollegePage) {
          logger.error(req.user._id + ' : (blog-5)foundCollegePage err => ' + err);
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

            });

        } else {

          Blog.
            findById(foundCollegePage.unapprovedBlogBucket).
            exec(function (err, foundBlog) {

              if (err || !foundBlog) {
                logger.error(req.user._id + ' : (blog-5)foundBlog err => ' + err);
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
          logger.error(req.user._id + ' : (blog-5)foundBlog err => ' + err);
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
              logger.error(req.user._id + ' : (blog-5)deleteBlog err => ' + err);
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
              logger.error(req.user._id + ' : (blog-5)saveBlog err => ' + err);
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
                logger.error(req.user._id + ' : (blog-5)foundUser err => ' + err);
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
                    logger.error(req.user._id + ' : (blog-5)saveUser err => ' + err);
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
          logger.error(req.user._id + ' : (blog-5)foundUser err => ' + err);
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
            logger.error(req.user._id + ' : (blog-5)saveUser err => ' + err);
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
          logger.error(req.user._id + ' : (blog-5)foundUser err => ' + err);
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
            logger.error(req.user._id + ' : (blog-5)saveUser err => ' + err);
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          }
        });

        req.flash('success', 'Blog unsaved successfully');

      });

  },

  async blogsSavedLoadMore(req, res, next) {

    const oldBucketIndex = req.query.bucket;
    const oldBlogIndex = req.query.index;

    User.
      findById(req.user._id).
      select('savedBlogs heartedBlogs').
      exec(async function (err, foundUser) {

        if (err || !foundUser) {
          logger.error(req.user._id + ' : (blog-5)foundUser err => ' + err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }

        const foundUserCopy = JSON.parse(JSON.stringify(foundUser));

        let newBucketIndex = oldBucketIndex;
        let newBlogIndex = oldBlogIndex;
        let count = 0;

        while (count !== blogsToLoadCount || newBucketIndex !== -1) {

          if (foundUser.savedBlogs[newBucketIndex].blogIds.length >= blogsToLoadCount - count) {
            newBlogIndex = oldBlogIndex - blogsToLoadCount;
            break;
          }
          newBucketIndex--;
          count += foundUser.savedBlogs[newBucketIndex].blogIds.length;

        }

        if (newBucketIndex === -1) {
          newBucketIndex = 0;
          newBlogIndex = 0;
        }

        foundUser.savedBlogs = foundUser.savedBlogs.slice(newBucketIndex, oldBucketIndex + 1);
        foundUser.savedBlogs[0].splice(0, newBlogIndex);
        foundUser.savedBlogs[foundUser.savedBlogs.length - 1].splice(oldBlogIndex);

        await foundUser.populate('savedBlogs');

        let changesMade = false;
        for (let i = 0; i < foundUser.savedBlogs.length; i++) {

          savedBucketIndex = foundUserCopy.savedBlogs.findIndex(elem => (elem.bucketId === foundUser.savedBlogs[i]._id) );

          for (let j = 0; j < foundUser.savedBlogs[i].blogIds.length; j++) {

            if (!foundUser.savedBlogs[i].blogIds[j]) {

              foundUser.savedBlogs[i].blogIds.splice(j, 1);

              savedBlogIndex = foundUserCopy.savedBlogs[savedBucketIndex].blogIds.indexOf(foundUser.savedBlogs[i].blogIds[j]);
              foundUserCopy.savedBlogs[savedBucketIndex].blogIds.splice(savedBlogIndex, 1);

              changesMade = true;
              if (!foundUser.savedBlogs[i].blogIds.length === 0) {
                foundUser.savedBlogs.splice(i, 1);
                foundUserCopy.savedBlogs.splice(savedBucketIndex, 1);
              }

            } else {

              let heartedBlogIndex = foundUser.heartedBlogs.findIndex(elem => { return (elem.bucketId === bucketId && elem.blogId === blogId) });
              if (heartedBlogIndex === -1) {
                foundUser.savedBlogs[i].blogIds[j].hearted = false;
              } else {
                foundUser.savedBlogs[i].blogIds[j].hearted = true;
              }

            }

          }

        }

        if (changesMade) {
          await foundUserCopy.save(function (err) {
            if (err || !foundUserCopy) {
              logger.error(req.user._id + ' : (blog-5)foundUserCopy err => ' + err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }
          })
        }

        res.json({ blogs: foundUser.savedBlogs, index: newBlogIndex, bucket: newBucketIndex });

      });

  },

  async blogsHeart(req, res, next) {

    const blogId = req.params.blog;
    const bucketId = req.params.bucket;

    Blog
      .findById(bucketId)
      .exec(function (err, foundBlog) {

        if (err || !foundBlog) {
          logger.error(req.user._id + ' : (blog-5)foundBlog err => ' + err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }

        User.
          findById(req.user._id).
          select('heartedBlogs').
          exec(function (err, foundUser) {

            if (err || !foundUser) {
              logger.error(req.user._id + ' : (blog-5)foundUser err => ' + err);
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
                logger.error(req.user._id + ' : (blog-5)saveUser err => ' + err);
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              }
            });

          });

        foundBlog.save(function (err) {
          if (err) {
            logger.error(req.user._id + ' : (blog-5)saveBlog err => ' + err);
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          }
        });

      });

  },

  async blogsUserLoadMore(req, res, next) {

    const oldBucketIndex = req.query.bucket;
    const oldBlogIndex = req.query.index;
    const userId = req.params.userId;

    User.
      findById(userId).
      select('createdBlogs').
      exec(async function (err, foundUser) {

        if (err || !foundUser) {
          logger.error(req.user._id + ' : (blog-5)foundUser err => ' + err);
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

  async blogsUnapprovedList(req, res, next) {

    if (!req.user.isCollegeLevelAdmin) {
      req.flash("error", "You are not authorized to approve blogs");
      return res.redirect("/");
    }

    College.
      findOne({ name: req.user.userKeys.college }).
      select('unapprovedBlogBucket').
      populate('unapprovedBlogBucket').
      exec(function (err, foundCollegePage) {

        if (err || !foundCollegePage) {
          logger.error(req.user._id + ' : (blog-5)foundCollegePage err => ' + err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }

        res.json(foundCollegePage.unapprovedBlogBucket);

      });

  },

  async blogsApprove(req, res, next) {

    if (!req.user.isCollegeLevelAdmin) {
      req.flash("error", "You are not authorized to approve blogs");
      return res.redirect("/");
    }

    const blogId = req.query.blog;

    College.
      findOne({ name: req.user.userKeys.college }).
      select('blogBuckets unapprovedBlogBucket').
      exec(async function (err, foundCollegePage) {

        if (err || !foundCollegePage) {
          logger.error(req.user._id + ' : (blog-5)foundCollegePage err => ' + err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }

        Blog.
          findById(foundCollegePage.unapprovedBlogBucket).
          exec(async function (err, foundBlog) {

            if (err || !foundBlog) {
              logger.error(req.user._id + ' : (blog-5)foundBlog err => ' + err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }

            const blogIds = foundBlog.blogs(elem => elem._id);
            const blogIndex = blogIds.indexOf(blogId);
            if (blogIndex === -1) {
              req.flash('error', 'Blog does not exist');
              res.redirect('back');
            }

            const blog = foundBlog.blogs.splice(blogIndex, 1);

            await foundBlog.save(function (err) {
              if (err || !foundCollegePage) {
                logger.error(req.user._id + ' : (blog-5)foundCollegePage err => ' + err);
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              }
            });

            if (foundCollegePage.blogBuckets.length === 0) {

              Blog.create({
                college: req.user.userKeys.college,
                blogs: [blog],
              }, function (err, createdBlog) {

                if (err || !createdBlog) {
                  logger.error(req.user._id + ' : (blog-5)createdBlog err => ' + err);
                  req.flash('error', 'Something went wrong :(');
                  return res.redirect('back');
                }

                foundCollegePage.blogBuckets.push(createdBlog._id);

              });

            } else {

              Blog.
                findById(last(foundCollegePage.blogBuckets)).
                exec(function (err, foundBlog) {

                  if (err || !foundBlog) {
                    logger.error(req.user._id + ' : (blog-5)foundBlog err => ' + err);
                    req.flash('error', 'Something went wrong :(');
                    return res.redirect('back');
                  }

                  if (foundBlog.blogs.length >= 20) {

                    Blog.
                      create({
                        college: req.user.userKeys.college,
                        blogs: [blog],
                      }, function (err, createdBlog) {

                        if (err || !createdBlog) {
                          logger.error(req.user._id + ' : (blog-5)createdBlog err => ' + err);
                          req.flash('error', 'Something went wrong :(');
                          return res.redirect('back');
                        }

                        foundCollegePage.blogBuckets.push(createdBlog._id);

                      });

                  } else {

                    foundBlog.blogs.push(blog);

                  }

                });

            }

            req.flash('success', 'Blog published successfully');
            res.redirect('back');

          });

      });

  },

  async blogsDisapprove(req, res, next) {

    if (!req.user.isCollegeLevelAdmin) {
      req.flash("error", "You are not authorized to approve blogs");
      return res.redirect("/");
    }

    const blogId = req.query.blog;

    College.
      findOne({ name: req.user.userKeys.college }).
      select('blogBuckets unapprovedBlogBucket').
      exec(async function (err, foundCollegePage) {

        if (err || !foundCollegePage) {
          logger.error(req.user._id + ' : (blog-5)foundCollegePage err => ' + err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }

        Blog.
          findById(foundCollegePage.unapprovedBlogBucket).
          exec(async function (err, foundBlog) {

            if (err || !foundBlog) {
              logger.error(req.user._id + ' : (blog-5)foundBlog err => ' + err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }

            const blogIds = foundBlog.blogs(elem => elem._id);
            const blogIndex = blogIds.indexOf(blogId);
            if (blogIndex === -1) {
              req.flash('error', 'Blog does not exist');
              res.redirect('back');
            }

            const blog = foundBlog.blogs.splice(blogIndex, 1);

            await foundBlog.save(function (err) {
              if (err || !foundCollegePage) {
                logger.error(req.user._id + ' : (blog-5)foundCollegePage err => ' + err);
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
// isCollegeLevelAdmin