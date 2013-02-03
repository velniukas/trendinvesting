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
**  Folio Operations                       **
**                                          **
**********************************************
*********************************************/


/************************************
** Show Main Page of Folio Editor **
************************************/
module.exports.foliosList = function(req, res, next){
  var Folio = model.Folio;
  if(typeof(req.user)=='undefined'){
    return res.redirect('/');
  }
  Folio.find({})
    .populate('created_by')
    .exec(function(error, folios) {
      if(error) return next(error);
      res.render('folio_editor', {
        folios : folios,
        user: req.user
      });
  });
};

/************************************
** Create folio view              **
************************************/
module.exports.createView = function(req, res, next){
  res.render('folio_editor/folio/create', {
    title: 'New Folio',
    folio: {_id:'',title:'',description:''}
  });
};

/************************************
** Submit created folio           **
************************************/
module.exports.create = function(req, res, next){
  var Folio = model.Folio;

  var folio = new Folio();
  folio.title = req.body.title;
  folio.desc = req.body.description;
  folio.iconImage = req.body.iconImage;
  folio.cropIconImgInfo = req.body.cropIconImgInfo;
  folio.wallImage = req.body.wallImage;
  folio.cropWallImgInfo = req.body.cropWallImgInfo;
  folio.created_by = req.user._id;

  // Saves Created Folio
  folio.save(function(error) {
    if(error) return next(error);

    var id = folio.id;

    //Set the folio info in the session to let socket.io know about it.
    req.session.newFolio = {title: folio.title, _id: folio._id};
    req.session.message = "Folio created successfully.";
    res.redirect('/folio_editor/folio/' + id);
  });

};

/************************************
** Show a single folio            **
************************************/
module.exports.folio = function(req, res, next){

  res.render('folio_editor/folio', {
    title: req.folio.title,
    tag: undefined,
    index :0
  });
};

/************************************
** Show import folio view         **
************************************/
module.exports.importView = function(req, res, next){
  res.render('folio_editor/folio/importView');
};

/**************************************************
**   Edit / Update Folio View                   **
**************************************************/
module.exports.updateView = function(req, res, next){
  res.render('folio_editor/folio/edit', {
    title: req.folio.title
  });
};

/**************************************************
**  Submit updation of folio                    **
**************************************************/
module.exports.update = function(req, res, next){
  var folio = req.folio;
  folio.title = req.body.title;
  folio.desc = req.body.description;
  folio.image = req.body.image;

  folio.save(function(error) {
    if(error) return next(error);
    req.session.message = "Folio updated sucessfully.";
    res.redirect('/folio_editor/folio/' + folio.id);
  });
};


module.exports.remove = function(req, res, next){
  var Progress = model.Progress;

  var folio = req.folio;
  var folio_id = folio._id;

  folio.removeFolio(function(error){
    if(error) return next(error);
    Progress.removeFolioProgress(folio_id, function(error){
      if(error) return next(error);
      req.session.message = "Sucessfully folio removed.";
      res.redirect('/folio_editor');
    });
  });
};

// Publish a folio
module.exports.publish = function(req, res, next) {
  var folio = req.folio;

  folio.publish(true, function(error) {
    if(error) return next(error);
    req.session.message = "Folio published sucessfully.";
    res.redirect('/folio_editor');
  });
};

// unpublish a folio
module.exports.unpublish = function(req, res, next) {
  var folio = req.folio;
  
  folio.publish(false, function(error) {
    if(error) return next(error);
    req.session.message = "Folio unpublished sucessfully.";
    res.redirect('/folio_editor');
  });

};

// Featured a folio
module.exports.featured = function(req, res, next) {
  var folio = req.folio;
  folio.setFeatured(true, function(error) {
    if(error) return next(error);
    req.session.message = "Folio featured sucessfully.";
    res.redirect('/folio_editor');
  });
};

// Unfeatured a folio
module.exports.unfeatured = function(req, res, next) {
  var folio = req.folio;
  
  folio.setFeatured(false, function(error) {
    if(error) return next(error);
    req.session.message = "Folio unfeatured sucessfully.";
    res.redirect('/folio_editor');
  });
};


/*********************************************
**                                          **
**  Tag Operations                      **
**                                          **
*********************************************/

module.exports.tagView = function (req, res, next) {
  res.render('folio_editor/tag', {
    title: req.tag.title
  });
};

module.exports.tagEditView = function(req, res, next) {
  res.render('folio_editor/tag/edit', {
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
    res.redirect('/folio_editor/tag/' + tag.id);
  });
};


// Create new tag form
module.exports.tagCreateView = function(req, res, next){
  res.render('folio_editor/tag/create', {
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
  tag.folio = req.folio._id;
  tag.created_by = req.user.id;

  tag.save(function(error) {
    if(error) return next(error);

    req.session.message = "Chaper created sucessfully.";
    res.redirect('/folio_editor/folio/' + req.folio.id);
  });
};

module.exports.tagRemove = function(req, res, next) {

  var tag = req.tag;
  var folioId =req.tag.folio.id;

  tag.removeTag(function(error) {
    if(error) return next(error);
    req.session.message = "Chaper deleted sucessfully.";
    res.redirect('/folio_editor/folio/'+ folioId);
  });
};

// Publish a tag
module.exports.tagPublish = function(req, res, next) {
  var tag = req.tag;

  tag.publish(true, function(error) {
    if(error) return next(error);
    req.session.message = "Tag published sucessfully.";
    res.redirect('/folio_editor/folio/' + tag.folio.id);
  });
};

// unpublish a tag
module.exports.tagUnpublish = function(req, res, next) {
  var tag = req.tag;
  tag.publish(false, function(error) {
    if(error) return next(error);
    req.session.message = "Tag unpublished sucessfully.";
    res.redirect('/folio_editor/folio/' + tag.folio.id);
  });
};


// For Move up & Down Tags
/*
module.exports.tagUp = function(req, res, next){
  var tag = req.tag;

  tag.move(0, function(error) {
    if(error) return next(error);
    req.session.message = "Chaper moved sucessfully.";
    res.redirect('/folio_editor/folio/' + tag.folio.id);
  });
};

module.exports.tagDown = function(req, res, next){
   var tag = req.tag;

  tag.move(1, function(error) {
    if(error) return next(error);
    req.session.message = "Chaper moved sucessfully.";
    res.redirect('/folio_editor/folio/' + tag.folio.id);
  });
};
*/


/*********************************************
**********************************************
**                                          **
**  Export Folio                           **
**                                          **
**********************************************
*********************************************/

module.exports.exportFolio = function(req, res, next) {

  importer.exportFullFolio(req.folio, function(error, path, title){
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
**  Import Folio                           **
**                                          **
**********************************************
*********************************************/

module.exports.importFolio = function(req, res, next) {

  // UnZip imported file
  var file = req.files['folio-file'];
  importer.importFullFolio(file, req.user, function(error){
    if(error) return next(error);
    req.session.message = "Folio imported successfully.";
    res.redirect('/folio_editor'); 
  });

};