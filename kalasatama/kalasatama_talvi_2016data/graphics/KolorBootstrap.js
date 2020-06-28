//krpano instance
var krpano = null;
//trace
var debug = false;
//is krpano loaded
var krpanoLoaded = false;
//is tour started
var isTourStarted = false;
//fullscreen object
var kolorFullscreen = null;
//browser detection
var kolorBrowserDetect = null;
//start z-index value
var kolorStartIndex = 4000;
//target url for cross domains application
var crossDomainTargetUrl = "";

if ( debug ) {
	if ( typeof(console) == 'undefined' ) {
		console = {log : function (text) {} };
	}
}

/* ======== FULLSCREEN STUFF ========================================== */

/**
 * @description Register Fullscreen on DOM ready.
 */
jQuery(document).ready(function() {
	//add browser detection
	kolorBrowserDetect = new ktools.BrowserDetect();
	kolorBrowserDetect.init();
	//kolorBrowserDetect.browser : Browser string
	//kolorBrowserDetect.version : Browser version
	//kolorBrowserDetect.OS : Platform OS
	
	//add fullscreen
	kolorFullscreen = new ktools.Fullscreen(document.getElementById("tourDIV"));
	kolorFullscreen.supportsFullscreen();
	//activate krpano fallback and update methods
	kolorFullscreen.setExternal({
		'enter': krPanoFullscreenEnter,
		'exit': krPanoFullscreenExit,
		'change': krpanoFullscreenChange,
		'resize': krPanoFullscreenResize
	});
});

/**
 * @function
 * @description Enter fullscreen fallback method for krpano.
 * @return {void}
 */
function krPanoFullscreenEnter() {
	getKrPanoInstance().call("enterFullScreenFallback");
}

/**
 * @function
 * @description Exit fullscreen fallback method for krpano.
 * @return {void}
 */
function krPanoFullscreenExit() {
	getKrPanoInstance().call("exitFullScreenFallback");
}

/**
 * @function
 * @description Launch method for krpano on fullscreen change event.
 * @param {Boolean} state If true enter fullscreen event, else exit fullscreen event.
 * @return {void}
 */
function krpanoFullscreenChange(state) {
	if(state){
		getKrPanoInstance().call("enterFullScreenChangeEvent");
	}else{
		getKrPanoInstance().call("exitFullScreenChangeEvent");
	}
}

/**
 * @function
 * @description Launch resize method for krpano correct resize.
 * @return {void}
 */
function krPanoFullscreenResize() {
	getKrPanoInstance().call("resizeFullScreenEvent");
}

/**
 * @function
 * @description Set fullscreen mode.
 * @param {String|Boolean} value The fullscreen status: 'true' for open or 'false' for close.
 * @return {void}
 */
function setFullscreen(value) {
	var state;
	if(typeof value == "string")
		state = (value.toLowerCase() == "true");
	else
		state = Boolean(value);

	if (kolorFullscreen) {
		if(state){
			kolorFullscreen.request();
		}else{
			kolorFullscreen.exit();
		}
	}
}

/* ========== DIALOG BETWEEN KRPANO/JS STUFF ================================= */

/**
 * @function
 * @description Get krpano instance.
 * @return {Object} krpano instance.
 */
function getKrPanoInstance() {
	if ( krpano == null ) {
		krpano = document.getElementById('krpanoSWFObject');
	}
	return krpano;
}

/**
 * @function
 * @description Call krpano function.
 * @param {String} fnName The krpano action name.
 * @param {*} Following parameters are passed to the krPano function
 * @return {void}
 */
function invokeKrFunction(fnName) {
	var args = [].slice.call(arguments, 1);
	var callString = fnName+'(';
	for(var i=0, ii=args.length; i<ii; i++)
	{
		callString += args[i];
		if(i != ii-1) { callString += ', '; }
	}
	callString += ');';
	getKrPanoInstance().call(callString);
}

/**
 * @function
 * @description Get krpano identifier value.
 * @param {String} identifier The qualifier.
 * @param {String} type The converting type. Can be: 'int', 'float', 'string', 'boolean', 'object'.
 * @return {Object}
 */
