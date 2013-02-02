var model = require('../index');

module.exports = function(schema, options) {
  schema.pre('save', function (next) {
    this._wasNew = this.isNew;
    next();
  });

  schema.post('save', function(callback) {
    var self = this;
    var id = parseInt(self.id.toString());
    var Fund = model.Fund;
    var Tag = model.Tag;

    // Add tag to the fund
    if (self._wasNew) {
      Tag.findOne({ id: id }, function(error, tag) {
        if(error) return callback(error);

        Fund.findById(tag.fund, function(error, fund) {
          if(error) return callback(error);

          if(!fund.tags) {
            fund.tags = [];
          }
          
          fund.tags.push(tag._id);
          fund.save(callback);
        });
      });
    }
  });
};