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
    var Folio = model.Folio;

    // TODO: Remove all child 
    Tag.findById(this._id)
      .populate('lessons')
      .exec(function(error, tag){
      if(error) return callback(error);

      // For Remove Tag _Id from Folio Table
      Folio.findById(tag.folio, function(error, folio){
        if(error) return callback(error);

        folio.tags.splice(folio.tags.indexOf(tag._id),1);
        folio.markModified('tags');
        folio.save(function(error){
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

  removeAllTagFromThisFolio: function(callback) {
    var Tag = model.Tag;
    var refTag = this;

    Tag.find({folio:refTag.folio})
      .populate('lessons')
      .exec(function(error, tags){
      if(error) return callback(error);
        
      if(tags.length>0){
        async.forEach(tags, function(tag, forEachCallback){
          tag.removeTag(forEachCallback);
        }, function(error){
          if(error) return callback(error);
          Tag.remove({folio:refTag.folio}, callback);
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
    var folio = tag.folio;
    for (var i = 0 ; i < folio.tags.length; i++) {
      if(folio.tags[i].toString() == tag._id.toString()) {
        if(index === 0) {
          if(i-1 >= 0) {
              temp = folio.tags[i];
              folio.tags[i] = folio.tags[i-1];
              folio.tags[i-1] = temp;
              break;
            }
        }  
        else if(index == 1) {
        
          if(i+1 <= folio.tags.length) {
              temp = folio.tags[i];
              folio.tags[i] = folio.tags[i+1];
              folio.tags[i+1] = temp;
          break;
            }
        }      
      }
    }
    folio.markModified('tags');
    folio.save(callback);
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
