// =================================================================================
// Laboratorio de Recursos Hídricos y Geotecnologías
// Escuela de Agronomía - Pontificia Universidad Católica de Valparaíso
// Autor: Lucas Vituri Santarosa
// Elaborado el 23/9/2025 con ayuda de Gemini
// Licencia: MIT (ver archivo LICENSE del repositorio)
//
// Propósito: Analizar el potencial de escorrentía superficial mediante el método
//            del Número de Curva (CN), con clasificación textural detallada (USDA)
//            para la determinación de los Grupos Hidrológicos de Suelo (HSG).
// =================================================================================

// =================================================================================
// 1. CONFIGURACIÓN INICIAL Y DATOS
// =================================================================================
var assets = {
  provincias: ee.FeatureCollection('projects/ee-lucasviturisantarosa/assets/Provincias_CL'),
  comunas: ee.FeatureCollection('projects/ee-lucasviturisantarosa/assets/Comunas_CL')
};
var config = {
  columnas: { provincia: 'Provincia', comuna: 'Comuna', provEnComunas: 'Provincia'},
  opcionProvinciaCompleta: '--- (Analizar Provincia Completa) ---'
};

// =================================================================================
// 2. CREACIÓN DE LA APLICACIÓN
// =================================================================================
var app = {}; app.ui = {}; app.handlers = {}; app.helpers = {}; app.state = {};
app.boot = function() { app.ui.createPanels(); app.ui.createWidgets(); };

app.ui.createPanels = function() {
  app.ui.mainPanel = ui.Panel({style: {width: '400px', padding: '10px'}});
  app.ui.mapPanel = ui.Map();
  var splitPanel = ui.SplitPanel({firstPanel: app.ui.mainPanel, secondPanel: app.ui.mapPanel});
  ui.root.clear(); ui.root.add(splitPanel);
};

app.ui.createWidgets = function() {
  var provinciasNombres = assets.provincias.aggregate_array(config.columnas.provincia).sort().getInfo();
  app.ui.provinciaSelect = ui.Select({items: provinciasNombres, placeholder: 'Seleccione una provincia', onChange: app.handlers.onProvinciaChange, style: {stretch: 'horizontal'}});
  app.ui.comunaSelect = ui.Select({placeholder: 'Primero seleccione una provincia', onChange: app.handlers.onComunaChange, style: {stretch: 'horizontal'}, disabled: true});
  
  app.ui.lulcYearSelect = ui.Select({items: ['2021', '2020'], value: '2021', style: {stretch: 'horizontal'}});
  
  app.ui.soilCheckbox = ui.Checkbox({label: 'Texturas del Suelo (SoilGrids, 250m)', value: true});
  app.ui.demCheckbox = ui.Checkbox({label: 'Elevación y Pendiente (NASA DEM, 30m)', value: true});
  app.ui.lulcCheckbox = ui.Checkbox({label: 'Uso de Suelo (ESA WorldCover, 10m)', value: true});
  
  app.ui.runButton = ui.Button({label: '1. Analizar y Visualizar Capas Base', onClick: app.handlers.runAnalysis, disabled: true, style: {stretch: 'horizontal', color: 'green'}});
  app.ui.erosionButton = ui.Button({label: '2. Analizar Potencial de Escorrentía (CN)', onClick: app.handlers.runErosionAnalysis, disabled: true, style: {stretch: 'horizontal', color: 'orange'}});
  
  app.ui.downloadButton = ui.Button({label: 'Generar Links de Descarga', onClick: app.handlers.getDownloadLinks, disabled: true, style: {stretch: 'horizontal'}});
  app.ui.exportButton = ui.Button({label: 'Exportar a Google Drive', onClick: app.handlers.runExportsToDrive, disabled: true, style: {stretch: 'horizontal'}});

  app.ui.resultPanel = ui.Panel();
  app.ui.downloadPanel = ui.Panel();

  app.ui.mainPanel.add(ui.Label('Análisis de Potencial de Escorrentía', {fontWeight: 'bold', fontSize: '20px'}));
  app.ui.mainPanel.add(ui.Label('Paso 1: Seleccione el Área', {fontWeight: 'bold'})).add(app.ui.provinciaSelect).add(app.ui.comunaSelect);
  app.ui.mainPanel.add(ui.Label('Paso 2: Configure las Capas de Entrada', {fontWeight: 'bold'}));
  app.ui.mainPanel.add(ui.Panel([ui.Label('Año del Uso de Suelo:', {width: '150px'}), app.ui.lulcYearSelect], ui.Panel.Layout.flow('horizontal')));
  app.ui.mainPanel.add(app.ui.soilCheckbox).add(app.ui.demCheckbox).add(app.ui.lulcCheckbox);
  app.ui.mainPanel.add(ui.Label('Paso 3: Ejecutar Análisis y Descargar', {fontWeight: 'bold'}));
  app.ui.mainPanel.add(app.ui.runButton).add(app.ui.erosionButton);
  app.ui.mainPanel.add(ui.Label('Opciones de Descarga:', {fontWeight: 'bold', margin: '8px 0 0 0'}));
  app.ui.mainPanel.add(app.ui.downloadButton).add(app.ui.exportButton);
  app.ui.mainPanel.add(app.ui.resultPanel).add(app.ui.downloadPanel);

  var separator = ui.Panel(null, null, {border: '1px solid #ccc', margin: '20px 0 10px 0'});
  var infoPanel = ui.Panel([
    ui.Label('Laboratorio de Recursos Hídricos y Geotecnologías', {fontWeight: 'bold', fontSize: '12px'}),
    ui.Label('Escuela de Agronomía - Pontificia Universidad Católica de Valparaíso', {fontSize: '11px'}),
    ui.Label('Autor: Lucas Vituri Santarosa', {fontSize: '11px'}),
    ui.Label('Elaborado en 23/9/2025 con ayuda de Gemini.', {fontSize: '11px'})
  ]);
  app.ui.mainPanel.add(separator).add(infoPanel);
};

