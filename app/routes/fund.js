var request = require('request');
var fs = require('fs');
var path = require('path');

var model = require('../models');

// TODO re-include? 
//var importer = require('../helpers/importer');
var util = require('../helpers/util');

module.exports = function() {};

// List existing all funds
module.exports.allList = function(req, res, next){
  var fund = model.fund;

  fund.find({}, function(error, funds){
    if(error) return next(error);
    res.render('funds/allList', { 
      title: 'funds',
      funds: funds
    });
  });
};

// List existing featured funds
module.exports.featuredList = function(req, res, next){
  log.profile('fund.featuredList');
  var fund = model.fund;
  
  fund.find({ featured : true }, function(error, funds){
    if(error) return next(error);
      log.profile('fund.featuredList');
      res.render('funds', { 
        title: 'funds',
        funds: funds
      });
    });
};

// Register for a fund (if not already registered, and Go to the last viewed or first lesson. 
/* TODO refactor for fund subscription model
module.exports.start = function(req, res, next){
  // Check if user has already started the fund
  var Progress = model.Progress;
  Progress.startOrContinue(req.user, req.fund, function(error, progress) {
    if(error) return next(error);
    // Redirect the user to first unfinished lesson
    progress.getNextLesson(function(error, nextLesson) {
      if(error) return next(error);
      res.redirect('/lesson/' + nextLesson);
    });
  });
};
*/

// Load specific fund and display tag index
module.exports.show = function(req, res, next){

    if(error) return next(error);
    res.render('funds/fundDetails', {
      title     : req.fund.title,
      tag   : undefined,
      index     : 0
    });

};
