# Geoprocessing Tools for Territorial Analysis in Chile

This repository contains a set of scripts for Google Earth Engine (GEE) developed to facilitate the analysis of water, agricultural, and environmental resources within the territorial context of Chile. The tools are designed to be interactive and accessible, allowing users with varying levels of geoprocessing experience to generate and download complex data intuitively.

## Available Scripts
Currently, the repository includes two main applications:
1.  **Runoff Potential Analyzer:** An advanced tool for hydrological modeling.
2.  **Satellite Image Downloader:** A utility for searching and downloading Sentinel-2 and Landsat 8/9 imagery.

### 1. [Runoff Potential Analyzer](https://lucasviturisantarosa.users.earthengine.app/view/multicritrio-escorrentia-scs) 
This application performs a multi-criteria analysis to estimate surface runoff potential using a robust adaptation of the SCS/NRCS Curve Number (CN) method. It is an ideal tool for territorial planning, watershed management, risk analysis, and agronomic studies.

#### Key Features:
* **Flexible Area Selection:** Allows for analysis by selecting Provinces and Communes of Chile.
* **Configurable Land Use Data:** Offers the option to choose between ESA WorldCover land use data for the years 2020 or 2021.
* **Detailed Soil Classification:** Implements a robust classifier that first determines one of the 12 USDA textural classes for each pixel and then maps it to one of the 4 Hydrologic Soil Groups (HSG).
* **Advanced Terrain Processing:** Applies a "fill" filter to the Digital Elevation Model (DEM) to correct for imperfections before calculating slope percentage and reclassifying it into 7 relief categories.
* **Referenced Runoff Model:** Calculates the base CN from the Soil-Land Use interaction and adjusts it using a continuous, scientifically-validated formula (adapted from the SWAT model) to incorporate the effect of the slope.
* **Comprehensive Visualization:** Displays all base and intermediate layers (Slope Classes, Soil Groups, etc.) on the map, allowing for a complete visual assessment of the model.
* **Consolidated Download Options:** Allows for the download of all generated layers (base, intermediate, and the final runoff map) through direct links or by exporting to Google Drive.

#### Data Used:
* **Terrain:** NASA NASADEM HGT V001 (30m)
* **Soil:** ISRIC SoilGrids 2.0 (250m)
* **Land Use/Cover:** ESA WorldCover (10m)

#### How to Use:
1.  Open the script in the Google Earth Engine Code Editor.
2.  Select the Province and, optionally, the Commune of interest.
3.  In "Step 2", select the desired year for the land use data.
4.  Click the **"1. Analizar y Visualizar Capas Base"** button. Wait for all input layers (Soil Group, Slope Classes, etc.) to be processed and displayed on the map.
5.  Click the **"2. Analizar Potencial de Escorrentía (CN)"** button to generate the final map.
6.  Use the download buttons to obtain all generated data.

### 2. [Satellite Image Downloader](https://lucasviturisantarosa.users.earthengine.app/view/download-imagenes-satelitales) 

This application is a practical utility designed for agronomists, researchers, and students to easily obtain Analysis-Ready Data from satellite imagery.

#### Key Features:
* **Satellite Selection:** Allows choosing between **Sentinel-2**, **Landsat 9**, and **Landsat 8** imagery.
* **Custom Filters:** Enables filtering of images by date range and maximum cloud cover percentage.
* **Single Image or Mosaic:** Provides the option to select the single best image (least cloudy, highest area coverage) or to create a median mosaic from all available images in the period.
* **Automatic NDVI Calculation:** The application automatically generates and includes the Normalized Difference Vegetation Index (NDVI) band.
* **Flexible Downloads:** Allows for the download of individual bands (Blue, Green, Red, NIR, and NDVI) via direct links, or the export of a complete image stack to Google Drive, ready for use in GIS software like QGIS or ArcGIS.

#### Data Used:
* Copernicus Sentinel-2 SR MSI, Level-2A
* Landsat 8/9 Collection 2, Level-2

#### How to Use:
1.  Open the script in the Google Earth Engine Code Editor.
2.  Select the Province and, optionally, the Commune.
3.  Select the desired satellite.
4.  Define the date range and maximum cloud cover.
5.  Choose whether you want a single image or a mosaic.
6.  Click **"1. Analizar y Visualizar"**.
7.  After visualization, use the download buttons to get the data.

### How to Install and Run the Scripts
1.  Log in to your [Google Earth Engine](https://code.earthengine.google.com/) account.
2.  Copy the entire content of one of the `.js` files from this repository.
3.  Paste the code into the GEE Code Editor.
4.  Click **"Run"** to load the application interface in the side panel.
5.  Follow the "How to Use" instructions for each application.

### Author
* **Author:** Lucas Vituri Santarosa
* **Institution:** Laboratorio de Recursos Hídricos y Geotecnologías, Escuela de Agronomía, Pontificia Universidad Católica de Valparaíso.
* This script was developed and refined with the assistance of Google's Gemini AI.
