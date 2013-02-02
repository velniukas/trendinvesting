var async = require('async');

var model = require('./index');


var methods = {
  publish: function(publish, callback) {
    var Tag = model.Tag;
    var tag = this;
    if(publish) {
      Tag.findById(tag._id)
      .populate('lessons')
      .exec(function(error, tag) {
        if(error) return callback(error);

        var lessonsLength = tag.lessons.length;
        async.forEach(tag.lessons, function(lessonInst, innerCallback) {
            lessonInst.status = "published";
            lessonInst.save(innerCallback);
        }, function(error){
          if(error) return callback(error);

          tag.status = 'published';
          tag.markModified('lessons');

          tag.save(callback);
        });
      });

    } else {
      tag.status = 'draft';
      tag.save(callback);
    } 
  },

  removeTag: function(callback) {
    var Tag = model.Tag;
    var Fund = model.Fund;

    // TODO: Remove all child 
    Tag.findById(this._id)
      .populate('lessons')
      .exec(function(error, tag){
      if(error) return callback(error);

      // For Remove Tag _Id from Fund Table
      Fund.findById(tag.fund, function(error, fund){
        if(error) return callback(error);

        fund.tags.splice(fund.tags.indexOf(tag._id),1);
        fund.markModified('tags');
        fund.save(function(error){
          if(error) return callback(error);

          if(tag.lessons.length>0){     
            tag.lessons[0].removeAllLessonsFromThisTag(function(error){
              if(error) return callback(error);
    
              return tag.remove(callback);
            });      
          } else {
            tag.remove(callback);
          }
        });
      });
    });
  },

  removeAllTagFromThisFund: function(callback) {
    var Tag = model.Tag;
    var refTag = this;

    Tag.find({fund:refTag.fund})
      .populate('lessons')
      .exec(function(error, tags){
      if(error) return callback(error);
        
      if(tags.length>0){
        async.forEach(tags, function(tag, forEachCallback){
          tag.removeTag(forEachCallback);
        }, function(error){
          if(error) return callback(error);
          Tag.remove({fund:refTag.fund}, callback);
        });
      } else {
        callback();
      }
    });
  },

  // For Move Up & Down Tag
  move: function(index, callback){

    var tag = this ;
    var temp;
    var fund = tag.fund;
    for (var i = 0 ; i < fund.tags.length; i++) {
      if(fund.tags[i].toString() == tag._id.toString()) {
        if(index === 0) {
          if(i-1 >= 0) {
              temp = fund.tags[i];
              fund.tags[i] = fund.tags[i-1];
              fund.tags[i-1] = temp;
              break;
            }
        }  
        else if(index == 1) {
        
          if(i+1 <= fund.tags.length) {
              temp = fund.tags[i];
              fund.tags[i] = fund.tags[i+1];
              fund.tags[i+1] = temp;
          break;
            }
        }      
      }
    }
    fund.markModified('tags');
    fund.save(callback);
  }
};

module.exports = {
  name: 'Tag',
  schema: require('./schema/tag'),
  options: {
    methods: methods,
    plugins: ['id', 'timestamp', 'tag']    
  }
};
