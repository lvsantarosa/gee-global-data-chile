// =================================================================================
// Laboratoria de Recursos Hidricos y Geotecnologias
// Escuela de Agronomia - Pontificia Universidad Catolica de Valparaíso
// Autor: Lucas Vituri Santarosa
// Elaborado en 23/9/2025 con ayuda de Gemini
// Propósito: Descargar imágenes Landsat 8/9 o Sentinel-2 para provincias y comunas de Chile.
// Importante: Las imágenes de Sentinel-2 a 10m pueden ser muy grandes para la descarga
// directa por enlaces. En esos casos, utilice Landsat o la exportación a Google Drive.
// =================================================================================

// =================================================================================
// 1. CONFIGURACIÓN INICIAL Y DATOS
// =================================================================================
var assets = {
  provincias: ee.FeatureCollection('projects/ee-lucasviturisantarosa/assets/Provincias_CL'),
  comunas: ee.FeatureCollection('projects/ee-lucasviturisantarosa/assets/Comunas_CL')
};

var config = {
  columnas: {
    provincia: 'Provincia',
    comuna: 'Comuna',
    provEnComunas: 'Provincia'
  }
};

// =================================================================================
// 2. CREACIÓN DE LA APLICACIÓN
// =================================================================================
var app = {};
app.ui = {};
app.handlers = {};
app.helpers = {};
app.state = {};

app.boot = function() { app.ui.createPanels(); app.ui.createWidgets(); };

app.ui.createPanels = function() {
  app.ui.mainPanel = ui.Panel({style: {width: '400px', padding: '10px'}});
  app.ui.mapPanel = ui.Map();
  var splitPanel = ui.SplitPanel({firstPanel: app.ui.mainPanel, secondPanel: app.ui.mapPanel});
  ui.root.clear();
  ui.root.add(splitPanel);
};

app.ui.createWidgets = function() {
  // --- Selectores de Área ---
  var provinciasNombres = assets.provincias.aggregate_array(config.columnas.provincia).sort().getInfo();
  app.ui.provinciaSelect = ui.Select({
    items: provinciasNombres,
    placeholder: 'Seleccione una provincia',
    onChange: app.handlers.onProvinciaChange,
    style: {stretch: 'horizontal'}
  });
  app.ui.comunaSelect = ui.Select({
    placeholder: 'Primero seleccione una provincia',
    onChange: app.handlers.onComunaChange,
    style: {stretch: 'horizontal'},
    disabled: true
  });

  // --- Selector de Satélite ---
  app.ui.satelliteSelect = ui.Select({
    items: ['Sentinel-2', 'Landsat-9', 'Landsat-8'],
    value: 'Sentinel-2',
    style: {stretch: 'horizontal'}
  });

  // --- Otros Parámetros ---
  app.ui.startDateBox = ui.Textbox({placeholder: 'YYYY-MM-DD', value: '2025-01-01', style: {width: '120px'}});
  app.ui.endDateBox = ui.Textbox({placeholder: 'YYYY-MM-DD', value: '2025-03-31', style: {width: '120px'}});
  app.ui.cloudCoverBox = ui.Textbox({value: '25', style: {width: '100px'}});
  app.ui.coverageBox = ui.Textbox({value: '95', style: {width: '100px'}});
  app.ui.mosaicSelect = ui.Select({
    items: [{label: 'Imagen', value: 'single'},
            {label: 'Crear mosaico', value: 'mosaic'}], 
    value: 'mosaic', style: {stretch: 'horizontal'}
  });

  // --- Botones de Acción ---
  app.ui.runButton = ui.Button({label: '1. Analizar y Visualizar', onClick: app.handlers.runAnalysis, disabled: true, style: {stretch: 'horizontal', color: 'green'}});
  app.ui.downloadButton = ui.Button({label: '2. Generar enlaces de Download', onClick: app.handlers.getDownloadLinks, disabled: true, style: {stretch: 'horizontal'}});
  app.ui.exportButton = ui.Button({label: '3. Exportar a Google Drive', onClick: app.handlers.exportImage, disabled: true, style: {stretch: 'horizontal'}});

  app.ui.resultPanel = ui.Panel();
  app.ui.downloadPanel = ui.Panel();

  // --- Construcción del Panel Principal ---
  app.ui.mainPanel.add(ui.Label('Exportador de Imágenes Satelitales', {fontWeight: 'bold', fontSize: '20px'}));
  app.ui.mainPanel.add(ui.Label('Paso 1: Seleccione el Área', {fontWeight: 'bold'})).add(app.ui.provinciaSelect).add(app.ui.comunaSelect);
  app.ui.mainPanel.add(ui.Label('Paso 2: Seleccione el Satélite', {fontWeight: 'bold'})).add(app.ui.satelliteSelect);
  app.ui.mainPanel.add(ui.Label('Paso 3: Defina los Parámetros', {fontWeight: 'bold'}));
  app.ui.mainPanel.add(ui.Panel([ui.Label('Desde:', {width: '150px'}), app.ui.startDateBox], ui.Panel.Layout.flow('horizontal')));
  app.ui.mainPanel.add(ui.Panel([ui.Label('Hasta:', {width: '150px'}), app.ui.endDateBox], ui.Panel.Layout.flow('horizontal')));
  app.ui.mainPanel.add(ui.Panel([ui.Label('Nubes Máx (%):', {width: '150px'}), app.ui.cloudCoverBox], ui.Panel.Layout.flow('horizontal')));
  app.ui.mainPanel.add(ui.Panel([ui.Label('Cobertura Mín. (%):', {width: '150px'}), app.ui.coverageBox], ui.Panel.Layout.flow('horizontal')));
  app.ui.mainPanel.add(ui.Label('Paso 4: Elija el Tipo de Imagen', {fontWeight: 'bold'})).add(app.ui.mosaicSelect);
  app.ui.mainPanel.add(app.ui.runButton).add(app.ui.downloadButton).add(app.ui.exportButton);
  app.ui.mainPanel.add(app.ui.resultPanel).add(app.ui.downloadPanel);
  
  // --- Panel de Información y Créditos ---
  var separator = ui.Panel(null, null, {border: '1px solid #ccc', margin: '20px 0 10px 0'});
  var infoPanel = ui.Panel([
    ui.Label('Acerca de esta Aplicación', {fontWeight: 'bold'}),
    ui.Label('Autor: Lucas Vituri Santarosa', {fontSize: '11px'}),
    ui.Label('Laboratorio de Recursos Hidricos y Geotecnologias', {fontSize: '11px'}),
    ui.Label('Escuela de Agronomía', {fontSize: '11px'}),
    ui.Label('Pontificia Universidad Catolica de Valparaíso', {fontSize: '11px'}),
    ui.Label('Elaborado en 23/9/2025 con ayuda de Gemini.', {fontSize: '11px'}),
    ui.Label('Nota Importante:', {fontWeight: 'bold', margin: '6px 0 0 0'}),
    ui.Label('Las imágenes Sentinel-2 (10m) pueden ser muy grandes para la descarga por enlaces. Para áreas extensas, se recomienda usar Landsat (30m) o la opción de exportar a Google Drive.', {fontSize: '11px'})
  ]);
  app.ui.mainPanel.add(separator).add(infoPanel);
};

