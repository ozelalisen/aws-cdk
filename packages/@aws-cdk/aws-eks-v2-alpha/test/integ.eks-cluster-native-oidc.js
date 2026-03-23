"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/// !cdk-integ pragma:disable-update-workflow
const integ = require("@aws-cdk/integ-tests-alpha");
const lambda_layer_kubectl_v32_1 = require("@aws-cdk/lambda-layer-kubectl-v32");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const cx_api_1 = require("aws-cdk-lib/cx-api");
const eks = require("../lib");
class EksClusterNativeOidcStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const cluster = new eks.Cluster(this, 'Cluster', {
            version: eks.KubernetesVersion.V1_32,
            kubectlProviderOptions: {
                kubectlLayer: new lambda_layer_kubectl_v32_1.KubectlV32Layer(this, 'kubectlLayer'),
            },
        });
        /**
         * ServiceAccount and AlbController are added to verify that OIDC provider is created and
         * can be used to create IAM roles for service accounts.
         */
        new eks.ServiceAccount(this, 'ServiceAccount', {
            cluster: cluster,
            name: 'test-service-account',
            namespace: 'default',
        });
        new eks.AlbController(this, 'AlbController', {
            cluster: cluster,
            version: eks.AlbControllerVersion.V2_8_2,
        });
    }
}
const app = new aws_cdk_lib_1.App({
    postCliContext: {
        [cx_api_1.EKS_USE_NATIVE_OIDC_PROVIDER]: true,
    },
});
const stack = new EksClusterNativeOidcStack(app, 'aws-cdk-eks-v2-alpha-cluster-native-oidc', {
    env: { region: 'us-east-1' },
});
new integ.IntegTest(app, 'aws-cdk-eks-v2-alpha-native-oidc-integ', {
    testCases: [stack],
    diffAssets: false,
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuZWtzLWNsdXN0ZXItbmF0aXZlLW9pZGMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnRlZy5la3MtY2x1c3Rlci1uYXRpdmUtb2lkYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDZDQUE2QztBQUM3QyxvREFBb0Q7QUFDcEQsZ0ZBQW9FO0FBQ3BFLDZDQUFxRDtBQUNyRCwrQ0FBa0U7QUFDbEUsOEJBQThCO0FBRTlCLE1BQU0seUJBQTBCLFNBQVEsbUJBQUs7SUFDM0MsWUFBWSxLQUFVLEVBQUUsRUFBVSxFQUFFLEtBQWtCO1FBQ3BELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFO1lBQy9DLE9BQU8sRUFBRSxHQUFHLENBQUMsaUJBQWlCLENBQUMsS0FBSztZQUNwQyxzQkFBc0IsRUFBRTtnQkFDdEIsWUFBWSxFQUFFLElBQUksMENBQWUsQ0FBQyxJQUFJLEVBQUUsY0FBYyxDQUFDO2FBQ3hEO1NBRUYsQ0FBQyxDQUFDO1FBRUg7OztXQUdHO1FBRUgsSUFBSSxHQUFHLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUM3QyxPQUFPLEVBQUUsT0FBTztZQUNoQixJQUFJLEVBQUUsc0JBQXNCO1lBQzVCLFNBQVMsRUFBRSxTQUFTO1NBQ3JCLENBQUMsQ0FBQztRQUNILElBQUksR0FBRyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQzNDLE9BQU8sRUFBRSxPQUFPO1lBQ2hCLE9BQU8sRUFBRSxHQUFHLENBQUMsb0JBQW9CLENBQUMsTUFBTTtTQUN6QyxDQUFDLENBQUM7S0FDSjtDQUNGO0FBRUQsTUFBTSxHQUFHLEdBQUcsSUFBSSxpQkFBRyxDQUFDO0lBQ2xCLGNBQWMsRUFBRTtRQUNkLENBQUMscUNBQTRCLENBQUMsRUFBRSxJQUFJO0tBQ3JDO0NBQ0YsQ0FBQyxDQUFDO0FBRUgsTUFBTSxLQUFLLEdBQUcsSUFBSSx5QkFBeUIsQ0FBQyxHQUFHLEVBQUUsMENBQTBDLEVBQUU7SUFDM0YsR0FBRyxFQUFFLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRTtDQUM3QixDQUFDLENBQUM7QUFFSCxJQUFJLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLHdDQUF3QyxFQUFFO0lBQ2pFLFNBQVMsRUFBRSxDQUFDLEtBQUssQ0FBQztJQUNsQixVQUFVLEVBQUUsS0FBSztDQUNsQixDQUFDLENBQUM7QUFFSCxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8gIWNkay1pbnRlZyBwcmFnbWE6ZGlzYWJsZS11cGRhdGUtd29ya2Zsb3dcbmltcG9ydCAqIGFzIGludGVnIGZyb20gJ0Bhd3MtY2RrL2ludGVnLXRlc3RzLWFscGhhJztcbmltcG9ydCB7IEt1YmVjdGxWMzJMYXllciB9IGZyb20gJ0Bhd3MtY2RrL2xhbWJkYS1sYXllci1rdWJlY3RsLXYzMic7XG5pbXBvcnQgeyBBcHAsIFN0YWNrLCBTdGFja1Byb3BzIH0gZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgRUtTX1VTRV9OQVRJVkVfT0lEQ19QUk9WSURFUiB9IGZyb20gJ2F3cy1jZGstbGliL2N4LWFwaSc7XG5pbXBvcnQgKiBhcyBla3MgZnJvbSAnLi4vbGliJztcblxuY2xhc3MgRWtzQ2x1c3Rlck5hdGl2ZU9pZGNTdGFjayBleHRlbmRzIFN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IEFwcCwgaWQ6IHN0cmluZywgcHJvcHM/OiBTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICBjb25zdCBjbHVzdGVyID0gbmV3IGVrcy5DbHVzdGVyKHRoaXMsICdDbHVzdGVyJywge1xuICAgICAgdmVyc2lvbjogZWtzLkt1YmVybmV0ZXNWZXJzaW9uLlYxXzMyLFxuICAgICAga3ViZWN0bFByb3ZpZGVyT3B0aW9uczoge1xuICAgICAgICBrdWJlY3RsTGF5ZXI6IG5ldyBLdWJlY3RsVjMyTGF5ZXIodGhpcywgJ2t1YmVjdGxMYXllcicpLFxuICAgICAgfSxcblxuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogU2VydmljZUFjY291bnQgYW5kIEFsYkNvbnRyb2xsZXIgYXJlIGFkZGVkIHRvIHZlcmlmeSB0aGF0IE9JREMgcHJvdmlkZXIgaXMgY3JlYXRlZCBhbmRcbiAgICAgKiBjYW4gYmUgdXNlZCB0byBjcmVhdGUgSUFNIHJvbGVzIGZvciBzZXJ2aWNlIGFjY291bnRzLlxuICAgICAqL1xuXG4gICAgbmV3IGVrcy5TZXJ2aWNlQWNjb3VudCh0aGlzLCAnU2VydmljZUFjY291bnQnLCB7XG4gICAgICBjbHVzdGVyOiBjbHVzdGVyLFxuICAgICAgbmFtZTogJ3Rlc3Qtc2VydmljZS1hY2NvdW50JyxcbiAgICAgIG5hbWVzcGFjZTogJ2RlZmF1bHQnLFxuICAgIH0pO1xuICAgIG5ldyBla3MuQWxiQ29udHJvbGxlcih0aGlzLCAnQWxiQ29udHJvbGxlcicsIHtcbiAgICAgIGNsdXN0ZXI6IGNsdXN0ZXIsXG4gICAgICB2ZXJzaW9uOiBla3MuQWxiQ29udHJvbGxlclZlcnNpb24uVjJfOF8yLFxuICAgIH0pO1xuICB9XG59XG5cbmNvbnN0IGFwcCA9IG5ldyBBcHAoe1xuICBwb3N0Q2xpQ29udGV4dDoge1xuICAgIFtFS1NfVVNFX05BVElWRV9PSURDX1BST1ZJREVSXTogdHJ1ZSxcbiAgfSxcbn0pO1xuXG5jb25zdCBzdGFjayA9IG5ldyBFa3NDbHVzdGVyTmF0aXZlT2lkY1N0YWNrKGFwcCwgJ2F3cy1jZGstZWtzLXYyLWFscGhhLWNsdXN0ZXItbmF0aXZlLW9pZGMnLCB7XG4gIGVudjogeyByZWdpb246ICd1cy1lYXN0LTEnIH0sXG59KTtcblxubmV3IGludGVnLkludGVnVGVzdChhcHAsICdhd3MtY2RrLWVrcy12Mi1hbHBoYS1uYXRpdmUtb2lkYy1pbnRlZycsIHtcbiAgdGVzdENhc2VzOiBbc3RhY2tdLFxuICBkaWZmQXNzZXRzOiBmYWxzZSxcbn0pO1xuXG5hcHAuc3ludGgoKTtcbiJdfQ==