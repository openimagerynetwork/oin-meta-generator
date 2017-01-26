### Metadata Generator for OIN

This node app reads objects from a S3 bucket and generates metadata json files based on OIN metadata standard.

### Dependencies

You must have GDAL installed.

### Setup

- `$ npm install`
- Copy the `.env-sample` file to `.env` and edit with your own values or set via a source like `$HOME/.aws/credentials`.
- Copy the `config-sample.json` file to `config.json` and edit with your own values.


### Usage

    $ npm start

The default setting runs 20 tasks in parallel. You can change the number by playing around with `var limitParallel = 20;` on line 13 of `index.js`

#### Command Line

Metadata may also be generated for individual files by running the command line tool. If installed via `npm install`, it will be available as `node_modules/.bin/oin-meta-generator`, otherwise `bin/index.js`.

```
Usage: oin-meta-generator [args] <file>

Options:
  -u, --uuid                 Source UUID
  -t, --title                Source title
  -a, --acquisition-start    Acquisition start date
  -A, --acquisition-end      Acquisition end date
  -p, --provider             Provider / owner
  -P, --platform             Imagery platform (satellite, aircraft, UAV, etc.)
  -c, --contact              Data provider contact info
  -U, --uploaded-at          Date uploaded
  -m, --additional-metadata  Additional metadata (sensor=WV3, etc.)
  --help, -h                 Show help                                 [boolean]
  --version, -V              Show version number                       [boolean]
```

Sample:

```bash
$ oin-meta-generator \
  -u "http://oam-uploader.s3.amazonaws.com/uploads/2015-08-18/55d3b052f885a1bb0221434b/scene/0/scene-0-image-0-NE1_50M_SR.tif" \
   -t "Natural Earth Image" \
   -a "2015-04-01T00:00:00.000Z" \
   -A "2015-04-30T00:00:00.000Z" \
   --platform "satellite" \
   --provider "Natural Earth" \
   -c "Ziggy,ziggy@bowie.net" \
   -m "sensor=Some Algorithm" \
   -m "thumbnail=http://oam-uploader.s3.amazonaws.com/uploads/2015-08-18/55d3b052f885a1bb0221434b/scene/0/scene-0-image-0-NE1_50M_SR.tif.thumb.png" \
   -m "license=CC-BY 4.0" \
   -m "tags=tropical, paradise" \
    NE1_50M_SR.tif | jq .
{
  "uuid": "http://oam-uploader.s3.amazonaws.com/uploads/2015-08-18/55d3b052f885a1bb0221434b/scene/0/scene-0-image-0-NE1_50M_SR.tif",
  "title": "Natural Earth Image",
  "platform": "satellite",
  "provider": "Natural Earth",
  "contact": "Ziggy,ziggy@bowie.net",
  "properties": {
    "sensor": "Some Algorithm",
    "thumbnail": "http://oam-uploader.s3.amazonaws.com/uploads/2015-08-18/55d3b052f885a1bb0221434b/scene/0/scene-0-image-0-NE1_50M_SR.tif.thumb.png",
    "license": "CC-BY 4.0",
    "tags": "tropical, paradise"
  },
  "acquisition_start": "2015-04-01T00:00:00.000Z",
  "acquisition_end": "2015-04-30T00:00:00.000Z",
  "file_size": 1149210,
  "projection": "GEOGCS[\"WGS 84\",DATUM[\"WGS_1984\",SPHEROID[\"WGS 84\",6378137,298.257223563,AUTHORITY[\"EPSG\",\"7030\"]],AUTHORITY[\"EPSG\",\"6326\"]],PRIMEM[\"Greenwich\",0],UNIT[\"degree\",0.0174532925199433],AUTHORITY[\"EPSG\",\"4326\"]]",
  "gsd": 0.03333333333333333,
  "bbox": [
    128.99999999999997,
    29.000000000000004,
    146,
    54
  ],
  "footprint": "POLYGON((128.99999999999997 54,146 54,146 29.000000000000004,128.99999999999997 29.000000000000004,128.99999999999997 54))"
}
```


### Expected Output

If you've provided a `config.json` and have provided AWS credentials, you should see a successful connection message. At this point, the app will be querying all the data files in the bucket and generating metadata for each matching file. When it finds a matching file and creates the metadata, you will see something like below in the terminal

`1 - The file saved!: 339.tiff_meta.json`

Output data is saved to the `meta` directory by default (changeable) and will look similar to

```json
{
  "uuid": "http://bucket.s3.amazonaws.com/4326/srtm_01_02.tiff",
  "title": "srtm_01_02.tiff",
  "projection": "GEOGCS[\"WGS84\",DATUM[\"WGS_1984\",SPHEROID[\"WGS84\",6378137,298.257223563,AUTHORITY[\"EPSG\",\"7030\"]],AUTHORITY[\"EPSG\",\"6326\"]],PRIMEM[\"Greenwich\",0],UNIT[\"degree\",0.0174532925199433],AUTHORITY[\"EPSG\",\"4326\"]]",
  "bbox": [
    -180.00041666666667,
    49.999583333333334,
    -174.99958333333333,
    55.000416666666666
  ],
  "footprint": "POLYGON((-180.00041666666667 55.000416666666666,-174.99958333333333 55.000416666666666,-174.99958333333333 49.999583333333334,-180.00041666666667 49.999583333333334,-180.00041666666667 55.000416666666666))",
  "gsd": 0.000833333333333,
  "file_size": 953117,
  "acquisition_start":"2015-03-02T00:00:00.000",
  "acquisition_end":"2015-03-03T00:00:00.000",
  "platform": "satellite",
  "provider": "some satellite company",
  "contact": "someone@satellitecompany.com",
  "properties": {
    "thumbnail": "link to thumbnail if available",
    "tms": "link to TMS if available",
    "sensor": "name of satellite"
  }
}
```
