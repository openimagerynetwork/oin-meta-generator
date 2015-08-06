'use strict';

require('envloader').load();

var path = require('path');
var fs = require('fs-extra');
var s3 = require('s3');
var gdalinfo = require('gdalinfo-json');
var _ = require('lodash');
var http = require('http');
var https = require('https');

/*
 *  You can set which file extensions to query
 */
var fileTypes = ['.TIF', '.tif', '.TIFF', '.tiff'];

// Make sure we have a config file
var config;
try {
  config = require('./config.json');
} catch (e) {
  console.error('Please provide a valid config.json file.');
  process.exit(1);
}

var meta_folder = process.env.META_FOLDER || 'meta';

var limitParallel = 20;

// Upping concurrency limit on Node <= 10
// https://github.com/openimagerynetwork/oin-meta-generator/issues/14
http.globalAgent.maxSockets = Math.max(http.globalAgent.maxSockets, 20);
https.globalAgent.maxSockets = Math.max(https.globalAgent.maxSockets, 20);

var client = s3.createClient({
  maxAsyncS3: 20,     // this is the default
  s3RetryCount: 3,    // this is the default
  s3RetryDelay: 1000, // this is the default
  multipartUploadThreshold: 20971520, // this is the default (20 MB)
  multipartUploadSize: 15728640, // this is the default (15 MB)
  s3Options: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Make sure we have valid credentials, either from env variables
// or from sources like $HOME/.aws/credentials or $HOME/.aws-credentials-master
if (client.s3.config.credentials === null) {
  console.error('Please provide valid credentials, either from environment ' +
    'variables or through sources like $HOME/.aws/credentials or ' +
    '$HOME/.aws-credentials-master');
  process.exit(1);
}

// If we're still alive, we have valid credentials
console.info('Successfully connected to S3 bucket, now retrieving data.');

var params = {
  s3Params: {
    Bucket: process.env.S3_BUCKET_NAME, /* required */
    Prefix: process.env.S3_BUCKET_PREFIX || ''
  }
};

var images = client.listObjects(params);

// Make sure meta directory exist
fs.mkdirsSync(meta_folder);

var totalMetaCount = 0;

function iterator (i, end, payload) {
  if (i < end) {
    // End interation if we're out of range
    // https://github.com/openimagerynetwork/oin-meta-generator/issues/4
    if (payload[i] === undefined) {
      return;
    }
    if (_.includes(fileTypes, path.extname(payload[i].Key))) {
      var url = s3.getPublicUrlHttp(params.s3Params.Bucket, payload[i].Key);
      var fileSize = payload[i].Size;
      generateMeta(url, fileSize, config.platform, config.provider, config.contact, config.acquisition_start, config.acquisition_end, config.properties, function (err, msg) {
        if (err) {
          console.error(err);
          return;
        }
        totalMetaCount++;
        process.stdout.write(totalMetaCount + ' - ' + msg + '\n');
      });
    }
    iterator(i + 1, end, payload);
  }
}

images.on('data', function (data) {
  var total = data.Contents.length;
  var chunks = Math.floor(total / limitParallel);

  var startIterator = function (start, chunks) {
    iterator(start, start + chunks, data.Contents);
  };

  for (var i = 0; i <= limitParallel; i++) {
    var start = chunks * i;
    // Add timeout so we don't hit magic rate limit?
    // https://github.com/openimagerynetwork/oin-meta-generator/issues/5
    setTimeout(startIterator.bind(null, start, chunks), 2 * 1000 * i);
  }
});

images.on('error', function (err) {
  console.error('Caught an Error:', err.stack);
});

var generateMeta = function (url, fileSize, platform, provider, contact, acquisition_start, acquisition_end, properties, callback) {

  var metadata = {
    uuid: null,
    title: null,
    projection: null,
    bbox: null,
    footprint: null,
    gsd: null,
    file_size: null,
    acquisition_start: acquisition_start,
    acquisition_end: acquisition_end,
    platform: platform,
    provider: provider,
    contact: contact,
    properties: _.cloneDeep(properties)
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
    metadata.gsd = _.sum(oin.pixel_size.map(Math.abs)) / 2;
    metadata.file_size = fileSize;
    metadata.properties.thumbnail =
      path.parse(oin.url).dir + path.sep +
      config.properties.thumbnail.replace('{{IMAGE_NAME}}', path.basename(oin.url, '.tiff'));

    /*
     * Here you can overwrite any values based on your custom imagery.
     *
     * For example, a date based on the filename:
     * metadata.aquisition_start = new Date(filename.substr(2, 6));
     *
     */

    /*
     * Below is an example of how to dynamically assign TMS urls.
     *
     * In this example, the tms property in the config.json looked like below:
     * http://a.tiles.mapbox.com/v4/{{MAP_ID}}/{z}/{x}/{y}.png?access_token=YOUR_ACCESS_TOKEN
     *
     * A simple string replace inserts the filename in place of the MAP_ID variable and you
     * could do the same for YOUR_ACCESS_TOKEN
     *
     */

    // Update TMS name
    // metadata.properties.tms = properties.tms.replace('{{MAP_ID}}', 'project.' + path.basename(filename, '.TIF'));

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
