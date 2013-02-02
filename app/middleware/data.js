var async = require('async');

var model = require('../models');

module.exports = function(app) {

  // Folio
  app.param('folioId', function(req, res, next, id){
    var Folio = model.Folio;
    var Tag = model.Tag;
    Folio.findOne({ id: id })
      .populate('tags')
      .populate('created_by')
      .exec(function(error, folio) {
      if(error) return next(error);

    if(folio) {
          folio.id = parseInt(folio.id.toString(), 10);
          req.tags = tags;
          req.folio = folio;

          req.app.helpers({
            folio: folio,
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
      .populate('folio')
      .exec(function(error, tag) {
      if(error) return next(error);

      if(tag) {
        tag.id = parseInt(tag.id.toString(), 10);
        req.tag = tag;
        req.folio = tag.folio;
        req.app.helpers({
          tag: tag,
          folio: tag.folio
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