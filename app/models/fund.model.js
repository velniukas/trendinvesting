var cdn = require('../helpers/cdn');

var model = require('./index');

var async = require('async');


var methods = {
  removeFund: function(callback) {
    var fund = this;

    function removeFundImages(callback) {
      // Remove images
      cdn.unlinkFile(fund.iconImage, function(error){
        if(error) return callback(error);

        cdn.unlinkFile(fund.wallImage, function(error){
          if(error) return callback(error);
          fund.remove(callback);
        });
      });
    }

    // Remove tags of that fund
    if(fund.tags.length>0) {
      fund.tags[0].removeAllChapterFromThisFund(function(error){
        if(error) return callback(error);
        removeFundImages(callback);
      });
    } else {
      removeFundImages(callback);
    }
  },

  publish: function(publish, callback) {
    var fund = this;
    if(publish) {
      var tagsLength = fund.tags.length;

      async.forEach(fund.tags, function(tagInst, innerCallback) {
        tagInst.publish(true, innerCallback);
      }, function(error){
        if(error) return callback(error);

        fund.status = 'published';
        fund.markModified('tags');
        fund.save(callback);
      });
    } else {
      fund.status = 'draft';
      fund.markModified('tags');
      fund.save(callback);
    }
  },

  setFeatured: function(featured, callback) {
    var fund = this;

    fund.featured = featured;
    fund.save(callback);
  }
};


module.exports = {
  name: 'Fund',
  schema: require('./schema/fund'),
  options: {
    methods: methods,
    plugins: ['id', 'timestamp', 'fund']    
  }
};