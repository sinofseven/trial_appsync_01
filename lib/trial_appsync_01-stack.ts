import * as cdk from "aws-cdk-lib";
import * as AppSync from "aws-cdk-lib/aws-appsync";
import * as DynamoDB from "aws-cdk-lib/aws-dynamodb";
import * as SNS from "aws-cdk-lib/aws-sns";
import { Construct } from "constructs";
import path from "node:path";

// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class TrialAppsync01Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'TrialAppsync01Queue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });

    const api = new AppSync.GraphqlApi(this, "Api", {
      name: "TrialAppSync01",
      definition: AppSync.Definition.fromFile(
        path.join(__dirname, "schema.graphql"),
      ),
    });

    const tableModel = new DynamoDB.Table(this, "TableModel", {
      partitionKey: {
        name: "itemId",
        type: DynamoDB.AttributeType.STRING,
      },
    });

    const dsModel = api.addDynamoDbDataSource(
      "DataSourceTableModel",
      tableModel,
    );

    // CDKのサンプル通りにResolverを書いてみた (VTL Resolverができる)
    dsModel.createResolver("ResolverQueryGetModel", {
      typeName: "Query",
      fieldName: "getModel",
      requestMappingTemplate: AppSync.MappingTemplate.dynamoDbGetItem(
        "itemId",
        "itemId",
      ),
      responseMappingTemplate: AppSync.MappingTemplate.dynamoDbResultItem(),
    });

    // JS Resolverを試しに書いてみた
    dsModel.createResolver("ResolverQueryGetModelJS", {
      typeName: "Query",
      fieldName: "getModelJS",
      code: AppSync.Code.fromAsset(
        path.join(__dirname, "..", "dist/get_model_js.js"),
      ),
      runtime: AppSync.FunctionRuntime.JS_1_0_0,
    });

    // 子の型をできないか試したときのゴミ
    // できないということがわかった
    dsModel.createResolver("ResolverQueryGetModelSpec3", {
      typeName: "Query",
      fieldName: "getModelSpec3",
      requestMappingTemplate: AppSync.MappingTemplate.dynamoDbGetItem(
        "itemId",
        "$ctx.source.relId",
      ),
      responseMappingTemplate: AppSync.MappingTemplate.dynamoDbResultItem(),
    });

    // 子の型の値を参照するResolver (VTL Resolver)
    // VTLで簡易的に書いたものの、ちゃんと書こうと思うとちょっと複雑っぽい
    // どこが問題かと言うとrelIdがnullのときにエラーを返す
    dsModel.createResolver("ResolverModelRelModelVTL", {
      typeName: "Model",
      fieldName: "relModelVTL",
      requestMappingTemplate: AppSync.MappingTemplate.fromString(
        '{"version": "2017-02-28", "operation": "GetItem", "consistentRead": false, "key": {"itemId": $util.dynamodb.toDynamoDBJson($ctx.source.relId)}}',
      ),
      responseMappingTemplate: AppSync.MappingTemplate.dynamoDbResultItem(),
    });

    // 子の型の値を参照するResolver (JS Resolver)
    dsModel.createResolver("ResolverModelRelModelJS", {
      typeName: "Model",
      fieldName: "relModelJS",
      code: AppSync.Code.fromAsset(
        path.join(__dirname, "..", "dist/resolver_model_rel_model_js.js"),
      ),
      runtime: AppSync.FunctionRuntime.JS_1_0_0,
    });
  }
}
