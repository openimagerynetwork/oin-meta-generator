'use strict';

const mocha = require('mocha');
const describe = mocha.describe;
const it = mocha.it;
const expect = require('chai').expect;
const spawn = require('child_process');

const GdalInfo = require('../lib/GdalInfo');

describe('Getting GDAL info', function () {
  const metricImagery = new GdalInfo('test/fixtures/everest-utm.gtiff');

  describe('The Bounding Box', function () {
    it('should output the 4 corners', function () {
      expect(metricImagery.bboxAsArray()).to.deep.eq(
        [481235, 3084435, 504335, 3107535]
      );
    });

    it('should output the 4 corners as a WKT POLYGON()', function () {
      expect(metricImagery.bboxAsWKT()).to.eq(
        'POLYGON ((481235 3107535,504335 3107535,' +
        '504335 3084435,481235 3084435,481235 3107535))'
      );
    });
  });

  describe('Details for UTM (metric) projected imagery', function () {
    it('should generate the projection as a string', function () {
      const expected =
        'PROJCS["WGS 84 / UTM zone 45N",GEOGCS["WGS 84",DATUM["WGS_1984",' +
        'SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],' +
        'AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],' +
        'UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],' +
        'AUTHORITY["EPSG","4326"]],PROJECTION["Transverse_Mercator"],' +
        'PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",87],' +
        'PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],' +
        'PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],' +
        'AXIS["Easting",EAST],AXIS["Northing",NORTH],AUTHORITY["EPSG","32645"]]';
      expect(metricImagery.projectionAsWKT()).to.eq(expected);
    });

    it('should calculate the pixel size in metres', function () {
      expect(metricImagery.isImageryMetric()).to.eq(true);
      expect(metricImagery.calculatePixelSize()).to.eq(350);
    });
  });

  describe('Details for EPSG (non-metric) projected imagery', function () {
    const nonMetricImagery = new GdalInfo('test/fixtures/everest-epsg.gtiff');

    it('should generate the projection as a string', function () {
      const expected =
        'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,' +
        'AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0],' +
        'UNIT["degree",0.0174532925199433],AUTHORITY["EPSG","4326"]]';
      expect(nonMetricImagery.projectionAsWKT()).to.eq(expected);
    });

    it('should calculate the pixel size in metres', function () {
      expect(nonMetricImagery.isImageryMetric()).to.eq(false);
      // Why is this value so different from the UTM version?
      // The only difference is that this command was run on the file:
      // `gdalwarp -t_srs EPSG:4326`
      // One possibility is that internally we project to a AEQD with
      // origins centred on the imagery, not on the original UTM.
      expect(nonMetricImagery.calculatePixelSize()).to.eq(391.3147769745789);
    });
  });
});

describe('CLI usage', function () {
  it('should return the right JSON', function (done) {
    const command = `bin/index.js \
        -u "http://uuid.uuid" \
        -t "Natural Earth Image" \
        -a "2015-04-01T00:00:00.000Z" \
        -A "2015-04-30T00:00:00.000Z" \
        --platform "satellite" \
        --provider "Natural Earth" \
        -c "Ziggy,ziggy@bowie.net" \
        -m "sensor=Some Algorithm" \
        -m "thumbnail=http://thumbnail" \
        -m "license=CC-BY 4.0" \
        -m "tags=tropical, paradise" \
        test/fixtures/everest-utm.gtiff`;
    spawn.exec(command, function (_error, stdout, _stderr) {
      const result = JSON.parse(stdout);
      expect(result.uuid).to.eq('http://uuid.uuid');
      expect(result.title).to.eq('Natural Earth Image');
      expect(result.acquisition_start).to.eq('2015-04-01T00:00:00.000Z');
      expect(result.acquisition_end).to.eq('2015-04-30T00:00:00.000Z');
      expect(result.properties.sensor).to.eq('Some Algorithm');
      expect(result.projection).to.contain('WGS 84 / UTM zone 45N');
      expect(result.bbox).to.deep.eq([481235, 3084435, 504335, 3107535]);
      done();
    });
  });
});
