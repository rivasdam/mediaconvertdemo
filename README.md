# mediaconvertdemo
AWS Elemental MediaConvert Demo using a simple WebApp

version:0.1 

This is a serverless web application demo for transcoding videos on-demand through a simple frontend.

Services used: Lambda, S3, Cloudfront, API Gateway, DynamoDB, EventBridge and MediaConvert 

## Architecture Overview

![WarnerMediaConvertDemo](https://user-images.githubusercontent.com/73705375/102809306-83344000-43a0-11eb-9e13-ca9133fe6378.png)


Users access a website hosted in Amazon S3 running behind Amazon Cloudfront distribution to convert/transcode videos previously uploaded to S3 on demand.

### High-level flow:
1. On loading, the website invokes /listvideos API to obtain the list of uploaded videos in a S3 bucket and display them for user selection
2. The user triggers the conversion process through /convert API call to initiate a MediaConvert job with pre-defined parameters
3. EventBridge monitors MediaConvert job status changes and if the job finishes (with or without errors) it registers information on a DynamoDB table. Output files (transcoded videos) are stored in a S3 bucket.
4. A polling function is triggered and executes at certain intervals to see if the job has finished and if it did, returns the transcoded video URL or an error message if it failed.

