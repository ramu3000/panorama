(function(){

/**
 * @exports mxn.util.$m as $m
 */
var $m = mxn.util.$m;

/**
 * Initialise our provider. This function should only be called 
 * from within Mapstraction code, not exposed as part of the API.
 * @private
 */
var init = function() {
	this.invoker.go('init', [ this.currentElement, this.api ]);
	this.applyOptions();
};

/**
 * Mapstraction instantiates a map with some API choice into the HTML element given
 * <p>Creates and loads a Mapstraction map into a specified HTML element. The following mapping APIs
 * are supported by Mapstraction:</p>
 * <ul>
 * <li><code>esri</code> - ESRI ArcGIS</li>
 * <li><code>google</code> - Google v2</li>
 * <li><code>googlev3</code> - Google v3</li>
 * <li><code>leaflet</code> - Leaflet</li>
 * <li><code>mapquest</code> - MapQuest</li>
 * <li><code>microsoft</code> - Microsoft Bing v6</li>
 * <li><code>microsoft7</code> - Microsoft Bing v7</li>
 * <li><code>nokia</code> - Nokia Here</li>
 * <li><code>openlayers</code> - OpenLayers</li>
 * <li><code>openmq</code> - MapQuest Open</li>
 * <li><code>openspace</code> - Ordnance Survey OpenSpace</li>
 * <li><code>ovi</code> - Nokia Ovi</li>
 * <li><code>yahoo</code> - <strong><em>Yahoo (obsoleted)</em></strong></li>
 * <li><code>yandex</code> - Yandex</li>
 * <li><code>yandexv2</code> - Yandex v2</li>
 * </ul>
 * @name mxn.Mapstraction
 * @constructor
 * @param {String} element The HTML element to replace with a map
 * @param {String} api The API ID of the mapping API to use; if omitted, the first loaded provider implementation is used.
 * @param {Boolean} [debug] optional parameter to turn on debug support; this uses alert panels for unsupported actions.
 * @exports Mapstraction as mxn.Mapstraction
 */
var Mapstraction = mxn.Mapstraction = function(element, api, debug) {
	if (!api){
		api = mxn.util.getAvailableProviders()[0];
	}
	
	/**
	 * The name of the active API.
	 * @name mxn.Mapstraction#api
	 * @type {String}
	 */
	this.api = api;
		
	this.maps = {};
	
	/**
	 * The DOM element containing the map.
	 * @name mxn.Mapstraction#currentElement
	 * @property
	 * @type {DOMElement}
	 */
	this.currentElement = $m(element);
	
	this.eventListeners = [];
	
	/**
	 * The array of all layers that have been added to the map.
	 * @name mxn.Mapstraction#tileLayers
	 * @property
	 * @type {Array}
	 */
	this.tileLayers = [];	
		
	/**
	 * The array of currently loaded <code>mxn.Marker</code> objects.
	 * @name mxn.Mapstraction#markers
	 * @property
	 * @type {Array}
	 */
	this.markers = [];
		
	/**
	 * The array of currently loaded <code>mxn.Polyline</code> objects.
	 * @name mxn.Mapstraction#polylines
	 * @property
	 * @type {Array}
	 */
	this.polylines = [];
	
	/**
	 * The array of currently loaded <code>mxn.Radar</code> objects (with polyines).
	 * @author Kolor
	 * @name mxn.Mapstraction#radars
	 * @property
	 * @type {Array}
	 */
	this.radars = [];
	
	this.images = [];
	this.controls = [];	
	this.loaded = {};
	this.onload = {};
    //this.loaded[api] = true; // FIXME does this need to be true? -ajturner
	this.onload[api] = [];
	
	/**
	 * The original element value passed to the constructor.
	 * @name mxn.Mapstraction#element
	 * @property
	 * @type {String|DOMElement}
	 */
	this.element = element;
	
	/**
	 * Options defaults.
	 * @name mxn.Mapstraction#options
	 * @property {Object}
	 */
	this.options = {
		enableScrollWheelZoom: false,
		enableDragging: true,
		disableDoubleClickZoom: false
	};
	
	this.addControlsArgs = {};
	
	// set up our invoker for calling API methods
	this.invoker = new mxn.Invoker(this, 'Mapstraction', function(){ return this.api; });
	
	// Adding our events
	mxn.addEvents(this, [
		
		/**
		 * Map has loaded
		 * @name mxn.Mapstraction#load
		 * @event
		 */
		'load',
		
		/**
		 * Map is clicked {location: mxn.LatLonPoint}
		 * @name mxn.Mapstraction#click
		 * @event
		 */
		'click',
		
		/**
		 * Map is panned
		 * @name mxn.Mapstraction#endPan
		 * @event
		 */
		'endPan',
		
		/**
		 * Zoom is changed
		 * @name mxn.Mapstraction#changeZoom
		 * @event
		 */
		'changeZoom',
		
		/**
		 * Marker is added {marker: Marker}
		 * @name mxn.Mapstraction#markerAdded
		 * @event
		 */
		'markerAdded',
		
		/**
		 * Marker is added {marker: Marker}
		 * @name mxn.Mapstraction#markerAdded
		 * @event
		 */
		'markerUpdated',
		
		/**
		 * Marker is removed {marker: Marker}
		 * @name mxn.Mapstraction#markerRemoved
		 * @event
		 */
		'markerRemoved',
		
		/**
		 * Polyline is added {polyline: Polyline}
		 * @name mxn.Mapstraction#polylineAdded
		 * @event
		 */
		'polylineAdded',
		
		/**
		 * Polyline is removed {polyline: Polyline}
		 * @name mxn.Mapstraction#polylineRemoved
		 * @event
		 */
		'polylineRemoved',
		
		/**
		 * Radar polyline is added {radar: Radar}
		 * @author Kolor
		 * @name mxn.Mapstraction#radarAdded
		 * @event
		 */
		'radarAdded',
		
		/**
		 * Radar polyline is removed {radar: Radar}
		 * @author Kolor
		 * @name mxn.Mapstraction#radarRemoved
		 * @event
		 */
		'radarRemoved'
	]);
	
	// finally initialize our proper API map
	init.apply(this);
};

/**
 * Map type constants
 * @const
 * @type {number}
 */
mxn.Mapstraction.ROAD = 1;
mxn.Mapstraction.SATELLITE = 2;
mxn.Mapstraction.HYBRID = 3;
mxn.Mapstraction.PHYSICAL = 4;

// methods that have no implementation in mapstraction core
mxn.addProxyMethods(Mapstraction, [ 
	/**
	 * Adds a timer function to change display of map control only after map is loaded
	 * This is a hack for microsoft7 maps
	 * @name mxn.Mapstraction#addControlsTimer
	 * @function
	 * @param {array} args Which controls to switch on
	 */
	'addControlsTimer',
	'addControlsTimeout',
	
	/**
	 * Adds a large map panning control and zoom buttons to the map
	 * @name mxn.Mapstraction#addLargeControls
	 * @function
	 */
	'addLargeControls',
		
	/**
	 * Adds a map type control to the map (streets, aerial imagery etc)
	 * @name mxn.Mapstraction#addMapTypeControls
	 * @function
	 */
	'addMapTypeControls', 
	
	/**
	 * Adds a GeoRSS or KML overlay to the map
	 *  some flavors of GeoRSS and KML are not supported by some of the Map providers
	 * @name mxn.Mapstraction#addOverlay
	 * @function
	 * @param {String} url GeoRSS or KML feed URL
	 * @param {Boolean} autoCenterAndZoom Set true to auto center and zoom after the feed is loaded
	 */
	'addOverlay', 
	
	/**
	 * Adds a small map panning control and zoom buttons to the map
	 * @name mxn.Mapstraction#addSmallControls
	 * @function
	 */
	'addSmallControls', 
	
	/**
	 * Applies the current option settings
	 * @name mxn.Mapstraction#applyOptions
	 * @function
	 */
	'applyOptions',
	
	/**
	 * Gets the BoundingBox of the map
	 * @name mxn.Mapstraction#getBounds
	 * @function
	 * @returns {mxn.BoundingBox} The bounding box for the current map state
	 */
	'getBounds', 
	
	/**
	 * Gets the central point of the map
	 * @name mxn.Mapstraction#getCenter
	 * @function
	 * @returns {mxn.LatLonPoint} The center point of the map
	 */
	'getCenter', 
	
	/**
	 * <p>Gets the imagery type for the map. The type can be one of:</p>
	 * <ul>
	 * <li><code>mxn.Mapstraction.ROAD</code></li>
	 * <li><code>mxn.Mapstraction.SATELLITE</code></li>
	 * <li><code>mxn.Mapstraction.HYBRID</code></li>
	 * <li><code>mxn.Mapstraction.PHYSICAL</code></li>
	 * </ul>
	 * 
	 * @name mxn.Mapstraction#getMapType
	 * @function
	 * @returns {Number} 
	 */
	'getMapType', 

	/**
	 * Returns a ratio to turn distance into pixels based on the current projection.
	 * @name mxn.Mapstraction#getPixelRatio
	 * @function
	 * @returns {Number} ratio
	 */
	'getPixelRatio', 
	
	/**
	 * Returns the zoom level of the map
	 * @name mxn.Mapstraction#getZoom
	 * @function
	 * @returns {Number} The zoom level of the map
	 */
	'getZoom', 
	
	/**
	 * Returns the best zoom level for bounds given
	 * @name mxn.Mapstraction#getZoomLevelForBoundingBox
	 * @function
	 * @param {mxn.BoundingBox} bbox The bounds to fit
	 * @returns {Number} The closest zoom level that contains the bounding box
	 */
	'getZoomLevelForBoundingBox', 
	
	/**
	 * Displays the coordinates of the cursor in the HTML element
	 * @name mxn.Mapstraction#mousePosition
	 * @function
	 * @param {String} element ID of the HTML element to display the coordinates in
	 */
	'mousePosition',
	
	/**
	 * Displays the bearing of the cursor in the HTML element
	 * @author Kolor
	 * @name mxn.Mapstraction#mouseBearing
	 * @function
	 * @param {String} element ID of the HTML element to display the coordinates in
	 * @param {mxn.LatLonPoint} pivot point for bearing
	 */
	'mouseBearing',
	
	/**
	 * Resize the current map to the specified width and height
	 * (since it is actually on a child div of the mapElement passed
	 * as argument to the Mapstraction constructor, the resizing of this
	 * mapElement may have no effect on the size of the actual map)
	 * @name mxn.Mapstraction#resizeTo
	 * @function
	 * @param {Number} width The width the map should be.
	 * @param {Number} height The width the map should be.
	 */
	'resizeTo', 
	
	/**
	 * Sets the map to the appropriate location and zoom for a given BoundingBox
	 * @name mxn.Mapstraction#setBounds
	 * @function
	 * @param {mxn.BoundingBox} bounds The bounding box you want the map to show
	 */
	'setBounds', 
	
	/**
	 * setCenter sets the central point of the map
	 * @name mxn.Mapstraction#setCenter
	 * @function
	 * @param {mxn.LatLonPoint} point The point at which to center the map
	 * @param {Object} [options] Optional parameters
	 * @param {Boolean} options.pan Whether the map should move to the locations using a pan or just jump straight there
	 */
	'setCenter', 
	
	/**
	 * Centers the map to some place and zoom level
	 * @name mxn.Mapstraction#setCenterAndZoom
	 * @function
	 * @param {mxn.LatLonPoint} point Where the center of the map should be
	 * @param {Number} zoom The zoom level where 0 is all the way out.
	 */
	'setCenterAndZoom', 
	
	/**
	 * <p>Sets the imagery type for the map. The type can be one of:</p>
	 * <ul>
	 * <li><code>mxn.Mapstraction.ROAD</code></li>
	 * <li><code>mxn.Mapstraction.SATELLITE</code></li>
	 * <li><code>mxn.Mapstraction.HYBRID</code></li>
	 * <li><code>mxn.Mapstraction.PHYSICAL</code></li>
	 * </ul>
	 * 
	 * @name mxn.Mapstraction#setMapType
	 * @function
	 * @param {Number} type 
	 */
	'setMapType', 
	
	/**
	 * Sets the zoom level for the map.
	 * @name mxn.Mapstraction#setZoom
	 * @function
	 * @param {Number} zoom The (native to the map) level zoom the map to.
	 */
	'setZoom',
	
	/**
	 * Turns a tile Layer on or off
	 * @name mxn.Mapstraction#toggleTileLayer
	 * @function
	 * @param {tile_url} url of the tile layer that was created.
	 */
	'toggleTileLayer'
]);

/**
 * Sets the current options to those specified in oOpts and applies them
 * @param {Object} oOpts Hash of options to set
 */
Mapstraction.prototype.setOptions = function(oOpts){
	mxn.util.merge(this.options, oOpts);
	this.applyOptions();
};

/**
 * Sets an option and applies it.
 * @param {String} sOptName Option name
 * @param vVal Option value
 */
Mapstraction.prototype.setOption = function(sOptName, vVal){
	this.options[sOptName] = vVal;
	this.applyOptions();
};

/**
 * Enable scroll wheel zooming
 * @deprecated Use setOption instead.
 */
Mapstraction.prototype.enableScrollWheelZoom = function() {
	this.setOption('enableScrollWheelZoom', true);
};

/**
 * Enable/disable dragging of the map
 * @param {Boolean} on
 * @deprecated Use setOption instead.
 */
Mapstraction.prototype.dragging = function(on) {
	this.setOption('enableDragging', on);
};

/**
 * Change the current API on the fly
 * @see mxn.Mapstraction
 * @param {Object} element The DOM element containing the map
 * @param {String} api The API to swap to
 */
Mapstraction.prototype.swap = function(element, api) {
	if (this.api === api) {
		return;
	}
	
	var center = this.getCenter();
	var zoom = this.getZoom();
	
	//hide all drawing radars
	for (var k = 0; k < this.radars.length; k++) {
		this.radars[k].hide();
	}
	this.currentElement.style.visibility = 'hidden';
	this.currentElement.style.display = 'none';

	this.currentElement = $m(element);
	this.currentElement.style.visibility = 'visible';
	this.currentElement.style.display = 'block';
	
	this.api = api;
	this.onload[api] = [];
	if (!this.maps.hasOwnProperty(this.api)) {
	//if (this.maps[this.api] === undefined) {
		init.apply(this);
		
		for (var j = 0; j < this.polylines.length; j++) {
			this.addPolyline( this.polylines[j], true);
		}
		
		for (var k = 0; k < this.radars.length; k++) {
			this.addRadar( this.radars[k], true);
			//hide all radars
			this.radars[k].hide();
		}
		
		for (var i = 0; i < this.markers.length; i++) {
		
			//close info bubble and remove stored object proprietary_infowindow
			this.markers[i].closeBubble();
			this.markers[i].proprietary_infowindow = null;
			
			//remove marker from map previous api before add in new api
			var invokerOptions = {};
			invokerOptions.overrideApi = true;
			this.invoker.go('removeMarker', [this.markers[i].api, this.markers[i]], invokerOptions);
			
			this.addMarker(this.markers[i], true);
		}
		
		this.setCenterAndZoom(center,zoom);
		
		this.addControls(this.addControlsArgs);
	} else {
		//sync the view
		this.setCenterAndZoom(center,zoom);
		
		//TODO synchronize the markers and polylines too
		// (any overlays created after api instantiation are not sync'd)
		
		//update api for radars
		for (var k = 0; k < this.radars.length; k++) {
			this.updateRadar( this.radars[k], true);
			//hide all radars
			this.radars[k].hide();
		}
		
		//update api for markers
		for (var i = 0; i < this.markers.length; i++) {
			this.updateMarker( this.markers[i], true);
		}
		
	}
};

/**
 * Returns the loaded state of a Map Provider
 * @param {String} [api] Optional API to query for. If not specified, returns the state of the originally created API
 */
Mapstraction.prototype.isLoaded = function(api){
	if (api === null) {
		api = this.api;
	}
	return this.loaded[api];
};

/**
 * Set the debugging on or off - shows alert panels for functions that don't exist in Mapstraction
 * @param {Boolean} [debug] Specify <code>true</code> to turn on debugging or <code>false</code> to turn it off
 */
Mapstraction.prototype.setDebug = function(debug){
	if(debug !== null) {
		this.debug = debug;
	}
	return this.debug;
};

/**
 * Set the api call deferment on or off - When it's on, mxn.invoke will queue up provider API calls until
 * runDeferred is called, at which time everything in the queue will be run in the order it was added. 
 * @param {Boolean} set deferred to true to turn on deferment
 */
Mapstraction.prototype.setDefer = function(deferred){
	this.loaded[this.api] = !deferred;
};

/**
 * Run any queued provider API calls for the methods defined in the provider's implementation.
 * For example, if defferable in mxn.[provider].core.js is set to {getCenter: true, setCenter: true}
 * then any calls to map.setCenter or map.getCenter will be queued up in this.onload. When the provider's
 * implementation loads the map, it calls this.runDeferred and any queued calls will be run.
 */
Mapstraction.prototype.runDeferred = function(){
	while(this.onload[this.api].length > 0) {  
		this.onload[this.api].shift().apply(this); //run deferred calls
	}
};

/////////////////////////
//
// Event Handling
//
// FIXME need to consolidate some of these handlers...
//
///////////////////////////

// Click handler attached to native API
Mapstraction.prototype.clickHandler = function(lat, lon, me) {
	this.callEventListeners('click', {
		location: new LatLonPoint(lat, lon)
	});
};

// Move and zoom handler attached to native API
Mapstraction.prototype.moveendHandler = function(me) {
	this.callEventListeners('moveend', {});
};

/**
 * Add a listener for an event.
 * @param {String} type Event type to attach listener to
 * @param {Function} func Callback function
 * @param {Object} caller Callback object
 */
Mapstraction.prototype.addEventListener = function() {
	var listener = {};
	listener.event_type = arguments[0];
	listener.callback_function = arguments[1];

	// added the calling object so we can retain scope of callback function
	if(arguments.length == 3) {
		listener.back_compat_mode = false;
		listener.callback_object = arguments[2];
		
		// add handler attachment for the callback object
		listener.callback_object[listener.event_type].addHandler(listener.callback_function, listener.callback_object);
	}
	else {
		listener.back_compat_mode = true;
		listener.callback_object = null;
		
		// add handler attachment on the mapstraction object
		this[listener.event_type].addHandler(listener.callback_function, this);
	}
	this.eventListeners.push(listener);
};

/**
 * Call listeners for a particular event.
 * @param {String} sEventType Call listeners of this event type
 * @param {Object} oEventArgs Event args object to pass back to the callback
 */
Mapstraction.prototype.callEventListeners = function(sEventType, oEventArgs) {
	oEventArgs.source = this;
	for(var i = 0; i < this.eventListeners.length; i++) {
		var evLi = this.eventListeners[i];
		if(evLi.event_type == sEventType) {
			// only two cases for this, click and move
			if(evLi.back_compat_mode) {
				if(evLi.event_type == 'click') {
					evLi.callback_function(oEventArgs.location);
				}
				else {
					evLi.callback_function();
				}
			}
			else {
				var scope = evLi.callback_object || this;
				evLi.callback_function.call(scope, oEventArgs);
			}
		}
	}
};


////////////////////
//
// map manipulation
//
/////////////////////


/**
 * <p><code>addControls</code> adds (or removes) controls to/from the map. You specify which controls to add in
 * the object literal that is the only argument.<p>
 * <p>To remove all controls from the map, call <code>addControls</code> with an empty object literal as the
 * argument.<p>
 * <p>Each time <code>addControls</code> is called, those controls present in the <code>args</code> object literal will
 * be added; those that are not specified or as specified as false will be removed.</p>
 * 
 * <pre>
 * args = {
 *	 pan:	  true,
 *	 zoom:	 'large' || 'small',
 *	 overview: true,
 *	 scale:	true,
 *	 map_type: true,
 * }
 * </pre>
 * @param {Array} args Which controls to switch on
 */
Mapstraction.prototype.addControls = function( args ) {
	this.addControlsArgs = args;
	this.invoker.go('addControls', arguments);
};

/**
 * Adds a marker pin to the map
 * @param {mxn.Marker} marker The marker to add
 * @param {Boolean} old If true, doesn't add this marker to the markers array. Used by the "swap" method
 */
Mapstraction.prototype.addMarker = function(marker, old) {
	marker.mapstraction = this;
	marker.api = this.api;
	marker.location.api = this.api;
	marker.map = this.maps[this.api]; 
	var propMarker = this.invoker.go('addMarker', arguments);
	marker.setChild(propMarker);
	if (!old) {
		this.markers.push(marker);
	}
	this.markerAdded.fire({'marker': marker});
};

/**
 * Update a marker on the map
 * @param {Marker} marker The marker to update
 */
Mapstraction.prototype.updateMarker = function(marker) {

	//close info bubble
	marker.closeBubble();
	marker.proprietary_infowindow = null;
	
	//remove marker in old api
	var invokerOptions = {};
	invokerOptions.overrideApi = true;
	this.invoker.go('removeMarker', [marker.api, marker], invokerOptions);
	
	//modify the marker API
	marker.api = this.api;
	marker.map = this.maps[this.api];
	marker.mapstraction = this;
	
	//add marker in new api
	var propMarker = this.invoker.go('addMarker', arguments);
	marker.setChild(propMarker);
	
	this.markerUpdated.fire({'marker': marker});
};

/**
 * addMarkerWithData will addData to the marker, then add it to the map
 * @param {mxn.Marker} marker The marker to add
 * @param {Object} data A data has to add
 */
Mapstraction.prototype.addMarkerWithData = function(marker, data) {
	marker.addData(data);
	this.addMarker(marker);
};

/**
 * removeMarker removes a Marker from the map
 * @param {mxn.Marker} marker The marker to remove
 */
Mapstraction.prototype.removeMarker = function(marker) {	
	var current_marker;
	for(var i = 0; i < this.markers.length; i++){
		current_marker = this.markers[i];
		if(marker == current_marker) {
			marker.closeBubble();
			this.invoker.go('removeMarker', arguments);
			marker.onmap = false;
			this.markers.splice(i, 1);
			this.markerRemoved.fire({'marker': marker});
			break;
		}
	}
};

/**
 * removeAllMarkers removes all the Markers on a map
 */
Mapstraction.prototype.removeAllMarkers = function() {
	var current_marker;
	while(this.markers.length > 0) {
		current_marker = this.markers.pop();
		this.invoker.go('removeMarker', [current_marker]);
	}
};

/**
 * Declutter the markers on the map, group together overlapping markers.
 * @param {Object} opts Declutter options
 */
Mapstraction.prototype.declutterMarkers = function(opts) {
	if(this.loaded[this.api] === false) {
		var me = this;
		this.onload[this.api].push( function() {
			me.declutterMarkers(opts);
		} );
		return;
	}

	var map = this.maps[this.api];

	switch(this.api)
	{
		//	case 'yahoo':
		//
		//	  break;
		//	case 'google':
		//
		//	  break;
		//	case 'openstreetmap':
		//
		//	  break;
		//	case 'microsoft':
		//
		//	  break;
		//	case 'openlayers':
		//
		//	  break;
		case 'multimap':
			/*
			 * Multimap supports quite a lot of decluttering options such as whether
			 * to use an accurate of fast declutter algorithm and what icon to use to
			 * represent a cluster. Using all this would mean abstracting all the enums
			 * etc so we're only implementing the group name function at the moment.
			 */
			map.declutterGroup(opts.groupName);
			break;
		//	case 'mapquest':
		//
		//	  break;
		//	case 'map24':
		//
		//	  break;
		case '  dummy':
			break;
		default:
			if(this.debug) {
				throw new Error(this.api + ' not supported by Mapstraction.declutterMarkers');
			}
	}
};

/**
 * Add a polyline to the map
 * @param {mxn.Polyline} polyline The Polyline to add to the map
 * @param {Boolean} old If true replaces an existing Polyline
 */
Mapstraction.prototype.addPolyline = function(polyline, old) {
	polyline.api = this.api;
	polyline.map = this.maps[this.api];
	var propPoly = this.invoker.go('addPolyline', arguments);
	polyline.setChild(propPoly);
	if(!old) {
		this.polylines.push(polyline);
	}
	this.polylineAdded.fire({'polyline': polyline});
};

/**
 * addPolylineWithData will addData to the polyline, then add it to the map
 * @param {Polyline} polyline The polyline to add
 * @param {Object} data A data has to add
 */
Mapstraction.prototype.addPolylineWithData = function(polyline, data) {
	polyline.addData(data);
	this.addPolyline(polyline);
};

// Private remove implementation
var removePolylineImpl = function(polyline) {
	this.invoker.go('removePolyline', arguments);
	polyline.onmap = false;
	this.polylineRemoved.fire({'polyline': polyline});
};

/**
 * Remove the polyline from the map
 * @param {mxn.Polyline} polyline The Polyline to remove from the map
 */
Mapstraction.prototype.removePolyline = function(polyline) {
	var current_polyline;
	for(var i = 0; i < this.polylines.length; i++){
		current_polyline = this.polylines[i];
		if(polyline == current_polyline) {
			this.polylines.splice(i, 1);
			removePolylineImpl.call(this, polyline);
			break;
		}
	}
};

/**
 * Removes all polylines from the map
 */
Mapstraction.prototype.removeAllPolylines = function() {
	var current_polyline;
	while(this.polylines.length > 0) {
		current_polyline = this.polylines.pop();
		removePolylineImpl.call(this, current_polyline);
	}
};

/**
 * Add a radar polyline to the map
 * @author Kolor
 * @param {mxn.Radar} radar The Radar object and polyline to add to the map
 * @param {Boolean} old If true replaces an existing Radar
 */
Mapstraction.prototype.addRadar = function(radar, old) {
	radar.api = this.api;
	radar.map = this.maps[this.api];
	radar.mapstraction = this;
	
	var propRadar = this.invoker.go('addRadar', arguments);
	radar.setChild(propRadar);
	if(!old) {
		this.radars.push(radar);
	}
	this.radarAdded.fire({'radar': radar});
};

/**
 * Update a radar polyline on the map
 * @param {Radar} radar the Radar object and polyline to update
 */
Mapstraction.prototype.updateRadar = function(radar) {
	radar.api = this.api;
	radar.map = this.maps[this.api];
	radar.mapstraction = this;
	radar.polyline.api = this.api;
	radar.polyline.proprietary_polyline = radar.toProprietary(this.api);
	
	var propRadar = this.invoker.go('addRadar', arguments);
	radar.setChild(propRadar);
};

// Private remove implementation for radar
var removeRadarImpl = function(radar) {
	this.invoker.go('removeRadar', arguments);
	radar.onmap = false;
	this.radarRemoved.fire({'radar': radar});
};

/**
 * Remove the radar polyline from the map
 * @author Kolor
 * @param {mxn.Radar} radar The Radar polyline to remove from the map
 */
Mapstraction.prototype.removeRadar = function(radar) {
	var current_radar;
	for(var i = 0; i < this.radars.length; i++){
		current_radar = this.radars[i];
		
		if(radar == current_radar) {
			this.radars.splice(i, 1);
			removeRadarImpl.call(this, radar);
			break;
		}
	}
};

/**
 * Removes all radars polylines from the map
 * @author Kolor
 */
Mapstraction.prototype.removeAllRadars = function() {
	var current_radar;
	while(this.radars.length > 0) {
		current_radar = this.radars.pop();
		removeRadarImpl.call(this, current_radar);
	}
};

var collectPoints = function(bMarkers, bPolylines, bRadars, predicate) {
	var points = [];
	
	if (bMarkers) {	
		for (var i = 0; i < this.markers.length; i++) {
			var mark = this.markers[i];
			if (!predicate || predicate(mark)) {
				points.push(mark.location);
			}
		}
	}
	
	if (bPolylines) {
		for(i = 0; i < this.polylines.length; i++) {
			var poly = this.polylines[i];
			if (!predicate || predicate(poly)) {
				for (var j = 0; j < poly.points.length; j++) {
					points.push(poly.points[j]);
				}
			}
		}
	}
	
	//TODO : bRadars
	
	return points;
};

/**
 * Sets the center and zoom of the map to the smallest bounding box
 * containing all markers and polylines
 */
Mapstraction.prototype.autoCenterAndZoom = function() {
	var points = collectPoints.call(this, true, true);
	
	this.centerAndZoomOnPoints(points);
};

/**
 * centerAndZoomOnPoints sets the center and zoom of the map from an array of points
 *
 * This is useful if you don't want to have to add markers to the map
 */
Mapstraction.prototype.centerAndZoomOnPoints = function(points) {
	var bounds = new BoundingBox(90, 180, -90, -180);

	for (var i = 0, len = points.length; i < len; i++) {
		bounds.extend(points[i]);
	}

	this.setBounds(bounds);
};

/**
 * Sets the center and zoom of the map to the smallest bounding box
 * containing all visible markers and polylines
 * will only include markers and polylines with an attribute of "visible"
 */
Mapstraction.prototype.visibleCenterAndZoom = function() {
	var predicate = function(obj) {
		return obj.getAttribute("visible");
	};
	var points = collectPoints.call(this, true, true, predicate);
	
	this.centerAndZoomOnPoints(points);
};

/**
 * Automatically sets center and zoom level to show all polylines
 * @param {Number} padding Optional number of kilometers to pad around polyline
 */
Mapstraction.prototype.polylineCenterAndZoom = function(padding) {
	padding = padding || 0;
	
	var points = collectPoints.call(this, false, true);
	
	if (padding > 0) {
		var padPoints = [];
		for (var i = 0; i < points.length; i++) {
			var point = points[i];
			
			var kmInOneDegreeLat = point.latConv();
			var kmInOneDegreeLon = point.lonConv();
			
			var latPad = padding / kmInOneDegreeLat;
			var lonPad = padding / kmInOneDegreeLon;

			var ne = new LatLonPoint(point.lat + latPad, point.lon + lonPad);
			var sw = new LatLonPoint(point.lat - latPad, point.lon - lonPad);
			
			padPoints.push(ne, sw);			
		}
		points = points.concat(padPoints);
	}
	
	this.centerAndZoomOnPoints(points);
};

/**
 * addImageOverlay layers an georeferenced image over the map
 * @param {id} unique DOM identifier
 * @param {src} url of image
 * @param {opacity} opacity 0-100
 * @param {west} west boundary
 * @param {south} south boundary
 * @param {east} east boundary
 * @param {north} north boundary
 */
Mapstraction.prototype.addImageOverlay = function(id, src, opacity, west, south, east, north) {
	
	var b = document.createElement("img");
	b.style.display = 'block';
	b.setAttribute('id',id);
	b.setAttribute('src',src);
	b.style.position = 'absolute';
	b.style.zIndex = 1;
	b.setAttribute('west',west);
	b.setAttribute('south',south);
	b.setAttribute('east',east);
	b.setAttribute('north',north);
	
	var oContext = {
		imgElm: b
	};
	
	this.invoker.go('addImageOverlay', arguments, { context: oContext });
};

Mapstraction.prototype.setImageOpacity = function(id, opacity) {
	if (opacity < 0) {
		opacity = 0;
	}
	if (opacity >= 100) {
		opacity = 100;
	}
	var c = opacity / 100;
	var d = document.getElementById(id);
	if(typeof(d.style.filter)=='string'){
		d.style.filter='alpha(opacity:'+opacity+')';
	}
	if(typeof(d.style.KHTMLOpacity)=='string'){
		d.style.KHTMLOpacity=c;
	}
	if(typeof(d.style.MozOpacity)=='string'){
		d.style.MozOpacity=c;
	}
	if(typeof(d.style.opacity)=='string'){
		d.style.opacity=c;
	}
};

Mapstraction.prototype.setImagePosition = function(id) {
	var imgElement = document.getElementById(id);
	var oContext = {
		latLng: { 
			top: imgElement.getAttribute('north'),
			left: imgElement.getAttribute('west'),
			bottom: imgElement.getAttribute('south'),
			right: imgElement.getAttribute('east')
		},
		pixels: { top: 0, right: 0, bottom: 0, left: 0 }
	};
	
	this.invoker.go('setImagePosition', arguments, { context: oContext });

	imgElement.style.top = oContext.pixels.top.toString() + 'px';
	imgElement.style.left = oContext.pixels.left.toString() + 'px';
	imgElement.style.width = (oContext.pixels.right - oContext.pixels.left).toString() + 'px';
	imgElement.style.height = (oContext.pixels.bottom - oContext.pixels.top).toString() + 'px';
};

Mapstraction.prototype.addJSON = function(json) {
	var features;
	if (typeof(json) == "string") {
		if (window.JSON && window.JSON.parse) {
			features = window.JSON.parse(json);
		} else {
			features = eval('(' + json + ')');
		}
	} else {
		features = json;
	}
	features = features.features;
	//var map = this.maps[this.api];
	var html = "";
	var item;
	var polyline;
	var marker;
	var markers = [];

	if(features.type == "FeatureCollection") {
		this.addJSON(features.features);
	}

	for (var i = 0; i < features.length; i++) {
		item = features[i];
		switch(item.geometry.type) {
			case "Point":
				html = "<strong>" + item.title + "</strong><p>" + item.description + "</p>";
				marker = new Marker(new LatLonPoint(item.geometry.coordinates[1],item.geometry.coordinates[0]));
				markers.push(marker);
				this.addMarkerWithData(marker,{
					infoBubble : html,
					label : item.title,
					date : "new Date(\""+item.date+"\")",
					iconShadow : item.icon_shadow,
					marker : item.id,
					iconShadowSize : item.icon_shadow_size,
					icon : item.icon,
					iconSize : item.icon_size,
					category : item.source_id,
					draggable : false,
					hover : false
				});
				break;
			case "Polygon":
				var points = [];
				for (var j = 0; j < item.geometry.coordinates[0].length; j++) {
					points.push(new LatLonPoint(item.geometry.coordinates[0][j][1], item.geometry.coordinates[0][j][0]));
				}
				polyline = new Polyline(points);
				//mapstraction.addPolylineWithData(polyline,{
				this.addPolylineWithData(polyline,{
					fillColor : item.poly_color,
					fillOpacity : item.poly_opacity,
					date : "new Date(\""+item.date+"\")",
					category : item.source_id,
					width : item.line_width,
					opacity : item.line_opacity,
					color : item.line_color,
					closed : points[points.length-1].equals(points[0]) //first point = last point in the polygon so its closed
				});
				markers.push(polyline);
				break;
			case "Stylers":
				this.changeMapStyle(item.geometry.stylers); //only for 'googlev3' api; apply styles to the map layer objects
				break;
			default:
				//console.log("Geometry: " + features.items[i].geometry.type);
		}
	}
	return markers;
};

/**
 * Change the map Layer Styles
 * @param {Array} stylersArray
 */
Mapstraction.prototype.changeMapStyle = function(stylersArray){
	
	//Note : only for 'googlev3' api
	if(this.api == 'googlev3'){
		/**
		 * stylersArray format:
		 * @see https://developers.google.com/maps/documentation/javascript/reference?hl=fr#MapTypeStyleFeatureType
		 * var styleArray = {
		 * 	features : [
		 * 		{
		 * 			type : "Feature",
		 * 			geometry : {
		 * 				type : "Stylers", //key name to apply Styles on map
		 * 				stylers : [
		 * 					{
		 * 						featureType : "road",
		 * 						elementType : "geometry",
		 * 						stylers : [
		 * 							{ "visibility": "on" },
		 * 							{ "color": "#F4B741" }
		 * 						]
		 * 					},
		 * 					{
		 * 						featureType : "water",
		 * 						elementType : "geometry",
		 * 						stylers : [
		 * 							{ visibility: "on" },
		 * 							{ color : "#2e2ebe" }
		 * 						] 
		 * 					}
		 * 				]
		 * 			}
		 * 		}
		 * 	]
		 * };
		 */
		this.invoker.go('changeMapStyle', [stylersArray]);
	}
};

/**
 * <p>Adds a Tile Layer to the map.</p>
 *
 * <p>Requires providing a templated tile URL. Use <code>{S}</code>, <code>{Z}</code>, <code>{X}</code>, and <code>{Y}</code> to specify where the parameters
 * should go in the URL. <code>{S}</code> is the (optional) subdomain to be used in the URL. <code>{Z}</code> is the zoom level.
 * <code>{X}</code> and <code>{Y}</code> are the longitude and latitude of the tile.</p>
 *
 * <p>Sample templated tile URLs are :-</p>
 * <ul>
 * <li>OpenStreetMap - <code>http://{S}.tile.openstreetmap.org/{Z}/{X}/{Y}.png</code></li>
 * <li>Stamen Toner - <code>http://tile.stamen.com/toner/{Z}/{X}/{Y}.png</code></li>
 * <li>MapQuest OSM - <code>http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg</code></li>
 * <li>MapQuest Open Aerial - <code>http://otile{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg</code></li>
 * </ul>
 *
 * @param {String} tile_url Template url of the tiles.
 * @param {Number} opacity Opacity of the tile layer - 0 is transparent, 1 is opaque. (default=0.6)
 * @param {String} label The label to be used for the tile layer in the Map Type control
 * @param {String} attribution The attribution and/or copyright text to use for the tile layer
 * @param {Int} min_zoom Minimum (furtherest out) zoom level that tiles are available (default=1)
 * @param {Int} max_zoom Maximum (closest) zoom level that the tiles are available (default=18)
 * @param {Boolean} map_type Should the tile layer be a selectable map type in the layers palette (default=false)
 * @param {String|Array} subdomains List of subdomains that the tile server in <code>tile_url</code> refers to. Can be specified as a string "abc" or as an array [1, 2, 3]
 * @return {Object} The tile layer object
 */
Mapstraction.prototype.addTileLayer = function(tile_url, opacity, label, attribution, min_zoom, max_zoom, map_type, subdomains) {
	if(!tile_url) {
		return;
	}
	
	opacity = opacity || 0.6;
	copyright_text = copyright_text || "Mapstraction";
	label = label || "Mapstraction";
	attribution = attribution || "Mapstraction";
	min_zoom = min_zoom || 1;
	max_zoom = max_zoom || 18;
	map_type = map_type || false;

	return this.invoker.go('addTileLayer', [ tile_url, opacity, label, attribution, min_zoom, max_zoom, map_type, subdomains] );
};

/**
 * addFilter adds a marker filter
 * @param {Object} field Name of attribute to filter on
 * @param {Object} operator Presently only "ge" or "le"
 * @param {Object} value The value to compare against
 */
Mapstraction.prototype.addFilter = function(field, operator, value) {
	if (!this.filters) {
		this.filters = [];
	}
	this.filters.push( [field, operator, value] );
};

/**
 * Remove the specified filter
 * @param {Object} field
 * @param {Object} operator
 * @param {Object} value
 */
Mapstraction.prototype.removeFilter = function(field, operator, value) {
	if (!this.filters) {
		return;
	}

	//var del;
	for (var f=0; f<this.filters.length; f++) {
		if (this.filters[f][0] == field &&
			(! operator || (this.filters[f][1] == operator && this.filters[f][2] == value))) {
			this.filters.splice(f,1);
			f--; //array size decreased
		}
	}
};

/**
 * Delete the current filter if present; otherwise add it
 * @param {Object} field
 * @param {Object} operator
 * @param {Object} value
 */
Mapstraction.prototype.toggleFilter = function(field, operator, value) {
	if (!this.filters) {
		this.filters = [];
	}

	var found = false;
	for (var f = 0; f < this.filters.length; f++) {
		if (this.filters[f][0] == field && this.filters[f][1] == operator && this.filters[f][2] == value) {
			this.filters.splice(f,1);
			f--; //array size decreased
			found = true;
		}
	}

	if (! found) {
		this.addFilter(field, operator, value);
	}
};

/**
 * removeAllFilters
 */
Mapstraction.prototype.removeAllFilters = function() {
	this.filters = [];
};

/**
 * doFilter executes all filters added since last call
 * Now supports a callback function for when a marker is shown or hidden
 * @param {Function} showCallback
 * @param {Function} hideCallback
 * @returns {Int} count of visible markers
 */
Mapstraction.prototype.doFilter = function(showCallback, hideCallback) {
	var map = this.maps[this.api];
	var visibleCount = 0;
	var f;
	if (this.filters) {
		switch (this.api) {
			case 'multimap':
				/* TODO polylines aren't filtered in multimap */
				var mmfilters = [];
				for (f=0; f<this.filters.length; f++) {
					mmfilters.push( new MMSearchFilter( this.filters[f][0], this.filters[f][1], this.filters[f][2] ));
				}
				map.setMarkerFilters( mmfilters );
				map.redrawMap();
				break;
			case '  dummy':
				break;
			default:
				var vis;
				for (var m=0; m<this.markers.length; m++) {
					vis = true;
					for (f = 0; f < this.filters.length; f++) {
						if (! this.applyFilter(this.markers[m], this.filters[f])) {
							vis = false;
						}
					}
					if (vis) {
						visibleCount ++;
						if (showCallback){
							showCallback(this.markers[m]);
						}
						else {
							this.markers[m].show();
						}
					} 
					else { 
						if (hideCallback){
							hideCallback(this.markers[m]);
						}
						else {
							this.markers[m].hide();
						}
					}

					this.markers[m].setAttribute("visible", vis);
				}
				break;
		}
	}
	return visibleCount;
};

Mapstraction.prototype.applyFilter = function(o, f) {
	var vis = true;
	switch (f[1]) {
		case 'ge':
			if (o.getAttribute( f[0] ) < f[2]) {
				vis = false;
			}
			break;
		case 'le':
			if (o.getAttribute( f[0] ) > f[2]) {
				vis = false;
			}
			break;
		case 'eq':
			if (o.getAttribute( f[0] ) != f[2]) {
				vis = false;
			}
			break;
		case 'in':
			if ( typeof(o.getAttribute( f[0] )) == 'undefined' ) {
				vis = false;
			} else if (o.getAttribute( f[0] ).indexOf( f[2] ) == -1 ) {
				vis = false;
			}
			break;
	}

	return vis;
};

/**
 * getAttributeExtremes returns the minimum/maximum of "field" from all markers
 * @param {Object} field Name of "field" to query
 * @returns {Array} of minimum/maximum
 */
Mapstraction.prototype.getAttributeExtremes = function(field) {
	var min;
	var max;
	for (var m=0; m<this.markers.length; m++) {
		if (! min || min > this.markers[m].getAttribute(field)) {
			min = this.markers[m].getAttribute(field);
		}
		if (! max || max < this.markers[m].getAttribute(field)) {
			max = this.markers[m].getAttribute(field);
		}
	}
	for (var p=0; m<this.polylines.length; m++) {
		if (! min || min > this.polylines[p].getAttribute(field)) {
			min = this.polylines[p].getAttribute(field);
		}
		if (! max || max < this.polylines[p].getAttribute(field)) {
			max = this.polylines[p].getAttribute(field);
		}
	}

	return [min, max];
};

/**
 * getMap returns the native map object that mapstraction is talking to
 * @returns the native map object mapstraction is using
 */
Mapstraction.prototype.getMap = function() {
	// FIXME in an ideal world this shouldn't exist right?
	return this.maps[this.api];
};


//////////////////////////////
//
//   LatLonPoint
//
/////////////////////////////

/**
 * Defines a coordinate point, expressed as a latitude and longitude.
 * @name mxn.LatLonPoint
 * @constructor
 * @param {Number} lat The point's latitude
 * @param {Number} lon The point's longitude
 * @exports LatLonPoint as mxn.LatLonPoint
 */
var LatLonPoint = mxn.LatLonPoint = function(lat, lon) {	
	this.lat = Number(lat); // force to be numeric
	this.lon = Number(lon);
	this.lng = this.lon; // lets be lon/lng agnostic
	
	this.invoker = new mxn.Invoker(this, 'LatLonPoint');		
};

mxn.addProxyMethods(LatLonPoint, [ 
	/**
	 * Extract the lat and lon values from a proprietary point.
	 * @name mxn.LatLonPoint#fromProprietary
	 * @function
	 * @param {String} api The API ID of the proprietary point.
	 * @param {Object} point The proprietary point.
	 */
	'fromProprietary',
	
	/**
	 * Converts the current LatLonPoint to a proprietary one for the API specified by <code>api</code>.
	 * @name mxn.LatLonPoint#toProprietary
	 * @function
	 * @param {String} api The API ID of the proprietary point.
	 * @returns A proprietary point.
	 */
	'toProprietary'
], true);

/**
 * Returns a string representation of a point
 * @name mxn.LatLonPoint#toString
 * @param {Number} places Optional number of decimal places to display for the lat and long
 * @returns A string like '51.23, -0.123'
 * @type {String}
 */
LatLonPoint.prototype.toString = function(places) {
	if (typeof places !== 'undefined') {
		return this.lat.toFixed(places) + ', ' + this.lon.toFixed(places);
	}
	else {
		return this.lat + ', ' + this.lon;
	}
};

/**
 * Returns the distance in kilometers between two <code>mxn.LatLonPoint</code> objects.
 * @param {mxn.LatLonPoint} otherPoint The other point to measure the distance from to this one
 * @returns the distance between the points in kilometers
 * @type {Number}
 */
LatLonPoint.prototype.distance = function(otherPoint) {
	// Uses Haversine formula from http://www.movable-type.co.uk
	var rads = Math.PI / 180;
	var diffLat = (this.lat-otherPoint.lat) * rads;
	var diffLon = (this.lon-otherPoint.lon) * rads; 
	var a = Math.sin(diffLat / 2) * Math.sin(diffLat / 2) +
		Math.cos(this.lat*rads) * Math.cos(otherPoint.lat*rads) * 
		Math.sin(diffLon/2) * Math.sin(diffLon/2); 
	return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 6371; // Earth's mean radius in km
};

/**
 * Tests if this <code>mxn.LatLonPoint</code> is equal to another point by precisely comparing the latitude and longitude values.
 * @param {mxn.LatLonPoint} otherPoint The other point to test with
 * @returns true or false
 * @type {Boolean}
 */
LatLonPoint.prototype.equals = function(otherPoint) {
	return this.lat == otherPoint.lat && this.lon == otherPoint.lon;
};

/**
 * Returns the latitude conversion based on the map's current projection
 * @returns {Number} conversion
 */
LatLonPoint.prototype.latConv = function() {
	return this.distance(new LatLonPoint(this.lat + 0.1, this.lon))*10;
};

/**
 * Returns the longitude conversion based on the map's current projection
 * @returns {Number} conversion
 */
LatLonPoint.prototype.lonConv = function() {
	return this.distance(new LatLonPoint(this.lat, this.lon + 0.1))*10;
};


//////////////////////////
//
//  BoundingBox
//
//////////////////////////

/**
 * Defines a bounding box, expressed as a rectangle by coordinates for the south west and north east corners.
 * @name mxn.BoundingBox
 * @constructor
 * @param {Number} swlat the latitude of the south-west point
 * @param {Number} swlon the longitude of the south-west point
 * @param {Number} nelat the latitude of the north-east point
 * @param {Number} nelon the longitude of the north-east point
 * @exports BoundingBox as mxn.BoundingBox
 */
var BoundingBox = mxn.BoundingBox = function(swlat, swlon, nelat, nelon) {
	//FIXME throw error if box bigger than world
	this.sw = new LatLonPoint(swlat, swlon);
	this.ne = new LatLonPoint(nelat, nelon);
	this.se = new LatLonPoint(swlat, nelon);
	this.nw = new LatLonPoint(nelat, swlon);
};

/**
 * Returns a string representation of an <code>mxn.BoundingBox</code>
 * @name mxn.BoundingBox#toString
 * @param {Number} [places] Optional number of decimal places to display for each lat and long
 * @returns a string like <code>SW: 52.62647572585443, 41.90677719368304, NE: 55.21343254471387, 56.01322251932069</code>
 * @type {String}
 */
BoundingBox.prototype.toString = function(places) {
	var sw;
	var ne;
	
	if (typeof places !== 'undefined') {
		sw = this.sw.toString(places);
		ne = this.ne.toString(places);
	}
	else {
		sw = this.sw;
		ne = this.ne;
	}
	
	return 'SW: ' + sw +  ', NE: ' + ne;
};

/**
 * Returns the <code>mxn.LatLonPoint</code> of the south-west point of the bounding box
 * @returns the south-west point of the bounding box
 * @type {mxn.LatLonPoint}
 */
BoundingBox.prototype.getSouthWest = function() {
	return this.sw;
};

/**
 * Returns the <code>mxn.LatLonPoint</code> of the north-east point of the bounding box
 * @returns the north-east point of the bounding box
 * @type {mxn.LatLonPoint}
 */
BoundingBox.prototype.getNorthEast = function() {
	return this.ne;
};

/**
 * Returns the <code>mxn.LatLonPoint</code> of the south-east point of the bounding box
 * @returns the south-east point of the bounding box
 * @type {mxn.LatLonPoint}
 */
BoundingBox.prototype.getSouthEast = function() {
	return this.se;
};

/**
 * Returns the <code>mxn.LatLonPoint</code> of the north-west point of the bounding box
 * @returns the north-west point of the bounding box
 * @type {mxn.LatLonPoint}
 */
BoundingBox.prototype.getNorthWest = function() {
	return this.nw;
};

/**
 * Determines if this <code>mxn.BoundingBox</code> has a zero area
 * @returns whether the north-east and south-west points of the bounding box are the same point
 * @type {Boolean}
 */
BoundingBox.prototype.isEmpty = function() {
	return this.ne == this.sw; // is this right? FIXME
};

/**
 *  Determines whether a given <code>mxn.LatLonPoint</code> is within an <code>mxn.BoundingBox</code>
 * @param {mxn.LatLonPoint} point the point to test with
 * @returns whether point is within this bounding box
 * @type {Boolean}
 */
BoundingBox.prototype.contains = function(point){
	return point.lat >= this.sw.lat && point.lat <= this.ne.lat && 
	((this.sw.lon <= this.ne.lon && point.lon >= this.sw.lon && point.lon <= this.ne.lon) || 
			(this.sw.lon > this.ne.lon && (point.lon >= this.sw.lon || point.lon <= this.ne.lon)));
};

/**
 * Returns an <code>mxn.LatLonPoint</code> with the lat and lon as the height and width of the <code>mxn.BoundingBox</code>
 * @returns A <code>mxn.LatLonPoint</code> containing the height and width of this the <code>mxn.BoundingBox</code>
 * @type {mxn.LatLonPoint}
 */
BoundingBox.prototype.toSpan = function() {
	return new LatLonPoint( Math.abs(this.sw.lat - this.ne.lat), Math.abs(this.sw.lon - this.ne.lon) );
};



/**
 * Extends the <code>mxn.BoundingBox</code> to include the new the <code>mxn.LatLonPoint</code>
 * @param {mxn.LatLonPoint} point The <code>mxn.LatLonPoint</code> around which the <code>mxn.BoundingBox</code> should be extended
 */
BoundingBox.prototype.extend = function(point) {
	var extended = false;
	if (this.sw.lat > point.lat) {
		this.sw.lat = point.lat;
		 extended = true;
	}
	if (this.sw.lon > point.lon) {
		this.sw.lon = point.lon;
		 extended = true;
	}
	if (this.ne.lat < point.lat) {
		this.ne.lat = point.lat;
		 extended = true;
	}
	if (this.ne.lon < point.lon) {
		this.ne.lon = point.lon;
		 extended = true;
	}
	
	if (extended) {
		this.se = new LatLonPoint(this.sw.lat, this.ne.lon);
		this.nw = new LatLonPoint(this.ne.lat, this.sw.lon);
	}
	return;
};

/**
 * Determines whether a given <code>mxn.BoundingBox</code> intersects another <code>mxn.BoundingBox</code>
 * @param {mxn.BoundingBox} other The <code>mxn.BoundingBox</code> to test against
 * @returns Whether the current <code>mxn.BoundingBox</code> overlaps the other
 * @type {Boolean}
 */
BoundingBox.prototype.intersects = function(other) {
	return this.sw.lat <= other.ne.lat && this.ne.lat >= other.sw.lat && 
	((this.sw.lon <= this.ne.lon && other.sw.lon <= other.ne.lon && this.sw.lon <= other.ne.lon && this.ne.lon >= other.sw.lon) || 
			(this.sw.lon > this.ne.lon && other.sw.lon > other.ne.lon) || 
			(this.sw.lon > this.ne.lon && other.sw.lon <= other.ne.lon && (this.sw.lon <= other.ne.lon || this.ne.lon >= other.sw.lon)) || 
			(this.sw.lon <= this.ne.lon && other.sw.lon > other.ne.lon && (this.ne.lon >= other.sw.lon || this.sw.lon <= other.ne.lon)));
};

//////////////////////////////
//
//  Marker
//
///////////////////////////////

/**
 * Creates a Mapstraction map marker capable of showing an optional <code>infoBubble</code> pop-up.
 * @name mxn.Marker
 * @constructor
 * @param {mxn.LatLonPoint} point The point specifying where on the map the <code>mxn.Marker</code> should be positioned.
 * @exports Marker as mxn.Marker
 */
var Marker = mxn.Marker = function(point) {
	this.api = null;
	this.location = point;
	this.onmap = false;
	this.proprietary_marker = false;
	this.defaultHandler = true;
	this.attributes = [];
	this.invoker = new mxn.Invoker(this, 'Marker', function(){return this.api;});
	mxn.addEvents(this, [ 
		'openInfoBubble',	// Info bubble opened
		'closeInfoBubble', 	// Info bubble closed
		'click',			// Marker clicked
		'dragend',			// Marker drag end
		'rightclick'		// Marker right-clicked
	]);
};

mxn.addProxyMethods(Marker, [ 
	/**
	 * Retrieve the settings from a proprietary marker.
	 * @name mxn.Marker#fromProprietary
	 * @function
	 * @param {String} api The API ID of the proprietary point.
	 * @param {Object} marker The proprietary marker.
	 */
	'fromProprietary',
	
	/**
	 * Hide the marker.
	 * @name mxn.Marker#hide
	 * @function
	 */
	'hide',
	
	/**
	 * Open the marker's <code>infoBubble</code> pop-up
	 * @name mxn.Marker#openBubble
	 * @function
	 */
	'openBubble',
	
	/**
	 * Closes the marker's <code>infoBubble</code> pop-up
	 * @name mxn.Marker#closeBubble
	 * @function
	 */
	'closeBubble',
	
	/**
	 * Show the marker.
	 * @name mxn.Marker#show
	 * @function
	 */
	'show',
	
	/**
	 * Converts the current Marker to a proprietary one for the API specified by <code>api</code>.
	 * @name mxn.Marker#toProprietary
	 * @function
	 * @param {String} api The API ID of the proprietary marker.
	 * @returns {Object} A proprietary marker.
	 */
	'toProprietary',
	
	/**
	 * Updates the Marker with the location of the attached proprietary marker on the map.
	 * @name mxn.Marker#update
	 * @function
	 */
	'update'
]);

/**
 * Sets a proprietary marker as a child of the current <code>mxn.Marker</code>.
 * @name mxn.Marker#setChild
 * @function
 * @param {Object} childMarker The proprietary marker's object
 */
Marker.prototype.setChild = function(childMarker) {
	this.proprietary_marker = childMarker;
	childMarker.mapstraction_marker = this;
	this.onmap = true;
};

/**
 * Sets the properties of a marker via an object literal, which contains the following
 * property name/value pairs:
 * 
 * <pre>
 * options = {
 * label: 'marker label; see <code>mxn.Marker.setLabel()</code>',
 * infoBubble: 'infoBubble text or HTML, see <code>mxn.Marker.setInfoBubble()</code>',
 * icon: 'icon image URL, see <code>mxn.Marker.setIcon()</code>',
 * iconSize: 'icon image size, see <code>mxn.Marker.setIcon()</code>',
 * iconAnchor: 'icon image anchor, see <code>mxn.Marker.setIcon()</code>',
 * iconShadow: 'icon shadow image URL, see <code>mxn.Marker.setShadowIcon()</code>',
 * iconShadowSize: 'icon shadow size, see <code>mxn.Marker.setShadowIcon()</code>',
 * infoDiv: 'informational div, see <code>mxn.Marker.setInfoDiv()</code>',
 * draggable: 'draggable state, see <code>mxn.Marker.setDraggable()</code>',
 * hover: 'hover text, see <code>mxn.Marker.setHover()</code>',
 * hoverIcon: 'hover icon URL, see <code>mxn.Marker.setHoverIcon()</code>',
 * openBubble: 'if specified, calls <code>mxn.Marker.openBubble()</code>',
 * closeBubble: 'if specified, calls <code>mxn.Marker.closeBubble()</code>',
 * groupName: 'marker group name, see <code>mxn.Marker.setGroupName()</code>',
 * defaultHandler: 'controls default marker handler; see <code>mxn.Marker.defaultHandler()</code>'
 * };
 * </pre>
 * 
 * <p>Any other literal name value pairs are added to the marker's list of properties.</p>
 *  @param {Object} options An object literal of property name/value pairs.
 */
Marker.prototype.addData = function(options){
	for(var sOptKey in options) {
		if(options.hasOwnProperty(sOptKey)){
			switch(sOptKey) {
				case 'label':
					this.setLabel(options.label);
					break;
				case 'infoBubble':
					this.setInfoBubble(options.infoBubble);
					break;
				case 'icon':
					if(options.iconSize && options.iconAnchor) {
						this.setIcon(options.icon, options.iconSize, options.iconAnchor);
					}
					else if(options.iconSize) {
						this.setIcon(options.icon, options.iconSize);
					}
					else {
						this.setIcon(options.icon);
					}
					break;
				case 'iconShadow':
					if(options.iconShadowSize) {
						this.setShadowIcon(options.iconShadow, [ options.iconShadowSize[0], options.iconShadowSize[1] ]);
					}
					else {
						this.setIcon(options.iconShadow);
					}
					break;
				case 'infoTooltip':
					this.setInfoTooltip(options.infoTooltip);
					break;
				/*
				case 'infoDiv':
					this.setInfoDiv(options.infoDiv[0],options.infoDiv[1]);
					break;*/
				case 'draggable':
					this.setDraggable(options.draggable);
					break;
				case 'hover':
					this.setHover(options.hover);
					//this.setHoverIcon(options.hoverIcon);
					break;
				case 'hoverIcon':
					this.setHoverIcon(options.hoverIcon);
					break;
				case 'openBubble':
					this.openBubble();
					break;
				case 'closeBubble':
					this.closeBubble();
					break;
				case 'groupName':
					this.setGroupName(options.groupName);
					break;
				case 'defaultHandler':
					this.defaultHandler(options.defaultHandler);
					break;
				default:
					// don't have a specific action for this bit of
					// data so set a named attribute
					this.setAttribute(sOptKey, options[sOptKey]);
					break;
			}
		}
	}
};

/**
 * Sets the HTML or text content for the marker's <code>InfoBubble</code> pop-up.
 * @param {String} infoBubble The HTML or plain text to be displayed
 */
Marker.prototype.setInfoBubble = function(infoBubble) {
	this.infoBubble = infoBubble;
};

/**
 * Sets the text content and the id of the <code>DIV</code> element to display additional
 * information associated with the marker; useful for putting information in a <code>DIV</code>
 * outside of the map
 * @param {String} infoDiv The HMTML or text content to be displayed
 * @param {String} div The element id to use for displaying the HTML or text content
 * 
Marker.prototype.setInfoDiv = function(infoDiv, div){
	this.infoDiv = infoDiv;
	this.div = div;
};*/

/**
 * Sets the label text of the current <code>mxn.Marker</code>. The label is used in some maps
 * API implementation as the text to be displayed when the mouse pointer hovers over the marker.
 * @name mxn.Marker#setLabel
 * @function
 * @param {String} labelText The text you want displayed
 */
Marker.prototype.setLabel = function(labelText) {
	this.labelText = labelText;
};

/**
 * Sets the text content for a tooltip on a marker
 * @param {String} tooltipText The text you want displayed
 */
Marker.prototype.setInfoTooltip = function(tooltipText){
	this.tooltipText = tooltipText;
};

/**
 * Sets the icon for a marker
 * @param {String} iconUrl The URL of the image you want to be the icon
 */
Marker.prototype.setIcon = function(iconUrl, iconSize, iconAnchor) {
	this.iconUrl = iconUrl;
	if(iconSize) {
		this.iconSize = iconSize;
	}
	if(iconAnchor) {
		this.iconAnchor = iconAnchor;
	}
};

/**
 * Sets the size of the icon for a marker
 * @param {Array} iconSize The array size in pixels of the marker image: <code>[width, height]</code>
 */
Marker.prototype.setIconSize = function(iconSize) {
	if(iconSize) {
		this.iconSize = iconSize;
	}
};

/**
 * Sets the anchor point for a marker
 * @param {Array} iconAnchor The array offset in pixels of the anchor point from top left: <code>[right, down]</code>
 */
Marker.prototype.setIconAnchor = function(iconAnchor){
	if(iconAnchor) {
		this.iconAnchor = iconAnchor;
	}
};

/**
 * Sets the icon for a marker
 * @param {String} iconUrl The URL of the image you want to be the icon
 */
Marker.prototype.setShadowIcon = function(iconShadowUrl, iconShadowSize){
	this.iconShadowUrl = iconShadowUrl;
	if(iconShadowSize) {
		this.iconShadowSize = iconShadowSize;
	}
};

/**
 * Sets the icon to be used on hover
 *  @param {String} hoverIconUrl The URL of the image to be used
 */
Marker.prototype.setHoverIcon = function(hoverIconUrl){
	this.hoverIconUrl = hoverIconUrl;
};

/**
 * Sets the draggable state of the marker
 * @param {Boolean} draggable Set to <code>true</code> if the marker should be draggable by the user
 */
Marker.prototype.setDraggable = function(draggable) {
	this.draggable = draggable;
};

/**
 * Sets that the marker label is to be displayed on hover
 * @param {Boolean} hover Set to to <code>true</code> if the marker should display the label on hover
 */
Marker.prototype.setHover = function(hover) {
	this.hover = hover;
};

/**
 * Add this marker to a named group; used in decluttering a group of markers.
 * @param {string} groupName Name of the marker's group
 * @see mxn.Mapstraction.declutterGroup
 */
Marker.prototype.setGroupName = function(groupName) {
	this.groupName = groupName;
};

/**
 * Controls whether this marker installs a default click or hover handler. 
 * @param {boolean} handlerState. If <code>true</code> and 
 * hover is also <code>true</code>, a mouseover event will open the marker's infoBubble,
 * if specified. If <code>true</code> and hover is <code>false</code>, a click event will
 * open the marker's infoBubble. If <code>false</code>, no default event handler will be
 * installed for this marker.
 * @see mxn.Marker.addData
 */
Marker.prototype.setDefaultHandler = function(handlerState) {
	this.defaultHandler = handlerState;
};

/**
 * Set an arbitrary property name and value on a marker
 * @param {String} key The property key name
 * @param {String} value The property value to be associated with the key
 */
Marker.prototype.setAttribute = function(key,value) {
	this.attributes[key] = value;
};

/**
 * Gets the value of a marker's property
 * @param {String} key The key whose value is to be returned
 * @returns {String} The value associated with the key
 */
Marker.prototype.getAttribute = function(key) {
	return this.attributes[key];
};

///////////////
// Polyline ///
///////////////

/**
 * Creates a Mapstraction Polyline; either an open-ended polyline or an enclosed polygon.
 * @name mxn.Polyline
 * @constructor
 * @param {Array} points Array of <code>mxn.LatLonPoint</code> make up the Polyline.
 * @exports Polyline as mxn.Polyline
 */
var Polyline = mxn.Polyline = function(points) {
	this.api = null;
	this.points = points;
	this.attributes = [];
	this.onmap = false;
	this.proprietary_polyline = false;
	this.pllID = "mspll-"+new Date().getTime()+'-'+(Math.floor(Math.random()*Math.pow(2,16)));
	this.invoker = new mxn.Invoker(this, 'Polyline', function(){return this.api;});
	this.color = "#000000";
	this.width = 3;
	this.opacity = 0.5;
	this.closed = false;
	this.fillColor = "#808080";
};

mxn.addProxyMethods(mxn.Polyline, [ 

	/**
	 * Retrieve the settings from a proprietary polyline.
	 * @name mxn.Polyline#fromProprietary
	 * @function
	 * @param {String} api The API ID of the proprietary polyline.
	 * @param {Object} polyline The proprietary polyline.
	 */
	'fromProprietary', 
	
	/**
	 * Hide the polyline.
	 * @name mxn.Polyline#hide
	 * @function
	 */
	'hide',
	
	/**
	 * Show the polyline.
	 * @name mxn.Polyline#show
	 * @function
	 */
	'show',
	
	/**
	 * Converts the current Polyline to a proprietary one for the API specified by <code>api</code>.
	 * @name mxn.Polyline#toProprietary
	 * @function
	 * @param {String} api The API ID of the proprietary polyline.
	 * @returns {Object} A proprietary polyline.
	 */
	'toProprietary',
	
	/**
	 * Updates the Polyline with the path of the attached proprietary polyline on the map.
	 * @name mxn.Polyline#update
	 * @function
	 */
	'update'
]);

/**
 * <p>Sets the properties of a polyline via an object literal, which contains the following
 * property name/value pairs:</p>
 * 
 * <pre>
 * options = {
 * color: 'line color; see <code>mxn.Polyline.setColor()</code>',
 * width: 'line stroke width; see <code>mxn.Polyline.setWidth()</code>',
 * opacity: 'polyline opacity; see <code>mxn.Polyline.setOpacity()</code>',
 * closed: 'polyline or polygon; see <code>mxn.Polyline.setClosed()</code>',
 * fillColor: 'fill color; see <code>mxn.Polyline.seFillColor()</code>',
 * };
 * </pre>
 * 
 * <p>Any other literal name value pairs are added to the marker's list of properties.</p>
 * @param {Object} options An object literal of property name/value pairs.
 */
Polyline.prototype.addData = function(options){
	for(var sOpt in options) {
		if(options.hasOwnProperty(sOpt)){
			switch(sOpt) {
				case 'color':
					this.setColor(options.color);
					break;
				case 'width':
					this.setWidth(options.width);
					break;
				case 'opacity':
					this.setOpacity(options.opacity);
					break;
				case 'closed':
					this.setClosed(options.closed);
					break;
				case 'fillColor':
					this.setFillColor(options.fillColor);
					break;
				case 'fillOpacity':
					this.setFillOpacity(options.fillOpacity);
					break;
				default:
					this.setAttribute(sOpt, options[sOpt]);
					break;
			}
		}
	}
};

/**
 * Sets a proprietary polyline as a child of the current <code>mxn.Polyline</code>.
 * @param {Object} childPolyline The proprietary polyline's object
 */
Polyline.prototype.setChild = function(childPolyline) {
	this.proprietary_polyline = childPolyline;
	this.onmap = true;
};

/**
 * Sets the line color for the polyline.
 * @param {String} color RGB color expressed in the form <code>#RRGGBB</code>
 */
Polyline.prototype.setColor = function(color){
	this.color = (color.length==7 && color[0]=="#") ? color.toUpperCase() : color;
};

/**
 * Sets the line stroke width of the polyline
 * @param {Number} width Line stroke width in pixels.
 */
Polyline.prototype.setWidth = function(width){
	this.width = width;
};

/**
 * Sets the polyline opacity.
 * @param {Number} opacity A number between <code>0.0</code> (transparent) and <code>1.0</code> (opaque)
 */
Polyline.prototype.setOpacity = function(opacity){
	this.opacity = opacity;
};

/**
 * Marks the polyline as a closed polygon
 * @param {Boolean} closed Specify as <code>true</code> to mark the polyline as an enclosed polygon
 */
Polyline.prototype.setClosed = function(closed){
	this.closed = closed;
};

/**
 * Sets the fill color for a closed polyline.
 * @param {String} color RGB color expressed in the form <code>#RRGGBB</code>
 */
Polyline.prototype.setFillColor = function(fillColor) {
	this.fillColor = (fillColor.length==7 && fillColor[0]=="#") ? fillColor.toUpperCase() : fillColor;//this.fillColor = fillColor;
};

/**
 * Fill opacity for a closed polyline as a float between 0.0 and 1.0
 * @param {Float} fill opacity
 */
Polyline.prototype.setFillOpacity = function(sFillOpacity) {
	this.fillOpacity = sFillOpacity;
};

/**
 * Set an arbitrary key/value pair on a polyline
 * @param {String} key
 * @param value
 */
Polyline.prototype.setAttribute = function(key,value) {
	this.attributes[key] = value;
};

/**
 * Gets the value of a polyline's property
 * @param {String} key The key whose value is to be returned
 * @returns {String} The value associated with the key
 */
Polyline.prototype.getAttribute = function(key) {
	return this.attributes[key];
};

/**
 * Simplifies a polyline, averaging and reducing the points
 * @param {Number} tolerance The simplification tolerance; 1.0 is a good starting point
 */
Polyline.prototype.simplify = function(tolerance) {
	var reduced = [];

	// First point
	reduced[0] = this.points[0];

	var markerPoint = 0;

	for (var i = 1; i < this.points.length-1; i++){
		if (this.points[i].distance(this.points[markerPoint]) >= tolerance)
		{
			reduced[reduced.length] = this.points[i];
			markerPoint = i;
		}
	}

	// Last point
	reduced[reduced.length] = this.points[this.points.length-1];

	// Revert
	this.points = reduced;
};

///////////////
// Radius	//
///////////////

/**
 * Creates a Mapstraction Radius for drawing circles around a given point. Note that creating
 * a radius performs a lot of initial calculation which can lead to increased page load times.
 * @name mxn.Radius
 * @constructor
 * @param {mxn.LatLonPoint} center Central <code>mxn.LatLonPoint</code> of the radius
 * @param {Number} quality Number of points that comprise the approximated circle (20 is a good starting point)
 * @exports Radius as mxn.Radius
 */
var Radius = mxn.Radius = function(center, quality) {
	this.center = center;
	var latConv = center.latConv();
	var lonConv = center.lonConv();

	// Create Radian conversion constant
	var rad = Math.PI / 180;
	this.calcs = [];

	for(var i = 0; i < 360; i += quality){
		this.calcs.push([Math.cos(i * rad) / latConv, Math.sin(i * rad) / lonConv]);
	}
};

/**
 * Returns the <code>mxn.Polyline</code> of a circle around the point based on a new radius value.
 * @param {Number} radius The new radius value
 * @param {String} color RGB fill color expressed in the form <code>#RRGGBB</code>
 * @returns {mxn.Polyline} The calculated <code>mxn.Polyline</code>
 */
Radius.prototype.getPolyline = function(radius, color) {
	var points = [];
	
	for(var i = 0; i < this.calcs.length; i++){
		var point = new LatLonPoint(
			this.center.lat + (radius * this.calcs[i][0]),
			this.center.lon + (radius * this.calcs[i][1])
		);
		points.push(point);
	}
	
	// Add first point
	points.push(points[0]);

	var line = new Polyline(points);
	line.setClosed(false);
	line.setColor(color);

	return line;
};

///////////////
// Radar    ///
///////////////

/**
 * Creates a new radar object for drawing circles around a point, does a lot of initial calculation to increase load time
 * @author Kolor
 * @name mxn.Radar
 * @constructor
 * @param {LatLonPoint} center LatLonPoint of the radar pivot
 * @param {Object} radarOptions options for the radar settings
 * Keys are: fov, heading, radius, quality, color, opacity, width, fillColor, fillOpacity.
 * @exports Radar as mxn.Radar
 */
var Radar = mxn.Radar = function(center, radarOptions) {
	
	this.center = center;
	this.api = null;
	this.mapstraction = null;
	this.onmap = false;
	this.proprietary_radar = false;
	this.radID = "msrad-"+new Date().getTime()+'-'+(Math.floor(Math.random()*Math.pow(2,16)));
	this.attributes = [];
	this.clickable = false;
	
	// radar radius linked to the zoom level
	if (radarOptions.linkToZoom) {
		this.linkToZoom = true;
		// define the current zoom level of the map
		this.currentZoomLevel = 10;
	}
	// store the current view hlookat
	this.currentViewHeading = 0;
	
	//view angle in degrees
	if ( typeof radarOptions.fov=="undefined" || radarOptions.fov < 1 || radarOptions.fov > 180) {
		radarOptions.fov = 90;
	}
	
	this.fov = radarOptions.fov;
	//starting angle in degrees normalized (90° for 3 o'clock)
	if (typeof radarOptions.heading=="undefined") {
		radarOptions.heading = -Math.round(this.fov / 2);
	}else{
		radarOptions.heading = radarOptions.heading - Math.round(this.fov / 2);
	}
	//change heading for engine rotation preset (for krpano : +90°)
	if (typeof radarOptions.enginePreset!="undefined" && parseInt(radarOptions.enginePreset)) {
		radarOptions.heading += radarOptions.enginePreset;
	}
	// set rotation to clockwise direction 
	this.heading = -radarOptions.heading;
	
	//set init fov value and prepare current fov incidence value
	this.initFov = radarOptions.fov;
	this.fovIncidence = this.initFov - radarOptions.fov;
	
	//radius
	if ( typeof radarOptions.radius=="undefined" || radarOptions.radius < 1 || radarOptions.radius > 20000) {
		radarOptions.radius = 8000;
	}
	this.radius = radarOptions.radius;
	//quality
	if ( typeof radarOptions.quality=="undefined" || radarOptions.quality < 1 || radarOptions.quality > 20) {
		radarOptions.quality = 8;
	}
	this.quality = radarOptions.quality;
	this.color = ktools.Color.htmlColor(radarOptions.color, '#FFFFFF');
	//(typeof radarOptions.color!="undefined" && radarOptions.color.length==7 && radarOptions.color[0]=="#") ? radarOptions.color.toUpperCase() : '#FFFFFF';
	this.opacity = (typeof radarOptions.opacity!="undefined" && !isNaN(parseFloat(radarOptions.opacity)) && radarOptions.opacity>=0 && radarOptions.opacity<=1) ? radarOptions.opacity : 0.5;
	this.width = (typeof radarOptions.width!="undefined" && !isNaN(parseInt(radarOptions.width)) && radarOptions.width>0 && radarOptions.width<10) ? radarOptions.width : 1;
	this.fillColor = ktools.Color.htmlColor(radarOptions.fillColor, '#FFFFFF');
	//(typeof radarOptions.fillColor!="undefined" && radarOptions.fillColor.length==7 && radarOptions.fillColor[0]=="#") ? radarOptions.fillColor.toUpperCase() : '#FFFFFF';
	this.fillOpacity = (typeof radarOptions.fillOpacity!="undefined" && !isNaN(parseFloat(radarOptions.fillOpacity)) && radarOptions.fillOpacity>=0 && radarOptions.fillOpacity<=1) ? radarOptions.fillOpacity : 0.3;
	
	this.invoker = new mxn.Invoker(this, 'Radar', function(){return this.api;});
	mxn.addEvents(this, [ 
	             		'mouseMoveRadar', 	// Radar move on mouse over
	             		'changeDirectionRadar', //Radar change direction (heading and fov)
	             		'click'				// Radar clicked
	             	]);
	
	//add polyline object
	this.polyline = this.getPolyline();
};

mxn.addProxyMethods(Radar, [ 

	/**
	 * Hide the radar.
	 * @name mxn.Radar#hide
	 * @function
	 */
	'hide',
	
	/**
	 * Show the radar.
	 * @name mxn.Radar#show
	 * @function
	 */
	'show',
	
	/**
	 * Converts the current Radar Polyline to a proprietary one for the API specified by apiId.
	 * @name mxn.Radar#toProprietary
	 * @function
	 * @param {String} apiId The API ID of the proprietary radar polyline.
	 * @returns A proprietary radar polyline.
	 */
	'toProprietary',
	
	/**
	 * Bind Radar to the mouse position.
	 * @name mxn.Radar#mouseMove
	 * @function
	 */
	'mouseMove',
	
	/**
	 * Activate the click on the radar.
	 * @name mxn.Radar#activateClick
	 * @function
	 */
	'activateClick'
]);

/**
 * addData conviniently set a hash of options on a marker
 * @param {Object} options An object literal hash of key value pairs. 
 * Keys are: mouseMove, activateClick.
 */
Radar.prototype.addData = function(options){
	for(var sOptKey in options) {
		if(options.hasOwnProperty(sOptKey)){
			switch(sOptKey) {
				case 'mouseMouve':
					this.mouseMove();
					break;
				case 'activateClick':
					this.activateClick();
					break;
				default:
					// don't have a specific action for this bit of
					// data so set a named attribute
					this.setAttribute(sOptKey, options[sOptKey]);
					break;
			}
		}
	}
};

Radar.prototype.setChild = function(some_proprietary_radar) {
	this.proprietary_radar = some_proprietary_radar;
	this.onmap = true;
};

/**
 * Set an arbitrary key/value pair on a radar
 * @param {String} key
 * @param value
 */
Radar.prototype.setAttribute = function(key,value) {
	this.attributes[key] = value;
};

/**
 * Gets the value of "key"
 * @param {String} key
 * @returns value
 */
Radar.prototype.getAttribute = function(key) {
	return this.attributes[key];
};

/**
 * Returns polyline of a circle around the point based on new radar
 * @author Kolor
 * @returns {Polyline} Radar polyline
 */
Radar.prototype.getPolyline = function() {
	
	var points = KolorMap.util.generatePolygonPoints(this, this.center);
	
	var polyline = new Polyline(points);
	polyline.setClosed(true);
	polyline.setColor(this.color);
	polyline.setOpacity(this.opacity);
	polyline.setWidth(this.width);
	polyline.setFillColor(this.fillColor);
	polyline.setFillOpacity(this.fillOpacity);
	
	return polyline;
};

/**
 * @description Change de heading and fov values of the radar.
 * @name mxn.Radar#changeDirection
 * @param {Number} heading The heading to draw the proprietary radar polyline.
 * @param {Number} fov The fov value to draw the proprietary radar polyline.
*/
Radar.prototype.changeDirection = function(heading, fov) {
	var centerPoint = this.center;
	var selfRadar = this;
	
	//update the current fov value and it's incidence between radar init and current fov value
	selfRadar.fovIncidence = selfRadar.initFov - fov;
	selfRadar.fov = fov;
	
	var bearingOrientation = (heading + 360 - Math.round(selfRadar.fovIncidence / 2)) % 360; //convert heading into 360 degrees
	
	//rotate the current radar polygon and update radar object
	selfRadar =	KolorMap.util.rotation(selfRadar, centerPoint, bearingOrientation, selfRadar.mapstraction);
	
	this.changeDirectionRadar.fire( { 'radar': this } );
};

})();
