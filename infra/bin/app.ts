import * as cdk from 'aws-cdk-lib';
import { UrlShortenerStack } from '../lib/link-stack';

const app = new cdk.App();

new UrlShortenerStack(app, 'UrlShortenerStack', {
    domainName: 'link.samsteele.co.uk',
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    }
})