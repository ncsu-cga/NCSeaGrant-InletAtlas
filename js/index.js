require([
  "esri/map",
  "esri/arcgis/utils",
  "application/InletSwipeLayer",
  "dojo/domReady!"

], function (
  Map,
  arcgisUtils,
  InletSwipeLayer,
) {
    const inletsLyrUrl = 'http://services1.arcgis.com/aT1T0pU1ZdpuDk1t/arcgis/rest/services/inlets/FeatureServer/0';
    const webmapId = '7fb3454768024a6f8e053ecc02b291a1';

    function inletsLayerSwipe(webmapId) {
      let params = {
        map: null,
        layers: null
      };
      let lsWidget;

      let mapDeferred = arcgisUtils.createMap(webmapId, 'map');
      mapDeferred.then(response => {
        params.map = response.map;
        params.layers = response.itemInfo.itemData.operationalLayers;
        lsWidget = new InletSwipeLayer(params);
        lsWidget.startup();
      });
    }

    $(window).on('load', () => {
      $('#splash').modal('show');
    });

    $(document).ready(() => {
      inletsLayerSwipe(webmapId);
    }); 
   
  }); //END