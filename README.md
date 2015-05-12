### Metadata Generator for OIN

This node app reads objects from a S3 bucket and generates metadata json files based on OIN metadata standard.

### Dependencies

You must have GDAL installed.

### Setup

    $ npm install

Create a `.env` file like below example:

```bash
AWS_SECRET_KEY_ID=SOMEID
AWS_SECRET_ACCESS_KEY=SOMESECRET
S3_BUCKET_NAME=SOMEBUCKET
```

### Usage

    $ node index.js
