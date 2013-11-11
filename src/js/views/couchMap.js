var Backbone =  require('backbone');
var _ = require('underscore');
var L = require('leaflet');
L.Icon.Default.imagePath = 'images/vendor/leaflet';

function bounds2bbox(bounds) {
  var sw = bounds.getSouthWest();
  var ne = bounds.getNorthEast();
  var common = require('couchmap-common');
  return common.bbox([[sw.lat,sw.lng],[ne.lat,ne.lng]]);
}

var CoarseView = Backbone.View.extend({
  initialize: function(options) {
    this.mapView = options.mapView;
    this.render();
    this.listenTo(this.mapView, 'bbox', function(bbox, zoom) {
      var tiles = bbox.toTiles(zoom);
      console.log(tiles);
      this.bbox_ids = _.map(tiles, function(k) { return k.toString(); });
      this.render();
    });
    this.listenTo(this.collection, 'add', this.add);
  },
  render: function() {
    if (this.layer) {
      this.mapView.map.removeLayer(this.layer);
    }
    this.layer = L.layerGroup().addTo(this.mapView.map);
    this.markers = {};
    if (this.bbox_ids) {
      var models = _.compact(this.collection.get(this.bbox_ids));
      _.each(models, this.add, this);
    }
  },
  add: function(model) {
    var id = model.get('id');
    if (this.markers[id]) {
      this.layer.removeLayer(this.markers[id]);
    }
    if (this.bbox_ids && _.contains(this.bbox_ids, id)) {
      this.markers[id] = L.marker([model.get('lat'), model.get('lon')])
        .addTo(this.layer);
    }
  }
});

module.exports = Backbone.View.extend({
  initialize: function(options) {
    // create map and add OpenStreetMap tile layer
    this.map = L.map(this.el, {center: [10, 0], zoom: 2} );
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);
    this.map.on('moveend', this.update_bbox, this);

    this.listenTo(this.model, 'change', this.render);
    this.render();

    this.update_bbox();
  },
  update_bbox: function() {
    var bbox = bounds2bbox(this.map.getBounds());
    var zoom = this.map.getZoom();
    this.model.update(bbox, zoom);
    this.trigger('bbox', bbox, zoom);
  },
  render: function() {
    if (this.coarse_view) {
      this.coarse_view.remove();
    }
    if (this.fine_view) {
      this.fine_view.remove();
    }

    this.coarse_view = new CoarseView({
      mapView: this,
      collection: this.model.get('coarse_coll')
    });
  }
});
