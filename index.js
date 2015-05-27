'use strict';

require('envloader').load();

var fs = require('fs-extra');
var s3 = require('s3');
var gdalinfo = require('gdalinfo-json');
var _ = require('lodash');
var config = require('./config.json');

var meta_folder = process.env.META_FOLDER || 'meta';

var limitParallel = 20;

var client = s3.createClient({
  maxAsyncS3: 20,     // this is the default
  s3RetryCount: 3,    // this is the default
  s3RetryDelay: 1000, // this is the default
  multipartUploadThreshold: 20971520, // this is the default (20 MB)
  multipartUploadSize: 15728640, // this is the default (15 MB)
  s3Options: {
    accessKeyId: process.env.AWS_SECRET_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

var params = {
  s3Params: {
    Bucket: process.env.S3_BUCKET_NAME /* required */
  }
};

var images = client.listObjects(params);

// Make sure meta directory exist
fs.mkdirsSync(meta_folder);

var totalMetaCount = 0;

function iterator (i, end, payload) {
  if (i < end) {
    var f = payload[i].Key.split('.');
    if (f[f.length - 1].toUpperCase() === 'TIF'){
      var url = s3.getPublicUrlHttp(params.s3Params.Bucket, payload[i].Key);
      generateMeta(url, config.platform, config.provider, config.contact, config.properties, function (err, msg) {
        if (err) {
          console.log(err);
          return;
        }
        console.log(msg);
        totalMetaCount++;
        iterator(i + 1, end, payload);
      });
    }
  } else {
    console.log(totalMetaCount + 'meta files were generated.');
  }
}

images.on('data', function (data) {
  var total = data.Contents.length;
  var chunks = Math.floor(total / limitParallel);

  for (var i = 0; i < limitParallel; i++) {
    var start = chunks * i;
    iterator(start, start + chunks, data.Contents);
  }
});

var generateMeta = function (url, platform, provider, contact, properties, callback) {
  var metadata = {
    uuid: null,
    title: null,
    projection: null,
    bbox: null,
    footprint: null,
    gsd: null,
    file_size: null,
    acquisition_start: null,
    acquisition_end: null,
    platform: platform,
    provider: provider,
    contact: contact,
    properties: properties
  };

  gdalinfo.remote(url, function (err, oin) {
    if (err) {
      callback(err);
      return;
    }

    var filename = oin.url.split('/');
    filename = filename[filename.length - 1];

    metadata.uuid = oin.url;
    metadata.title = filename;
    metadata.projection = oin.srs;
    metadata.gsd = _.sum(oin.pixel_size.map(Math.abs)) / 2 / 100;
    metadata.properties.thumbnail = oin.url + '.thumb.jpg'

    var x = [];
    var y = [];
    var footprint = [null, null, null, null, null];

    for (var key in oin.corners_lon_lat) {
      if (oin.corners_lon_lat.hasOwnProperty(key)) {
        x.push(oin.corners_lon_lat[key][0]);
        y.push(oin.corners_lon_lat[key][1]);
        if (key === 'upper_left') {
          footprint[0] = oin.corners_lon_lat[key][0] + ' ' + oin.corners_lon_lat[key][1];
          footprint[4] = oin.corners_lon_lat[key][0] + ' ' + oin.corners_lon_lat[key][1];
        }

        if (key === 'upper_right') {
          footprint[1] = oin.corners_lon_lat[key][0] + ' ' + oin.corners_lon_lat[key][1];
        }

        if (key === 'lower_right') {
          footprint[2] = oin.corners_lon_lat[key][0] + ' ' + oin.corners_lon_lat[key][1];
        }

        if (key === 'lower_left') {
          footprint[3] = oin.corners_lon_lat[key][0] + ' ' + oin.corners_lon_lat[key][1];
        }
      }
    }

    metadata.bbox = [_.min(x), _.min(y), _.max(x), _.max(y)];
    metadata.footprint = 'POLYGON((' + footprint.join() + '))';

    fs.writeFile(meta_folder + '/' + filename + '_meta.json', JSON.stringify(metadata), function (err) {
      if (err) {
        callback(err);
        return;
      }

      callback(err, 'The file saved!: ' + filename + '_meta.json');
    });
  });
};
