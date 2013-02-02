var fs = require('fs');
var spawn = require('child_process').spawn;
var path = require('path');

var async = require('async');
var jsyaml = require('js-yaml');
var _ = require('lodash');
var filed = require('filed');
var rimraf = require("rimraf");

var model = require('../models');
var importer = require('../helpers/importer');
var cdn = require('../helpers/cdn');
var util = require('../helpers/util');



/*********************************************
**********************************************
**                                          **
**  Fund Operations                       **
**                                          **
**********************************************
*********************************************/


/************************************
** Show Main Page of Fund Editor **
************************************/
module.exports.fundsList = function(req, res, next){
  var Fund = model.Fund;
  if(typeof(req.user)=='undefined'){
    return res.redirect('/');
  }
  Fund.find({})
    .populate('created_by')
    .exec(function(error, funds) {
      if(error) return next(error);
      res.render('fund_editor', {
        funds : funds,
        user: req.user
      });
  });
};

/************************************
** Create fund view              **
************************************/
module.exports.createView = function(req, res, next){
  res.render('fund_editor/fund/create', {
    title: 'New Fund',
    fund: {_id:'',title:'',description:''}
  });
};

/************************************
** Submit created fund           **
************************************/
module.exports.create = function(req, res, next){
  var Fund = model.Fund;

  var fund = new Fund();
  fund.title = req.body.title;
  fund.desc = req.body.description;
  fund.iconImage = req.body.iconImage;
  fund.cropIconImgInfo = req.body.cropIconImgInfo;
  fund.wallImage = req.body.wallImage;
  fund.cropWallImgInfo = req.body.cropWallImgInfo;
  fund.created_by = req.user._id;

  // Saves Created Fund
  fund.save(function(error) {
    if(error) return next(error);

    var id = fund.id;

    //Set the fund info in the session to let socket.io know about it.
    req.session.newFund = {title: fund.title, _id: fund._id};
    req.session.message = "Fund created successfully.";
    res.redirect('/fund_editor/fund/' + id);
  });

};

/************************************
** Show a single fund            **
************************************/
module.exports.fund = function(req, res, next){

  res.render('fund_editor/fund', {
    title: req.fund.title,
    tag: undefined,
    index :0
  });
};

/************************************
** Show import fund view         **
************************************/
module.exports.importView = function(req, res, next){
  res.render('fund_editor/fund/importView');
};

/**************************************************
**   Edit / Update Fund View                   **
**************************************************/
module.exports.updateView = function(req, res, next){
  res.render('fund_editor/fund/edit', {
    title: req.fund.title
  });
};

/**************************************************
**  Submit updation of fund                    **
**************************************************/
module.exports.update = function(req, res, next){
  var fund = req.fund;
  fund.title = req.body.title;
  fund.desc = req.body.description;
  fund.image = req.body.image;

  fund.save(function(error) {
    if(error) return next(error);
    req.session.message = "Fund updated sucessfully.";
    res.redirect('/fund_editor/fund/' + fund.id);
  });
};


module.exports.remove = function(req, res, next){
  var Progress = model.Progress;

  var fund = req.fund;
  var fund_id = fund._id;

  fund.removeFund(function(error){
    if(error) return next(error);
    Progress.removeFundProgress(fund_id, function(error){
      if(error) return next(error);
      req.session.message = "Sucessfully fund removed.";
      res.redirect('/fund_editor');
    });
  });
};

// Publish a fund
module.exports.publish = function(req, res, next) {
  var fund = req.fund;

  fund.publish(true, function(error) {
    if(error) return next(error);
    req.session.message = "Fund published sucessfully.";
    res.redirect('/fund_editor');
  });
};

// unpublish a fund
module.exports.unpublish = function(req, res, next) {
  var fund = req.fund;
  
  fund.publish(false, function(error) {
    if(error) return next(error);
    req.session.message = "Fund unpublished sucessfully.";
    res.redirect('/fund_editor');
  });

};

// Featured a fund
module.exports.featured = function(req, res, next) {
  var fund = req.fund;
  fund.setFeatured(true, function(error) {
    if(error) return next(error);
    req.session.message = "Fund featured sucessfully.";
    res.redirect('/fund_editor');
  });
};

