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
      findOne({ name: req.params.college_name }).
      select('blogBuckets').
      lean().
      exec(function (err, foundCollegePage) {

        if (err || !foundCollegePage) {
          logger.error(req.user._id + ' : (blogs-1)foundCollegePage err => ' + err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }

        // if request has no query, then render the page
        // else if it has a valid bucket and blogIndex attributes: 
        // then ajax request is sent from load more buttonm, hence send json response

        if (isNaN(bucketIndex)) {
          return res.render('blogs/index', {college: req.params.college_name, bucket: foundCollegePage.blogBuckets.length});
        }

        // if no more buckets to fetch, return null, indicating frontend to hide the "loadmore" button
        if (!bucketIndex) {
          return res.json(null);
        }

        // sanity checks
        if (bucketIndex < 0 || bucketIndex > foundCollegePage.blogBuckets.length) {
          return res.redirect('back');
        }

        // decrease bucketIndex value of "loadmore" button
        bucketIndex--;

        Blog.
        findById(foundCollegePage.blogBuckets[bucketIndex]).
        lean().
        exec(function (err, foundBlog) {

          if (err || !foundBlog) {
            logger.error(req.user._id + ' : (blogs-2)foundBlog err => ' + err);
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          }

          User.
          findById(req.user._id).
          select('savedBlogs heartedBlogs').
          exec(async function (err, foundUser) {

            if (err || !foundUser) {
              logger.error(req.user._id + ' : (blogs-3)foundUser err => ' + err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }

            // set of all authorIds for the blogs to be fetched
            const authorIds = [];
            for (let i=0; i<foundBlog.blogs.length; i++) {
              blog = foundBlog.blogs[i];
              if (!blog.isNews) {
                //  check if authorId already loaded
                idx = authorIds.findIndex(elem => elem.equals(blog.author.id));
                if (idx === -1) {
                  // if not, then load it
                  authorIds.push(blog.author.id);
                }
              }
            }

            // find all authors with id in authorIds
            foundAuthor = await User.find().where('_id').in(authorIds).select('profilePic profilePicId userKeys').lean();

            let bucketId = foundBlog._id;
            let blogId, heartedBlogIndex, savedBucketIndex, savedBlogIndex;
            for (let i = 0; i < foundBlog.blogs.length; i++) {

              blogId = foundBlog.blogs[i]._id;

              // check if user doesn't have heartedBlogs or savedBlogs attribute (added for backwards compatibility)
              let changesMade = false;
              if (!foundUser.heartedBlogs) {
                changesMade = true;
                foundUser.heartedBlogs = [];
              }
              if (!foundUser.savedBlogs) {
                changesMade = true;
                foundUser.savedBlogs = [];
              }

              // check if current blog is hearted by user
              heartedBlogIndex = foundUser.heartedBlogs.findIndex(elem => (elem.bucketId.equals(bucketId) && elem.blogId.equals(blogId)) );
              if (heartedBlogIndex === -1) {
                foundBlog.blogs[i].hearted = false;
              } else {
                foundBlog.blogs[i].hearted = true;
              }

              // check if current blog is hearted by user
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

              // populate profile pics for blog authors
              author = foundBlog.blogs[i].author;
              if (!foundBlog.blogs[i].isNews) {
                userIndex = foundAuthor.findIndex(elem => elem._id.equals(author.id));
                user = foundAuthor[userIndex];

                if(process.env.ENVIRONMENT === 'dev'){
                  author.profilePic = clConfig.cloudinary.url(user.profilePicId, clConfig.thumb_100_obj);
                } else if (process.env.ENVIRONMENT === 'prod'){
                  author.profilePic = s3Config.thumb_100_prefix+user.profilePicId;
                }

                author.sex = user.userKeys.sex;

              }

              // add bucketId as attribute to blog (so blog can be uniquely identified by blog)
              foundBlog.blogs[i].bucketId = bucketId;

              if (changesMade) {
                foundUser.save(function (err) {
                  if (err) {
                    logger.error(req.user._id + ' : (blogs-4)saveUser err => ' + err);
                    req.flash('error', 'Something went wrong :(');
                    return res.redirect('back');
                  }
                });
              }

            }

            // check if user is college admin
            let isCollegeLevelAdmin = false;
            if(req.user.isCollegeLevelAdmin === true && req.user.userKeys.college == req.params.college_name){
              isCollegeLevelAdmin = true;
            }

            return res.json({ blogs: foundBlog.blogs, bucket: bucketIndex, college: req.params.college_name, isCollegeLevelAdmin })

          });

        });

      });

  },

  async blogsCreateBlogPage(req, res, next) {

    res.render('blogs/add_blog', {college: req.params.college_name});

  },

  async blogsCreateNewsPage(req, res, next) {

    res.render('blogs/add_news', {college: req.params.college_name});

  },

  async blogsCreate(req, res, next) {

    const title = req.body.title;
    const description = req.body.description;
    const url = req.body.url;
    const urlName = req.body.urlName;
    const isNews = (req.body.isNews === 'false') ? false : true;
    const readTime = isNews ? 0 : parseInt(req.body.readTime);
    const author = {id: req.user._id, name: req.user.fullName};

    // sanity checks
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
      req.flash("error", "Please upload an image as a visual represantation of the subject");
      return res.redirect("back");
    }

    let image, imageId;

    CollegePage.
      findOne({ name: req.params.college_name }).
      select('name unapprovedBlogBucket blogBuckets').
      exec(async function (err, foundCollegePage) {

        if (err || !foundCollegePage) {
          logger.error(req.user._id + ' : (blogs-5)foundCollegePage err => ' + err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }

        blog = {
          isNews: isNews,
          title: title,
          description: description,
          image: image,
          imageId: imageId,
          url: url,
          urlName: urlName,
          readTime: readTime,
          author: author,
        };

        // upload image if blog
        if(!isNews){
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
            logger.error(req.user._id+' : (blogs-6)imageUpload err => '+err);
            req.flash('error', 'Something went wrong :(');
            return res.redirect('back');
          }
        }

        // If BLOG put it in unapprovedBlogBucket
        if(!isNews){

          // if collegePage doesn't have an unapproved Blog bucket created
          if (!foundCollegePage.unapprovedBlogBucket) {

            // create a new bucket
            Blog.
              create({
                college: req.params.college_name,
                blogs: [blog],
              }, function (err, createdBlog) {

                if (err || !createdBlog) {

                  // if error, destroy the image uploaded previously
                  try {
                    if(process.env.ENVIRONMENT === 'dev'){
                      clConfig.cloudinary.v2.uploader.destroy(imageId);
                    } else if (process.env.ENVIRONMENT === 'prod'){
                      s3Config.deleteFile(imageId);
                    }
                  } catch (err) {
                    logger.error(req.user._id + ' : (blogs-7)imageDestroy err => ' + err);
                  }

                  logger.error(req.user._id + ' : (blogs-8)createdBlog err => ' + err);
                  req.flash('error', 'Something went wrong :(');
                  return res.redirect('back');

                }

                // mark the newly created bucket as unapproved
                foundCollegePage.unapprovedBlogBucket = createdBlog._id;

                // save the new changes
                foundCollegePage.save(function (err) {
                  if (err) {
                    logger.error(req.user._id + ' : (blogs-9)saveCollegePage err => ' + err);
                    req.flash('error', 'Something went wrong :(');
                    return res.redirect('back');
                  }
                });

                req.flash('success', 'Blog created successfully');
                res.redirect('back');

              });

          } else {
            // else if unapproved blog bucket already exists

            Blog.
              findById(foundCollegePage.unapprovedBlogBucket).
              exec(function (err, foundBlog) {

                if (err || !foundBlog) {
                  logger.error(req.user._id + ' : (blogs-10)foundBlog err => ' + err);
                  req.flash('error', 'Something went wrong :(');
                  return res.redirect('back');
                }

                // push the new blog to the unapproved blog bucket
                foundBlog.blogs.push(blog);

                foundBlog.save(function (err) {
                  if (err) {

                    // if error, destroy the image uploaded previously
                    try {
                      if(process.env.ENVIRONMENT === 'dev'){
                        clConfig.cloudinary.v2.uploader.destroy(imageId);
                      } else if (process.env.ENVIRONMENT === 'prod'){
                        s3Config.deleteFile(imageId);
                      }
                    } catch (err) {
                      logger.error(req.user._id + ' : (blogs-11)imageDestroy err => ' + err);
                    }

                    logger.error(req.user._id + ' : (blogs-12)saveBlog err => ' + err);
                    req.flash('error', 'Something went wrong :(');
                    return res.redirect('back');
                    
                  }

                  req.flash('success', 'Blog created successfully');
                  return res.redirect('back');
                });

              });

          }
        
        } else {
          // If NEWS directly put in approvedBlogBucket i.e. inside blogBuckets

          // TODO: check if admin

          // if there are zero blog buckets
          if (foundCollegePage.blogBuckets.length === 0) {

            // create a new blog bucket
            Blog.create({
              college: req.params.college_name,
              blogs: [blog],
            }, async function (err, createdBlog) {

              if (err || !createdBlog) {
                logger.error(req.user._id + ' : (blogs-13)createdBlog err => ' + err);
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              }

              // add the id of blog bucket to the blogBuckets list in college page
              insertionBucketId = createdBlog._id;
              foundCollegePage.blogBuckets.push(createdBlog._id);

              // save the changes
              await foundCollegePage.save(function (err) {
                if (err) {
                  logger.error(req.user._id + ' : (blogs-14)saveCollegePage err => ' + err);
                  req.flash('error', 'Something went wrong :(');
                  return res.redirect('back');
                }
              });

            });

          } else {
            // else if blog buckets exist on college page

            Blog.
              findById(last(foundCollegePage.blogBuckets)).
              exec(async function (err, foundLastBlog) {

                if (err || !foundLastBlog) {
                  logger.error(req.user._id + ' : (blogs-15)foundBlog err => ' + err);
                  req.flash('error', 'Something went wrong :(');
                  return res.redirect('back');
                }

                // check if the blog bucket is full
                if (foundLastBlog.blogs.length >= 20) {

                  // if full, then create a new blog bucket
                  Blog.
                    create({
                      college: req.params.college_name,
                      blogs: [blog],
                    }, async function (err, createdBlog) {

                      if (err || !createdBlog) {
                        logger.error(req.user._id + ' : (blogs-16)createdBlog err => ' + err);
                        req.flash('error', 'Something went wrong :(');
                        return res.redirect('back');
                      }

                      // and add the new bucket to the blogBuckets list in college page
                      insertionBucketId = createdBlog._id;
                      foundCollegePage.blogBuckets.push(createdBlog._id);

                      // save the changes
                      await foundCollegePage.save(function (err) {
                        if (err) {
                          logger.error(req.user._id + ' : (blogs-17)saveCollegePage err => ' + err);
                          req.flash('error', 'Something went wrong :(');
                          return res.redirect('back');
                        }
                      });

                    });

                } else {
                  // else if bucket exists and is not full

                  // add blog to latest bucket in blogBuckets list in college
                  insertionBucketId = foundLastBlog._id;
                  foundLastBlog.blogs.push(blog);
                  
                  // save changes
                  await foundLastBlog.save(function (err) {
                    if (err) {
                      logger.error(req.user._id + ' : (blogs-18)saveBlog err => ' + err);
                      req.flash('error', 'Something went wrong :(');
                      return res.redirect('back');
                    }
                  });

                }

              });

              req.flash('success', 'News created successfully');
              res.redirect('/colleges/'+ foundCollegePage.name +'/blogs')

          }
          
        }

      });

  },

  async blogsDelete(req, res, next) {

    const bucketId = req.params.bucket_id;
    const blogId = req.params.blog_id;
    let blogAuthor = null;
    let isNews = false;

    Blog.
      findById(bucketId).
      exec(async function (err, foundBlog) {

        if (err || !foundBlog) {
          logger.error(req.user._id + ' : (blogs-19)foundBlog err => ' + err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }

        // locate index of blog in found blog bucket
        const blogIndex = foundBlog.blogs.findIndex(elem => elem._id.equals(blogId));
        if (blogIndex === -1) {

          req.flash('error', 'Blog does not exist');
          res.redirect('back');

        } else if (foundBlog.blogs.length <= 1) {
          // if bucket has only 1 blog which is about to be deleted, then:

          blogAuthor = foundBlog.blogs[0].author;

          // delete the image of blog
          try {
            if(process.env.ENVIRONMENT === 'dev'){
              clConfig.cloudinary.v2.uploader.destroy(foundBlog.blogs[0].imageId);
            } else if (process.env.ENVIRONMENT === 'prod'){
              s3Config.deleteFile(foundBlog.blogs[0].imageId);
            }
          } catch (err) {
            logger.error(req.user._id + ' : (blogs-20)imageDestroy err => ' + err);
          }

          // delete the blog bucket
          await Blog.findByIdAndDelete(bucketId, async function (err) {

            if (err) {
              logger.error(req.user._id + ' : (blogs-21)deleteBlog err => ' + err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }

            // remove id of deleted blog bucket from blogBuckets list of blogs
            await CollegePage.findOneAndUpdate({ name: req.params.college_name }, { $pull: { blogBuckets: bucketId } }).exec(function (err) {
              if (err) {
                logger.error(req.user._id + ' : (blogs-22)saveCollegePage err => ' + err);
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              }
            });

          });

        } else {
          // else if current blog bucket has other blogs: 


          blogAuthor = foundBlog.blogs[blogIndex].author;
          if (foundBlog.blogs[blogIndex].isNews) {
            isNews = true;
          }

          // remove the blog to be deleted from the current blog bucket
          foundBlog.blogs.splice(blogIndex, 1);

          // destroy the image
          try {
            if(process.env.ENVIRONMENT === 'dev'){
              clConfig.cloudinary.v2.uploader.destroy(foundBlog.blogs[blogIndex].imageId);
            } else if (process.env.ENVIRONMENT === 'prod'){
              s3Config.deleteFile(foundBlog.blogs[blogIndex].imageId);
            }
          } catch (err) {
            logger.error(req.user._id + ' : (blogs-23)imageDestroy err => ' + err);
          }

          // save the changes
          foundBlog.save(function (err) {
            if (err) {
              logger.error(req.user._id + ' : (blogs-24)saveBlog err => ' + err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }
          });

        }

        // if is a Blog
        if (!isNews) {

          // find blog author
          User.
            findById(blogAuthor.id).
            select('createdBlogs').
            exec(function (err, foundUser) {

              if (err || !foundUser) {
                logger.error(req.user._id + ' : (blogs-25)foundUser err => ' + err);
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              }

              // remove the blog id from list of created blogs for user
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

                // save the changes
                foundUser.save(function (err) {
                  if (err) {
                    logger.error(req.user._id + ' : (blogs-26)saveUser err => ' + err);
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

    const blogId = req.params.blog_id;
    const bucketId = req.params.bucket_id;

    let saved = true;
    User.
      findById(req.user._id).
      select('savedBlogs').
      exec(async function (err, foundUser) {

        if (err || !foundUser) {
          logger.error(req.user._id + ' : (blogs-27)foundUser err => ' + err);
          return res.sendStatus(500);
        }

        // check if blog is saved: if so, unsave it
        const savedBucketIndex = foundUser.savedBlogs.findIndex(elem => elem.bucketId.equals(bucketId));

        if (savedBucketIndex !== -1) {
          const savedBlogIndex = foundUser.savedBlogs[savedBucketIndex].blogIds.findIndex(elem => elem.equals(blogId));
          if (savedBlogIndex !== -1) {
            foundUser.savedBlogs[savedBucketIndex].blogIds.splice(savedBlogIndex, 1);
            // mark blog as unsaved (to be sent to frontend)
            saved = false;
          }
          if (foundUser.savedBlogs[savedBucketIndex].blogIds.length === 0) {
            foundUser.savedBlogs.splice(savedBucketIndex, 1);
          }
        }

        // if blog has not been marked unsaved previously, then it needs to saved
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

        // save changes
        await foundUser.save(function (err) {
          if (err) {
            logger.error(req.user._id + ' : (blogs-28)saveUser err => ' + err);
            return res.sendStatus(500);
          }
        });
        
        return res.json({ saved: saved });

      });

  },

  async blogsSavedPage(req, res, next) {

    // pointers to last previously loaded blog and the bucket to which it belongs
    const oldBucketIndex = parseInt(req.query.bucket);
    const oldBlogIndex = parseInt(req.query.index);

    User.
      findById(req.user._id).
      select('savedBlogs heartedBlogs').
      exec(async function (err, foundUser) {

        if (err || !foundUser) {
          logger.error(req.user._id + ' : (blogs-29)foundUser err => ' + err);
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
              logger.error(req.user._id + ' : (blogs-30)saveUser err => ' + err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }
          });
        }

        // if query is empty, that means only page renedering has to be done and no bucket needs to fetched
        if (isNaN(oldBucketIndex) || isNaN(oldBlogIndex)) {
          return res.render('blogs/saved', {college: req.params.college_name, bucket: foundUser.savedBlogs.length, index: 0});
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

        // create a copy of foundUser
        const foundUserCopy = JSON.parse(JSON.stringify(foundUser));

        // update pointers to bucket and blog such that 
        // they are 20 blogs behind (since we are traversing in reverse)
        // the previous, already loaded blog pointers

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
            // if blog has been deleted: remove it from list of saved blogs for user
            if (foundBlogIndex === -1) {
              changesMade = true
              foundUser.savedBlogs[bucketIndex].blogIds.splice(blogIndex, 1);
              j--;
              continue;
            }

            // add hearted? attribute to fetched blogs
            heartedBlogIndex = foundUser.heartedBlogs.findIndex(elem => (elem.bucketId.equals(foundBlog._id) && elem.blogId.equals(foundBlog.blogs[foundBlogIndex]._id)) );
            if (heartedBlogIndex === -1) {
              foundBlog.blogs[foundBlogIndex].hearted = false;
            } else {
              foundBlog.blogs[foundBlogIndex].hearted = true;
            }

            // mark all blogs saved? attribute as true
            foundBlog.blogs[foundBlogIndex].saved = true;

            // add bucketId attribute to blogs so they can be uniquely identified
            foundBlog.blogs[foundBlogIndex].bucketId = foundBlog._id;

            blogs.push(foundBlog.blogs[foundBlogIndex]);
          }
        }

        // load author ids for all BLOGs
        const authorIds = [];
        for (let i=0; i<blogs.length; i++) {
          blog = blogs[i];
          if (!blog.isNews) {
            idx = authorIds.findIndex(elem => elem.equals(blog.author.id));
            if (idx === -1) {
              authorIds.push(blog.author.id);
            }
          }
        }

        // populate profile pics and sex attribute for all BLOGs authors
        foundAuthor = await User.find().where('_id').in(authorIds).select('profilePic profilePicId userKeys').lean();

        for (let i=0; i<blogs.length; i++) {

          blog = blogs[i];

          if (!blog.isNews) {

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

        // save changes if made
        if (changesMade) {
          await foundUser.save(function (err) {
            if (err) {
              logger.error(req.user._id + ' : (blogs-31)saveUser err => ' + err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }
          })
        }
        
        res.json({ blogs: blogs, index: newBlogIndex, bucket: newBucketIndex, college: req.params.college_name, isCollegeLevelAdmin: false });

      });

  },

  async blogsHeart(req, res, next) {

    const blogId = req.params.blog_id;
    const bucketId = req.params.bucket_id;

    let hearted = false;
    let heartCount = 0;
    Blog
      .findById(bucketId)
      .exec(async function (err, foundBlog) {

        if (err || !foundBlog) {
          logger.error(req.user._id + ' : (blogs-32)foundBlog err => ' + err);
          return res.sendStatus(500);
        }

        User.
          findById(req.user._id).
          select('heartedBlogs').
          exec(async function (err, foundUser) {

            if (err || !foundUser) {
              logger.error(req.user._id + ' : (blogs-33)foundUser err => ' + err);
              return res.sendStatus(500);
            }

            // if blog is hearted, unheart it
            // if blog is unhearted, heart it
            // modify the heart count respectively

            const heartedBlogIndex = foundUser.heartedBlogs.findIndex(elem => elem.bucketId.equals(bucketId) && elem.blogId.equals(blogId));
            if (heartedBlogIndex !== -1) {
              foundUser.heartedBlogs.splice(heartedBlogIndex, 1);
              foundBlog.blogs.id(blogId).heartCount--;
              hearted = false;
              heartCount = foundBlog.blogs.id(blogId).heartCount;
            } else {
              foundUser.heartedBlogs.push({ bucketId: bucketId, blogId: blogId });
              foundBlog.blogs.id(blogId).heartCount++;
              hearted = true;
              heartCount = foundBlog.blogs.id(blogId).heartCount;
            }

            // save changes
            await foundUser.save(function (err) {
              if (err) {
                logger.error(req.user._id + ' : (blogs-34)saveUser err => ' + err);
                return res.sendStatus(500);
              }
            });

            await foundBlog.save(function (err) {
              if (err) {
                logger.error(req.user._id + ' : (blogs-35)saveBlog err => ' + err);
                return res.sendStatus(500);
              }
            });

            return res.json({hearted, heartCount});

          });

      });

  },

  async blogsUserPage(req, res, next) {

    const oldBucketIndex = parseInt(req.query.bucket);
    const oldBlogIndex = parseInt(req.query.index);
    const userId = req.params.user_id;

    User.
      findById(userId).
      select('createdBlogs').
      exec(async function (err, foundUser) {

        if (err || !foundUser) {
          logger.error(req.user._id + ' : (blogs-36)foundUser err => ' + err);
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
              logger.error(req.user._id + ' : (blogs-37)saveUser err => ' + err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }
          });
        }

        // if query is empty, that means only page renedering has to be done and no bucket needs to fetched
        if (isNaN(oldBucketIndex) || isNaN(oldBlogIndex)) {
          return res.render('blogs/user', {college: req.params.college_name, bucket: foundUser.createdBlogs.length, index: 0, userId: userId});
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

        // update pointers to bucket and blog such that 
        // they are 20 blogs behind (since we are traversing in reverse)
        // the previous, already loaded blog pointers
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
              logger.error(req.user._id + ' : (blogs-38)saveUser err => ' + err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }
          });
        }

        changesMade = false;
        for (let i = 0; i < foundUserCopy.createdBlogs.length; i++) {

          let foundBlog = await Blog.findById(foundUser.createdBlogs[i].bucketId).lean();
          let bucketIndex = foundUser.createdBlogs.findIndex(elem=> elem.bucketId.equals(foundUserCopy.createdBlogs[i].bucketId));
          // if blog has been deleted: remove it from list of saved blogs for user
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

            // add hearted? attribute to fetched blogs
            heartedBlogIndex = foundCurrUser.heartedBlogs.findIndex(elem => (elem.bucketId.equals(foundBlog._id) && elem.blogId.equals(foundBlog.blogs[foundBlogIndex]._id)) );
            if (heartedBlogIndex === -1) {
              foundBlog.blogs[foundBlogIndex].hearted = false;
            } else {
              foundBlog.blogs[foundBlogIndex].hearted = true;
            }

            // add saved? attribute to fetched blogs
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

            // add bucketId attribute to blogs so they can be uniquely identified
            foundBlog.blogs[foundBlogIndex].bucketId = foundBlog._id;

            blogs.push(foundBlog.blogs[foundBlogIndex]);
          }
        }

        // load author ids of all BLOGs
        const authorIds = [];
        for (let i=0; i<blogs.length; i++) {
          blog = blogs[i];
          if (!blog.isNews) {
            idx = authorIds.findIndex(elem => elem.equals(blog.author.id));
            if (idx === -1) {
              authorIds.push(blog.author.id);
            }
          }
        }

        // populate the profile pics and sex attribute for all such BLOGs author
        foundAuthor = await User.find().where('_id').in(authorIds).select('profilePic profilePicId userKeys').lean();

        for (let i=0; i<blogs.length; i++) {

          blog = blogs[i];

          if (!blog.isNews) {

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

        // save changes
        if (changesMade) {
          await foundUser.save(function (err) {
            if (err) {
              logger.error(req.user._id + ' : (blogs-39)saveUser err => ' + err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }
          })
        }

        res.json({ blogs: blogs, index: newBlogIndex, bucket: newBucketIndex, college: req.params.college_name, isCollegeLevelAdmin: false });

      });

  },

  async blogsPublishPage(req, res, next) {

    CollegePage.
      findOne({ name: req.params.college_name }).
      select('unapprovedBlogBucket').
      populate('unapprovedBlogBucket').
      lean().
      exec(async function (err, foundCollegePage) {

        if (err || !foundCollegePage) {
          logger.error(req.user._id + ' : (blogs-40)foundCollegePage err => ' + err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }

        // if college page doesn't have an unapproved blog bucket: create it
        if (!foundCollegePage.unapprovedBlogBucket) {
          foundCollegePage.unapprovedBlogBucket = { blogs: [] };
        }

        // load all ids of BLOG authors
        const authorIds = [];
        for (let i=0; i<foundCollegePage.unapprovedBlogBucket.blogs.length; i++) {
          blog = foundCollegePage.unapprovedBlogBucket.blogs[i];
          if (!blog.isNews) {
            idx = authorIds.findIndex(elem => elem.equals(blog.author.id));
            if (idx === -1) {
              authorIds.push(blog.author.id);
            }
          }
        }

        // populate profile pics and sex attribute for such BLOG authors
        foundUser = await User.find().where('_id').in(authorIds).select('profilePic profilePicId userKeys').lean();

        for (let i=0; i<foundCollegePage.unapprovedBlogBucket.blogs.length; i++) {
          blog = foundCollegePage.unapprovedBlogBucket.blogs[i];
          if (!blog.isNews) {

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
        res.render('blogs/publish', { blogs: foundCollegePage.unapprovedBlogBucket.blogs, college: req.params.college_name });

      });

  },

  async blogsApprove(req, res, next) {

    const blogId = req.body.blogId;

    CollegePage.
      findOne({ name: req.params.college_name }).
      select('blogBuckets unapprovedBlogBucket').
      exec(async function (err, foundCollegePage) {

        if (err || !foundCollegePage) {
          logger.error(req.user._id + ' : (blogs-41)foundCollegePage err => ' + err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }

        Blog.
          findById(foundCollegePage.unapprovedBlogBucket).
          exec(async function (err, foundBlog) {

            if (err || !foundBlog) {
              logger.error(req.user._id + ' : (blogs-42)foundBlog err => ' + err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }

            // sanity checks
            const blogIndex = foundBlog.blogs.findIndex(elem => elem._id.equals(blogId));
            if (blogIndex === -1) {
              req.flash('error', 'Blog does not exist');
              return res.redirect('back');
            }

            // remove blog from unapproved blog bucket
            const [blog] = foundBlog.blogs.splice(blogIndex, 1);
            let insertionBucketId;

            // if college doesn't have any blog buckets:
            if (foundCollegePage.blogBuckets.length === 0) {

              // create a new bucket with blog to be added
              Blog.create({
                college: req.params.college_name,
                blogs: [blog],
              }, async function (err, createdBlog) {

                if (err || !createdBlog) {
                  logger.error(req.user._id + ' : (blogs-43)createdBlog err => ' + err);
                  req.flash('error', 'Something went wrong :(');
                  return res.redirect('back');
                }

                // add id of blog bucket to blogBuckets list of college page
                insertionBucketId = createdBlog._id;
                foundCollegePage.blogBuckets.push(createdBlog._id);

                // save changes
                await foundCollegePage.save(function (err) {
                  if (err) {
                    logger.error(req.user._id + ' : (blogs-44)saveCollegePage err => ' + err);
                    req.flash('error', 'Something went wrong :(');
                    return res.redirect('back');
                  }
                });

              });

            } else {
              // else if blog buckets exist for college

              Blog.
                findById(last(foundCollegePage.blogBuckets)).
                exec(async function (err, foundLastBlog) {

                  if (err || !foundLastBlog) {
                    logger.error(req.user._id + ' : (blogs-45)foundBlog err => ' + err);
                    req.flash('error', 'Something went wrong :(');
                    return res.redirect('back');
                  }

                  // check if latest blog bucket is filled, if so then:
                  if (foundLastBlog.blogs.length >= 20) {

                    // create a new bucket with the blog to be added
                    Blog.
                      create({
                        college: req.params.college_name,
                        blogs: [blog],
                      }, async function (err, createdBlog) {

                        if (err || !createdBlog) {
                          logger.error(req.user._id + ' : (blogs-46)createdBlog err => ' + err);
                          req.flash('error', 'Something went wrong :(');
                          return res.redirect('back');
                        }

                        // add bucket id to the blogBuckets list of college page
                        insertionBucketId = createdBlog._id;
                        foundCollegePage.blogBuckets.push(createdBlog._id);

                        // save changes
                        await foundCollegePage.save(function (err) {
                          if (err) {
                            logger.error(req.user._id + ' : (blogs-47)saveCollegePage err => ' + err);
                            req.flash('error', 'Something went wrong :(');
                            return res.redirect('back');
                          }
                        });

                      });

                  } else {
                    // else if latest blog bucket of college page is not filled: 

                    // add blog to it
                    insertionBucketId = foundLastBlog._id;
                    foundLastBlog.blogs.push(blog);
                    
                    // save changes
                    await foundLastBlog.save(function (err) {
                      if (err) {
                        logger.error(req.user._id + ' : (blogs-48)saveBlog err => ' + err);
                        req.flash('error', 'Something went wrong :(');
                        return res.redirect('back');
                      }
                    });

                  }

                });

            }

            // save changes
            await foundBlog.save(function (err) {
              if (err) {
                logger.error(req.user._id + ' : (blogs-49)saveBlog err => ' + err);
                req.flash('error', 'Something went wrong :(');
                return res.redirect('back');
              }
            });

            // add the newly created blog id to list of created blogs in author's user document

            if (!blog.isNews) {
              User.
                findById(blog.author.id).
                select('createdBlogs').
                exec(async function (err, foundUser) {

                  if (err || !foundUser) {
                    logger.error(req.user._id + ' : (blogs-50)foundUser err => ' + err);
                    req.flash('error', 'Something went wrong :(');
                    return res.redirect('back');
                  }

                  // if createdBlogs attribute doesn't exist: create it
                  if (!foundUser.createdBlogs) {

                    foundUser.createdBlogs = [{ bucketId: insertionBucketId, blogIds: [blog._id] }]

                  } else {
                    // else add blog id and bucket id to list of created blogs by user

                    bucketIndex = foundUser.createdBlogs.findIndex(elem => (elem.bucketId.equals(insertionBucketId)));
                    if (bucketIndex === -1) {
                      foundUser.createdBlogs.push({ bucketId: insertionBucketId, blogIds: [blog._id] });
                    } else {
                      foundUser.createdBlogs[bucketIndex].blogIds.push(blog._id);
                    }

                  }

                  // save changes
                  await foundUser.save(function (err) {
                    if (err) {
                      logger.error(req.user._id + ' : (blogs-51)saveUser err => ' + err);
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

    const blogId = req.body.blogId;

    CollegePage.
      findOne({ name: req.params.college_name }).
      select('unapprovedBlogBucket').
      exec(async function (err, foundCollegePage) {

        if (err || !foundCollegePage) {
          logger.error(req.user._id + ' : (blogs-52)foundCollegePage err => ' + err);
          req.flash('error', 'Something went wrong :(');
          return res.redirect('back');
        }

        Blog.
          findById(foundCollegePage.unapprovedBlogBucket).
          exec(async function (err, foundBlog) {

            if (err || !foundBlog) {
              logger.error(req.user._id + ' : (blogs-53)foundBlog err => ' + err);
              req.flash('error', 'Something went wrong :(');
              return res.redirect('back');
            }

            // sanity check
            const blogIndex = foundBlog.blogs.findIndex(elem => (elem._id == blogId));
            if (blogIndex === -1) {
              req.flash('error', 'Blog does not exist');
              return res.redirect('back');
            }

            // remove blog from the unapproved blog bucket
            const [blog] = foundBlog.blogs.splice(blogIndex, 1);

            // destroy the blog image
            try {
              if(process.env.ENVIRONMENT === 'dev'){
                clConfig.cloudinary.v2.uploader.destroy(blog.imageId);
              } else if (process.env.ENVIRONMENT === 'prod'){
                s3Config.deleteFile(blog.imageId);
              }
            } catch (err) {
              logger.error(req.user._id + ' : (blogs-54)imageDestroy err => ' + err);
            }

            // save chages
            await foundBlog.save(function (err) {
              if (err) {
                logger.error(req.user._id + ' : (blogs-55)saveBlog err => ' + err);
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

// TODO: add check if blog is BLOG and not NEWS, before destroying images when removing/deleting/creating them
// otherwise an error will be logged, since it won't be able to upload "null"