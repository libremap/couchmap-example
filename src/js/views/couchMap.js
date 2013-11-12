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

var CoarseMarkerView = Backbone.View.extend({
  initialize: function(options) {
    this.layer = options.layer;
    this.listenTo(this.model, 'change', this.render);
    this.render();
  },
  render: function() {
    if (this.marker) {
      this.remove();
    }
    this.marker = L.marker([this.model.get('lat'), this.model.get('lon')])
      .addTo(this.layer);
  },
  remove: function() {
    this.layer.removeLayer(this.marker);
  }
});

var CoarseView = Backbone.View.extend({
  initialize: function(options) {
    this.mapView = options.mapView;
    this.bbox = bounds2bbox(this.mapView.map.getBounds());
    this.zoom = this.mapView.map.getZoom();
    this.layer = L.layerGroup().addTo(this.mapView.map);
    this.markers = {};

    this.coarse_model_views = {};

    this.listenTo(this.mapView, 'bbox', function(bbox, zoom) {
      this.bbox = bbox;
      if (this.zoom!=zoom) {
        this.zoom = zoom;
      }
    });
    this.listenTo(this.collection, 'sync', this.render);
    this.listenTo(this.collection, 'add', this.addModel);
    this.listenTo(this.collection, 'remove', this.removeModel);
    this.render();

  },
  render: function() {
    // add views for the current zoom level
    _.each(this.collection.where({zoom: this.zoom}), this.addModel, this);
    // remove views for other zoom levels
    var remove = this.collection.filter(function(model) {
      return model.get('zoom')!=this.zoom;
    }, this);
    _.each(remove, this.removeModel, this);
  },
  addModel: function(model) {
    var id = model.get('id');
    if (model.get('zoom')==this.zoom && !this.markers[id]) {
      this.markers[id] = new CoarseMarkerView({
        layer: this.layer,
        model: model
      });
    }
  },
  removeModel: function(model) {
    var id = model.get('id');
    if (this.markers[id]) {
      this.markers[id].remove();
      delete this.markers[id];
    }
  },
  remove: function() {
    _.each(this.markers, function(marker, id) {
      marker.remove();
    });
    this.markers = {};
    this.mapView.map.removeLayer(this.layer);
  }
});

module.exports = Backbone.View.extend({
  initialize: function(options) {
    this.CoarseView = options.CoarseView || CoarseView;
    this.FineView = options.FineView || undefined;//FineView;

    // create map and add OpenStreetMap tile layer
    this.map = L.map(this.el, {center: [10, 0], zoom: 2} );
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);
    this.map.on('moveend', this.update_bbox, this);

    this.listenTo(this.model, {
      'fine': this.render.bind(this, 'fine'),
      'coarse': this.render.bind(this, 'coarse')
    });
    this.update_bbox();
  },
  update_bbox: function() {
    var bbox = bounds2bbox(this.map.getBounds());
    var zoom = this.map.getZoom();
    this.trigger('bbox', bbox, zoom);
    this.model.update(bbox, zoom);
  },
  render: function(mode) {
    if (this.mode!=mode) {
      this.mode = mode;
      if (this.subview) {
        this.subview.remove();
      }
      if (this.mode=='coarse') {
        this.subview = new this.CoarseView(_.extend(this.coarse_options || {}, {
          mapView: this,
          collection: this.model.get('coarse_coll')
        }));
      } else {
        // TODO
      }
    }
  },
  remove: function() {
    if (this.subview) {
      this.subview.remove();
    }
  }
});