// =================================================================================
// 3. MANEJADORES DE EVENTOS Y LÓGICA
// =================================================================================
app.handlers.onProvinciaChange = function(provinciaNombre) {
  if (!provinciaNombre) return;
  
  app.ui.mapPanel.layers().reset();
  app.ui.resultPanel.clear();
  app.ui.downloadPanel.clear();
  
  var provinciaFeature = assets.provincias.filter(ee.Filter.eq(config.columnas.provincia, provinciaNombre)).first();
  app.state.selectedProvinciaFeature = provinciaFeature;
  
  app.state.aoi = provinciaFeature.geometry();
  app.state.selectedLocationName = provinciaNombre;
  
  app.ui.mapPanel.centerObject(app.state.aoi, 9);
  app.ui.mapPanel.addLayer(app.state.aoi, {color: 'blue', fillColor: '00000000'}, 'Límite Provincial');
  
  app.ui.runButton.setDisabled(false);
  
  app.ui.comunaSelect.setPlaceholder('Cargando...');
  var comunasFiltradas = assets.comunas.filter(ee.Filter.eq(config.columnas.provEnComunas, provinciaNombre));
  var comunasNombres = comunasFiltradas.aggregate_array(config.columnas.comuna).sort();
  
  comunasNombres.evaluate(function(nombres) {
    nombres.unshift('--- (Analizar Provincia Completa) ---');
    app.ui.comunaSelect.items().reset(nombres);
    app.ui.comunaSelect.setValue(nombres[0], false);
    app.ui.comunaSelect.setDisabled(false);
  });
};

app.handlers.onComunaChange = function(comunaNombre) {
  if (!comunaNombre) return;

  var provinciaFeature = app.state.selectedProvinciaFeature;
  var aoiFeature;
  
  if (comunaNombre !== '--- (Analizar Provincia Completa) ---') {
    aoiFeature = assets.comunas
      .filter(ee.Filter.eq(config.columnas.provEnComunas, provinciaFeature.get(config.columnas.provincia)))
      .filter(ee.Filter.eq(config.columnas.comuna, comunaNombre))
      .first();
    app.state.selectedLocationName = comunaNombre;
  } else {
    aoiFeature = provinciaFeature;
    app.state.selectedLocationName = provinciaFeature.get(config.columnas.provincia).getInfo();
  }
  
  app.state.aoi = aoiFeature.geometry();
  app.ui.mapPanel.clear();
  app.ui.mapPanel.centerObject(app.state.aoi, 11);
  app.ui.mapPanel.addLayer(app.state.aoi, {color: '#FFFF00', fillColor: '00000000', width: 2.0}, 'Área de Análisis');
};