// =================================================================================
// 3. MANEJADORES DE EVENTOS Y LÓGICA
// =================================================================================
app.handlers.onProvinciaChange = function(provinciaNombre) {
  if (!provinciaNombre) return;
  app.helpers.resetMap(); app.ui.resultPanel.clear(); app.ui.downloadPanel.clear();
  var provinciaFeature = assets.provincias.filter(ee.Filter.eq(config.columnas.provincia, provinciaNombre)).first();
  app.state.aoi = provinciaFeature.geometry();
  app.state.selectedLocationName = provinciaNombre;
  app.ui.mapPanel.centerObject(app.state.aoi, 9);
  app.ui.mapPanel.addLayer(app.state.aoi, {color: 'blue', fillColor: '00000000'}, 'Límite Provincial');
  app.ui.runButton.setDisabled(false);
  var comunasFiltradas = assets.comunas.filter(ee.Filter.eq(config.columnas.provEnComunas, provinciaNombre));
  var comunasNombres = comunasFiltradas.aggregate_array(config.columnas.comuna).sort();
  comunasNombres.evaluate(function(nombres) {
    nombres.unshift(config.opcionProvinciaCompleta);
    app.ui.comunaSelect.items().reset(nombres); app.ui.comunaSelect.setValue(nombres[0], false); app.ui.comunaSelect.setDisabled(false);
  });
};

app.handlers.onComunaChange = function(comunaNombre) {
  if (!comunaNombre) return;
  var provinciaNombre = app.ui.provinciaSelect.getValue();
  var aoiFeature;
  if (comunaNombre !== config.opcionProvinciaCompleta) {
    aoiFeature = assets.comunas.filter(ee.Filter.and(ee.Filter.eq(config.columnas.provEnComunas, provinciaNombre), ee.Filter.eq(config.columnas.comuna, comunaNombre))).first();
    app.state.selectedLocationName = comunaNombre;
  } else {
    aoiFeature = assets.provincias.filter(ee.Filter.eq(config.columnas.provincia, provinciaNombre)).first();
    app.state.selectedLocationName = provinciaNombre;
  }
  app.state.aoi = aoiFeature.geometry();
  app.helpers.resetMap();
  app.ui.resultPanel.clear(); app.ui.downloadPanel.clear();
  app.ui.mapPanel.centerObject(app.state.aoi, 11);
  app.ui.mapPanel.addLayer(app.state.aoi, {color: '#FFFF00', fillColor: '00000000', width: 2.0}, 'Área de Análisis');
};

