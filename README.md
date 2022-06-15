# AWS Elemental MediaConvert Demo using a simple WebApp

version: 0.1 (WORK IN  PROGRESS) 

TODO: Improve instructions, provide CloudFormation templates, demo additional functionalities

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

## High-level instructions

### Create required IAM Roles

1. Create an IAM Role for MediaConvert service with the default permissions. Give it an identifiable name, for example: `MediaConvert-Role`.
1. Create an IAM Role for EventBridge (use Cloudwatch Events as the service) with defaults. Give it a name, for example: `EventInvokeLambda`.
1. Create IAM Roles for Lambda:
    - 1 for working with DynamoDB: `EventLambdaRole`
    - 1 for reading rights on S3 input bucket: `ListVideos-Role`*
    - 1 for read/write permissions on S3 output bucket: `MediaConvertLambda-Role`*
 
 * These can be combined in a single role for simplification, make sure to restrict access to only the buckets you need.
 
 ### Create S3 buckets
 
 1. Create a bucket to upload input files. Create a folder named `input` and another one named `thumbnails`.
 1. Create a bucket to host static website. Make sure to perform proper configurations and edit CORS configuration to allow all headers for GET and HEAD Methods:
```
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "HEAD"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": []
    }
]
``` 
We will be using this bucket for storing the output files as well.

1. On the input folder upload the videos you want to test.
1. On the S3 bucket that will host the static web site, upload the content from `static-website` folder to the root of the bucket.
1. On the input bucket, upload all the content on `sample-videos` to "input" folder and upload all the content on `sample-thumbnails` to the "thumbnails" folder.

### Create Cloudfront distribution
Create a new Cloudfront distribution that points to the S3 bucket hosting the static website, choose to Restrict access to the bucket and let Cloudfront apply the security policy for you.

Once the distribution is created, test that the static site is accessible through distribution's URL.


### Create the Event Control stack 
This is based on the following instructions from AWS Samples: https://github.com/aws-samples/aws-media-services-simple-vod-workflow/blob/master/8-MediaConvertEvents/README-tutorial.md

1. Create DynamoDB table following the provided instructions. Add a Secondary Index for JobId.
1. Create the Lambda function by following the provided instructions and uploading `mediaconvertdemo-eventcollector.zip`.
1. Create the EventBridge rule that will invoke the Lambda function created in previous step (it is pretty similar to the provided instructions for Cloudwatch Events) but just customize it to trigger only for 'COMPLETED' and 'ERROR' status.

Make sure to have all the proper roles and permissions in place.

### Create remaining Lambda Functions

#### ListVideos
1. Create a new Lambda function, assign the ListVideos-Role and name it `ListVideos` 
1. Scroll down to "Function code" choose Actions-> Upload a .zip file. Upload `mediaconvertdemo-listvideos.zip`
1. Add two Environment variables: BUCKET (insert your S3 bucket for input files) and PREFIX (insert `input/` as value)
1. Click on Deploy to save the function and perform a Test to validate it runs without errors. If there are errors, verify you had assigned the proper role permissions.

#### StartJob
Follow "Section 3: Create a Lambda Function for converting videos" from the following link:
https://github.com/aws-samples/aws-media-services-simple-vod-workflow/tree/master/7-MediaConvertJobLambda

On step 10, instead of uploading through the S3 URL, upload the provided zip file on this repository: `mediaconvertdemo-startjob.zip`

#### PollJob
1. Create a new Lambda function, assign the role with permissions for DynamoDB. Name it `PollJob`.
1. Scroll down to "Function code" choose Actions-> Upload a .zip file. Upload `mediaconvertdemo-polljob.zip`.
1. Add two Environment variables: CloudfrontDistribution (insert your Cloudfront distribution) and EventTable (insert the name of the DynamoDB table created earlier).
1. Click on Deploy to save the function.

### Create API gateway endpoint and resources:
1. Create a new API gateway endpoint - Choose REST API.
1. Create three resources: `/listvideos`, `/convert`, `poll` with a GET method for each.
1. For `/listvideos`, configure the method to invoke lambda function "ListVideos". Check "Use Lambda integration".
1. For  `/convert`, configure the method to invoke lambda function "StartJob". Add `key` as a String Query Parameters (do not mark it as required). Check "Use Lambda integration".
1. For  `/poll`, configure the method to invoke lambda function "PollJob". Add `jobId` as a String Query Parameters (do not mark it as required). Check "Use Lambda integration".
1. Make sure to enable CORS for any origin (*) on all the resources and GET methods.
1. Deploy API to a stage so you have it ready for use.

## Test web application
1. Edit functions.js and update the url global variables at the top with the corresponding API Gateway URLs from the previous section.  
1. Open the sample website, you should see 4 videos (if not, make sure to have uploaded all the contents from `sample-videos` and `sample-thumbnails` to `input/` and `thumbnails/` folders respectively).
1. Push the "Convert" button on any video and wait until receiving results. You should receive a working link to the transcoded video or an error message from MediaConvert. 