app.handlers.runAnalysis = function() {
  app.ui.runButton.setDisabled(true);
  app.ui.downloadPanel.clear();
  app.ui.resultPanel.clear().add(ui.Label('🔎 Analizando...', {fontWeight: 'bold'}));
  
  var collection = app.helpers.getImageCollection();
  var mosaicOption = app.ui.mosaicSelect.getValue();

  if (mosaicOption === 'single') {
    var coverageFiltered = collection.map(app.helpers.addCoverage)
      .filter(ee.Filter.gte('coberturaAOI', ee.Number.parse(app.ui.coverageBox.getValue())));
    
    coverageFiltered.size().evaluate(function(size) {
      if (size > 0) {
        var bestImage = ee.Image(coverageFiltered.sort('CLOUDY_PIXEL_PERCENTAGE').first());
        bestImage.get('system:index').evaluate(function(id) {
          app.ui.resultPanel.add(ui.Label('✔️ Usando la mejor imagen individual:', {fontWeight: 'bold'}));
          app.ui.resultPanel.add(ui.Label(id, {fontSize: '11px'}));
          app.helpers.finalizeProcessing(bestImage);
        });
      } else {
        app.ui.resultPanel.clear().add(ui.Label('⚠️ No se encontró una imagen única con la cobertura mínima.', {color: 'orange'}));
        app.ui.resultPanel.add(ui.Label('Pruebe a aumentar el rango de fechas o usar la opción de mosaico.'));
        app.ui.runButton.setDisabled(false);
      }
    });

  } else { // Mosaico
    var idList = collection.aggregate_array('system:index');
    idList.evaluate(function(ids) {
      if (!ids || ids.length === 0) {
        app.ui.resultPanel.clear().add(ui.Label('❌ No se encontraron imágenes para este período.', {color: 'red'}));
        app.ui.runButton.setDisabled(false);
        return;
      }
      app.ui.resultPanel.add(ui.Label('✔️ Creando mosaico con ' + ids.length + ' imágenes:', {fontWeight: 'bold'}));
      ids.forEach(function(id) {
        app.ui.resultPanel.add(ui.Label(id, {fontSize: '11px', margin: '0 0 0 8px'}));
      });
      var mosaic = collection.median();
      app.helpers.finalizeProcessing(mosaic);
    });
  }
};

app.handlers.getDownloadLinks = function() {
  app.ui.downloadButton.setDisabled(true);
  app.ui.downloadPanel.clear().add(ui.Label('⚙️ Gerando links de download...'));
  
  var locationName = app.state.selectedLocationName.replace(/\s/g, '_');
  var scale = (app.ui.satelliteSelect.getValue() === 'Sentinel-2') ? 10 : 30;
  
  var bandsToExport = [
    {name: 'Blue', label: 'Banda Azul'}, {name: 'Green', label: 'Banda Verde'},
    {name: 'Red', label: 'Banda Roja'}, {name: 'NIR', label: 'Banda NIR'},
    {name: 'NDVI', label: 'Índice NDVI'}
  ];
  
  bandsToExport.forEach(function(bandInfo, index) {
    var singleBandImage = app.state.finalImage.select(bandInfo.name);
    var fileName = app.ui.satelliteSelect.getValue() + '_' + locationName + '_' + bandInfo.label.replace(/\s/g, '');
    var params = { name: fileName, scale: scale, region: app.state.aoi };
    
    if (index === 0) app.ui.downloadPanel.clear().add(ui.Label('Links de Download (GeoTIFF por camada):', {fontWeight: 'bold'}));
    
    singleBandImage.getDownloadURL(params, function(url, error) {
      if (url) app.ui.downloadPanel.add(ui.Label(bandInfo.label, {}, url));
      else app.ui.downloadPanel.add(ui.Label(bandInfo.label + ': Erro', {color: 'red'}));
      if (index === bandsToExport.length - 1) app.ui.downloadButton.setDisabled(false);
    });
  });
};