app.handlers.runAnalysis = function() {
  app.ui.runButton.setDisabled(true); app.ui.downloadButton.setDisabled(true); app.ui.exportButton.setDisabled(true); app.ui.erosionButton.setDisabled(true);
  app.ui.downloadPanel.clear(); app.ui.resultPanel.clear().add(ui.Label('🔎 Analizando capas base...', {fontWeight: 'bold'}));
  app.helpers.resetMap();
  app.ui.mapPanel.addLayer(app.state.aoi, {color: '#FFFF00', fillColor: '00000000', width: 2.0}, 'Área de Análisis');
  app.helpers.finalizeProcessing();
};

app.handlers.getDownloadLinks = function() { app.helpers.createDownloads(false); };
app.handlers.runExportsToDrive = function() { app.helpers.createDownloads(true); };

// =================================================================================
// 4. FUNCIONES DE AYUDA (Helpers)
// =================================================================================
// Quita las capas y la leyenda del análisis anterior para que no se acumulen.
app.helpers.resetMap = function() {
  app.ui.mapPanel.layers().reset();
  app.state.runoffImage = null;
  if (app.ui.legendPanel) { app.ui.mapPanel.remove(app.ui.legendPanel); app.ui.legendPanel = null; }
};

app.helpers.finalizeProcessing = function() {
  var finalComposite = ee.Image(); 
  
  if (app.ui.soilCheckbox.getValue()) {
    app.ui.resultPanel.add(ui.Label('⚙️ Procesando datos del suelo...'));
    var sand = ee.Image("projects/soilgrids-isric/sand_mean").reduce(ee.Reducer.mean()).divide(10).rename('sand');
    var silt = ee.Image("projects/soilgrids-isric/silt_mean").reduce(ee.Reducer.mean()).divide(10).rename('silt');
    var clay = ee.Image("projects/soilgrids-isric/clay_mean").reduce(ee.Reducer.mean()).divide(10).rename('clay');
    var soil = sand.addBands(silt).addBands(clay).clip(app.state.aoi);
    
    var soilTextureClass = app.helpers.getSoilTextureClass(soil).rename('soil_texture_class').clip(app.state.aoi);
    var hsg = soilTextureClass.remap(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Valores de Clase Textural
      [1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 4]    // Valores de HSG (A=1, B=2, C=3, D=4) 
    ).rename('hsg');

    finalComposite = finalComposite.addBands(soil).addBands(soilTextureClass).addBands(hsg);
    var hsgVis = {min: 1, max: 4, palette: ['#FFFF00', '#008000', '#0000FF', '#FF0000']};
    app.ui.mapPanel.addLayer(soilTextureClass, {min:1, max:12, palette:['#E8D8B3','#E4CDA2','#F4A460','#D2B48C','#987654','#8B4513','#708090','#93C572','#A1D683','#B5E48C','#008000','#6A5ACD']}, 'Clase Textural del Suelo (USDA)');
    app.ui.mapPanel.addLayer(hsg, hsgVis, 'Grupo Hidrológico de Suelo (HSG)');
  }
  if (app.ui.demCheckbox.getValue()) {
    app.ui.resultPanel.add(ui.Label('⚙️ Procesando DEM y pendiente...'));
    var dem_raw = ee.Image('NASA/NASADEM_HGT/001').select('elevation').clip(app.state.aoi);
    // Mediana focal para atenuar el ruido y los vacíos del DEM antes de derivar la pendiente.
    // Nota: ee.Terrain.slope se evalúa a la escala solicitada, por lo que la pendiente
    // mostrada en el mapa se suaviza al alejar el zoom. El valor de referencia es el del
    // GeoTIFF exportado a 30 m, que usa la resolución nativa del DEM.
    var dem_filled = dem_raw.focal_median({radius: 60, units: 'meters'});
    var slope = ee.Terrain.slope(dem_filled);
    var slopePercent = slope.multiply(Math.PI/180).tan().multiply(100);
    var class1 = slopePercent.lte(3), class2 = slopePercent.gt(3).and(slopePercent.lte(7)),
        class3 = slopePercent.gt(7).and(slopePercent.lte(12)), class4 = slopePercent.gt(12).and(slopePercent.lte(25)),
        class5 = slopePercent.gt(25).and(slopePercent.lte(50)), class6 = slopePercent.gt(50).and(slopePercent.lte(75)),
        class7 = slopePercent.gt(75);
    var slope_class = ee.Image(0).add(class1.multiply(1)).add(class2.multiply(2)).add(class3.multiply(3))
      .add(class4.multiply(4)).add(class5.multiply(5)).add(class6.multiply(6)).add(class7.multiply(7))
      .rename('slope_class').clip(app.state.aoi);
    finalComposite = finalComposite.addBands(dem_raw.rename('elevation')).addBands(slope.rename('slope_degrees')).addBands(slopePercent.rename('slope_percent')).addBands(slope_class);
    var slopeClassVis = {min: 1, max: 7, palette: ['#32CD32', '#ADFF2F', '#FFFF00', '#FFA500', '#FF4500', '#FF0000', '#8B0000']};
    app.ui.mapPanel.addLayer(slope_class, slopeClassVis, 'Clases de Pendiente');
  }
  if (app.ui.lulcCheckbox.getValue()) {
    app.ui.resultPanel.add(ui.Label('⚙️ Procesando uso de suelo...'));
    var year = app.ui.lulcYearSelect.getValue();
    var version = (year === '2021') ? 'v200' : 'v100';
    var lulc = ee.ImageCollection('ESA/WorldCover/' + version).first().rename('LandCover').clip(app.state.aoi);
    var lulc30m = lulc.resample('bilinear').reproject({crs: 'EPSG:4326', scale: 30}).rename('lulc_30m');
    finalComposite = finalComposite.addBands(lulc).addBands(lulc30m);
    var lulcVis = {palette: ['#006400', '#ffbb22', '#ffff4c', '#f096ff', '#fa0000', '#b4b4b4', '#f0f0f0', '#0064c8', '#0096a0', '#00cf75', '#fae6a0']};
    app.ui.mapPanel.addLayer(lulc.selfMask(), lulcVis, 'Uso de Suelo (ESA ' + year + ')');
  }
  app.state.finalImage = finalComposite;
  app.ui.resultPanel.add(ui.Label('✅ Visualización de capas base completa.', {color: 'green', fontWeight: 'bold'}));
  app.ui.runButton.setDisabled(false); app.ui.downloadButton.setDisabled(false); app.ui.exportButton.setDisabled(false); app.ui.erosionButton.setDisabled(false);
};

