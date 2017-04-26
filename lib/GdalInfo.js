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

  envelope () {
    let envelope = new gdal.Envelope({
      minX: this.westernExtreme,
      minY: this.southernExtreme,
      maxX: this.easternExtreme,
      maxY: this.northernExtreme
    });

    // TODO: Converting to a CRS different from that specified in `projection` may
    // not be appropriate to the specfication.
    // Follow: https://github.com/openimagerynetwork/oin-meta-generator/issues/26
    if (this.isImageryMetric()) {
      const epsg4326 = gdal.SpatialReference.fromEPSG(4326);
      const metricToEPSG = new gdal.CoordinateTransformation(this.src.srs, epsg4326);
      envelope = envelope.toPolygon();
      envelope.transform(metricToEPSG);
      envelope = envelope.getEnvelope();
    }

    return envelope;
  }

  bboxAsWKT () {
    return this.envelope().toPolygon().toWKT();
  }

  bboxAsArray () {
    const envelope = this.envelope();
    return [
      envelope.minX,
      envelope.minY,
      envelope.maxX,
      envelope.maxY
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
