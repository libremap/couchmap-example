var $ = require('jquery');
var Backbone =  require('backbone');
Backbone.$ = $;
$(document).ready(function() {

  var CouchMapModel = require('couchmap-backbone/models/couchMap');
  var couchmap_model = new CouchMapModel({
    coarse_url: 'http://couch.libremap.net/couchmap-dev/_design/couchmap-api/_view/coarse',
    fine_url: 'http://couch.libremap.net/couchmap-dev/_design/couchmap-api/_spatial/by_location',
    changes_url: 'http://couch.libremap.net/couchmap-dev/_changes',
    changes_filter: 'couchmap-api/by_id_or_bbox'
  });

  // TODO: move into view
  couchmap_model.on('busy', function() { $('.status').html('busy');});
  couchmap_model.on('idle', function() { $('.status').html('idle');});

  var CouchMapView = require('./views/couchMap');
  var couchmap_view = new CouchMapView({el: $('div.map'), model: couchmap_model});
});
