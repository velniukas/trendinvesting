var request = require('request');
var fs = require('fs');
var path = require('path');

var model = require('../models');

// TODO re-include? 
//var importer = require('../helpers/importer');
var util = require('../helpers/util');

module.exports = function() {};

// List existing all folios
module.exports.allList = function(req, res, next){
  var folio = model.folio;

  folio.find({}, function(error, folios){
    if(error) return next(error);
    res.render('folios/allList', { 
      title: 'folios',
      folios: folios
    });
  });
};

// List existing featured folios
module.exports.featuredList = function(req, res, next){
  log.profile('folio.featuredList');
  console.log('model: '+model);
  console.log('model.folio: '+model.folio);
  var folio = model.folio;
  
  folio.find({ featured : true }, function(error, folios){
    if(error) return next(error);
      log.profile('folio.featuredList');
      res.render('folios', { 
        title: 'folios',
        folios: folios
      });
    });
};

// Register for a folio (if not already registered, and Go to the last viewed or first lesson. 
/* TODO refactor for folio subscription model
module.exports.start = function(req, res, next){
  // Check if user has already started the folio
  var Progress = model.Progress;
  Progress.startOrContinue(req.user, req.folio, function(error, progress) {
    if(error) return next(error);
    // Redirect the user to first unfinished lesson
    progress.getNextLesson(function(error, nextLesson) {
      if(error) return next(error);
      res.redirect('/lesson/' + nextLesson);
    });
  });
};
*/

// Load specific folio and display tag index
module.exports.show = function(req, res, next){

    if(error) return next(error);
    res.render('folios/folioDetails', {
      title     : req.folio.title,
      tag   : undefined,
      index     : 0
    });

};