function getKrValue(identifier, type) {
	if ( typeof identifier == "undefined" ){
		return identifier;
	}
	
	if(getKrPanoInstance().get(identifier) == null) {
		return null;
	}

	switch ( type ) {
		case "int":
			return parseInt(getKrPanoInstance().get(identifier));
		case "float":
			return parseFloat(getKrPanoInstance().get(identifier));
		case "string":
			return String(getKrPanoInstance().get(identifier));
		case "bool":
			return Boolean(getKrPanoInstance().get(identifier) === 'true' || parseInt(getKrPanoInstance().get(identifier)) === 1 || getKrPanoInstance().get(identifier) === 'yes' || getKrPanoInstance().get(identifier) === 'on');
		default:
			return getKrPanoInstance().get(identifier);
	}
}

/**
 * @function
 * @description Invoke a function of a plugin engine.
 * @param {String} pluginName The name/id of the plugin.
 * @param {String} functionName The name of the function to invoke.
 * @param {Object[]} arguments Additional arguments will be passed to the invoked function as an array.
 * @return {Object}
 */
function invokePluginFunction(pluginName, functionName) {
	if ( debug ) {
		console.log("invokePluginFunction("+pluginName+", "+functionName+")");
	}
	
	var plugin = ktools.KolorPluginList.getInstance().getPlugin(pluginName);
	if (plugin == null) {
		if ( debug ) { console.log("invokePluginFunction: plugin instance doesn't exist"); }
		return false;
	}
	var engine = plugin.getRegistered();
	if (engine == null) {
		if ( debug ) { console.log("invokePluginFunction: plugin isn't registered"); }
		return false;
	}
	var restArgs = [].slice.call(arguments, 2);
	return engine[functionName](restArgs);
}

/**
 * @function
 * @description This function is called when krpano is ready.
 * The ready state of krpano is told by its event onready (in fact it's not fully ready, included XML are not necessarily loaded) 
 * @return {void}
 */
function eventKrpanoLoaded () {
	if ( debug ) {
		console.log('krpano is loaded');
	}
	
	if (krpanoLoaded) { return false; }
	
	ktools.I18N.getInstance().initLanguage('en', crossDomainTargetUrl+'kalasatama_talvi_2016data/kalasatama_talvi_2016_messages_en.xml');
	krpanoLoaded = true;
	
	
	

addKolorMap('panotourmaps', [['googlev3','']]);

}

/**
 * @function
 * @description This function is called when tour is started.
 * @return {void}
 */
function eventTourStarted () {
	if ( debug ) {
		console.log('tour is started');
	}
	
	isTourStarted = true;
}


/* ========= KOLOR PLUGINS SCRIPTS ============================== */





/** ---------------------- Start Plugin Map ----------------------- **/

//KolorMap api providers
var KolorMapApiProviders  = new Object();
KolorMapApiProviders.Type = { googlev3: "googlev3", openlayers: "openlayers", microsoft7: "microsoft7" };
KolorMapApiProviders.Url  = { googlev3: "https://maps.googleapis.com/maps/api/js?sensor=false&v=3.14&callback=handleApiReady", 
		openlayers: "http://openlayers.org/api/2.12/OpenLayers.js",
		microsoft7: "http://ecn.dev.virtualearth.net/mapcontrol/mapcontrol.ashx?v=7.0&s=1&onscriptload=handleApiReady"
	};
KolorMapApiProviders.Key = { googlev3: "&key=", openlayers: "", microsoft7: "" };
KolorMapApiProviders.Script = { googlev3: "mxn.googlev3.core.js", openlayers: "mxn.openlayers.core.js", microsoft7: "mxn.microsoft7.core.js" };

//store map loaded state
var mapLoaded = new ktools.Map();
var mapLoadedCounter = new ktools.Map();
var mapPluginApiReadyCheck = new Array();
//store the default marker ID to activate it once registered
var mapMarkerDefault = new ktools.Map();
//validate if the map has been instantiated
var mapInstance = new ktools.Map();
var mapInitCounter = new ktools.Map();

//Add timestamp to mapstraction library to force IE to reload scripts
var refreshIE = "";
if (navigator.appName == "Microsoft Internet Explorer") {
	var timestamp = new Date().getTime();
	refreshIE = "?v="+timestamp;
}

//API provider keys
var microsoft_key = "";

/**
 * @desc Check if a map API is loaded.
 * @function
 * @return {void}
 */
