<h1 align="center">🌎 GEE Global Data — Chile</h1>

<p align="center">
  <b>Herramientas de geoprocesamiento en Google Earth Engine para el análisis territorial de Chile</b><br>
  <sub>Recursos hídricos · Agricultura · Medio ambiente</sub>
</p>

<p align="center">
  <img alt="Plataforma" src="https://img.shields.io/badge/Google%20Earth%20Engine-Code%20Editor-4285F4?logo=google&logoColor=white">
  <img alt="Lenguaje" src="https://img.shields.io/badge/JavaScript-GEE%20API-F7DF1E?logo=javascript&logoColor=black">
  <img alt="Cobertura" src="https://img.shields.io/badge/Cobertura-Chile%20(provincias%20y%20comunas)-C8102E">
  <img alt="Apps" src="https://img.shields.io/badge/Apps%20publicadas-2-success">
</p>

<p align="center">
  <a href="https://lucasviturisantarosa.users.earthengine.app/view/multicritrio-escorrentia-scs"><b>▶ Abrir App 1 · Escorrentía (CN)</b></a>
  &nbsp;·&nbsp;
  <a href="https://lucasviturisantarosa.users.earthengine.app/view/download-imagenes-satelitales"><b>▶ Abrir App 2 · Descarga de imágenes</b></a>
</p>

---

Este repositorio reúne **aplicaciones interactivas de Google Earth Engine (GEE)** pensadas para que agrónomos, investigadores, estudiantes y profesionales de la planificación territorial puedan generar y descargar información geoespacial compleja **sin escribir código**: basta copiar el script, ejecutarlo y usar el panel lateral.

## 📑 Contenido

