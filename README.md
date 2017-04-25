### Metadata Generator for OIN

The Open Imagery Network standardizes on a single format for imagery. This small CLI tool generates
a JSON string of the standard metadata for a given OIN geo image.

### Dependencies

You must have GDAL installed.

### Installation

- `$ npm install`

### Usage

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

### Testing
Run `npm test`
