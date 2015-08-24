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

The defaul setting runs 20 tasks in parallel. You can change the number by playing around with `var limitParallel = 20;` on line 13 of `index.js`

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

    
    
