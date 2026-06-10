import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RestApi, LambdaIntegration, EndpointType, SecurityPolicy } from 'aws-cdk-lib/aws-apigateway';
import path from 'node:path';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';

export interface UrlShortenerStackProps extends cdk.StackProps {
    domainName: string;
}

export class UrlShortenerStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: UrlShortenerStackProps) {
        super(scope, id, props);

        const { domainName } = props;

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
            entry: path.join(process.cwd(), 'src/handlers/create.ts'),
            environment: {
                ...lambdaDefaults.environment,
                BASE_URL: `https://${domainName}`
            }
        });

        const redirectFunction = new NodejsFunction(this, 'RedirectUrl', {
            ...lambdaDefaults,
            functionName: 'redirect',
            entry: path.join(process.cwd(), 'src/handlers/redirect.ts')
        });

        const frontendFunction = new NodejsFunction(this, 'Frontend', {
            runtime: Runtime.NODEJS_24_X,
            timeout: cdk.Duration.seconds(10),
            functionName: 'frontend',
            entry: path.join(process.cwd(), 'src/handlers/frontend.ts')
        });

        urlTable.grantWriteData(createFunction);
        urlTable.grantReadData(redirectFunction);

        const api = new RestApi(this, 'UrlShortenerApi', {
            restApiName: 'URL Shortener',
            deployOptions: {
                methodOptions: {
                    // Tightly bound the unauthenticated write path...
                    '/urls/POST': { throttlingRateLimit: 2, throttlingBurstLimit: 5 },
                    // ...while leaving reads (redirects, frontend) roomy.
                    '/*/*': { throttlingRateLimit: 20, throttlingBurstLimit: 40 },
                },
            },
        });

        api.root.addMethod('GET', new LambdaIntegration(frontendFunction));

        api.root.addResource('urls')
            .addMethod('POST', new LambdaIntegration(createFunction));

        api.root.addResource('{shortCode}')
            .addMethod('GET', new LambdaIntegration(redirectFunction));

        const cert = new Certificate(this, 'Certificate', {
            domainName,
            certificateName: 'Link',
            validation: CertificateValidation.fromDns()
        });

        api.addDomainName('CustomDomain', {
            domainName,
            certificate: cert,
            endpointType: EndpointType.REGIONAL,
            securityPolicy: SecurityPolicy.TLS_1_2,
        });
    }
}
