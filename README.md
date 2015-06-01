### Metadata Generator for OIN

This node app reads objects from a S3 bucket and generates metadata json files based on OIN metadata standard.

### Dependencies

You must have GDAL installed.

### Setup

- `$ npm install`
- Copy the `.env-sample` file to `.env` and edit with your own values.
- Copy the `config-sample.json` file to `config.json` and edit with your own values.


### Usage

    $ npm start

The defaul setting runs 20 tasks in parallel. You can change the number by playing around with `var limitParallel = 20;` on line 13 of `index.js`
