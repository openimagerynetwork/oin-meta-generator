
require("envloader").load();

var fs = require('fs-extra');
var s3 = require('s3');
var gdalinfo = require('gdalinfo-json');
var _ = require('lodash');
var config = require('./config.json');

var client = s3.createClient({
  maxAsyncS3: 20,     // this is the default
  s3RetryCount: 3,    // this is the default
  s3RetryDelay: 1000, // this is the default
  multipartUploadThreshold: 20971520, // this is the default (20 MB)
  multipartUploadSize: 15728640, // this is the default (15 MB)
  s3Options: {
    accessKeyId: process.env.AWS_SECRET_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

var params = {
  s3Params: {
    Bucket: process.env.S3_BUCKET_NAME, /* required */
  },
};

var images = client.listObjects(params);

//Make sure meta directory exist
fs.mkdirsSync('meta');

images.on('data', function(data){

  for (i = 1; i < data.Contents.length; i++) {
    var url = s3.getPublicUrlHttp(params.s3Params.Bucket, data.Contents[i].Key);
    generateMeta(url, config.platform, config.provider, config.contact, function(msg){
      console.log(msg);
    });
  }

});

var generateMeta = function(url, platform, provider, contact, callback) {
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
    properties: {}
  }

  gdalinfo.remote(url, function(err, oin) {
    if (err) {
      callback(err);
      return;
    }
    var filename = oin.url.split('/');
    var filename = filename[filename.length - 1];

    metadata.uuid = oin.url;
    metadata.title = filename;
    metadata.projection = oin.srs;
    metadata.gsd = _.sum(oin.pixel_size.map(Math.abs)) / 2 / 100;

    var x = [];
    var y = [];
    var footprint = [];

    for (key in oin.corners_lon_lat) {
      x.push(oin.corners_lon_lat[key][0]);
      y.push(oin.corners_lon_lat[key][1]);
      footprint.push(oin.corners_lon_lat[key][0] + ' ' + oin.corners_lon_lat[key][1]);
    }

    metadata.bbox = [_.min(x), _.min(y), _.max(x), _.max(y)];
    metadata.footprint = 'POLYGON((' + footprint.join() + '))';

    fs.writeFile('meta/' + filename + '_meta.json', JSON.stringify(metadata), function(err) {
        if(err) {
            callback(err);
            return;
        }

        callback('The file saved!: ' + filename + '_meta.json');
    });
  });
}
