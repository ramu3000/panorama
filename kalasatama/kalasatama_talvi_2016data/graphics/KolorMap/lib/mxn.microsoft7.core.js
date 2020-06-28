mxn.register('microsoft7', {

Mapstraction: {
	init: function(element, api) {
		
		var me = this;
		
		if (typeof Microsoft.Maps === 'undefined') {
			throw new Error(api + ' map script not imported');
		}
		
		// The design decisions behind the Microsoft/Bing v7 API are simply jaw dropping.
		// Want to show/hide the dashboard or show/hide the scale bar? Nope. You can only
		// do that when you're creating the map object. Once you've done that the map controls
		// stay "as-is" unless you want to tear down the map and redisplay it. And as for the
		// overview "mini-map", that's not supported at all and you have to write your own.
		// See http://msdn.microsoft.com/en-us/library/gg427603.aspx for the whole sorry tale.

		this.maps[api] = new Microsoft.Maps.Map(element, { 
			credentials: microsoft_key, 
			enableClickableLogo: false, // Stop the Bing logo from being clickable, so no-one accidently clicks it and leaves the map
			enableSearchLogo: false // Remove the pointless Bing Search advert form the map's lower left, as this has nothing to do with the map
		});
		//Now get the update the microsoft key to be session key for geocoding use later without racking up api hits
		this.maps[api].getCredentials(function(credentials) { 
			if(credentials !== null) { microsoft_key = credentials; } 
		});
		
		//Add Click Event - with IE7 workaround if needed
		if (element.addEventListener){
			element.addEventListener('contextmenu', function (evt) {
				e = evt?evt:window.event;
				if (e.preventDefault) e.preventDefault(); // For non-IE browsers.
				else e.returnValue = false; // For IE browsers.
			});
		} else if (element.attachEvent){
			element.attachEvent('oncontextmenu', function (evt) {
				e = evt?evt:window.event;
				if (e.preventDefault) e.preventDefault(); // For non-IE browsers.
				else e.returnValue = false; // For IE browsers.
			});
		}
		/*
		Microsoft.Maps.Events.addHandler(this.maps[api], 'rightclick', function(event) {
			var map = me.maps[me.api];
			var _x = event.getX();
			var _y = event.getY();
			var pixel = new Microsoft.Maps.Point(_x, _y);
			var ll = map.tryPixelToLocation(pixel);
			var _event = {
					'location': new mxn.LatLonPoint(ll.latitude, ll.longitude),
					'position': {x:_x, y:_y},
					'button': 'right'
				};
			me.click.fire(_event);
		});
		*/
		Microsoft.Maps.Events.addHandler(this.maps[api], 'click', function(event){
			var map = me.maps[me.api];
			
			e = event.originalEvent?event.originalEvent:window.event;
			if (e.preventDefault) e.preventDefault(); // For non-IE browsers.
			else e.returnValue = false; // For IE browsers.
			
			if (event.targetType == 'pushpin') {
				event.target.mapstraction_marker.click.fire();
			}
			else {
				var _x = event.getX();
				var _y = event.getY();
				var pixel = new Microsoft.Maps.Point(_x, _y);
				var ll = map.tryPixelToLocation(pixel);
				var _event = {
					'location': new mxn.LatLonPoint(ll.latitude, ll.longitude),
					'position': {x:_x, y:_y},
					'button': event.isSecondary ? 'right' : 'left'
				};
				me.click.fire(_event);
			}
		});
		Microsoft.Maps.Events.addHandler(this.maps[api], 'viewchangeend', function(event){
			me.changeZoom.fire();
			me.endPan.fire();
		});
		Microsoft.Maps.Events.addHandler(this.maps[api], 'viewchange', function(event){
			me.endPan.fire();
		});
		
		//set focus/blur actions for keyboard events
		var msMapThis = this.maps[api];
		Microsoft.Maps.Events.addHandler(this.maps[api], 'mouseover', function(e) { msMapThis.focus(); });
		Microsoft.Maps.Events.addHandler(this.maps[api], 'mouseout', function(e) { msMapThis.blur(); });
		
		var loadListener = Microsoft.Maps.Events.addHandler(this.maps[api], 'tiledownloadcomplete', function(event) {
			me.load.fire();
			Microsoft.Maps.Events.removeHandler(loadListener);
		});
		
		if (jQuery) {
			jQuery("<style type='text/css'>.microsoft7SpotPointer { cursor: pointer !important; }</style>").appendTo("head");
			jQuery("<style type='text/css'>#"+element.id+" svg { position: absolute; }</style>").appendTo("head");
		}
		
		me.storeElement = element;
	},
	
	applyOptions: function(){
		var map = this.maps[this.api];
		var opts = map.getOptions();
		
		opts.disablePanning = !this.options.enableDragging;
		// activate general zoom if dbl click OR scroll is activated
		opts.disableZooming = ( !this.options.enableScrollWheelZoom || this.options.disableDoubleClickZoom );
		
		map.setOptions(opts);
	},

	resizeTo: function(width, height){	
		var map = this.maps[this.api];
		map.setOptions(height,width);
		/*
		var options = map.getOptions();
		options.zoom = zoom;
		map.setView(options);
		*/
	},

	// Code Health Warning
	// Microsoft7 only supports (most of) the display controls as part of the Dashboard
	// and this needs to be configured *before* the map is instantiated and displayed.
	// So addControls, addSmallControls, addLargeControls and addMapTypeControls are
	// effectively no-ops and so they don't throw the unsupported feature exception.
	
	addControls: function( args ) {
		//var map = this.maps[this.api];
		//update CSS to change display of div on the fly
		if (jQuery) {
			var me = this;
			me.myInterval = setInterval(function(){
				me.addControlsTimer( args );
			},20);
		} else {
			throw 'jQuery doesn\'t exists to CSS add/remove controls';
		}
		//throw new Error('Mapstraction.addControls is not currently supported by provider ' + this.api);
	},
	
	addControlsTimer: function( args ) {
		var counterInterval = 0;
		if( jQuery(".OverlaysTL .NavBar_compassControlContainer").length ){
			clearInterval(this.myInterval);
			this.addControlsTimeout(args);
		}else if(counterInterval > 10){
			clearInterval(this.myInterval);
		}else{
			counterInterval++;
		}
	},
	
	addControlsTimeout: function ( args ) {
		//note : overview mini-map doesn't exists
		if ( !args.pan ) {
			if ( jQuery(".OverlaysTL .NavBar_compassControlContainer").length ){
				jQuery(".OverlaysTL .NavBar_compassControlContainer").css('display','none');
			}
		}else{
			this.addControlsArgs.pan = true;
		}
		if( !args.zoom ){
			if(jQuery(".OverlaysTL .NavBar_zoomControlContainer").length ){
				jQuery(".OverlaysTL .NavBar_zoomControlContainer").css('display','none');
			}
		}else{
			this.addControlsArgs.zoom = args.zoom;
		}
		if( !args.map_type ){
			if(jQuery(".OverlaysTL .NavBar_compassControlContainer").length ){
				jQuery(".OverlaysTL .NavBar_modeSelectorControlContainer").css('display','none');
			}
		}else{
			this.addControlsArgs.map_type = true;
		}
		if( !args.scale ) {
			if(jQuery(".OverlaysBR-logoAware .ScaleBarContainer").length ){
				jQuery(".OverlaysBR-logoAware .ScaleBarContainer").css('display','none');
			}
		}else{
			this.addControlsArgs.scale = true;
		}
	},
	
	addSmallControls: function() {
		//update CSS to change display of div on the fly
		if (jQuery) {
			var args = {pan: false, scale: false, zoom: 'small'};
			var me = this;
			me.myInterval = setInterval(function(){
				me.addControlsTimer( args );
			},20);
		} else {
			throw 'jQuery doesn\'t exists to CSS add/remove controls';
		};
		//throw new Error('Mapstraction.addSmallControls is not currently supported by provider ' + this.api);
	},

	addLargeControls: function() {
		//update CSS to change display of div on the fly
		if (jQuery) {
			var args = {pan: true, zoom: 'large'};
			var me = this;
			me.myInterval = setInterval(function(){
				me.addControlsTimer( args );
			},20);
		} else {
			throw 'jQuery doesn\'t exists to CSS add/remove controls';
		}
		//throw new Error('Mapstraction.addLargeControls is not currently supported by provider ' + this.api);
	},

	addMapTypeControls: function() {
		//update CSS to change display of div on the fly
		if (jQuery) {
			var args = {map_type: true};
			var me = this;
			me.myInterval = setInterval(function(){
				me.addControlsTimer( args );
			},20);
		} else {
			throw 'jQuery doesn\'t exists to CSS add/remove controls';
		}
		//throw new Error('Mapstraction.addMapTypeControls is not currently supported by provider ' + this.api);
	},

	setCenterAndZoom: function(point, zoom) { 
		var map = this.maps[this.api];
		var pt = point.toProprietary(this.api);	

		// Get the existing options.
		var options = {};
		options.zoom = zoom;
		options.center = pt;
		map.setView(options);
	},
	
	addMarker: function(marker, old) {
		return marker.toProprietary(this.api);;
	},
	
	removeMarker: function(marker) {
		//remove use marker.api, so marker must be up to date into vendor api
		var map = this.maps[marker.api];
		if (marker.proprietary_marker) {
			map.entities.remove(marker.proprietary_marker);
		}
	},
	
	declutterMarkers: function(opts) {
		throw new Error('Mapstraction.declutterMarkers is not currently supported by provider ' + this.api);
	},
	
	changeMapStyle: function(styleArray) {
		throw new Error('Mapstraction.changeMapStyle is not currently supported by provider ' + this.api);
	},
	
	addPolyline: function(polyline, old) {
		var map = this.maps[this.api];
		var pl = polyline.toProprietary(this.api);
		
		map.entities.push(pl);
		
		return pl;
	},

	removePolyline: function(polyline) {
		var map = this.maps[this.api];
		
		if (polyline.proprietary_polyline) {
			map.entities.remove(polyline.proprietary_polyline);
		}
	},
	
	/**
	 * @author Kolor
	 */
	addRadar: function(radar, old) {
		var map = this.maps[this.api];
		var propRadar = radar.toProprietary(this.api);
		map.entities.push(propRadar);
		return propRadar;
	},
	
	removeRadar: function(radar) {
		var map = this.maps[this.api];
		if (radar.proprietary_radar) {
			map.entities.remove(radar.proprietary_radar);
		}
	},
	
	getCenter: function() {
		var map = this.maps[this.api];
		// Get the existing options.
		//var options = map.getOptions();
		//return new mxn.LatLonPoint(options.center.latitude,options.center.longitude);
		
		var center = map.getCenter();
		return new mxn.LatLonPoint(center.latitude, center.longitude);
	},

	setCenter: function(point, options) {
		var map = this.maps[this.api];
		var pt = point.toProprietary(this.api);
	 
		// Get the existing options.
		var msOptions = map.getOptions();
		msOptions.center = pt;
		msOptions.bounds = null;
		map.setView(msOptions);
	},

	setZoom: function(zoom) {
		var map = this.maps[this.api];
		// Get the existing options.
		var options = map.getOptions();
		options.zoom = zoom;
		map.setView(options);
		
	},
	
	getZoom: function() {
		var map = this.maps[this.api];
		return map.getZoom();
	},

	getZoomLevelForBoundingBox: function( bbox ) {
		//var map = this.maps[this.api];
		// NE and SW points from the bounding box.
		//var ne = bbox.getNorthEast();
		//var sw = bbox.getSouthWest();
		//var zoom;
		
		throw new Error('Mapstraction.getZoomLevelForBoundingBox is not currently supported by provider ' + this.api);
	},

	setMapType: function(type) {
		var map = this.maps[this.api];
		var options = map.getOptions();
		
		switch (type) {
			case mxn.Mapstraction.ROAD:
				options.mapTypeId = Microsoft.Maps.MapTypeId.road;
				break;
			case mxn.Mapstraction.SATELLITE:
				options.mapTypeId = Microsoft.Maps.MapTypeId.aerial;
				options.labelOverlay = Microsoft.Maps.LabelOverlay.hidden;
				break;
			case mxn.Mapstraction.HYBRID:
				options.mapTypeId = Microsoft.Maps.MapTypeId.birdseye;
				break;
			default:
				options.mapTypeId = Microsoft.Maps.MapTypeId.road;
		}

		map.setMapType(options.mapTypeId);
	},

	getMapType: function() {
		var map = this.maps[this.api];
		var mapType = map.getMapTypeId();
		switch (mapType) {
			case Microsoft.Maps.MapTypeId.road:
				return mxn.Mapstraction.ROAD;
			case Microsoft.Maps.MapTypeId.aerial:
				return mxn.Mapstraction.SATELLITE;
			case Microsoft.Maps.MapTypeId.birdseye:
				return mxn.Mapstraction.HYBRID;
			default:
				return mxn.Mapstraction.ROAD;
		}

	},

	getBounds: function () {
		var map = this.maps[this.api];
		var bounds = map.getBounds();
		var nw = bounds.getNorthwest();
		var se = bounds.getSoutheast();
		return new mxn.BoundingBox(se.latitude,nw.longitude	,nw.latitude, se.longitude );
	},

	setBounds: function(bounds){
		var map = this.maps[this.api];
		var nw = bounds.getNorthWest();
		var se = bounds.getSouthEast();
		var viewRect = Microsoft.Maps.LocationRect.fromCorners(new Microsoft.Maps.Location(nw.lat, nw.lon), new Microsoft.Maps.Location(se.lat, se.lon));
		var options = map.getOptions();
		options.bounds = viewRect;
		options.center = null;
		map.setView(options);
	},

	addImageOverlay: function(id, src, opacity, west, south, east, north, oContext) {
		var map = this.maps[this.api];
		
		throw new Error('Mapstraction.addImageOverlay is not currently supported by provider ' + this.api);
	},

	setImagePosition: function(id, oContext) {
		throw new Error('Mapstraction.setImagePosition is not currently supported by provider ' + this.api);
	},
	
	addOverlay: function(url, autoCenterAndZoom) {
		var map = this.maps[this.api];
		
		throw new Error('Mapstraction.addOverlay is not currently supported by provider ' + this.api);
	},

	addTileLayer: function(tile_url, opacity, label, attribution, min_zoom, max_zoom, map_type, subdomains) {
		var map = this.maps[this.api];
		var z_index = this.tileLayers.length || 0;
		
		var newtileobj = {
			getTileUrl: function(tile){
				if (typeof subdomains !== 'undefined') {
					tile_url = mxn.util.getSubdomainTileURL(tile_url, subdomains);
				}
				return tile_url.replace(/\{Z\}/gi, tile.levelOfDetail).replace(/\{X\}/gi, tile.x).replace(/\{Y\}/gi, tile.y);
			}
		};
		var tileSource = new Microsoft.Maps.TileSource({ uriConstructor: newtileobj.getTileUrl});
		var tileLayerOptions = {};
		tileLayerOptions.mercator = tileSource;
		tileLayerOptions.opacity = opacity;
		// Construct the layer using the tile source
		var tilelayer = new Microsoft.Maps.TileLayer(tileLayerOptions);
		// Push the tile layer to the map
		map.entities.push(tilelayer);
		this.tileLayers.push( [tile_url, tilelayer, true, z_index] );
		
		return tilelayer;
	},

	toggleTileLayer: function(tile_url) {
		var map = this.maps[this.api];
		
		for (var f = 0; f < this.tileLayers.length; f++) {
			var tileLayer = this.tileLayers[f];
			if (tileLayer[0] == tile_url) {
				if (tileLayer[2]) {
					tileLayer[2] = false;
				}
				else {
					tileLayer[2] = true;
				}
				tileLayer[1].setOptions({ visible: tileLayer[2]});
			}
		}
	},

	getPixelRatio: function() {
		throw new Error('Mapstraction.getPixelRatio is not currently supported by provider ' + this.api);
	},
	
	mousePosition: function(element) {
		var map = this.maps[this.api];
		var locDisp = document.getElementById(element);
		if (locDisp !== null) {
			Microsoft.Maps.Events.addHandler(map, 'mousemove', function (e) {
				if (typeof (e.target.tryPixelToLocation) != 'undefined') { 
					var point = new Microsoft.Maps.Point(e.getX(), e.getY());
					var coords = e.target.tryPixelToLocation(point);
					var loc = coords.latitude.toFixed(4) + '/' + coords.longitude.toFixed(4);
					locDisp.innerHTML = loc;
				}
			});
			locDisp.innerHTML = '0.0000 / 0.0000';
		}
	},
	
	/**
	 * @author Kolor
	 */
	mouseBearing: function(element, centerPoint) {
		//var map = this.maps[this.api];
		
		// TODO
	}
	
},

LatLonPoint: {
	
	toProprietary: function() {
		return new Microsoft.Maps.Location(this.lat, this.lon);
	},

	fromProprietary: function(mPoint) {
		this.lat = mPoint.latitude;
		this.lon = mPoint.longitude;
		this.lng = mPoint.longitude;
	}
	
},

Marker: {
	
	toProprietary: function() {
		var options = {};
		if (this.draggable)
		{
			options.draggable = true;
		}
		var ax = 0;	// anchor x 
		var ay = 0;	// anchor y

		if (this.iconAnchor) {
			ax = this.iconAnchor[0];
			ay = this.iconAnchor[1];
		}
		
		var mAnchorPoint = new Microsoft.Maps.Point(ax,ay);
		if (this.iconUrl) {
			options.icon = this.iconUrl;
			if (this.iconSize) {
				options.height = this.iconSize[1];
				options.width = this.iconSize[0];
			}
			options.anchor = mAnchorPoint;
		}
		
		if (this.getAttribute('id')) {
			options.typeName = this.getAttribute('id')+'spotformicrosoft7';
		} else {
			options.typeName = 'spotformicrosoft7';
		}
		
		if (this.labelText) {
			var alignToIconWidth = 0;
			var alignToIconHeight = 0;
			if(options.width){
				alignToIconWidth = parseInt(options.width / 2);
			}
			if(options.height){
				alignToIconHeight = options.height;
			}
			
			options.text = this.labelText;
			options.width = 200;
			options.textOffset = new Microsoft.Maps.Point(-100+alignToIconWidth,alignToIconHeight);
		
			//generate CSS for label (allow div of pushpin to display overflowing content and add style for the text)
			var labelStyle1 = "."+options.typeName+" { overflow:visible !important; }";
			var labelStyle2 = "."+options.typeName+" div { white-space:nowrap; color:black !important; }";
			jQuery("<style type='text/css'>" +
					labelStyle1 + 
					labelStyle2 + 
					"</style>").appendTo("head");
		}
		
		var mmarker = new Microsoft.Maps.Pushpin(this.location.toProprietary('microsoft7'), options);
		//add marker on entites list
		this.map.entities.push(mmarker);
		
		if (this.infoBubble){
			var event_action = "click";
			if (this.hover) {
				event_action = "mouseover";
			}
			var that = this;
			Microsoft.Maps.Events.addHandler(mmarker, event_action, function() {
				that.openBubble();
				
				if (that.hover) {
					if (!that.infowindow_mouseleave){
						that.infowindow_mouseleave = Microsoft.Maps.Events.addHandler(that.proprietary_infowindow, 'mouseleave', function() {
							if (that.infoBubble && that.proprietary_infowindow) {
								that.closeBubble();
								if (that.infowindow_mouseleave) {
									Microsoft.Maps.Events.removeHandler(that.infowindow_mouseleave);
									that.infowindow_mouseleave = null;
								}
							}
						});
					}
				}
			});
			
			if (that.hover) {
				Microsoft.Maps.Events.addHandler(mmarker, 'mouseout', function() {
					if (that.infoBubble && that.proprietary_infowindow) {
						that.closeBubble();
						if (that.infowindow_mouseleave) {
							Microsoft.Maps.Events.removeHandler(that.infowindow_mouseleave);
							that.infowindow_mouseleave = null;
						}
					}
				});
			}
			
			/*
			// Deactivate the 'viewchange' event due to map swap
			Microsoft.Maps.Events.addHandler(this.map, 'viewchange', function (e) {
				//e.target.api == 'microsoft7'
				mmarker.mapstraction_marker.closeBubble();
			});
			*/
		}
		
		if (this.draggable) {
			
			Microsoft.Maps.Events.addHandler(mmarker, 'drag', function(e){
				
				var dragLoc = e.entity.getLocation();
				
				mmarker.mapstraction_marker.closeBubble();
				
				//get the radar linked to marker
				var currentMarkerId = mmarker.mapstraction_marker.getAttribute('id');
				var markerRadar = null;
				var radarsLength = mmarker.mapstraction_marker.mapstraction.radars.length;
				for(var i = 0; i < radarsLength; i++){
					if(mmarker.mapstraction_marker.mapstraction.radars[i].getAttribute('id') == currentMarkerId){
						markerRadar = mmarker.mapstraction_marker.mapstraction.radars[i];
						break;
					}
				}
				
				if (markerRadar != null) {
					var array = markerRadar.proprietary_radar.getLocations();
					
					var tempPathArray = [];
					
					var lat = dragLoc.latitude;
					var lng = dragLoc.longitude;
					
					var radarPivotPt = array[0];
					var latDiff = radarPivotPt.latitude-lat;
					var lngDiff = radarPivotPt.longitude-lng;
					
					for(i = 0; i < array.length; i++){
						pLat = array[i].latitude;
						pLng = array[i].longitude;
						tempPathArray.push(new Microsoft.Maps.Location(pLat-latDiff,pLng-lngDiff));
					}
					
					//update radar
					markerRadar.proprietary_radar.setLocations(tempPathArray);
					
					//update pivot point
					markerRadar.center = new mxn.LatLonPoint(dragLoc.latitude, dragLoc.longitude);
				}
			});
			
			Microsoft.Maps.Events.addHandler(mmarker, 'dragend', function(e){
				var dragLoc = e.entity.getLocation();
				
				mmarker.setLocation(dragLoc);
				
				mmarker.mapstraction_marker.update();
				
				var dragEndPos = new mxn.LatLonPoint();
				dragEndPos.fromProprietary('microsoft7', dragLoc);
				mmarker.mapstraction_marker.dragend.fire({'location': dragEndPos });
			});
		}
		
		//rightclick event
		Microsoft.Maps.Events.addHandler(mmarker, 'rightclick', function(e){
			if(e.targetType === "pushpin" && e.isSecondary === true){
				var rightClickLocProp = e.target.getLocation();
				var rightClickLoc = new mxn.LatLonPoint();
				rightClickLoc.fromProprietary('microsoft7', rightClickLocProp);
				
				mmarker.mapstraction_marker.rightclick.fire({'location': rightClickLoc });
			}
		});
		
		/**
		 * FIXME : sometimes DOM object are not completly loaded before this script.
		 */
		// jQuery on Pushpin objects
		jQuery('.MicrosoftMap .'+options.typeName).addClass('microsoft7SpotPointer');
		if (this.iconUrl && this.iconSize) {
			jQuery('.MicrosoftMap .'+options.typeName+' img').attr('style', 'width: '+this.iconSize[0]+'px; height: '+this.iconSize[1]+'px;');
		}
		if(this.tooltipText){
			//Get the pushpin DOM object by class name and set the title attribute.
			jQuery('.MicrosoftMap .'+options.typeName).children().attr('title', this.tooltipText);
		}
		
		return mmarker;
	},

	openBubble: function() {
		var infowindow;
		if (!this.hasOwnProperty('proprietary_infowindow') || this.proprietary_infowindow === null) {
			infowindow = new Microsoft.Maps.Infobox( this.location.toProprietary('microsoft7') , {
				description: this.infoBubble
			});
			this.map.entities.push(infowindow);
		} else {
			infowindow = this.proprietary_infowindow;
			//force position update on existing infoBox
			infowindow.setLocation(this.proprietary_marker.getLocation());
		}
		
		this.openInfoBubble.fire({'marker': this});
		//add anchor value
		if(this.iconAnchor){
			infowindow.setOptions({offset: new Microsoft.Maps.Point(0, (this.iconAnchor[1]+2))});
		}
		infowindow.setOptions({visible: true});
		this.proprietary_infowindow = infowindow; // Save so we can close it later
	},
	
	closeBubble: function() {
		if (!this.map) {
			throw new Error('Marker.closeBubble; marker must be added to map in order to display infobox');
		}
		if (!this.proprietary_infowindow) {
			return;
		}
		this.proprietary_infowindow.setOptions({visible:false});
		this.map.entities.remove(this.proprietary_infowindow);
		this.proprietary_infowindow = null;
		this.closeInfoBubble.fire( { 'marker': this } );
	},
	
	hide: function() {
		this.proprietary_marker.setOptions({visible: false});
	},

	show: function() {
		this.proprietary_marker.setOptions({visible: true});
	},

	update: function() {
		var loc = this.proprietary_marker.getLocation();
		
		this.location = new mxn.LatLonPoint(loc.latitude, loc.longitude);
	}
	
},

Polyline: {

	toProprietary: function() {
		var coords = [];
		
		for (var i = 0, length = this.points.length; i < length; i++) {
			coords.push(this.points[i].toProprietary(this.api));
		}
		
		if (this.closed) {
			if (!(this.points[0].equals(this.points[this.points.length - 1]))) {
				coords.push(coords[0]);
			}
		}
		else if (this.points[0].equals(this.points[this.points.length - 1])) {
			this.closed = true;
		}

		var strokeColor = Microsoft.Maps.Color.fromHex(this.color);
		if (this.opacity) {
			strokeColor.a = this.opacity * 255;
		}
		var fillColor = Microsoft.Maps.Color.fromHex(this.fillColor);
		if (this.opacity) {
			fillColor.a = this.opacity * 255;
		}
		
		var polyOptions = {
			strokeColor: strokeColor,
			strokeThickness: this.width || 3
		};

		if (this.closed) {
			polyOptions.fillColor = fillColor;
			this.proprietary_polyline = new Microsoft.Maps.Polygon(coords, polyOptions);
		}
		else {
			this.proprietary_polyline = new Microsoft.Maps.Polyline(coords, polyOptions);
		}
		return this.proprietary_polyline;
	},
	
	show: function() {
		this.proprietary_polyline.setOptions({visible:true});
	},

	hide: function() {
		this.proprietary_polyline.setOptions({visible:false});
	}	
},

/**
 * @author Kolor
 */
Radar: {
	
	mouseMove: function() {
		
		var map = this.map;
		var centerPoint = this.center;
		var selfRadar = this;
		
		Microsoft.Maps.Events.addHandler(map, 'mousemove', function(event) {
			
			var pt_x = event.getX();
			var pt_y = event.getY();
			var pixel = new Microsoft.Maps.Point(pt_x, pt_y);
			var ll = map.tryPixelToLocation(pixel);
			var mousePoint = new mxn.LatLonPoint(ll.latitude, ll.longitude);
			
			var bearingOrientation = KolorMap.util.bearing(centerPoint, mousePoint);
			
			//add start heading and fov incidence
			bearingOrientation = bearingOrientation + selfRadar.heading - ((90/180) * (180-selfRadar.fov));
			
			//rotate the current radar polygon and update radar object
			selfRadar =	KolorMap.util.rotation(selfRadar, centerPoint, bearingOrientation, selfRadar.mapstraction);
			
		});
		
		this.mouseMoveRadar.fire( { 'radar': this } );
	},
	
	activateClick: function(){
		var selfRadar = this;
		this.clickable = true;
		Microsoft.Maps.Events.addHandler(selfRadar.proprietary_radar, 'click', function() {
			selfRadar.click.fire();
		});
	},
	
	toProprietary: function() {
		
		// toProprietary render only the modified polyline part of the radar (Radar.polyline property)
		var points = [];
		for (var i = 0, length = this.polyline.points.length; i < length; i++) {
			points.push(this.polyline.points[i].toProprietary(this.api));
		}
		
		var strokeColor = Microsoft.Maps.Color.fromHex(this.polyline.color || '#000000');
		strokeColor.a = (this.polyline.opacity || 1.0) * 255;
		var fillColor = Microsoft.Maps.Color.fromHex(this.polyline.fillColor || '#000000');
		fillColor.a = (this.polyline.fillOpacity || 1.0) * 255;
		
		var polyOptions = {
			strokeColor: strokeColor,
			strokeThickness: this.polyline.width || 3
		};

		if (this.polyline.closed) {
			polyOptions.fillColor = fillColor;
			points.push(this.polyline.points[0].toProprietary(this.api));
			return new Microsoft.Maps.Polygon(points, polyOptions);
		}
		else {
			return new Microsoft.Maps.Polyline(points, polyOptions);
		}
	},
	
	show: function() {
		this.proprietary_radar.setOptions({visible:true});
	},

	hide: function() {
		this.proprietary_radar.setOptions({visible:false});
	}
	
}

});