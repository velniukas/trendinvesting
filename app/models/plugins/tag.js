var model = require('../index');

module.exports = function(schema, options) {
  schema.pre('save', function (next) {
    this._wasNew = this.isNew;
    next();
  });

  schema.post('save', function(callback) {
    var self = this;
    var id = parseInt(self.id.toString());
    var Folio = model.Folio;
    var Tag = model.Tag;

    // Add tag to the folio
    if (self._wasNew) {
      Tag.findOne({ id: id }, function(error, tag) {
        if(error) return callback(error);

        Folio.findById(tag.folio, function(error, folio) {
          if(error) return callback(error);

          if(!folio.tags) {
            folio.tags = [];
          }
          
          folio.tags.push(tag._id);
          folio.save(callback);
        });
      });
    }
  });
};