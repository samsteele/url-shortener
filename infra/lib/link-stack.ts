import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RestApi, LambdaIntegration, UsagePlan, EndpointType, SecurityPolicy } from 'aws-cdk-lib/aws-apigateway';
import path from 'node:path';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';

export class UrlShortenerStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const subdomain: string = 'link.samsteele.co.uk';

        const urlTable = new Table(this, 'UrlTable', {
            partitionKey: { name: 'shortCode', type: AttributeType.STRING },
            timeToLiveAttribute: 'ttl',
            billingMode: BillingMode.PAY_PER_REQUEST,
            deletionProtection: true,
            tableName: 'url-shortener-table'
        });

        const lambdaDefaults = {
            runtime: Runtime.NODEJS_24_X,
            timeout: cdk.Duration.seconds(10),
            environment: {
                TABLE_NAME: urlTable.tableName
            }
        }

        const createFunction = new NodejsFunction(this, 'CreateUrl', {
            ...lambdaDefaults,
            functionName: 'create',
            entry: path.join(process.cwd(), 'src/handlers/create.ts')
        });

        const redirectFunction = new NodejsFunction(this, 'RedirectUrl', {
            ...lambdaDefaults,
            functionName: 'redirect',
            entry: path.join(process.cwd(), 'src/handlers/redirect.ts')
        });

        urlTable.grantWriteData(createFunction);
        urlTable.grantReadData(redirectFunction);

        const api = new RestApi(this, 'UrlShortenerApi', {
            restApiName: 'URL Shortener',
        });

        api.root.addResource('urls')
            .addMethod('POST', new LambdaIntegration(createFunction));

        api.root.addResource('{shortCode}')
            .addMethod('GET', new LambdaIntegration(redirectFunction));

        const usagePlan = new UsagePlan(this, 'UsagePlan', {
            throttle: {
                rateLimit: 10,
                burstLimit: 20,
            },
        });

        usagePlan.addApiStage({ stage: api.deploymentStage });

        const cert = new Certificate(this, 'Certificate', {
            domainName: subdomain,
            certificateName: 'Link',
            validation: CertificateValidation.fromDns()
        });

        api.addDomainName('CustomDomain', {
            domainName: subdomain,
            certificate: cert,
            endpointType: EndpointType.REGIONAL,
            securityPolicy: SecurityPolicy.TLS_1_2,
        });
    }
}