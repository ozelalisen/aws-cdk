"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/// !cdk-integ pragma:disable-update-workflow
const integ = require("@aws-cdk/integ-tests-alpha");
const lambda_layer_kubectl_v33_1 = require("@aws-cdk/lambda-layer-kubectl-v33");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const ec2 = require("aws-cdk-lib/aws-ec2");
const cx_api_1 = require("aws-cdk-lib/cx-api");
const cdk8s = require("cdk8s");
const kplus = require("cdk8s-plus-27");
const eks = require("../lib");
const pinger_1 = require("./pinger/pinger");
const LATEST_VERSION = eks.AlbControllerVersion.V2_8_2;
class EksClusterAlbControllerStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id) {
        super(scope, id);
        // just need one nat gateway to simplify the test
        const vpc = new ec2.Vpc(this, 'Vpc', { maxAzs: 2, natGateways: 1, restrictDefaultSecurityGroup: false });
        const cluster = new eks.Cluster(this, 'Cluster', {
            vpc,
            version: eks.KubernetesVersion.V1_33,
            albController: {
                version: LATEST_VERSION,
                additionalHelmChartValues: {
                    enableWafv2: false,
                },
            },
            kubectlProviderOptions: {
                kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(this, 'kubectlLayer'),
            },
        });
        const chart = new cdk8s.Chart(new cdk8s.App(), 'hello-server');
        const ingress = new kplus.Deployment(chart, 'Deployment', {
            containers: [{
                    image: 'hashicorp/http-echo',
                    args: ['-text', 'hello'],
                    port: 5678,
                    securityContext: {
                        user: 1005,
                    },
                }],
        })
            .exposeViaService({ serviceType: kplus.ServiceType.NODE_PORT })
            .exposeViaIngress('/');
        // allow vpc to access the ELB so our pinger can hit it.
        ingress.metadata.addAnnotation('alb.ingress.kubernetes.io/inbound-cidrs', cluster.vpc.vpcCidrBlock);
        const echoServer = cluster.addCdk8sChart('echo-server', chart, { ingressAlb: true, ingressAlbScheme: eks.AlbScheme.INTERNAL });
        // the deletion of `echoServer` is what instructs the controller to delete the ELB.
        // so we need to make sure this happens before the controller is deleted.
        echoServer.node.addDependency(cluster.albController ?? []);
        const loadBalancerAddress = cluster.getIngressLoadBalancerAddress(ingress.name, { timeout: aws_cdk_lib_1.Duration.minutes(10) });
        // create a resource that hits the load balancer to make sure
        // everything is wired properly.
        const pinger = new pinger_1.Pinger(this, 'IngressPinger', {
            url: `http://${loadBalancerAddress}`,
            vpc: cluster.vpc,
        });
        // the pinger must wait for the ingress and echoServer to be deployed.
        pinger.node.addDependency(ingress, echoServer);
        // this should display the 'hello' text we gave to the server
        new aws_cdk_lib_1.CfnOutput(this, 'IngressPingerResponse', {
            value: pinger.response,
        });
    }
}
const app = new aws_cdk_lib_1.App({
    postCliContext: {
        [cx_api_1.IAM_OIDC_REJECT_UNAUTHORIZED_CONNECTIONS]: false,
        '@aws-cdk/aws-lambda:createNewPoliciesWithAddToRolePolicy': true,
        '@aws-cdk/aws-lambda:useCdkManagedLogGroup': false,
    },
});
const stack = new EksClusterAlbControllerStack(app, 'aws-cdk-eks-cluster-alb-controller');
new integ.IntegTest(app, 'aws-cdk-cluster-alb-controller-integ', {
    testCases: [stack],
    // Test includes assets that are updated weekly. If not disabled, the upgrade PR will fail.
    diffAssets: false,
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuYWxiLWNvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnRlZy5hbGItY29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDZDQUE2QztBQUM3QyxvREFBb0Q7QUFDcEQsZ0ZBQW9FO0FBQ3BFLDZDQUE4RDtBQUM5RCwyQ0FBMkM7QUFDM0MsK0NBQThFO0FBQzlFLCtCQUErQjtBQUMvQix1Q0FBdUM7QUFDdkMsOEJBQThCO0FBQzlCLDRDQUF5QztBQUV6QyxNQUFNLGNBQWMsR0FBNkIsR0FBRyxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQztBQUNqRixNQUFNLDRCQUE2QixTQUFRLG1CQUFLO0lBQzlDLFlBQVksS0FBVSxFQUFFLEVBQVU7UUFDaEMsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVqQixpREFBaUQ7UUFDakQsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLFdBQVcsRUFBRSxDQUFDLEVBQUUsNEJBQTRCLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUV6RyxNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRTtZQUMvQyxHQUFHO1lBQ0gsT0FBTyxFQUFFLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLO1lBQ3BDLGFBQWEsRUFBRTtnQkFDYixPQUFPLEVBQUUsY0FBYztnQkFDdkIseUJBQXlCLEVBQUU7b0JBQ3pCLFdBQVcsRUFBRSxLQUFLO2lCQUNuQjthQUNGO1lBQ0Qsc0JBQXNCLEVBQUU7Z0JBQ3RCLFlBQVksRUFBRSxJQUFJLDBDQUFlLENBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQzthQUN4RDtTQUNGLENBQUMsQ0FBQztRQUVILE1BQU0sS0FBSyxHQUFHLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQyxHQUFHLEVBQUUsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUUvRCxNQUFNLE9BQU8sR0FBRyxJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRTtZQUN4RCxVQUFVLEVBQUUsQ0FBQztvQkFDWCxLQUFLLEVBQUUscUJBQXFCO29CQUM1QixJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDO29CQUN4QixJQUFJLEVBQUUsSUFBSTtvQkFDVixlQUFlLEVBQUU7d0JBQ2YsSUFBSSxFQUFFLElBQUk7cUJBQ1g7aUJBQ0YsQ0FBQztTQUNILENBQUM7YUFDQyxnQkFBZ0IsQ0FBQyxFQUFFLFdBQVcsRUFBRSxLQUFLLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxDQUFDO2FBQzlELGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRXpCLHdEQUF3RDtRQUN4RCxPQUFPLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyx5Q0FBeUMsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBRXBHLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUMsYUFBYSxFQUFFLEtBQUssRUFBRSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBRS9ILG1GQUFtRjtRQUNuRix5RUFBeUU7UUFDekUsVUFBVSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLGFBQWEsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUUzRCxNQUFNLG1CQUFtQixHQUFHLE9BQU8sQ0FBQyw2QkFBNkIsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsT0FBTyxFQUFFLHNCQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUVuSCw2REFBNkQ7UUFDN0QsZ0NBQWdDO1FBQ2hDLE1BQU0sTUFBTSxHQUFHLElBQUksZUFBTSxDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDL0MsR0FBRyxFQUFFLFVBQVUsbUJBQW1CLEVBQUU7WUFDcEMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxHQUFHO1NBQ2pCLENBQUMsQ0FBQztRQUVILHNFQUFzRTtRQUN0RSxNQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFFL0MsNkRBQTZEO1FBQzdELElBQUksdUJBQVMsQ0FBQyxJQUFJLEVBQUUsdUJBQXVCLEVBQUU7WUFDM0MsS0FBSyxFQUFFLE1BQU0sQ0FBQyxRQUFRO1NBQ3ZCLENBQUMsQ0FBQztLQUNKO0NBQ0Y7QUFFRCxNQUFNLEdBQUcsR0FBRyxJQUFJLGlCQUFHLENBQUM7SUFDbEIsY0FBYyxFQUFFO1FBQ2QsQ0FBQyxpREFBd0MsQ0FBQyxFQUFFLEtBQUs7UUFDakQsMERBQTBELEVBQUUsSUFBSTtRQUNoRSwyQ0FBMkMsRUFBRSxLQUFLO0tBQ25EO0NBQ0YsQ0FBQyxDQUFDO0FBQ0gsTUFBTSxLQUFLLEdBQUcsSUFBSSw0QkFBNEIsQ0FBQyxHQUFHLEVBQUUsb0NBQW9DLENBQUMsQ0FBQztBQUMxRixJQUFJLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLHNDQUFzQyxFQUFFO0lBQy9ELFNBQVMsRUFBRSxDQUFDLEtBQUssQ0FBQztJQUNsQiwyRkFBMkY7SUFDM0YsVUFBVSxFQUFFLEtBQUs7Q0FDbEIsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8vICFjZGstaW50ZWcgcHJhZ21hOmRpc2FibGUtdXBkYXRlLXdvcmtmbG93XG5pbXBvcnQgKiBhcyBpbnRlZyBmcm9tICdAYXdzLWNkay9pbnRlZy10ZXN0cy1hbHBoYSc7XG5pbXBvcnQgeyBLdWJlY3RsVjMzTGF5ZXIgfSBmcm9tICdAYXdzLWNkay9sYW1iZGEtbGF5ZXIta3ViZWN0bC12MzMnO1xuaW1wb3J0IHsgQXBwLCBDZm5PdXRwdXQsIER1cmF0aW9uLCBTdGFjayB9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGVjMiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWMyJztcbmltcG9ydCB7IElBTV9PSURDX1JFSkVDVF9VTkFVVEhPUklaRURfQ09OTkVDVElPTlMgfSBmcm9tICdhd3MtY2RrLWxpYi9jeC1hcGknO1xuaW1wb3J0ICogYXMgY2RrOHMgZnJvbSAnY2RrOHMnO1xuaW1wb3J0ICogYXMga3BsdXMgZnJvbSAnY2RrOHMtcGx1cy0yNyc7XG5pbXBvcnQgKiBhcyBla3MgZnJvbSAnLi4vbGliJztcbmltcG9ydCB7IFBpbmdlciB9IGZyb20gJy4vcGluZ2VyL3Bpbmdlcic7XG5cbmNvbnN0IExBVEVTVF9WRVJTSU9OOiBla3MuQWxiQ29udHJvbGxlclZlcnNpb24gPSBla3MuQWxiQ29udHJvbGxlclZlcnNpb24uVjJfOF8yO1xuY2xhc3MgRWtzQ2x1c3RlckFsYkNvbnRyb2xsZXJTdGFjayBleHRlbmRzIFN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IEFwcCwgaWQ6IHN0cmluZykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICAvLyBqdXN0IG5lZWQgb25lIG5hdCBnYXRld2F5IHRvIHNpbXBsaWZ5IHRoZSB0ZXN0XG4gICAgY29uc3QgdnBjID0gbmV3IGVjMi5WcGModGhpcywgJ1ZwYycsIHsgbWF4QXpzOiAyLCBuYXRHYXRld2F5czogMSwgcmVzdHJpY3REZWZhdWx0U2VjdXJpdHlHcm91cDogZmFsc2UgfSk7XG5cbiAgICBjb25zdCBjbHVzdGVyID0gbmV3IGVrcy5DbHVzdGVyKHRoaXMsICdDbHVzdGVyJywge1xuICAgICAgdnBjLFxuICAgICAgdmVyc2lvbjogZWtzLkt1YmVybmV0ZXNWZXJzaW9uLlYxXzMzLFxuICAgICAgYWxiQ29udHJvbGxlcjoge1xuICAgICAgICB2ZXJzaW9uOiBMQVRFU1RfVkVSU0lPTixcbiAgICAgICAgYWRkaXRpb25hbEhlbG1DaGFydFZhbHVlczoge1xuICAgICAgICAgIGVuYWJsZVdhZnYyOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBrdWJlY3RsUHJvdmlkZXJPcHRpb25zOiB7XG4gICAgICAgIGt1YmVjdGxMYXllcjogbmV3IEt1YmVjdGxWMzNMYXllcih0aGlzLCAna3ViZWN0bExheWVyJyksXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgY29uc3QgY2hhcnQgPSBuZXcgY2RrOHMuQ2hhcnQobmV3IGNkazhzLkFwcCgpLCAnaGVsbG8tc2VydmVyJyk7XG5cbiAgICBjb25zdCBpbmdyZXNzID0gbmV3IGtwbHVzLkRlcGxveW1lbnQoY2hhcnQsICdEZXBsb3ltZW50Jywge1xuICAgICAgY29udGFpbmVyczogW3tcbiAgICAgICAgaW1hZ2U6ICdoYXNoaWNvcnAvaHR0cC1lY2hvJyxcbiAgICAgICAgYXJnczogWyctdGV4dCcsICdoZWxsbyddLFxuICAgICAgICBwb3J0OiA1Njc4LFxuICAgICAgICBzZWN1cml0eUNvbnRleHQ6IHtcbiAgICAgICAgICB1c2VyOiAxMDA1LFxuICAgICAgICB9LFxuICAgICAgfV0sXG4gICAgfSlcbiAgICAgIC5leHBvc2VWaWFTZXJ2aWNlKHsgc2VydmljZVR5cGU6IGtwbHVzLlNlcnZpY2VUeXBlLk5PREVfUE9SVCB9KVxuICAgICAgLmV4cG9zZVZpYUluZ3Jlc3MoJy8nKTtcblxuICAgIC8vIGFsbG93IHZwYyB0byBhY2Nlc3MgdGhlIEVMQiBzbyBvdXIgcGluZ2VyIGNhbiBoaXQgaXQuXG4gICAgaW5ncmVzcy5tZXRhZGF0YS5hZGRBbm5vdGF0aW9uKCdhbGIuaW5ncmVzcy5rdWJlcm5ldGVzLmlvL2luYm91bmQtY2lkcnMnLCBjbHVzdGVyLnZwYy52cGNDaWRyQmxvY2spO1xuXG4gICAgY29uc3QgZWNob1NlcnZlciA9IGNsdXN0ZXIuYWRkQ2RrOHNDaGFydCgnZWNoby1zZXJ2ZXInLCBjaGFydCwgeyBpbmdyZXNzQWxiOiB0cnVlLCBpbmdyZXNzQWxiU2NoZW1lOiBla3MuQWxiU2NoZW1lLklOVEVSTkFMIH0pO1xuXG4gICAgLy8gdGhlIGRlbGV0aW9uIG9mIGBlY2hvU2VydmVyYCBpcyB3aGF0IGluc3RydWN0cyB0aGUgY29udHJvbGxlciB0byBkZWxldGUgdGhlIEVMQi5cbiAgICAvLyBzbyB3ZSBuZWVkIHRvIG1ha2Ugc3VyZSB0aGlzIGhhcHBlbnMgYmVmb3JlIHRoZSBjb250cm9sbGVyIGlzIGRlbGV0ZWQuXG4gICAgZWNob1NlcnZlci5ub2RlLmFkZERlcGVuZGVuY3koY2x1c3Rlci5hbGJDb250cm9sbGVyID8/IFtdKTtcblxuICAgIGNvbnN0IGxvYWRCYWxhbmNlckFkZHJlc3MgPSBjbHVzdGVyLmdldEluZ3Jlc3NMb2FkQmFsYW5jZXJBZGRyZXNzKGluZ3Jlc3MubmFtZSwgeyB0aW1lb3V0OiBEdXJhdGlvbi5taW51dGVzKDEwKSB9KTtcblxuICAgIC8vIGNyZWF0ZSBhIHJlc291cmNlIHRoYXQgaGl0cyB0aGUgbG9hZCBiYWxhbmNlciB0byBtYWtlIHN1cmVcbiAgICAvLyBldmVyeXRoaW5nIGlzIHdpcmVkIHByb3Blcmx5LlxuICAgIGNvbnN0IHBpbmdlciA9IG5ldyBQaW5nZXIodGhpcywgJ0luZ3Jlc3NQaW5nZXInLCB7XG4gICAgICB1cmw6IGBodHRwOi8vJHtsb2FkQmFsYW5jZXJBZGRyZXNzfWAsXG4gICAgICB2cGM6IGNsdXN0ZXIudnBjLFxuICAgIH0pO1xuXG4gICAgLy8gdGhlIHBpbmdlciBtdXN0IHdhaXQgZm9yIHRoZSBpbmdyZXNzIGFuZCBlY2hvU2VydmVyIHRvIGJlIGRlcGxveWVkLlxuICAgIHBpbmdlci5ub2RlLmFkZERlcGVuZGVuY3koaW5ncmVzcywgZWNob1NlcnZlcik7XG5cbiAgICAvLyB0aGlzIHNob3VsZCBkaXNwbGF5IHRoZSAnaGVsbG8nIHRleHQgd2UgZ2F2ZSB0byB0aGUgc2VydmVyXG4gICAgbmV3IENmbk91dHB1dCh0aGlzLCAnSW5ncmVzc1BpbmdlclJlc3BvbnNlJywge1xuICAgICAgdmFsdWU6IHBpbmdlci5yZXNwb25zZSxcbiAgICB9KTtcbiAgfVxufVxuXG5jb25zdCBhcHAgPSBuZXcgQXBwKHtcbiAgcG9zdENsaUNvbnRleHQ6IHtcbiAgICBbSUFNX09JRENfUkVKRUNUX1VOQVVUSE9SSVpFRF9DT05ORUNUSU9OU106IGZhbHNlLFxuICAgICdAYXdzLWNkay9hd3MtbGFtYmRhOmNyZWF0ZU5ld1BvbGljaWVzV2l0aEFkZFRvUm9sZVBvbGljeSc6IHRydWUsXG4gICAgJ0Bhd3MtY2RrL2F3cy1sYW1iZGE6dXNlQ2RrTWFuYWdlZExvZ0dyb3VwJzogZmFsc2UsXG4gIH0sXG59KTtcbmNvbnN0IHN0YWNrID0gbmV3IEVrc0NsdXN0ZXJBbGJDb250cm9sbGVyU3RhY2soYXBwLCAnYXdzLWNkay1la3MtY2x1c3Rlci1hbGItY29udHJvbGxlcicpO1xubmV3IGludGVnLkludGVnVGVzdChhcHAsICdhd3MtY2RrLWNsdXN0ZXItYWxiLWNvbnRyb2xsZXItaW50ZWcnLCB7XG4gIHRlc3RDYXNlczogW3N0YWNrXSxcbiAgLy8gVGVzdCBpbmNsdWRlcyBhc3NldHMgdGhhdCBhcmUgdXBkYXRlZCB3ZWVrbHkuIElmIG5vdCBkaXNhYmxlZCwgdGhlIHVwZ3JhZGUgUFIgd2lsbCBmYWlsLlxuICBkaWZmQXNzZXRzOiBmYWxzZSxcbn0pO1xuIl19