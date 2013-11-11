var Backbone =  require('backbone');
var L = require('leaflet');

function bounds2bbox(bounds) {
  var sw = bounds.getSouthWest();
  var ne = bounds.getNorthEast();
  var common = require('couchmap-common');
  return common.bbox([[sw.lat,sw.lng],[ne.lat,ne.lng]]);
}

module.exports = Backbone.View.extend({
  initialize: function(options) {
    // create map and add OpenStreetMap tile layer
    this.map = L.map(this.el, {center: [10, 0], zoom: 2} );
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);

    this.map.on('moveend', this.update_bbox, this);
    this.update_bbox();
  },
  update_bbox: function() {
    var bbox = bounds2bbox(this.map.getBounds());
    this.model.update(bbox, this.map.getZoom());
  },
});
