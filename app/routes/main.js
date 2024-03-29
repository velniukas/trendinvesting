var model = require('../models');

var util = require('../helpers/util');

module.exports = function() {};

// Miscellaneous routes
module.exports.home = function(req, res, next){
  res.render('main', {
    title: 'TRENDinvesting Home', 
    folionav: "N",
    Folio: '',
    Unit: ''
  });
};

module.exports.about = function(req, res, next){
  res.render('about', {
    title: 'TRENDinvesting About',
    folionav: "N",
    text: 'TRENDinvesting - Creating the next generation of expert developers and engineers.'
  });
};

module.exports.registerView = function(req, res, next) {
  if(req.isAuthenticated() && !req.user.email) {
    res.render('users/register', {
      layout: '',
      title: 'Register'
    });
  } else {
    util.redirectBackOrHome(req, res);
  }
};

module.exports.register = function(req, res, next) {
  var user = model.User;
  
  var email = req.body.email;

  // Check for existing accounts based on current email
  User.findOne({ email: email }, function(error, user) {
    if(error) return next(error);

    if(!user) {
      // Save email address in current user
      user = req.user;
      user.email = email;
      user.save(function(error) {
        if(error) return next(error);

        util.redirectBackOrHome(req, res);
      });
    } else {
      // Merge existing user with current user
      var currentUser = req.user;

      var userObj = user.toObject();
      delete userObj._id;
      delete userObj.id;

      currentUser = util.json.merge(currentUser, userObj);
      currentUser.save(function(error) {
        if(error) return next(error);

        // Delete existing user
        user.remove(function(error) {
          if(error) return next(error);
  
          util.redirectBackOrHome(req, res);
        });
      });
    }
  });
};

