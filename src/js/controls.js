var Backbone = require('backbone');

module.exports = Backbone.View.extend({
  initialize: function(options) {
    var db_url = options.db_url;
    var model = this.model;
    var mapView = options.mapView;

    // update status
    this.listenTo(model, {
      busy: function() { this.$('.status').html('busy'); },
      idle: function() { this.$('.status').html('idle'); }
    });

    // insert random models into DB
    this.$('#random_go').on('click', function() {
      var count = parseInt($('#random_count').val(), 10);
      console.log(count);
      var bounds = mapView.map.getBounds(),
          ne = bounds.getNorthEast(),
          sw = bounds.getSouthWest(),
          docs = [];
      for (var i=0; i<count; i++) {
        docs.push({
          lat: sw.lat + Math.random()*(ne.lat-sw.lat),
          lon: sw.lng + Math.random()*(ne.lng-sw.lng)
        });
      }
      $.ajax({
        type: 'POST',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({'docs': docs}),
        url: db_url+'/_bulk_docs',
        success: function () { console.log('pushed '+count+' documents'); }
      });
    });
  }
});
