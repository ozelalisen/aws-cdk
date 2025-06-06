// disabling update workflow because we don't want to include the assets in the snapshot
// python bundling changes the asset hash pretty frequently
/// !cdk-integ pragma:disable-update-workflow
import * as path from 'path';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { App, CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { IntegTest, ExpectedResult } from '@aws-cdk/integ-tests-alpha';
import { Construct } from 'constructs';
import * as lambda from '../lib';

/*
 * Stack verification steps:
 * * aws lambda invoke --function-name <deployed fn name> --invocation-type Event --payload '"OK"' response.json
 */

class TestStack extends Stack {
  public readonly functionName: string;
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const fn = new lambda.PythonFunction(this, 'my_handler-root-user', {
      entry: path.join(__dirname, 'lambda-handler'),
      runtime: Runtime.PYTHON_3_13,
      bundling: {
        commandHooks: {
          beforeBundling(_inputDir: string, _outputDir: string): string[] {
            return [
              'cat /etc/os-release',
            ];
          },
          afterBundling: function (_inputDir: string, _outputDir: string): string[] {
            return ['mkdir test'];
          },
        },
      },
    });
    this.functionName = fn.functionName;

    new CfnOutput(this, 'Function2Arn', {
      value: fn.functionArn,
    });
  }
}

const app = new App({
  postCliContext: {
    '@aws-cdk/aws-lambda:useCdkManagedLogGroup': false,
  },
});
const testCase = new TestStack(app, 'cdk-integ-lambda-python-bundling-user');
const integ = new IntegTest(app, 'lambda-python-bundling-user', {
  testCases: [testCase],
  stackUpdateWorkflow: false,
});

const invoke1 = integ.assertions.invokeFunction({
  functionName: testCase.functionName,
});

invoke1.expect(ExpectedResult.objectLike({
  Payload: '200',
}));

app.synth();
