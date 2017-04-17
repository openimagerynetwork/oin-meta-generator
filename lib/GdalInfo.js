'use strict';

const gdal = require('gdal');

class GdalInfo {
  constructor (filename) {
    this.src = gdal.open(filename);
    this.defineBasicDetails();
  }

  defineBasicDetails () {
    const gt = this.src.geoTransform;
    this.horizontalPixelCount = this.src.rasterSize.x;
    this.verticalPixelCount = this.src.rasterSize.y;
    this.horizontalPixelSize = gt[1];
    this.verticalPixelSize = gt[5];
    this.westernExtreme = gt[0];
    this.northernExtreme = gt[3];
    this.easternExtreme = this.westernExtreme + (this.horizontalPixelSize * this.horizontalPixelCount);
    this.southernExtreme = this.northernExtreme + (this.verticalPixelSize * this.verticalPixelCount);
    this.centreX = (this.easternExtreme - this.westernExtreme) / 2;
    this.centreY = (this.northernExtreme - this.southernExtreme) / 2;
  }

  isImageryMetric () {
    return this.src.srs.getLinearUnits().units === 'metre';
  }

  projectionAsWKT () {
    return this.src.srs.toWKT();
  }

  bboxAsWKT () {
    const ul = new gdal.Point(this.westernExtreme, this.northernExtreme);
    const ur = new gdal.Point(this.easternExtreme, this.northernExtreme);
    const lr = new gdal.Point(this.easternExtreme, this.southernExtreme);
    const ll = new gdal.Point(this.westernExtreme, this.southernExtreme);
    let extent = new gdal.Polygon();
    let ring = new gdal.LinearRing();
    ring.points.add([ul, ur, lr, ll, ul]);
    extent.rings.add(ring);
    return extent.toWKT();
  }

  bboxAsArray () {
    return [
      this.westernExtreme,
      this.southernExtreme,
      this.easternExtreme,
      this.northernExtreme
    ];
  }

  // Measure the entire imagery diagonally both in length and in number
  // of pixels. This incorporates both the horizontal and vertical
  // pixel sizes of the greatest distance to get the best average.
  calculatePixelSize () {
    let diagonal = new gdal.LineString();
    diagonal.points.add(this.westernExtreme, this.northernExtreme);
    diagonal.points.add(this.easternExtreme, this.southernExtreme);
    if (!this.isImageryMetric()) {
      diagonal = this.convertLineToMetricProjection(diagonal);
    }
    const pixelsAlongDiagonal = Math.sqrt(
      (this.horizontalPixelCount * this.horizontalPixelCount) +
      (this.verticalPixelCount * this.verticalPixelCount)
    );
    const pixelSize = diagonal.getLength() / pixelsAlongDiagonal;
    return pixelSize;
  }

  convertLineToMetricProjection (linestring) {
    // Create an imagery-specific metric projection
    const proj4Definition =
      `+proj=laea +lat_0=${this.centreY} +lon_0=${this.centreX} +ellps=WGS84 +units=m +no_defs`;
    let metricDiagonal = linestring.clone();
    const metricProjection = gdal.SpatialReference.fromProj4(proj4Definition);
    const originalToMetric = new gdal.CoordinateTransformation(this.src.srs, metricProjection);
    metricDiagonal.transform(originalToMetric);
    return metricDiagonal;
  }
}

module.exports = GdalInfo;