// =================================================================================
// 5. ANÁLISIS DE ESCORRENTÍA (MÉTODO NÚMERO DE CURVA - CN)
// =================================================================================
app.handlers.runErosionAnalysis = function() {
  app.ui.resultPanel.clear().add(ui.Label('⚙️ Iniciando análisis de Potencial de Escorrentía (CN)...', {fontWeight: 'bold'}));
  var required = ['slope_percent', 'hsg', 'LandCover'];
  var available = app.state.finalImage.bandNames();
  var missing = ee.List(required).removeAll(available).getInfo();
  if (missing.length > 0) { app.ui.resultPanel.add(ui.Label('❌ Faltan capas para el análisis: ' + missing.join(', '), {color: 'red', fontWeight: 'bold'})); return; }
  app.helpers.calculateCurveNumber();
};

app.helpers.calculateCurveNumber = function() {
  var image = app.state.finalImage;
  var hsg = image.select('hsg');
  var lulc = image.select('LandCover');
  
  // Clases ESA WorldCover: 10 árboles, 20 matorral, 30 pastizal, 40 cultivo, 50 urbano,
  // 60 suelo desnudo, 70 nieve/hielo, 80 agua, 90 humedal, 95 manglar, 100 musgo/liquen.
  // Se incluyen 70, 80 y 100 (antes caían al valor por defecto y quedaban enmascaradas).
  var lulcClasses = [10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100];
  var cnA = lulc.remap(lulcClasses, [30, 39, 39, 67, 77, 77, 98, 100, 39, 30, 39], 0);
  var cnB = lulc.remap(lulcClasses, [55, 61, 61, 78, 86, 86, 98, 100, 61, 55, 61], 0);
  var cnC = lulc.remap(lulcClasses, [70, 74, 74, 85, 91, 91, 98, 100, 74, 70, 74], 0);
  var cnD = lulc.remap(lulcClasses, [77, 80, 80, 89, 94, 94, 98, 100, 80, 77, 80], 0);
  var cnBase = ee.Image(0).where(hsg.eq(1), cnA).where(hsg.eq(2), cnB).where(hsg.eq(3), cnC).where(hsg.eq(4), cnD).selfMask();
  
  var S = image.select('slope_percent').divide(100);
  var term1 = ee.Image(20).multiply(S).multiply(ee.Image(100).subtract(cnBase));
  var term2 = (ee.Image(100).subtract(cnBase)).add(ee.Image(7.5).multiply(S).exp());
  var runoffPotentialCN = cnBase.add(term1.divide(term2)).clamp(30, 100).rename('Runoff_CN');
  
  app.state.runoffImage = runoffPotentialCN;
  var runoffPalette = ['#2c7bb6', '#abd9e9', '#ffffbf', '#fdae61', '#d7191c'];
  app.ui.mapPanel.addLayer(runoffPotentialCN, {min: 30, max: 100, palette: runoffPalette}, 'Potencial de Escorrentía (CN)');
  
  if (app.ui.legendPanel) { app.ui.mapPanel.remove(app.ui.legendPanel); }
  var legend = ui.Panel({style: {position: 'bottom-left', padding: '8px 15px'}});
  legend.add(ui.Label({value: 'Potencial de Escorrentía (CN)', style: {fontWeight: 'bold', fontSize: '18px'}}));
  var makeRow = function(c, n) { return ui.Panel({widgets: [ui.Label({style:{backgroundColor:c,padding:'8px',margin:'0 4px'}}), ui.Label(n)], layout: ui.Panel.Layout.Flow('horizontal')});};
  var names = ['Muy Bajo (CN < 55)', 'Bajo (CN 55-70)', 'Moderado (CN 70-80)', 'Alto (CN 80-90)', 'Muy Alto (CN > 90)'];
  for (var i = 0; i < 5; i++) { legend.add(makeRow(runoffPalette[i], names[i])); }
  app.ui.legendPanel = legend;
  app.ui.mapPanel.add(legend);
  app.ui.resultPanel.add(ui.Label('✅ Análisis de Escorrentía (CN) concluido.', {color: 'green'}));
};

