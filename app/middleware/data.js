var async = require('async');

var model = require('../models');

module.exports = function(app) {

  // Fund
  app.param('fundId', function(req, res, next, id){
    var Fund = model.Fund;
    var Tag = model.Tag;
    Fund.findOne({ id: id })
      .populate('tags')
      .populate('created_by')
      .exec(function(error, fund) {
      if(error) return next(error);

    if(fund) {
          fund.id = parseInt(fund.id.toString(), 10);
          req.tags = tags;
          req.fund = fund;

          req.app.helpers({
            fund: fund,
            tags: tags
          });
      	}

        next();
    });
  });

  // Tag
  app.param('tagId', function(req, res, next, id){
  var Tag = model.Tag;
    var Tag = model.Tag;

    Tag.findOne({ id: id })
      .populate('fund')
      .exec(function(error, tag) {
      if(error) return next(error);

      if(tag) {
        tag.id = parseInt(tag.id.toString(), 10);
        req.tag = tag;
        req.fund = tag.fund;
        req.app.helpers({
          tag: tag,
          fund: tag.fund
        });
      }

      next();
    });
  });


  // User
  app.param('userId', function(req, res, next, id){
    var User = model.User;

    User.findOne({ id: id }, function(error, user) {
      if(error) return next(error);

      if(user) {
        req.extUser = user;
        req.app.helpers({
          extUser: user
        });
      }
     
      next();
    });
  });

  
};