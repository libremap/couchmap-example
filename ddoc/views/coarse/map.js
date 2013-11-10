function(doc) {
  var common = require('views/lib/couchmap-common');
  if (doc.lat && doc.lon) {
    var keys = common.coarse_map_keys(doc.lat, doc.lon);
    common._.each(keys, function(k) {
      emit(k, {count: 1, lat: doc.lat, lon: doc.lon});
    });
  }
}