// =================================================================================
// 6. FUNCIONES AUXILIARES DE DESCARGA Y CLASIFICACIÓN
// =================================================================================
app.helpers.createDownloads = function(toDrive) {
  var button = toDrive ? app.ui.exportButton : app.ui.downloadButton;
  button.setDisabled(true);
  var panel = toDrive ? app.ui.resultPanel : app.ui.downloadPanel;
  panel.clear();
  var message = toDrive ? '⚙️ Enviando tareas de exportación...' : '⚙️ Generando links de descarga...';
  panel.add(ui.Label(message, {fontWeight: 'bold'}));
  
  var layersToProcess = [];
  var availableBands = app.state.finalImage.bandNames().getInfo();
  var allLayers = [
    {name: 'sand', label: 'Textura_Arena', scale: 250}, {name: 'silt', label: 'Textura_Limo', scale: 250}, {name: 'clay', label: 'Textura_Arcilla', scale: 250},
    {name: 'elevation', label: 'Elevacion', scale: 30}, {name: 'slope_degrees', label: 'Pendiente_grados', scale: 30}, {name: 'slope_percent', label: 'Pendiente_percent', scale: 30},
    {name: 'LandCover', label: 'Uso_Suelo_10m', scale: 10}, {name: 'slope_class', label: 'Clases_Pendiente', scale: 30},
    {name: 'hsg', label: 'Grupo_Suelo_SCS', scale: 250}, {name: 'soil_texture_class', label: 'Clase_Textural_USDA', scale: 250},
    {name: 'lulc_30m', label: 'Uso_Suelo_30m', scale: 30}
  ];
  allLayers.forEach(function(l) { if (availableBands.indexOf(l.name) > -1) { layersToProcess.push({image: app.state.finalImage, name: l.name, label: l.label, scale: l.scale}); } });
  if (app.state.runoffImage) { layersToProcess.push({image: app.state.runoffImage, name: 'Runoff_CN', label: 'Potencial_Escorrentia_CN', scale: 30}); }

  layersToProcess.forEach(function(layerInfo) {
    var imageToProcess = layerInfo.image.select(layerInfo.name);
    var description = layerInfo.label + '_' + app.state.selectedLocationName.replace(/\s/g, '_');
    if (toDrive) {
      Export.image.toDrive({image: imageToProcess.toFloat(), description: description, folder: 'GEE_Exports_Chile', fileNamePrefix: description, region: app.state.aoi, scale: layerInfo.scale, maxPixels: 1e13});
    } else {
      imageToProcess.getDownloadURL({name: description, scale: layerInfo.scale, region: app.state.aoi}, function(url, error) {
        if (url) { panel.add(ui.Label(layerInfo.label.replace(/_/g, ' '), {}, url)); }
        else { panel.add(ui.Label(layerInfo.label.replace(/_/g, ' ') + ': Error', {color: 'red'})); }
      });
    }
  });
  if (toDrive) { panel.add(ui.Label('✅ Tareas enviadas. Verifique la pestaña "Tasks".', {color: 'green', fontWeight: 'bold'})); }
  button.setDisabled(false);
};

