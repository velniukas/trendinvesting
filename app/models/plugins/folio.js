var fs = require('fs');
var path = require('path')

var gm = require('gm');
var mime = require('mime');
var async = require('async');

var util = require('../../helpers/util');
var cdn = require('../../helpers/cdn');

module.exports = function(schema, options) {
  schema.pre('save', function(callback) {
    var folio = this;
    var regex = new RegExp('^/cdn/');
    var options = {processIcon: false, processWall: false};

    if(!regex.test(folio.iconImage)) {
      options.processIcon = true;
    }
    if(!regex.test(folio.wallImage)) {
      options.processWall = true;
    }

    // Save image
    processImages(folio, options, callback);
  });

};


var processImages = function (folio, options, callback) {
  var now = new Date();
  var iconFileName = 'folioIconImage_' + folio.id;
  var wallFileName = 'folioWallImage_' + folio.id;
  var iconCropInfo = {
    "x": 0,
    "y": 0,
    "x2": 200,
    "y2": 200,
    "h": 200,
    "w": 200
  }
  var wallCropInfo = {
    "x": 0,
    "y": 0,
    "x2": 800,
    "y2": 450,
    "h": 450,
    "w": 800
  }
  var iconResizeInfo = {
    "w" : 200,
    "h" : 200
  };
  var wallResizeInfo = {
    "w" : 800,
    "h" : 450
  };

  var jobs = {};
  if(options.processIcon) {
    iconCropInfo = folio.cropIconImgInfo || iconCropInfo;
    if(typeof(iconCropInfo) == 'string') {
      iconCropInfo = JSON.parse(iconCropInfo);
    }
    jobs['icon'] = imageJob(folio.iconImage, iconFileName, {crop: iconCropInfo, resize: iconResizeInfo});
  }
  if(options.processWall) {
    wallCropInfo = folio.cropWallImgInfo || wallCropInfo;
    if(typeof(wallCropInfo) == 'string') {
      wallCropInfo = JSON.parse(wallCropInfo);
    }
    jobs['wall'] = imageJob(folio.wallImage, wallFileName, {crop: wallCropInfo, resize: wallResizeInfo});
  }

  async.parallel(jobs, function(error, results) {
    if(error) return callback(error);

    if(results.icon) {
      folio.iconImage = results.icon;
    }
    if(results.wall) {
      folio.wallImage = results.wall;
    }

    callback();
  });
};


var imageJob = function(imageUrl, fileName, params) {

  return function(callback){

    // Process icon image
    util.saveToDisk(imageUrl, function(error, imagePath){
      if(error) return callback(error);

      util.processImage(imagePath, params, function(error, processedImagePath) {
        var fileType = mime.extension(mime.lookup(processedImagePath));

        cdn.saveFileNew(fileName, processedImagePath, fileType, function(error){
          if(error) return callback(error);

          fs.unlink(processedImagePath, function (error) {
            if(error) return callback(error);

            callback(null, '/cdn/' + fileName);
          });
        });
      });
    });
  };
}