app.handlers.exportImage = function() {
  app.ui.exportButton.setDisabled(true);
  app.ui.resultPanel.clear(); 
  app.ui.downloadPanel.clear();
  
  var locationName = app.state.selectedLocationName.replace(/\s/g, '_');
  var satelliteName = app.ui.satelliteSelect.getValue().replace('-', '');
  var description = satelliteName + '_' + locationName + '_' + app.ui.startDateBox.getValue();
  var scale = (app.ui.satelliteSelect.getValue() === 'Sentinel-2') ? 10 : 30;

  Export.image.toDrive({
    image: app.state.finalImage.toFloat(),
    description: 'Export_' + description,
    folder: 'GEE_Exports_Chile',
    fileNamePrefix: description,
    region: app.state.aoi,
    scale: scale,
    maxPixels: 1e12
  });
  
  var instructionsPanel = ui.Panel([
    ui.Label('✅ ¡Tarea de exportación enviada!', {fontWeight: 'bold', fontSize: '16px', color: 'green'}),
    ui.Label('Se requiere un paso manual para iniciar la descarga:', {margin: '8px 0'}),
    ui.Label('1. Haz clic en el siguiente enlace para ir al gestor de tareas.', {margin: '4px 0'}),
    ui.Label('Ir al Gestor de Tareas (Tasks)', {fontWeight: 'bold', color: '#1a73e8'}, 'https://code.earthengine.google.com/tasks'),
    ui.Label('2. Busca la tarea llamada "' + 'Export_' + description + '" y haz clic en "RUN".', {margin: '4px 0'}),
    ui.Label('3. El archivo aparecerá en tu Google Drive cuando termine.', {margin: '4px 0'})
  ]);
  app.ui.resultPanel.add(instructionsPanel);
};

// =================================================================================
// 4. FUNCIONES DE AYUDA (Helpers)
// =================================================================================
app.helpers.getImageCollection = function() {
  var satellite = app.ui.satelliteSelect.getValue();
  var startDate = app.ui.startDateBox.getValue();
  var endDate = app.ui.endDateBox.getValue();
  var cloudCover = ee.Number.parse(app.ui.cloudCoverBox.getValue());
  var collection;

  if (satellite == 'Sentinel-2') {
    collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                   .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', cloudCover));
  } else {
    var l9 = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2');
    var l8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2');
    collection = (satellite == 'Landsat-9' ? l9 : l8)
                   .filter(ee.Filter.lt('CLOUD_COVER', cloudCover));
  }
  return collection.filterBounds(app.state.aoi)
                   .filterDate(startDate, endDate)
                   .map(app.helpers.normalizeBandsAndMask);
};

app.helpers.normalizeBandsAndMask = function(image) {
  var satellite = app.ui.satelliteSelect.getValue();
  var imageWithCloudProp;
  if (satellite == 'Sentinel-2') {
    var scl = image.select('SCL');
    var mask = scl.neq(3).and(scl.neq(8)).and(scl.neq(9)).and(scl.neq(10)); 
    var opticalBands = image.select(['B2', 'B3', 'B4', 'B8'], ['Blue', 'Green', 'Red', 'NIR']).divide(10000);
    imageWithCloudProp = opticalBands.updateMask(mask).set('CLOUDY_PIXEL_PERCENTAGE', image.get('CLOUDY_PIXEL_PERCENTAGE'));
  } else { // Landsat 8 y 9
    var qa = image.select('QA_PIXEL');
    var cloud = 1 << 3;
    var cloudShadow = 1 << 4;
    var mask = qa.bitwiseAnd(cloud).eq(0).and(qa.bitwiseAnd(cloudShadow).eq(0));
    var opticalBands = image.select(['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5'], ['Blue', 'Green', 'Red', 'NIR']);
    var scaledBands = opticalBands.multiply(0.0000275).add(-0.2);
    imageWithCloudProp = scaledBands.updateMask(mask).set('CLOUDY_PIXEL_PERCENTAGE', image.get('CLOUD_COVER'));
  }
  return imageWithCloudProp.copyProperties(image, ['system:time_start', 'system:index']);
};

app.helpers.addCoverage = function(image) {
  var coverage = image.geometry().intersection(app.state.aoi, ee.ErrorMargin(1)).area()
    .divide(app.state.aoi.area(ee.ErrorMargin(1))).multiply(100);
  return image.set('coberturaAOI', coverage);
};

app.helpers.finalizeProcessing = function(image) {
  var clippedImage = image.clip(app.state.aoi);
  var ndvi = clippedImage.normalizedDifference(['NIR', 'Red']).rename('NDVI');
  app.state.finalImage = clippedImage.addBands(ndvi);
  
  var visParams = {bands: ['Red', 'Green', 'Blue'], min: 0, max: 0.3, gamma: 1.2};
  app.ui.mapPanel.addLayer(app.state.finalImage, visParams, 'Vista Previa');
  app.ui.resultPanel.add(ui.Label('✅ Visualización lista.', {color: 'green'}));
  
  app.ui.runButton.setDisabled(false);
  app.ui.downloadButton.setDisabled(false);
  app.ui.exportButton.setDisabled(false);
};

// =================================================================================
// 5. INICIAR LA APLICACIÓN
// =================================================================================
app.boot();