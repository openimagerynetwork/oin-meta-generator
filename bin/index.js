#!/usr/bin/env node

const fs = require('fs');

require('epipebomb')();
const yargs = require('yargs');

const GdalInfo = require('../lib/GdalInfo');

const argv = yargs.usage('Usage: $0 [args] <file>')
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
  .option('U', {
    alias: 'uploaded-at',
    describe: 'Date uploaded',
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

const filename = argv._[0];

let metadata = {
  uuid: argv.uuid,
  title: argv.title,
  platform: argv.platform,
  provider: argv.provider,
  contact: argv.contact,
  properties: (argv.additionalMetadata || []).reduce(function (obj, pair) {
    const parts = pair.split('=', 2);

    obj[parts[0]] = parts[1];

    return obj;
  }, {})
};

if (argv.acquisitionStart) {
  metadata.acquisition_start = new Date(argv.acquisitionStart);
}

if (argv.acquisitionEnd) {
  metadata.acquisition_end = new Date(argv.acquisitionEnd);
}

if (argv.uploadedAt) {
  metadata.uploaded_at = new Date(argv.uploadedAt);
}

// Filter out null values
metadata = Object.keys(metadata)
  .filter(function (k) {
    return metadata[k] != null;
  })
  .reduce(function (obj, k) {
    obj[k] = metadata[k];

    return obj;
  }, {});

const stats = fs.statSync(filename);
metadata.file_size = stats.size;

const imagery = new GdalInfo(filename);
metadata.projection = imagery.projectionAsWKT();
metadata.gsd = imagery.calculatePixelSize();
metadata.bbox = imagery.bboxAsArray();
metadata.footprint = imagery.bboxAsWKT();

process.stdout.write(JSON.stringify(metadata));
