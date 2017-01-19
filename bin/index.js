#!/usr/bin/env node

var fs = require('fs');

var gdalinfo = require('gdalinfo-json');
var yargs = require('yargs');

var applyGdalinfo = require('../lib/apply-gdalinfo');

var argv = yargs.usage('Usage: $0 [args] <file>')
  .option('u', {
    alias: 'uuid',
    describe: 'Source UUID',
    requiresArg: true
  })
  .option('t', {
    alias: 'title',
    describe: 'Source title',
    requiresArg: true
  })
  .option('a', {
    alias: 'acquisition-start',
    describe: 'Acquisition start date',
    requiresArg: true
  })
  .option('A', {
    alias: 'acquisition-end',
    describe: 'Acquisition end date',
    requiresArg: true
  })
  .option('p', {
    alias: 'provider',
    describe: 'Provider / owner',
    requiresArg: true
  })
  .option('P', {
    alias: 'platform',
    describe: 'Imagery platform (satellite, aircraft, UAV, etc.)',
    requiresArg: true
  })
  .option('c', {
    alias: 'contact',
    describe: 'Data provider contact info',
    requiresArg: true
  })
  .option('m', {
    alias: 'additional-metadata',
    describe: 'Additional metadata (sensor=WV3, etc.)',
    requiresArg: true
  })
  .alias({
    help: 'h',
    version: 'V'
  })
  .demandCommand(1, 1, 'A file must be provided', 'Only one file may be provided')
  .help()
  .strict()
  .version()
  .argv;

var filename = argv._[0];

var metadata = {
  uuid: argv.uuid,
  title: argv.title,
  acquisition_start: new Date(argv.acquisitionStart) || null,
  acquisition_end: new Date(argv.acquisitionEnd) || null,
  platform: argv.platform,
  provider: argv.provider,
  contact: argv.contact,
  properties: argv.additionalMetadata.reduce(function (obj, pair) {
    var parts = pair.split("=", 2);

    obj[parts[0]] = parts[1];

    return obj;
  }, {})
};

// filter out null values
metadata = Object.keys(metadata)
  .filter(function (k) {
    return metadata[k] != null;
  })
  .reduce(function (obj, k) {
    obj[k] = metadata[k];

    return obj;
  }, {});

var stats = fs.statSync(filename);
metadata.file_size = stats.size;

gdalinfo.local(filename, function (err, oin) {
  if (err) {
    throw err;
  }

  applyGdalinfo(metadata, oin);

  process.stdout.write(JSON.stringify(metadata));
});