function handleApiReady() {
	//get first plugName
	var pluginName = mapPluginApiReadyCheck[0];
	
	if( debug ){
		console.log('Proprietary map API is loaded for '+pluginName);
	}
	
	if( pluginName != null ){
		var counter = mapLoadedCounter.item(pluginName) - 1;
		mapLoadedCounter.update(pluginName, counter);
		
		if(counter <= 0){
			mapLoaded.update(pluginName, true);
		}
		
		//remove first plugName
		mapPluginApiReadyCheck.shift();
	}
}

/** START PLUGIN MAP (for pluginName) */

/**
 * @desc Add KolorMap plugin instance when krpano is loaded.
 * @function
 * @param {String} pluginName The name of the plugin instance.
 * @param {Object[]} mapsApiArray Array of maps API names and keys couple.
 * @param {String} mapAreaDiv The map area DOM div name, if exists.
 * @return {void}
 */
function addKolorMap(pluginName, mapsApiArray, mapAreaDiv){
	
	var mapsApiLength = mapsApiArray.length;
	if(mapsApiLength > 0){
		// add map for maps API
		
		var mapApiOrder = new Array();
		var hasOpenlayersMap = false;
		//loop for maps API and maps API keys construction
		for(var i=0; i < mapsApiLength; i++){
			
			mapPluginApiReadyCheck.push(pluginName);
			
			switch(mapsApiArray[i][0]){
				case "microsoft7" :
					//update the microsoft key
					microsoft_key = mapsApiArray[i][1];
					mapApiOrder[i] = [KolorMapApiProviders.Type.microsoft7, KolorMapApiProviders.Url.microsoft7, KolorMapApiProviders.Key.microsoft7, KolorMapApiProviders.Script.microsoft7];
					break;
				case "googlev3" :
					//add key
					KolorMapApiProviders.Key.googlev3 += mapsApiArray[i][1];
					mapApiOrder[i] = [KolorMapApiProviders.Type.googlev3, KolorMapApiProviders.Url.googlev3, KolorMapApiProviders.Key.googlev3, KolorMapApiProviders.Script.googlev3];
					break;
				case "openlayers" :
					hasOpenlayersMap = true;
					mapApiOrder[i] = [KolorMapApiProviders.Type.openlayers, KolorMapApiProviders.Url.openlayers, KolorMapApiProviders.Key.openlayers, KolorMapApiProviders.Script.openlayers];
					break;
			}
		}
		
		//init values for this plugin
		mapLoaded.add(pluginName, false);
		mapMarkerDefault.add(pluginName, {done: false});
		mapInstance.add(pluginName, false);
		//number of maps API to load
		mapLoadedCounter.add(pluginName, mapsApiLength);
		mapInitCounter.add(pluginName, 300); //try to load map only during 30 seconds max.
		
		var mapPlugin = new ktools.KolorPlugin(pluginName);
		
		// Libraries Dynamic loading
		var mapApiScript = new ktools.Script(mapApiOrder[0][0], mapApiOrder[0][1]+mapApiOrder[0][2], [], false);
		
		if (mapsApiLength > 1) {
			//add second map layer
			var mapApiScript2 = new ktools.Script(mapApiOrder[1][0], mapApiOrder[1][1]+mapApiOrder[1][2], [mapApiScript], false);
			if (mapsApiLength > 2) {
				//add third map layer
				var mapApiScript3 = new ktools.Script(mapApiOrder[2][0], mapApiOrder[2][1]+mapApiOrder[2][2], [mapApiScript2], false);
				var mapstractionScript = new ktools.Script("maps_mapstraction", crossDomainTargetUrl+"kalasatama_talvi_2016data/graphics/KolorMap/lib/mxn.js"+refreshIE, [mapApiScript3], false);
				var mapstractionScriptCore = new ktools.Script("maps_mapstraction_core", crossDomainTargetUrl+"kalasatama_talvi_2016data/graphics/KolorMap/lib/mxn.core.js"+refreshIE, [mapstractionScript], false);
				var mapstractionScriptCoreLayer3 = new ktools.Script("maps_mapstraction_core_layer3", crossDomainTargetUrl+"kalasatama_talvi_2016data/graphics/KolorMap/lib/"+mapApiOrder[2][3]+refreshIE, [mapstractionScriptCore], false);
				var mapstractionScriptCoreLayer2 = new ktools.Script("maps_mapstraction_core_layer2", crossDomainTargetUrl+"kalasatama_talvi_2016data/graphics/KolorMap/lib/"+mapApiOrder[1][3]+refreshIE, [mapstractionScriptCoreLayer3], false);
				var mapstractionScriptCoreLayer1 = new ktools.Script("maps_mapstraction_core_layer1", crossDomainTargetUrl+"kalasatama_talvi_2016data/graphics/KolorMap/lib/"+mapApiOrder[0][3]+refreshIE, [mapstractionScriptCoreLayer2], false);
			} else {
				var mapstractionScript = new ktools.Script("maps_mapstraction", crossDomainTargetUrl+"kalasatama_talvi_2016data/graphics/KolorMap/lib/mxn.js"+refreshIE, [mapApiScript2], false);
				var mapstractionScriptCore = new ktools.Script("maps_mapstraction_core", crossDomainTargetUrl+"kalasatama_talvi_2016data/graphics/KolorMap/lib/mxn.core.js"+refreshIE, [mapstractionScript], false);
				var mapstractionScriptCoreLayer2 = new ktools.Script("maps_mapstraction_core_layer2", crossDomainTargetUrl+"kalasatama_talvi_2016data/graphics/KolorMap/lib/"+mapApiOrder[1][3]+refreshIE, [mapstractionScriptCore], false);
				var mapstractionScriptCoreLayer1 = new ktools.Script("maps_mapstraction_core_layer1", crossDomainTargetUrl+"kalasatama_talvi_2016data/graphics/KolorMap/lib/"+mapApiOrder[0][3]+refreshIE, [mapstractionScriptCoreLayer2], false);
			}
		} else {
			var mapstractionScript = new ktools.Script("maps_mapstraction", crossDomainTargetUrl+"kalasatama_talvi_2016data/graphics/KolorMap/lib/mxn.js"+refreshIE, [mapApiScript], false);
			var mapstractionScriptCore = new ktools.Script("maps_mapstraction_core", crossDomainTargetUrl+"kalasatama_talvi_2016data/graphics/KolorMap/lib/mxn.core.js"+refreshIE, [mapstractionScript], false);
			var mapstractionScriptCoreLayer1 = new ktools.Script("maps_mapstraction_core_layer1", crossDomainTargetUrl+"kalasatama_talvi_2016data/graphics/KolorMap/lib/"+mapApiOrder[0][3]+refreshIE, [mapstractionScriptCore], false);
		}
		
		var kolorMapScript = new ktools.Script("kolormap", crossDomainTargetUrl+"kalasatama_talvi_2016data/graphics/KolorMap/js/KolorMap.min.js", [mapstractionScriptCoreLayer1], true);
		mapPlugin.addScript(kolorMapScript);
		
		ktools.KolorPluginList.getInstance().addPlugin(mapPlugin.getPluginName(), mapPlugin, true);
		
		if(hasOpenlayersMap){
			//delay for 1000ms for OpenLayers only
			setTimeout(function() { handleApiReady(); }, 1000);
		}
		
		//display
		initKolorMapOnReady(pluginName, mapApiScript.getName(), mapAreaDiv);
	}
}

