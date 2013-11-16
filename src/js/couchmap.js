var $ = require('jquery');
var Backbone =  require('backbone');
Backbone.$ = $;

var L = require('leaflet');
L.Icon.Default.imagePath = 'images/vendor/leaflet';

$(document).ready(function() {

  var CouchMapModel = require('couchmap-backbone/models/couchMap');
  var couchmap_model = new CouchMapModel();

  // TODO: move into view
  couchmap_model.on('busy', function() { $('.status').html('busy');});
  couchmap_model.on('idle', function() { $('.status').html('idle');});

  var CouchMapView = require('couchmap-leaflet/views/couchMap');
  var couchmap_view = new CouchMapView({el: $('div.map'), model: couchmap_model});

  // insert random models into DB
  $('#random_go').on('click', function() {
    var count = parseInt($('#random_count').val(), 10);
    console.log(count);
    var db = 'http://couch.libremap.net/couchmap-dev/';
    var bounds = couchmap_view.map.getBounds(),
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
      url: db+'/_bulk_docs',
      success: function () { console.log('pushed '+count+' documents'); }
    });
  });
});
