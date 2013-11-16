var $ = require('jquery');
var Backbone =  require('backbone');
// we want Backbone with jquery support
Backbone.$ = $;

var L = require('leaflet');
// Leaflet has to know where the images reside
L.Icon.Default.imagePath = 'images/vendor/leaflet';

$(document).ready(function() {
  // create CouchMapModel (has sub-collections FineColl and CoarseColl)
  var CouchMapModel = require('couchmap-backbone/models/couchMap');
  var couchmap_model = new CouchMapModel();

  // create CouchMapView that displays the CouchMapModel
  var CouchMapView = require('couchmap-leaflet/views/couchMap');
  var couchmap_view = new CouchMapView({
    el: $('div.map'),
    model: couchmap_model
  });

  // add ControlView
  var controls = new (require('./controls'))({
    el: $('div.controls'),
    model: couchmap_model,
    db_url: 'http://couchmap.d00d3.net/db/',
    mapView: couchmap_view
  });
});
