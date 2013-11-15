## What is couchmap?

### tl;dr
couchmap displays map markers that are stored in a CouchDB. See it in [action](http://couch.libremap.net/couchmap-dev/_design/couchmap-api/index.html)!

### More information
CouchMap uses
* **CouchDB** as the database storing the marker data: any JSON document with a latitude and longitude can be used.
* **GeoCouch** as a spatial index in order to make fast bounding box queries.
* a 2-level scheme: 
    * **coarse**: if the number of markers in the current viewport exceeds a configurable limit, then CouchMap uses a coarse view with clusters. The clusters are precomputed with a map/reduce in CouchDB and only a minimum of information is transferred. This allows you to display a global overview even with a massive amount of markers.
    * **fine**: if the number of markers in the current viewport is small enough, then all of these markers are transferred from the CouchDB.
* **Backbone** models and collections: you don't need to mess around with the details. The collections even receive live updates from the CouchDB (bow to CouchDB's changes feed)!
* **Backbone** views for **Leaflet** to actually display the markers with a nice and mobile-friendly HTML5 interface.

### Structure
CouchMap is split into modules that reside in separate repositories. Each repository is an ```npm``` module that can be ```require```'d (for example with [browserify](http://browserify.org/) on the client side):
* [couchmap-common](https://github.com/libremap/couchmap-common): code for CouchDB and code that is shared between the CouchDB and the client side.
* [couchmap-backbone](https://github.com/libremap/couchmap-backbone): backbone models/collections for retrieving the data on the client.
* [couchmap-leaflet](https://github.com/libremap/couchmap-leaflet): backbone views for displaying the models/collections with leaflet.

## Setup
### Requirements
* CouchDB with GeoCouch plugin
* npm
* bower (```npm install -g bower```)
* grunt (```npm install -g grunt-cli```)

### Step-by-step

1. Clone the repo
2. Copy ```couchconfig.json.example``` to ```couchconfig.json``` and adapt to your CouchDB installation.
3. Run ```npm install``` and ```bower install```.
4. Either
    1. Run ```grunt``` to start a local webserver (reachable via ```http://localhost:9000```).
    2. Run ```grunt push --couch dev``` to push the design doc to your couch (here it's the ```dev``` config in ```couchconfig.json```).
