var $ = require('jquery');
var Backbone =  require('backbone');
Backbone.$ = $;
$(document).ready(function() {
  var L = require('leaflet');
  // create map and add OpenStreetMap tile layer
  var map = L.map($('div.map')[0], {center: [10, 0], zoom: 2} );
  L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  var CouchMapModel = require('couchmap-backbone/models/couchMap');
  var couchmap = new CouchMapModel({
    coarse_url: 'http://couch.libremap.net/couchmap-dev/_design/couchmap-api/_view/coarse',
    fine_url: 'http://couch.libremap.net/couchmap-dev/_design/couchmap-api/_spatial/by_location',
    changes_url: 'http://couch.libremap.net/couchmap-dev/_changes',
    changes_filter: 'couchmap-api/by_id_or_bbox'
  });

  // TODO: move into view
  couchmap.on('busy', function() { console.log('busy');});
  couchmap.on('idle', function() { console.log('idle');});

  function bounds2bbox(bounds) {
    var sw = bounds.getSouthWest();
    var ne = bounds.getNorthEast();
    var common = require('couchmap-common');
    return common.bbox([[sw.lat,sw.lng],[ne.lat,ne.lng]]);
  }

  function update_bbox() {
    var bbox = bounds2bbox(map.getBounds());
    couchmap.update(bbox, map.getZoom());
  }

  map.on('moveend', update_bbox);
  update_bbox();
});
