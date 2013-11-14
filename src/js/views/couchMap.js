var Backbone =  require('backbone');
var _ = require('underscore');
var common = require('couchmap-common');
var L = require('leaflet');
L.Icon.Default.imagePath = 'images/vendor/leaflet';
var Lmarkercluster = require('leaflet-markercluster');

function bounds2bbox(bounds) {
  var sw = bounds.getSouthWest();
  var ne = bounds.getNorthEast();
  var common = require('couchmap-common');
  return common.bbox([[sw.lat,sw.lng],[ne.lat,ne.lng]]);
}

var get_cluster_icon = function(count) {
  var size = 'large';
  if (count<10) {
    size = 'small';
  } else if (count<100) {
    size = 'medium';
  }
  return new L.DivIcon({
    html: '<div><span>'+count+'</span></div>',
      className: 'marker-cluster marker-cluster-'+size,
      iconSize: new L.Point(40,40)
  });
};

var CoarseMarkerView = Backbone.View.extend({
  initialize: function(options) {
    this.layer = options.layer;
    this.listenTo(this.model, 'change', this.render);
    this.render();
  },
  render: function() {
    this.remove();
    var count = this.model.get('count');
    this.marker = L.marker([this.model.get('lat'), this.model.get('lon')],{
      icon: get_cluster_icon(count),
      view: this
    })
      .addTo(this.layer);
    this.marker.view = this;
  },
  remove: function() {
    if (this.marker) {
      this.layer.removeLayer(this.marker);
    }
  }
});

var CoarseView = Backbone.View.extend({
  initialize: function(options) {
    this.mapView = options.mapView;
    this.bbox = bounds2bbox(this.mapView.map.getBounds());
    this.zoom = common.validate_zoom(this.mapView.map.getZoom()+1);
    this.layer = L.markerClusterGroup(
      {
        showCoverageOnHover: false,
        zoomToBoundsOnClick: false,
        maxClusterRadius: 50,
        iconCreateFunction: function(cluster) {
          var count = 0;
          _.each(cluster.getAllChildMarkers(), function(marker) {
            count += marker.options.view.model.get('count');
          });
          return get_cluster_icon(count);
        }.bind(this)
      })
      .addTo(this.mapView.map)
      .on('click', function(a) {
        console.log('marker');
        var model = a.layer.options.view.model;
        this.mapView.map.fitBounds([
          [model.get('bbox_south'), model.get('bbox_west')],
          [model.get('bbox_north'), model.get('bbox_east')]
          ]);
      }.bind(this))
      .on('clusterclick', function(a) {
        var models = _.map(a.layer.getAllChildMarkers(), function(marker) {
          return marker.options.view.model;
        });
        var west = _.min(_.map(models, function(model) { return model.get('bbox_west'); }));
        var east = _.max(_.map(models, function(model) { return model.get('bbox_east'); }));
        var south = _.min(_.map(models, function(model) { return model.get('bbox_south'); }));
        var north = _.max(_.map(models, function(model) { return model.get('bbox_north'); }));
        this.mapView.map.fitBounds([
          [south, west],
          [north, east]
          ]);
      }.bind(this));


    this.markers = {};

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

var FineMarkerView = Backbone.View.extend({
  initialize: function(options) {
    this.layer = options.layer;
    this.listenTo(this.model, 'change', this.render);
    this.render();
  },
  render: function() {
    if (this.marker) {
      this.remove();
    }
    this.marker = L.marker([this.model.get('lat'), this.model.get('lon')],{
      title: this.model.id
    })
      .addTo(this.layer);
  },
  remove: function() {
    this.layer.removeLayer(this.marker);
  }
});

var FineView = Backbone.View.extend({
  initialize: function(options) {
    this.mapView = options.mapView;
    this.layer = L.markerClusterGroup().addTo(this.mapView.map);
    this.subviews = {};
    this.listenTo(this.collection, 'sync', this.render);
    this.listenTo(this.collection, 'add', this.addModel);
    this.listenTo(this.collection, 'remove', this.removeModel);
    this.render();
  },
  addModel: function(model) {
    this.removeModel(model);
    this.subviews[model.id] = new FineMarkerView({
      layer: this.layer,
      model: model
    });
  },
  removeModel: function(model) {
    if (this.subviews[model.id]) {
      this.subviews[model.id].remove();
      delete this.subviews[model.id];
    }
  },
  render: function() {
    this.collection.each(this.addModel, this);
  },
  remove: function() {
    _.each(this.subviews, this.removeModel, this);
    this.mapView.map.removeLayer(this.layer);
  }
});

module.exports = Backbone.View.extend({
  initialize: function(options) {
    this.CoarseView = options.CoarseView || CoarseView;
    this.FineView = options.FineView || FineView;

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
    var zoom = common.validate_zoom(this.map.getZoom()+1);
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
        this.subview = new this.FineView(_.extend(this.fine_options || {}, {
          mapView: this,
          collection: this.model.get('fine_coll')
        }));
      }
    }
  },
  remove: function() {
    if (this.subview) {
      this.subview.remove();
    }
  }
});
