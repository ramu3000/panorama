mxn.register('googlev3', {

Mapstraction: {
	
	init: function(element, api){
		var me = this;
		
		if (typeof google.maps.Map === 'undefined') {
			throw new Error(api + ' map script not imported');
		}
		
		// by default add road map and no controls
		var myOptions = {
			disableDefaultUI: true,
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			mapTypeControl: false,
			mapTypeControlOptions: null,
			zoomControl: false,
			zoomControlOptions: null,
			panControl: false,
			panControlOptions: null,
			scaleControl: false,
			scaleControlOptions: null,
			scrollwheel: true,
			draggable: false,
			disableDoubleClickZoom: true
		};
		
		// Background color can only be set at construction
		// To provide some control, adopt any explicit element style
		var backgroundColor = null;
		if ( element.currentStyle ) {
			backgroundColor = element.currentStyle['background-color'];
		}
		else if ( window.getComputedStyle ) {
			backgroundColor = document.defaultView.getComputedStyle(element, null).getPropertyValue('background-color');
		}
		// Only set the background if a style has been explicitly set, ruling out the "transparent" default
		if ( backgroundColor && 'transparent' !== backgroundColor ) {
			myOptions.backgroundColor = backgroundColor;
		}
		
		// find controls
		if (!this.addControlsArgs && loadoptions.addControlsArgs) {
			this.addControlsArgs = loadoptions.addControlsArgs;
		}
		if (this.addControlsArgs) {
			if (this.addControlsArgs.zoom) {
				myOptions.zoomControl = true;
				if (this.addControlsArgs.zoom == 'small') {
					myOptions.zoomControlOptions = {style: google.maps.ZoomControlStyle.SMALL,position: google.maps.ControlPosition.TOP_LEFT};
				}
				if (this.addControlsArgs.zoom == 'large') {
					myOptions.zoomControlOptions = {style: google.maps.ZoomControlStyle.LARGE,position: google.maps.ControlPosition.TOP_LEFT};
				}
			}
			if (this.addControlsArgs.scale) {
				myOptions.scaleControl = true;
				myOptions.scaleControlOptions = {style:google.maps.ScaleControlStyle.DEFAULT,position: google.maps.ControlPosition.BOTTOM_LEFT};
			}
			if (this.addControlsArgs.pan) {
				myOptions.panControl = true;
				myOptions.panControlOptions = {position: google.maps.ControlPosition.TOP_LEFT};
			}
			if (this.addControlsArgs.map_type) {
				myOptions.mapTypeControl = true;
				myOptions.mapTypeControlOptions = {style: google.maps.MapTypeControlStyle.DEFAULT,position: google.maps.ControlPosition.TOP_RIGHT};
			}
			if (this.addControlsArgs.overview) {
				myOptions.overviewMapControl = true;
				myOptions.overviewMapControlOptions = {opened: true};
			}
		}
		
		// Enable the visual refresh
		google.maps.visualRefresh = true;
		
		var map = new google.maps.Map(element, myOptions);
		
		var fireOnNextIdle = [];
		
		google.maps.event.addListener(map, 'idle', function() {
			var fireListCount = fireOnNextIdle.length;
			if (fireListCount > 0) {
				var fireList = fireOnNextIdle.splice(0, fireListCount);
				var handler;
				while((handler = fireList.shift())){
					handler();
				}
			}
		});
		
		// deal with click
		google.maps.event.addListener(map, 'click', function(location){
			me.click.fire({'location': 
				new mxn.LatLonPoint(location.latLng.lat(),location.latLng.lng())
			});
		});
		
		// deal with zoom change
		google.maps.event.addListener(map, 'zoom_changed', function(){
			// zoom_changed fires before the zooming has finished so we 
			// wait for the next idle event before firing our changezoom
			// so that method calls report the correct values
			fireOnNextIdle.push(function() {
				me.changeZoom.fire();
			});
		});
		
		// deal with map movement
		var is_dragging = false;
		google.maps.event.addListener(map, 'dragstart', function() {
			is_dragging = true;
		});
		google.maps.event.addListener(map, 'dragend', function(){
			me.moveendHandler(me);
			me.endPan.fire();
			is_dragging = false; 
		});
		
		google.maps.event.addListener(map, 'center_changed', function() {
			me.endPan.fire();
		});
		
		// deal with initial tile loading
		var loadListener = google.maps.event.addListener(map, 'tilesloaded', function(){
			me.load.fire();
			google.maps.event.removeListener( loadListener );
			if (!is_dragging) {
				fireOnNextIdle.push(function() {
					me.endPan.fire();
				});
			}
		});
		
		this.maps[api] = map;
		this.loaded[api] = true;
	},
	
	applyOptions: function(){
		var map = this.maps[this.api];
		var myOptions = [];
		if (this.options.enableDragging) {
			myOptions.draggable = true;
		} else {
			myOptions.draggable = false;
		}
		if (this.options.enableScrollWheelZoom) {
			myOptions.scrollwheel = true;
		} else {
			myOptions.scrollwheel = false;
		}
		if (this.options.disableDoubleClickZoom) {
			myOptions.disableDoubleClickZoom = true;
		} else {
			myOptions.disableDoubleClickZoom = false;
		}
		map.setOptions(myOptions);
	},

	resizeTo: function(width, height){
		this.currentElement.style.width = width;
		this.currentElement.style.height = height;
		var map = this.maps[this.api];
		google.maps.event.trigger(map,'resize');
  	},

	addControls: function( args ) {
		/* args = { 
		 * pan:      true,
		 * zoom:     'large' || 'small',
		 * overview: true,
		 * scale:    true,
		 * map_type: true,
		 * streetview: true
		 * }
		 */
		var map = this.maps[this.api];
		var myOptions;
		
		if ('pan' in args && args.pan) {
			myOptions = { panControl: true, panControlOptions: {
				position: google.maps.ControlPosition.TOP_LEFT
			}};
			map.setOptions(myOptions);
			this.addControlsArgs.pan = true;
		}
		else if (!('pan' in args) || ('pan' in args && !args.pan)) {
			myOptions = { panControl: false };
			map.setOptions(myOptions);
			this.addControlsArgs.pan = false;
		}
		
		if ('zoom' in args) {
			if (args.zoom == 'small') {
				this.addSmallControls();
			}
			else if (args.zoom == 'large') {
				this.addLargeControls();
			}
		}
		else {
			myOptions = { zoomControl: false };
			map.setOptions(myOptions);
			this.addControlsArgs.zoom = false;
		}
		/*
		// update controls
		if (args.zoom ) {
			if (args.zoom == 'large'){ 
				myOptions = {
					zoomControl: true,
					zoomControlOptions: {
						style: google.maps.ZoomControlStyle.LARGE, // DEFAULT, SMALL, LARGE
						position: google.maps.ControlPosition.TOP_LEFT
					}
				};
			} else { 
				myOptions = {
					zoomControl: true,
					zoomControlOptions: {
						style: google.maps.ZoomControlStyle.SMALL, // DEFAULT, SMALL, LARGE
						position: google.maps.ControlPosition.TOP_LEFT
					}
				};
			}
			map.setOptions(myOptions);
			this.addControlsArgs.zoom = args.zoom;
		}
		if (args.pan) {
			myOptions = {
				panControl: true,
				panControlOptions: {
					position: google.maps.ControlPosition.TOP_LEFT
				}
			};
			map.setOptions(myOptions);
			this.addControlsArgs.pan = true;
		}
		*/
		
		if ('scale' in args && args.scale){
			myOptions = {
				scaleControl:true,
				scaleControlOptions: {
					style:google.maps.ScaleControlStyle.DEFAULT,
					position: google.maps.ControlPosition.BOTTOM_LEFT
				}				
			};
			map.setOptions(myOptions);
			this.addControlsArgs.scale = true;
		}
		else {
			myOptions = { scaleControl: false };
			map.setOptions(myOptions);
			this.addControlsArgs.scale = false;
		}
		
		if ('map_type' in args && args.map_type){
			this.addMapTypeControls();
		}else {
			myOptions = { mapTypeControl : false };
			map.setOptions(myOptions);
			this.addControlsArgs.map_type = false;
		}
		
		if ('overview' in args && args.overview){
			myOptions = {
				overviewMapControl: true,
				overviewMapControlOptions: {
					opened: true
				}
			};
			map.setOptions(myOptions);
			this.addControlsArgs.overview = true;
		}else {
			myOptions = { overviewMapControl: false };
			map.setOptions(myOptions);
			this.addControlsArgs.overview = false;
		}
		
		if ('streetview' in args && args.streetview){
			myOptions = {
				streetViewControl: true,
				streetViewControlOptions: {
					position: google.maps.ControlPosition.TOP_LEFT
				}
			};
			map.setOptions(myOptions);
			this.addControlsArgs.streetview = true;
		}
		else {
			myOptions = { streetViewControl: false };
			map.setOptions(myOptions);
			this.addControlsArgs.streetview = false;
		}
		
	},

	addSmallControls: function() {
		var map = this.maps[this.api];
		var myOptions = {
			zoomControl: true,
			zoomControlOptions: {
				style: google.maps.ZoomControlStyle.SMALL, // DEFAULT, SMALL, LARGE
				position: google.maps.ControlPosition.TOP_LEFT
			}
			//,
			//scaleControl: false,
			//scaleControlOptions: null,
			//panControl: false,
			//panControlOptions: null
		};
		map.setOptions(myOptions);
		
		//this.addControlsArgs.pan = false;
		//this.addControlsArgs.scale = false;
		this.addControlsArgs.zoom = 'small';
	},

	addLargeControls: function() {
		var map = this.maps[this.api];
		var myOptions = {
			zoomControl: true,
			zoomControlOptions: {
				style: google.maps.ZoomControlStyle.LARGE, // DEFAULT, SMALL, LARGE
				position: google.maps.ControlPosition.TOP_LEFT
			},
			panControl: true,
			panControlOptions: {
				position: google.maps.ControlPosition.TOP_LEFT
			}
		};
		map.setOptions(myOptions);
		this.addControlsArgs.pan = true;
		this.addControlsArgs.zoom = 'large';
	},

	addMapTypeControls: function() {
		var map = this.maps[this.api];
		var myOptions = {
			mapTypeControl: true,
			mapTypeControlOptions: {
				style: google.maps.MapTypeControlStyle.DEFAULT, // DEFAULT, DROPDOWN_MENU, HORIZONTAL_BAR
				mapTypeIds: [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.SATELLITE, google.maps.MapTypeId.HYBRID, google.maps.MapTypeId.TERRAIN],
				position: google.maps.ControlPosition.TOP_RIGHT
			}
		};
		map.setOptions(myOptions);
		this.addControlsArgs.map_type = true;
	},

	setCenterAndZoom: function(point, zoom) { 
		var map = this.maps[this.api];
		var pt = point.toProprietary(this.api);
		map.setCenter(pt);
		map.setZoom(zoom);
	},
	
	addMarker: function(marker, old) {
		//toProprietary add marker to the map directly
		return marker.toProprietary(this.api);
	},
	
	removeMarker: function(marker) {
		if (marker.proprietary_marker != null) {
			marker.proprietary_marker.setMap(null);
			marker.proprietary_marker = null;
		}
	},
	
	declutterMarkers: function(opts) {
		throw new Error('Mapstraction.declutterMarkers is not currently supported by provider ' + this.api);
	},
	
	changeMapStyle: function(styleArray) {
		var map = this.maps[this.api];
		map.setOptions({styles: styleArray});
	},
	
	addPolyline: function(polyline, old) {
		var map = this.maps[this.api];
		var propPolyline = polyline.toProprietary(this.api);
		propPolyline.setMap(map);
		return propPolyline;
	},

	removePolyline: function(polyline) {
		polyline.proprietary_polyline.setMap(null);
	},
	
	/**
	 * @author Kolor
	 */
	addRadar: function(radar, old) {
		var map = this.maps[this.api];
		var propRadar = radar.toProprietary(this.api);
		propRadar.setMap(map);
		return propRadar;
	},
	
	removeRadar: function(radar) {
		radar.proprietary_radar.setMap(null);
	},
	
	getCenter: function() {
		var map = this.maps[this.api];
		var pt = map.getCenter();
		return new mxn.LatLonPoint(pt.lat(),pt.lng());
	},

	setCenter: function(point, options) {
		var map = this.maps[this.api];
		var pt = point.toProprietary(this.api);
		if (options && options.pan) { 
			map.panTo(pt);
		}
		else { 
			map.setCenter(pt);
		}
	},

	setZoom: function(zoom) {
		var map = this.maps[this.api];
		map.setZoom(zoom);
	},
	
	getZoom: function() {
		var map = this.maps[this.api];
		return map.getZoom();
	},

	getZoomLevelForBoundingBox: function( bbox ) {
		var map = this.maps[this.api];
		var sw = bbox.getSouthWest().toProprietary(this.api);
		var ne = bbox.getNorthEast().toProprietary(this.api);
		var gLatLngBounds = new google.maps.LatLngBounds(sw, ne);
		map.fitBounds(gLatLngBounds);
		return map.getZoom();
	},

	setMapType: function(type) {
		var map = this.maps[this.api];
		switch(type) {
			case mxn.Mapstraction.ROAD:
				map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
				break;
			case mxn.Mapstraction.SATELLITE:
				map.setMapTypeId(google.maps.MapTypeId.SATELLITE);
				break;
			case mxn.Mapstraction.HYBRID:
				map.setMapTypeId(google.maps.MapTypeId.HYBRID);
				break;
			case mxn.Mapstraction.PHYSICAL:
				map.setMapTypeId(google.maps.MapTypeId.TERRAIN);
				break;
			default:
				map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
		}	 
	},

	getMapType: function() {
		var map = this.maps[this.api];
		var type = map.getMapTypeId();
		switch(type) {
			case google.maps.MapTypeId.ROADMAP:
				return mxn.Mapstraction.ROAD;
			case google.maps.MapTypeId.SATELLITE:
				return mxn.Mapstraction.SATELLITE;
			case google.maps.MapTypeId.HYBRID:
				return mxn.Mapstraction.HYBRID;
			case google.maps.MapTypeId.TERRAIN:
				return mxn.Mapstraction.PHYSICAL;
			default:
				return null;
		}
	},

	getBounds: function () {
		var map = this.maps[this.api];
		var gLatLngBounds = map.getBounds();
		if (!gLatLngBounds) {
			throw 'Mapstraction.getBounds; bounds not available, map must be initialized';
		}
		var sw = gLatLngBounds.getSouthWest();
		var ne = gLatLngBounds.getNorthEast();
		return new mxn.BoundingBox(sw.lat(), sw.lng(), ne.lat(), ne.lng());
	},

	setBounds: function(bounds){
		var map = this.maps[this.api];
		var sw = bounds.getSouthWest().toProprietary(this.api);
		var ne = bounds.getNorthEast().toProprietary(this.api);
		var gLatLngBounds = new google.maps.LatLngBounds(sw, ne);
		map.fitBounds(gLatLngBounds);
	},

	addImageOverlay: function(id, src, opacity, west, south, east, north, oContext) {
		var map = this.maps[this.api];
		
		var imageBounds = new google.maps.LatLngBounds(
			new google.maps.LatLng(south,west),
			new google.maps.LatLng(north,east));
		
		var groundOverlay = new google.maps.GroundOverlay(src, imageBounds);
		groundOverlay.setMap(map);
	},

	setImagePosition: function(id, oContext) {
		throw new Error('Mapstraction.setImagePosition is not currently supported by provider ' + this.api);
	},
	
	addOverlay: function(url, autoCenterAndZoom) {
		var map = this.maps[this.api];

		var opt = {preserveViewport: (!autoCenterAndZoom)};
		var layer = new google.maps.KmlLayer(url, opt);
		layer.setMap(map);
	},

	addTileLayer: function(tile_url, opacity, label, attribution, min_zoom, max_zoom, map_type, subdomains) {
		var map = this.maps[this.api];
		var z_index = this.tileLayers.length || 0;
		var tilelayer = {
			getTileUrl: function (coord, zoom) {
				var url = mxn.util.sanitizeTileURL(tile_url);
				if (typeof subdomains !== 'undefined') {
					url = mxn.util.getSubdomainTileURL(url, subdomains);
				}
				var x = coord.x;
				var maxX = Math.pow(2, zoom);
				while (x < 0) {
					x += maxX;
				}
				while (x >= maxX) {
					x -= maxX;
				}
				url = url.replace(/\{Z\}/gi, zoom);
				url = url.replace(/\{X\}/gi, x);
				url = url.replace(/\{Y\}/gi, coord.y);
				return url;
			},
			tileSize: new google.maps.Size(256, 256),
			isPng: true,
			minZoom: min_zoom,
			maxZoom: max_zoom,
			opacity: opacity,
			name: label
		};
		var tileLayerOverlay = new google.maps.ImageMapType(tilelayer);
		this.tileLayers.push( [tile_url, tileLayerOverlay, true, z_index] );
		
		if (map_type) {
			map.mapTypes.set('tile' + z_index, tileLayerOverlay);
			var mapTypeIds = [
				google.maps.MapTypeId.ROADMAP,
				google.maps.MapTypeId.HYBRID,
				google.maps.MapTypeId.SATELLITE,
				google.maps.MapTypeId.TERRAIN
			];
			for (var f = 0; f < this.tileLayers.length; f++) {
				mapTypeIds.push('tile' + f);
			}
			var optionsUpdate = {mapTypeControlOptions: {mapTypeIds: mapTypeIds}};
			map.setOptions(optionsUpdate);
		} 
		else {
			map.overlayMapTypes.insertAt(z_index, tileLayerOverlay);
		}
		
		return tileLayerOverlay;
	},

	toggleTileLayer: function(tile_url) {
		var map = this.maps[this.api];
		for (var f = 0; f < this.tileLayers.length; f++) {
			var tileLayer = this.tileLayers[f];
			if (tileLayer[0] == tile_url) {
				if (tileLayer[2]) {
					map.overlayMapTypes.removeAt(tileLayer[3]);
					tileLayer[2] = false;
				}
				else {
					map.overlayMapTypes.insertAt(tileLayer[3], tileLayer[1]);
					tileLayer[2] = true;
				}
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
			google.maps.event.addListener(map, 'mousemove', function (point) {
				var loc = point.latLng.lat().toFixed(4) + ' / ' + point.latLng.lng().toFixed(4);
				locDisp.innerHTML = loc;
			});
			locDisp.innerHTML = '0.0000 / 0.0000';
		}
	},
	
	/**
	 * @author Kolor
	 */
	mouseBearing: function(element, centerPoint) {
		var map = this.maps[this.api];
		var locDisp = document.getElementById(element);
		if (locDisp !== null) {
			google.maps.event.addListener(map, 'mousemove', function (point) {
				var mousePoint = new mxn.LatLonPoint(point.latLng.lat(), point.latLng.lng());
				var bearingOrientation = KolorMap.util.bearing(centerPoint, mousePoint).toFixed(4);
				locDisp.innerHTML = bearingOrientation;
			});
			locDisp.innerHTML = '0.0000';
		}
	}
	
	
},

LatLonPoint: {
	
	toProprietary: function() {
		return new google.maps.LatLng(this.lat, this.lon);
	},

	fromProprietary: function(googlePoint) {
		this.lat = googlePoint.lat();
		this.lon = googlePoint.lng();
		this.lng = googlePoint.lng();
	}
	
},

Marker: {
	
	toProprietary: function() {
		var options = {};
		
		var ax = 0;  // anchor x 
		var ay = 0;  // anchor y

		if (this.iconAnchor) {
			ax = this.iconAnchor[0];
			ay = this.iconAnchor[1];
		}
		var gAnchorPoint = new google.maps.Point(ax,ay);
		
		if (this.iconUrl) {
			if (this.iconSize) {
				options.icon = {
					url: this.iconUrl,
					size: new google.maps.Size(this.iconSize[0], this.iconSize[1]),
					scaledSize: new google.maps.Size(this.iconSize[0], this.iconSize[1]),
					origin: new google.maps.Point(0, 0),
					anchor: gAnchorPoint
				};
			}else{
				options.icon = {
					url: this.iconUrl,
					//size: new google.maps.Size(this.iconSize[0], this.iconSize[1]),
					origin: new google.maps.Point(0, 0),
					anchor: gAnchorPoint
				};
			}

			// do we have a Shadow icon
			if (this.iconShadowUrl) {
				if (this.iconShadowSize) {
					var x = this.iconShadowSize[0];
					var y = this.iconShadowSize[1];
					options.shadow = new google.maps.MarkerImage(
						this.iconShadowUrl,
						new google.maps.Size(x,y),
						new google.maps.Point(0,0),
						gAnchorPoint 
					);
				}
				else {
					options.shadow = new google.maps.MarkerImage(this.iconShadowUrl);
				}
			}
		}
		if (this.draggable) {
			options.draggable = this.draggable;
		}
		if(this.tooltipText){
			options.title =  this.tooltipText;
		} else if (this.labelText) {
			options.title =  this.labelText;
		}
		
		if (this.imageMap) {
			options.shape = {
				coord: this.imageMap,
				type: 'poly'
			};
		}
		
		options.position = this.location.toProprietary(this.api);
		//add to map
		options.map = this.map;
		
		var marker = new google.maps.Marker(options);

		if (this.defaultHandler && this.infoBubble) {
			var event_action = "click";
			if (this.hover) {
				event_action = "mouseover";
				
				google.maps.event.addListener(marker, "mouseout", function() {
					marker.mapstraction_marker.closeBubble();
				});
			}
			google.maps.event.addListener(marker, event_action, function() {
				if(marker.mapstraction_marker.hasOwnProperty('proprietary_infowindow') && marker.mapstraction_marker.proprietary_infowindow != null){
					marker.mapstraction_marker.closeBubble();
				}else{
					marker.mapstraction_marker.openBubble();
				}
			});
		}

		if (this.hoverIconUrl) {
			var gSize = new google.maps.Size(this.iconSize[0], this.iconSize[1]);
			var zerozero = new google.maps.Point(0,0);
 			var hIcon = new google.maps.MarkerImage(
				this.hoverIconUrl,
				gSize,
				zerozero,
				gAnchorPoint
			);
 			var Icon = new google.maps.MarkerImage(
				this.iconUrl,
				gSize,
				zerozero,
				gAnchorPoint
			);
			google.maps.event.addListener(
				marker, 
				"mouseover", 
				function(){ 
					marker.setIcon(hIcon); 
				}
			);
			google.maps.event.addListener(
				marker, 
				"mouseout", 
				function(){ marker.setIcon(Icon); }
			);
		}

		google.maps.event.addListener(marker, 'click', function() {
			marker.mapstraction_marker.click.fire();
		});
		
		//draggable
		if(this.draggable){
			
			google.maps.event.addListener(marker, 'drag', function(event) {
				//closeBubble if open
				marker.mapstraction_marker.closeBubble();
				
				//get the radar linked to marker
				var currentMarkerId = marker.mapstraction_marker.getAttribute('id');
				var markerRadar = null;
				var radarsLength = marker.mapstraction_marker.mapstraction.radars.length;
				for(var i = 0; i < radarsLength; i++){
					if(marker.mapstraction_marker.mapstraction.radars[i].getAttribute('id') == currentMarkerId){
						markerRadar = marker.mapstraction_marker.mapstraction.radars[i];
						break;
					}
				}
				
				if (markerRadar != null) {
					var array = markerRadar.proprietary_radar.getPath();
					
					var tempPathArray = [];
					
					var lat = event.latLng.lat();
				    var lng = event.latLng.lng();
				    
				    var radarPivotPt = array.getAt(0);
				    
				    var latDiff = radarPivotPt.lat()-lat;
				    var lngDiff = radarPivotPt.lng()-lng;
					
					for(i = 0; i < array.length; i++){
						pLat = array.getAt(i).lat();
				        pLng = array.getAt(i).lng();
				        tempPathArray.push(new google.maps.LatLng(pLat-latDiff,pLng-lngDiff));
					}
					
					//move radar
					markerRadar.proprietary_radar.setPath(tempPathArray);
					//update pivot point
					markerRadar.center = new mxn.LatLonPoint(event.latLng.lat(), event.latLng.lng());
				}
			});
			
			google.maps.event.addListener(marker, 'dragend', function(event) {
				
				var dragLoc = new google.maps.LatLng(event.latLng.lat(), event.latLng.lng());
				marker.setPosition(dragLoc);
				
				marker.mapstraction_marker.update();
				
				var dragEndPos = new mxn.LatLonPoint();
				dragEndPos.fromProprietary('googlev3', dragLoc);
				marker.mapstraction_marker.dragend.fire({'location': dragEndPos });
			});
			
			//right-click events
			google.maps.event.addListener(marker, 'rightclick', function(event) {
				var rightClickLocProp = new google.maps.LatLng(event.latLng.lat(), event.latLng.lng());
				var rightClickLoc = new mxn.LatLonPoint();
				rightClickLoc.fromProprietary('googlev3', rightClickLocProp);
				
				marker.mapstraction_marker.rightclick.fire({'location': rightClickLoc });
			});
		}
		
		return marker;
	},

	openBubble: function() {
		var infowindow, marker = this;
		if (!this.hasOwnProperty('proprietary_infowindow') || this.proprietary_infowindow === null) {
			infowindow = new google.maps.InfoWindow({
				content: this.infoBubble,
				disableAutoPan: true
			});
			google.maps.event.addListener(infowindow, 'closeclick', function(closedWindow) {
				marker.closeBubble();
				marker.closeInfoBubble.fire( { 'marker': this } );
			});
		}
		else {
			infowindow = this.proprietary_infowindow;
			//force position update on existing infowindow
			infowindow.setPosition(this.proprietary_marker.location);
		}
		
		//update infowindow offset if not set
		if (!this.proprietary_marker.anchorPoint && this.iconAnchor) {
			var options = {};
			ax = 0;
			ay = -this.iconAnchor[1];
			options.pixelOffset = new google.maps.Size(ax,ay);
			infowindow.setOptions(options);
		}
		
		this.openInfoBubble.fire( { 'marker': this } );
		infowindow.open(this.map, this.proprietary_marker);
		this.proprietary_infowindow = infowindow; // Save so we can close it later
	},
	
	closeBubble: function() {
		if (this.hasOwnProperty('proprietary_infowindow') && this.proprietary_infowindow !== null) {
			this.proprietary_infowindow.close();
			this.proprietary_infowindow = null;
			this.closeInfoBubble.fire( { 'marker': this } );
		}
	},

	hide: function() {
		this.proprietary_marker.setOptions( { visible: false } );
	},

	show: function() {
		this.proprietary_marker.setOptions( { visible: true } );
	},

	update: function() {
		var point = new mxn.LatLonPoint();
		point.fromProprietary('googlev3', this.proprietary_marker.getPosition());
		this.location = point;
	}
},

Polyline: {

	toProprietary: function() {
		var coords = [];
		
		for (var i = 0, length = this.points.length; i < length; i++) {
			coords.push(this.points[i].toProprietary('googlev3'));
		}
		
		var polyOptions = {
			path: coords,
			strokeColor: this.color,
			strokeOpacity: this.opacity, 
			strokeWeight: this.width
		};
		
		if (this.closed) {
			if (!(this.points[0].equals(this.points[this.points.length - 1]))) {
				coords.push(coords[0]);
			}
		}
		else if (this.points[0].equals(this.points[this.points.length - 1])) {
			this.closed = true;
		}
		
		if (this.closed) {
			polyOptions.fillColor = this.fillColor;
			polyOptions.fillOpacity = polyOptions.strokeOpacity;
			
			this.proprietary_polyline = new google.maps.Polygon(polyOptions);
		}
		else {
			this.proprietary_polyline = new google.maps.Polyline(polyOptions);
		}
		
		return this.proprietary_polyline;
	},
	
	show: function() {
		this.proprietary_polyline.setVisible(true);
	},

	hide: function() {
		this.proprietary_polyline.setVisible(false);
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
		
		google.maps.event.addListener(map, 'mousemove', function (point) {
			
			var mousePoint = new mxn.LatLonPoint(point.latLng.lat(), point.latLng.lng());
			
			var bearingOrientation = KolorMap.util.bearing(centerPoint, mousePoint);
			
			//add start heading and fov incidence
			bearingOrientation = bearingOrientation + selfRadar.heading - ((90/180) * (180-selfRadar.fov));
			
			//rotate the current radar polygon and update radar object
			selfRadar =	KolorMap.util.rotation(selfRadar, centerPoint, bearingOrientation, selfRadar.mapstraction);
			
		});
		
		this.mouseMoveRadar.fire( { 'radar': this } );
	},
	
	activateClick: function(){
		//console.log(this);
		//console.log(this.proprietary_radar);
		
		var selfRadar = this;
		//this.clickable = true;
		this.radarSelected = false;
		google.maps.event.addListener(selfRadar.proprietary_radar, 'click', function() {
			//console.log('click on radar');
			//console.log(this);
			//TODO radarSelected = true;
			selfRadar.click.fire();
		});
	},
	
	toProprietary: function() {
		
		//toProprietary render only the modified polyline part of the radar (Radar.polyline property)
		var points = [];
		for (var i = 0, length = this.polyline.points.length; i < length; i++) {
			points.push(this.polyline.points[i].toProprietary('googlev3'));
		}
		
		var polyOptions = {
			path: points,
			strokeColor: this.polyline.color || '#000000',
			strokeOpacity: this.polyline.opacity || 1.0, 
			strokeWeight: this.polyline.width || 3
		};
		
		if (this.polyline.closed) {
			polyOptions.fillColor = this.polyline.fillColor || '#000000';
			polyOptions.fillOpacity =  this.polyline.fillOpacity || 1.0;
			
			return new google.maps.Polygon(polyOptions);
		}
		else {
			return new google.maps.Polyline(polyOptions);
		}
	},
	
	show: function() {
		this.proprietary_radar.setVisible(true);
	},

	hide: function() {
		this.proprietary_radar.setVisible(false);
	}
	
}

});