/**
 * @desc Init the KolorMap script to generate the map.
 * @function
 * @param {String} pluginName The name of the plugin instance.
 * @param {String} defaultMapLayer the default map layer name.
 * @param {String} mapAreaDiv The map area DOM div name, if exists.
 * @return {void}
 */
function initKolorMapOnReady(pluginName, defaultMapLayer, mapAreaDiv) {
	var err = "";
	var reload = false;
	
	if ( !krpanoLoaded ) { 
		err = "throw: krpano is not loaded";
		reload = true;
	}
	
	if ( !isTourStarted ) { 
		err = "throw: tour is not started";
		reload = true;
	}
	
	if ( !mapLoaded.item(pluginName) ) {
		err = "throw: plugin Map is not loaded";
		reload = true;
	}
	
	//map generation
	if  ( typeof KolorMap == "undefined" || !ktools.KolorPluginList.getInstance().getPlugin(pluginName).isInitialized() ) {
		err = "throw: KolorMap library not ready";
		reload = true;
	}
	
	//verify map instance
	if(mapInstance.item(pluginName) && ktools.KolorPluginList.getInstance().getPlugin(pluginName).getRegistered()){
		err = "throw: KolorMap already loaded";
		reload = true;
	}else{
		mapInstance.update(pluginName, true);
	}
	
	// verify if vr XML plugin is loaded
	if (getKrValue('ptplugin['+pluginName+'].engine', 'string') == null){
		err = "throw: KolorMap can't reach XML yet";
		reload = true;
	}
	
	// reload init if KolorMap is not ready
	if(reload){
		if ( debug ) {
			console.log(err);
		}
		
		if(mapInitCounter.item(pluginName) > 0){
			// start counter only when tour is started
			if (isTourStarted) {
				mapInitCounter.update(pluginName, (mapInitCounter.item(pluginName) - 1));
			}
			// if not loaded, retry in 100 ms
			setTimeout(function() { initKolorMapOnReady(pluginName, defaultMapLayer, mapAreaDiv); }, 100);
			return;
		}else{
			// TODO change text value
			alert("Connection timeout while making map API call. Try to reload the page.");
			return;
		}
	}
	
	// prepare multimap swap selector
	var selectorArray = new Array();
	
	//set the default map
	if (getKrValue('ptplugin['+pluginName+'].multimap', 'bool')) {
		
		//default map is the first element
		var defaultMap = new Object();
		defaultMap['element'] = getKrValue('ptplugin['+pluginName+'].multiplemaps.map[0].element', 'string'); //sample: 'mapdiv'
		defaultMap['provider'] = getKrValue('ptplugin['+pluginName+'].multiplemaps.map[0].provider', 'string'); //sample: mapApiScript.getName()
		defaultMap['name'] = ktools.I18N.getInstance().getMessage(getKrValue('ptplugin['+pluginName+'].multiplemaps.map[0].name', 'string'));
		selectorArray[0] = defaultMap;
		
		kolorMap = new KolorMap(defaultMap.element, defaultMap.provider);
	}else{
		if (mapAreaDiv) {
			kolorMap = new KolorMap(mapAreaDiv, defaultMapLayer);
		} else {
			kolorMap = new KolorMap('mapDIV', defaultMapLayer);
		}
	}
	
	if ( debug ) {
		console.log("instance: " + kolorMap);
	}
	
	//add map default DOM div elements
	if (mapAreaDiv) {
		kolorMap.setMapLayer(mapAreaDiv);
	} else {
		kolorMap.setMapLayer('mapDIV');
		kolorMap.setMapContainer('mapcontainer');
		kolorMap.setPanoContainer('panoDIV');
		kolorMap.setTourContainer('tourDIV');
	}
	
	//map div position
	kolorMap.setMapPosition(getKrValue('ptplugin['+pluginName+'].position', 'string'));
	
	//set url for maps images
	kolorMap.setGraphicsUrl(crossDomainTargetUrl+"kalasatama_talvi_2016data/graphics/"+pluginName.toLowerCase()+"/");
	
	//set color and resizable option
	kolorMap.setMapResizable(getKrValue('ptplugin['+pluginName+'].resizable', 'bool'));
	kolorMap.setBgColor(getKrValue('ptplugin['+pluginName+'].bgcolor', 'string'));
	
	// set if map must be displayed or hidden
	var displayOnStart = getKrValue('ptplugin['+pluginName+'].openatstart', 'bool');
	
	//init map size into DOM (needed for openlayers API);
	if (mapAreaDiv) {
		kolorMap.initMapLayer();
	} else {
		kolorMap.setMapSize(getKrValue('ptplugin['+pluginName+'].size', 'int'));
		if(displayOnStart){
			kolorMap.initMapSize();
			kolorMap.initMapLayer();
		}
	}
	
	//add swap selector
	if (getKrValue('ptplugin['+pluginName+'].multimap', 'bool')) {
		
		//second map
		var secondMap = new Object();
		secondMap['element'] = getKrValue('ptplugin['+pluginName+'].multiplemaps.map[1].element', 'string');
		secondMap['provider'] = getKrValue('ptplugin['+pluginName+'].multiplemaps.map[1].provider', 'string');
		secondMap['name'] = ktools.I18N.getInstance().getMessage(getKrValue('ptplugin['+pluginName+'].multiplemaps.map[1].name', 'string'));
		selectorArray[1] = secondMap;
		//add in DOM
		jQuery('#mapcontainer').append('<div id="'+secondMap['element']+'"></div>');
		
		//third map
		if (getKrValue('ptplugin['+pluginName+'].multiplemaps.map[2]')) {
			var thirdMap = new Object();
			thirdMap['element'] = getKrValue('ptplugin['+pluginName+'].multiplemaps.map[2].element', 'string');
			thirdMap['provider'] = getKrValue('ptplugin['+pluginName+'].multiplemaps.map[2].provider', 'string');
			thirdMap['name'] = ktools.I18N.getInstance().getMessage(getKrValue('ptplugin['+pluginName+'].multiplemaps.map[2].name', 'string'));
			selectorArray[2] = thirdMap;
			//add in DOM
			jQuery('#mapcontainer').append('<div id="'+thirdMap['element']+'"></div>');
		}
		
		kolorMap.addSwapSelector(pluginName, selectorArray, ktools.I18N.getInstance().getMessage(getKrValue('ptplugin['+pluginName+'].multiplemaps.label', 'string')));
	}
	
	// initialize map position
	var startPointLat = getKrValue('ptplugin['+pluginName+'].lat', 'float');
	var startPointLng = getKrValue('ptplugin['+pluginName+'].lng', 'float');
	var startPointZoom = getKrValue('ptplugin['+pluginName+'].zoom','int');
	var startPoint = new mxn.LatLonPoint(startPointLat, startPointLng);
	kolorMap.setStartPoint(startPoint, startPointZoom);
	kolorMap.getMxnMap().setCenterAndZoom(startPoint, startPointZoom);
	
	// set map type
	switch(getKrValue('ptplugin['+pluginName+'].maptypelayer','string')){
		case 'satellite':
			kolorMap.getMxnMap().setMapType(mxn.Mapstraction.SATELLITE);
			break;
		case 'hybrid':
			kolorMap.getMxnMap().setMapType(mxn.Mapstraction.HYBRID);
			break;
		case 'physical':
			kolorMap.getMxnMap().setMapType(mxn.Mapstraction.PHYSICAL);
			break;
		default:
			//'road'
			kolorMap.getMxnMap().setMapType(mxn.Mapstraction.ROAD);
	}
	
	// add controls
	var useZoom = getKrValue('ptplugin['+pluginName+'].controls.zoom', 'bool');
	var usePan = getKrValue('ptplugin['+pluginName+'].controls.pan', 'bool');
	var useMapType = getKrValue('ptplugin['+pluginName+'].controls.maptype', 'bool');
	var useOverview = getKrValue('ptplugin['+pluginName+'].controls.overview', 'bool');
	var useScale = getKrValue('ptplugin['+pluginName+'].controls.scale', 'bool');
	var useSpecific = new Object();
	if(getKrValue('ptplugin['+pluginName+'].controls.specific')){
		if(getKrValue('ptplugin['+pluginName+'].controls.specific.streetview', 'bool')){
			useSpecific.streetview = getKrValue('ptplugin['+pluginName+'].controls.specific.streetview', 'bool');
		}
	}
	kolorMap.addControls(useZoom,usePan,useScale,useMapType,useOverview,useSpecific);
	
	// add ui controls
	var useDragging = false;
	var useScroll = false;
	var useDblClick = false;
	if(getKrValue('ptplugin['+pluginName+'].controls.ui')){
		useDragging = getKrValue('ptplugin['+pluginName+'].controls.ui.draggable', 'bool');
		useScroll = getKrValue('ptplugin['+pluginName+'].controls.ui.scrollable', 'bool');
		useDblClick = getKrValue('ptplugin['+pluginName+'].controls.ui.dblclick', 'bool');
	}
	kolorMap.getMxnMap().setOption('enableDragging', useDragging);
	kolorMap.getMxnMap().setOption('enableScrollWheelZoom', useScroll);
	kolorMap.getMxnMap().setOption('disableDoubleClickZoom', !useDblClick);
	
	// generate radar(s)
	var useRadars = false;
	var radarOptions = {};
	if(getKrValue('ptplugin['+pluginName+'].radar.visible','string') == "true"){
		useRadars = true;
		radarOptions = {
			radius: getKrValue('ptplugin['+pluginName+'].radar.radius','int'), 
			linkToZoom: getKrValue('ptplugin['+pluginName+'].radar.linktozoom','bool'), 
			quality: getKrValue('ptplugin['+pluginName+'].radar.quality','int'), 
			color: getKrValue('ptplugin['+pluginName+'].radar.linecolor','string'), 
			opacity: getKrValue('ptplugin['+pluginName+'].radar.lineopacity','float'), 
			width: getKrValue('ptplugin['+pluginName+'].radar.linewidth','int'), 
			fillColor: getKrValue('ptplugin['+pluginName+'].radar.fillcolor','string'), 
			fillOpacity: getKrValue('ptplugin['+pluginName+'].radar.fillopacity','float'),
			enginePreset: 0
		};
	}
	
	// add markers
	var markersLength = parseInt(getKrPanoInstance().get('ptplugin['+pluginName+'].marker.count'));
	if(markersLength > 0){
		for( var i=0; i < markersLength; i++ ){
			var markerId = getKrValue('ptplugin['+pluginName+'].marker[' + i + '].name', 'string');
			var markerPointLat = getKrValue('ptplugin['+pluginName+'].marker[' + i + '].lat', 'float');
			var markerPointLng = getKrValue('ptplugin['+pluginName+'].marker[' + i + '].lng', 'float');
			var markerLatLon = new mxn.LatLonPoint(markerPointLat, markerPointLng);
			
			// actions
			var isDraggable = getKrValue('ptplugin['+pluginName+'].marker[' + i + '].draggable', 'bool');
			var infoOnHover = getKrValue('ptplugin['+pluginName+'].marker[' + i + '].onhover', 'bool');
			
			// icon
			var iconUrl = "";
			var iconSize = null;
			var iconAnchor = null;
			var markerIcon = getKrValue('ptplugin['+pluginName+'].marker[' + i + '].markericon[0]','object');
			if ( markerIcon != null ) {
				iconUrl = markerIcon.url;
				iconSize = new Array();
				iconSize[0] = parseInt(markerIcon.iconwidth);
				iconSize[1] = parseInt(markerIcon.iconheight);
				iconAnchor = new Array();
				switch ( markerIcon.iconanchor.toLowerCase() ) {
					case "topleft":
						iconAnchor[0] = 0;
						iconAnchor[1] = 0;
						break;
					case "top"://topcenter
						iconAnchor[0] = parseInt(iconSize[0]/2);
						iconAnchor[1] = 0;
						break;
					case "topright":
						iconAnchor[0] = iconSize[0];
						iconAnchor[1] = 0;
						break;
					case "left"://middleleft
						iconAnchor[0] = 0;
						iconAnchor[1] = parseInt(iconSize[1]/2);
						break;
					case "center"://middlecenter
						iconAnchor[0] = parseInt(iconSize[1]/2);
						iconAnchor[1] = parseInt(iconSize[1]/2);
						break;
					case "right"://middleright
						iconAnchor[0] = iconSize[0];
						iconAnchor[1] = parseInt(iconSize[1]/2);
						break;
					case "bottomleft":
						iconAnchor[0] = 0;
						iconAnchor[1] = iconSize[1];
						break;
					case "bottomright":
						iconAnchor[0] = iconSize[0];
						iconAnchor[1] = iconSize[1];
						break;
					default:
						//"bottom" : bottomcenter
						iconAnchor[0] = parseInt(iconSize[0]/2);
						iconAnchor[1] = iconSize[1];
				}
			}
			
			// add radar only for scene marker
			if(useRadars && getKrValue('ptplugin['+pluginName+'].marker[' + i + '].isscene', 'bool')){
				
				// change radar heading
				var markerPointHeading = getKrValue('ptplugin['+pluginName+'].marker[' + i + '].heading', 'float');
				radarOptions.heading = markerPointHeading;
				
				var aMarkerRadar = kolorMap.addRadar(markerId, markerLatLon, radarOptions);
			}
			
			//add marker (always after radar for openlayers layers z-index)
			var aMarker = kolorMap.addMarker(markerId, pluginName, markerLatLon, iconUrl, iconSize, iconAnchor, jQuery.trim(ktools.I18N.getInstance().getMessage(getKrValue('ptplugin['+pluginName+'].marker[' + i + '].desc', 'string'))), getKrValue('ptplugin['+pluginName+'].marker[' + i + '].desctype', 'string'), infoOnHover, isDraggable);
			
			// set the marker's event
			kolorMap.getMxnMap().addEventListener('click', mapMarkerEvent, aMarker);
		}
	}
	
	//register plugin
	ktools.KolorPluginList.getInstance().getPlugin(pluginName).register(kolorMap);
	
	var kolorMapRegistred = ktools.KolorPluginList.getInstance().getPlugin(pluginName).getRegistered();
	
	//if the marker ID to activate have been initialized while the map wasn't registered, activate it now
	if ( kolorMapRegistred ) {
		
		if (mapMarkerDefault.item(pluginName).done == false) {
			var applySelection = true;
			if (getKrValue('ptplugin['+pluginName+'].markerSelected.name','string') != "") {
				setMapDefaultMarker(pluginName, getKrValue('ptplugin['+pluginName+'].markerSelected.name','string'), getKrValue('ptplugin['+pluginName+'].markerSelected.heading','float'), getKrValue('ptplugin['+pluginName+'].markerSelected.fov','float'));
			} else if (mapMarkerDefault.item(pluginName).id != undefined) {
				mapMarkerDefaultArray = [mapMarkerDefault.item(pluginName).id, mapMarkerDefault.item(pluginName).heading, mapMarkerDefault.item(pluginName).fov];
			} else {
				applySelection = false;
			}
			
			if (applySelection) {
				if ( debug ) {
					console.log("activate the stored marker after init");
				}
				var mapMarkerDefaultArray = [mapMarkerDefault.item(pluginName).id, mapMarkerDefault.item(pluginName).heading, mapMarkerDefault.item(pluginName).fov];
				kolorMapRegistred.changeCurrentMarker(mapMarkerDefaultArray);
			}
			mapMarkerDefault.update(pluginName, {done: true});
		}
	}else{
		if ( debug ) {
			console.log("KolorMap isn't really loaded");
		}
		mapInstance.update(pluginName, false);
		//if not loaded, retry in 100 ms
		setTimeout(function() { initKolorMapOnReady(pluginName, defaultMapLayer, mapAreaDiv); }, 100);
		return;
	}
	
	if (mapAreaDiv) {
		//force refresh for openlayers
		kolorMapRegistred.forceResizeMapLayer([mapAreaDiv]);
	} else {
		//hide map if needed
		if(displayOnStart){
			kolorMapRegistred.initResizableMap();
		}else{
			if ( kolorMapRegistred ) {
				kolorMapRegistred.openCloseMap(["close"]);
			}
		}
	}
	
	//call ready statement for krpano script
	invokeKrFunction("kolorMapJsReady-"+pluginName);
}