// Unfeatured a fund
module.exports.unfeatured = function(req, res, next) {
  var fund = req.fund;
  
  fund.setFeatured(false, function(error) {
    if(error) return next(error);
    req.session.message = "Fund unfeatured sucessfully.";
    res.redirect('/fund_editor');
  });
};


/*********************************************
**                                          **
**  Tag Operations                      **
**                                          **
*********************************************/

module.exports.tagView = function (req, res, next) {
  res.render('fund_editor/tag', {
    title: req.tag.title
  });
};

module.exports.tagEditView = function(req, res, next) {
  res.render('fund_editor/tag/edit', {
    title: req.tag.title
  });
};

// Save edited tag
module.exports.tagEdit = function(req, res, next){
  var tag = req.tag;

  tag.title = req.body.title;
  tag.desc = req.body.description;

  tag.save(function(error) {
    if(error) return next(error);
    req.session.message = "Chaper updated sucessfully.";
    res.redirect('/fund_editor/tag/' + tag.id);
  });
};


// Create new tag form
module.exports.tagCreateView = function(req, res, next){
  res.render('fund_editor/tag/create', {
    title: 'New Tag',
    tag: {id: '', title: ''}
  });
};

// Create a new tag
module.exports.tagCreate = function(req, res, next){
  var Tag = model.Tag;

  var tag = new Tag();
  tag.title = req.body.title;
  tag.desc = req.body.description;
  tag.fund = req.fund._id;
  tag.created_by = req.user.id;

  tag.save(function(error) {
    if(error) return next(error);

    req.session.message = "Chaper created sucessfully.";
    res.redirect('/fund_editor/fund/' + req.fund.id);
  });
};

module.exports.tagRemove = function(req, res, next) {

  var tag = req.tag;
  var fundId =req.tag.fund.id;

  tag.removeTag(function(error) {
    if(error) return next(error);
    req.session.message = "Chaper deleted sucessfully.";
    res.redirect('/fund_editor/fund/'+ fundId);
  });
};

// Publish a tag
module.exports.tagPublish = function(req, res, next) {
  var tag = req.tag;

  tag.publish(true, function(error) {
    if(error) return next(error);
    req.session.message = "Tag published sucessfully.";
    res.redirect('/fund_editor/fund/' + tag.fund.id);
  });
};

// unpublish a tag
module.exports.tagUnpublish = function(req, res, next) {
  var tag = req.tag;
  tag.publish(false, function(error) {
    if(error) return next(error);
    req.session.message = "Tag unpublished sucessfully.";
    res.redirect('/fund_editor/fund/' + tag.fund.id);
  });
};


// For Move up & Down Tags
/*
module.exports.tagUp = function(req, res, next){
  var tag = req.tag;

  tag.move(0, function(error) {
    if(error) return next(error);
    req.session.message = "Chaper moved sucessfully.";
    res.redirect('/fund_editor/fund/' + tag.fund.id);
  });
};

module.exports.tagDown = function(req, res, next){
   var tag = req.tag;

  tag.move(1, function(error) {
    if(error) return next(error);
    req.session.message = "Chaper moved sucessfully.";
    res.redirect('/fund_editor/fund/' + tag.fund.id);
  });
};
*/


/*********************************************
**********************************************
**                                          **
**  Export Fund                           **
**                                          **
**********************************************
*********************************************/

module.exports.exportFund = function(req, res, next) {

  importer.exportFullFund(req.fund, function(error, path, title){
      if(error) return next(error);
      res.setHeader('Content-Disposition', 'attachment; filename=' + title + '.zip');
      res.setHeader('Content-Type', 'application/zip');
      res.on('end', function() {
        console.log('Response Stream Ended.');
      });
      var reader = filed(path+"/"+title+".zip");
      reader.on('end', function() {
        console.log('File Stream Ended.');
        console.log(path);
        rimraf(path, next);
      });
      log.info("Streaing file...");
      reader.pipe(res);
  });
};

/*********************************************
**********************************************
**                                          **
**  Import Fund                           **
**                                          **
**********************************************
*********************************************/

module.exports.importFund = function(req, res, next) {

  // UnZip imported file
  var file = req.files['fund-file'];
  importer.importFullFund(file, req.user, function(error){
    if(error) return next(error);
    req.session.message = "Fund imported successfully.";
    res.redirect('/fund_editor'); 
  });

};