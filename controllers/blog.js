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

    // location of last loaded blog in database
    const oldBucketIndex = req.query.bucket;
    const oldBlogIndex = req.query.index;

    CollegePage.
      findOne({ name: req.user.userKeys.college }).
      select('blogBuckets').
      exec(function (err, foundCollegePage) {

        if (err || !foundCollegePage) {
          logger.error(req.user._id + ' : (blog-5)foundCollege err => ' + err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }

        if (oldBlogIndex >= blogsToLoadCount) {

          Blog.
            findById(foundCollegePage.blogBuckets[oldBucketIndex].blogBucket).
            select('blogs').
            exec(function (err, foundBlog) {
              if (err || !foundBlog) {
                logger.error(req.user._id + ' : (blog-5)foundBlog err => ' + err);
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              }

              const newBlogBucket = oldBucketIndex;
              const newBlogIndex = oldBlogIndex - blogsToLoadCount;
              const blogs = foundBlog.blogs.slice(newBlogIndex, oldBlogIndex);
            });

        } else {

          // bucketList => list of buckets from which all blogs will be loaded
          const bucketList = []

          for (let i = oldBucketIndex - 1; i >= 0; i--) {

            let currBucketBlogCount = foundCollegePage.blogBuckets[i].bucketBlogCount;
            if (currBucketBlogCount >= remBlogCount) {
              const newBucketIndex = i;
              const newBlogIndex = currBucketBlogCount - remBlogCount;
              break;
            }
            else if (i === 0) {
              const newBucketIndex = 0;
              const newBlogIndex = 0;

            } else {
              remBlogCount -= currBucketBlogCount;
              bucketList.push(i);
            }
          }

          blogBucketsIdList = foundCollegPage.blogBuckets.slice(newBucketIndex, oldBucketIndex).map(elem => elem.blogBucket)
          console.log(blogBucketIdList);
          Blog.
            find({ _id: { $in: blogBucketsIdList } }).
            exec(function (err, foundBlog) {

              if (err || !foundBlog) {
                logger.error(req.user._id + ' : (blog-5)foundBlog err => ' + err);
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              }

              const blogs = [];
              blogs.push(foundBlog[newBucketIndex].blogs.slice(newBlogIndex));
              for (let i = bucketList.length - 1; i >= 0; i++) {
                blogs.push(...foundBlog[bucketList[i]].blogs);
              }
              blogs.push(foundBlog[oldBucketIndex].blogs.slice(0, oldBlogIndex));

            });
          
        }

        res.json({ blogs: blogs, index: newBlogIndex, bucket: newBucketIndex });

      });

  },

  async blogsCreate (req, res, next) {

    const title = req.body.title;
    const description = req.body.description;
    const image = req.body.image;
    const imageId = req.body.imageId;
    const url = req.body.url;
    const content = req.body.content;
    const readTime = req.body.readTime;
    const author = req.body.author;

    CollegePage.
      findOne({ name: req.user.userKeys.college }).
      select('blogBuckets').
      exec(function (err, foundCollegePage) {

        if(err || !foundCollegePage){
          logger.error(req.user._id+' : (blog-5)foundCollege err => '+err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }

        if (last(foundCollegePage.blogBuckets).blogCount < maxBucketSize) {

          Blog.
            findById(last(foundCollegePage.blogBuckets).blogBucket).
            exec(function (err, foundBlog) {

              if(err || !foundBlog) {
                logger.error(req.user._id+' : (blog-5)foundBlog err => '+err);
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
              foundBlog.blogCount++;

              foundBlog.save(function(err) {
                if(err){
                  logger.error(req.user._id+' : (blog-5)saveBlog err => '+err);
                  req.flash('error', 'Something went wrong :(');
                  return res.redirect('back');
                }
              });

              last(foundCollegPage.blogBuckets).blogCount++;

            })

        } else {

          Blog.
            create({
              college: req.user.userKeys.college, 
              blogCount: 1,
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

              if(err || !createdBlog){
                logger.error(req.user._id+' : (blog-5)createdBlog err => '+err);
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');

                foundCollegPage.blogBuckets.push({ 
                  bucketBlogCount: createdBlog.blogCount,
                  blogBucket: createdBlog._id,
                })

              }
            });

        }

        foundCollegePage.save(function(err) {
          if(err){
            logger.error(req.user._id+' : (blog-5)saveCollege err => '+err);
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          }
        });

        req.flash('success', 'Blog created successfully');
        res.redirect('/');

      });

  },

  async blogsDelete (req, res, next) {

    const bucketIndex = req.body.bucket;
    const blogIndex = req.body.index;

    CollegePage.
      findOne({ name: req.user.userKeys.college }).
      select('blogBuckets')
      exec(function (err, foundCollegePage) {

        if(err){
          logger.error(req.user._id+' : (blog-5)foundCollegePage err => '+err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }

        const bucket = foundCollegePage.blogBuckets[bucketIndex];

        if (bucket.bucketBlogCount > 1) {

          Blog.
            findById(bucket.blogBucket).
            exec(function (err, foundBlog) {

              if(err){
                logger.error(req.user._id+' : (blog-5)foundBlog err => '+err);
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              }

              foundBlog.blogs.splice(blogIndex, 1);
              foundBlog.blogCount--;

              foundBlog.save(function (err) {
                if(err){
                  logger.error(req.user._id+' : (blog-5)saveBlog err => '+err);
                  req.flash('error', 'Something went wrong :(');
                  return res.redirect('back');
                }
              });

            });

          bucket.bucketBlogCount--;

        } else {

          Blog.
            findByIdAndDelete(bucket.blogBucket).
            exec(function (err) {
              if(err){
                logger.error(req.user._id+' : (blog-5)deleteBlog err => '+err);
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              }
            });

          foundCollegePage.blogBuckets.splice(bucketIndex, 1);

        }

        foundCollegePage.save(function (err) {
          if(err){
            logger.error(req.user._id+' : (blog-5)saveCollege err => '+err);
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          }
        });

        req.flash('success', 'Blog deleted successfully');
        res.redirect('/');

      });

  },

  async blogsSave (req, res, next) {

    const blogId = req.query.blog;
    const bucketId = req.query.bucket;

    User.
      findById(req.user._id).
      select('savedBlogs').
      exec(function (err, foundUser) {

        if(err || !foundUser) {
          logger.error(req.user._id+' : (blog-5)foundUser err => '+err);
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
          foundUser.savedBlogs[savedBucketIndex].blogIds.push(blogId);
        }

        foundUser.save(function(err) {
          if(err) {
            logger.error(req.user._id+' : (blog-5)saveUser err => '+err);
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          }
        });

        req.flash('success', 'Blog saved successfully');

      });

  },

  async blogsSavedLoadMore (req, res, next) {

    const oldBucketIndex = req.query.bucket;
    const oldBlogIndex = req.query.index;

    User.
      findById(req.user._id).
      select('savedBlogs').
      exec(function (err, foundUser) {

        if(err || !foundUser) {
          logger.error(req.user._id+' : (blog-5)foundUser err => '+err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }

        let newBucketIndex = oldBucketIndex;
        let newBlogIndex = oldBlogIndex;
        let count = 0;

        while (count !== blogsToLoadCount || newBucketIndex !== -1) {

          if (foundUser.savedBlogs[newBucketIndex].blogIds.length >= blogsToLoadCount-count) {
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

        foundUser.savedBlogs = foundUser.savedBlogs.slice(newBucketIndex, oldBucketIndex+1);
        foundUser.savedBlogs[0].splice(0, newBlogIndex);
        foundUser.savedBlogs[foundUser.savedBlogs.length - 1].splice(oldBlogIndex);

        await foundUser.populate('savedBlogs');

        res.json({ blogs: savedBlogs, index: newBlogIndex, bucket: newBucketIndex });

      });

  },

  async blogsHeart (req, res, next) {

    const blogId = req.params.blog;
    const bucketId = req.params.bucket;

    Blog
      .findById(bucketId)
      .exec(function (err, foundBlog) {

        if(err || !foundBlog) {
          logger.error(req.user._id+' : (blog-5)foundBlog err => '+err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }

        foundBlog.blogs.id(blogId).heartCount++;

        foundBlog.save(function (err) {
          if(err) {
            logger.error(req.user._id+' : (blog-5)saveBlog err => '+err);
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          }
        });

      });

  },

  async blogsUserLoadMore (req, res, next) {

    const oldBucketIndex = req.query.bucket;
    const oldBlogIndex = req.query.index;

    User.
    findById(req.user._id).
    select('createdBlogs').
    exec(function (err, foundUser) {

      if(err || !foundUser) {
        logger.error(req.user._id+' : (blog-5)foundUser err => '+err);
        req.flash('error', 'Something went wrong :(');
        return res.redirect('back');
      }

      let newBucketIndex = oldBucketIndex;
      let newBlogIndex = oldBlogIndex;
      let count = 0;

      while (count !== blogsToLoadCount || newBucketIndex !== -1) {

        if (foundUser.createdBlogs[newBucketIndex].blogIds.length >= blogsToLoadCount-count) {
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

      foundUser.createdBlogs = foundUser.createdBlogs.slice(newBucketIndex, oldBucketIndex+1);
      foundUser.createdBlogs[0].splice(0, newBlogIndex);
      foundUser.createdBlogs[foundUser.createdBlogs.length - 1].splice(oldBlogIndex);

      await foundUser.populate('createdBlogs');

      res.json({ blogs: createdBlogs, index: newBlogIndex, bucket: newBucketIndex });

    });

  },

  async blogsApproveList (req, res, next) {



  },

  async blogsApprove (req, res, next) {



  },

}

// iterate in reverse in ejs
// isCollegeLevelAdmin
