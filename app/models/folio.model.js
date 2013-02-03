var cdn = require('../helpers/cdn');

var model = require('./index');

var async = require('async');


var methods = {
  removeFolio: function(callback) {
    var folio = this;

    function removeFolioImages(callback) {
      // Remove images
      cdn.unlinkFile(folio.iconImage, function(error){
        if(error) return callback(error);

        cdn.unlinkFile(folio.wallImage, function(error){
          if(error) return callback(error);
          folio.remove(callback);
        });
      });
    }

    // Remove tags of that folio
    if(folio.tags.length>0) {
      folio.tags[0].removeAllTagsFromThisFolio(function(error){
        if(error) return callback(error);
        removeFolioImages(callback);
      });
    } else {
      removeFolioImages(callback);
    }
  },

  publish: function(publish, callback) {
    var folio = this;
    if(publish) {
      var tagsLength = folio.tags.length;

      async.forEach(folio.tags, function(tagInst, innerCallback) {
        tagInst.publish(true, innerCallback);
      }, function(error){
        if(error) return callback(error);

        folio.status = 'published';
        folio.markModified('tags');
        folio.save(callback);
      });
    } else {
      folio.status = 'draft';
      folio.markModified('tags');
      folio.save(callback);
    }
  },

  setFeatured: function(featured, callback) {
    var folio = this;

    folio.featured = featured;
    folio.save(callback);
  }
};


module.exports = {
  name: 'Folio',
  schema: require('./schema/folio'),
  options: {
    methods: methods,
    plugins: ['id', 'timestamp', 'folio']    
  }
};