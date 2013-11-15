## What is couchmap?

### tl;dr
couchmap displays markers that are stored in a CouchDB on a map.

### More information
CouchMap uses
* **CouchDB** as the database storing the marker data: any JSON document with a latitude and longitude can be used.
* **GeoCouch** as a spatial index in order to make fast bounding box queries.
* a 2-level scheme: 
    * **coarse**: if the number of markers in the current viewport exceeds a configurable limit, then CouchMap uses a coarse view with clusters. The clusters are precomputed with a map/reduce in CouchDB and only a minimum of information is transferred. This allows you to display a global overview even with a massive amount of markers.
    * **fine**: if the number of markers in the current viewport is small enough, then all of these markers are transferred from the CouchDB.
* **Backbone** models and collections: you don't need to mess around with the details. The collections even receive live updates from the CouchDB (bow to CouchDB's changes feed)!
* **Backbone** views for **Leaflet** to actually display the markers with a nice and mobile-friendly HTML5 interface.

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
