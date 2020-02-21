require([
    "esri/Map",
    "esri/views/MapView",
    "esri/views/SceneView",
    "esri/widgets/Search",
    "esri/widgets/BasemapGallery",
    "esri/core/watchUtils",
    // Calcite Maps
    "calcite-maps/calcitemaps-v0.8",

    // Calcite Maps ArcGIS Support
    "calcite-maps/calcitemaps-arcgis-support-v0.8",

    // Bootstrap
    "bootstrap/Collapse",
    "bootstrap/Dropdown",
    "bootstrap/Tab",
    // Can use @dojo shim for Array.from for IE11
    "@dojo/framework/shim/array"
  ], function(
    Map,
    MapView,
    SceneView,
    Search,
    Basemaps,
    watchUtils,
    CalciteMaps,
    CalciteMapsArcGIS
  ) {
    /******************************************************************
     *
     * App settings
     *
     ******************************************************************/

    app = {
      center: [-40, 40],
      scale: 50000000,
      basemap: "streets",
      viewPadding: {
        top: 50,
        bottom: 0
      },
      uiComponents: ["zoom", "compass", "attribution"],
      mapView: null,
      containerMap: "mapViewDiv"
    };

    /******************************************************************
     *
     * Create the map and scene view and ui components
     *
     ******************************************************************/

    // Map
    const map = new Map({
      basemap: app.basemap
    });

    // 2D view
    app.mapView = new MapView({
      container: app.containerMap,
      map: map,
      center: app.center,
      scale: app.scale,
      padding: app.viewPadding,
      ui: {
        components: app.uiComponents
      }
    });

    // CalciteMapsArcGIS.setPopupPanelSync(app.mapView);



    // Create basemap widget
    app.basemapWidget = new Basemaps({
      view: app.activeView,
      container: "basemapPanelDiv"
    });
  
  });