- [Aplicaciones disponibles](#-aplicaciones-disponibles)
  - [1. Analizador de Potencial de Escorrentía (CN)](#1-analizador-de-potencial-de-escorrentía-cn)
  - [2. Descargador de Imágenes Satelitales](#2-descargador-de-imágenes-satelitales)
- [Instalación y ejecución](#-instalación-y-ejecución)
- [Estructura del repositorio](#-estructura-del-repositorio)
- [Requisitos y notas técnicas](#-requisitos-y-notas-técnicas)
- [Cómo citar](#-cómo-citar)
- [Autoría y contacto](#-autoría-y-contacto)

## 🧰 Aplicaciones disponibles

| # | Aplicación | Script | ¿Para qué sirve? | App web |
|---|------------|--------|------------------|---------|
| 1 | **Analizador de Potencial de Escorrentía** | [`MULTICRITERIO_GEE_Chile.js`](MULTICRITERIO_GEE_Chile.js) | Modelación hidrológica multicriterio con el método del Número de Curva (SCS/NRCS) | [Abrir](https://lucasviturisantarosa.users.earthengine.app/view/multicritrio-escorrentia-scs) |
| 2 | **Descargador de Imágenes Satelitales** | [`DOWNLOAD_S2_L8_L9_Chile.js`](DOWNLOAD_S2_L8_L9_Chile.js) | Búsqueda, visualización y descarga de imágenes Sentinel-2 y Landsat 8/9 listas para análisis | [Abrir](https://lucasviturisantarosa.users.earthengine.app/view/download-imagenes-satelitales) |

---

### 1. Analizador de Potencial de Escorrentía (CN)

> Estima el **potencial de escorrentía superficial** combinando suelo, uso de suelo y relieve mediante una adaptación robusta del método del **Número de Curva (CN)** del SCS/NRCS. Útil en planificación territorial, gestión de cuencas, análisis de riesgo y estudios agronómicos.

**Características principales**

- 🗺️ **Selección flexible del área** — análisis por **provincia** y, opcionalmente, por **comuna**.
- 🌱 **Uso de suelo configurable** — ESA WorldCover **2020** o **2021**.
- 🧪 **Clasificación textural detallada** — determina una de las **12 clases texturales USDA** por píxel (arena/limo/arcilla) y la traduce a uno de los **4 Grupos Hidrológicos de Suelo (A–D)**.
- ⛰️ **Procesamiento avanzado del terreno** — filtro de suavizado (*fill*) sobre el DEM antes de calcular la pendiente, con reclasificación en **7 clases de relieve**.
- 💧 **Modelo de escorrentía referenciado** — CN base a partir de la interacción Suelo × Uso de suelo, ajustado por pendiente con una **formulación continua adaptada del modelo SWAT**.
- 👁️ **Visualización completa** — todas las capas base e intermedias se agregan al mapa con leyenda, permitiendo auditar el modelo paso a paso.
- ⬇️ **Descarga consolidada** — enlaces directos (GeoTIFF) o exportación a **Google Drive** (carpeta `GEE_Exports_Chile`).

**Clases de pendiente**

| Clase | Pendiente (%) | Clase | Pendiente (%) |
|:-----:|---------------|:-----:|---------------|
| 1 | ≤ 3 | 5 | 25 – 50 |
| 2 | 3 – 7 | 6 | 50 – 75 |
| 3 | 7 – 12 | 7 | > 75 |
| 4 | 12 – 25 | | |

**Interpretación del resultado**

| Potencial | Número de Curva |
|-----------|-----------------|
| 🔵 Muy bajo | CN < 55 |
| 🟦 Bajo | CN 55 – 70 |
| 🟡 Moderado | CN 70 – 80 |
| 🟠 Alto | CN 80 – 90 |
| 🔴 Muy alto | CN > 90 |

**Datos de entrada**

| Variable | Fuente | Resolución |
|----------|--------|-----------|
| Terreno (elevación y pendiente) | NASA NASADEM HGT V001 | 30 m |
| Suelo (arena, limo, arcilla) | ISRIC SoilGrids 2.0 | 250 m |
| Uso y cobertura de suelo | ESA WorldCover (v100 / v200) | 10 m |
| Límites administrativos | Provincias y comunas de Chile (*assets* propios) | vectorial |

**Cómo usarla**

1. Abre el script en el **Code Editor** de GEE y presiona **Run**.
2. **Paso 1** — selecciona la provincia y, si quieres, la comuna.
3. **Paso 2** — elige el año del uso de suelo y marca las capas de entrada.
4. Pulsa **`1. Analizar y Visualizar Capas Base`** y espera a que se procesen las capas (suelo, pendiente, uso de suelo).
5. Pulsa **`2. Analizar Potencial de Escorrentía (CN)`** para generar el mapa final.
6. Usa **`Generar Links de Descarga`** o **`Exportar a Google Drive`** para obtener los rásteres.

**Capas descargables:** texturas (arena, limo, arcilla), clase textural USDA, grupo hidrológico de suelo, elevación, pendiente (grados y %), clases de pendiente, uso de suelo (10 m y 30 m) y el mapa final de potencial de escorrentía.

---

### 2. Descargador de Imágenes Satelitales

> Utilidad práctica para obtener **datos listos para análisis** (*Analysis-Ready Data*) sobre cualquier provincia o comuna de Chile, con enmascaramiento de nubes y NDVI incluido.

**Características principales**

- 🛰️ **Elección de satélite** — **Sentinel-2** (10 m), **Landsat 9** y **Landsat 8** (30 m).
- 🔍 **Filtros personalizados** — rango de fechas y porcentaje máximo de nubosidad.
- 🧩 **Imagen única o mosaico** — la mejor imagen disponible (menor nubosidad y mayor cobertura del área) o un **mosaico mediano** del período.
- ☁️ **Enmascaramiento de nubes** — banda `SCL` en Sentinel-2 y `QA_PIXEL` en Landsat; reflectancia escalada a valores físicos.
- 🌿 **NDVI automático** — se calcula y agrega como banda adicional.
- ⬇️ **Descargas flexibles** — bandas individuales (Blue, Green, Red, NIR, NDVI) por enlace directo, o el *stack* completo exportado a Google Drive, listo para QGIS/ArcGIS.

**Datos de entrada**

| Colección | Producto |
|-----------|----------|
| `COPERNICUS/S2_SR_HARMONIZED` | Sentinel-2 MSI, Nivel-2A (reflectancia de superficie) |
| `LANDSAT/LC09/C02/T1_L2` | Landsat 9 Collection 2, Nivel-2 |
| `LANDSAT/LC08/C02/T1_L2` | Landsat 8 Collection 2, Nivel-2 |

**Cómo usarla**

1. Abre el script en el **Code Editor** de GEE y presiona **Run**.
2. Selecciona la provincia y, opcionalmente, la comuna.
3. Elige el satélite.
4. Define el rango de fechas y la nubosidad máxima.
5. Indica si quieres una **imagen única** o un **mosaico**.
6. Pulsa **`1. Analizar y Visualizar`** y luego usa los botones de descarga.

> [!TIP]
> Las imágenes de Sentinel-2 a 10 m pueden superar el límite de la descarga directa por enlace. En áreas grandes, usa **Landsat** o la **exportación a Google Drive**.

---

## 🚀 Instalación y ejecución

```text
1. Inicia sesión en Google Earth Engine   →  https://code.earthengine.google.com/
2. Copia el contenido completo de uno de los archivos .js de este repositorio
3. Pégalo en el Code Editor de GEE
4. Haz clic en "Run": la interfaz se carga en el panel lateral
5. Sigue las instrucciones de uso de cada aplicación
```

También puedes clonar el repositorio localmente para versionar tus cambios:

```bash
git clone https://github.com/lvsantarosa/gee-global-data-chile.git
```

> [!NOTE]
> Necesitas una cuenta de **Google Earth Engine** habilitada. Si prefieres no ejecutar el código, usa directamente las **apps web** enlazadas más arriba.

## 📂 Estructura del repositorio

```text
gee-global-data-chile/
├── MULTICRITERIO_GEE_Chile.js    # App 1 · Potencial de escorrentía (método CN)
├── DOWNLOAD_S2_L8_L9_Chile.js    # App 2 · Descarga de imágenes Sentinel-2 / Landsat 8-9
└── README.md
```

## ⚙️ Requisitos y notas técnicas

- **Cuenta GEE** activa y acceso al Code Editor.
- Los límites administrativos provienen de *assets* públicos del autor (`projects/ee-lucasviturisantarosa/assets/Provincias_CL` y `Comunas_CL`); si los reemplazas por tus propios *assets*, ajusta también los nombres de columna en el bloque `config` de cada script.
- Las exportaciones a Drive se crean como **tareas**: ábrelas en la pestaña **Tasks** del Code Editor y pulsa **RUN** para que se generen los archivos.
- Los resultados son **estimaciones basadas en datos globales**; para decisiones de ingeniería o gestión conviene validarlos con información local de campo.

## 📝 Cómo citar

> Santarosa, L. V. (2025). *GEE Global Data — Chile: herramientas de geoprocesamiento para el análisis territorial*. Laboratorio de Recursos Hídricos y Geotecnologías, Escuela de Agronomía, Pontificia Universidad Católica de Valparaíso. https://github.com/lvsantarosa/gee-global-data-chile

## 👤 Autoría y contacto

- **Autor:** Lucas Vituri Santarosa
- **Institución:** Laboratorio de Recursos Hídricos y Geotecnologías, Escuela de Agronomía, **Pontificia Universidad Católica de Valparaíso**
- Los scripts fueron desarrollados y refinados con la asistencia de la IA Gemini de Google.

¿Encontraste un error o tienes una sugerencia? Abre un *issue* o envía un *pull request*. ¡Las contribuciones son bienvenidas!
