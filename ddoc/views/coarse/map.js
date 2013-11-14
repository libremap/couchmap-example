function(doc) {
  var common = require('views/lib/couchmap-common');
  if (doc.lat && doc.lon) {
    var keys = common.coarse_map_keys(doc.lat, doc.lon);
    common._.each(keys, function(k) {
      emit(k, {
        count: 1,
        lat: doc.lat,
        lon: doc.lon,
        bbox_west: doc.lon,
        bbox_east: doc.lon,
        bbox_south: doc.lat,
        bbox_north: doc.lat
      });
    });
  }
}
