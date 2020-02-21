define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "application/LayerSwipe",
    "esri/layers/FeatureLayer",
    "esri/dijit/HomeButton",
    "esri/tasks/query",
    "esri/tasks/QueryTask",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/renderers/SimpleRenderer",
    "esri/Color",
    "esri/layers/GraphicsLayer",
    "esri/graphic",
    "esri/geometry/Extent",
    "esri/SpatialReference",

    "dojo/on",
    "dojo/dom",
    "dojo/query",
    "dojo/dom-construct",
    "dojo/NodeList-traverse"
  ],
  function (
    declare,
    lang,
    LayerSwipe,
    FeatureLayer,
    HomeButton,
    Query,
    QueryTask,
    SimpleMarkerSymbol,
    SimpleLineSymbol,
    SimpleRenderer,
    Color,
    GraphicsLayer,
    Graphic,
    Extent,
    SpatialReference,
    on,
    dom,
    query,
    domConstruct

  ) {
    return declare(null, {
      map: null,
      layers: null,
      direction: 'vertical',
      left: 900,
      top: 400,
      swipeLayer: null,
      underLayer: null,
      swipeWidget: null,
      notSwipeLayer: ['inlets'],
      inletsLayer: null,
      home: null,
      swipeLayerTitle: null,
      underLayerTitle: null,
      inlets: null,

      constructor: function (params) {
        lang.mixin(this, params);
        this.map = params.map,
        this.layers = params.layers;
        this.extent = params.map.extent;
      },

      postCreate: function () {
        //let inletsLyrUrl = 'http://services1.arcgis.com/aT1T0pU1ZdpuDk1t/arcgis/rest/services/inlets/FeatureServer/0';
        this.inherited(arguments);

      },

      startup: function () {
        this.map.graphics.enableMouseEvents();
        // let inletsLyrUrl = 'http://services1.arcgis.com/aT1T0pU1ZdpuDk1t/arcgis/rest/services/inlets/FeatureServer/0';
        let inletsLyrUrl = 'https://services1.arcgis.com/aT1T0pU1ZdpuDk1t/arcgis/rest/services/Inlets/FeatureServer/0';
        this.inletsLayer = new FeatureLayer(inletsLyrUrl, {
          mode: FeatureLayer.MODE_ONDEMAND,
          outFields: ['InletName'],
          id: 'inletsLayer'
        });


        let highlightLayer = new GraphicsLayer();
        let highlightPoint = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 20,
          new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
            new Color([255, 23, 68]), 3), new Color([255, 144, 0, 0.25]));
        highlightLayer.setRenderer(new SimpleRenderer(highlightPoint));


        let queryTask = new QueryTask(inletsLyrUrl);
        let sql = new Query();
        sql.where = '1=1';
        sql.outFields = ['InletName'];
        sql.returnGeometry = true;

        queryTask.execute(sql, item => {
          return item.features.map(feature => {
            let name = feature.attributes.InletName;
            $('#inletNames').append($('<option>', {
              value: name,
              text: name
            }));
            return feature;
          });
        }).then(response => {
          // console.log('inlet res', response);
          this.inlets = response;
        });

        this.map.addLayers([highlightLayer, this.inletsLayer]);

        this.home = new HomeButton({
          map: this.map
        }, "HomeButton");
        this.home.startup();
        // console.log('home: ', this.home);


        this.initializePanel(this.layers, '#swipeLyrs', '#underLyrs', this.notSwipeLayer);

        /////////////////////////
        // Select swipe layer
        /////////////////////////
        on(dom.byId('swipeLyrs'), 'change', evt => {
          this.swipeLayerTitle = evt.target.value;
          this._noDupLayerTitleParse(this.layers, '#underLyrs', this.notSwipeLayer, this.swipeLayerTitle);

          //this._layerTitleParse(this.layers, '#underLyrs', this.notSwipeLayer, swipeLyrTitle);
          //if (this.swipeWidget) { this.swipeWidget.destroy(); }
          if (this.swipeLayer) {
            this.swipeLayer.setVisibility(false);
          }
          this.swipeLayer = this._getMapLayerObject(this.swipeLayerTitle);
          this.swipeLayer.setVisibility(true);
          this.map.reorderLayer(this.swipeLayer, this.layers.length);

          if (this.swipeWidget) {
            this.swipeWidget.layers = [this.swipeLayer];
          } else {
            this.swipeWidget = new LayerSwipe({
              type: this.direction,
              map: this.map,
              layers: [this.swipeLayer],
              left: this.left,
              top: this.top,
            }, 'swipeDiv');
          }
          this.swipeWidget.startup();
          //this.swipeWidget.swipe();
        });

        /////////////////////////
        // Select under layer
        /////////////////////////
        on(dom.byId('underLyrs'), 'change', evt => {
          //let underLyrTitle = evt.target.value;
          this.underLayerTitle = evt.target.value;
          if (this.underLayer) {
            this.underLayer.setVisibility(false);
          }
          this.underLayer = this._getMapLayerObject(this.underLayerTitle);
          this.underLayer.setVisibility(true);
          this.map.reorderLayer(this.underLayer, this.layers.length - 2);
          if (this.swipeLayer) {
            // console.log(this.swipeLayer);
            this._noDupLayerTitleParse(this.layers, '#swipeLyrs', this.notSwipeLayer, this.underLayerTitle);
          }
        });

        /////////////////////////////////////////////
        // Select direction 'Vertical' or 'Horizontal
        /////////////////////////////////////////////
        query('input[name=swipeDirectionRadio]').on('change', evt => {
          let direction = evt.target.value;
          switch (direction) {
            case 'vertical':
              this.swipeWidget.set('type', 'vertical');
              $('#swipeLyrLabel').text('Left:');
              $('#underLyrLabel').text('Right:');
              break;
            case 'horizontal':
              this.swipeWidget.set('type', 'horizontal');
              $('#swipeLyrLabel').text('Top:');
              $('#underLyrLabel').text('Bottom:');
              break;
          }
        });

        this.inletsLayer.on('mouse-over', evt => {
          this.map.setMapCursor("pointer");
          highlightLayer.clear();
          highlightLayer.add(new Graphic(evt.graphic.geometry));
        });

        this.inletsLayer.on('mouse-out', evt => {
          highlightLayer.clear();
        });

        this.inletsLayer.on('click', evt => {
          // console.log('clicked');
          // console.log(evt);
          let inletName = evt.graphic.attributes.InletName;
          //evt.graphic.attributes.InletName
          highlightLayer.clear();

          if (inletName === 'Mason Inlet') {
            let sr = new SpatialReference({ wkid: 102100 });
            let masonExtent = new Extent(-8662339.382528545, 4058503.6983121624, 
              -8652555.442907786, 4063156.802409145, sr);
            this.map.setExtent(masonExtent);
            //this.map.centerAndZoom(evt.mapPoint, 15);
          } else {
            setTimeout(() => {
              this.map.centerAndZoom(evt.mapPoint, 14);
            }, 600);
          }
          
          $(`#inletNames option[value="${inletName}"`).prop('selected', 'selected');
          this._appendInletInfo(inletName);
        });

        on(dom.byId('inletNames'), 'click', evt => {
          let selectedInlet = evt.target.value;
          highlightLayer.clear();
          this.inlets.features.map(item => {
            if (selectedInlet === 'Mason Inlet') {
              let sr = new SpatialReference({ wkid: 102100 });
              let masonExtent = new Extent(-8662339.382528545, 4058503.6983121624, 
                -8652555.442907786, 4063156.802409145, sr);
              this.map.setExtent(masonExtent);
            }
            if (item.attributes.InletName === selectedInlet) {
              this.map.centerAndZoom(item.geometry, 14);
            } 
            this._appendInletInfo(selectedInlet);
          });
        });

        on(dom.byId('infoBtn'), 'click', evt => {
          // console.log($('#infoBtn').val());
          if ($('#infoBtn').val() === 'hide') {
            $('#infoBtn').val('show');
            this.openDrawer();
          } else {
            $('#infoBtn').val('hide');
            this.closeDrawer();
          }
        });

        on(dom.byId('textDrawerClose'), 'click', evt => {
          this.closeDrawer();
          $('#infoBtn').val('hide');
        });
        // }); // mapDeferred
      },

      destroy: function () {
        this.swipeLayer.setVisibility(false);
        this.underLayer.setVisibility(false);
        $('#swipeLyrs').empty();
        $('#underLyrs').empty();

        this.inherited(arguments);
        this.swipeWidget.destroy();
      },

      initializePanel: function (layers, swipeLyrEle, underLyrEle, notSwipeLayer) {
        this._layerTitleParse(layers, swipeLyrEle, notSwipeLayer);
        this._layerTitleParse(layers, underLyrEle, notSwipeLayer);
      },

      _getLayerInfo: function (layers) {
        return layers.map((item) => {
          return {
            id: item.id,
            title: item.title
          };
        });
      },

      _layerTitleParse: function (layers, selectedEle, notSwipeLayer) {
        for (let i = 0; i < layers.length; i++) {
          for (let j = 0; j < notSwipeLayer.length; j++) {
            if (layers[i].title != notSwipeLayer[j]) {
              $(selectedEle).append($('<option>', {
                value: layers[i].title,
                text: layers[i].title
              }));
            }
          }
        }
      },

      _noDupLayerTitleParse: function (layers, selectedEle, notSwipeLayer, layerTitle) {
        let optionSelected = $(`${selectedEle} option:selected`).text();
        // console.log('optionSelected', optionSelected);
        $(selectedEle).empty();
        if (this.underLayer === null) {
          $(selectedEle).append($('<option disabled="disabled" selected>Choose one</option>'));
        }

        for (let i = 0; i < layers.length; i++) {
          for (let j = 0; j < notSwipeLayer.length; j++) {
            if (layerTitle != layers[i].title && layers[i].title != notSwipeLayer[j]) {
              let val = {
                value: layers[i].title,
                text: layers[i].title
              };
              $(selectedEle).append($('<option>', val));
            }
          }
        }
        $(`${selectedEle} option:contains(${optionSelected})`).prop('selected', true);
      },

      _swapLayerTitleParse: function (swipeLyrEle, underLyrEle) {
        let selectedSwipLyr = $(`${swipeLyrEle} option:selected`).text();
        let selectedUnderLyr = $(`${underLyrEle} option:selected`).text();
        let swipeLyrChildren = $(swipeLyrEle).children();
        let underLyrChildren = $(underLyrEle).children();
        $(swipeLyrEle).empty();
        $(underLyrEle).empty();
        swipeLyrChildren.appendTo(underLyrEle);
        underLyrChildren.appendTo(swipeLyrEle);
        $(`${swipeLyrEle} option:contains(${selectedUnderLyr})`).prop('selected', true);
        $(`${underLyrEle} option:contains(${selectedSwipLyr})`).prop('selected', true);
      },


      _filterLayer: function (lyrTitle) {
        return this.layers.filter(layer => {
          if (layer.title === lyrTitle) {
            return layer
          }
        })[0];
      },

      _getMapLayerObject: function (lyrTitle) {
        let layerObj = this._filterLayer(lyrTitle);
        // console.log(layerObj);
        return this.map.getLayer(layerObj.id);
      },

      _getInletDoc: function (inletName) {
        // console.log(inletName);
        if (inletName === `Brown's Inlet`) {
          inletName = 'Browns Inlet';
        }
        inletsDesc = {
          'Oregon Inlet': './desc/Oregon.html',
          'Hatteras Inlet': './desc/Hatteras.html',
          'Ocracoke Inlet': './desc/Ocracoke.html',
          'Drum Inlet': './desc/Drum.html',
          'Barden Inlet': './desc/Barden.html',
          'Beaufort Inlet': './desc/Beaufort.html',
          'Bogue Inlet': './desc/Bogue.html',
          'Bear Inlet': './desc/Bear.html',
          'Browns Inlet': './desc/Browns.html',
          'New River Inlet': './desc/NewRiver.html',
          'New Topsail Inlet': './desc/NewTopsail.html',
          'Old Topsail Inlet': './desc/OldTopsail.html',
          'Rich Inlet': './desc/Rich.html',
          'Mason Inlet': './desc/Mason.html',
          'Masonboro Inlet': './desc/Masonboro.html',
          'Carolina Beach Inlet': './desc/CarolinaBeach.html',
          'New Inlet': './desc/New.html',
          'Cape Fear Inlet': './desc/CapeFear.html',
          'Lockwood Folly Inlet': './desc/LockwoodFolly.html',
          'Shallotte Inlet': './desc/Shallotte.html',
          'Tubbs Inlet': './desc/Tubbs.html',
          'Mad Inlet': './desc/Mad.html'
        }

        return inletsDesc[inletName];
      },

      _appendInletInfo: function (inletName) {
        let info = this._getInletDoc(inletName);
        $('#inletDesc').empty();
        $('#inletDesc').append(`<h3>${inletName}</h3>`);
        if (info) {
          // $('#inletDesc').append(info);
          
          $('#inletDesc').attr('src', info);
        }
      },

      openDrawer: function () {
        $('#textDrawer').css('width', '30%');
        $('#map').css('margin-left', '30%');
      },

      closeDrawer: function () {
        $('#textDrawer').css('width', '0');
        $('#map').css('margin-left', '0');
      },

    }); // declare


  }); // END