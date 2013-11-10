var $ = require('jquery');
$(document).ready(function() {
  var L = require('leaflet');

  console.log($('div.map'));
  var map = L.map($('div.map')[0], {center: [10, 0], zoom: 2} );
  // add an OpenStreetMap tile layer
  L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
});
