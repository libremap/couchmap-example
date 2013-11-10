function(doc) {
  if (doc.lat && doc.lon) {
    emit({type: 'Point', coordinates: [doc.lon, doc.lat]}, doc);
  }
}
