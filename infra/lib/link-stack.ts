import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime, Code, Function } from 'aws-cdk-lib/aws-lambda';
import { RestApi, LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';
import path from 'node:path';

export class UrlShortenerStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const urlTable = new Table(this, "UrlTable", {
            partitionKey: { name: "shortCode", type: AttributeType.STRING },
            timeToLiveAttribute: "ttl",
            billingMode: BillingMode.PAY_PER_REQUEST,
            deletionProtection: true,
            tableName: "url-shortener-table"
        });

        const lambdaDefaults = {
            runtime: Runtime.NODEJS_24_X,
            code: Code.fromAsset(path.join(process.cwd(), 'dist')),
            environment: {
                TABLE_NAME: urlTable.tableName
            }
        }

        const createFunction = new Function(this, "CreateUrl", {
            ...lambdaDefaults,
            functionName: "create",
            handler: "handlers/create.handler"
        });

        const redirectFunction = new Function(this, "RedirectUrl", {
            ...lambdaDefaults,
            functionName: "redirect",
            handler: "handlers/redirect.handler"
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
    }
}