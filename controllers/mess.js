const mongoose  = require('mongoose'),

Mess = require('../models/mess');
User = require('../models/user');

const MessData = async (req,res)=>{
    const query = await Mess.find({});
    res.render('mess',{mess:query});
}
const Validation = async (req,res)=>{
    user = req.user.email;
    hostel = await Mess.distinct('hostel');
    console.log(hostel);
    const query = await User.find({email: user,isCollegeLevelAdmin: true});
    if(!query[0]){
        req.flash('error', 'You are not authorized to change the Menu');
        res.redirect('/mess');
    }
    else{
    res.render('messchange',{hostel:hostel});
    }
}

const ChangeMenu = async (req,res)=>{


            var hostel = req.body.hostel;
            var day   = req.body.day;
            var time  = req.body.time;  

            // Changing case according to the keys in database

            hostel = hostel.charAt(0).toUpperCase() + hostel.slice(1).toLowerCase();
            day = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
            time = time.charAt(0).toUpperCase() + time.slice(1).toLowerCase();

            const id = await Mess.find({"hostel":hostel,"menu.day":day,"menu.time":time},{"_id":1});
            if(!id[0]){
                req.flash('error','Invalid Details ! Could not update the Menu');
                res.redirect('/mess');
            }
            else{
            var dishArray = req.body.dishes.split(',');
            console.log(id[0]);
            const updatedDish =  await Mess.findByIdAndUpdate(id,{"menu.dishes":dishArray},{new:true},function(err,result){
                if(err){
                    res.send(err);
                }
                else{
                   req.flash('success','Mess Menu Updated');
                   res.redirect('/mess/change');
                }
            });
        }

        // console.log({csrfToken: res.locals.csrfToken});
        // res.send({"message":updatedDish});
        // res.json({csrfToken: res.locals.csrfToken});
        // req.flash('successMessage', 'Menu Changed');
        // res.send({"message":"Updated"});
    // } 
}

module.exports = {MessData,Validation,ChangeMenu};