/**
 * @desc Store the map default marker with datas.
 * @function
 * @param {String} pluginName The plugin name.
 * @param {String} markerId The marker ID.
 * @param {String} krHeading The heading value from krpano.
 * @param {String} krFov The fov value from krpano.
 */
function setMapDefaultMarker(pluginName, markerId, krHeading, krFov){
	var mapMarkerDefaultObject = { id: markerId, heading: krHeading, fov: krFov, done: false };
	mapMarkerDefault.update(pluginName, mapMarkerDefaultObject);
}

/**
 * @desc Event on a map marker.
 * @function
 * @param {String} eventType The type of the event: 'click'.
 * @param {mxn.Marker} objectSource The marker object.
 * @param {Object} objdata Structured object additional informations.
 * @return {void}
 */
function mapMarkerEvent(eventType, objectSource, objdata) {
	if (debug) {
		console.log('Map marker event "' + eventType + '" for marker "' + objectSource.getAttribute("id") + '" on plugin "' + objectSource.getAttribute("plugName") + '"');
	}
	
	// if current marker is different select and activate the new marker
	if ( kolorMap.getActiveMarker() != objectSource ) {
		var jsMapMarkerAction = objectSource.getAttribute("plugName")+"GoMarker('" + objectSource.getAttribute("id") + "')";
		getKrPanoInstance().call(jsMapMarkerAction);
	}
	
	// call the marker 'jsclick' action
	var krMapMarkerAction = getKrValue('ptplugin['+objectSource.getAttribute("plugName")+'].marker[' + objectSource.getAttribute("id") + '].jsclick');
	getKrPanoInstance().call(krMapMarkerAction);
}

/**
 * @desc Change api provider on the fly for the map.
 * @function
 * @param {String} pluginName The plugin name.
 * @param {String} element The DOM element containing the map layer.
 * @param {String} api The provider API selected for the map layer element.
 * @return {void}
 */
function swapProvider(pluginName, element, api){
	if ( ktools.KolorPluginList.getInstance().getPlugin(pluginName).getRegistered() != null ) {
		var kolorMapRegistred = ktools.KolorPluginList.getInstance().getPlugin(pluginName).getRegistered();
		kolorMapRegistred.swapProvider([element, api]);
	}
}

/** ---------------------- End Plugin Map ----------------------- **/