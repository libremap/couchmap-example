var $ = require('jquery');
var Backbone =  require('backbone');
// we want Backbone with jquery support
Backbone.$ = $;

var L = require('leaflet');
// Leaflet has to know where the images reside
L.Icon.Default.imagePath = 'images/vendor/leaflet';

$(document).ready(function() {
  // create ProxyModel (has sub-collections FineColl and CoarseColl)
  var ProxyModel = require('couchmap-backbone/models/proxy');
  var proxyModel = new ProxyModel();

  // create MapView
  var MapView = require('couchmap-leaflet/views/map');
  var mapView = new MapView({
    el: $('div.map'),
    zoomTo: [[-62,-180],[70,180]]
  });

  // create ProxyView that displays the ProxyModel
  var ProxyView = require('couchmap-leaflet/views/proxy');
  var proxyView = new ProxyView({
    model: proxyModel,
    mapView: mapView
  });

  // add ControlView
  var controls = new (require('./controls'))({
    el: $('div.controls'),
    model: proxyModel,
    db_url: 'http://couchmap.d00d3.net/db/',
    mapView: mapView
  });
});
