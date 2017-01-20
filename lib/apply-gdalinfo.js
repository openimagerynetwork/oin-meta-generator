'use strict';

var _ = require('lodash');

/**
 * Applies the data obtained from gdalinfo to OIN-conformant metadata
 */
module.exports = function applyGdalInfo (metadata, gdalinfo) {

    metadata.uuid = metadata.uuid || gdalinfo.url;
    metadata.projection = gdalinfo.srs;
    metadata.gsd = _.sum(gdalinfo.pixel_size.map(Math.abs)) / 2;

    var x = [];
    var y = [];
    var footprint = [null, null, null, null, null];

    for (var key in gdalinfo.corners_lon_lat) {
      if (gdalinfo.corners_lon_lat.hasOwnProperty(key)) {
        x.push(gdalinfo.corners_lon_lat[key][0]);
        y.push(gdalinfo.corners_lon_lat[key][1]);
        if (key === 'upper_left') {
          footprint[0] = gdalinfo.corners_lon_lat[key][0] + ' ' + gdalinfo.corners_lon_lat[key][1];
          footprint[4] = gdalinfo.corners_lon_lat[key][0] + ' ' + gdalinfo.corners_lon_lat[key][1];
        }

        if (key === 'upper_right') {
          footprint[1] = gdalinfo.corners_lon_lat[key][0] + ' ' + gdalinfo.corners_lon_lat[key][1];
        }

        if (key === 'lower_right') {
          footprint[2] = gdalinfo.corners_lon_lat[key][0] + ' ' + gdalinfo.corners_lon_lat[key][1];
        }

        if (key === 'lower_left') {
          footprint[3] = gdalinfo.corners_lon_lat[key][0] + ' ' + gdalinfo.corners_lon_lat[key][1];
        }
      }
    }

    metadata.bbox = [_.min(x), _.min(y), _.max(x), _.max(y)];
    metadata.footprint = 'POLYGON((' + footprint.join() + '))';
};