app.helpers.getSoilTextureClass = function(soil) {
  var sand = soil.select('sand');
  var silt = soil.select('silt');
  var clay = soil.select('clay');
  
  // Condiciones lógicas para las 12 clases texturales de la USDA
  var class1 = sand.gte(85).and(silt.add(clay.multiply(1.5)).lt(15)); // Arena
  var class2 = sand.gte(70).and(sand.lt(90)).and(silt.add(clay.multiply(1.5)).gte(15)).and(silt.add(clay.multiply(2)).lt(30)); // Arena franca
  var class3 = clay.gte(7).and(clay.lt(20)).and(sand.gt(52)).and(silt.add(clay.multiply(2)).gte(30))
              .or(clay.lt(7).and(silt.lt(50)).and(silt.add(clay.multiply(2)).gte(30))); // Franco arenoso
  var class4 = clay.gte(7).and(clay.lt(27)).and(silt.gte(28)).and(silt.lt(50)).and(sand.lte(52)); // Franco
  var class5 = silt.gte(50).and(clay.gte(12)).and(clay.lt(27))
              .or(silt.gte(50).and(silt.lt(80)).and(clay.lt(12))); // Franco limoso
  var class6 = silt.gte(80).and(clay.lt(12)); // Limo
  var class7 = clay.gte(20).and(clay.lt(35)).and(silt.lt(28)).and(sand.gt(45)); // Franco arcillo-arenoso
  var class8 = clay.gte(27).and(clay.lt(40)).and(sand.gt(20)).and(sand.lte(45)); // Franco arcilloso
  var class9 = clay.gte(27).and(clay.lt(40)).and(sand.lte(20)); // Franco arcillo-limoso
  var class10 = clay.gte(35).and(sand.gte(45)); // Arcilla arenosa
  var class11 = clay.gte(40).and(silt.gte(40)); // Arcilla limosa
  var class12 = clay.gte(40).and(sand.lte(45)).and(silt.lt(40)); // Arcilla

  // Aplica las condiciones de forma secuencial para clasificar cada píxel
  var texture = ee.Image(0)
    .where(class1, 1).where(class2, 2).where(class3, 3).where(class4, 4)
    .where(class5, 5).where(class6, 6).where(class7, 7).where(class8, 8)
    .where(class9, 9).where(class10, 10).where(class11, 11)
    .where(class12, 12);
    
  return texture;
};

// =================================================================================
// 7. INICIAR LA APLICACIÓN
// =================================================================================
app.boot();
