"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const lambda_layer_kubectl_v33_1 = require("@aws-cdk/lambda-layer-kubectl-v33");
const assertions_1 = require("aws-cdk-lib/assertions");
const asg = require("aws-cdk-lib/aws-autoscaling");
const ec2 = require("aws-cdk-lib/aws-ec2");
const iam = require("aws-cdk-lib/aws-iam");
const kms = require("aws-cdk-lib/aws-kms");
const lambda = require("aws-cdk-lib/aws-lambda");
const cdk = require("aws-cdk-lib/core");
const cdk8s = require("cdk8s");
const constructs_1 = require("constructs");
const YAML = require("yaml");
const util_1 = require("./util");
const eks = require("../lib");
const lib_1 = require("../lib");
const kubectl_provider_1 = require("../lib/kubectl-provider");
const bottlerocket_1 = require("../lib/private/bottlerocket");
const CLUSTER_VERSION = eks.KubernetesVersion.V1_33;
const commonProps = {
    version: CLUSTER_VERSION,
    defaultCapacity: 0,
    defaultCapacityType: eks.DefaultCapacityType.NODEGROUP,
};
describe('cluster', () => {
    test('can configure and access ALB controller', () => {
        const { stack } = (0, util_1.testFixture)();
        const cluster = new eks.Cluster(stack, 'Cluster', {
            version: CLUSTER_VERSION,
            albController: {
                version: eks.AlbControllerVersion.V2_4_1,
            },
            kubectlProviderOptions: {
                kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(stack, 'kubectlLayer'),
            },
        });
        assertions_1.Template.fromStack(stack).hasResourceProperties('Custom::AWSCDK-EKS-HelmChart', {
            Chart: 'aws-load-balancer-controller',
        });
        expect(cluster.albController).toBeDefined();
    });
    describe('imported Vpc from unparseable list tokens', () => {
        let stack;
        let vpc;
        beforeEach(() => {
            stack = new cdk.Stack();
            const vpcId = cdk.Fn.importValue('myVpcId');
            const availabilityZones = cdk.Fn.split(',', cdk.Fn.importValue('myAvailabilityZones'));
            const publicSubnetIds = cdk.Fn.split(',', cdk.Fn.importValue('myPublicSubnetIds'));
            const privateSubnetIds = cdk.Fn.split(',', cdk.Fn.importValue('myPrivateSubnetIds'));
            const isolatedSubnetIds = cdk.Fn.split(',', cdk.Fn.importValue('myIsolatedSubnetIds'));
            vpc = ec2.Vpc.fromVpcAttributes(stack, 'importedVpc', {
                vpcId,
                availabilityZones,
                publicSubnetIds,
                privateSubnetIds,
                isolatedSubnetIds,
            });
        });
        test('throws if selecting more than one subnet group', () => {
            expect(() => new eks.Cluster(stack, 'Cluster', {
                vpc: vpc,
                vpcSubnets: [{ subnetType: ec2.SubnetType.PUBLIC }, { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
                ...commonProps,
            })).toThrow(/cannot select multiple subnet groups/);
        });
        test('synthesis works if only one subnet group is selected', () => {
            // WHEN
            new eks.Cluster(stack, 'Cluster', {
                vpc: vpc,
                vpcSubnets: [{ subnetType: ec2.SubnetType.PUBLIC }],
                ...commonProps,
            });
            // THEN
            assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::EKS::Cluster', {
                ResourcesVpcConfig: {
                    SubnetIds: {
                        'Fn::Split': [
                            ',',
                            { 'Fn::ImportValue': 'myPublicSubnetIds' },
                        ],
                    },
                },
            });
        });
    });
    test('throws when accessing cluster security group for imported cluster without cluster security group id', () => {
        const { stack } = (0, util_1.testFixture)();
        const cluster = eks.Cluster.fromClusterAttributes(stack, 'Cluster', {
            clusterName: 'cluster',
        });
        expect(() => cluster.clusterSecurityGroup).toThrow(/"clusterSecurityGroup" is not defined for this imported cluster/);
    });
    test('can access cluster security group for imported cluster with cluster security group id', () => {
        const { stack } = (0, util_1.testFixture)();
        const clusterSgId = 'cluster-sg-id';
        const cluster = eks.Cluster.fromClusterAttributes(stack, 'Cluster', {
            clusterName: 'cluster',
            clusterSecurityGroupId: clusterSgId,
        });
        const clusterSg = cluster.clusterSecurityGroup;
        expect(clusterSg.securityGroupId).toEqual(clusterSgId);
    });
    test('cluster security group is attached when adding self-managed nodes', () => {
        // GIVEN
        const { stack, vpc } = (0, util_1.testFixture)();
        const cluster = new eks.Cluster(stack, 'Cluster', {
            vpc,
            ...commonProps,
            prune: false,
        });
        // WHEN
        cluster.addAutoScalingGroupCapacity('self-managed', {
            instanceType: new ec2.InstanceType('t2.medium'),
        });
        assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::AutoScaling::LaunchConfiguration', {
            SecurityGroups: [
                { 'Fn::GetAtt': ['ClusterselfmanagedInstanceSecurityGroup64468C3A', 'GroupId'] },
                { 'Fn::GetAtt': ['ClusterEB0386A7', 'ClusterSecurityGroupId'] },
            ],
        });
    });
    test('security group of self-managed asg is not tagged with owned', () => {
        // GIVEN
        const { stack, vpc } = (0, util_1.testFixture)();
        const cluster = new eks.Cluster(stack, 'Cluster', {
            vpc,
            ...commonProps,
        });
        // WHEN
        cluster.addAutoScalingGroupCapacity('self-managed', {
            instanceType: new ec2.InstanceType('t2.medium'),
        });
        let template = assertions_1.Template.fromStack(stack);
        template.hasResourceProperties('AWS::EC2::SecurityGroup', {
            Tags: [{ Key: 'Name', Value: 'Stack/Cluster/self-managed' }],
        });
    });
    test('connect autoscaling group with imported cluster', () => {
        // GIVEN
        const { stack, vpc } = (0, util_1.testFixture)();
        const cluster = new eks.Cluster(stack, 'Cluster', {
            vpc,
            ...commonProps,
            prune: false,
        });
        const importedCluster = eks.Cluster.fromClusterAttributes(stack, 'ImportedCluster', {
            clusterName: cluster.clusterName,
            clusterSecurityGroupId: cluster.clusterSecurityGroupId,
        });
        const selfManaged = new asg.AutoScalingGroup(stack, 'self-managed', {
            instanceType: new ec2.InstanceType('t2.medium'),
            vpc: vpc,
            machineImage: new ec2.AmazonLinuxImage(),
        });
        // WHEN
        importedCluster.connectAutoScalingGroupCapacity(selfManaged, {});
        assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::AutoScaling::LaunchConfiguration', {
            SecurityGroups: [
                { 'Fn::GetAtt': ['selfmanagedInstanceSecurityGroupEA6D80C9', 'GroupId'] },
                { 'Fn::GetAtt': ['ClusterEB0386A7', 'ClusterSecurityGroupId'] },
            ],
        });
    });
    test('cluster security group is attached when connecting self-managed nodes', () => {
        // GIVEN
        const { stack, vpc } = (0, util_1.testFixture)();
        const cluster = new eks.Cluster(stack, 'Cluster', {
            vpc,
            ...commonProps,
            prune: false,
        });
        const selfManaged = new asg.AutoScalingGroup(stack, 'self-managed', {
            instanceType: new ec2.InstanceType('t2.medium'),
            vpc: vpc,
            machineImage: new ec2.AmazonLinuxImage(),
        });
        // WHEN
        cluster.connectAutoScalingGroupCapacity(selfManaged, {});
        assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::AutoScaling::LaunchConfiguration', {
            SecurityGroups: [
                { 'Fn::GetAtt': ['selfmanagedInstanceSecurityGroupEA6D80C9', 'GroupId'] },
                { 'Fn::GetAtt': ['ClusterEB0386A7', 'ClusterSecurityGroupId'] },
            ],
        });
    });
    test('throws when a non cdk8s chart construct is added as cdk8s chart', () => {
        const { stack } = (0, util_1.testFixture)();
        const cluster = new eks.Cluster(stack, 'Cluster', {
            ...commonProps,
            prune: false,
        });
        // create a plain construct, not a cdk8s chart
        const someConstruct = new constructs_1.Construct(stack, 'SomeConstruct');
        expect(() => cluster.addCdk8sChart('chart', someConstruct)).toThrow(/Invalid cdk8s chart. Must contain a \'toJson\' method, but found undefined/);
    });
    test('cdk8s chart can be added to cluster', () => {
        const { stack } = (0, util_1.testFixture)();
        const cluster = new eks.Cluster(stack, 'Cluster', {
            ...commonProps,
            prune: false,
            kubectlProviderOptions: {
                kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(stack, 'kubectlLayer'),
            },
        });
        const app = new cdk8s.App();
        const chart = new cdk8s.Chart(app, 'Chart');
        new cdk8s.ApiObject(chart, 'FakePod', {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: {
                name: 'fake-pod',
                labels: {
                    // adding aws-cdk token to cdk8s chart
                    clusterName: cluster.clusterName,
                },
            },
        });
        cluster.addCdk8sChart('cdk8s-chart', chart);
        assertions_1.Template.fromStack(stack).hasResourceProperties('Custom::AWSCDK-EKS-KubernetesResource', {
            Manifest: {
                'Fn::Join': [
                    '',
                    [
                        '[{"apiVersion":"v1","kind":"Pod","metadata":{"labels":{"clusterName":"',
                        {
                            Ref: 'ClusterEB0386A7',
                        },
                        '"},"name":"fake-pod"}}]',
                    ],
                ],
            },
        });
    });
    test('cluster connections include both control plane and cluster security group', () => {
        const { stack } = (0, util_1.testFixture)();
        const cluster = new eks.Cluster(stack, 'Cluster', {
            ...commonProps,
            prune: false,
        });
        expect(cluster.connections.securityGroups.map(sg => stack.resolve(sg.securityGroupId))).toEqual([
            { 'Fn::GetAtt': ['ClusterEB0386A7', 'ClusterSecurityGroupId'] },
            { 'Fn::GetAtt': ['ClusterControlPlaneSecurityGroupD274242C', 'GroupId'] },
        ]);
    });
    test('can declare a security group from a different stack', () => {
        class ClusterStack extends cdk.Stack {
            eksCluster;
            constructor(scope, id, props) {
                super(scope, id);
                this.eksCluster = new eks.Cluster(this, 'Cluster', {
                    ...commonProps,
                    prune: false,
                    securityGroup: props.sg,
                    vpc: props.vpc,
                });
            }
        }
        class NetworkStack extends cdk.Stack {
            securityGroup;
            vpc;
            constructor(scope, id) {
                super(scope, id);
                this.vpc = new ec2.Vpc(this, 'Vpc');
                this.securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', { vpc: this.vpc });
            }
        }
        const { app } = (0, util_1.testFixture)();
        const networkStack = new NetworkStack(app, 'NetworkStack');
        new ClusterStack(app, 'ClusterStack', { sg: networkStack.securityGroup, vpc: networkStack.vpc });
        // make sure we can synth (no circular dependencies between the stacks)
        app.synth();
    });
    test('can declare a manifest with a token from a different stack than the cluster that depends on the cluster stack', () => {
        class ClusterStack extends cdk.Stack {
            eksCluster;
            constructor(scope, id, props) {
                super(scope, id, props);
                this.eksCluster = new eks.Cluster(this, 'Cluster', {
                    ...commonProps,
                    prune: false,
                    kubectlProviderOptions: {
                        kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(this, 'kubectlLayer'),
                    },
                });
            }
        }
        class ManifestStack extends cdk.Stack {
            constructor(scope, id, props) {
                super(scope, id, props);
                // this role creates a dependency between this stack and the cluster stack
                const role = new iam.Role(this, 'CrossRole', {
                    assumedBy: new iam.ServicePrincipal('sqs.amazonaws.com'),
                    roleName: props.cluster.clusterArn,
                });
                // make sure this manifest doesn't create a dependency between the cluster stack
                // and this stack
                new eks.KubernetesManifest(this, 'cross-stack', {
                    manifest: [{
                            kind: 'ConfigMap',
                            apiVersion: 'v1',
                            metadata: {
                                name: 'config-map',
                            },
                            data: {
                                foo: role.roleArn,
                            },
                        }],
                    cluster: props.cluster,
                });
            }
        }
        const { app } = (0, util_1.testFixture)();
        const clusterStack = new ClusterStack(app, 'ClusterStack');
        new ManifestStack(app, 'ManifestStack', { cluster: clusterStack.eksCluster });
        // make sure we can synth (no circular dependencies between the stacks)
        app.synth();
    });
    test('can declare a chart with a token from a different stack than the cluster that depends on the cluster stack', () => {
        class ClusterStack extends cdk.Stack {
            eksCluster;
            constructor(scope, id, props) {
                super(scope, id, props);
                this.eksCluster = new eks.Cluster(this, 'Cluster', {
                    version: CLUSTER_VERSION,
                    prune: false,
                    kubectlProviderOptions: {
                        kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(this, 'kubectlLayer'),
                    },
                });
            }
        }
        class ChartStack extends cdk.Stack {
            constructor(scope, id, props) {
                super(scope, id, props);
                // this role creates a dependency between this stack and the cluster stack
                const role = new iam.Role(this, 'CrossRole', {
                    assumedBy: new iam.ServicePrincipal('sqs.amazonaws.com'),
                    roleName: props.cluster.clusterArn,
                });
                // make sure this chart doesn't create a dependency between the cluster stack
                // and this stack
                new eks.HelmChart(this, 'cross-stack', {
                    chart: role.roleArn,
                    cluster: props.cluster,
                });
            }
        }
        const { app } = (0, util_1.testFixture)();
        const clusterStack = new ClusterStack(app, 'ClusterStack');
        new ChartStack(app, 'ChartStack', { cluster: clusterStack.eksCluster });
        // make sure we can synth (no circular dependencies between the stacks)
        app.synth();
    });
    test('can declare a HelmChart in a different stack than the cluster', () => {
        class ClusterStack extends cdk.Stack {
            eksCluster;
            constructor(scope, id, props) {
                super(scope, id, props);
                this.eksCluster = new eks.Cluster(this, 'Cluster', {
                    version: CLUSTER_VERSION,
                    prune: false,
                    kubectlProviderOptions: {
                        kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(this, 'kubectlLayer'),
                    },
                });
            }
        }
        class ChartStack extends cdk.Stack {
            constructor(scope, id, props) {
                super(scope, id, props);
                const resource = new cdk.CfnResource(this, 'resource', { type: 'MyType' });
                new eks.HelmChart(this, `chart-${id}`, { cluster: props.cluster, chart: resource.ref });
            }
        }
        const { app } = (0, util_1.testFixture)();
        const clusterStack = new ClusterStack(app, 'ClusterStack');
        new ChartStack(app, 'ChartStack', { cluster: clusterStack.eksCluster });
        // make sure we can synth (no circular dependencies between the stacks)
        app.synth();
    });
    test('can declare a ServiceAccount in a different stack than the cluster', () => {
        class ClusterStack extends cdk.Stack {
            eksCluster;
            constructor(scope, id, props) {
                super(scope, id, props);
                this.eksCluster = new eks.Cluster(this, 'EKSCluster', {
                    version: CLUSTER_VERSION,
                    prune: false,
                    kubectlProviderOptions: {
                        kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(this, 'kubectlLayer'),
                    },
                });
            }
        }
        class AppStack extends cdk.Stack {
            constructor(scope, id, props) {
                super(scope, id, props);
                new eks.ServiceAccount(this, 'testAccount', { cluster: props.cluster, name: 'test-account', namespace: 'test' });
            }
        }
        const { app } = (0, util_1.testFixture)();
        const clusterStack = new ClusterStack(app, 'EKSCluster');
        new AppStack(app, 'KubeApp', { cluster: clusterStack.eksCluster });
        // make sure we can synth (no circular dependencies between the stacks)
        app.synth();
    });
    test('a default cluster spans all subnets', () => {
        // GIVEN
        const { stack, vpc } = (0, util_1.testFixture)();
        // WHEN
        new eks.Cluster(stack, 'Cluster', { vpc, ...commonProps, prune: false });
        // THEN
        assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::EKS::Cluster', {
            RoleArn: { 'Fn::GetAtt': ['ClusterRoleFA261979', 'Arn'] },
            Version: CLUSTER_VERSION.version,
            ResourcesVpcConfig: {
                SecurityGroupIds: [{ 'Fn::GetAtt': ['ClusterControlPlaneSecurityGroupD274242C', 'GroupId'] }],
                SubnetIds: [
                    { Ref: 'VPCPublicSubnet1SubnetB4246D30' },
                    { Ref: 'VPCPublicSubnet2Subnet74179F39' },
                    { Ref: 'VPCPrivateSubnet1Subnet8BCA10E0' },
                    { Ref: 'VPCPrivateSubnet2SubnetCFCDAA7A' },
                ],
            },
        });
    });
    test('if "vpc" is not specified, vpc with default configuration will be created', () => {
        // GIVEN
        const { stack } = (0, util_1.testFixtureNoVpc)();
        // WHEN
        new eks.Cluster(stack, 'cluster', { version: CLUSTER_VERSION, prune: false });
        // THEN
        assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::EC2::VPC', assertions_1.Match.anyValue());
    });
    describe('no default capacity as auto mode is implicitly enabled', () => {
        test('no default capacity by default', () => {
            // GIVEN
            const { stack } = (0, util_1.testFixtureNoVpc)();
            // WHEN
            const cluster = new eks.Cluster(stack, 'cluster', { version: CLUSTER_VERSION, prune: false });
            // THEN
            expect(cluster.defaultNodegroup).toBeUndefined();
            assertions_1.Template.fromStack(stack).resourceCountIs('AWS::EKS::Nodegroup', 0);
        });
        test('quantity and type can be customized', () => {
            // GIVEN
            const { stack } = (0, util_1.testFixtureNoVpc)();
            // WHEN
            const cluster = new eks.Cluster(stack, 'cluster', {
                defaultCapacityType: eks.DefaultCapacityType.NODEGROUP,
                defaultCapacity: 10,
                defaultCapacityInstance: new ec2.InstanceType('m2.xlarge'),
                version: CLUSTER_VERSION,
                prune: false,
            });
            // THEN
            expect(cluster.defaultNodegroup).toBeDefined();
            assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::EKS::Nodegroup', {
                ScalingConfig: {
                    DesiredSize: 10,
                    MaxSize: 10,
                    MinSize: 10,
                },
            });
            // expect(stack).toHaveResource('AWS::AutoScaling::LaunchConfiguration', { InstanceType: 'm2.xlarge' }));
        });
        test('defaultCapacity=0 will not allocate at all', () => {
            // GIVEN
            const { stack } = (0, util_1.testFixtureNoVpc)();
            // WHEN
            const cluster = new eks.Cluster(stack, 'cluster', {
                ...commonProps,
                prune: false,
            });
            // THEN
            expect(cluster.defaultCapacity).toBeUndefined();
            assertions_1.Template.fromStack(stack).resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 0);
            assertions_1.Template.fromStack(stack).resourceCountIs('AWS::AutoScaling::LaunchConfiguration', 0);
        });
    });
    test('creating a cluster tags the private VPC subnets', () => {
        // GIVEN
        const { stack, vpc } = (0, util_1.testFixture)();
        // WHEN
        new eks.Cluster(stack, 'Cluster', {
            vpc,
            ...commonProps,
            prune: false,
        });
        // THEN
        assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::EC2::Subnet', {
            Tags: [
                { Key: 'aws-cdk:subnet-name', Value: 'Private' },
                { Key: 'aws-cdk:subnet-type', Value: 'Private' },
                { Key: 'kubernetes.io/role/internal-elb', Value: '1' },
                { Key: 'Name', Value: 'Stack/VPC/PrivateSubnet1' },
            ],
        });
    });
    test('creating a cluster tags the public VPC subnets', () => {
        // GIVEN
        const { stack, vpc } = (0, util_1.testFixture)();
        // WHEN
        new eks.Cluster(stack, 'Cluster', {
            vpc,
            ...commonProps,
            prune: false,
        });
        // THEN
        assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::EC2::Subnet', {
            MapPublicIpOnLaunch: true,
            Tags: [
                { Key: 'aws-cdk:subnet-name', Value: 'Public' },
                { Key: 'aws-cdk:subnet-type', Value: 'Public' },
                { Key: 'kubernetes.io/role/elb', Value: '1' },
                { Key: 'Name', Value: 'Stack/VPC/PublicSubnet1' },
            ],
        });
    });
    test('adding capacity creates an ASG without a rolling update policy', () => {
        // GIVEN
        const { stack, vpc } = (0, util_1.testFixture)();
        const cluster = new eks.Cluster(stack, 'Cluster', {
            vpc,
            ...commonProps,
            prune: false,
        });
        // WHEN
        cluster.addAutoScalingGroupCapacity('Default', {
            instanceType: new ec2.InstanceType('t2.medium'),
        });
        assertions_1.Template.fromStack(stack).hasResource('AWS::AutoScaling::AutoScalingGroup', {
            UpdatePolicy: { AutoScalingScheduledAction: { IgnoreUnmodifiedGroupSizeProperties: true } },
        });
    });
    test('adding capacity creates an ASG with tags', () => {
        // GIVEN
        const { stack, vpc } = (0, util_1.testFixture)();
        const cluster = new eks.Cluster(stack, 'Cluster', {
            vpc,
            ...commonProps,
            prune: false,
        });
        // WHEN
        cluster.addAutoScalingGroupCapacity('Default', {
            instanceType: new ec2.InstanceType('t2.medium'),
        });
        // THEN
        assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
            Tags: [
                {
                    Key: { 'Fn::Join': ['', ['kubernetes.io/cluster/', { Ref: 'ClusterEB0386A7' }]] },
                    PropagateAtLaunch: true,
                    Value: 'owned',
                },
                {
                    Key: 'Name',
                    PropagateAtLaunch: true,
                    Value: 'Stack/Cluster/Default',
                },
            ],
        });
    });
    test('create nodegroup with existing role', () => {
        // GIVEN
        const { stack } = (0, util_1.testFixtureNoVpc)();
        // WHEN
        const cluster = new eks.Cluster(stack, 'cluster', {
            defaultCapacityType: eks.DefaultCapacityType.NODEGROUP,
            defaultCapacity: 10,
            defaultCapacityInstance: new ec2.InstanceType('m2.xlarge'),
            version: CLUSTER_VERSION,
            prune: false,
        });
        const existingRole = new iam.Role(stack, 'ExistingRole', {
            assumedBy: new iam.AccountRootPrincipal(),
        });
        new eks.Nodegroup(stack, 'Nodegroup', {
            cluster,
            nodeRole: existingRole,
        });
        // THEN
        expect(cluster.defaultNodegroup).toBeDefined();
        assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::EKS::Nodegroup', {
            ScalingConfig: {
                DesiredSize: 10,
                MaxSize: 10,
                MinSize: 10,
            },
        });
    });
    test('adding bottlerocket capacity creates an ASG with tags', () => {
        // GIVEN
        const { stack, vpc } = (0, util_1.testFixture)();
        const cluster = new eks.Cluster(stack, 'Cluster', {
            vpc,
            ...commonProps,
            prune: false,
        });
        // WHEN
        cluster.addAutoScalingGroupCapacity('Bottlerocket', {
            instanceType: new ec2.InstanceType('t2.medium'),
            machineImageType: eks.MachineImageType.BOTTLEROCKET,
        });
        // THEN
        assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
            Tags: [
                {
                    Key: { 'Fn::Join': ['', ['kubernetes.io/cluster/', { Ref: 'ClusterEB0386A7' }]] },
                    PropagateAtLaunch: true,
                    Value: 'owned',
                },
                {
                    Key: 'Name',
                    PropagateAtLaunch: true,
                    Value: 'Stack/Cluster/Bottlerocket',
                },
            ],
        });
    });
    test('adding bottlerocket capacity with bootstrapOptions throws error', () => {
        // GIVEN
        const { stack, vpc } = (0, util_1.testFixture)();
        const cluster = new eks.Cluster(stack, 'Cluster', {
            vpc,
            ...commonProps,
            prune: false,
        });
        expect(() => cluster.addAutoScalingGroupCapacity('Bottlerocket', {
            instanceType: new ec2.InstanceType('t2.medium'),
            machineImageType: eks.MachineImageType.BOTTLEROCKET,
            bootstrapOptions: {},
        })).toThrow(/bootstrapOptions is not supported for Bottlerocket/);
    });
    test('import cluster with existing kubectl provider function', () => {
        const { stack } = (0, util_1.testFixture)();
        const handlerRole = iam.Role.fromRoleArn(stack, 'HandlerRole', 'arn:aws:iam::123456789012:role/lambda-role');
        const kubectlProvider = kubectl_provider_1.KubectlProvider.fromKubectlProviderAttributes(stack, 'KubectlProvider', {
            serviceToken: 'arn:aws:lambda:us-east-2:123456789012:function:my-function:1',
            role: handlerRole,
        });
        const cluster = eks.Cluster.fromClusterAttributes(stack, 'Cluster', {
            clusterName: 'cluster',
            kubectlProvider: kubectlProvider,
        });
        expect(cluster.kubectlProvider).toEqual(kubectlProvider);
    });
    describe('import cluster with existing kubectl provider function should work as expected with resources relying on kubectl getOrCreate', () => {
        test('creates helm chart', () => {
            const { stack } = (0, util_1.testFixture)();
            const handlerRole = iam.Role.fromRoleArn(stack, 'HandlerRole', 'arn:aws:iam::123456789012:role/lambda-role');
            const kubectlProvider = kubectl_provider_1.KubectlProvider.fromKubectlProviderAttributes(stack, 'KubectlProvider', {
                serviceToken: 'arn:aws:lambda:us-east-2:123456789012:function:my-function:1',
                role: handlerRole,
            });
            const cluster = eks.Cluster.fromClusterAttributes(stack, 'Cluster', {
                clusterName: 'cluster',
                kubectlProvider: kubectlProvider,
            });
            new eks.HelmChart(stack, 'Chart', {
                cluster: cluster,
                chart: 'chart',
            });
            assertions_1.Template.fromStack(stack).hasResourceProperties('Custom::AWSCDK-EKS-HelmChart', {
                ServiceToken: kubectlProvider.serviceToken,
            });
        });
        test('creates Kubernetes patch', () => {
            const { stack } = (0, util_1.testFixture)();
            const handlerRole = iam.Role.fromRoleArn(stack, 'HandlerRole', 'arn:aws:iam::123456789012:role/lambda-role');
            const kubectlProvider = kubectl_provider_1.KubectlProvider.fromKubectlProviderAttributes(stack, 'KubectlProvider', {
                serviceToken: 'arn:aws:lambda:us-east-2:123456789012:function:my-function:1',
                role: handlerRole,
            });
            const cluster = eks.Cluster.fromClusterAttributes(stack, 'Cluster', {
                clusterName: 'cluster',
                kubectlProvider: kubectlProvider,
            });
            new eks.HelmChart(stack, 'Chart', {
                cluster: cluster,
                chart: 'chart',
            });
            new eks.KubernetesPatch(stack, 'Patch', {
                cluster: cluster,
                applyPatch: {},
                restorePatch: {},
                resourceName: 'PatchResource',
            });
            assertions_1.Template.fromStack(stack).hasResourceProperties('Custom::AWSCDK-EKS-KubernetesPatch', {
                ServiceToken: kubectlProvider.serviceToken,
            });
        });
        test('creates Kubernetes object value', () => {
            const { stack } = (0, util_1.testFixture)();
            const handlerRole = iam.Role.fromRoleArn(stack, 'HandlerRole', 'arn:aws:iam::123456789012:role/lambda-role');
            const kubectlProvider = kubectl_provider_1.KubectlProvider.fromKubectlProviderAttributes(stack, 'KubectlProvider', {
                serviceToken: 'arn:aws:lambda:us-east-2:123456789012:function:my-function:1',
                role: handlerRole,
            });
            const cluster = eks.Cluster.fromClusterAttributes(stack, 'Cluster', {
                clusterName: 'cluster',
                kubectlProvider: kubectlProvider,
            });
            new eks.HelmChart(stack, 'Chart', {
                cluster: cluster,
                chart: 'chart',
            });
            new eks.KubernetesPatch(stack, 'Patch', {
                cluster: cluster,
                applyPatch: {},
                restorePatch: {},
                resourceName: 'PatchResource',
            });
            new eks.KubernetesManifest(stack, 'Manifest', {
                cluster: cluster,
                manifest: [],
            });
            new eks.KubernetesObjectValue(stack, 'ObjectValue', {
                cluster: cluster,
                jsonPath: '',
                objectName: 'name',
                objectType: 'type',
            });
            assertions_1.Template.fromStack(stack).hasResourceProperties('Custom::AWSCDK-EKS-KubernetesObjectValue', {
                ServiceToken: kubectlProvider.serviceToken,
            });
            expect(cluster.kubectlProvider).not.toBeInstanceOf(eks.KubectlProvider);
        });
    });
    test('exercise export/import', () => {
        // GIVEN
        const { stack: stack1, vpc, app } = (0, util_1.testFixture)();
        const stack2 = new cdk.Stack(app, 'stack2', { env: { region: 'us-east-1' } });
        const cluster = new eks.Cluster(stack1, 'Cluster', {
            vpc,
            ...commonProps,
            prune: false,
        });
        // WHEN
        const imported = eks.Cluster.fromClusterAttributes(stack2, 'Imported', {
            vpc: cluster.vpc,
            clusterEndpoint: cluster.clusterEndpoint,
            clusterName: cluster.clusterName,
            securityGroupIds: cluster.connections.securityGroups.map(x => x.securityGroupId),
            clusterCertificateAuthorityData: cluster.clusterCertificateAuthorityData,
            clusterSecurityGroupId: cluster.clusterSecurityGroupId,
            clusterEncryptionConfigKeyArn: cluster.clusterEncryptionConfigKeyArn,
        });
        // this should cause an export/import
        new cdk.CfnOutput(stack2, 'ClusterARN', { value: imported.clusterArn });
        // THEN
        assertions_1.Template.fromStack(stack2).templateMatches({
            Outputs: {
                ClusterARN: {
                    Value: {
                        'Fn::Join': [
                            '',
                            [
                                'arn:',
                                {
                                    Ref: 'AWS::Partition',
                                },
                                ':eks:us-east-1:',
                                {
                                    Ref: 'AWS::AccountId',
                                },
                                ':cluster/',
                                {
                                    'Fn::ImportValue': 'Stack:ExportsOutputRefClusterEB0386A796A0E3FE',
                                },
                            ],
                        ],
                    },
                },
            },
        });
    });
    test('addManifest can be used to apply k8s manifests on this cluster', () => {
        // GIVEN
        const { stack, vpc } = (0, util_1.testFixture)();
        const cluster = new eks.Cluster(stack, 'Cluster', {
            vpc,
            ...commonProps,
            prune: false,
            kubectlProviderOptions: {
                kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(stack, 'kubectlLayer'),
            },
        });
        // WHEN
        cluster.addManifest('manifest1', { foo: 123 });
        cluster.addManifest('manifest2', { bar: 123 }, { boor: [1, 2, 3] });
        // THEN
        assertions_1.Template.fromStack(stack).hasResourceProperties(eks.KubernetesManifest.RESOURCE_TYPE, {
            Manifest: '[{"foo":123}]',
        });
        assertions_1.Template.fromStack(stack).hasResourceProperties(eks.KubernetesManifest.RESOURCE_TYPE, {
            Manifest: '[{"bar":123},{"boor":[1,2,3]}]',
        });
    });
    test('kubectl resources can be created in a separate stack', () => {
        // GIVEN
        const { stack, app } = (0, util_1.testFixture)();
        const cluster = new eks.Cluster(stack, 'cluster', {
            version: CLUSTER_VERSION,
            prune: false,
            kubectlProviderOptions: {
                kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(stack, 'kubectlLayer'),
            },
        }); // cluster is under stack2
        // WHEN resource is under stack2
        const stack2 = new cdk.Stack(app, 'stack2', { env: { account: stack.account, region: stack.region } });
        new eks.KubernetesManifest(stack2, 'myresource', {
            cluster,
            manifest: [{ foo: 'bar' }],
        });
        // THEN
        app.synth(); // no cyclic dependency (see https://github.com/aws/aws-cdk/issues/7231)
        // expect a single resource in the 2nd stack
        assertions_1.Template.fromStack(stack2).templateMatches({
            Resources: {
                myresource49C6D325: {
                    Type: 'Custom::AWSCDK-EKS-KubernetesResource',
                    Properties: {
                        ServiceToken: {
                            'Fn::ImportValue': 'Stack:ExportsOutputFnGetAttclusterKubectlProviderframeworkonEvent7E8470F1Arn6086AAA4',
                        },
                        Manifest: '[{\"foo\":\"bar\"}]',
                        ClusterName: { 'Fn::ImportValue': 'Stack:ExportsOutputRefcluster611F8AFFA07FC079' },
                    },
                    UpdateReplacePolicy: 'Delete',
                    DeletionPolicy: 'Delete',
                },
            },
        });
    });
    describe('outputs', () => {
        test('no outputs are synthesized by default', () => {
            // GIVEN
            const { app, stack } = (0, util_1.testFixtureNoVpc)();
            // WHEN
            new eks.Cluster(stack, 'Cluster', { version: CLUSTER_VERSION, prune: false });
            // THEN
            const assembly = app.synth();
            const template = assembly.getStackByName(stack.stackName).template;
            expect(template.Outputs).toBeUndefined(); // no outputs
        });
        describe('boostrap user-data', () => {
            test('rendered by default for ASGs', () => {
                // GIVEN
                const { app, stack } = (0, util_1.testFixtureNoVpc)();
                const cluster = new eks.Cluster(stack, 'Cluster', {
                    ...commonProps,
                    prune: false,
                });
                // WHEN
                cluster.addAutoScalingGroupCapacity('MyCapcity', { instanceType: new ec2.InstanceType('m3.xlargs') });
                // THEN
                const template = app.synth().getStackByName(stack.stackName).template;
                const userData = template.Resources.ClusterMyCapcityLaunchConfig58583345.Properties.UserData;
                expect(userData).toEqual({ 'Fn::Base64': { 'Fn::Join': ['', ['#!/bin/bash\nset -o xtrace\n/etc/eks/bootstrap.sh ', { Ref: 'ClusterEB0386A7' }, ' --kubelet-extra-args "--node-labels lifecycle=OnDemand" --apiserver-endpoint \'', { 'Fn::GetAtt': ['ClusterEB0386A7', 'Endpoint'] }, '\' --b64-cluster-ca \'', { 'Fn::GetAtt': ['ClusterEB0386A7', 'CertificateAuthorityData'] }, '\' --use-max-pods true\n/opt/aws/bin/cfn-signal --exit-code $? --stack Stack --resource ClusterMyCapcityASGD4CD8B97 --region us-east-1']] } });
            });
            test('not rendered if bootstrap is disabled', () => {
                // GIVEN
                const { app, stack } = (0, util_1.testFixtureNoVpc)();
                const cluster = new eks.Cluster(stack, 'Cluster', {
                    ...commonProps,
                    prune: false,
                });
                // WHEN
                cluster.addAutoScalingGroupCapacity('MyCapcity', {
                    instanceType: new ec2.InstanceType('m3.xlargs'),
                    bootstrapEnabled: false,
                });
                // THEN
                const template = app.synth().getStackByName(stack.stackName).template;
                const userData = template.Resources.ClusterMyCapcityLaunchConfig58583345.Properties.UserData;
                expect(userData).toEqual({ 'Fn::Base64': '#!/bin/bash' });
            });
            // cursory test for options: see test.user-data.ts for full suite
            test('bootstrap options', () => {
                // GIVEN
                const { app, stack } = (0, util_1.testFixtureNoVpc)();
                const cluster = new eks.Cluster(stack, 'Cluster', {
                    ...commonProps,
                    prune: false,
                });
                // WHEN
                cluster.addAutoScalingGroupCapacity('MyCapcity', {
                    instanceType: new ec2.InstanceType('m3.xlargs'),
                    bootstrapOptions: {
                        kubeletExtraArgs: '--node-labels FOO=42',
                    },
                });
                // THEN
                const template = app.synth().getStackByName(stack.stackName).template;
                const userData = template.Resources.ClusterMyCapcityLaunchConfig58583345.Properties.UserData;
                expect(userData).toEqual({ 'Fn::Base64': { 'Fn::Join': ['', ['#!/bin/bash\nset -o xtrace\n/etc/eks/bootstrap.sh ', { Ref: 'ClusterEB0386A7' }, ' --kubelet-extra-args "--node-labels lifecycle=OnDemand  --node-labels FOO=42" --apiserver-endpoint \'', { 'Fn::GetAtt': ['ClusterEB0386A7', 'Endpoint'] }, '\' --b64-cluster-ca \'', { 'Fn::GetAtt': ['ClusterEB0386A7', 'CertificateAuthorityData'] }, '\' --use-max-pods true\n/opt/aws/bin/cfn-signal --exit-code $? --stack Stack --resource ClusterMyCapcityASGD4CD8B97 --region us-east-1']] } });
            });
            describe('spot instances', () => {
                test('nodes labeled an tainted accordingly', () => {
                    // GIVEN
                    const { app, stack } = (0, util_1.testFixtureNoVpc)();
                    const cluster = new eks.Cluster(stack, 'Cluster', {
                        ...commonProps,
                        prune: false,
                        kubectlProviderOptions: {
                            kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(stack, 'kubectlLayer'),
                        },
                    });
                    // WHEN
                    cluster.addAutoScalingGroupCapacity('MyCapcity', {
                        instanceType: new ec2.InstanceType('m3.xlargs'),
                        spotPrice: '0.01',
                    });
                    // THEN
                    const template = app.synth().getStackByName(stack.stackName).template;
                    const userData = template.Resources.ClusterMyCapcityLaunchConfig58583345.Properties.UserData;
                    expect(userData).toEqual({ 'Fn::Base64': { 'Fn::Join': ['', ['#!/bin/bash\nset -o xtrace\n/etc/eks/bootstrap.sh ', { Ref: 'ClusterEB0386A7' }, ' --kubelet-extra-args "--node-labels lifecycle=Ec2Spot --register-with-taints=spotInstance=true:PreferNoSchedule" --apiserver-endpoint \'', { 'Fn::GetAtt': ['ClusterEB0386A7', 'Endpoint'] }, '\' --b64-cluster-ca \'', { 'Fn::GetAtt': ['ClusterEB0386A7', 'CertificateAuthorityData'] }, '\' --use-max-pods true\n/opt/aws/bin/cfn-signal --exit-code $? --stack Stack --resource ClusterMyCapcityASGD4CD8B97 --region us-east-1']] } });
                });
            });
        });
        test('if bootstrap is disabled cannot specify options', () => {
            // GIVEN
            const { stack } = (0, util_1.testFixtureNoVpc)();
            const cluster = new eks.Cluster(stack, 'Cluster', {
                ...commonProps,
                prune: false,
            });
            // THEN
            expect(() => cluster.addAutoScalingGroupCapacity('MyCapcity', {
                instanceType: new ec2.InstanceType('m3.xlargs'),
                bootstrapEnabled: false,
                bootstrapOptions: { awsApiRetryAttempts: 10 },
            })).toThrow(/Cannot specify "bootstrapOptions" if "bootstrapEnabled" is false/);
        });
        test('EksOptimizedImage() with no nodeType always uses STANDARD with LATEST_KUBERNETES_VERSION', () => {
            // GIVEN
            const { app, stack } = (0, util_1.testFixtureNoVpc)();
            const LATEST_KUBERNETES_VERSION = '1.24';
            // WHEN
            new eks.EksOptimizedImage().getImage(stack);
            // THEN
            const assembly = app.synth();
            const parameters = assembly.getStackByName(stack.stackName).template.Parameters;
            expect(Object.entries(parameters).some(([k, v]) => k.startsWith('SsmParameterValueawsserviceeksoptimizedami') &&
                v.Default.includes('/amazon-linux-2/'))).toEqual(true);
            expect(Object.entries(parameters).some(([k, v]) => k.startsWith('SsmParameterValueawsserviceeksoptimizedami') &&
                v.Default.includes(LATEST_KUBERNETES_VERSION))).toEqual(true);
        });
        test('EksOptimizedImage() with specific kubernetesVersion return correct AMI', () => {
            // GIVEN
            const { app, stack } = (0, util_1.testFixtureNoVpc)();
            // WHEN
            new eks.EksOptimizedImage({ kubernetesVersion: CLUSTER_VERSION.version }).getImage(stack);
            // THEN
            const assembly = app.synth();
            const parameters = assembly.getStackByName(stack.stackName).template.Parameters;
            expect(Object.entries(parameters).some(([k, v]) => k.startsWith('SsmParameterValueawsserviceeksoptimizedami') &&
                v.Default.includes('/amazon-linux-2/'))).toEqual(true);
            expect(Object.entries(parameters).some(([k, v]) => k.startsWith('SsmParameterValueawsserviceeksoptimizedami') &&
                v.Default.includes('/1.33/'))).toEqual(true);
        });
        test('default cluster capacity with ARM64 instance type comes with nodegroup with correct AmiType', () => {
            // GIVEN
            const { stack } = (0, util_1.testFixtureNoVpc)();
            // WHEN
            new eks.Cluster(stack, 'cluster', {
                defaultCapacityType: eks.DefaultCapacityType.NODEGROUP,
                defaultCapacity: 1,
                version: CLUSTER_VERSION,
                prune: false,
                defaultCapacityInstance: new ec2.InstanceType('m6g.medium'),
            });
            // THEN
            assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::EKS::Nodegroup', {
                AmiType: 'AL2_ARM_64',
            });
        });
        test('addNodegroup with ARM64 instance type comes with nodegroup with correct AmiType', () => {
            // GIVEN
            const { stack } = (0, util_1.testFixtureNoVpc)();
            // WHEN
            new eks.Cluster(stack, 'cluster', {
                ...commonProps,
                prune: false,
                defaultCapacityInstance: new ec2.InstanceType('m6g.medium'),
            }).addNodegroupCapacity('ng', {
                instanceTypes: [new ec2.InstanceType('m6g.medium')],
            });
            // THEN
            assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::EKS::Nodegroup', {
                AmiType: 'AL2_ARM_64',
            });
        });
        test('addNodegroupCapacity with T4g instance type comes with nodegroup with correct AmiType', () => {
            // GIVEN
            const { stack } = (0, util_1.testFixtureNoVpc)();
            // WHEN
            new eks.Cluster(stack, 'cluster', {
                ...commonProps,
                prune: false,
                defaultCapacityInstance: new ec2.InstanceType('t4g.medium'),
            }).addNodegroupCapacity('ng', {
                instanceTypes: [new ec2.InstanceType('t4g.medium')],
            });
            // THEN
            assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::EKS::Nodegroup', {
                AmiType: 'AL2_ARM_64',
            });
        });
        test('addAutoScalingGroupCapacity with T4g instance type comes with nodegroup with correct AmiType', () => {
            // GIVEN
            const { app, stack } = (0, util_1.testFixtureNoVpc)();
            // WHEN
            new eks.Cluster(stack, 'cluster', {
                ...commonProps,
                prune: false,
            }).addAutoScalingGroupCapacity('ng', {
                instanceType: new ec2.InstanceType('t4g.medium'),
            });
            // THEN
            const assembly = app.synth();
            const parameters = assembly.getStackByName(stack.stackName).template.Parameters;
            expect(Object.entries(parameters).some(([k, v]) => k.startsWith('SsmParameterValueawsserviceeksoptimizedami') &&
                v.Default.includes('amazon-linux-2-arm64/'))).toEqual(true);
        });
        test('addNodegroupCapacity with C7g instance type comes with nodegroup with correct AmiType', () => {
            // GIVEN
            const { stack } = (0, util_1.testFixtureNoVpc)();
            // WHEN
            new eks.Cluster(stack, 'cluster', {
                ...commonProps,
                prune: false,
                defaultCapacityInstance: new ec2.InstanceType('c7g.large'),
            }).addNodegroupCapacity('ng', {
                instanceTypes: [new ec2.InstanceType('c7g.large')],
            });
            // THEN
            assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::EKS::Nodegroup', {
                AmiType: 'AL2_ARM_64',
            });
        });
        test('addAutoScalingGroupCapacity with C7g instance type comes with nodegroup with correct AmiType', () => {
            // GIVEN
            const { app, stack } = (0, util_1.testFixtureNoVpc)();
            // WHEN
            new eks.Cluster(stack, 'cluster', {
                ...commonProps,
                prune: false,
            }).addAutoScalingGroupCapacity('ng', {
                instanceType: new ec2.InstanceType('c7g.large'),
            });
            // THEN
            const assembly = app.synth();
            const parameters = assembly.getStackByName(stack.stackName).template.Parameters;
            expect(Object.entries(parameters).some(([k, v]) => k.startsWith('SsmParameterValueawsserviceeksoptimizedami') &&
                v.Default.includes('amazon-linux-2-arm64/'))).toEqual(true);
        });
        test('EKS-Optimized AMI with GPU support when addAutoScalingGroupCapacity', () => {
            // GIVEN
            const { app, stack } = (0, util_1.testFixtureNoVpc)();
            // WHEN
            new eks.Cluster(stack, 'cluster', {
                ...commonProps,
                prune: false,
            }).addAutoScalingGroupCapacity('GPUCapacity', {
                instanceType: new ec2.InstanceType('g4dn.xlarge'),
            });
            // THEN
            const assembly = app.synth();
            const parameters = assembly.getStackByName(stack.stackName).template.Parameters;
            expect(Object.entries(parameters).some(([k, v]) => k.startsWith('SsmParameterValueawsserviceeksoptimizedami') && v.Default.includes('amazon-linux-2-gpu'))).toEqual(true);
        });
        test('EKS-Optimized AMI with ARM64 when addAutoScalingGroupCapacity', () => {
            // GIVEN
            const { app, stack } = (0, util_1.testFixtureNoVpc)();
            // WHEN
            new eks.Cluster(stack, 'cluster', {
                ...commonProps,
                prune: false,
            }).addAutoScalingGroupCapacity('ARMCapacity', {
                instanceType: new ec2.InstanceType('m6g.medium'),
            });
            // THEN
            const assembly = app.synth();
            const parameters = assembly.getStackByName(stack.stackName).template.Parameters;
            expect(Object.entries(parameters).some(([k, v]) => k.startsWith('SsmParameterValueawsserviceeksoptimizedami') && v.Default.includes('/amazon-linux-2-arm64/'))).toEqual(true);
        });
        test('BottleRocketImage() with specific kubernetesVersion return correct AMI', () => {
            // GIVEN
            const { app, stack } = (0, util_1.testFixtureNoVpc)();
            // WHEN
            new bottlerocket_1.BottleRocketImage({ kubernetesVersion: CLUSTER_VERSION.version }).getImage(stack);
            // THEN
            const assembly = app.synth();
            const parameters = assembly.getStackByName(stack.stackName).template.Parameters;
            expect(Object.entries(parameters).some(([k, v]) => k.startsWith('SsmParameterValueawsservicebottlerocketaws') &&
                v.Default.includes('/bottlerocket/'))).toEqual(true);
            expect(Object.entries(parameters).some(([k, v]) => k.startsWith('SsmParameterValueawsservicebottlerocketaws') &&
                v.Default.includes('/aws-k8s-1.33/'))).toEqual(true);
        });
        test('coreDnsComputeType will patch the coreDNS configuration to use a "fargate" compute type and restore to "ec2" upon removal', () => {
            // GIVEN
            const stack = new cdk.Stack();
            // WHEN
            new eks.Cluster(stack, 'MyCluster', {
                coreDnsComputeType: eks.CoreDnsComputeType.FARGATE,
                version: CLUSTER_VERSION,
                prune: false,
                kubectlProviderOptions: {
                    kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(stack, 'kubectlLayer'),
                },
            });
            // THEN
            assertions_1.Template.fromStack(stack).hasResourceProperties('Custom::AWSCDK-EKS-KubernetesPatch', {
                ResourceName: 'deployment/coredns',
                ResourceNamespace: 'kube-system',
                ApplyPatchJson: '{"spec":{"template":{"metadata":{"annotations":{"eks.amazonaws.com/compute-type":"fargate"}}}}}',
                RestorePatchJson: '{"spec":{"template":{"metadata":{"annotations":{"eks.amazonaws.com/compute-type":"ec2"}}}}}',
                ClusterName: {
                    Ref: 'MyCluster4C1BA579',
                },
            });
        });
        test('if openIDConnectProvider a new OpenIDConnectProvider resource is created and exposed', () => {
            // GIVEN
            const { stack } = (0, util_1.testFixtureNoVpc)();
            const cluster = new eks.Cluster(stack, 'Cluster', {
                ...commonProps,
                prune: false,
            });
            // WHEN
            const provider = cluster.openIdConnectProvider;
            // THEN
            expect(provider).toEqual(cluster.openIdConnectProvider);
            assertions_1.Template.fromStack(stack).hasResourceProperties('Custom::AWSCDKOpenIdConnectProvider', {
                ServiceToken: {
                    'Fn::GetAtt': [
                        'CustomAWSCDKOpenIdConnectProviderCustomResourceProviderHandlerF2C543E0',
                        'Arn',
                    ],
                },
                ClientIDList: [
                    'sts.amazonaws.com',
                ],
                Url: {
                    'Fn::GetAtt': [
                        'ClusterEB0386A7',
                        'OpenIdConnectIssuerUrl',
                    ],
                },
            });
        });
        test('if EKS_USE_NATIVE_OIDC_PROVIDER feature flag is enabled, uses native OIDC provider', () => {
            // GIVEN
            const { stack } = (0, util_1.testFixtureNoVpc)();
            stack.node.setContext('@aws-cdk/aws-eks:useNativeOidcProvider', true);
            const cluster = new eks.Cluster(stack, 'Cluster', {
                ...commonProps,
                prune: false,
            });
            // WHEN
            cluster.openIdConnectProvider;
            // THEN
            assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::IAM::OIDCProvider', {
                ClientIdList: [
                    'sts.amazonaws.com',
                ],
                Url: {
                    'Fn::GetAtt': [
                        'ClusterEB0386A7',
                        'OpenIdConnectIssuerUrl',
                    ],
                },
            });
        });
        test('if EKS_USE_NATIVE_OIDC_PROVIDER feature flag is disabled, uses custom resource OIDC provider', () => {
            // GIVEN
            const { stack } = (0, util_1.testFixtureNoVpc)();
            const cluster = new eks.Cluster(stack, 'Cluster', {
                ...commonProps,
                prune: false,
            });
            // WHEN
            cluster.openIdConnectProvider;
            // THEN
            assertions_1.Template.fromStack(stack).hasResourceProperties('Custom::AWSCDKOpenIdConnectProvider', {
                ClientIDList: [
                    'sts.amazonaws.com',
                ],
                Url: {
                    'Fn::GetAtt': [
                        'ClusterEB0386A7',
                        'OpenIdConnectIssuerUrl',
                    ],
                },
            });
        });
        test('cluster can be used with both OidcProviderNative and OpenIdConnectProvider', () => {
            const { stack } = (0, util_1.testFixtureNoVpc)();
            const importedClusterOldProvider = eks.Cluster.fromClusterAttributes(stack, 'ImportedClusterOld', {
                clusterName: 'my-cluster',
                openIdConnectProvider: eks.OpenIdConnectProvider.fromOpenIdConnectProviderArn(stack, 'ImportedOidcProviderOld', 'arn:aws:iam::123456789012:oidc-provider/oidc.eks.us-west-2.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E'),
            });
            expect(importedClusterOldProvider.openIdConnectProvider.oidcProviderRef.oidcProviderArn).toBeDefined();
            expect(importedClusterOldProvider.openIdConnectProvider.openIdConnectProviderIssuer).toBeDefined();
            expect(importedClusterOldProvider.openIdConnectProvider.openIdConnectProviderArn).toBeDefined();
            const importedClusterNativeProvider = eks.Cluster.fromClusterAttributes(stack, 'ImportedClusterNative', {
                clusterName: 'my-cluster',
                openIdConnectProvider: eks.OidcProviderNative.fromOidcProviderArn(stack, 'ImportedOidcProviderNative', 'arn:aws:iam::123456789012:oidc-provider/oidc.eks.us-west-2.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E'),
            });
            expect(importedClusterNativeProvider.openIdConnectProvider.oidcProviderRef.oidcProviderArn).toBeDefined();
            expect(importedClusterNativeProvider.openIdConnectProvider.openIdConnectProviderIssuer).toBeDefined();
            expect(importedClusterNativeProvider.openIdConnectProvider.openIdConnectProviderArn).toBeDefined();
        });
        test('inf1 instances are supported', () => {
            // GIVEN
            const { stack } = (0, util_1.testFixtureNoVpc)();
            const cluster = new eks.Cluster(stack, 'Cluster', {
                ...commonProps,
                prune: false,
                kubectlProviderOptions: {
                    kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(stack, 'kubectlLayer'),
                },
            });
            // WHEN
            cluster.addAutoScalingGroupCapacity('InferenceInstances', {
                instanceType: new ec2.InstanceType('inf1.2xlarge'),
                minCapacity: 1,
            });
            const fileContents = fs.readFileSync(path.join(__dirname, '..', 'lib', 'addons', 'neuron-device-plugin.yaml'), 'utf8');
            const sanitized = YAML.parse(fileContents);
            // THEN
            assertions_1.Template.fromStack(stack).hasResourceProperties(eks.KubernetesManifest.RESOURCE_TYPE, {
                Manifest: JSON.stringify([sanitized]),
            });
        });
        test('inf2 instances are supported', () => {
            // GIVEN
            const { stack } = (0, util_1.testFixtureNoVpc)();
            const cluster = new eks.Cluster(stack, 'Cluster', {
                ...commonProps,
                prune: false,
                kubectlProviderOptions: {
                    kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(stack, 'kubectlLayer'),
                },
            });
            // WHEN
            cluster.addAutoScalingGroupCapacity('InferenceInstances', {
                instanceType: new ec2.InstanceType('inf2.xlarge'),
                minCapacity: 1,
            });
            const fileContents = fs.readFileSync(path.join(__dirname, '..', 'lib', 'addons', 'neuron-device-plugin.yaml'), 'utf8');
            const sanitized = YAML.parse(fileContents);
            // THEN
            assertions_1.Template.fromStack(stack).hasResourceProperties(eks.KubernetesManifest.RESOURCE_TYPE, {
                Manifest: JSON.stringify([sanitized]),
            });
        });
        test('trn1 instances are supported', () => {
            // GIVEN
            const { stack } = (0, util_1.testFixtureNoVpc)();
            const cluster = new eks.Cluster(stack, 'Cluster', {
                ...commonProps,
                prune: false,
                kubectlProviderOptions: {
                    kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(stack, 'kubectlLayer'),
                },
            });
            // WHEN
            cluster.addAutoScalingGroupCapacity('TrainiumInstances', {
                instanceType: new ec2.InstanceType('trn1.2xlarge'),
                minCapacity: 1,
            });
            const fileContents = fs.readFileSync(path.join(__dirname, '..', 'lib', 'addons', 'neuron-device-plugin.yaml'), 'utf8');
            const sanitized = YAML.parse(fileContents);
            // THEN
            assertions_1.Template.fromStack(stack).hasResourceProperties(eks.KubernetesManifest.RESOURCE_TYPE, {
                Manifest: JSON.stringify([sanitized]),
            });
        });
        test('trn1n instances are supported', () => {
            // GIVEN
            const { stack } = (0, util_1.testFixtureNoVpc)();
            const cluster = new eks.Cluster(stack, 'Cluster', {
                ...commonProps,
                prune: false,
                kubectlProviderOptions: {
                    kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(stack, 'kubectlLayer'),
                },
            });
            // WHEN
            cluster.addAutoScalingGroupCapacity('TrainiumInstances', {
                instanceType: new ec2.InstanceType('trn1n.2xlarge'),
                minCapacity: 1,
            });
            const fileContents = fs.readFileSync(path.join(__dirname, '..', 'lib', 'addons', 'neuron-device-plugin.yaml'), 'utf8');
            const sanitized = YAML.parse(fileContents);
            // THEN
            assertions_1.Template.fromStack(stack).hasResourceProperties(eks.KubernetesManifest.RESOURCE_TYPE, {
                Manifest: JSON.stringify([sanitized]),
            });
        });
        test('inf1 instances are supported in addNodegroupCapacity', () => {
            // GIVEN
            const { stack } = (0, util_1.testFixtureNoVpc)();
            const cluster = new eks.Cluster(stack, 'Cluster', {
                ...commonProps,
                prune: false,
                kubectlProviderOptions: {
                    kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(stack, 'kubectlLayer'),
                },
            });
            // WHEN
            cluster.addNodegroupCapacity('InferenceInstances', {
                instanceTypes: [new ec2.InstanceType('inf1.2xlarge')],
            });
            const fileContents = fs.readFileSync(path.join(__dirname, '..', 'lib', 'addons', 'neuron-device-plugin.yaml'), 'utf8');
            const sanitized = YAML.parse(fileContents);
            // THEN
            assertions_1.Template.fromStack(stack).hasResourceProperties(eks.KubernetesManifest.RESOURCE_TYPE, {
                Manifest: JSON.stringify([sanitized]),
            });
        });
        test('inf2 instances are supported in addNodegroupCapacity', () => {
            // GIVEN
            const { stack } = (0, util_1.testFixtureNoVpc)();
            const cluster = new eks.Cluster(stack, 'Cluster', {
                ...commonProps,
                prune: false,
                kubectlProviderOptions: {
                    kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(stack, 'kubectlLayer'),
                },
            });
            // WHEN
            cluster.addNodegroupCapacity('InferenceInstances', {
                instanceTypes: [new ec2.InstanceType('inf2.xlarge')],
            });
            const fileContents = fs.readFileSync(path.join(__dirname, '..', 'lib', 'addons', 'neuron-device-plugin.yaml'), 'utf8');
            const sanitized = YAML.parse(fileContents);
            // THEN
            assertions_1.Template.fromStack(stack).hasResourceProperties(eks.KubernetesManifest.RESOURCE_TYPE, {
                Manifest: JSON.stringify([sanitized]),
            });
        });
        test('kubectl resources are always created after all fargate profiles', () => {
            // GIVEN
            const { stack, app } = (0, util_1.testFixture)();
            const cluster = new eks.Cluster(stack, 'Cluster', {
                version: CLUSTER_VERSION,
                prune: false,
                kubectlProviderOptions: {
                    kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(stack, 'kubectlLayer'),
                },
            });
            // WHEN
            cluster.addFargateProfile('profile1', { selectors: [{ namespace: 'profile1' }] });
            cluster.addManifest('resource1', { foo: 123 });
            cluster.addFargateProfile('profile2', { selectors: [{ namespace: 'profile2' }] });
            new eks.HelmChart(stack, 'chart', { cluster, chart: 'mychart' });
            cluster.addFargateProfile('profile3', { selectors: [{ namespace: 'profile3' }] });
            new eks.KubernetesPatch(stack, 'patch1', {
                cluster,
                applyPatch: { foo: 123 },
                restorePatch: { bar: 123 },
                resourceName: 'foo/bar',
            });
            cluster.addFargateProfile('profile4', { selectors: [{ namespace: 'profile4' }] });
            // THEN
            const template = app.synth().getStackArtifact(stack.artifactId).template;
            const kubectlReadyBarrier = 'ClusterKubectlReadyBarrier200052AF';
            const barrier = template.Resources[kubectlReadyBarrier];
            const adminRoleAccess = 'ClusterClusterAdminRoleAccessF2BFF759';
            const profile1PodExecutionRole = 'Clusterfargateprofileprofile1PodExecutionRoleE85F87B5';
            const profile1 = 'Clusterfargateprofileprofile129AEA3C6';
            const profile2PodExecutionRole = 'Clusterfargateprofileprofile2PodExecutionRole22670AF8';
            const profile2 = 'Clusterfargateprofileprofile233B9A117';
            const profile3PodExecutionRole = 'Clusterfargateprofileprofile3PodExecutionRole475C0D8F';
            const profile3 = 'Clusterfargateprofileprofile3D06F3076';
            const profile4PodExecutionRole = 'Clusterfargateprofileprofile4PodExecutionRole086057FB';
            const profile4 = 'Clusterfargateprofileprofile4A0E3BBE8';
            const clusterResource = 'ClusterEB0386A7';
            const expectedBarrierDependencies = [
                adminRoleAccess,
                profile1PodExecutionRole,
                profile1,
                profile2PodExecutionRole,
                profile2,
                profile3PodExecutionRole,
                profile3,
                profile4PodExecutionRole,
                profile4,
                clusterResource,
            ];
            expect(barrier.DependsOn).toEqual(expectedBarrierDependencies);
            const helmChart = 'chartF2447AFC';
            const kubernetesPatch = 'patch1B964AC93';
            const kubernetesManifest = 'Clustermanifestresource10B1C9505';
            const kubectlResources = [helmChart, kubernetesPatch, kubernetesManifest];
            // check that all kubectl resources depend on the barrier
            for (const resource of kubectlResources) {
                expect(template.Resources[resource].DependsOn).toEqual([kubectlReadyBarrier]);
            }
        });
        test('kubectl provider role have right policy', () => {
            // GIVEN
            const { stack } = (0, util_1.testFixture)();
            const c1 = new eks.Cluster(stack, 'Cluster1', {
                version: CLUSTER_VERSION,
                prune: false,
                kubectlProviderOptions: {
                    kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(stack, 'kubectlLayer'),
                },
            });
            // WHEN
            // activate kubectl provider
            c1.addManifest('c1a', { foo: 123 });
            c1.addManifest('c1b', { foo: 123 });
            // THEN
            assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::IAM::Policy', {
                PolicyDocument: {
                    Statement: [
                        {
                            Action: 'eks:DescribeCluster',
                            Effect: 'Allow',
                            Resource: {
                                'Fn::GetAtt': [
                                    'Cluster192CD0375',
                                    'Arn',
                                ],
                            },
                        },
                    ],
                    Version: '2012-10-17',
                },
            });
            assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::IAM::Role', {
                AssumeRolePolicyDocument: {
                    Statement: [
                        {
                            Action: 'sts:AssumeRole',
                            Effect: 'Allow',
                            Principal: { Service: 'lambda.amazonaws.com' },
                        },
                    ],
                    Version: '2012-10-17',
                },
                ManagedPolicyArns: [
                    {
                        'Fn::Join': ['', [
                                'arn:',
                                { Ref: 'AWS::Partition' },
                                ':iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
                            ]],
                    },
                    {
                        'Fn::Join': ['', [
                                'arn:',
                                { Ref: 'AWS::Partition' },
                                ':iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
                            ]],
                    },
                    {
                        'Fn::Join': ['', [
                                'arn:',
                                { Ref: 'AWS::Partition' },
                                ':iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
                            ]],
                    },
                    {
                        'Fn::If': [
                            'Cluster1KubectlProviderHandlerHasEcrPublic0B1C9820',
                            {
                                'Fn::Join': [
                                    '',
                                    [
                                        'arn:',
                                        {
                                            Ref: 'AWS::Partition',
                                        },
                                        ':iam::aws:policy/AmazonElasticContainerRegistryPublicReadOnly',
                                    ],
                                ],
                            },
                            {
                                Ref: 'AWS::NoValue',
                            },
                        ],
                    },
                ],
            });
        });
    });
    test('kubectl provider passes security group to provider', () => {
        const { stack } = (0, util_1.testFixture)();
        new eks.Cluster(stack, 'Cluster1', {
            version: CLUSTER_VERSION,
            prune: false,
            endpointAccess: eks.EndpointAccess.PRIVATE,
            kubectlProviderOptions: {
                kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(stack, 'kubectlLayer'),
                environment: {
                    Foo: 'Bar',
                },
            },
        });
        assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Function', {
            VpcConfig: {
                SecurityGroupIds: [{ 'Fn::GetAtt': ['Cluster192CD0375', 'ClusterSecurityGroupId'] }],
            },
        });
    });
    test('kubectl provider passes environment to lambda', () => {
        const { stack } = (0, util_1.testFixture)();
        const cluster = new eks.Cluster(stack, 'Cluster1', {
            version: CLUSTER_VERSION,
            prune: false,
            endpointAccess: eks.EndpointAccess.PRIVATE,
            kubectlProviderOptions: {
                kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(stack, 'kubectlLayer'),
                environment: {
                    Foo: 'Bar',
                },
            },
        });
        cluster.addManifest('resource', {
            kind: 'ConfigMap',
            apiVersion: 'v1',
            data: {
                hello: 'world',
            },
            metadata: {
                name: 'config-map',
            },
        });
        assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Function', {
            Environment: {
                Variables: {
                    Foo: 'Bar',
                },
            },
        });
    });
    describe('kubectl provider passes iam role environment to kubectl lambda', () => {
        test('new cluster', () => {
            const { stack } = (0, util_1.testFixture)();
            const kubectlRole = new iam.Role(stack, 'KubectlIamRole', {
                assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            });
            // using _ syntax to silence warning about _cluster not being used, when it is
            const cluster = new eks.Cluster(stack, 'Cluster1', {
                version: CLUSTER_VERSION,
                prune: false,
                endpointAccess: eks.EndpointAccess.PRIVATE,
                kubectlProviderOptions: {
                    kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(stack, 'kubectlLayer'),
                    role: kubectlRole,
                },
            });
            cluster.addManifest('resource', {
                kind: 'ConfigMap',
                apiVersion: 'v1',
                data: {
                    hello: 'world',
                },
                metadata: {
                    name: 'config-map',
                },
            });
            assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Function', {
                Role: {
                    'Fn::GetAtt': ['Cluster1KubectlProviderframeworkonEventServiceRole67819AA9', 'Arn'],
                },
            });
        });
        test('imported cluster', () => {
            const clusterName = 'my-cluster';
            const stack = new cdk.Stack();
            const handlerRole = iam.Role.fromRoleArn(stack, 'HandlerRole', 'arn:aws:iam::123456789012:role/lambda-role');
            const kubectlProvider = kubectl_provider_1.KubectlProvider.fromKubectlProviderAttributes(stack, 'KubectlProvider', {
                serviceToken: 'arn:aws:lambda:us-east-2:123456789012:function:my-function:1',
                role: handlerRole,
            });
            const cluster = eks.Cluster.fromClusterAttributes(stack, 'Imported', {
                clusterName,
                kubectlProvider: kubectlProvider,
            });
            const chart = 'hello-world';
            cluster.addHelmChart('test-chart', {
                chart,
            });
            assertions_1.Template.fromStack(stack).hasResourceProperties(lib_1.HelmChart.RESOURCE_TYPE, {
                ClusterName: clusterName,
                Release: 'importedcharttestchartf3acd6e5',
                Chart: chart,
                Namespace: 'default',
                CreateNamespace: true,
            });
        });
    });
    describe('endpoint access', () => {
        test('public restricted', () => {
            expect(() => {
                eks.EndpointAccess.PUBLIC.onlyFrom('1.2.3.4/32');
            }).toThrow(/Cannot restric public access to endpoint when private access is disabled. Use PUBLIC_AND_PRIVATE.onlyFrom\(\) instead./);
        });
        test('public non restricted without private subnets', () => {
            const { stack } = (0, util_1.testFixture)();
            new eks.Cluster(stack, 'Cluster', {
                version: CLUSTER_VERSION,
                prune: false,
                endpointAccess: eks.EndpointAccess.PUBLIC,
                vpcSubnets: [{ subnetType: ec2.SubnetType.PUBLIC }],
                kubectlProviderOptions: {
                    kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(stack, 'kubectlLayer'),
                },
            });
            // we don't attach vpc config in case endpoint is public only, regardless of whether
            // the vpc has private subnets or not.
            assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Function', {
                VpcConfig: assertions_1.Match.absent(),
            });
        });
        test('public non restricted with private subnets', () => {
            const { stack } = (0, util_1.testFixture)();
            new eks.Cluster(stack, 'Cluster', {
                version: CLUSTER_VERSION,
                endpointAccess: eks.EndpointAccess.PUBLIC,
                kubectlProviderOptions: {
                    kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(stack, 'kubectlLayer'),
                },
            });
            // we don't attach vpc config in case endpoint is public only, regardless of whether
            // the vpc has private subnets or not.
            assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Function', {
                VpcConfig: assertions_1.Match.absent(),
            });
        });
        test('private without private subnets', () => {
            const { stack } = (0, util_1.testFixture)();
            expect(() => {
                new eks.Cluster(stack, 'Cluster', {
                    version: CLUSTER_VERSION,
                    prune: false,
                    endpointAccess: eks.EndpointAccess.PRIVATE,
                    vpcSubnets: [{ subnetType: ec2.SubnetType.PUBLIC }],
                });
            }).toThrow(/Vpc must contain private subnets when public endpoint access is disabled/);
        });
        test('private with private subnets', () => {
            const { stack } = (0, util_1.testFixture)();
            new eks.Cluster(stack, 'Cluster', {
                version: CLUSTER_VERSION,
                prune: false,
                endpointAccess: eks.EndpointAccess.PRIVATE,
                kubectlProviderOptions: {
                    kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(stack, 'kubectlLayer'),
                },
            });
            const functions = assertions_1.Template.fromStack(stack).findResources('AWS::Lambda::Function');
            expect(functions.ClusterKubectlProviderframeworkonEvent68E0CF80.Properties.VpcConfig.SubnetIds.length).not.toEqual(0);
            expect(functions.ClusterKubectlProviderframeworkonEvent68E0CF80.Properties.VpcConfig.SecurityGroupIds.length).not.toEqual(0);
        });
        test('private and non restricted public without private subnets', () => {
            const { stack } = (0, util_1.testFixture)();
            new eks.Cluster(stack, 'Cluster', {
                version: CLUSTER_VERSION,
                prune: false,
                endpointAccess: eks.EndpointAccess.PUBLIC_AND_PRIVATE,
                vpcSubnets: [{ subnetType: ec2.SubnetType.PUBLIC }],
                kubectlProviderOptions: {
                    kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(stack, 'kubectlLayer'),
                },
            });
            // we don't have private subnets, but we don't need them since public access
            // is not restricted.
            assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Function', {
                VpcConfig: assertions_1.Match.absent(),
            });
        });
        test('private and non restricted public with private subnets', () => {
            const { stack } = (0, util_1.testFixture)();
            new eks.Cluster(stack, 'Cluster', {
                version: CLUSTER_VERSION,
                prune: false,
                endpointAccess: eks.EndpointAccess.PUBLIC_AND_PRIVATE,
                kubectlProviderOptions: {
                    kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(stack, 'kubectlLayer'),
                },
            });
            // we have private subnets so we should use them.
            const functions = assertions_1.Template.fromStack(stack).findResources('AWS::Lambda::Function');
            expect(functions.ClusterKubectlProviderframeworkonEvent68E0CF80.Properties.VpcConfig.SubnetIds.length).not.toEqual(0);
            expect(functions.ClusterKubectlProviderframeworkonEvent68E0CF80.Properties.VpcConfig.SecurityGroupIds.length).not.toEqual(0);
        });
        test('private and restricted public without private subnets', () => {
            const { stack } = (0, util_1.testFixture)();
            expect(() => {
                new eks.Cluster(stack, 'Cluster', {
                    version: CLUSTER_VERSION,
                    prune: false,
                    endpointAccess: eks.EndpointAccess.PUBLIC_AND_PRIVATE.onlyFrom('1.2.3.4/32'),
                    vpcSubnets: [{ subnetType: ec2.SubnetType.PUBLIC }],
                });
            }).toThrow(/Vpc must contain private subnets when public endpoint access is restricted/);
        });
        test('private and restricted public with private subnets', () => {
            const { stack } = (0, util_1.testFixture)();
            new eks.Cluster(stack, 'Cluster', {
                version: CLUSTER_VERSION,
                prune: false,
                endpointAccess: eks.EndpointAccess.PUBLIC_AND_PRIVATE.onlyFrom('1.2.3.4/32'),
                kubectlProviderOptions: {
                    kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(stack, 'kubectlLayer'),
                },
            });
            // we have private subnets so we should use them.
            const functions = assertions_1.Template.fromStack(stack).findResources('AWS::Lambda::Function');
            expect(functions.ClusterKubectlProviderframeworkonEvent68E0CF80.Properties.VpcConfig.SubnetIds.length).not.toEqual(0);
            expect(functions.ClusterKubectlProviderframeworkonEvent68E0CF80.Properties.VpcConfig.SecurityGroupIds.length).not.toEqual(0);
        });
        test('private endpoint access selects only private subnets from looked up vpc', () => {
            const vpcId = 'vpc-12345';
            // can't use the regular fixture because it also adds a VPC to the stack, which prevents
            // us from setting context.
            const stack = new cdk.Stack(new cdk.App(), 'Stack', {
                env: {
                    account: '11112222',
                    region: 'us-east-1',
                },
            });
            stack.node.setContext(`vpc-provider:account=${stack.account}:filter.vpc-id=${vpcId}:region=${stack.region}:returnAsymmetricSubnets=true`, {
                vpcId: vpcId,
                vpcCidrBlock: '10.0.0.0/16',
                subnetGroups: [
                    {
                        name: 'Private',
                        type: 'Private',
                        subnets: [
                            {
                                subnetId: 'subnet-private-in-us-east-1a',
                                cidr: '10.0.1.0/24',
                                availabilityZone: 'us-east-1a',
                                routeTableId: 'rtb-06068e4c4049921ef',
                            },
                        ],
                    },
                    {
                        name: 'Public',
                        type: 'Public',
                        subnets: [
                            {
                                subnetId: 'subnet-public-in-us-east-1c',
                                cidr: '10.0.0.0/24',
                                availabilityZone: 'us-east-1c',
                                routeTableId: 'rtb-0ff08e62195198dbb',
                            },
                        ],
                    },
                ],
            });
            const vpc = ec2.Vpc.fromLookup(stack, 'Vpc', {
                vpcId: vpcId,
            });
            new eks.Cluster(stack, 'Cluster', {
                vpc,
                version: CLUSTER_VERSION,
                prune: false,
                endpointAccess: eks.EndpointAccess.PRIVATE,
                kubectlProviderOptions: {
                    kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(stack, 'kubectlLayer'),
                },
            });
            assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Function', {
                VpcConfig: { SubnetIds: ['subnet-private-in-us-east-1a'] },
            });
        });
        test('private endpoint access selects only private subnets from looked up vpc with concrete subnet selection', () => {
            const vpcId = 'vpc-12345';
            // can't use the regular fixture because it also adds a VPC to the stack, which prevents
            // us from setting context.
            const stack = new cdk.Stack(new cdk.App(), 'Stack', {
                env: {
                    account: '11112222',
                    region: 'us-east-1',
                },
            });
            stack.node.setContext(`vpc-provider:account=${stack.account}:filter.vpc-id=${vpcId}:region=${stack.region}:returnAsymmetricSubnets=true`, {
                vpcId: vpcId,
                vpcCidrBlock: '10.0.0.0/16',
                subnetGroups: [
                    {
                        name: 'Private',
                        type: 'Private',
                        subnets: [
                            {
                                subnetId: 'subnet-private-in-us-east-1a',
                                cidr: '10.0.1.0/24',
                                availabilityZone: 'us-east-1a',
                                routeTableId: 'rtb-06068e4c4049921ef',
                            },
                        ],
                    },
                    {
                        name: 'Public',
                        type: 'Public',
                        subnets: [
                            {
                                subnetId: 'subnet-public-in-us-east-1c',
                                cidr: '10.0.0.0/24',
                                availabilityZone: 'us-east-1c',
                                routeTableId: 'rtb-0ff08e62195198dbb',
                            },
                        ],
                    },
                ],
            });
            const vpc = ec2.Vpc.fromLookup(stack, 'Vpc', {
                vpcId: vpcId,
            });
            new eks.Cluster(stack, 'Cluster', {
                vpc,
                version: CLUSTER_VERSION,
                prune: false,
                endpointAccess: eks.EndpointAccess.PRIVATE,
                vpcSubnets: [{
                        subnets: [
                            ec2.Subnet.fromSubnetId(stack, 'Private', 'subnet-private-in-us-east-1a'),
                            ec2.Subnet.fromSubnetId(stack, 'Public', 'subnet-public-in-us-east-1c'),
                        ],
                    }],
                kubectlProviderOptions: {
                    kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(stack, 'kubectlLayer'),
                },
            });
            assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Function', {
                VpcConfig: { SubnetIds: ['subnet-private-in-us-east-1a'] },
            });
        });
        test('private endpoint access selects only private subnets from managed vpc with concrete subnet selection', () => {
            const { stack } = (0, util_1.testFixture)();
            const vpc = new ec2.Vpc(stack, 'Vpc');
            new eks.Cluster(stack, 'Cluster', {
                vpc,
                version: CLUSTER_VERSION,
                prune: false,
                endpointAccess: eks.EndpointAccess.PRIVATE,
                vpcSubnets: [{
                        subnets: [
                            vpc.privateSubnets[0],
                            vpc.publicSubnets[1],
                            ec2.Subnet.fromSubnetId(stack, 'Private', 'subnet-unknown'),
                        ],
                    }],
                kubectlProviderOptions: {
                    kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(stack, 'kubectlLayer'),
                },
            });
            assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Function', {
                VpcConfig: {
                    SubnetIds: [
                        { Ref: 'VpcPrivateSubnet1Subnet536B997A' },
                        'subnet-unknown',
                    ],
                },
            });
        });
        test('private endpoint access considers specific subnet selection', () => {
            const { stack } = (0, util_1.testFixture)();
            new eks.Cluster(stack, 'Cluster', {
                version: CLUSTER_VERSION,
                prune: false,
                endpointAccess: eks.EndpointAccess.PRIVATE,
                vpcSubnets: [{
                        subnets: [ec2.PrivateSubnet.fromSubnetAttributes(stack, 'Private1', {
                                subnetId: 'subnet1',
                                availabilityZone: 'us-east-1a',
                            })],
                    }],
                kubectlProviderOptions: {
                    kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(stack, 'kubectlLayer'),
                },
            });
            assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Function', {
                VpcConfig: { SubnetIds: ['subnet1'] },
            });
        });
        test('can configure private endpoint access', () => {
            // GIVEN
            const { stack } = (0, util_1.testFixture)();
            new eks.Cluster(stack, 'Cluster1', { version: CLUSTER_VERSION, endpointAccess: eks.EndpointAccess.PRIVATE, prune: false });
            const app = stack.node.root;
            const template = app.synth().getStackArtifact(stack.stackName).template;
            expect(template.Resources.Cluster192CD0375.Properties.ResourcesVpcConfig.EndpointPrivateAccess).toEqual(true);
            expect(template.Resources.Cluster192CD0375.Properties.ResourcesVpcConfig.EndpointPublicAccess).toEqual(false);
        });
        test('kubectl provider chooses only private subnets', () => {
            const { stack } = (0, util_1.testFixture)();
            const vpc = new ec2.Vpc(stack, 'Vpc', {
                maxAzs: 2,
                natGateways: 1,
                subnetConfiguration: [
                    {
                        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                        name: 'Private1',
                    },
                    {
                        subnetType: ec2.SubnetType.PUBLIC,
                        name: 'Public1',
                    },
                ],
            });
            const cluster = new eks.Cluster(stack, 'Cluster1', {
                version: CLUSTER_VERSION,
                prune: false,
                endpointAccess: eks.EndpointAccess.PRIVATE,
                vpc,
                kubectlProviderOptions: {
                    kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(stack, 'kubectlLayer'),
                },
            });
            cluster.addManifest('resource', {
                kind: 'ConfigMap',
                apiVersion: 'v1',
                data: {
                    hello: 'world',
                },
                metadata: {
                    name: 'config-map',
                },
            });
            assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Function', {
                VpcConfig: {
                    SecurityGroupIds: [
                        {
                            'Fn::GetAtt': ['Cluster192CD0375', 'ClusterSecurityGroupId'],
                        },
                    ],
                    SubnetIds: [
                        {
                            Ref: 'VpcPrivate1Subnet1SubnetC688B2B1',
                        },
                        {
                            Ref: 'VpcPrivate1Subnet2SubnetA2AF15C7',
                        },
                    ],
                },
            });
        });
        test('kubectl provider considers vpc subnet selection', () => {
            const { stack } = (0, util_1.testFixture)();
            const subnetConfiguration = [];
            for (let i = 0; i < 20; i++) {
                subnetConfiguration.push({
                    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    name: `Private${i}`,
                });
            }
            subnetConfiguration.push({
                subnetType: ec2.SubnetType.PUBLIC,
                name: 'Public1',
            });
            const vpc2 = new ec2.Vpc(stack, 'Vpc', {
                maxAzs: 2,
                natGateways: 1,
                subnetConfiguration,
            });
            const cluster = new eks.Cluster(stack, 'Cluster1', {
                version: CLUSTER_VERSION,
                prune: false,
                endpointAccess: eks.EndpointAccess.PRIVATE,
                vpc: vpc2,
                vpcSubnets: [{ subnetGroupName: 'Private1' }, { subnetGroupName: 'Private2' }],
                kubectlProviderOptions: {
                    kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(stack, 'kubectlLayer'),
                },
            });
            cluster.addManifest('resource', {
                kind: 'ConfigMap',
                apiVersion: 'v1',
                data: {
                    hello: 'world',
                },
                metadata: {
                    name: 'config-map',
                },
            });
            assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Function', {
                VpcConfig: {
                    SecurityGroupIds: [
                        {
                            'Fn::GetAtt': ['Cluster192CD0375', 'ClusterSecurityGroupId'],
                        },
                    ],
                    SubnetIds: [
                        {
                            Ref: 'VpcPrivate1Subnet1SubnetC688B2B1',
                        },
                        {
                            Ref: 'VpcPrivate1Subnet2SubnetA2AF15C7',
                        },
                        {
                            Ref: 'VpcPrivate2Subnet1SubnetE13E2E30',
                        },
                        {
                            Ref: 'VpcPrivate2Subnet2Subnet158A38AB',
                        },
                    ],
                },
            });
        });
        test('throw when private access is configured without dns support enabled for the VPC', () => {
            const { stack } = (0, util_1.testFixture)();
            expect(() => {
                new eks.Cluster(stack, 'Cluster', {
                    vpc: new ec2.Vpc(stack, 'Vpc', {
                        enableDnsSupport: false,
                    }),
                    version: CLUSTER_VERSION,
                    prune: false,
                });
            }).toThrow(/Private endpoint access requires the VPC to have DNS support and DNS hostnames enabled/);
        });
        test('throw when private access is configured without dns hostnames enabled for the VPC', () => {
            const { stack } = (0, util_1.testFixture)();
            expect(() => {
                new eks.Cluster(stack, 'Cluster', {
                    vpc: new ec2.Vpc(stack, 'Vpc', {
                        enableDnsHostnames: false,
                    }),
                    version: CLUSTER_VERSION,
                    prune: false,
                });
            }).toThrow(/Private endpoint access requires the VPC to have DNS support and DNS hostnames enabled/);
        });
        test('throw when cidrs are configured without public access endpoint', () => {
            expect(() => {
                eks.EndpointAccess.PRIVATE.onlyFrom('1.2.3.4/5');
            }).toThrow(/CIDR blocks can only be configured when public access is enabled/);
        });
    });
    test('getServiceLoadBalancerAddress', () => {
        const { stack } = (0, util_1.testFixture)();
        const cluster = new eks.Cluster(stack, 'Cluster1', {
            version: CLUSTER_VERSION,
            prune: false,
            kubectlProviderOptions: {
                kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(stack, 'kubectlLayer'),
            },
        });
        const loadBalancerAddress = cluster.getServiceLoadBalancerAddress('myservice');
        new cdk.CfnOutput(stack, 'LoadBalancerAddress', {
            value: loadBalancerAddress,
        });
        const expectedKubernetesGetId = 'Cluster1myserviceLoadBalancerAddress198CCB03';
        let template = assertions_1.Template.fromStack(stack);
        const resources = template.findResources('Custom::AWSCDK-EKS-KubernetesObjectValue');
        // make sure the custom resource is created correctly
        expect(resources[expectedKubernetesGetId].Properties).toEqual({
            ServiceToken: {
                'Fn::GetAtt': [
                    'Cluster1KubectlProviderframeworkonEventBB398CAE',
                    'Arn',
                ],
            },
            ClusterName: {
                Ref: 'Cluster192CD0375',
            },
            ObjectType: 'service',
            ObjectName: 'myservice',
            ObjectNamespace: 'default',
            JsonPath: '.status.loadBalancer.ingress[0].hostname',
            TimeoutSeconds: 300,
        });
        // make sure the attribute points to the expected custom resource and extracts the correct attribute
        template.hasOutput('LoadBalancerAddress', {
            Value: { 'Fn::GetAtt': [expectedKubernetesGetId, 'Value'] },
        });
    });
    test('custom kubectl layer can be provided', () => {
        // GIVEN
        const { stack } = (0, util_1.testFixture)();
        // WHEN
        const layer = lambda.LayerVersion.fromLayerVersionArn(stack, 'MyLayer', 'arn:of:layer');
        new eks.Cluster(stack, 'Cluster1', {
            version: CLUSTER_VERSION,
            prune: false,
            kubectlProviderOptions: {
                kubectlLayer: layer,
            },
        });
        // THEN
        assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Function', {
            Layers: [
                { Ref: 'Cluster1KubectlProviderAwsCliLayer5CF50321' },
                'arn:of:layer',
            ],
        });
    });
    test('custom awscli layer can be provided', () => {
        // GIVEN
        const { stack } = (0, util_1.testFixture)();
        // WHEN
        const layer = lambda.LayerVersion.fromLayerVersionArn(stack, 'MyLayer', 'arn:of:layer');
        new eks.Cluster(stack, 'Cluster1', {
            version: CLUSTER_VERSION,
            prune: false,
            kubectlProviderOptions: {
                awscliLayer: layer,
                kubectlLayer: new lambda_layer_kubectl_v33_1.KubectlV33Layer(stack, 'kubectlLayer'),
            },
        });
        // THEN
        assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Function', {
            Layers: [
                'arn:of:layer',
                { Ref: 'kubectlLayer44321E08' },
            ],
        });
    });
    test('create a cluster using custom resource with secrets encryption using KMS CMK', () => {
        // GIVEN
        const { stack, vpc } = (0, util_1.testFixture)();
        // WHEN
        new eks.Cluster(stack, 'Cluster', {
            vpc,
            version: CLUSTER_VERSION,
            prune: false,
            secretsEncryptionKey: new kms.Key(stack, 'Key'),
        });
        // THEN
        assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::EKS::Cluster', {
            EncryptionConfig: [{
                    Provider: {
                        KeyArn: {
                            'Fn::GetAtt': [
                                'Key961B73FD',
                                'Arn',
                            ],
                        },
                    },
                    Resources: ['secrets'],
                }],
        });
    });
    test('create a cluster using custom kubernetes network config', () => {
        // GIVEN
        const { stack } = (0, util_1.testFixture)();
        const customCidr = '172.16.0.0/12';
        // WHEN
        new eks.Cluster(stack, 'Cluster', {
            version: CLUSTER_VERSION,
            serviceIpv4Cidr: customCidr,
        });
        // THEN
        assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::EKS::Cluster', {
            KubernetesNetworkConfig: {
                ServiceIpv4Cidr: customCidr,
            },
        });
    });
    describe('AccessConfig', () => {
        // bootstrapClusterCreatorAdminPermissions can be explicitly enabled or disabled
        test.each([
            [true, true],
            [false, false],
        ])('bootstrapClusterCreatorAdminPermissions(%s) should work', (a, b) => {
            // GIVEN
            const { stack } = (0, util_1.testFixture)();
            // WHEN
            new eks.Cluster(stack, 'Cluster', {
                version: CLUSTER_VERSION,
                bootstrapClusterCreatorAdminPermissions: a,
            });
            // THEN
            assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::EKS::Cluster', {
                AccessConfig: {
                    BootstrapClusterCreatorAdminPermissions: b,
                },
            });
        });
    });
    describe('AccessEntry', () => {
        // cluster can grantAccess();
        test('cluster can grantAccess', () => {
            // GIVEN
            const { stack, vpc } = (0, util_1.testFixture)();
            // WHEN
            const mastersRole = new iam.Role(stack, 'role', { assumedBy: new iam.AccountRootPrincipal() });
            new eks.Cluster(stack, 'Cluster', {
                vpc,
                mastersRole,
                version: CLUSTER_VERSION,
            });
            // THEN
            assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::EKS::AccessEntry', {
                AccessPolicies: [
                    {
                        AccessScope: {
                            Type: 'cluster',
                        },
                        PolicyArn: {
                            'Fn::Join': [
                                '', [
                                    'arn:',
                                    { Ref: 'AWS::Partition' },
                                    ':eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy',
                                ],
                            ],
                        },
                    },
                ],
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2x1c3Rlci50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2x1c3Rlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEseUJBQXlCO0FBQ3pCLDZCQUE2QjtBQUM3QixnRkFBb0U7QUFDcEUsdURBQXlEO0FBQ3pELG1EQUFtRDtBQUNuRCwyQ0FBMkM7QUFDM0MsMkNBQTJDO0FBQzNDLDJDQUEyQztBQUMzQyxpREFBaUQ7QUFDakQsd0NBQXdDO0FBQ3hDLCtCQUErQjtBQUMvQiwyQ0FBdUM7QUFDdkMsNkJBQTZCO0FBQzdCLGlDQUF1RDtBQUN2RCw4QkFBOEI7QUFDOUIsZ0NBQW1DO0FBQ25DLDhEQUEwRDtBQUMxRCw4REFBZ0U7QUFFaEUsTUFBTSxlQUFlLEdBQUcsR0FBRyxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQztBQUNwRCxNQUFNLFdBQVcsR0FBRztJQUNsQixPQUFPLEVBQUUsZUFBZTtJQUN4QixlQUFlLEVBQUUsQ0FBQztJQUNsQixtQkFBbUIsRUFBRSxHQUFHLENBQUMsbUJBQW1CLENBQUMsU0FBUztDQUN2RCxDQUFDO0FBRUYsUUFBUSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUU7SUFDdkIsSUFBSSxDQUFDLHlDQUF5QyxFQUFFLEdBQUcsRUFBRTtRQUNuRCxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBQSxrQkFBVyxHQUFFLENBQUM7UUFFaEMsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUU7WUFDaEQsT0FBTyxFQUFFLGVBQWU7WUFDeEIsYUFBYSxFQUFFO2dCQUNiLE9BQU8sRUFBRSxHQUFHLENBQUMsb0JBQW9CLENBQUMsTUFBTTthQUN6QztZQUNELHNCQUFzQixFQUFFO2dCQUN0QixZQUFZLEVBQUUsSUFBSSwwQ0FBZSxDQUFDLEtBQUssRUFBRSxjQUFjLENBQUM7YUFDekQ7U0FDRixDQUFDLENBQUM7UUFFSCxxQkFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyw4QkFBOEIsRUFBRTtZQUM5RSxLQUFLLEVBQUUsOEJBQThCO1NBQ3RDLENBQUMsQ0FBQztRQUNILE1BQU0sQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDOUMsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsMkNBQTJDLEVBQUUsR0FBRyxFQUFFO1FBQ3pELElBQUksS0FBZ0IsQ0FBQztRQUNyQixJQUFJLEdBQWEsQ0FBQztRQUVsQixVQUFVLENBQUMsR0FBRyxFQUFFO1lBQ2QsS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3hCLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzVDLE1BQU0saUJBQWlCLEdBQUcsR0FBRyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQztZQUN2RixNQUFNLGVBQWUsR0FBRyxHQUFHLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO1lBQ25GLE1BQU0sZ0JBQWdCLEdBQUcsR0FBRyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQztZQUNyRixNQUFNLGlCQUFpQixHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7WUFFdkYsR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLGFBQWEsRUFBRTtnQkFDcEQsS0FBSztnQkFDTCxpQkFBaUI7Z0JBQ2pCLGVBQWU7Z0JBQ2YsZ0JBQWdCO2dCQUNoQixpQkFBaUI7YUFDbEIsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZ0RBQWdELEVBQUUsR0FBRyxFQUFFO1lBQzFELE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRTtnQkFDN0MsR0FBRyxFQUFFLEdBQUc7Z0JBQ1IsVUFBVSxFQUFFLENBQUMsRUFBRSxVQUFVLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLG1CQUFtQixFQUFFLENBQUM7Z0JBQ3ZHLEdBQUcsV0FBVzthQUNmLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO1FBQ3RELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHNEQUFzRCxFQUFFLEdBQUcsRUFBRTtZQUNoRSxPQUFPO1lBQ1AsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUU7Z0JBQ2hDLEdBQUcsRUFBRSxHQUFHO2dCQUNSLFVBQVUsRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ25ELEdBQUcsV0FBVzthQUNmLENBQUMsQ0FBQztZQUVILE9BQU87WUFDUCxxQkFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxtQkFBbUIsRUFBRTtnQkFDbkUsa0JBQWtCLEVBQUU7b0JBQ2xCLFNBQVMsRUFBRTt3QkFDVCxXQUFXLEVBQUU7NEJBQ1gsR0FBRzs0QkFDSCxFQUFFLGlCQUFpQixFQUFFLG1CQUFtQixFQUFFO3lCQUMzQztxQkFDRjtpQkFDRjthQUNGLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMscUdBQXFHLEVBQUUsR0FBRyxFQUFFO1FBQy9HLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFBLGtCQUFXLEdBQUUsQ0FBQztRQUVoQyxNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLHFCQUFxQixDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUU7WUFDbEUsV0FBVyxFQUFFLFNBQVM7U0FDdkIsQ0FBQyxDQUFDO1FBRUgsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxpRUFBaUUsQ0FBQyxDQUFDO0lBQ3hILENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLHVGQUF1RixFQUFFLEdBQUcsRUFBRTtRQUNqRyxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBQSxrQkFBVyxHQUFFLENBQUM7UUFFaEMsTUFBTSxXQUFXLEdBQUcsZUFBZSxDQUFDO1FBRXBDLE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMscUJBQXFCLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRTtZQUNsRSxXQUFXLEVBQUUsU0FBUztZQUN0QixzQkFBc0IsRUFBRSxXQUFXO1NBQ3BDLENBQUMsQ0FBQztRQUVILE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQztRQUUvQyxNQUFNLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUN6RCxDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyxtRUFBbUUsRUFBRSxHQUFHLEVBQUU7UUFDN0UsUUFBUTtRQUNSLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBQSxrQkFBVyxHQUFFLENBQUM7UUFDckMsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUU7WUFDaEQsR0FBRztZQUNILEdBQUcsV0FBVztZQUNkLEtBQUssRUFBRSxLQUFLO1NBQ2IsQ0FBQyxDQUFDO1FBRUgsT0FBTztRQUNQLE9BQU8sQ0FBQywyQkFBMkIsQ0FBQyxjQUFjLEVBQUU7WUFDbEQsWUFBWSxFQUFFLElBQUksR0FBRyxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUM7U0FDaEQsQ0FBQyxDQUFDO1FBRUgscUJBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMscUJBQXFCLENBQUMsdUNBQXVDLEVBQUU7WUFDdkYsY0FBYyxFQUFFO2dCQUNkLEVBQUUsWUFBWSxFQUFFLENBQUMsaURBQWlELEVBQUUsU0FBUyxDQUFDLEVBQUU7Z0JBQ2hGLEVBQUUsWUFBWSxFQUFFLENBQUMsaUJBQWlCLEVBQUUsd0JBQXdCLENBQUMsRUFBRTthQUNoRTtTQUNGLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLDZEQUE2RCxFQUFFLEdBQUcsRUFBRTtRQUN2RSxRQUFRO1FBQ1IsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFBLGtCQUFXLEdBQUUsQ0FBQztRQUNyQyxNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRTtZQUNoRCxHQUFHO1lBQ0gsR0FBRyxXQUFXO1NBQ2YsQ0FBQyxDQUFDO1FBRUgsT0FBTztRQUNQLE9BQU8sQ0FBQywyQkFBMkIsQ0FBQyxjQUFjLEVBQUU7WUFDbEQsWUFBWSxFQUFFLElBQUksR0FBRyxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUM7U0FDaEQsQ0FBQyxDQUFDO1FBRUgsSUFBSSxRQUFRLEdBQUcscUJBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekMsUUFBUSxDQUFDLHFCQUFxQixDQUFDLHlCQUF5QixFQUFFO1lBQ3hELElBQUksRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsNEJBQTRCLEVBQUUsQ0FBQztTQUM3RCxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyxpREFBaUQsRUFBRSxHQUFHLEVBQUU7UUFDM0QsUUFBUTtRQUNSLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBQSxrQkFBVyxHQUFFLENBQUM7UUFDckMsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUU7WUFDaEQsR0FBRztZQUNILEdBQUcsV0FBVztZQUNkLEtBQUssRUFBRSxLQUFLO1NBQ2IsQ0FBQyxDQUFDO1FBRUgsTUFBTSxlQUFlLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsaUJBQWlCLEVBQUU7WUFDbEYsV0FBVyxFQUFFLE9BQU8sQ0FBQyxXQUFXO1lBQ2hDLHNCQUFzQixFQUFFLE9BQU8sQ0FBQyxzQkFBc0I7U0FDdkQsQ0FBQyxDQUFDO1FBRUgsTUFBTSxXQUFXLEdBQUcsSUFBSSxHQUFHLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLGNBQWMsRUFBRTtZQUNsRSxZQUFZLEVBQUUsSUFBSSxHQUFHLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQztZQUMvQyxHQUFHLEVBQUUsR0FBRztZQUNSLFlBQVksRUFBRSxJQUFJLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRTtTQUN6QyxDQUFDLENBQUM7UUFFSCxPQUFPO1FBQ1AsZUFBZSxDQUFDLCtCQUErQixDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVqRSxxQkFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyx1Q0FBdUMsRUFBRTtZQUN2RixjQUFjLEVBQUU7Z0JBQ2QsRUFBRSxZQUFZLEVBQUUsQ0FBQywwQ0FBMEMsRUFBRSxTQUFTLENBQUMsRUFBRTtnQkFDekUsRUFBRSxZQUFZLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRSx3QkFBd0IsQ0FBQyxFQUFFO2FBQ2hFO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsdUVBQXVFLEVBQUUsR0FBRyxFQUFFO1FBQ2pGLFFBQVE7UUFDUixNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFHLElBQUEsa0JBQVcsR0FBRSxDQUFDO1FBQ3JDLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFO1lBQ2hELEdBQUc7WUFDSCxHQUFHLFdBQVc7WUFDZCxLQUFLLEVBQUUsS0FBSztTQUNiLENBQUMsQ0FBQztRQUVILE1BQU0sV0FBVyxHQUFHLElBQUksR0FBRyxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxjQUFjLEVBQUU7WUFDbEUsWUFBWSxFQUFFLElBQUksR0FBRyxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUM7WUFDL0MsR0FBRyxFQUFFLEdBQUc7WUFDUixZQUFZLEVBQUUsSUFBSSxHQUFHLENBQUMsZ0JBQWdCLEVBQUU7U0FDekMsQ0FBQyxDQUFDO1FBRUgsT0FBTztRQUNQLE9BQU8sQ0FBQywrQkFBK0IsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFekQscUJBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMscUJBQXFCLENBQUMsdUNBQXVDLEVBQUU7WUFDdkYsY0FBYyxFQUFFO2dCQUNkLEVBQUUsWUFBWSxFQUFFLENBQUMsMENBQTBDLEVBQUUsU0FBUyxDQUFDLEVBQUU7Z0JBQ3pFLEVBQUUsWUFBWSxFQUFFLENBQUMsaUJBQWlCLEVBQUUsd0JBQXdCLENBQUMsRUFBRTthQUNoRTtTQUNGLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLGlFQUFpRSxFQUFFLEdBQUcsRUFBRTtRQUMzRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBQSxrQkFBVyxHQUFFLENBQUM7UUFFaEMsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUU7WUFDaEQsR0FBRyxXQUFXO1lBQ2QsS0FBSyxFQUFFLEtBQUs7U0FDYixDQUFDLENBQUM7UUFFSCw4Q0FBOEM7UUFDOUMsTUFBTSxhQUFhLEdBQUcsSUFBSSxzQkFBUyxDQUFDLEtBQUssRUFBRSxlQUFlLENBQUMsQ0FBQztRQUU1RCxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsNEVBQTRFLENBQUMsQ0FBQztJQUNwSixDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyxxQ0FBcUMsRUFBRSxHQUFHLEVBQUU7UUFDL0MsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUEsa0JBQVcsR0FBRSxDQUFDO1FBRWhDLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFO1lBQ2hELEdBQUcsV0FBVztZQUNkLEtBQUssRUFBRSxLQUFLO1lBQ1osc0JBQXNCLEVBQUU7Z0JBQ3RCLFlBQVksRUFBRSxJQUFJLDBDQUFlLENBQUMsS0FBSyxFQUFFLGNBQWMsQ0FBQzthQUN6RDtTQUNGLENBQUMsQ0FBQztRQUVILE1BQU0sR0FBRyxHQUFHLElBQUksS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQzVCLE1BQU0sS0FBSyxHQUFHLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFFNUMsSUFBSSxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUU7WUFDcEMsVUFBVSxFQUFFLElBQUk7WUFDaEIsSUFBSSxFQUFFLEtBQUs7WUFDWCxRQUFRLEVBQUU7Z0JBQ1IsSUFBSSxFQUFFLFVBQVU7Z0JBQ2hCLE1BQU0sRUFBRTtvQkFDTixzQ0FBc0M7b0JBQ3RDLFdBQVcsRUFBRSxPQUFPLENBQUMsV0FBVztpQkFDakM7YUFDRjtTQUNGLENBQUMsQ0FBQztRQUVILE9BQU8sQ0FBQyxhQUFhLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRTVDLHFCQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLHFCQUFxQixDQUFDLHVDQUF1QyxFQUFFO1lBQ3ZGLFFBQVEsRUFBRTtnQkFDUixVQUFVLEVBQUU7b0JBQ1YsRUFBRTtvQkFDRjt3QkFDRSx3RUFBd0U7d0JBQ3hFOzRCQUNFLEdBQUcsRUFBRSxpQkFBaUI7eUJBQ3ZCO3dCQUNELHlCQUF5QjtxQkFDMUI7aUJBQ0Y7YUFDRjtTQUNGLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLDJFQUEyRSxFQUFFLEdBQUcsRUFBRTtRQUNyRixNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBQSxrQkFBVyxHQUFFLENBQUM7UUFFaEMsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUU7WUFDaEQsR0FBRyxXQUFXO1lBQ2QsS0FBSyxFQUFFLEtBQUs7U0FDYixDQUFDLENBQUM7UUFFSCxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztZQUM5RixFQUFFLFlBQVksRUFBRSxDQUFDLGlCQUFpQixFQUFFLHdCQUF3QixDQUFDLEVBQUU7WUFDL0QsRUFBRSxZQUFZLEVBQUUsQ0FBQywwQ0FBMEMsRUFBRSxTQUFTLENBQUMsRUFBRTtTQUMxRSxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyxxREFBcUQsRUFBRSxHQUFHLEVBQUU7UUFDL0QsTUFBTSxZQUFhLFNBQVEsR0FBRyxDQUFDLEtBQUs7WUFDM0IsVUFBVSxDQUFjO1lBRS9CLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBZ0Q7Z0JBQ3hGLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2pCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUU7b0JBQ2pELEdBQUcsV0FBVztvQkFDZCxLQUFLLEVBQUUsS0FBSztvQkFDWixhQUFhLEVBQUUsS0FBSyxDQUFDLEVBQUU7b0JBQ3ZCLEdBQUcsRUFBRSxLQUFLLENBQUMsR0FBRztpQkFDZixDQUFDLENBQUM7YUFDSjtTQUNGO1FBRUQsTUFBTSxZQUFhLFNBQVEsR0FBRyxDQUFDLEtBQUs7WUFDbEIsYUFBYSxDQUFxQjtZQUNsQyxHQUFHLENBQVc7WUFFOUIsWUFBWSxLQUFnQixFQUFFLEVBQVU7Z0JBQ3RDLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2pCLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDcEMsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQzthQUN0RjtTQUNGO1FBRUQsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLElBQUEsa0JBQVcsR0FBRSxDQUFDO1FBQzlCLE1BQU0sWUFBWSxHQUFHLElBQUksWUFBWSxDQUFDLEdBQUcsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUMzRCxJQUFJLFlBQVksQ0FBQyxHQUFHLEVBQUUsY0FBYyxFQUFFLEVBQUUsRUFBRSxFQUFFLFlBQVksQ0FBQyxhQUFhLEVBQUUsR0FBRyxFQUFFLFlBQVksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBRWpHLHVFQUF1RTtRQUN2RSxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDZCxDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQywrR0FBK0csRUFBRSxHQUFHLEVBQUU7UUFDekgsTUFBTSxZQUFhLFNBQVEsR0FBRyxDQUFDLEtBQUs7WUFDM0IsVUFBVSxDQUFjO1lBRS9CLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7Z0JBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN4QixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFO29CQUNqRCxHQUFHLFdBQVc7b0JBQ2QsS0FBSyxFQUFFLEtBQUs7b0JBQ1osc0JBQXNCLEVBQUU7d0JBQ3RCLFlBQVksRUFBRSxJQUFJLDBDQUFlLENBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQztxQkFDeEQ7aUJBQ0YsQ0FBQyxDQUFDO2FBQ0o7U0FDRjtRQUVELE1BQU0sYUFBYyxTQUFRLEdBQUcsQ0FBQyxLQUFLO1lBQ25DLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBZ0Q7Z0JBQ3hGLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUV4QiwwRUFBMEU7Z0JBQzFFLE1BQU0sSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFO29CQUMzQyxTQUFTLEVBQUUsSUFBSSxHQUFHLENBQUMsZ0JBQWdCLENBQUMsbUJBQW1CLENBQUM7b0JBQ3hELFFBQVEsRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVU7aUJBQ25DLENBQUMsQ0FBQztnQkFFSCxnRkFBZ0Y7Z0JBQ2hGLGlCQUFpQjtnQkFDakIsSUFBSSxHQUFHLENBQUMsa0JBQWtCLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRTtvQkFDOUMsUUFBUSxFQUFFLENBQUM7NEJBQ1QsSUFBSSxFQUFFLFdBQVc7NEJBQ2pCLFVBQVUsRUFBRSxJQUFJOzRCQUNoQixRQUFRLEVBQUU7Z0NBQ1IsSUFBSSxFQUFFLFlBQVk7NkJBQ25COzRCQUNELElBQUksRUFBRTtnQ0FDSixHQUFHLEVBQUUsSUFBSSxDQUFDLE9BQU87NkJBQ2xCO3lCQUNGLENBQUM7b0JBQ0YsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPO2lCQUN2QixDQUFDLENBQUM7YUFDSjtTQUNGO1FBRUQsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLElBQUEsa0JBQVcsR0FBRSxDQUFDO1FBQzlCLE1BQU0sWUFBWSxHQUFHLElBQUksWUFBWSxDQUFDLEdBQUcsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUMzRCxJQUFJLGFBQWEsQ0FBQyxHQUFHLEVBQUUsZUFBZSxFQUFFLEVBQUUsT0FBTyxFQUFFLFlBQVksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO1FBRTlFLHVFQUF1RTtRQUN2RSxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDZCxDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyw0R0FBNEcsRUFBRSxHQUFHLEVBQUU7UUFDdEgsTUFBTSxZQUFhLFNBQVEsR0FBRyxDQUFDLEtBQUs7WUFDM0IsVUFBVSxDQUFjO1lBRS9CLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7Z0JBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN4QixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFO29CQUNqRCxPQUFPLEVBQUUsZUFBZTtvQkFDeEIsS0FBSyxFQUFFLEtBQUs7b0JBQ1osc0JBQXNCLEVBQUU7d0JBQ3RCLFlBQVksRUFBRSxJQUFJLDBDQUFlLENBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQztxQkFDeEQ7aUJBQ0YsQ0FBQyxDQUFDO2FBQ0o7U0FDRjtRQUVELE1BQU0sVUFBVyxTQUFRLEdBQUcsQ0FBQyxLQUFLO1lBQ2hDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBZ0Q7Z0JBQ3hGLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUV4QiwwRUFBMEU7Z0JBQzFFLE1BQU0sSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFO29CQUMzQyxTQUFTLEVBQUUsSUFBSSxHQUFHLENBQUMsZ0JBQWdCLENBQUMsbUJBQW1CLENBQUM7b0JBQ3hELFFBQVEsRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVU7aUJBQ25DLENBQUMsQ0FBQztnQkFFSCw2RUFBNkU7Z0JBQzdFLGlCQUFpQjtnQkFDakIsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUU7b0JBQ3JDLEtBQUssRUFBRSxJQUFJLENBQUMsT0FBTztvQkFDbkIsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPO2lCQUN2QixDQUFDLENBQUM7YUFDSjtTQUNGO1FBRUQsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLElBQUEsa0JBQVcsR0FBRSxDQUFDO1FBQzlCLE1BQU0sWUFBWSxHQUFHLElBQUksWUFBWSxDQUFDLEdBQUcsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUMzRCxJQUFJLFVBQVUsQ0FBQyxHQUFHLEVBQUUsWUFBWSxFQUFFLEVBQUUsT0FBTyxFQUFFLFlBQVksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO1FBRXhFLHVFQUF1RTtRQUN2RSxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDZCxDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQywrREFBK0QsRUFBRSxHQUFHLEVBQUU7UUFDekUsTUFBTSxZQUFhLFNBQVEsR0FBRyxDQUFDLEtBQUs7WUFDM0IsVUFBVSxDQUFjO1lBRS9CLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7Z0JBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN4QixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFO29CQUNqRCxPQUFPLEVBQUUsZUFBZTtvQkFDeEIsS0FBSyxFQUFFLEtBQUs7b0JBQ1osc0JBQXNCLEVBQUU7d0JBQ3RCLFlBQVksRUFBRSxJQUFJLDBDQUFlLENBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQztxQkFDeEQ7aUJBQ0YsQ0FBQyxDQUFDO2FBQ0o7U0FDRjtRQUVELE1BQU0sVUFBVyxTQUFRLEdBQUcsQ0FBQyxLQUFLO1lBQ2hDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBZ0Q7Z0JBQ3hGLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUV4QixNQUFNLFFBQVEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO2dCQUMzRSxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7YUFDekY7U0FDRjtRQUVELE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFBLGtCQUFXLEdBQUUsQ0FBQztRQUM5QixNQUFNLFlBQVksR0FBRyxJQUFJLFlBQVksQ0FBQyxHQUFHLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDM0QsSUFBSSxVQUFVLENBQUMsR0FBRyxFQUFFLFlBQVksRUFBRSxFQUFFLE9BQU8sRUFBRSxZQUFZLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztRQUV4RSx1RUFBdUU7UUFDdkUsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ2QsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsb0VBQW9FLEVBQUUsR0FBRyxFQUFFO1FBQzlFLE1BQU0sWUFBYSxTQUFRLEdBQUcsQ0FBQyxLQUFLO1lBQzNCLFVBQVUsQ0FBYztZQUUvQixZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO2dCQUM5RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtvQkFDcEQsT0FBTyxFQUFFLGVBQWU7b0JBQ3hCLEtBQUssRUFBRSxLQUFLO29CQUNaLHNCQUFzQixFQUFFO3dCQUN0QixZQUFZLEVBQUUsSUFBSSwwQ0FBZSxDQUFDLElBQUksRUFBRSxjQUFjLENBQUM7cUJBQ3hEO2lCQUNGLENBQUMsQ0FBQzthQUNKO1NBQ0Y7UUFFRCxNQUFNLFFBQVMsU0FBUSxHQUFHLENBQUMsS0FBSztZQUM5QixZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQWdEO2dCQUN4RixLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFFeEIsSUFBSSxHQUFHLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUUsRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO2FBQ2xIO1NBQ0Y7UUFFRCxNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBQSxrQkFBVyxHQUFFLENBQUM7UUFDOUIsTUFBTSxZQUFZLEdBQUcsSUFBSSxZQUFZLENBQUMsR0FBRyxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ3pELElBQUksUUFBUSxDQUFDLEdBQUcsRUFBRSxTQUFTLEVBQUUsRUFBRSxPQUFPLEVBQUUsWUFBWSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7UUFFbkUsdUVBQXVFO1FBQ3ZFLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUNkLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLHFDQUFxQyxFQUFFLEdBQUcsRUFBRTtRQUMvQyxRQUFRO1FBQ1IsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFBLGtCQUFXLEdBQUUsQ0FBQztRQUVyQyxPQUFPO1FBQ1AsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxXQUFXLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7UUFFekUsT0FBTztRQUNQLHFCQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLHFCQUFxQixDQUFDLG1CQUFtQixFQUFFO1lBQ25FLE9BQU8sRUFBRSxFQUFFLFlBQVksRUFBRSxDQUFDLHFCQUFxQixFQUFFLEtBQUssQ0FBQyxFQUFFO1lBQ3pELE9BQU8sRUFBRSxlQUFlLENBQUMsT0FBTztZQUNoQyxrQkFBa0IsRUFBRTtnQkFDbEIsZ0JBQWdCLEVBQUUsQ0FBQyxFQUFFLFlBQVksRUFBRSxDQUFDLDBDQUEwQyxFQUFFLFNBQVMsQ0FBQyxFQUFFLENBQUM7Z0JBQzdGLFNBQVMsRUFBRTtvQkFDVCxFQUFFLEdBQUcsRUFBRSxnQ0FBZ0MsRUFBRTtvQkFDekMsRUFBRSxHQUFHLEVBQUUsZ0NBQWdDLEVBQUU7b0JBQ3pDLEVBQUUsR0FBRyxFQUFFLGlDQUFpQyxFQUFFO29CQUMxQyxFQUFFLEdBQUcsRUFBRSxpQ0FBaUMsRUFBRTtpQkFDM0M7YUFDRjtTQUNGLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLDJFQUEyRSxFQUFFLEdBQUcsRUFBRTtRQUNyRixRQUFRO1FBQ1IsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUEsdUJBQWdCLEdBQUUsQ0FBQztRQUVyQyxPQUFPO1FBQ1AsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRSxPQUFPLEVBQUUsZUFBZSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBRTlFLE9BQU87UUFDUCxxQkFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxlQUFlLEVBQUUsa0JBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBQ3JGLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLHdEQUF3RCxFQUFFLEdBQUcsRUFBRTtRQUN0RSxJQUFJLENBQUMsZ0NBQWdDLEVBQUUsR0FBRyxFQUFFO1lBQzFDLFFBQVE7WUFDUixNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBQSx1QkFBZ0IsR0FBRSxDQUFDO1lBRXJDLE9BQU87WUFDUCxNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFLE9BQU8sRUFBRSxlQUFlLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7WUFFOUYsT0FBTztZQUNQLE1BQU0sQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUNqRCxxQkFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxlQUFlLENBQUMscUJBQXFCLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdEUsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMscUNBQXFDLEVBQUUsR0FBRyxFQUFFO1lBQy9DLFFBQVE7WUFDUixNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBQSx1QkFBZ0IsR0FBRSxDQUFDO1lBRXJDLE9BQU87WUFDUCxNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRTtnQkFDaEQsbUJBQW1CLEVBQUUsR0FBRyxDQUFDLG1CQUFtQixDQUFDLFNBQVM7Z0JBQ3RELGVBQWUsRUFBRSxFQUFFO2dCQUNuQix1QkFBdUIsRUFBRSxJQUFJLEdBQUcsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDO2dCQUMxRCxPQUFPLEVBQUUsZUFBZTtnQkFDeEIsS0FBSyxFQUFFLEtBQUs7YUFDYixDQUFDLENBQUM7WUFFSCxPQUFPO1lBQ1AsTUFBTSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQy9DLHFCQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLHFCQUFxQixDQUFDLHFCQUFxQixFQUFFO2dCQUNyRSxhQUFhLEVBQUU7b0JBQ2IsV0FBVyxFQUFFLEVBQUU7b0JBQ2YsT0FBTyxFQUFFLEVBQUU7b0JBQ1gsT0FBTyxFQUFFLEVBQUU7aUJBQ1o7YUFDRixDQUFDLENBQUM7WUFDSCx5R0FBeUc7UUFDM0csQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNENBQTRDLEVBQUUsR0FBRyxFQUFFO1lBQ3RELFFBQVE7WUFDUixNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBQSx1QkFBZ0IsR0FBRSxDQUFDO1lBRXJDLE9BQU87WUFDUCxNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRTtnQkFDaEQsR0FBRyxXQUFXO2dCQUNkLEtBQUssRUFBRSxLQUFLO2FBQ2IsQ0FBQyxDQUFDO1lBRUgsT0FBTztZQUNQLE1BQU0sQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDaEQscUJBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsZUFBZSxDQUFDLG9DQUFvQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ25GLHFCQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLGVBQWUsQ0FBQyx1Q0FBdUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN4RixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLGlEQUFpRCxFQUFFLEdBQUcsRUFBRTtRQUMzRCxRQUFRO1FBQ1IsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFBLGtCQUFXLEdBQUUsQ0FBQztRQUVyQyxPQUFPO1FBQ1AsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUU7WUFDaEMsR0FBRztZQUNILEdBQUcsV0FBVztZQUNkLEtBQUssRUFBRSxLQUFLO1NBQ2IsQ0FBQyxDQUFDO1FBRUgsT0FBTztRQUNQLHFCQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLHFCQUFxQixDQUFDLGtCQUFrQixFQUFFO1lBQ2xFLElBQUksRUFBRTtnQkFDSixFQUFFLEdBQUcsRUFBRSxxQkFBcUIsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFO2dCQUNoRCxFQUFFLEdBQUcsRUFBRSxxQkFBcUIsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFO2dCQUNoRCxFQUFFLEdBQUcsRUFBRSxpQ0FBaUMsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFO2dCQUN0RCxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLDBCQUEwQixFQUFFO2FBQ25EO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsZ0RBQWdELEVBQUUsR0FBRyxFQUFFO1FBQzFELFFBQVE7UUFDUixNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFHLElBQUEsa0JBQVcsR0FBRSxDQUFDO1FBRXJDLE9BQU87UUFDUCxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRTtZQUNoQyxHQUFHO1lBQ0gsR0FBRyxXQUFXO1lBQ2QsS0FBSyxFQUFFLEtBQUs7U0FDYixDQUFDLENBQUM7UUFFSCxPQUFPO1FBQ1AscUJBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMscUJBQXFCLENBQUMsa0JBQWtCLEVBQUU7WUFDbEUsbUJBQW1CLEVBQUUsSUFBSTtZQUN6QixJQUFJLEVBQUU7Z0JBQ0osRUFBRSxHQUFHLEVBQUUscUJBQXFCLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRTtnQkFDL0MsRUFBRSxHQUFHLEVBQUUscUJBQXFCLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRTtnQkFDL0MsRUFBRSxHQUFHLEVBQUUsd0JBQXdCLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRTtnQkFDN0MsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSx5QkFBeUIsRUFBRTthQUNsRDtTQUNGLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLGdFQUFnRSxFQUFFLEdBQUcsRUFBRTtRQUMxRSxRQUFRO1FBQ1IsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFBLGtCQUFXLEdBQUUsQ0FBQztRQUNyQyxNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRTtZQUNoRCxHQUFHO1lBQ0gsR0FBRyxXQUFXO1lBQ2QsS0FBSyxFQUFFLEtBQUs7U0FDYixDQUFDLENBQUM7UUFFSCxPQUFPO1FBQ1AsT0FBTyxDQUFDLDJCQUEyQixDQUFDLFNBQVMsRUFBRTtZQUM3QyxZQUFZLEVBQUUsSUFBSSxHQUFHLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQztTQUNoRCxDQUFDLENBQUM7UUFFSCxxQkFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxXQUFXLENBQUMsb0NBQW9DLEVBQUU7WUFDMUUsWUFBWSxFQUFFLEVBQUUsMEJBQTBCLEVBQUUsRUFBRSxtQ0FBbUMsRUFBRSxJQUFJLEVBQUUsRUFBRTtTQUM1RixDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQywwQ0FBMEMsRUFBRSxHQUFHLEVBQUU7UUFDcEQsUUFBUTtRQUNSLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBQSxrQkFBVyxHQUFFLENBQUM7UUFDckMsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUU7WUFDaEQsR0FBRztZQUNILEdBQUcsV0FBVztZQUNkLEtBQUssRUFBRSxLQUFLO1NBQ2IsQ0FBQyxDQUFDO1FBRUgsT0FBTztRQUNQLE9BQU8sQ0FBQywyQkFBMkIsQ0FBQyxTQUFTLEVBQUU7WUFDN0MsWUFBWSxFQUFFLElBQUksR0FBRyxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUM7U0FDaEQsQ0FBQyxDQUFDO1FBRUgsT0FBTztRQUNQLHFCQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLHFCQUFxQixDQUFDLG9DQUFvQyxFQUFFO1lBQ3BGLElBQUksRUFBRTtnQkFDSjtvQkFDRSxHQUFHLEVBQUUsRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyx3QkFBd0IsRUFBRSxFQUFFLEdBQUcsRUFBRSxpQkFBaUIsRUFBRSxDQUFDLENBQUMsRUFBRTtvQkFDakYsaUJBQWlCLEVBQUUsSUFBSTtvQkFDdkIsS0FBSyxFQUFFLE9BQU87aUJBQ2Y7Z0JBQ0Q7b0JBQ0UsR0FBRyxFQUFFLE1BQU07b0JBQ1gsaUJBQWlCLEVBQUUsSUFBSTtvQkFDdkIsS0FBSyxFQUFFLHVCQUF1QjtpQkFDL0I7YUFDRjtTQUNGLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLHFDQUFxQyxFQUFFLEdBQUcsRUFBRTtRQUMvQyxRQUFRO1FBQ1IsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUEsdUJBQWdCLEdBQUUsQ0FBQztRQUVyQyxPQUFPO1FBQ1AsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUU7WUFDaEQsbUJBQW1CLEVBQUUsR0FBRyxDQUFDLG1CQUFtQixDQUFDLFNBQVM7WUFDdEQsZUFBZSxFQUFFLEVBQUU7WUFDbkIsdUJBQXVCLEVBQUUsSUFBSSxHQUFHLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQztZQUMxRCxPQUFPLEVBQUUsZUFBZTtZQUN4QixLQUFLLEVBQUUsS0FBSztTQUNiLENBQUMsQ0FBQztRQUVILE1BQU0sWUFBWSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsY0FBYyxFQUFFO1lBQ3ZELFNBQVMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxvQkFBb0IsRUFBRTtTQUMxQyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLFdBQVcsRUFBRTtZQUNwQyxPQUFPO1lBQ1AsUUFBUSxFQUFFLFlBQVk7U0FDdkIsQ0FBQyxDQUFDO1FBRUgsT0FBTztRQUNQLE1BQU0sQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUMvQyxxQkFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxxQkFBcUIsRUFBRTtZQUNyRSxhQUFhLEVBQUU7Z0JBQ2IsV0FBVyxFQUFFLEVBQUU7Z0JBQ2YsT0FBTyxFQUFFLEVBQUU7Z0JBQ1gsT0FBTyxFQUFFLEVBQUU7YUFDWjtTQUNGLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLHVEQUF1RCxFQUFFLEdBQUcsRUFBRTtRQUNqRSxRQUFRO1FBQ1IsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFBLGtCQUFXLEdBQUUsQ0FBQztRQUNyQyxNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRTtZQUNoRCxHQUFHO1lBQ0gsR0FBRyxXQUFXO1lBQ2QsS0FBSyxFQUFFLEtBQUs7U0FDYixDQUFDLENBQUM7UUFFSCxPQUFPO1FBQ1AsT0FBTyxDQUFDLDJCQUEyQixDQUFDLGNBQWMsRUFBRTtZQUNsRCxZQUFZLEVBQUUsSUFBSSxHQUFHLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQztZQUMvQyxnQkFBZ0IsRUFBRSxHQUFHLENBQUMsZ0JBQWdCLENBQUMsWUFBWTtTQUNwRCxDQUFDLENBQUM7UUFFSCxPQUFPO1FBQ1AscUJBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMscUJBQXFCLENBQUMsb0NBQW9DLEVBQUU7WUFDcEYsSUFBSSxFQUFFO2dCQUNKO29CQUNFLEdBQUcsRUFBRSxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLHdCQUF3QixFQUFFLEVBQUUsR0FBRyxFQUFFLGlCQUFpQixFQUFFLENBQUMsQ0FBQyxFQUFFO29CQUNqRixpQkFBaUIsRUFBRSxJQUFJO29CQUN2QixLQUFLLEVBQUUsT0FBTztpQkFDZjtnQkFDRDtvQkFDRSxHQUFHLEVBQUUsTUFBTTtvQkFDWCxpQkFBaUIsRUFBRSxJQUFJO29CQUN2QixLQUFLLEVBQUUsNEJBQTRCO2lCQUNwQzthQUNGO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsaUVBQWlFLEVBQUUsR0FBRyxFQUFFO1FBQzNFLFFBQVE7UUFDUixNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFHLElBQUEsa0JBQVcsR0FBRSxDQUFDO1FBQ3JDLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFO1lBQ2hELEdBQUc7WUFDSCxHQUFHLFdBQVc7WUFDZCxLQUFLLEVBQUUsS0FBSztTQUNiLENBQUMsQ0FBQztRQUVILE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsMkJBQTJCLENBQUMsY0FBYyxFQUFFO1lBQy9ELFlBQVksRUFBRSxJQUFJLEdBQUcsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDO1lBQy9DLGdCQUFnQixFQUFFLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZO1lBQ25ELGdCQUFnQixFQUFFLEVBQUU7U0FDckIsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLG9EQUFvRCxDQUFDLENBQUM7SUFDcEUsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsd0RBQXdELEVBQUUsR0FBRyxFQUFFO1FBQ2xFLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFBLGtCQUFXLEdBQUUsQ0FBQztRQUVoQyxNQUFNLFdBQVcsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsYUFBYSxFQUFFLDRDQUE0QyxDQUFDLENBQUM7UUFFN0csTUFBTSxlQUFlLEdBQUcsa0NBQWUsQ0FBQyw2QkFBNkIsQ0FBQyxLQUFLLEVBQUUsaUJBQWlCLEVBQUU7WUFDOUYsWUFBWSxFQUFFLDhEQUE4RDtZQUM1RSxJQUFJLEVBQUUsV0FBVztTQUNsQixDQUFDLENBQUM7UUFFSCxNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLHFCQUFxQixDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUU7WUFDbEUsV0FBVyxFQUFFLFNBQVM7WUFDdEIsZUFBZSxFQUFFLGVBQWU7U0FDakMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7SUFDM0QsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsOEhBQThILEVBQUUsR0FBRyxFQUFFO1FBQzVJLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLEVBQUU7WUFDOUIsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUEsa0JBQVcsR0FBRSxDQUFDO1lBRWhDLE1BQU0sV0FBVyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxhQUFhLEVBQUUsNENBQTRDLENBQUMsQ0FBQztZQUM3RyxNQUFNLGVBQWUsR0FBRyxrQ0FBZSxDQUFDLDZCQUE2QixDQUFDLEtBQUssRUFBRSxpQkFBaUIsRUFBRTtnQkFDOUYsWUFBWSxFQUFFLDhEQUE4RDtnQkFDNUUsSUFBSSxFQUFFLFdBQVc7YUFDbEIsQ0FBQyxDQUFDO1lBRUgsTUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFO2dCQUNsRSxXQUFXLEVBQUUsU0FBUztnQkFDdEIsZUFBZSxFQUFFLGVBQWU7YUFDakMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUU7Z0JBQ2hDLE9BQU8sRUFBRSxPQUFPO2dCQUNoQixLQUFLLEVBQUUsT0FBTzthQUNmLENBQUMsQ0FBQztZQUVILHFCQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLHFCQUFxQixDQUFDLDhCQUE4QixFQUFFO2dCQUM5RSxZQUFZLEVBQUUsZUFBZSxDQUFDLFlBQVk7YUFDM0MsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMEJBQTBCLEVBQUUsR0FBRyxFQUFFO1lBQ3BDLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFBLGtCQUFXLEdBQUUsQ0FBQztZQUVoQyxNQUFNLFdBQVcsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsYUFBYSxFQUFFLDRDQUE0QyxDQUFDLENBQUM7WUFDN0csTUFBTSxlQUFlLEdBQUcsa0NBQWUsQ0FBQyw2QkFBNkIsQ0FBQyxLQUFLLEVBQUUsaUJBQWlCLEVBQUU7Z0JBQzlGLFlBQVksRUFBRSw4REFBOEQ7Z0JBQzVFLElBQUksRUFBRSxXQUFXO2FBQ2xCLENBQUMsQ0FBQztZQUVILE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMscUJBQXFCLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRTtnQkFDbEUsV0FBVyxFQUFFLFNBQVM7Z0JBQ3RCLGVBQWUsRUFBRSxlQUFlO2FBQ2pDLENBQUMsQ0FBQztZQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFO2dCQUNoQyxPQUFPLEVBQUUsT0FBTztnQkFDaEIsS0FBSyxFQUFFLE9BQU87YUFDZixDQUFDLENBQUM7WUFFSCxJQUFJLEdBQUcsQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRTtnQkFDdEMsT0FBTyxFQUFFLE9BQU87Z0JBQ2hCLFVBQVUsRUFBRSxFQUFFO2dCQUNkLFlBQVksRUFBRSxFQUFFO2dCQUNoQixZQUFZLEVBQUUsZUFBZTthQUM5QixDQUFDLENBQUM7WUFFSCxxQkFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxvQ0FBb0MsRUFBRTtnQkFDcEYsWUFBWSxFQUFFLGVBQWUsQ0FBQyxZQUFZO2FBQzNDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGlDQUFpQyxFQUFFLEdBQUcsRUFBRTtZQUMzQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBQSxrQkFBVyxHQUFFLENBQUM7WUFFaEMsTUFBTSxXQUFXLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLGFBQWEsRUFBRSw0Q0FBNEMsQ0FBQyxDQUFDO1lBQzdHLE1BQU0sZUFBZSxHQUFHLGtDQUFlLENBQUMsNkJBQTZCLENBQUMsS0FBSyxFQUFFLGlCQUFpQixFQUFFO2dCQUM5RixZQUFZLEVBQUUsOERBQThEO2dCQUM1RSxJQUFJLEVBQUUsV0FBVzthQUNsQixDQUFDLENBQUM7WUFFSCxNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLHFCQUFxQixDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUU7Z0JBQ2xFLFdBQVcsRUFBRSxTQUFTO2dCQUN0QixlQUFlLEVBQUUsZUFBZTthQUNqQyxDQUFDLENBQUM7WUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRTtnQkFDaEMsT0FBTyxFQUFFLE9BQU87Z0JBQ2hCLEtBQUssRUFBRSxPQUFPO2FBQ2YsQ0FBQyxDQUFDO1lBRUgsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUU7Z0JBQ3RDLE9BQU8sRUFBRSxPQUFPO2dCQUNoQixVQUFVLEVBQUUsRUFBRTtnQkFDZCxZQUFZLEVBQUUsRUFBRTtnQkFDaEIsWUFBWSxFQUFFLGVBQWU7YUFDOUIsQ0FBQyxDQUFDO1lBRUgsSUFBSSxHQUFHLENBQUMsa0JBQWtCLENBQUMsS0FBSyxFQUFFLFVBQVUsRUFBRTtnQkFDNUMsT0FBTyxFQUFFLE9BQU87Z0JBQ2hCLFFBQVEsRUFBRSxFQUFFO2FBQ2IsQ0FBQyxDQUFDO1lBRUgsSUFBSSxHQUFHLENBQUMscUJBQXFCLENBQUMsS0FBSyxFQUFFLGFBQWEsRUFBRTtnQkFDbEQsT0FBTyxFQUFFLE9BQU87Z0JBQ2hCLFFBQVEsRUFBRSxFQUFFO2dCQUNaLFVBQVUsRUFBRSxNQUFNO2dCQUNsQixVQUFVLEVBQUUsTUFBTTthQUNuQixDQUFDLENBQUM7WUFFSCxxQkFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQywwQ0FBMEMsRUFBRTtnQkFDMUYsWUFBWSxFQUFFLGVBQWUsQ0FBQyxZQUFZO2FBQzNDLENBQUMsQ0FBQztZQUVILE1BQU0sQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDMUUsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyx3QkFBd0IsRUFBRSxHQUFHLEVBQUU7UUFDbEMsUUFBUTtRQUNSLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFBLGtCQUFXLEdBQUUsQ0FBQztRQUNsRCxNQUFNLE1BQU0sR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLFFBQVEsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDOUUsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUU7WUFDakQsR0FBRztZQUNILEdBQUcsV0FBVztZQUNkLEtBQUssRUFBRSxLQUFLO1NBQ2IsQ0FBQyxDQUFDO1FBRUgsT0FBTztRQUNQLE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMscUJBQXFCLENBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRTtZQUNyRSxHQUFHLEVBQUUsT0FBTyxDQUFDLEdBQUc7WUFDaEIsZUFBZSxFQUFFLE9BQU8sQ0FBQyxlQUFlO1lBQ3hDLFdBQVcsRUFBRSxPQUFPLENBQUMsV0FBVztZQUNoQyxnQkFBZ0IsRUFBRSxPQUFPLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDO1lBQ2hGLCtCQUErQixFQUFFLE9BQU8sQ0FBQywrQkFBK0I7WUFDeEUsc0JBQXNCLEVBQUUsT0FBTyxDQUFDLHNCQUFzQjtZQUN0RCw2QkFBNkIsRUFBRSxPQUFPLENBQUMsNkJBQTZCO1NBQ3JFLENBQUMsQ0FBQztRQUVILHFDQUFxQztRQUNyQyxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLFlBQVksRUFBRSxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztRQUV4RSxPQUFPO1FBQ1AscUJBQVEsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsZUFBZSxDQUFDO1lBQ3pDLE9BQU8sRUFBRTtnQkFDUCxVQUFVLEVBQUU7b0JBQ1YsS0FBSyxFQUFFO3dCQUNMLFVBQVUsRUFBRTs0QkFDVixFQUFFOzRCQUNGO2dDQUNFLE1BQU07Z0NBQ047b0NBQ0UsR0FBRyxFQUFFLGdCQUFnQjtpQ0FDdEI7Z0NBQ0QsaUJBQWlCO2dDQUNqQjtvQ0FDRSxHQUFHLEVBQUUsZ0JBQWdCO2lDQUN0QjtnQ0FDRCxXQUFXO2dDQUNYO29DQUNFLGlCQUFpQixFQUFFLCtDQUErQztpQ0FDbkU7NkJBQ0Y7eUJBQ0Y7cUJBQ0Y7aUJBQ0Y7YUFDRjtTQUNGLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLGdFQUFnRSxFQUFFLEdBQUcsRUFBRTtRQUMxRSxRQUFRO1FBQ1IsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFBLGtCQUFXLEdBQUUsQ0FBQztRQUNyQyxNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRTtZQUNoRCxHQUFHO1lBQ0gsR0FBRyxXQUFXO1lBQ2QsS0FBSyxFQUFFLEtBQUs7WUFDWixzQkFBc0IsRUFBRTtnQkFDdEIsWUFBWSxFQUFFLElBQUksMENBQWUsQ0FBQyxLQUFLLEVBQUUsY0FBYyxDQUFDO2FBQ3pEO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsT0FBTztRQUNQLE9BQU8sQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDL0MsT0FBTyxDQUFDLFdBQVcsQ0FBQyxXQUFXLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUVwRSxPQUFPO1FBQ1AscUJBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLGFBQWEsRUFBRTtZQUNwRixRQUFRLEVBQUUsZUFBZTtTQUMxQixDQUFDLENBQUM7UUFFSCxxQkFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsYUFBYSxFQUFFO1lBQ3BGLFFBQVEsRUFBRSxnQ0FBZ0M7U0FDM0MsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsc0RBQXNELEVBQUUsR0FBRyxFQUFFO1FBQ2hFLFFBQVE7UUFDUixNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFHLElBQUEsa0JBQVcsR0FBRSxDQUFDO1FBQ3JDLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFO1lBQ2hELE9BQU8sRUFBRSxlQUFlO1lBQ3hCLEtBQUssRUFBRSxLQUFLO1lBQ1osc0JBQXNCLEVBQUU7Z0JBQ3RCLFlBQVksRUFBRSxJQUFJLDBDQUFlLENBQUMsS0FBSyxFQUFFLGNBQWMsQ0FBQzthQUN6RDtTQUNGLENBQUMsQ0FBQyxDQUFDLDBCQUEwQjtRQUU5QixnQ0FBZ0M7UUFDaEMsTUFBTSxNQUFNLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN2RyxJQUFJLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLEVBQUUsWUFBWSxFQUFFO1lBQy9DLE9BQU87WUFDUCxRQUFRLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQztTQUMzQixDQUFDLENBQUM7UUFFSCxPQUFPO1FBQ1AsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsd0VBQXdFO1FBRXJGLDRDQUE0QztRQUM1QyxxQkFBUSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxlQUFlLENBQUM7WUFDekMsU0FBUyxFQUFFO2dCQUNULGtCQUFrQixFQUFFO29CQUNsQixJQUFJLEVBQUUsdUNBQXVDO29CQUM3QyxVQUFVLEVBQUU7d0JBQ1YsWUFBWSxFQUFFOzRCQUNaLGlCQUFpQixFQUFFLHNGQUFzRjt5QkFDMUc7d0JBQ0QsUUFBUSxFQUFFLHFCQUFxQjt3QkFDL0IsV0FBVyxFQUFFLEVBQUUsaUJBQWlCLEVBQUUsK0NBQStDLEVBQUU7cUJBQ3BGO29CQUNELG1CQUFtQixFQUFFLFFBQVE7b0JBQzdCLGNBQWMsRUFBRSxRQUFRO2lCQUN6QjthQUNGO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRTtRQUN2QixJQUFJLENBQUMsdUNBQXVDLEVBQUUsR0FBRyxFQUFFO1lBQ2pELFFBQVE7WUFDUixNQUFNLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUEsdUJBQWdCLEdBQUUsQ0FBQztZQUUxQyxPQUFPO1lBQ1AsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRSxPQUFPLEVBQUUsZUFBZSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBRTlFLE9BQU87WUFDUCxNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDN0IsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsUUFBUSxDQUFDO1lBQ25FLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxhQUFhO1FBQ3pELENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLG9CQUFvQixFQUFFLEdBQUcsRUFBRTtZQUNsQyxJQUFJLENBQUMsOEJBQThCLEVBQUUsR0FBRyxFQUFFO2dCQUN4QyxRQUFRO2dCQUNSLE1BQU0sRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBQSx1QkFBZ0IsR0FBRSxDQUFDO2dCQUMxQyxNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRTtvQkFDaEQsR0FBRyxXQUFXO29CQUNkLEtBQUssRUFBRSxLQUFLO2lCQUNiLENBQUMsQ0FBQztnQkFFSCxPQUFPO2dCQUNQLE9BQU8sQ0FBQywyQkFBMkIsQ0FBQyxXQUFXLEVBQUUsRUFBRSxZQUFZLEVBQUUsSUFBSSxHQUFHLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFFdEcsT0FBTztnQkFDUCxNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxRQUFRLENBQUM7Z0JBQ3RFLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsb0NBQW9DLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQztnQkFDN0YsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLFlBQVksRUFBRSxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLG9EQUFvRCxFQUFFLEVBQUUsR0FBRyxFQUFFLGlCQUFpQixFQUFFLEVBQUUsa0ZBQWtGLEVBQUUsRUFBRSxZQUFZLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRSxVQUFVLENBQUMsRUFBRSxFQUFFLHdCQUF3QixFQUFFLEVBQUUsWUFBWSxFQUFFLENBQUMsaUJBQWlCLEVBQUUsMEJBQTBCLENBQUMsRUFBRSxFQUFFLHdJQUF3SSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNyZ0IsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsdUNBQXVDLEVBQUUsR0FBRyxFQUFFO2dCQUNqRCxRQUFRO2dCQUNSLE1BQU0sRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBQSx1QkFBZ0IsR0FBRSxDQUFDO2dCQUMxQyxNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRTtvQkFDaEQsR0FBRyxXQUFXO29CQUNkLEtBQUssRUFBRSxLQUFLO2lCQUNiLENBQUMsQ0FBQztnQkFFSCxPQUFPO2dCQUNQLE9BQU8sQ0FBQywyQkFBMkIsQ0FBQyxXQUFXLEVBQUU7b0JBQy9DLFlBQVksRUFBRSxJQUFJLEdBQUcsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDO29CQUMvQyxnQkFBZ0IsRUFBRSxLQUFLO2lCQUN4QixDQUFDLENBQUM7Z0JBRUgsT0FBTztnQkFDUCxNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxRQUFRLENBQUM7Z0JBQ3RFLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsb0NBQW9DLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQztnQkFDN0YsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUUsQ0FBQyxDQUFDO1lBQzVELENBQUMsQ0FBQyxDQUFDO1lBRUgsaUVBQWlFO1lBQ2pFLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLEVBQUU7Z0JBQzdCLFFBQVE7Z0JBQ1IsTUFBTSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFBLHVCQUFnQixHQUFFLENBQUM7Z0JBQzFDLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFO29CQUNoRCxHQUFHLFdBQVc7b0JBQ2QsS0FBSyxFQUFFLEtBQUs7aUJBQ2IsQ0FBQyxDQUFDO2dCQUVILE9BQU87Z0JBQ1AsT0FBTyxDQUFDLDJCQUEyQixDQUFDLFdBQVcsRUFBRTtvQkFDL0MsWUFBWSxFQUFFLElBQUksR0FBRyxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUM7b0JBQy9DLGdCQUFnQixFQUFFO3dCQUNoQixnQkFBZ0IsRUFBRSxzQkFBc0I7cUJBQ3pDO2lCQUNGLENBQUMsQ0FBQztnQkFFSCxPQUFPO2dCQUNQLE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLFFBQVEsQ0FBQztnQkFDdEUsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxvQ0FBb0MsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDO2dCQUM3RixNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsWUFBWSxFQUFFLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsb0RBQW9ELEVBQUUsRUFBRSxHQUFHLEVBQUUsaUJBQWlCLEVBQUUsRUFBRSx3R0FBd0csRUFBRSxFQUFFLFlBQVksRUFBRSxDQUFDLGlCQUFpQixFQUFFLFVBQVUsQ0FBQyxFQUFFLEVBQUUsd0JBQXdCLEVBQUUsRUFBRSxZQUFZLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRSwwQkFBMEIsQ0FBQyxFQUFFLEVBQUUsd0lBQXdJLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzNoQixDQUFDLENBQUMsQ0FBQztZQUVILFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUU7Z0JBQzlCLElBQUksQ0FBQyxzQ0FBc0MsRUFBRSxHQUFHLEVBQUU7b0JBQ2hELFFBQVE7b0JBQ1IsTUFBTSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFBLHVCQUFnQixHQUFFLENBQUM7b0JBQzFDLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFO3dCQUNoRCxHQUFHLFdBQVc7d0JBQ2QsS0FBSyxFQUFFLEtBQUs7d0JBQ1osc0JBQXNCLEVBQUU7NEJBQ3RCLFlBQVksRUFBRSxJQUFJLDBDQUFlLENBQUMsS0FBSyxFQUFFLGNBQWMsQ0FBQzt5QkFDekQ7cUJBQ0YsQ0FBQyxDQUFDO29CQUVILE9BQU87b0JBQ1AsT0FBTyxDQUFDLDJCQUEyQixDQUFDLFdBQVcsRUFBRTt3QkFDL0MsWUFBWSxFQUFFLElBQUksR0FBRyxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUM7d0JBQy9DLFNBQVMsRUFBRSxNQUFNO3FCQUNsQixDQUFDLENBQUM7b0JBRUgsT0FBTztvQkFDUCxNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxRQUFRLENBQUM7b0JBQ3RFLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsb0NBQW9DLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQztvQkFDN0YsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLFlBQVksRUFBRSxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLG9EQUFvRCxFQUFFLEVBQUUsR0FBRyxFQUFFLGlCQUFpQixFQUFFLEVBQUUsMklBQTJJLEVBQUUsRUFBRSxZQUFZLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRSxVQUFVLENBQUMsRUFBRSxFQUFFLHdCQUF3QixFQUFFLEVBQUUsWUFBWSxFQUFFLENBQUMsaUJBQWlCLEVBQUUsMEJBQTBCLENBQUMsRUFBRSxFQUFFLHdJQUF3SSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDOWpCLENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxpREFBaUQsRUFBRSxHQUFHLEVBQUU7WUFDM0QsUUFBUTtZQUNSLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFBLHVCQUFnQixHQUFFLENBQUM7WUFDckMsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUU7Z0JBQ2hELEdBQUcsV0FBVztnQkFDZCxLQUFLLEVBQUUsS0FBSzthQUNiLENBQUMsQ0FBQztZQUVILE9BQU87WUFDUCxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLDJCQUEyQixDQUFDLFdBQVcsRUFBRTtnQkFDNUQsWUFBWSxFQUFFLElBQUksR0FBRyxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUM7Z0JBQy9DLGdCQUFnQixFQUFFLEtBQUs7Z0JBQ3ZCLGdCQUFnQixFQUFFLEVBQUUsbUJBQW1CLEVBQUUsRUFBRSxFQUFFO2FBQzlDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxrRUFBa0UsQ0FBQyxDQUFDO1FBQ2xGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDBGQUEwRixFQUFFLEdBQUcsRUFBRTtZQUNwRyxRQUFRO1lBQ1IsTUFBTSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFBLHVCQUFnQixHQUFFLENBQUM7WUFDMUMsTUFBTSx5QkFBeUIsR0FBRyxNQUFNLENBQUM7WUFFekMsT0FBTztZQUNQLElBQUksR0FBRyxDQUFDLGlCQUFpQixFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRTVDLE9BQU87WUFDUCxNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDN0IsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQztZQUNoRixNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQ3BDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsNENBQTRDLENBQUM7Z0JBQ25FLENBQVMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLENBQ2xELENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDakIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUNwQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLDRDQUE0QyxDQUFDO2dCQUNuRSxDQUFTLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyx5QkFBeUIsQ0FBQyxDQUN6RCxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ25CLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHdFQUF3RSxFQUFFLEdBQUcsRUFBRTtZQUNsRixRQUFRO1lBQ1IsTUFBTSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFBLHVCQUFnQixHQUFFLENBQUM7WUFFMUMsT0FBTztZQUNQLElBQUksR0FBRyxDQUFDLGlCQUFpQixDQUFDLEVBQUUsaUJBQWlCLEVBQUUsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRTFGLE9BQU87WUFDUCxNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDN0IsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQztZQUNoRixNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQ3BDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsNENBQTRDLENBQUM7Z0JBQ25FLENBQVMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLENBQ2xELENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDakIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUNwQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLDRDQUE0QyxDQUFDO2dCQUNuRSxDQUFTLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FDeEMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNuQixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw2RkFBNkYsRUFBRSxHQUFHLEVBQUU7WUFDdkcsUUFBUTtZQUNSLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFBLHVCQUFnQixHQUFFLENBQUM7WUFFckMsT0FBTztZQUNQLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFO2dCQUNoQyxtQkFBbUIsRUFBRSxHQUFHLENBQUMsbUJBQW1CLENBQUMsU0FBUztnQkFDdEQsZUFBZSxFQUFFLENBQUM7Z0JBQ2xCLE9BQU8sRUFBRSxlQUFlO2dCQUN4QixLQUFLLEVBQUUsS0FBSztnQkFDWix1QkFBdUIsRUFBRSxJQUFJLEdBQUcsQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDO2FBQzVELENBQUMsQ0FBQztZQUVILE9BQU87WUFDUCxxQkFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxxQkFBcUIsRUFBRTtnQkFDckUsT0FBTyxFQUFFLFlBQVk7YUFDdEIsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsaUZBQWlGLEVBQUUsR0FBRyxFQUFFO1lBQzNGLFFBQVE7WUFDUixNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBQSx1QkFBZ0IsR0FBRSxDQUFDO1lBRXJDLE9BQU87WUFDUCxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRTtnQkFDaEMsR0FBRyxXQUFXO2dCQUNkLEtBQUssRUFBRSxLQUFLO2dCQUNaLHVCQUF1QixFQUFFLElBQUksR0FBRyxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUM7YUFDNUQsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLElBQUksRUFBRTtnQkFDNUIsYUFBYSxFQUFFLENBQUMsSUFBSSxHQUFHLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxDQUFDO2FBQ3BELENBQUMsQ0FBQztZQUVILE9BQU87WUFDUCxxQkFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxxQkFBcUIsRUFBRTtnQkFDckUsT0FBTyxFQUFFLFlBQVk7YUFDdEIsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsdUZBQXVGLEVBQUUsR0FBRyxFQUFFO1lBQ2pHLFFBQVE7WUFDUixNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBQSx1QkFBZ0IsR0FBRSxDQUFDO1lBRXJDLE9BQU87WUFDUCxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRTtnQkFDaEMsR0FBRyxXQUFXO2dCQUNkLEtBQUssRUFBRSxLQUFLO2dCQUNaLHVCQUF1QixFQUFFLElBQUksR0FBRyxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUM7YUFDNUQsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLElBQUksRUFBRTtnQkFDNUIsYUFBYSxFQUFFLENBQUMsSUFBSSxHQUFHLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxDQUFDO2FBQ3BELENBQUMsQ0FBQztZQUVILE9BQU87WUFDUCxxQkFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxxQkFBcUIsRUFBRTtnQkFDckUsT0FBTyxFQUFFLFlBQVk7YUFDdEIsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsOEZBQThGLEVBQUUsR0FBRyxFQUFFO1lBQ3hHLFFBQVE7WUFDUixNQUFNLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUEsdUJBQWdCLEdBQUUsQ0FBQztZQUUxQyxPQUFPO1lBQ1AsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUU7Z0JBQ2hDLEdBQUcsV0FBVztnQkFDZCxLQUFLLEVBQUUsS0FBSzthQUNiLENBQUMsQ0FBQywyQkFBMkIsQ0FBQyxJQUFJLEVBQUU7Z0JBQ25DLFlBQVksRUFBRSxJQUFJLEdBQUcsQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDO2FBQ2pELENBQUMsQ0FBQztZQUVILE9BQU87WUFDUCxNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDN0IsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQztZQUNoRixNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQ3BDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsNENBQTRDLENBQUM7Z0JBQ25FLENBQVMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLHVCQUF1QixDQUFDLENBQ3ZELENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbkIsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsdUZBQXVGLEVBQUUsR0FBRyxFQUFFO1lBQ2pHLFFBQVE7WUFDUixNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBQSx1QkFBZ0IsR0FBRSxDQUFDO1lBRXJDLE9BQU87WUFDUCxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRTtnQkFDaEMsR0FBRyxXQUFXO2dCQUNkLEtBQUssRUFBRSxLQUFLO2dCQUNaLHVCQUF1QixFQUFFLElBQUksR0FBRyxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUM7YUFDM0QsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLElBQUksRUFBRTtnQkFDNUIsYUFBYSxFQUFFLENBQUMsSUFBSSxHQUFHLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2FBQ25ELENBQUMsQ0FBQztZQUVILE9BQU87WUFDUCxxQkFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxxQkFBcUIsRUFBRTtnQkFDckUsT0FBTyxFQUFFLFlBQVk7YUFDdEIsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsOEZBQThGLEVBQUUsR0FBRyxFQUFFO1lBQ3hHLFFBQVE7WUFDUixNQUFNLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUEsdUJBQWdCLEdBQUUsQ0FBQztZQUUxQyxPQUFPO1lBQ1AsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUU7Z0JBQ2hDLEdBQUcsV0FBVztnQkFDZCxLQUFLLEVBQUUsS0FBSzthQUNiLENBQUMsQ0FBQywyQkFBMkIsQ0FBQyxJQUFJLEVBQUU7Z0JBQ25DLFlBQVksRUFBRSxJQUFJLEdBQUcsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDO2FBQ2hELENBQUMsQ0FBQztZQUVILE9BQU87WUFDUCxNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDN0IsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQztZQUNoRixNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQ3BDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsNENBQTRDLENBQUM7Z0JBQ25FLENBQVMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLHVCQUF1QixDQUFDLENBQ3ZELENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbkIsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMscUVBQXFFLEVBQUUsR0FBRyxFQUFFO1lBQy9FLFFBQVE7WUFDUixNQUFNLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUEsdUJBQWdCLEdBQUUsQ0FBQztZQUUxQyxPQUFPO1lBQ1AsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUU7Z0JBQ2hDLEdBQUcsV0FBVztnQkFDZCxLQUFLLEVBQUUsS0FBSzthQUNiLENBQUMsQ0FBQywyQkFBMkIsQ0FBQyxhQUFhLEVBQUU7Z0JBQzVDLFlBQVksRUFBRSxJQUFJLEdBQUcsQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDO2FBQ2xELENBQUMsQ0FBQztZQUVILE9BQU87WUFDUCxNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDN0IsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQztZQUNoRixNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQ3BDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsNENBQTRDLENBQUMsSUFBSyxDQUFTLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBQyxDQUM1SCxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ25CLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLCtEQUErRCxFQUFFLEdBQUcsRUFBRTtZQUN6RSxRQUFRO1lBQ1IsTUFBTSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFBLHVCQUFnQixHQUFFLENBQUM7WUFFMUMsT0FBTztZQUNQLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFO2dCQUNoQyxHQUFHLFdBQVc7Z0JBQ2QsS0FBSyxFQUFFLEtBQUs7YUFDYixDQUFDLENBQUMsMkJBQTJCLENBQUMsYUFBYSxFQUFFO2dCQUM1QyxZQUFZLEVBQUUsSUFBSSxHQUFHLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQzthQUNqRCxDQUFDLENBQUM7WUFFSCxPQUFPO1lBQ1AsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQzdCLE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUM7WUFDaEYsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUNwQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLDRDQUE0QyxDQUFDLElBQUssQ0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsd0JBQXdCLENBQUMsQ0FDaEksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNuQixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx3RUFBd0UsRUFBRSxHQUFHLEVBQUU7WUFDbEYsUUFBUTtZQUNSLE1BQU0sRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBQSx1QkFBZ0IsR0FBRSxDQUFDO1lBRTFDLE9BQU87WUFDUCxJQUFJLGdDQUFpQixDQUFDLEVBQUUsaUJBQWlCLEVBQUUsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRXRGLE9BQU87WUFDUCxNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDN0IsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQztZQUNoRixNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQ3BDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsNENBQTRDLENBQUM7Z0JBQ25FLENBQVMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLENBQ2hELENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDakIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUNwQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLDRDQUE0QyxDQUFDO2dCQUNuRSxDQUFTLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUNoRCxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ25CLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDJIQUEySCxFQUFFLEdBQUcsRUFBRTtZQUNySSxRQUFRO1lBQ1IsTUFBTSxLQUFLLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7WUFFOUIsT0FBTztZQUNQLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsV0FBVyxFQUFFO2dCQUNsQyxrQkFBa0IsRUFBRSxHQUFHLENBQUMsa0JBQWtCLENBQUMsT0FBTztnQkFDbEQsT0FBTyxFQUFFLGVBQWU7Z0JBQ3hCLEtBQUssRUFBRSxLQUFLO2dCQUNaLHNCQUFzQixFQUFFO29CQUN0QixZQUFZLEVBQUUsSUFBSSwwQ0FBZSxDQUFDLEtBQUssRUFBRSxjQUFjLENBQUM7aUJBQ3pEO2FBQ0YsQ0FBQyxDQUFDO1lBRUgsT0FBTztZQUNQLHFCQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLHFCQUFxQixDQUFDLG9DQUFvQyxFQUFFO2dCQUNwRixZQUFZLEVBQUUsb0JBQW9CO2dCQUNsQyxpQkFBaUIsRUFBRSxhQUFhO2dCQUNoQyxjQUFjLEVBQUUsaUdBQWlHO2dCQUNqSCxnQkFBZ0IsRUFBRSw2RkFBNkY7Z0JBQy9HLFdBQVcsRUFBRTtvQkFDWCxHQUFHLEVBQUUsbUJBQW1CO2lCQUN6QjthQUNGLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHNGQUFzRixFQUFFLEdBQUcsRUFBRTtZQUNoRyxRQUFRO1lBQ1IsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUEsdUJBQWdCLEdBQUUsQ0FBQztZQUNyQyxNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRTtnQkFDaEQsR0FBRyxXQUFXO2dCQUNkLEtBQUssRUFBRSxLQUFLO2FBQ2IsQ0FBQyxDQUFDO1lBRUgsT0FBTztZQUNQLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQztZQUUvQyxPQUFPO1lBQ1AsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMscUJBQXFCLENBQUMsQ0FBQztZQUN4RCxxQkFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxxQ0FBcUMsRUFBRTtnQkFDckYsWUFBWSxFQUFFO29CQUNaLFlBQVksRUFBRTt3QkFDWix3RUFBd0U7d0JBQ3hFLEtBQUs7cUJBQ047aUJBQ0Y7Z0JBQ0QsWUFBWSxFQUFFO29CQUNaLG1CQUFtQjtpQkFDcEI7Z0JBQ0QsR0FBRyxFQUFFO29CQUNILFlBQVksRUFBRTt3QkFDWixpQkFBaUI7d0JBQ2pCLHdCQUF3QjtxQkFDekI7aUJBQ0Y7YUFDRixDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxvRkFBb0YsRUFBRSxHQUFHLEVBQUU7WUFDOUYsUUFBUTtZQUNSLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFBLHVCQUFnQixHQUFFLENBQUM7WUFDckMsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsd0NBQXdDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDdEUsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUU7Z0JBQ2hELEdBQUcsV0FBVztnQkFDZCxLQUFLLEVBQUUsS0FBSzthQUNiLENBQUMsQ0FBQztZQUVILE9BQU87WUFDUCxPQUFPLENBQUMscUJBQXFCLENBQUM7WUFFOUIsT0FBTztZQUNQLHFCQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLHFCQUFxQixDQUFDLHdCQUF3QixFQUFFO2dCQUN4RSxZQUFZLEVBQUU7b0JBQ1osbUJBQW1CO2lCQUNwQjtnQkFDRCxHQUFHLEVBQUU7b0JBQ0gsWUFBWSxFQUFFO3dCQUNaLGlCQUFpQjt3QkFDakIsd0JBQXdCO3FCQUN6QjtpQkFDRjthQUNGLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDhGQUE4RixFQUFFLEdBQUcsRUFBRTtZQUN4RyxRQUFRO1lBQ1IsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUEsdUJBQWdCLEdBQUUsQ0FBQztZQUNyQyxNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRTtnQkFDaEQsR0FBRyxXQUFXO2dCQUNkLEtBQUssRUFBRSxLQUFLO2FBQ2IsQ0FBQyxDQUFDO1lBRUgsT0FBTztZQUNQLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQztZQUU5QixPQUFPO1lBRVAscUJBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMscUJBQXFCLENBQUMscUNBQXFDLEVBQUU7Z0JBQ3JGLFlBQVksRUFBRTtvQkFDWixtQkFBbUI7aUJBQ3BCO2dCQUNELEdBQUcsRUFBRTtvQkFDSCxZQUFZLEVBQUU7d0JBQ1osaUJBQWlCO3dCQUNqQix3QkFBd0I7cUJBQ3pCO2lCQUNGO2FBQ0YsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNEVBQTRFLEVBQUUsR0FBRyxFQUFFO1lBQ3RGLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFBLHVCQUFnQixHQUFFLENBQUM7WUFFckMsTUFBTSwwQkFBMEIsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLHFCQUFxQixDQUFDLEtBQUssRUFBRSxvQkFBb0IsRUFBRTtnQkFDaEcsV0FBVyxFQUFFLFlBQVk7Z0JBQ3pCLHFCQUFxQixFQUFFLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyw0QkFBNEIsQ0FBQyxLQUFLLEVBQUUseUJBQXlCLEVBQUUsOEdBQThHLENBQUM7YUFDaE8sQ0FBQyxDQUFDO1lBRUgsTUFBTSxDQUFDLDBCQUEwQixDQUFDLHFCQUFxQixDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUN2RyxNQUFNLENBQUMsMEJBQTBCLENBQUMscUJBQXFCLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNuRyxNQUFNLENBQUMsMEJBQTBCLENBQUMscUJBQXFCLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUVoRyxNQUFNLDZCQUE2QixHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMscUJBQXFCLENBQUMsS0FBSyxFQUFFLHVCQUF1QixFQUFFO2dCQUN0RyxXQUFXLEVBQUUsWUFBWTtnQkFDekIscUJBQXFCLEVBQUUsR0FBRyxDQUFDLGtCQUFrQixDQUFDLG1CQUFtQixDQUFDLEtBQUssRUFBRSw0QkFBNEIsRUFBRSw4R0FBOEcsQ0FBQzthQUN2TixDQUFDLENBQUM7WUFFSCxNQUFNLENBQUMsNkJBQTZCLENBQUMscUJBQXFCLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQzFHLE1BQU0sQ0FBQyw2QkFBNkIsQ0FBQyxxQkFBcUIsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ3RHLE1BQU0sQ0FBQyw2QkFBNkIsQ0FBQyxxQkFBcUIsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3JHLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDhCQUE4QixFQUFFLEdBQUcsRUFBRTtZQUN4QyxRQUFRO1lBQ1IsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUEsdUJBQWdCLEdBQUUsQ0FBQztZQUNyQyxNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRTtnQkFDaEQsR0FBRyxXQUFXO2dCQUNkLEtBQUssRUFBRSxLQUFLO2dCQUNaLHNCQUFzQixFQUFFO29CQUN0QixZQUFZLEVBQUUsSUFBSSwwQ0FBZSxDQUFDLEtBQUssRUFBRSxjQUFjLENBQUM7aUJBQ3pEO2FBQ0YsQ0FBQyxDQUFDO1lBRUgsT0FBTztZQUNQLE9BQU8sQ0FBQywyQkFBMkIsQ0FBQyxvQkFBb0IsRUFBRTtnQkFDeEQsWUFBWSxFQUFFLElBQUksR0FBRyxDQUFDLFlBQVksQ0FBQyxjQUFjLENBQUM7Z0JBQ2xELFdBQVcsRUFBRSxDQUFDO2FBQ2YsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSwyQkFBMkIsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3ZILE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7WUFFM0MsT0FBTztZQUNQLHFCQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxhQUFhLEVBQUU7Z0JBQ3BGLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7YUFDdEMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsOEJBQThCLEVBQUUsR0FBRyxFQUFFO1lBQ3hDLFFBQVE7WUFDUixNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBQSx1QkFBZ0IsR0FBRSxDQUFDO1lBQ3JDLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFO2dCQUNoRCxHQUFHLFdBQVc7Z0JBQ2QsS0FBSyxFQUFFLEtBQUs7Z0JBQ1osc0JBQXNCLEVBQUU7b0JBQ3RCLFlBQVksRUFBRSxJQUFJLDBDQUFlLENBQUMsS0FBSyxFQUFFLGNBQWMsQ0FBQztpQkFDekQ7YUFDRixDQUFDLENBQUM7WUFFSCxPQUFPO1lBQ1AsT0FBTyxDQUFDLDJCQUEyQixDQUFDLG9CQUFvQixFQUFFO2dCQUN4RCxZQUFZLEVBQUUsSUFBSSxHQUFHLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQztnQkFDakQsV0FBVyxFQUFFLENBQUM7YUFDZixDQUFDLENBQUM7WUFDSCxNQUFNLFlBQVksR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLDJCQUEyQixDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDdkgsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUUzQyxPQUFPO1lBQ1AscUJBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLGFBQWEsRUFBRTtnQkFDcEYsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQzthQUN0QyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyw4QkFBOEIsRUFBRSxHQUFHLEVBQUU7WUFDeEMsUUFBUTtZQUNSLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFBLHVCQUFnQixHQUFFLENBQUM7WUFDckMsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUU7Z0JBQ2hELEdBQUcsV0FBVztnQkFDZCxLQUFLLEVBQUUsS0FBSztnQkFDWixzQkFBc0IsRUFBRTtvQkFDdEIsWUFBWSxFQUFFLElBQUksMENBQWUsQ0FBQyxLQUFLLEVBQUUsY0FBYyxDQUFDO2lCQUN6RDthQUNGLENBQUMsQ0FBQztZQUVILE9BQU87WUFDUCxPQUFPLENBQUMsMkJBQTJCLENBQUMsbUJBQW1CLEVBQUU7Z0JBQ3ZELFlBQVksRUFBRSxJQUFJLEdBQUcsQ0FBQyxZQUFZLENBQUMsY0FBYyxDQUFDO2dCQUNsRCxXQUFXLEVBQUUsQ0FBQzthQUNmLENBQUMsQ0FBQztZQUNILE1BQU0sWUFBWSxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsMkJBQTJCLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN2SCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBRTNDLE9BQU87WUFDUCxxQkFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsYUFBYSxFQUFFO2dCQUNwRixRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2FBQ3RDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLCtCQUErQixFQUFFLEdBQUcsRUFBRTtZQUN6QyxRQUFRO1lBQ1IsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUEsdUJBQWdCLEdBQUUsQ0FBQztZQUNyQyxNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRTtnQkFDaEQsR0FBRyxXQUFXO2dCQUNkLEtBQUssRUFBRSxLQUFLO2dCQUNaLHNCQUFzQixFQUFFO29CQUN0QixZQUFZLEVBQUUsSUFBSSwwQ0FBZSxDQUFDLEtBQUssRUFBRSxjQUFjLENBQUM7aUJBQ3pEO2FBQ0YsQ0FBQyxDQUFDO1lBRUgsT0FBTztZQUNQLE9BQU8sQ0FBQywyQkFBMkIsQ0FBQyxtQkFBbUIsRUFBRTtnQkFDdkQsWUFBWSxFQUFFLElBQUksR0FBRyxDQUFDLFlBQVksQ0FBQyxlQUFlLENBQUM7Z0JBQ25ELFdBQVcsRUFBRSxDQUFDO2FBQ2YsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSwyQkFBMkIsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3ZILE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7WUFFM0MsT0FBTztZQUNQLHFCQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxhQUFhLEVBQUU7Z0JBQ3BGLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7YUFDdEMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsc0RBQXNELEVBQUUsR0FBRyxFQUFFO1lBQ2hFLFFBQVE7WUFDUixNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBQSx1QkFBZ0IsR0FBRSxDQUFDO1lBQ3JDLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFO2dCQUNoRCxHQUFHLFdBQVc7Z0JBQ2QsS0FBSyxFQUFFLEtBQUs7Z0JBQ1osc0JBQXNCLEVBQUU7b0JBQ3RCLFlBQVksRUFBRSxJQUFJLDBDQUFlLENBQUMsS0FBSyxFQUFFLGNBQWMsQ0FBQztpQkFDekQ7YUFDRixDQUFDLENBQUM7WUFFSCxPQUFPO1lBQ1AsT0FBTyxDQUFDLG9CQUFvQixDQUFDLG9CQUFvQixFQUFFO2dCQUNqRCxhQUFhLEVBQUUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxZQUFZLENBQUMsY0FBYyxDQUFDLENBQUM7YUFDdEQsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSwyQkFBMkIsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3ZILE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7WUFFM0MsT0FBTztZQUNQLHFCQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxhQUFhLEVBQUU7Z0JBQ3BGLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7YUFDdEMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsc0RBQXNELEVBQUUsR0FBRyxFQUFFO1lBQ2hFLFFBQVE7WUFDUixNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBQSx1QkFBZ0IsR0FBRSxDQUFDO1lBQ3JDLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFO2dCQUNoRCxHQUFHLFdBQVc7Z0JBQ2QsS0FBSyxFQUFFLEtBQUs7Z0JBQ1osc0JBQXNCLEVBQUU7b0JBQ3RCLFlBQVksRUFBRSxJQUFJLDBDQUFlLENBQUMsS0FBSyxFQUFFLGNBQWMsQ0FBQztpQkFDekQ7YUFDRixDQUFDLENBQUM7WUFFSCxPQUFPO1lBQ1AsT0FBTyxDQUFDLG9CQUFvQixDQUFDLG9CQUFvQixFQUFFO2dCQUNqRCxhQUFhLEVBQUUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLENBQUM7YUFDckQsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSwyQkFBMkIsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3ZILE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7WUFFM0MsT0FBTztZQUNQLHFCQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxhQUFhLEVBQUU7Z0JBQ3BGLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7YUFDdEMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsaUVBQWlFLEVBQUUsR0FBRyxFQUFFO1lBQzNFLFFBQVE7WUFDUixNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFHLElBQUEsa0JBQVcsR0FBRSxDQUFDO1lBQ3JDLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFO2dCQUNoRCxPQUFPLEVBQUUsZUFBZTtnQkFDeEIsS0FBSyxFQUFFLEtBQUs7Z0JBQ1osc0JBQXNCLEVBQUU7b0JBQ3RCLFlBQVksRUFBRSxJQUFJLDBDQUFlLENBQUMsS0FBSyxFQUFFLGNBQWMsQ0FBQztpQkFDekQ7YUFDRixDQUFDLENBQUM7WUFFSCxPQUFPO1lBQ1AsT0FBTyxDQUFDLGlCQUFpQixDQUFDLFVBQVUsRUFBRSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2xGLE9BQU8sQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDL0MsT0FBTyxDQUFDLGlCQUFpQixDQUFDLFVBQVUsRUFBRSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2xGLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDO1lBQ2pFLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLEVBQUUsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNsRixJQUFJLEdBQUcsQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRTtnQkFDdkMsT0FBTztnQkFDUCxVQUFVLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFO2dCQUN4QixZQUFZLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFO2dCQUMxQixZQUFZLEVBQUUsU0FBUzthQUN4QixDQUFDLENBQUM7WUFDSCxPQUFPLENBQUMsaUJBQWlCLENBQUMsVUFBVSxFQUFFLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFbEYsT0FBTztZQUNQLE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsUUFBUSxDQUFDO1lBRXpFLE1BQU0sbUJBQW1CLEdBQUcsb0NBQW9DLENBQUM7WUFDakUsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBRXhELE1BQU0sZUFBZSxHQUFHLHVDQUF1QyxDQUFDO1lBQ2hFLE1BQU0sd0JBQXdCLEdBQUcsdURBQXVELENBQUM7WUFDekYsTUFBTSxRQUFRLEdBQUcsdUNBQXVDLENBQUM7WUFDekQsTUFBTSx3QkFBd0IsR0FBRyx1REFBdUQsQ0FBQztZQUN6RixNQUFNLFFBQVEsR0FBRyx1Q0FBdUMsQ0FBQztZQUN6RCxNQUFNLHdCQUF3QixHQUFHLHVEQUF1RCxDQUFDO1lBQ3pGLE1BQU0sUUFBUSxHQUFHLHVDQUF1QyxDQUFDO1lBQ3pELE1BQU0sd0JBQXdCLEdBQUcsdURBQXVELENBQUM7WUFDekYsTUFBTSxRQUFRLEdBQUcsdUNBQXVDLENBQUM7WUFDekQsTUFBTSxlQUFlLEdBQUcsaUJBQWlCLENBQUM7WUFFMUMsTUFBTSwyQkFBMkIsR0FBRztnQkFDbEMsZUFBZTtnQkFDZix3QkFBd0I7Z0JBQ3hCLFFBQVE7Z0JBQ1Isd0JBQXdCO2dCQUN4QixRQUFRO2dCQUNSLHdCQUF3QjtnQkFDeEIsUUFBUTtnQkFDUix3QkFBd0I7Z0JBQ3hCLFFBQVE7Z0JBQ1IsZUFBZTthQUNoQixDQUFDO1lBRUYsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFPLENBQUMsMkJBQTJCLENBQUMsQ0FBQztZQUUvRCxNQUFNLFNBQVMsR0FBRyxlQUFlLENBQUM7WUFDbEMsTUFBTSxlQUFlLEdBQUcsZ0JBQWdCLENBQUM7WUFDekMsTUFBTSxrQkFBa0IsR0FBRyxrQ0FBa0MsQ0FBQztZQUM5RCxNQUFNLGdCQUFnQixHQUFHLENBQUMsU0FBUyxFQUFFLGVBQWUsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBRTFFLHlEQUF5RDtZQUN6RCxLQUFLLE1BQU0sUUFBUSxJQUFJLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3hDLE1BQU0sQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQztZQUNoRixDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMseUNBQXlDLEVBQUUsR0FBRyxFQUFFO1lBQ25ELFFBQVE7WUFDUixNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBQSxrQkFBVyxHQUFFLENBQUM7WUFDaEMsTUFBTSxFQUFFLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxVQUFVLEVBQUU7Z0JBQzVDLE9BQU8sRUFBRSxlQUFlO2dCQUN4QixLQUFLLEVBQUUsS0FBSztnQkFDWixzQkFBc0IsRUFBRTtvQkFDdEIsWUFBWSxFQUFFLElBQUksMENBQWUsQ0FBQyxLQUFLLEVBQUUsY0FBYyxDQUFDO2lCQUN6RDthQUNGLENBQUMsQ0FBQztZQUVILE9BQU87WUFDUCw0QkFBNEI7WUFDNUIsRUFBRSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztZQUNwQyxFQUFFLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO1lBRXBDLE9BQU87WUFDUCxxQkFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxrQkFBa0IsRUFBRTtnQkFDbEUsY0FBYyxFQUFFO29CQUNkLFNBQVMsRUFBRTt3QkFDVDs0QkFDRSxNQUFNLEVBQUUscUJBQXFCOzRCQUM3QixNQUFNLEVBQUUsT0FBTzs0QkFDZixRQUFRLEVBQUU7Z0NBQ1IsWUFBWSxFQUFFO29DQUNaLGtCQUFrQjtvQ0FDbEIsS0FBSztpQ0FDTjs2QkFDRjt5QkFDRjtxQkFDRjtvQkFDRCxPQUFPLEVBQUUsWUFBWTtpQkFDdEI7YUFDRixDQUFDLENBQUM7WUFFSCxxQkFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxnQkFBZ0IsRUFBRTtnQkFDaEUsd0JBQXdCLEVBQUU7b0JBQ3hCLFNBQVMsRUFBRTt3QkFDVDs0QkFDRSxNQUFNLEVBQUUsZ0JBQWdCOzRCQUN4QixNQUFNLEVBQUUsT0FBTzs0QkFDZixTQUFTLEVBQUUsRUFBRSxPQUFPLEVBQUUsc0JBQXNCLEVBQUU7eUJBQy9DO3FCQUNGO29CQUNELE9BQU8sRUFBRSxZQUFZO2lCQUN0QjtnQkFDRCxpQkFBaUIsRUFBRTtvQkFDakI7d0JBQ0UsVUFBVSxFQUFFLENBQUMsRUFBRSxFQUFFO2dDQUNmLE1BQU07Z0NBQ04sRUFBRSxHQUFHLEVBQUUsZ0JBQWdCLEVBQUU7Z0NBQ3pCLDJEQUEyRDs2QkFDNUQsQ0FBQztxQkFDSDtvQkFDRDt3QkFDRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0NBQ2YsTUFBTTtnQ0FDTixFQUFFLEdBQUcsRUFBRSxnQkFBZ0IsRUFBRTtnQ0FDekIsK0RBQStEOzZCQUNoRSxDQUFDO3FCQUNIO29CQUNEO3dCQUNFLFVBQVUsRUFBRSxDQUFDLEVBQUUsRUFBRTtnQ0FDZixNQUFNO2dDQUNOLEVBQUUsR0FBRyxFQUFFLGdCQUFnQixFQUFFO2dDQUN6QixxREFBcUQ7NkJBQ3RELENBQUM7cUJBQ0g7b0JBQ0Q7d0JBQ0UsUUFBUSxFQUFFOzRCQUNSLG9EQUFvRDs0QkFDcEQ7Z0NBQ0UsVUFBVSxFQUFFO29DQUNWLEVBQUU7b0NBQ0Y7d0NBQ0UsTUFBTTt3Q0FDTjs0Q0FDRSxHQUFHLEVBQUUsZ0JBQWdCO3lDQUN0Qjt3Q0FDRCwrREFBK0Q7cUNBQ2hFO2lDQUNGOzZCQUNGOzRCQUNEO2dDQUNFLEdBQUcsRUFBRSxjQUFjOzZCQUNwQjt5QkFDRjtxQkFDRjtpQkFDRjthQUNGLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsb0RBQW9ELEVBQUUsR0FBRyxFQUFFO1FBQzlELE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFBLGtCQUFXLEdBQUUsQ0FBQztRQUVoQyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFVBQVUsRUFBRTtZQUNqQyxPQUFPLEVBQUUsZUFBZTtZQUN4QixLQUFLLEVBQUUsS0FBSztZQUNaLGNBQWMsRUFBRSxHQUFHLENBQUMsY0FBYyxDQUFDLE9BQU87WUFDMUMsc0JBQXNCLEVBQUU7Z0JBQ3RCLFlBQVksRUFBRSxJQUFJLDBDQUFlLENBQUMsS0FBSyxFQUFFLGNBQWMsQ0FBQztnQkFDeEQsV0FBVyxFQUFFO29CQUNYLEdBQUcsRUFBRSxLQUFLO2lCQUNYO2FBQ0Y7U0FDRixDQUFDLENBQUM7UUFFSCxxQkFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyx1QkFBdUIsRUFBRTtZQUN2RSxTQUFTLEVBQUU7Z0JBQ1QsZ0JBQWdCLEVBQUUsQ0FBQyxFQUFFLFlBQVksRUFBRSxDQUFDLGtCQUFrQixFQUFFLHdCQUF3QixDQUFDLEVBQUUsQ0FBQzthQUNyRjtTQUNGLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLCtDQUErQyxFQUFFLEdBQUcsRUFBRTtRQUN6RCxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBQSxrQkFBVyxHQUFFLENBQUM7UUFFaEMsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxVQUFVLEVBQUU7WUFDakQsT0FBTyxFQUFFLGVBQWU7WUFDeEIsS0FBSyxFQUFFLEtBQUs7WUFDWixjQUFjLEVBQUUsR0FBRyxDQUFDLGNBQWMsQ0FBQyxPQUFPO1lBQzFDLHNCQUFzQixFQUFFO2dCQUN0QixZQUFZLEVBQUUsSUFBSSwwQ0FBZSxDQUFDLEtBQUssRUFBRSxjQUFjLENBQUM7Z0JBQ3hELFdBQVcsRUFBRTtvQkFDWCxHQUFHLEVBQUUsS0FBSztpQkFDWDthQUNGO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsT0FBTyxDQUFDLFdBQVcsQ0FBQyxVQUFVLEVBQUU7WUFDOUIsSUFBSSxFQUFFLFdBQVc7WUFDakIsVUFBVSxFQUFFLElBQUk7WUFDaEIsSUFBSSxFQUFFO2dCQUNKLEtBQUssRUFBRSxPQUFPO2FBQ2Y7WUFDRCxRQUFRLEVBQUU7Z0JBQ1IsSUFBSSxFQUFFLFlBQVk7YUFDbkI7U0FDRixDQUFDLENBQUM7UUFFSCxxQkFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyx1QkFBdUIsRUFBRTtZQUN2RSxXQUFXLEVBQUU7Z0JBQ1gsU0FBUyxFQUFFO29CQUNULEdBQUcsRUFBRSxLQUFLO2lCQUNYO2FBQ0Y7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyxnRUFBZ0UsRUFBRSxHQUFHLEVBQUU7UUFDOUUsSUFBSSxDQUFDLGFBQWEsRUFBRSxHQUFHLEVBQUU7WUFDdkIsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUEsa0JBQVcsR0FBRSxDQUFDO1lBRWhDLE1BQU0sV0FBVyxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsZ0JBQWdCLEVBQUU7Z0JBQ3hELFNBQVMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxzQkFBc0IsQ0FBQzthQUM1RCxDQUFDLENBQUM7WUFFSCw4RUFBOEU7WUFDOUUsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxVQUFVLEVBQUU7Z0JBQ2pELE9BQU8sRUFBRSxlQUFlO2dCQUN4QixLQUFLLEVBQUUsS0FBSztnQkFDWixjQUFjLEVBQUUsR0FBRyxDQUFDLGNBQWMsQ0FBQyxPQUFPO2dCQUMxQyxzQkFBc0IsRUFBRTtvQkFDdEIsWUFBWSxFQUFFLElBQUksMENBQWUsQ0FBQyxLQUFLLEVBQUUsY0FBYyxDQUFDO29CQUN4RCxJQUFJLEVBQUUsV0FBVztpQkFDbEI7YUFDRixDQUFDLENBQUM7WUFFSCxPQUFPLENBQUMsV0FBVyxDQUFDLFVBQVUsRUFBRTtnQkFDOUIsSUFBSSxFQUFFLFdBQVc7Z0JBQ2pCLFVBQVUsRUFBRSxJQUFJO2dCQUNoQixJQUFJLEVBQUU7b0JBQ0osS0FBSyxFQUFFLE9BQU87aUJBQ2Y7Z0JBQ0QsUUFBUSxFQUFFO29CQUNSLElBQUksRUFBRSxZQUFZO2lCQUNuQjthQUNGLENBQUMsQ0FBQztZQUVILHFCQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLHFCQUFxQixDQUFDLHVCQUF1QixFQUFFO2dCQUN2RSxJQUFJLEVBQUU7b0JBQ0osWUFBWSxFQUFFLENBQUMsNERBQTRELEVBQUUsS0FBSyxDQUFDO2lCQUNwRjthQUNGLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGtCQUFrQixFQUFFLEdBQUcsRUFBRTtZQUM1QixNQUFNLFdBQVcsR0FBRyxZQUFZLENBQUM7WUFDakMsTUFBTSxLQUFLLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7WUFFOUIsTUFBTSxXQUFXLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLGFBQWEsRUFBRSw0Q0FBNEMsQ0FBQyxDQUFDO1lBRTdHLE1BQU0sZUFBZSxHQUFHLGtDQUFlLENBQUMsNkJBQTZCLENBQUMsS0FBSyxFQUFFLGlCQUFpQixFQUFFO2dCQUM5RixZQUFZLEVBQUUsOERBQThEO2dCQUM1RSxJQUFJLEVBQUUsV0FBVzthQUNsQixDQUFDLENBQUM7WUFFSCxNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLHFCQUFxQixDQUFDLEtBQUssRUFBRSxVQUFVLEVBQUU7Z0JBQ25FLFdBQVc7Z0JBQ1gsZUFBZSxFQUFFLGVBQWU7YUFDakMsQ0FBQyxDQUFDO1lBRUgsTUFBTSxLQUFLLEdBQUcsYUFBYSxDQUFDO1lBQzVCLE9BQU8sQ0FBQyxZQUFZLENBQUMsWUFBWSxFQUFFO2dCQUNqQyxLQUFLO2FBQ04sQ0FBQyxDQUFDO1lBRUgscUJBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMscUJBQXFCLENBQUMsZUFBUyxDQUFDLGFBQWEsRUFBRTtnQkFDdkUsV0FBVyxFQUFFLFdBQVc7Z0JBQ3hCLE9BQU8sRUFBRSxnQ0FBZ0M7Z0JBQ3pDLEtBQUssRUFBRSxLQUFLO2dCQUNaLFNBQVMsRUFBRSxTQUFTO2dCQUNwQixlQUFlLEVBQUUsSUFBSTthQUN0QixDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLGlCQUFpQixFQUFFLEdBQUcsRUFBRTtRQUMvQixJQUFJLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO1lBQzdCLE1BQU0sQ0FBQyxHQUFHLEVBQUU7Z0JBQ1YsR0FBRyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ25ELENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyx3SEFBd0gsQ0FBQyxDQUFDO1FBQ3ZJLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLCtDQUErQyxFQUFFLEdBQUcsRUFBRTtZQUN6RCxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBQSxrQkFBVyxHQUFFLENBQUM7WUFFaEMsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUU7Z0JBQ2hDLE9BQU8sRUFBRSxlQUFlO2dCQUN4QixLQUFLLEVBQUUsS0FBSztnQkFDWixjQUFjLEVBQUUsR0FBRyxDQUFDLGNBQWMsQ0FBQyxNQUFNO2dCQUN6QyxVQUFVLEVBQUUsQ0FBQyxFQUFFLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNuRCxzQkFBc0IsRUFBRTtvQkFDdEIsWUFBWSxFQUFFLElBQUksMENBQWUsQ0FBQyxLQUFLLEVBQUUsY0FBYyxDQUFDO2lCQUN6RDthQUNGLENBQUMsQ0FBQztZQUVILG9GQUFvRjtZQUNwRixzQ0FBc0M7WUFDdEMscUJBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMscUJBQXFCLENBQUMsdUJBQXVCLEVBQUU7Z0JBQ3ZFLFNBQVMsRUFBRSxrQkFBSyxDQUFDLE1BQU0sRUFBRTthQUMxQixDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw0Q0FBNEMsRUFBRSxHQUFHLEVBQUU7WUFDdEQsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUEsa0JBQVcsR0FBRSxDQUFDO1lBRWhDLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFO2dCQUNoQyxPQUFPLEVBQUUsZUFBZTtnQkFDeEIsY0FBYyxFQUFFLEdBQUcsQ0FBQyxjQUFjLENBQUMsTUFBTTtnQkFDekMsc0JBQXNCLEVBQUU7b0JBQ3RCLFlBQVksRUFBRSxJQUFJLDBDQUFlLENBQUMsS0FBSyxFQUFFLGNBQWMsQ0FBQztpQkFDekQ7YUFDRixDQUFDLENBQUM7WUFFSCxvRkFBb0Y7WUFDcEYsc0NBQXNDO1lBQ3RDLHFCQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLHFCQUFxQixDQUFDLHVCQUF1QixFQUFFO2dCQUN2RSxTQUFTLEVBQUUsa0JBQUssQ0FBQyxNQUFNLEVBQUU7YUFDMUIsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsaUNBQWlDLEVBQUUsR0FBRyxFQUFFO1lBQzNDLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFBLGtCQUFXLEdBQUUsQ0FBQztZQUVoQyxNQUFNLENBQUMsR0FBRyxFQUFFO2dCQUNWLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFO29CQUNoQyxPQUFPLEVBQUUsZUFBZTtvQkFDeEIsS0FBSyxFQUFFLEtBQUs7b0JBQ1osY0FBYyxFQUFFLEdBQUcsQ0FBQyxjQUFjLENBQUMsT0FBTztvQkFDMUMsVUFBVSxFQUFFLENBQUMsRUFBRSxVQUFVLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztpQkFDcEQsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLDBFQUEwRSxDQUFDLENBQUM7UUFDekYsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsOEJBQThCLEVBQUUsR0FBRyxFQUFFO1lBQ3hDLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFBLGtCQUFXLEdBQUUsQ0FBQztZQUVoQyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRTtnQkFDaEMsT0FBTyxFQUFFLGVBQWU7Z0JBQ3hCLEtBQUssRUFBRSxLQUFLO2dCQUNaLGNBQWMsRUFBRSxHQUFHLENBQUMsY0FBYyxDQUFDLE9BQU87Z0JBQzFDLHNCQUFzQixFQUFFO29CQUN0QixZQUFZLEVBQUUsSUFBSSwwQ0FBZSxDQUFDLEtBQUssRUFBRSxjQUFjLENBQUM7aUJBQ3pEO2FBQ0YsQ0FBQyxDQUFDO1lBRUgsTUFBTSxTQUFTLEdBQUcscUJBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsYUFBYSxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFDbkYsTUFBTSxDQUFDLFNBQVMsQ0FBQyw4Q0FBOEMsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RILE1BQU0sQ0FBQyxTQUFTLENBQUMsOENBQThDLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQy9ILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDJEQUEyRCxFQUFFLEdBQUcsRUFBRTtZQUNyRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBQSxrQkFBVyxHQUFFLENBQUM7WUFFaEMsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUU7Z0JBQ2hDLE9BQU8sRUFBRSxlQUFlO2dCQUN4QixLQUFLLEVBQUUsS0FBSztnQkFDWixjQUFjLEVBQUUsR0FBRyxDQUFDLGNBQWMsQ0FBQyxrQkFBa0I7Z0JBQ3JELFVBQVUsRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ25ELHNCQUFzQixFQUFFO29CQUN0QixZQUFZLEVBQUUsSUFBSSwwQ0FBZSxDQUFDLEtBQUssRUFBRSxjQUFjLENBQUM7aUJBQ3pEO2FBQ0YsQ0FBQyxDQUFDO1lBRUgsNEVBQTRFO1lBQzVFLHFCQUFxQjtZQUNyQixxQkFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyx1QkFBdUIsRUFBRTtnQkFDdkUsU0FBUyxFQUFFLGtCQUFLLENBQUMsTUFBTSxFQUFFO2FBQzFCLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHdEQUF3RCxFQUFFLEdBQUcsRUFBRTtZQUNsRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBQSxrQkFBVyxHQUFFLENBQUM7WUFFaEMsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUU7Z0JBQ2hDLE9BQU8sRUFBRSxlQUFlO2dCQUN4QixLQUFLLEVBQUUsS0FBSztnQkFDWixjQUFjLEVBQUUsR0FBRyxDQUFDLGNBQWMsQ0FBQyxrQkFBa0I7Z0JBQ3JELHNCQUFzQixFQUFFO29CQUN0QixZQUFZLEVBQUUsSUFBSSwwQ0FBZSxDQUFDLEtBQUssRUFBRSxjQUFjLENBQUM7aUJBQ3pEO2FBQ0YsQ0FBQyxDQUFDO1lBRUgsaURBQWlEO1lBQ2pELE1BQU0sU0FBUyxHQUFHLHFCQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLGFBQWEsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1lBQ25GLE1BQU0sQ0FBQyxTQUFTLENBQUMsOENBQThDLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0SCxNQUFNLENBQUMsU0FBUyxDQUFDLDhDQUE4QyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMvSCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx1REFBdUQsRUFBRSxHQUFHLEVBQUU7WUFDakUsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUEsa0JBQVcsR0FBRSxDQUFDO1lBRWhDLE1BQU0sQ0FBQyxHQUFHLEVBQUU7Z0JBQ1YsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUU7b0JBQ2hDLE9BQU8sRUFBRSxlQUFlO29CQUN4QixLQUFLLEVBQUUsS0FBSztvQkFDWixjQUFjLEVBQUUsR0FBRyxDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDO29CQUM1RSxVQUFVLEVBQUUsQ0FBQyxFQUFFLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDO2lCQUNwRCxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsNEVBQTRFLENBQUMsQ0FBQztRQUMzRixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxvREFBb0QsRUFBRSxHQUFHLEVBQUU7WUFDOUQsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUEsa0JBQVcsR0FBRSxDQUFDO1lBRWhDLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFO2dCQUNoQyxPQUFPLEVBQUUsZUFBZTtnQkFDeEIsS0FBSyxFQUFFLEtBQUs7Z0JBQ1osY0FBYyxFQUFFLEdBQUcsQ0FBQyxjQUFjLENBQUMsa0JBQWtCLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQztnQkFDNUUsc0JBQXNCLEVBQUU7b0JBQ3RCLFlBQVksRUFBRSxJQUFJLDBDQUFlLENBQUMsS0FBSyxFQUFFLGNBQWMsQ0FBQztpQkFDekQ7YUFDRixDQUFDLENBQUM7WUFFSCxpREFBaUQ7WUFDakQsTUFBTSxTQUFTLEdBQUcscUJBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsYUFBYSxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFDbkYsTUFBTSxDQUFDLFNBQVMsQ0FBQyw4Q0FBOEMsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RILE1BQU0sQ0FBQyxTQUFTLENBQUMsOENBQThDLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQy9ILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHlFQUF5RSxFQUFFLEdBQUcsRUFBRTtZQUNuRixNQUFNLEtBQUssR0FBRyxXQUFXLENBQUM7WUFDMUIsd0ZBQXdGO1lBQ3hGLDJCQUEyQjtZQUMzQixNQUFNLEtBQUssR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFO2dCQUNsRCxHQUFHLEVBQUU7b0JBQ0gsT0FBTyxFQUFFLFVBQVU7b0JBQ25CLE1BQU0sRUFBRSxXQUFXO2lCQUNwQjthQUNGLENBQUMsQ0FBQztZQUNILEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLHdCQUF3QixLQUFLLENBQUMsT0FBTyxrQkFBa0IsS0FBSyxXQUFXLEtBQUssQ0FBQyxNQUFNLCtCQUErQixFQUFFO2dCQUN4SSxLQUFLLEVBQUUsS0FBSztnQkFDWixZQUFZLEVBQUUsYUFBYTtnQkFDM0IsWUFBWSxFQUFFO29CQUNaO3dCQUNFLElBQUksRUFBRSxTQUFTO3dCQUNmLElBQUksRUFBRSxTQUFTO3dCQUNmLE9BQU8sRUFBRTs0QkFDUDtnQ0FDRSxRQUFRLEVBQUUsOEJBQThCO2dDQUN4QyxJQUFJLEVBQUUsYUFBYTtnQ0FDbkIsZ0JBQWdCLEVBQUUsWUFBWTtnQ0FDOUIsWUFBWSxFQUFFLHVCQUF1Qjs2QkFDdEM7eUJBQ0Y7cUJBQ0Y7b0JBQ0Q7d0JBQ0UsSUFBSSxFQUFFLFFBQVE7d0JBQ2QsSUFBSSxFQUFFLFFBQVE7d0JBQ2QsT0FBTyxFQUFFOzRCQUNQO2dDQUNFLFFBQVEsRUFBRSw2QkFBNkI7Z0NBQ3ZDLElBQUksRUFBRSxhQUFhO2dDQUNuQixnQkFBZ0IsRUFBRSxZQUFZO2dDQUM5QixZQUFZLEVBQUUsdUJBQXVCOzZCQUN0Qzt5QkFDRjtxQkFDRjtpQkFDRjthQUNGLENBQUMsQ0FBQztZQUNILE1BQU0sR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUU7Z0JBQzNDLEtBQUssRUFBRSxLQUFLO2FBQ2IsQ0FBQyxDQUFDO1lBRUgsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUU7Z0JBQ2hDLEdBQUc7Z0JBQ0gsT0FBTyxFQUFFLGVBQWU7Z0JBQ3hCLEtBQUssRUFBRSxLQUFLO2dCQUNaLGNBQWMsRUFBRSxHQUFHLENBQUMsY0FBYyxDQUFDLE9BQU87Z0JBQzFDLHNCQUFzQixFQUFFO29CQUN0QixZQUFZLEVBQUUsSUFBSSwwQ0FBZSxDQUFDLEtBQUssRUFBRSxjQUFjLENBQUM7aUJBQ3pEO2FBQ0YsQ0FBQyxDQUFDO1lBRUgscUJBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMscUJBQXFCLENBQUMsdUJBQXVCLEVBQUU7Z0JBQ3ZFLFNBQVMsRUFBRSxFQUFFLFNBQVMsRUFBRSxDQUFDLDhCQUE4QixDQUFDLEVBQUU7YUFDM0QsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsd0dBQXdHLEVBQUUsR0FBRyxFQUFFO1lBQ2xILE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQztZQUMxQix3RkFBd0Y7WUFDeEYsMkJBQTJCO1lBQzNCLE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUU7Z0JBQ2xELEdBQUcsRUFBRTtvQkFDSCxPQUFPLEVBQUUsVUFBVTtvQkFDbkIsTUFBTSxFQUFFLFdBQVc7aUJBQ3BCO2FBQ0YsQ0FBQyxDQUFDO1lBRUgsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsd0JBQXdCLEtBQUssQ0FBQyxPQUFPLGtCQUFrQixLQUFLLFdBQVcsS0FBSyxDQUFDLE1BQU0sK0JBQStCLEVBQUU7Z0JBQ3hJLEtBQUssRUFBRSxLQUFLO2dCQUNaLFlBQVksRUFBRSxhQUFhO2dCQUMzQixZQUFZLEVBQUU7b0JBQ1o7d0JBQ0UsSUFBSSxFQUFFLFNBQVM7d0JBQ2YsSUFBSSxFQUFFLFNBQVM7d0JBQ2YsT0FBTyxFQUFFOzRCQUNQO2dDQUNFLFFBQVEsRUFBRSw4QkFBOEI7Z0NBQ3hDLElBQUksRUFBRSxhQUFhO2dDQUNuQixnQkFBZ0IsRUFBRSxZQUFZO2dDQUM5QixZQUFZLEVBQUUsdUJBQXVCOzZCQUN0Qzt5QkFDRjtxQkFDRjtvQkFDRDt3QkFDRSxJQUFJLEVBQUUsUUFBUTt3QkFDZCxJQUFJLEVBQUUsUUFBUTt3QkFDZCxPQUFPLEVBQUU7NEJBQ1A7Z0NBQ0UsUUFBUSxFQUFFLDZCQUE2QjtnQ0FDdkMsSUFBSSxFQUFFLGFBQWE7Z0NBQ25CLGdCQUFnQixFQUFFLFlBQVk7Z0NBQzlCLFlBQVksRUFBRSx1QkFBdUI7NkJBQ3RDO3lCQUNGO3FCQUNGO2lCQUNGO2FBQ0YsQ0FBQyxDQUFDO1lBRUgsTUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRTtnQkFDM0MsS0FBSyxFQUFFLEtBQUs7YUFDYixDQUFDLENBQUM7WUFFSCxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRTtnQkFDaEMsR0FBRztnQkFDSCxPQUFPLEVBQUUsZUFBZTtnQkFDeEIsS0FBSyxFQUFFLEtBQUs7Z0JBQ1osY0FBYyxFQUFFLEdBQUcsQ0FBQyxjQUFjLENBQUMsT0FBTztnQkFDMUMsVUFBVSxFQUFFLENBQUM7d0JBQ1gsT0FBTyxFQUFFOzRCQUNQLEdBQUcsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsOEJBQThCLENBQUM7NEJBQ3pFLEdBQUcsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsNkJBQTZCLENBQUM7eUJBQ3hFO3FCQUNGLENBQUM7Z0JBQ0Ysc0JBQXNCLEVBQUU7b0JBQ3RCLFlBQVksRUFBRSxJQUFJLDBDQUFlLENBQUMsS0FBSyxFQUFFLGNBQWMsQ0FBQztpQkFDekQ7YUFDRixDQUFDLENBQUM7WUFFSCxxQkFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyx1QkFBdUIsRUFBRTtnQkFDdkUsU0FBUyxFQUFFLEVBQUUsU0FBUyxFQUFFLENBQUMsOEJBQThCLENBQUMsRUFBRTthQUMzRCxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxzR0FBc0csRUFBRSxHQUFHLEVBQUU7WUFDaEgsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUEsa0JBQVcsR0FBRSxDQUFDO1lBRWhDLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFdEMsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUU7Z0JBQ2hDLEdBQUc7Z0JBQ0gsT0FBTyxFQUFFLGVBQWU7Z0JBQ3hCLEtBQUssRUFBRSxLQUFLO2dCQUNaLGNBQWMsRUFBRSxHQUFHLENBQUMsY0FBYyxDQUFDLE9BQU87Z0JBQzFDLFVBQVUsRUFBRSxDQUFDO3dCQUNYLE9BQU8sRUFBRTs0QkFDUCxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQzs0QkFDckIsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7NEJBQ3BCLEdBQUcsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsZ0JBQWdCLENBQUM7eUJBQzVEO3FCQUNGLENBQUM7Z0JBQ0Ysc0JBQXNCLEVBQUU7b0JBQ3RCLFlBQVksRUFBRSxJQUFJLDBDQUFlLENBQUMsS0FBSyxFQUFFLGNBQWMsQ0FBQztpQkFDekQ7YUFDRixDQUFDLENBQUM7WUFFSCxxQkFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyx1QkFBdUIsRUFBRTtnQkFDdkUsU0FBUyxFQUFFO29CQUNULFNBQVMsRUFBRTt3QkFDVCxFQUFFLEdBQUcsRUFBRSxpQ0FBaUMsRUFBRTt3QkFDMUMsZ0JBQWdCO3FCQUNqQjtpQkFDRjthQUNGLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDZEQUE2RCxFQUFFLEdBQUcsRUFBRTtZQUN2RSxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBQSxrQkFBVyxHQUFFLENBQUM7WUFDaEMsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUU7Z0JBQ2hDLE9BQU8sRUFBRSxlQUFlO2dCQUN4QixLQUFLLEVBQUUsS0FBSztnQkFDWixjQUFjLEVBQ1osR0FBRyxDQUFDLGNBQWMsQ0FBQyxPQUFPO2dCQUM1QixVQUFVLEVBQUUsQ0FBQzt3QkFDWCxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLG9CQUFvQixDQUFDLEtBQUssRUFBRSxVQUFVLEVBQUU7Z0NBQ2xFLFFBQVEsRUFBRSxTQUFTO2dDQUNuQixnQkFBZ0IsRUFBRSxZQUFZOzZCQUMvQixDQUFDLENBQUM7cUJBQ0osQ0FBQztnQkFDRixzQkFBc0IsRUFBRTtvQkFDdEIsWUFBWSxFQUFFLElBQUksMENBQWUsQ0FBQyxLQUFLLEVBQUUsY0FBYyxDQUFDO2lCQUN6RDthQUNGLENBQUMsQ0FBQztZQUVILHFCQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLHFCQUFxQixDQUFDLHVCQUF1QixFQUFFO2dCQUN2RSxTQUFTLEVBQUUsRUFBRSxTQUFTLEVBQUUsQ0FBQyxTQUFTLENBQUMsRUFBRTthQUN0QyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx1Q0FBdUMsRUFBRSxHQUFHLEVBQUU7WUFDakQsUUFBUTtZQUNSLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFBLGtCQUFXLEdBQUUsQ0FBQztZQUNoQyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFVBQVUsRUFBRSxFQUFFLE9BQU8sRUFBRSxlQUFlLEVBQUUsY0FBYyxFQUFFLEdBQUcsQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBRTNILE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBZSxDQUFDO1lBQ3ZDLE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsUUFBUSxDQUFDO1lBQ3hFLE1BQU0sQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM5RyxNQUFNLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsa0JBQWtCLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDaEgsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsK0NBQStDLEVBQUUsR0FBRyxFQUFFO1lBQ3pELE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFBLGtCQUFXLEdBQUUsQ0FBQztZQUVoQyxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRTtnQkFDcEMsTUFBTSxFQUFFLENBQUM7Z0JBQ1QsV0FBVyxFQUFFLENBQUM7Z0JBQ2QsbUJBQW1CLEVBQUU7b0JBQ25CO3dCQUNFLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLG1CQUFtQjt3QkFDOUMsSUFBSSxFQUFFLFVBQVU7cUJBQ2pCO29CQUNEO3dCQUNFLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU07d0JBQ2pDLElBQUksRUFBRSxTQUFTO3FCQUNoQjtpQkFDRjthQUNGLENBQUMsQ0FBQztZQUVILE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsVUFBVSxFQUFFO2dCQUNqRCxPQUFPLEVBQUUsZUFBZTtnQkFDeEIsS0FBSyxFQUFFLEtBQUs7Z0JBQ1osY0FBYyxFQUFFLEdBQUcsQ0FBQyxjQUFjLENBQUMsT0FBTztnQkFDMUMsR0FBRztnQkFDSCxzQkFBc0IsRUFBRTtvQkFDdEIsWUFBWSxFQUFFLElBQUksMENBQWUsQ0FBQyxLQUFLLEVBQUUsY0FBYyxDQUFDO2lCQUN6RDthQUNGLENBQUMsQ0FBQztZQUVILE9BQU8sQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFO2dCQUM5QixJQUFJLEVBQUUsV0FBVztnQkFDakIsVUFBVSxFQUFFLElBQUk7Z0JBQ2hCLElBQUksRUFBRTtvQkFDSixLQUFLLEVBQUUsT0FBTztpQkFDZjtnQkFDRCxRQUFRLEVBQUU7b0JBQ1IsSUFBSSxFQUFFLFlBQVk7aUJBQ25CO2FBQ0YsQ0FBQyxDQUFDO1lBRUgscUJBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMscUJBQXFCLENBQUMsdUJBQXVCLEVBQUU7Z0JBQ3ZFLFNBQVMsRUFBRTtvQkFDVCxnQkFBZ0IsRUFBRTt3QkFDaEI7NEJBQ0UsWUFBWSxFQUFFLENBQUMsa0JBQWtCLEVBQUUsd0JBQXdCLENBQUM7eUJBQzdEO3FCQUNGO29CQUNELFNBQVMsRUFBRTt3QkFDVDs0QkFDRSxHQUFHLEVBQUUsa0NBQWtDO3lCQUN4Qzt3QkFDRDs0QkFDRSxHQUFHLEVBQUUsa0NBQWtDO3lCQUN4QztxQkFDRjtpQkFDRjthQUNGLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGlEQUFpRCxFQUFFLEdBQUcsRUFBRTtZQUMzRCxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBQSxrQkFBVyxHQUFFLENBQUM7WUFFaEMsTUFBTSxtQkFBbUIsR0FBOEIsRUFBRSxDQUFDO1lBRTFELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDNUIsbUJBQW1CLENBQUMsSUFBSSxDQUFDO29CQUN2QixVQUFVLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxtQkFBbUI7b0JBQzlDLElBQUksRUFBRSxVQUFVLENBQUMsRUFBRTtpQkFDcEIsQ0FDQSxDQUFDO1lBQ0osQ0FBQztZQUVELG1CQUFtQixDQUFDLElBQUksQ0FBQztnQkFDdkIsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsTUFBTTtnQkFDakMsSUFBSSxFQUFFLFNBQVM7YUFDaEIsQ0FBQyxDQUFDO1lBRUgsTUFBTSxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUU7Z0JBQ3JDLE1BQU0sRUFBRSxDQUFDO2dCQUNULFdBQVcsRUFBRSxDQUFDO2dCQUNkLG1CQUFtQjthQUNwQixDQUFDLENBQUM7WUFFSCxNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFVBQVUsRUFBRTtnQkFDakQsT0FBTyxFQUFFLGVBQWU7Z0JBQ3hCLEtBQUssRUFBRSxLQUFLO2dCQUNaLGNBQWMsRUFBRSxHQUFHLENBQUMsY0FBYyxDQUFDLE9BQU87Z0JBQzFDLEdBQUcsRUFBRSxJQUFJO2dCQUNULFVBQVUsRUFBRSxDQUFDLEVBQUUsZUFBZSxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsZUFBZSxFQUFFLFVBQVUsRUFBRSxDQUFDO2dCQUM5RSxzQkFBc0IsRUFBRTtvQkFDdEIsWUFBWSxFQUFFLElBQUksMENBQWUsQ0FBQyxLQUFLLEVBQUUsY0FBYyxDQUFDO2lCQUN6RDthQUNGLENBQUMsQ0FBQztZQUVILE9BQU8sQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFO2dCQUM5QixJQUFJLEVBQUUsV0FBVztnQkFDakIsVUFBVSxFQUFFLElBQUk7Z0JBQ2hCLElBQUksRUFBRTtvQkFDSixLQUFLLEVBQUUsT0FBTztpQkFDZjtnQkFDRCxRQUFRLEVBQUU7b0JBQ1IsSUFBSSxFQUFFLFlBQVk7aUJBQ25CO2FBQ0YsQ0FBQyxDQUFDO1lBRUgscUJBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMscUJBQXFCLENBQUMsdUJBQXVCLEVBQUU7Z0JBQ3ZFLFNBQVMsRUFBRTtvQkFDVCxnQkFBZ0IsRUFBRTt3QkFDaEI7NEJBQ0UsWUFBWSxFQUFFLENBQUMsa0JBQWtCLEVBQUUsd0JBQXdCLENBQUM7eUJBQzdEO3FCQUNGO29CQUNELFNBQVMsRUFBRTt3QkFDVDs0QkFDRSxHQUFHLEVBQUUsa0NBQWtDO3lCQUN4Qzt3QkFDRDs0QkFDRSxHQUFHLEVBQUUsa0NBQWtDO3lCQUN4Qzt3QkFDRDs0QkFDRSxHQUFHLEVBQUUsa0NBQWtDO3lCQUN4Qzt3QkFDRDs0QkFDRSxHQUFHLEVBQUUsa0NBQWtDO3lCQUN4QztxQkFDRjtpQkFDRjthQUNGLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGlGQUFpRixFQUFFLEdBQUcsRUFBRTtZQUMzRixNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBQSxrQkFBVyxHQUFFLENBQUM7WUFFaEMsTUFBTSxDQUFDLEdBQUcsRUFBRTtnQkFDVixJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRTtvQkFDaEMsR0FBRyxFQUFFLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFO3dCQUM3QixnQkFBZ0IsRUFBRSxLQUFLO3FCQUN4QixDQUFDO29CQUNGLE9BQU8sRUFBRSxlQUFlO29CQUN4QixLQUFLLEVBQUUsS0FBSztpQkFDYixDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsd0ZBQXdGLENBQUMsQ0FBQztRQUN2RyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxtRkFBbUYsRUFBRSxHQUFHLEVBQUU7WUFDN0YsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUEsa0JBQVcsR0FBRSxDQUFDO1lBRWhDLE1BQU0sQ0FBQyxHQUFHLEVBQUU7Z0JBQ1YsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUU7b0JBQ2hDLEdBQUcsRUFBRSxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRTt3QkFDN0Isa0JBQWtCLEVBQUUsS0FBSztxQkFDMUIsQ0FBQztvQkFDRixPQUFPLEVBQUUsZUFBZTtvQkFDeEIsS0FBSyxFQUFFLEtBQUs7aUJBQ2IsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLHdGQUF3RixDQUFDLENBQUM7UUFDdkcsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZ0VBQWdFLEVBQUUsR0FBRyxFQUFFO1lBQzFFLE1BQU0sQ0FBQyxHQUFHLEVBQUU7Z0JBQ1YsR0FBRyxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ25ELENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxrRUFBa0UsQ0FBQyxDQUFDO1FBQ2pGLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsK0JBQStCLEVBQUUsR0FBRyxFQUFFO1FBQ3pDLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFBLGtCQUFXLEdBQUUsQ0FBQztRQUNoQyxNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFVBQVUsRUFBRTtZQUNqRCxPQUFPLEVBQUUsZUFBZTtZQUN4QixLQUFLLEVBQUUsS0FBSztZQUNaLHNCQUFzQixFQUFFO2dCQUN0QixZQUFZLEVBQUUsSUFBSSwwQ0FBZSxDQUFDLEtBQUssRUFBRSxjQUFjLENBQUM7YUFDekQ7U0FDRixDQUFDLENBQUM7UUFFSCxNQUFNLG1CQUFtQixHQUFHLE9BQU8sQ0FBQyw2QkFBNkIsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUUvRSxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLHFCQUFxQixFQUFFO1lBQzlDLEtBQUssRUFBRSxtQkFBbUI7U0FDM0IsQ0FBQyxDQUFDO1FBRUgsTUFBTSx1QkFBdUIsR0FBRyw4Q0FBOEMsQ0FBQztRQUUvRSxJQUFJLFFBQVEsR0FBRyxxQkFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN6QyxNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLDBDQUEwQyxDQUFDLENBQUM7UUFFckYscURBQXFEO1FBQ3JELE1BQU0sQ0FBQyxTQUFTLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUM7WUFDNUQsWUFBWSxFQUFFO2dCQUNaLFlBQVksRUFBRTtvQkFDWixpREFBaUQ7b0JBQ2pELEtBQUs7aUJBQ047YUFDRjtZQUNELFdBQVcsRUFBRTtnQkFDWCxHQUFHLEVBQUUsa0JBQWtCO2FBQ3hCO1lBQ0QsVUFBVSxFQUFFLFNBQVM7WUFDckIsVUFBVSxFQUFFLFdBQVc7WUFDdkIsZUFBZSxFQUFFLFNBQVM7WUFDMUIsUUFBUSxFQUFFLDBDQUEwQztZQUNwRCxjQUFjLEVBQUUsR0FBRztTQUNwQixDQUFDLENBQUM7UUFFSCxvR0FBb0c7UUFDcEcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxxQkFBcUIsRUFBRTtZQUN4QyxLQUFLLEVBQUUsRUFBRSxZQUFZLEVBQUUsQ0FBQyx1QkFBdUIsRUFBRSxPQUFPLENBQUMsRUFBRTtTQUM1RCxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyxzQ0FBc0MsRUFBRSxHQUFHLEVBQUU7UUFDaEQsUUFBUTtRQUNSLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFBLGtCQUFXLEdBQUUsQ0FBQztRQUVoQyxPQUFPO1FBQ1AsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQ3hGLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsVUFBVSxFQUFFO1lBQ2pDLE9BQU8sRUFBRSxlQUFlO1lBQ3hCLEtBQUssRUFBRSxLQUFLO1lBQ1osc0JBQXNCLEVBQUU7Z0JBQ3RCLFlBQVksRUFBRSxLQUFLO2FBQ3BCO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsT0FBTztRQUNQLHFCQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLHFCQUFxQixDQUFDLHVCQUF1QixFQUFFO1lBQ3ZFLE1BQU0sRUFBRTtnQkFDTixFQUFFLEdBQUcsRUFBRSw0Q0FBNEMsRUFBRTtnQkFDckQsY0FBYzthQUNmO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMscUNBQXFDLEVBQUUsR0FBRyxFQUFFO1FBQy9DLFFBQVE7UUFDUixNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBQSxrQkFBVyxHQUFFLENBQUM7UUFFaEMsT0FBTztRQUNQLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsbUJBQW1CLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUN4RixJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFVBQVUsRUFBRTtZQUNqQyxPQUFPLEVBQUUsZUFBZTtZQUN4QixLQUFLLEVBQUUsS0FBSztZQUNaLHNCQUFzQixFQUFFO2dCQUN0QixXQUFXLEVBQUUsS0FBSztnQkFDbEIsWUFBWSxFQUFFLElBQUksMENBQWUsQ0FBQyxLQUFLLEVBQUUsY0FBYyxDQUFDO2FBQ3pEO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsT0FBTztRQUNQLHFCQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLHFCQUFxQixDQUFDLHVCQUF1QixFQUFFO1lBQ3ZFLE1BQU0sRUFBRTtnQkFDTixjQUFjO2dCQUNkLEVBQUUsR0FBRyxFQUFFLHNCQUFzQixFQUFFO2FBQ2hDO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsOEVBQThFLEVBQUUsR0FBRyxFQUFFO1FBQ3hGLFFBQVE7UUFDUixNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFHLElBQUEsa0JBQVcsR0FBRSxDQUFDO1FBRXJDLE9BQU87UUFDUCxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRTtZQUNoQyxHQUFHO1lBQ0gsT0FBTyxFQUFFLGVBQWU7WUFDeEIsS0FBSyxFQUFFLEtBQUs7WUFDWixvQkFBb0IsRUFBRSxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQztTQUNoRCxDQUFDLENBQUM7UUFFSCxPQUFPO1FBQ1AscUJBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMscUJBQXFCLENBQUMsbUJBQW1CLEVBQUU7WUFDbkUsZ0JBQWdCLEVBQUUsQ0FBQztvQkFDakIsUUFBUSxFQUFFO3dCQUNSLE1BQU0sRUFBRTs0QkFDTixZQUFZLEVBQUU7Z0NBQ1osYUFBYTtnQ0FDYixLQUFLOzZCQUNOO3lCQUNGO3FCQUNGO29CQUNELFNBQVMsRUFBRSxDQUFDLFNBQVMsQ0FBQztpQkFDdkIsQ0FBQztTQUNILENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLHlEQUF5RCxFQUFFLEdBQUcsRUFBRTtRQUNuRSxRQUFRO1FBQ1IsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUEsa0JBQVcsR0FBRSxDQUFDO1FBQ2hDLE1BQU0sVUFBVSxHQUFHLGVBQWUsQ0FBQztRQUVuQyxPQUFPO1FBQ1AsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUU7WUFDaEMsT0FBTyxFQUFFLGVBQWU7WUFDeEIsZUFBZSxFQUFFLFVBQVU7U0FDNUIsQ0FBQyxDQUFDO1FBRUgsT0FBTztRQUNQLHFCQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLHFCQUFxQixDQUFDLG1CQUFtQixFQUFFO1lBQ25FLHVCQUF1QixFQUFFO2dCQUN2QixlQUFlLEVBQUUsVUFBVTthQUM1QjtTQUNGLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLGNBQWMsRUFBRSxHQUFHLEVBQUU7UUFDNUIsZ0ZBQWdGO1FBQ2hGLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDUixDQUFDLElBQUksRUFBRSxJQUFJLENBQUM7WUFDWixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUM7U0FDZixDQUFDLENBQUMseURBQXlELEVBQzFELENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ1AsUUFBUTtZQUNSLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFBLGtCQUFXLEdBQUUsQ0FBQztZQUVoQyxPQUFPO1lBQ1AsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUU7Z0JBQ2hDLE9BQU8sRUFBRSxlQUFlO2dCQUN4Qix1Q0FBdUMsRUFBRSxDQUFDO2FBQzNDLENBQUMsQ0FBQztZQUVILE9BQU87WUFDUCxxQkFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxtQkFBbUIsRUFBRTtnQkFDbkUsWUFBWSxFQUFFO29CQUNaLHVDQUF1QyxFQUFFLENBQUM7aUJBQzNDO2FBQ0YsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUNGLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyxhQUFhLEVBQUUsR0FBRyxFQUFFO1FBQzNCLDZCQUE2QjtRQUM3QixJQUFJLENBQUMseUJBQXlCLEVBQUUsR0FBRyxFQUFFO1lBQ25DLFFBQVE7WUFDUixNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFHLElBQUEsa0JBQVcsR0FBRSxDQUFDO1lBQ3JDLE9BQU87WUFDUCxNQUFNLFdBQVcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxvQkFBb0IsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUMvRixJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRTtnQkFDaEMsR0FBRztnQkFDSCxXQUFXO2dCQUNYLE9BQU8sRUFBRSxlQUFlO2FBQ3pCLENBQUMsQ0FBQztZQUNILE9BQU87WUFDUCxxQkFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyx1QkFBdUIsRUFBRTtnQkFDdkUsY0FBYyxFQUFFO29CQUNkO3dCQUNFLFdBQVcsRUFBRTs0QkFDWCxJQUFJLEVBQUUsU0FBUzt5QkFDaEI7d0JBQ0QsU0FBUyxFQUFFOzRCQUNULFVBQVUsRUFBRTtnQ0FDVixFQUFFLEVBQUU7b0NBQ0YsTUFBTTtvQ0FDTixFQUFFLEdBQUcsRUFBRSxnQkFBZ0IsRUFBRTtvQ0FDekIsNkRBQTZEO2lDQUM5RDs2QkFDRjt5QkFDRjtxQkFDRjtpQkFDRjthQUNGLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBLdWJlY3RsVjMzTGF5ZXIgfSBmcm9tICdAYXdzLWNkay9sYW1iZGEtbGF5ZXIta3ViZWN0bC12MzMnO1xuaW1wb3J0IHsgTWF0Y2gsIFRlbXBsYXRlIH0gZnJvbSAnYXdzLWNkay1saWIvYXNzZXJ0aW9ucyc7XG5pbXBvcnQgKiBhcyBhc2cgZnJvbSAnYXdzLWNkay1saWIvYXdzLWF1dG9zY2FsaW5nJztcbmltcG9ydCAqIGFzIGVjMiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWMyJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIGttcyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mta21zJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYi9jb3JlJztcbmltcG9ydCAqIGFzIGNkazhzIGZyb20gJ2NkazhzJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgWUFNTCBmcm9tICd5YW1sJztcbmltcG9ydCB7IHRlc3RGaXh0dXJlLCB0ZXN0Rml4dHVyZU5vVnBjIH0gZnJvbSAnLi91dGlsJztcbmltcG9ydCAqIGFzIGVrcyBmcm9tICcuLi9saWInO1xuaW1wb3J0IHsgSGVsbUNoYXJ0IH0gZnJvbSAnLi4vbGliJztcbmltcG9ydCB7IEt1YmVjdGxQcm92aWRlciB9IGZyb20gJy4uL2xpYi9rdWJlY3RsLXByb3ZpZGVyJztcbmltcG9ydCB7IEJvdHRsZVJvY2tldEltYWdlIH0gZnJvbSAnLi4vbGliL3ByaXZhdGUvYm90dGxlcm9ja2V0JztcblxuY29uc3QgQ0xVU1RFUl9WRVJTSU9OID0gZWtzLkt1YmVybmV0ZXNWZXJzaW9uLlYxXzMzO1xuY29uc3QgY29tbW9uUHJvcHMgPSB7XG4gIHZlcnNpb246IENMVVNURVJfVkVSU0lPTixcbiAgZGVmYXVsdENhcGFjaXR5OiAwLFxuICBkZWZhdWx0Q2FwYWNpdHlUeXBlOiBla3MuRGVmYXVsdENhcGFjaXR5VHlwZS5OT0RFR1JPVVAsXG59O1xuXG5kZXNjcmliZSgnY2x1c3RlcicsICgpID0+IHtcbiAgdGVzdCgnY2FuIGNvbmZpZ3VyZSBhbmQgYWNjZXNzIEFMQiBjb250cm9sbGVyJywgKCkgPT4ge1xuICAgIGNvbnN0IHsgc3RhY2sgfSA9IHRlc3RGaXh0dXJlKCk7XG5cbiAgICBjb25zdCBjbHVzdGVyID0gbmV3IGVrcy5DbHVzdGVyKHN0YWNrLCAnQ2x1c3RlcicsIHtcbiAgICAgIHZlcnNpb246IENMVVNURVJfVkVSU0lPTixcbiAgICAgIGFsYkNvbnRyb2xsZXI6IHtcbiAgICAgICAgdmVyc2lvbjogZWtzLkFsYkNvbnRyb2xsZXJWZXJzaW9uLlYyXzRfMSxcbiAgICAgIH0sXG4gICAgICBrdWJlY3RsUHJvdmlkZXJPcHRpb25zOiB7XG4gICAgICAgIGt1YmVjdGxMYXllcjogbmV3IEt1YmVjdGxWMzNMYXllcihzdGFjaywgJ2t1YmVjdGxMYXllcicpLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIFRlbXBsYXRlLmZyb21TdGFjayhzdGFjaykuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdDdXN0b206OkFXU0NESy1FS1MtSGVsbUNoYXJ0Jywge1xuICAgICAgQ2hhcnQ6ICdhd3MtbG9hZC1iYWxhbmNlci1jb250cm9sbGVyJyxcbiAgICB9KTtcbiAgICBleHBlY3QoY2x1c3Rlci5hbGJDb250cm9sbGVyKS50b0JlRGVmaW5lZCgpO1xuICB9KTtcblxuICBkZXNjcmliZSgnaW1wb3J0ZWQgVnBjIGZyb20gdW5wYXJzZWFibGUgbGlzdCB0b2tlbnMnLCAoKSA9PiB7XG4gICAgbGV0IHN0YWNrOiBjZGsuU3RhY2s7XG4gICAgbGV0IHZwYzogZWMyLklWcGM7XG5cbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIHN0YWNrID0gbmV3IGNkay5TdGFjaygpO1xuICAgICAgY29uc3QgdnBjSWQgPSBjZGsuRm4uaW1wb3J0VmFsdWUoJ215VnBjSWQnKTtcbiAgICAgIGNvbnN0IGF2YWlsYWJpbGl0eVpvbmVzID0gY2RrLkZuLnNwbGl0KCcsJywgY2RrLkZuLmltcG9ydFZhbHVlKCdteUF2YWlsYWJpbGl0eVpvbmVzJykpO1xuICAgICAgY29uc3QgcHVibGljU3VibmV0SWRzID0gY2RrLkZuLnNwbGl0KCcsJywgY2RrLkZuLmltcG9ydFZhbHVlKCdteVB1YmxpY1N1Ym5ldElkcycpKTtcbiAgICAgIGNvbnN0IHByaXZhdGVTdWJuZXRJZHMgPSBjZGsuRm4uc3BsaXQoJywnLCBjZGsuRm4uaW1wb3J0VmFsdWUoJ215UHJpdmF0ZVN1Ym5ldElkcycpKTtcbiAgICAgIGNvbnN0IGlzb2xhdGVkU3VibmV0SWRzID0gY2RrLkZuLnNwbGl0KCcsJywgY2RrLkZuLmltcG9ydFZhbHVlKCdteUlzb2xhdGVkU3VibmV0SWRzJykpO1xuXG4gICAgICB2cGMgPSBlYzIuVnBjLmZyb21WcGNBdHRyaWJ1dGVzKHN0YWNrLCAnaW1wb3J0ZWRWcGMnLCB7XG4gICAgICAgIHZwY0lkLFxuICAgICAgICBhdmFpbGFiaWxpdHlab25lcyxcbiAgICAgICAgcHVibGljU3VibmV0SWRzLFxuICAgICAgICBwcml2YXRlU3VibmV0SWRzLFxuICAgICAgICBpc29sYXRlZFN1Ym5ldElkcyxcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGVzdCgndGhyb3dzIGlmIHNlbGVjdGluZyBtb3JlIHRoYW4gb25lIHN1Ym5ldCBncm91cCcsICgpID0+IHtcbiAgICAgIGV4cGVjdCgoKSA9PiBuZXcgZWtzLkNsdXN0ZXIoc3RhY2ssICdDbHVzdGVyJywge1xuICAgICAgICB2cGM6IHZwYyxcbiAgICAgICAgdnBjU3VibmV0czogW3sgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFVCTElDIH0sIHsgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFJJVkFURV9XSVRIX0VHUkVTUyB9XSxcbiAgICAgICAgLi4uY29tbW9uUHJvcHMsXG4gICAgICB9KSkudG9UaHJvdygvY2Fubm90IHNlbGVjdCBtdWx0aXBsZSBzdWJuZXQgZ3JvdXBzLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdzeW50aGVzaXMgd29ya3MgaWYgb25seSBvbmUgc3VibmV0IGdyb3VwIGlzIHNlbGVjdGVkJywgKCkgPT4ge1xuICAgICAgLy8gV0hFTlxuICAgICAgbmV3IGVrcy5DbHVzdGVyKHN0YWNrLCAnQ2x1c3RlcicsIHtcbiAgICAgICAgdnBjOiB2cGMsXG4gICAgICAgIHZwY1N1Ym5ldHM6IFt7IHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBVQkxJQyB9XSxcbiAgICAgICAgLi4uY29tbW9uUHJvcHMsXG4gICAgICB9KTtcblxuICAgICAgLy8gVEhFTlxuICAgICAgVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6RUtTOjpDbHVzdGVyJywge1xuICAgICAgICBSZXNvdXJjZXNWcGNDb25maWc6IHtcbiAgICAgICAgICBTdWJuZXRJZHM6IHtcbiAgICAgICAgICAgICdGbjo6U3BsaXQnOiBbXG4gICAgICAgICAgICAgICcsJyxcbiAgICAgICAgICAgICAgeyAnRm46OkltcG9ydFZhbHVlJzogJ215UHVibGljU3VibmV0SWRzJyB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIHRlc3QoJ3Rocm93cyB3aGVuIGFjY2Vzc2luZyBjbHVzdGVyIHNlY3VyaXR5IGdyb3VwIGZvciBpbXBvcnRlZCBjbHVzdGVyIHdpdGhvdXQgY2x1c3RlciBzZWN1cml0eSBncm91cCBpZCcsICgpID0+IHtcbiAgICBjb25zdCB7IHN0YWNrIH0gPSB0ZXN0Rml4dHVyZSgpO1xuXG4gICAgY29uc3QgY2x1c3RlciA9IGVrcy5DbHVzdGVyLmZyb21DbHVzdGVyQXR0cmlidXRlcyhzdGFjaywgJ0NsdXN0ZXInLCB7XG4gICAgICBjbHVzdGVyTmFtZTogJ2NsdXN0ZXInLFxuICAgIH0pO1xuXG4gICAgZXhwZWN0KCgpID0+IGNsdXN0ZXIuY2x1c3RlclNlY3VyaXR5R3JvdXApLnRvVGhyb3coL1wiY2x1c3RlclNlY3VyaXR5R3JvdXBcIiBpcyBub3QgZGVmaW5lZCBmb3IgdGhpcyBpbXBvcnRlZCBjbHVzdGVyLyk7XG4gIH0pO1xuXG4gIHRlc3QoJ2NhbiBhY2Nlc3MgY2x1c3RlciBzZWN1cml0eSBncm91cCBmb3IgaW1wb3J0ZWQgY2x1c3RlciB3aXRoIGNsdXN0ZXIgc2VjdXJpdHkgZ3JvdXAgaWQnLCAoKSA9PiB7XG4gICAgY29uc3QgeyBzdGFjayB9ID0gdGVzdEZpeHR1cmUoKTtcblxuICAgIGNvbnN0IGNsdXN0ZXJTZ0lkID0gJ2NsdXN0ZXItc2ctaWQnO1xuXG4gICAgY29uc3QgY2x1c3RlciA9IGVrcy5DbHVzdGVyLmZyb21DbHVzdGVyQXR0cmlidXRlcyhzdGFjaywgJ0NsdXN0ZXInLCB7XG4gICAgICBjbHVzdGVyTmFtZTogJ2NsdXN0ZXInLFxuICAgICAgY2x1c3RlclNlY3VyaXR5R3JvdXBJZDogY2x1c3RlclNnSWQsXG4gICAgfSk7XG5cbiAgICBjb25zdCBjbHVzdGVyU2cgPSBjbHVzdGVyLmNsdXN0ZXJTZWN1cml0eUdyb3VwO1xuXG4gICAgZXhwZWN0KGNsdXN0ZXJTZy5zZWN1cml0eUdyb3VwSWQpLnRvRXF1YWwoY2x1c3RlclNnSWQpO1xuICB9KTtcblxuICB0ZXN0KCdjbHVzdGVyIHNlY3VyaXR5IGdyb3VwIGlzIGF0dGFjaGVkIHdoZW4gYWRkaW5nIHNlbGYtbWFuYWdlZCBub2RlcycsICgpID0+IHtcbiAgICAvLyBHSVZFTlxuICAgIGNvbnN0IHsgc3RhY2ssIHZwYyB9ID0gdGVzdEZpeHR1cmUoKTtcbiAgICBjb25zdCBjbHVzdGVyID0gbmV3IGVrcy5DbHVzdGVyKHN0YWNrLCAnQ2x1c3RlcicsIHtcbiAgICAgIHZwYyxcbiAgICAgIC4uLmNvbW1vblByb3BzLFxuICAgICAgcHJ1bmU6IGZhbHNlLFxuICAgIH0pO1xuXG4gICAgLy8gV0hFTlxuICAgIGNsdXN0ZXIuYWRkQXV0b1NjYWxpbmdHcm91cENhcGFjaXR5KCdzZWxmLW1hbmFnZWQnLCB7XG4gICAgICBpbnN0YW5jZVR5cGU6IG5ldyBlYzIuSW5zdGFuY2VUeXBlKCd0Mi5tZWRpdW0nKSxcbiAgICB9KTtcblxuICAgIFRlbXBsYXRlLmZyb21TdGFjayhzdGFjaykuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkF1dG9TY2FsaW5nOjpMYXVuY2hDb25maWd1cmF0aW9uJywge1xuICAgICAgU2VjdXJpdHlHcm91cHM6IFtcbiAgICAgICAgeyAnRm46OkdldEF0dCc6IFsnQ2x1c3RlcnNlbGZtYW5hZ2VkSW5zdGFuY2VTZWN1cml0eUdyb3VwNjQ0NjhDM0EnLCAnR3JvdXBJZCddIH0sXG4gICAgICAgIHsgJ0ZuOjpHZXRBdHQnOiBbJ0NsdXN0ZXJFQjAzODZBNycsICdDbHVzdGVyU2VjdXJpdHlHcm91cElkJ10gfSxcbiAgICAgIF0sXG4gICAgfSk7XG4gIH0pO1xuXG4gIHRlc3QoJ3NlY3VyaXR5IGdyb3VwIG9mIHNlbGYtbWFuYWdlZCBhc2cgaXMgbm90IHRhZ2dlZCB3aXRoIG93bmVkJywgKCkgPT4ge1xuICAgIC8vIEdJVkVOXG4gICAgY29uc3QgeyBzdGFjaywgdnBjIH0gPSB0ZXN0Rml4dHVyZSgpO1xuICAgIGNvbnN0IGNsdXN0ZXIgPSBuZXcgZWtzLkNsdXN0ZXIoc3RhY2ssICdDbHVzdGVyJywge1xuICAgICAgdnBjLFxuICAgICAgLi4uY29tbW9uUHJvcHMsXG4gICAgfSk7XG5cbiAgICAvLyBXSEVOXG4gICAgY2x1c3Rlci5hZGRBdXRvU2NhbGluZ0dyb3VwQ2FwYWNpdHkoJ3NlbGYtbWFuYWdlZCcsIHtcbiAgICAgIGluc3RhbmNlVHlwZTogbmV3IGVjMi5JbnN0YW5jZVR5cGUoJ3QyLm1lZGl1bScpLFxuICAgIH0pO1xuXG4gICAgbGV0IHRlbXBsYXRlID0gVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKTtcbiAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6RUMyOjpTZWN1cml0eUdyb3VwJywge1xuICAgICAgVGFnczogW3sgS2V5OiAnTmFtZScsIFZhbHVlOiAnU3RhY2svQ2x1c3Rlci9zZWxmLW1hbmFnZWQnIH1dLFxuICAgIH0pO1xuICB9KTtcblxuICB0ZXN0KCdjb25uZWN0IGF1dG9zY2FsaW5nIGdyb3VwIHdpdGggaW1wb3J0ZWQgY2x1c3RlcicsICgpID0+IHtcbiAgICAvLyBHSVZFTlxuICAgIGNvbnN0IHsgc3RhY2ssIHZwYyB9ID0gdGVzdEZpeHR1cmUoKTtcbiAgICBjb25zdCBjbHVzdGVyID0gbmV3IGVrcy5DbHVzdGVyKHN0YWNrLCAnQ2x1c3RlcicsIHtcbiAgICAgIHZwYyxcbiAgICAgIC4uLmNvbW1vblByb3BzLFxuICAgICAgcHJ1bmU6IGZhbHNlLFxuICAgIH0pO1xuXG4gICAgY29uc3QgaW1wb3J0ZWRDbHVzdGVyID0gZWtzLkNsdXN0ZXIuZnJvbUNsdXN0ZXJBdHRyaWJ1dGVzKHN0YWNrLCAnSW1wb3J0ZWRDbHVzdGVyJywge1xuICAgICAgY2x1c3Rlck5hbWU6IGNsdXN0ZXIuY2x1c3Rlck5hbWUsXG4gICAgICBjbHVzdGVyU2VjdXJpdHlHcm91cElkOiBjbHVzdGVyLmNsdXN0ZXJTZWN1cml0eUdyb3VwSWQsXG4gICAgfSk7XG5cbiAgICBjb25zdCBzZWxmTWFuYWdlZCA9IG5ldyBhc2cuQXV0b1NjYWxpbmdHcm91cChzdGFjaywgJ3NlbGYtbWFuYWdlZCcsIHtcbiAgICAgIGluc3RhbmNlVHlwZTogbmV3IGVjMi5JbnN0YW5jZVR5cGUoJ3QyLm1lZGl1bScpLFxuICAgICAgdnBjOiB2cGMsXG4gICAgICBtYWNoaW5lSW1hZ2U6IG5ldyBlYzIuQW1hem9uTGludXhJbWFnZSgpLFxuICAgIH0pO1xuXG4gICAgLy8gV0hFTlxuICAgIGltcG9ydGVkQ2x1c3Rlci5jb25uZWN0QXV0b1NjYWxpbmdHcm91cENhcGFjaXR5KHNlbGZNYW5hZ2VkLCB7fSk7XG5cbiAgICBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpBdXRvU2NhbGluZzo6TGF1bmNoQ29uZmlndXJhdGlvbicsIHtcbiAgICAgIFNlY3VyaXR5R3JvdXBzOiBbXG4gICAgICAgIHsgJ0ZuOjpHZXRBdHQnOiBbJ3NlbGZtYW5hZ2VkSW5zdGFuY2VTZWN1cml0eUdyb3VwRUE2RDgwQzknLCAnR3JvdXBJZCddIH0sXG4gICAgICAgIHsgJ0ZuOjpHZXRBdHQnOiBbJ0NsdXN0ZXJFQjAzODZBNycsICdDbHVzdGVyU2VjdXJpdHlHcm91cElkJ10gfSxcbiAgICAgIF0sXG4gICAgfSk7XG4gIH0pO1xuXG4gIHRlc3QoJ2NsdXN0ZXIgc2VjdXJpdHkgZ3JvdXAgaXMgYXR0YWNoZWQgd2hlbiBjb25uZWN0aW5nIHNlbGYtbWFuYWdlZCBub2RlcycsICgpID0+IHtcbiAgICAvLyBHSVZFTlxuICAgIGNvbnN0IHsgc3RhY2ssIHZwYyB9ID0gdGVzdEZpeHR1cmUoKTtcbiAgICBjb25zdCBjbHVzdGVyID0gbmV3IGVrcy5DbHVzdGVyKHN0YWNrLCAnQ2x1c3RlcicsIHtcbiAgICAgIHZwYyxcbiAgICAgIC4uLmNvbW1vblByb3BzLFxuICAgICAgcHJ1bmU6IGZhbHNlLFxuICAgIH0pO1xuXG4gICAgY29uc3Qgc2VsZk1hbmFnZWQgPSBuZXcgYXNnLkF1dG9TY2FsaW5nR3JvdXAoc3RhY2ssICdzZWxmLW1hbmFnZWQnLCB7XG4gICAgICBpbnN0YW5jZVR5cGU6IG5ldyBlYzIuSW5zdGFuY2VUeXBlKCd0Mi5tZWRpdW0nKSxcbiAgICAgIHZwYzogdnBjLFxuICAgICAgbWFjaGluZUltYWdlOiBuZXcgZWMyLkFtYXpvbkxpbnV4SW1hZ2UoKSxcbiAgICB9KTtcblxuICAgIC8vIFdIRU5cbiAgICBjbHVzdGVyLmNvbm5lY3RBdXRvU2NhbGluZ0dyb3VwQ2FwYWNpdHkoc2VsZk1hbmFnZWQsIHt9KTtcblxuICAgIFRlbXBsYXRlLmZyb21TdGFjayhzdGFjaykuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkF1dG9TY2FsaW5nOjpMYXVuY2hDb25maWd1cmF0aW9uJywge1xuICAgICAgU2VjdXJpdHlHcm91cHM6IFtcbiAgICAgICAgeyAnRm46OkdldEF0dCc6IFsnc2VsZm1hbmFnZWRJbnN0YW5jZVNlY3VyaXR5R3JvdXBFQTZEODBDOScsICdHcm91cElkJ10gfSxcbiAgICAgICAgeyAnRm46OkdldEF0dCc6IFsnQ2x1c3RlckVCMDM4NkE3JywgJ0NsdXN0ZXJTZWN1cml0eUdyb3VwSWQnXSB9LFxuICAgICAgXSxcbiAgICB9KTtcbiAgfSk7XG5cbiAgdGVzdCgndGhyb3dzIHdoZW4gYSBub24gY2RrOHMgY2hhcnQgY29uc3RydWN0IGlzIGFkZGVkIGFzIGNkazhzIGNoYXJ0JywgKCkgPT4ge1xuICAgIGNvbnN0IHsgc3RhY2sgfSA9IHRlc3RGaXh0dXJlKCk7XG5cbiAgICBjb25zdCBjbHVzdGVyID0gbmV3IGVrcy5DbHVzdGVyKHN0YWNrLCAnQ2x1c3RlcicsIHtcbiAgICAgIC4uLmNvbW1vblByb3BzLFxuICAgICAgcHJ1bmU6IGZhbHNlLFxuICAgIH0pO1xuXG4gICAgLy8gY3JlYXRlIGEgcGxhaW4gY29uc3RydWN0LCBub3QgYSBjZGs4cyBjaGFydFxuICAgIGNvbnN0IHNvbWVDb25zdHJ1Y3QgPSBuZXcgQ29uc3RydWN0KHN0YWNrLCAnU29tZUNvbnN0cnVjdCcpO1xuXG4gICAgZXhwZWN0KCgpID0+IGNsdXN0ZXIuYWRkQ2RrOHNDaGFydCgnY2hhcnQnLCBzb21lQ29uc3RydWN0KSkudG9UaHJvdygvSW52YWxpZCBjZGs4cyBjaGFydC4gTXVzdCBjb250YWluIGEgXFwndG9Kc29uXFwnIG1ldGhvZCwgYnV0IGZvdW5kIHVuZGVmaW5lZC8pO1xuICB9KTtcblxuICB0ZXN0KCdjZGs4cyBjaGFydCBjYW4gYmUgYWRkZWQgdG8gY2x1c3RlcicsICgpID0+IHtcbiAgICBjb25zdCB7IHN0YWNrIH0gPSB0ZXN0Rml4dHVyZSgpO1xuXG4gICAgY29uc3QgY2x1c3RlciA9IG5ldyBla3MuQ2x1c3RlcihzdGFjaywgJ0NsdXN0ZXInLCB7XG4gICAgICAuLi5jb21tb25Qcm9wcyxcbiAgICAgIHBydW5lOiBmYWxzZSxcbiAgICAgIGt1YmVjdGxQcm92aWRlck9wdGlvbnM6IHtcbiAgICAgICAga3ViZWN0bExheWVyOiBuZXcgS3ViZWN0bFYzM0xheWVyKHN0YWNrLCAna3ViZWN0bExheWVyJyksXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgY29uc3QgYXBwID0gbmV3IGNkazhzLkFwcCgpO1xuICAgIGNvbnN0IGNoYXJ0ID0gbmV3IGNkazhzLkNoYXJ0KGFwcCwgJ0NoYXJ0Jyk7XG5cbiAgICBuZXcgY2RrOHMuQXBpT2JqZWN0KGNoYXJ0LCAnRmFrZVBvZCcsIHtcbiAgICAgIGFwaVZlcnNpb246ICd2MScsXG4gICAgICBraW5kOiAnUG9kJyxcbiAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgIG5hbWU6ICdmYWtlLXBvZCcsXG4gICAgICAgIGxhYmVsczoge1xuICAgICAgICAgIC8vIGFkZGluZyBhd3MtY2RrIHRva2VuIHRvIGNkazhzIGNoYXJ0XG4gICAgICAgICAgY2x1c3Rlck5hbWU6IGNsdXN0ZXIuY2x1c3Rlck5hbWUsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgY2x1c3Rlci5hZGRDZGs4c0NoYXJ0KCdjZGs4cy1jaGFydCcsIGNoYXJ0KTtcblxuICAgIFRlbXBsYXRlLmZyb21TdGFjayhzdGFjaykuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdDdXN0b206OkFXU0NESy1FS1MtS3ViZXJuZXRlc1Jlc291cmNlJywge1xuICAgICAgTWFuaWZlc3Q6IHtcbiAgICAgICAgJ0ZuOjpKb2luJzogW1xuICAgICAgICAgICcnLFxuICAgICAgICAgIFtcbiAgICAgICAgICAgICdbe1wiYXBpVmVyc2lvblwiOlwidjFcIixcImtpbmRcIjpcIlBvZFwiLFwibWV0YWRhdGFcIjp7XCJsYWJlbHNcIjp7XCJjbHVzdGVyTmFtZVwiOlwiJyxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgUmVmOiAnQ2x1c3RlckVCMDM4NkE3JyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnXCJ9LFwibmFtZVwiOlwiZmFrZS1wb2RcIn19XScsXG4gICAgICAgICAgXSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH0pO1xuXG4gIHRlc3QoJ2NsdXN0ZXIgY29ubmVjdGlvbnMgaW5jbHVkZSBib3RoIGNvbnRyb2wgcGxhbmUgYW5kIGNsdXN0ZXIgc2VjdXJpdHkgZ3JvdXAnLCAoKSA9PiB7XG4gICAgY29uc3QgeyBzdGFjayB9ID0gdGVzdEZpeHR1cmUoKTtcblxuICAgIGNvbnN0IGNsdXN0ZXIgPSBuZXcgZWtzLkNsdXN0ZXIoc3RhY2ssICdDbHVzdGVyJywge1xuICAgICAgLi4uY29tbW9uUHJvcHMsXG4gICAgICBwcnVuZTogZmFsc2UsXG4gICAgfSk7XG5cbiAgICBleHBlY3QoY2x1c3Rlci5jb25uZWN0aW9ucy5zZWN1cml0eUdyb3Vwcy5tYXAoc2cgPT4gc3RhY2sucmVzb2x2ZShzZy5zZWN1cml0eUdyb3VwSWQpKSkudG9FcXVhbChbXG4gICAgICB7ICdGbjo6R2V0QXR0JzogWydDbHVzdGVyRUIwMzg2QTcnLCAnQ2x1c3RlclNlY3VyaXR5R3JvdXBJZCddIH0sXG4gICAgICB7ICdGbjo6R2V0QXR0JzogWydDbHVzdGVyQ29udHJvbFBsYW5lU2VjdXJpdHlHcm91cEQyNzQyNDJDJywgJ0dyb3VwSWQnXSB9LFxuICAgIF0pO1xuICB9KTtcblxuICB0ZXN0KCdjYW4gZGVjbGFyZSBhIHNlY3VyaXR5IGdyb3VwIGZyb20gYSBkaWZmZXJlbnQgc3RhY2snLCAoKSA9PiB7XG4gICAgY2xhc3MgQ2x1c3RlclN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgICAgIHB1YmxpYyBla3NDbHVzdGVyOiBla3MuQ2x1c3RlcjtcblxuICAgICAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IHsgc2c6IGVjMi5JU2VjdXJpdHlHcm91cDsgdnBjOiBlYzIuSVZwYyB9KSB7XG4gICAgICAgIHN1cGVyKHNjb3BlLCBpZCk7XG4gICAgICAgIHRoaXMuZWtzQ2x1c3RlciA9IG5ldyBla3MuQ2x1c3Rlcih0aGlzLCAnQ2x1c3RlcicsIHtcbiAgICAgICAgICAuLi5jb21tb25Qcm9wcyxcbiAgICAgICAgICBwcnVuZTogZmFsc2UsXG4gICAgICAgICAgc2VjdXJpdHlHcm91cDogcHJvcHMuc2csXG4gICAgICAgICAgdnBjOiBwcm9wcy52cGMsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNsYXNzIE5ldHdvcmtTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gICAgICBwdWJsaWMgcmVhZG9ubHkgc2VjdXJpdHlHcm91cDogZWMyLklTZWN1cml0eUdyb3VwO1xuICAgICAgcHVibGljIHJlYWRvbmx5IHZwYzogZWMyLklWcGM7XG5cbiAgICAgIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcpIHtcbiAgICAgICAgc3VwZXIoc2NvcGUsIGlkKTtcbiAgICAgICAgdGhpcy52cGMgPSBuZXcgZWMyLlZwYyh0aGlzLCAnVnBjJyk7XG4gICAgICAgIHRoaXMuc2VjdXJpdHlHcm91cCA9IG5ldyBlYzIuU2VjdXJpdHlHcm91cCh0aGlzLCAnU2VjdXJpdHlHcm91cCcsIHsgdnBjOiB0aGlzLnZwYyB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCB7IGFwcCB9ID0gdGVzdEZpeHR1cmUoKTtcbiAgICBjb25zdCBuZXR3b3JrU3RhY2sgPSBuZXcgTmV0d29ya1N0YWNrKGFwcCwgJ05ldHdvcmtTdGFjaycpO1xuICAgIG5ldyBDbHVzdGVyU3RhY2soYXBwLCAnQ2x1c3RlclN0YWNrJywgeyBzZzogbmV0d29ya1N0YWNrLnNlY3VyaXR5R3JvdXAsIHZwYzogbmV0d29ya1N0YWNrLnZwYyB9KTtcblxuICAgIC8vIG1ha2Ugc3VyZSB3ZSBjYW4gc3ludGggKG5vIGNpcmN1bGFyIGRlcGVuZGVuY2llcyBiZXR3ZWVuIHRoZSBzdGFja3MpXG4gICAgYXBwLnN5bnRoKCk7XG4gIH0pO1xuXG4gIHRlc3QoJ2NhbiBkZWNsYXJlIGEgbWFuaWZlc3Qgd2l0aCBhIHRva2VuIGZyb20gYSBkaWZmZXJlbnQgc3RhY2sgdGhhbiB0aGUgY2x1c3RlciB0aGF0IGRlcGVuZHMgb24gdGhlIGNsdXN0ZXIgc3RhY2snLCAoKSA9PiB7XG4gICAgY2xhc3MgQ2x1c3RlclN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgICAgIHB1YmxpYyBla3NDbHVzdGVyOiBla3MuQ2x1c3RlcjtcblxuICAgICAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgICAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcbiAgICAgICAgdGhpcy5la3NDbHVzdGVyID0gbmV3IGVrcy5DbHVzdGVyKHRoaXMsICdDbHVzdGVyJywge1xuICAgICAgICAgIC4uLmNvbW1vblByb3BzLFxuICAgICAgICAgIHBydW5lOiBmYWxzZSxcbiAgICAgICAgICBrdWJlY3RsUHJvdmlkZXJPcHRpb25zOiB7XG4gICAgICAgICAgICBrdWJlY3RsTGF5ZXI6IG5ldyBLdWJlY3RsVjMzTGF5ZXIodGhpcywgJ2t1YmVjdGxMYXllcicpLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNsYXNzIE1hbmlmZXN0U3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICAgICAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IGNkay5TdGFja1Byb3BzICYgeyBjbHVzdGVyOiBla3MuQ2x1c3RlciB9KSB7XG4gICAgICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgICAgIC8vIHRoaXMgcm9sZSBjcmVhdGVzIGEgZGVwZW5kZW5jeSBiZXR3ZWVuIHRoaXMgc3RhY2sgYW5kIHRoZSBjbHVzdGVyIHN0YWNrXG4gICAgICAgIGNvbnN0IHJvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgJ0Nyb3NzUm9sZScsIHtcbiAgICAgICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnc3FzLmFtYXpvbmF3cy5jb20nKSxcbiAgICAgICAgICByb2xlTmFtZTogcHJvcHMuY2x1c3Rlci5jbHVzdGVyQXJuLFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBtYWtlIHN1cmUgdGhpcyBtYW5pZmVzdCBkb2Vzbid0IGNyZWF0ZSBhIGRlcGVuZGVuY3kgYmV0d2VlbiB0aGUgY2x1c3RlciBzdGFja1xuICAgICAgICAvLyBhbmQgdGhpcyBzdGFja1xuICAgICAgICBuZXcgZWtzLkt1YmVybmV0ZXNNYW5pZmVzdCh0aGlzLCAnY3Jvc3Mtc3RhY2snLCB7XG4gICAgICAgICAgbWFuaWZlc3Q6IFt7XG4gICAgICAgICAgICBraW5kOiAnQ29uZmlnTWFwJyxcbiAgICAgICAgICAgIGFwaVZlcnNpb246ICd2MScsXG4gICAgICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgICAgICBuYW1lOiAnY29uZmlnLW1hcCcsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICBmb286IHJvbGUucm9sZUFybixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfV0sXG4gICAgICAgICAgY2x1c3RlcjogcHJvcHMuY2x1c3RlcixcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgeyBhcHAgfSA9IHRlc3RGaXh0dXJlKCk7XG4gICAgY29uc3QgY2x1c3RlclN0YWNrID0gbmV3IENsdXN0ZXJTdGFjayhhcHAsICdDbHVzdGVyU3RhY2snKTtcbiAgICBuZXcgTWFuaWZlc3RTdGFjayhhcHAsICdNYW5pZmVzdFN0YWNrJywgeyBjbHVzdGVyOiBjbHVzdGVyU3RhY2suZWtzQ2x1c3RlciB9KTtcblxuICAgIC8vIG1ha2Ugc3VyZSB3ZSBjYW4gc3ludGggKG5vIGNpcmN1bGFyIGRlcGVuZGVuY2llcyBiZXR3ZWVuIHRoZSBzdGFja3MpXG4gICAgYXBwLnN5bnRoKCk7XG4gIH0pO1xuXG4gIHRlc3QoJ2NhbiBkZWNsYXJlIGEgY2hhcnQgd2l0aCBhIHRva2VuIGZyb20gYSBkaWZmZXJlbnQgc3RhY2sgdGhhbiB0aGUgY2x1c3RlciB0aGF0IGRlcGVuZHMgb24gdGhlIGNsdXN0ZXIgc3RhY2snLCAoKSA9PiB7XG4gICAgY2xhc3MgQ2x1c3RlclN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgICAgIHB1YmxpYyBla3NDbHVzdGVyOiBla3MuQ2x1c3RlcjtcblxuICAgICAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgICAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcbiAgICAgICAgdGhpcy5la3NDbHVzdGVyID0gbmV3IGVrcy5DbHVzdGVyKHRoaXMsICdDbHVzdGVyJywge1xuICAgICAgICAgIHZlcnNpb246IENMVVNURVJfVkVSU0lPTixcbiAgICAgICAgICBwcnVuZTogZmFsc2UsXG4gICAgICAgICAga3ViZWN0bFByb3ZpZGVyT3B0aW9uczoge1xuICAgICAgICAgICAga3ViZWN0bExheWVyOiBuZXcgS3ViZWN0bFYzM0xheWVyKHRoaXMsICdrdWJlY3RsTGF5ZXInKSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjbGFzcyBDaGFydFN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgICAgIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBjZGsuU3RhY2tQcm9wcyAmIHsgY2x1c3RlcjogZWtzLkNsdXN0ZXIgfSkge1xuICAgICAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgICAgICAvLyB0aGlzIHJvbGUgY3JlYXRlcyBhIGRlcGVuZGVuY3kgYmV0d2VlbiB0aGlzIHN0YWNrIGFuZCB0aGUgY2x1c3RlciBzdGFja1xuICAgICAgICBjb25zdCByb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsICdDcm9zc1JvbGUnLCB7XG4gICAgICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ3Nxcy5hbWF6b25hd3MuY29tJyksXG4gICAgICAgICAgcm9sZU5hbWU6IHByb3BzLmNsdXN0ZXIuY2x1c3RlckFybixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gbWFrZSBzdXJlIHRoaXMgY2hhcnQgZG9lc24ndCBjcmVhdGUgYSBkZXBlbmRlbmN5IGJldHdlZW4gdGhlIGNsdXN0ZXIgc3RhY2tcbiAgICAgICAgLy8gYW5kIHRoaXMgc3RhY2tcbiAgICAgICAgbmV3IGVrcy5IZWxtQ2hhcnQodGhpcywgJ2Nyb3NzLXN0YWNrJywge1xuICAgICAgICAgIGNoYXJ0OiByb2xlLnJvbGVBcm4sXG4gICAgICAgICAgY2x1c3RlcjogcHJvcHMuY2x1c3RlcixcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgeyBhcHAgfSA9IHRlc3RGaXh0dXJlKCk7XG4gICAgY29uc3QgY2x1c3RlclN0YWNrID0gbmV3IENsdXN0ZXJTdGFjayhhcHAsICdDbHVzdGVyU3RhY2snKTtcbiAgICBuZXcgQ2hhcnRTdGFjayhhcHAsICdDaGFydFN0YWNrJywgeyBjbHVzdGVyOiBjbHVzdGVyU3RhY2suZWtzQ2x1c3RlciB9KTtcblxuICAgIC8vIG1ha2Ugc3VyZSB3ZSBjYW4gc3ludGggKG5vIGNpcmN1bGFyIGRlcGVuZGVuY2llcyBiZXR3ZWVuIHRoZSBzdGFja3MpXG4gICAgYXBwLnN5bnRoKCk7XG4gIH0pO1xuXG4gIHRlc3QoJ2NhbiBkZWNsYXJlIGEgSGVsbUNoYXJ0IGluIGEgZGlmZmVyZW50IHN0YWNrIHRoYW4gdGhlIGNsdXN0ZXInLCAoKSA9PiB7XG4gICAgY2xhc3MgQ2x1c3RlclN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgICAgIHB1YmxpYyBla3NDbHVzdGVyOiBla3MuQ2x1c3RlcjtcblxuICAgICAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgICAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcbiAgICAgICAgdGhpcy5la3NDbHVzdGVyID0gbmV3IGVrcy5DbHVzdGVyKHRoaXMsICdDbHVzdGVyJywge1xuICAgICAgICAgIHZlcnNpb246IENMVVNURVJfVkVSU0lPTixcbiAgICAgICAgICBwcnVuZTogZmFsc2UsXG4gICAgICAgICAga3ViZWN0bFByb3ZpZGVyT3B0aW9uczoge1xuICAgICAgICAgICAga3ViZWN0bExheWVyOiBuZXcgS3ViZWN0bFYzM0xheWVyKHRoaXMsICdrdWJlY3RsTGF5ZXInKSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjbGFzcyBDaGFydFN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgICAgIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBjZGsuU3RhY2tQcm9wcyAmIHsgY2x1c3RlcjogZWtzLkNsdXN0ZXIgfSkge1xuICAgICAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgICAgICBjb25zdCByZXNvdXJjZSA9IG5ldyBjZGsuQ2ZuUmVzb3VyY2UodGhpcywgJ3Jlc291cmNlJywgeyB0eXBlOiAnTXlUeXBlJyB9KTtcbiAgICAgICAgbmV3IGVrcy5IZWxtQ2hhcnQodGhpcywgYGNoYXJ0LSR7aWR9YCwgeyBjbHVzdGVyOiBwcm9wcy5jbHVzdGVyLCBjaGFydDogcmVzb3VyY2UucmVmIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHsgYXBwIH0gPSB0ZXN0Rml4dHVyZSgpO1xuICAgIGNvbnN0IGNsdXN0ZXJTdGFjayA9IG5ldyBDbHVzdGVyU3RhY2soYXBwLCAnQ2x1c3RlclN0YWNrJyk7XG4gICAgbmV3IENoYXJ0U3RhY2soYXBwLCAnQ2hhcnRTdGFjaycsIHsgY2x1c3RlcjogY2x1c3RlclN0YWNrLmVrc0NsdXN0ZXIgfSk7XG5cbiAgICAvLyBtYWtlIHN1cmUgd2UgY2FuIHN5bnRoIChubyBjaXJjdWxhciBkZXBlbmRlbmNpZXMgYmV0d2VlbiB0aGUgc3RhY2tzKVxuICAgIGFwcC5zeW50aCgpO1xuICB9KTtcblxuICB0ZXN0KCdjYW4gZGVjbGFyZSBhIFNlcnZpY2VBY2NvdW50IGluIGEgZGlmZmVyZW50IHN0YWNrIHRoYW4gdGhlIGNsdXN0ZXInLCAoKSA9PiB7XG4gICAgY2xhc3MgQ2x1c3RlclN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgICAgIHB1YmxpYyBla3NDbHVzdGVyOiBla3MuQ2x1c3RlcjtcblxuICAgICAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgICAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcbiAgICAgICAgdGhpcy5la3NDbHVzdGVyID0gbmV3IGVrcy5DbHVzdGVyKHRoaXMsICdFS1NDbHVzdGVyJywge1xuICAgICAgICAgIHZlcnNpb246IENMVVNURVJfVkVSU0lPTixcbiAgICAgICAgICBwcnVuZTogZmFsc2UsXG4gICAgICAgICAga3ViZWN0bFByb3ZpZGVyT3B0aW9uczoge1xuICAgICAgICAgICAga3ViZWN0bExheWVyOiBuZXcgS3ViZWN0bFYzM0xheWVyKHRoaXMsICdrdWJlY3RsTGF5ZXInKSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjbGFzcyBBcHBTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gICAgICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogY2RrLlN0YWNrUHJvcHMgJiB7IGNsdXN0ZXI6IGVrcy5DbHVzdGVyIH0pIHtcbiAgICAgICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAgICAgbmV3IGVrcy5TZXJ2aWNlQWNjb3VudCh0aGlzLCAndGVzdEFjY291bnQnLCB7IGNsdXN0ZXI6IHByb3BzLmNsdXN0ZXIsIG5hbWU6ICd0ZXN0LWFjY291bnQnLCBuYW1lc3BhY2U6ICd0ZXN0JyB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCB7IGFwcCB9ID0gdGVzdEZpeHR1cmUoKTtcbiAgICBjb25zdCBjbHVzdGVyU3RhY2sgPSBuZXcgQ2x1c3RlclN0YWNrKGFwcCwgJ0VLU0NsdXN0ZXInKTtcbiAgICBuZXcgQXBwU3RhY2soYXBwLCAnS3ViZUFwcCcsIHsgY2x1c3RlcjogY2x1c3RlclN0YWNrLmVrc0NsdXN0ZXIgfSk7XG5cbiAgICAvLyBtYWtlIHN1cmUgd2UgY2FuIHN5bnRoIChubyBjaXJjdWxhciBkZXBlbmRlbmNpZXMgYmV0d2VlbiB0aGUgc3RhY2tzKVxuICAgIGFwcC5zeW50aCgpO1xuICB9KTtcblxuICB0ZXN0KCdhIGRlZmF1bHQgY2x1c3RlciBzcGFucyBhbGwgc3VibmV0cycsICgpID0+IHtcbiAgICAvLyBHSVZFTlxuICAgIGNvbnN0IHsgc3RhY2ssIHZwYyB9ID0gdGVzdEZpeHR1cmUoKTtcblxuICAgIC8vIFdIRU5cbiAgICBuZXcgZWtzLkNsdXN0ZXIoc3RhY2ssICdDbHVzdGVyJywgeyB2cGMsIC4uLmNvbW1vblByb3BzLCBwcnVuZTogZmFsc2UgfSk7XG5cbiAgICAvLyBUSEVOXG4gICAgVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6RUtTOjpDbHVzdGVyJywge1xuICAgICAgUm9sZUFybjogeyAnRm46OkdldEF0dCc6IFsnQ2x1c3RlclJvbGVGQTI2MTk3OScsICdBcm4nXSB9LFxuICAgICAgVmVyc2lvbjogQ0xVU1RFUl9WRVJTSU9OLnZlcnNpb24sXG4gICAgICBSZXNvdXJjZXNWcGNDb25maWc6IHtcbiAgICAgICAgU2VjdXJpdHlHcm91cElkczogW3sgJ0ZuOjpHZXRBdHQnOiBbJ0NsdXN0ZXJDb250cm9sUGxhbmVTZWN1cml0eUdyb3VwRDI3NDI0MkMnLCAnR3JvdXBJZCddIH1dLFxuICAgICAgICBTdWJuZXRJZHM6IFtcbiAgICAgICAgICB7IFJlZjogJ1ZQQ1B1YmxpY1N1Ym5ldDFTdWJuZXRCNDI0NkQzMCcgfSxcbiAgICAgICAgICB7IFJlZjogJ1ZQQ1B1YmxpY1N1Ym5ldDJTdWJuZXQ3NDE3OUYzOScgfSxcbiAgICAgICAgICB7IFJlZjogJ1ZQQ1ByaXZhdGVTdWJuZXQxU3VibmV0OEJDQTEwRTAnIH0sXG4gICAgICAgICAgeyBSZWY6ICdWUENQcml2YXRlU3VibmV0MlN1Ym5ldENGQ0RBQTdBJyB9LFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICB9KTtcbiAgfSk7XG5cbiAgdGVzdCgnaWYgXCJ2cGNcIiBpcyBub3Qgc3BlY2lmaWVkLCB2cGMgd2l0aCBkZWZhdWx0IGNvbmZpZ3VyYXRpb24gd2lsbCBiZSBjcmVhdGVkJywgKCkgPT4ge1xuICAgIC8vIEdJVkVOXG4gICAgY29uc3QgeyBzdGFjayB9ID0gdGVzdEZpeHR1cmVOb1ZwYygpO1xuXG4gICAgLy8gV0hFTlxuICAgIG5ldyBla3MuQ2x1c3RlcihzdGFjaywgJ2NsdXN0ZXInLCB7IHZlcnNpb246IENMVVNURVJfVkVSU0lPTiwgcHJ1bmU6IGZhbHNlIH0pO1xuXG4gICAgLy8gVEhFTlxuICAgIFRlbXBsYXRlLmZyb21TdGFjayhzdGFjaykuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkVDMjo6VlBDJywgTWF0Y2guYW55VmFsdWUoKSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdubyBkZWZhdWx0IGNhcGFjaXR5IGFzIGF1dG8gbW9kZSBpcyBpbXBsaWNpdGx5IGVuYWJsZWQnLCAoKSA9PiB7XG4gICAgdGVzdCgnbm8gZGVmYXVsdCBjYXBhY2l0eSBieSBkZWZhdWx0JywgKCkgPT4ge1xuICAgICAgLy8gR0lWRU5cbiAgICAgIGNvbnN0IHsgc3RhY2sgfSA9IHRlc3RGaXh0dXJlTm9WcGMoKTtcblxuICAgICAgLy8gV0hFTlxuICAgICAgY29uc3QgY2x1c3RlciA9IG5ldyBla3MuQ2x1c3RlcihzdGFjaywgJ2NsdXN0ZXInLCB7IHZlcnNpb246IENMVVNURVJfVkVSU0lPTiwgcHJ1bmU6IGZhbHNlIH0pO1xuXG4gICAgICAvLyBUSEVOXG4gICAgICBleHBlY3QoY2x1c3Rlci5kZWZhdWx0Tm9kZWdyb3VwKS50b0JlVW5kZWZpbmVkKCk7XG4gICAgICBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spLnJlc291cmNlQ291bnRJcygnQVdTOjpFS1M6Ok5vZGVncm91cCcsIDApO1xuICAgIH0pO1xuXG4gICAgdGVzdCgncXVhbnRpdHkgYW5kIHR5cGUgY2FuIGJlIGN1c3RvbWl6ZWQnLCAoKSA9PiB7XG4gICAgICAvLyBHSVZFTlxuICAgICAgY29uc3QgeyBzdGFjayB9ID0gdGVzdEZpeHR1cmVOb1ZwYygpO1xuXG4gICAgICAvLyBXSEVOXG4gICAgICBjb25zdCBjbHVzdGVyID0gbmV3IGVrcy5DbHVzdGVyKHN0YWNrLCAnY2x1c3RlcicsIHtcbiAgICAgICAgZGVmYXVsdENhcGFjaXR5VHlwZTogZWtzLkRlZmF1bHRDYXBhY2l0eVR5cGUuTk9ERUdST1VQLFxuICAgICAgICBkZWZhdWx0Q2FwYWNpdHk6IDEwLFxuICAgICAgICBkZWZhdWx0Q2FwYWNpdHlJbnN0YW5jZTogbmV3IGVjMi5JbnN0YW5jZVR5cGUoJ20yLnhsYXJnZScpLFxuICAgICAgICB2ZXJzaW9uOiBDTFVTVEVSX1ZFUlNJT04sXG4gICAgICAgIHBydW5lOiBmYWxzZSxcbiAgICAgIH0pO1xuXG4gICAgICAvLyBUSEVOXG4gICAgICBleHBlY3QoY2x1c3Rlci5kZWZhdWx0Tm9kZWdyb3VwKS50b0JlRGVmaW5lZCgpO1xuICAgICAgVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6RUtTOjpOb2RlZ3JvdXAnLCB7XG4gICAgICAgIFNjYWxpbmdDb25maWc6IHtcbiAgICAgICAgICBEZXNpcmVkU2l6ZTogMTAsXG4gICAgICAgICAgTWF4U2l6ZTogMTAsXG4gICAgICAgICAgTWluU2l6ZTogMTAsXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIC8vIGV4cGVjdChzdGFjaykudG9IYXZlUmVzb3VyY2UoJ0FXUzo6QXV0b1NjYWxpbmc6OkxhdW5jaENvbmZpZ3VyYXRpb24nLCB7IEluc3RhbmNlVHlwZTogJ20yLnhsYXJnZScgfSkpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnZGVmYXVsdENhcGFjaXR5PTAgd2lsbCBub3QgYWxsb2NhdGUgYXQgYWxsJywgKCkgPT4ge1xuICAgICAgLy8gR0lWRU5cbiAgICAgIGNvbnN0IHsgc3RhY2sgfSA9IHRlc3RGaXh0dXJlTm9WcGMoKTtcblxuICAgICAgLy8gV0hFTlxuICAgICAgY29uc3QgY2x1c3RlciA9IG5ldyBla3MuQ2x1c3RlcihzdGFjaywgJ2NsdXN0ZXInLCB7XG4gICAgICAgIC4uLmNvbW1vblByb3BzLFxuICAgICAgICBwcnVuZTogZmFsc2UsXG4gICAgICB9KTtcblxuICAgICAgLy8gVEhFTlxuICAgICAgZXhwZWN0KGNsdXN0ZXIuZGVmYXVsdENhcGFjaXR5KS50b0JlVW5kZWZpbmVkKCk7XG4gICAgICBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spLnJlc291cmNlQ291bnRJcygnQVdTOjpBdXRvU2NhbGluZzo6QXV0b1NjYWxpbmdHcm91cCcsIDApO1xuICAgICAgVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKS5yZXNvdXJjZUNvdW50SXMoJ0FXUzo6QXV0b1NjYWxpbmc6OkxhdW5jaENvbmZpZ3VyYXRpb24nLCAwKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgdGVzdCgnY3JlYXRpbmcgYSBjbHVzdGVyIHRhZ3MgdGhlIHByaXZhdGUgVlBDIHN1Ym5ldHMnLCAoKSA9PiB7XG4gICAgLy8gR0lWRU5cbiAgICBjb25zdCB7IHN0YWNrLCB2cGMgfSA9IHRlc3RGaXh0dXJlKCk7XG5cbiAgICAvLyBXSEVOXG4gICAgbmV3IGVrcy5DbHVzdGVyKHN0YWNrLCAnQ2x1c3RlcicsIHtcbiAgICAgIHZwYyxcbiAgICAgIC4uLmNvbW1vblByb3BzLFxuICAgICAgcHJ1bmU6IGZhbHNlLFxuICAgIH0pO1xuXG4gICAgLy8gVEhFTlxuICAgIFRlbXBsYXRlLmZyb21TdGFjayhzdGFjaykuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkVDMjo6U3VibmV0Jywge1xuICAgICAgVGFnczogW1xuICAgICAgICB7IEtleTogJ2F3cy1jZGs6c3VibmV0LW5hbWUnLCBWYWx1ZTogJ1ByaXZhdGUnIH0sXG4gICAgICAgIHsgS2V5OiAnYXdzLWNkazpzdWJuZXQtdHlwZScsIFZhbHVlOiAnUHJpdmF0ZScgfSxcbiAgICAgICAgeyBLZXk6ICdrdWJlcm5ldGVzLmlvL3JvbGUvaW50ZXJuYWwtZWxiJywgVmFsdWU6ICcxJyB9LFxuICAgICAgICB7IEtleTogJ05hbWUnLCBWYWx1ZTogJ1N0YWNrL1ZQQy9Qcml2YXRlU3VibmV0MScgfSxcbiAgICAgIF0sXG4gICAgfSk7XG4gIH0pO1xuXG4gIHRlc3QoJ2NyZWF0aW5nIGEgY2x1c3RlciB0YWdzIHRoZSBwdWJsaWMgVlBDIHN1Ym5ldHMnLCAoKSA9PiB7XG4gICAgLy8gR0lWRU5cbiAgICBjb25zdCB7IHN0YWNrLCB2cGMgfSA9IHRlc3RGaXh0dXJlKCk7XG5cbiAgICAvLyBXSEVOXG4gICAgbmV3IGVrcy5DbHVzdGVyKHN0YWNrLCAnQ2x1c3RlcicsIHtcbiAgICAgIHZwYyxcbiAgICAgIC4uLmNvbW1vblByb3BzLFxuICAgICAgcHJ1bmU6IGZhbHNlLFxuICAgIH0pO1xuXG4gICAgLy8gVEhFTlxuICAgIFRlbXBsYXRlLmZyb21TdGFjayhzdGFjaykuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkVDMjo6U3VibmV0Jywge1xuICAgICAgTWFwUHVibGljSXBPbkxhdW5jaDogdHJ1ZSxcbiAgICAgIFRhZ3M6IFtcbiAgICAgICAgeyBLZXk6ICdhd3MtY2RrOnN1Ym5ldC1uYW1lJywgVmFsdWU6ICdQdWJsaWMnIH0sXG4gICAgICAgIHsgS2V5OiAnYXdzLWNkazpzdWJuZXQtdHlwZScsIFZhbHVlOiAnUHVibGljJyB9LFxuICAgICAgICB7IEtleTogJ2t1YmVybmV0ZXMuaW8vcm9sZS9lbGInLCBWYWx1ZTogJzEnIH0sXG4gICAgICAgIHsgS2V5OiAnTmFtZScsIFZhbHVlOiAnU3RhY2svVlBDL1B1YmxpY1N1Ym5ldDEnIH0sXG4gICAgICBdLFxuICAgIH0pO1xuICB9KTtcblxuICB0ZXN0KCdhZGRpbmcgY2FwYWNpdHkgY3JlYXRlcyBhbiBBU0cgd2l0aG91dCBhIHJvbGxpbmcgdXBkYXRlIHBvbGljeScsICgpID0+IHtcbiAgICAvLyBHSVZFTlxuICAgIGNvbnN0IHsgc3RhY2ssIHZwYyB9ID0gdGVzdEZpeHR1cmUoKTtcbiAgICBjb25zdCBjbHVzdGVyID0gbmV3IGVrcy5DbHVzdGVyKHN0YWNrLCAnQ2x1c3RlcicsIHtcbiAgICAgIHZwYyxcbiAgICAgIC4uLmNvbW1vblByb3BzLFxuICAgICAgcHJ1bmU6IGZhbHNlLFxuICAgIH0pO1xuXG4gICAgLy8gV0hFTlxuICAgIGNsdXN0ZXIuYWRkQXV0b1NjYWxpbmdHcm91cENhcGFjaXR5KCdEZWZhdWx0Jywge1xuICAgICAgaW5zdGFuY2VUeXBlOiBuZXcgZWMyLkluc3RhbmNlVHlwZSgndDIubWVkaXVtJyksXG4gICAgfSk7XG5cbiAgICBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spLmhhc1Jlc291cmNlKCdBV1M6OkF1dG9TY2FsaW5nOjpBdXRvU2NhbGluZ0dyb3VwJywge1xuICAgICAgVXBkYXRlUG9saWN5OiB7IEF1dG9TY2FsaW5nU2NoZWR1bGVkQWN0aW9uOiB7IElnbm9yZVVubW9kaWZpZWRHcm91cFNpemVQcm9wZXJ0aWVzOiB0cnVlIH0gfSxcbiAgICB9KTtcbiAgfSk7XG5cbiAgdGVzdCgnYWRkaW5nIGNhcGFjaXR5IGNyZWF0ZXMgYW4gQVNHIHdpdGggdGFncycsICgpID0+IHtcbiAgICAvLyBHSVZFTlxuICAgIGNvbnN0IHsgc3RhY2ssIHZwYyB9ID0gdGVzdEZpeHR1cmUoKTtcbiAgICBjb25zdCBjbHVzdGVyID0gbmV3IGVrcy5DbHVzdGVyKHN0YWNrLCAnQ2x1c3RlcicsIHtcbiAgICAgIHZwYyxcbiAgICAgIC4uLmNvbW1vblByb3BzLFxuICAgICAgcHJ1bmU6IGZhbHNlLFxuICAgIH0pO1xuXG4gICAgLy8gV0hFTlxuICAgIGNsdXN0ZXIuYWRkQXV0b1NjYWxpbmdHcm91cENhcGFjaXR5KCdEZWZhdWx0Jywge1xuICAgICAgaW5zdGFuY2VUeXBlOiBuZXcgZWMyLkluc3RhbmNlVHlwZSgndDIubWVkaXVtJyksXG4gICAgfSk7XG5cbiAgICAvLyBUSEVOXG4gICAgVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6QXV0b1NjYWxpbmc6OkF1dG9TY2FsaW5nR3JvdXAnLCB7XG4gICAgICBUYWdzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBLZXk6IHsgJ0ZuOjpKb2luJzogWycnLCBbJ2t1YmVybmV0ZXMuaW8vY2x1c3Rlci8nLCB7IFJlZjogJ0NsdXN0ZXJFQjAzODZBNycgfV1dIH0sXG4gICAgICAgICAgUHJvcGFnYXRlQXRMYXVuY2g6IHRydWUsXG4gICAgICAgICAgVmFsdWU6ICdvd25lZCcsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBLZXk6ICdOYW1lJyxcbiAgICAgICAgICBQcm9wYWdhdGVBdExhdW5jaDogdHJ1ZSxcbiAgICAgICAgICBWYWx1ZTogJ1N0YWNrL0NsdXN0ZXIvRGVmYXVsdCcsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuICB9KTtcblxuICB0ZXN0KCdjcmVhdGUgbm9kZWdyb3VwIHdpdGggZXhpc3Rpbmcgcm9sZScsICgpID0+IHtcbiAgICAvLyBHSVZFTlxuICAgIGNvbnN0IHsgc3RhY2sgfSA9IHRlc3RGaXh0dXJlTm9WcGMoKTtcblxuICAgIC8vIFdIRU5cbiAgICBjb25zdCBjbHVzdGVyID0gbmV3IGVrcy5DbHVzdGVyKHN0YWNrLCAnY2x1c3RlcicsIHtcbiAgICAgIGRlZmF1bHRDYXBhY2l0eVR5cGU6IGVrcy5EZWZhdWx0Q2FwYWNpdHlUeXBlLk5PREVHUk9VUCxcbiAgICAgIGRlZmF1bHRDYXBhY2l0eTogMTAsXG4gICAgICBkZWZhdWx0Q2FwYWNpdHlJbnN0YW5jZTogbmV3IGVjMi5JbnN0YW5jZVR5cGUoJ20yLnhsYXJnZScpLFxuICAgICAgdmVyc2lvbjogQ0xVU1RFUl9WRVJTSU9OLFxuICAgICAgcHJ1bmU6IGZhbHNlLFxuICAgIH0pO1xuXG4gICAgY29uc3QgZXhpc3RpbmdSb2xlID0gbmV3IGlhbS5Sb2xlKHN0YWNrLCAnRXhpc3RpbmdSb2xlJywge1xuICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLkFjY291bnRSb290UHJpbmNpcGFsKCksXG4gICAgfSk7XG5cbiAgICBuZXcgZWtzLk5vZGVncm91cChzdGFjaywgJ05vZGVncm91cCcsIHtcbiAgICAgIGNsdXN0ZXIsXG4gICAgICBub2RlUm9sZTogZXhpc3RpbmdSb2xlLFxuICAgIH0pO1xuXG4gICAgLy8gVEhFTlxuICAgIGV4cGVjdChjbHVzdGVyLmRlZmF1bHROb2RlZ3JvdXApLnRvQmVEZWZpbmVkKCk7XG4gICAgVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6RUtTOjpOb2RlZ3JvdXAnLCB7XG4gICAgICBTY2FsaW5nQ29uZmlnOiB7XG4gICAgICAgIERlc2lyZWRTaXplOiAxMCxcbiAgICAgICAgTWF4U2l6ZTogMTAsXG4gICAgICAgIE1pblNpemU6IDEwLFxuICAgICAgfSxcbiAgICB9KTtcbiAgfSk7XG5cbiAgdGVzdCgnYWRkaW5nIGJvdHRsZXJvY2tldCBjYXBhY2l0eSBjcmVhdGVzIGFuIEFTRyB3aXRoIHRhZ3MnLCAoKSA9PiB7XG4gICAgLy8gR0lWRU5cbiAgICBjb25zdCB7IHN0YWNrLCB2cGMgfSA9IHRlc3RGaXh0dXJlKCk7XG4gICAgY29uc3QgY2x1c3RlciA9IG5ldyBla3MuQ2x1c3RlcihzdGFjaywgJ0NsdXN0ZXInLCB7XG4gICAgICB2cGMsXG4gICAgICAuLi5jb21tb25Qcm9wcyxcbiAgICAgIHBydW5lOiBmYWxzZSxcbiAgICB9KTtcblxuICAgIC8vIFdIRU5cbiAgICBjbHVzdGVyLmFkZEF1dG9TY2FsaW5nR3JvdXBDYXBhY2l0eSgnQm90dGxlcm9ja2V0Jywge1xuICAgICAgaW5zdGFuY2VUeXBlOiBuZXcgZWMyLkluc3RhbmNlVHlwZSgndDIubWVkaXVtJyksXG4gICAgICBtYWNoaW5lSW1hZ2VUeXBlOiBla3MuTWFjaGluZUltYWdlVHlwZS5CT1RUTEVST0NLRVQsXG4gICAgfSk7XG5cbiAgICAvLyBUSEVOXG4gICAgVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6QXV0b1NjYWxpbmc6OkF1dG9TY2FsaW5nR3JvdXAnLCB7XG4gICAgICBUYWdzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBLZXk6IHsgJ0ZuOjpKb2luJzogWycnLCBbJ2t1YmVybmV0ZXMuaW8vY2x1c3Rlci8nLCB7IFJlZjogJ0NsdXN0ZXJFQjAzODZBNycgfV1dIH0sXG4gICAgICAgICAgUHJvcGFnYXRlQXRMYXVuY2g6IHRydWUsXG4gICAgICAgICAgVmFsdWU6ICdvd25lZCcsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBLZXk6ICdOYW1lJyxcbiAgICAgICAgICBQcm9wYWdhdGVBdExhdW5jaDogdHJ1ZSxcbiAgICAgICAgICBWYWx1ZTogJ1N0YWNrL0NsdXN0ZXIvQm90dGxlcm9ja2V0JyxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG4gIH0pO1xuXG4gIHRlc3QoJ2FkZGluZyBib3R0bGVyb2NrZXQgY2FwYWNpdHkgd2l0aCBib290c3RyYXBPcHRpb25zIHRocm93cyBlcnJvcicsICgpID0+IHtcbiAgICAvLyBHSVZFTlxuICAgIGNvbnN0IHsgc3RhY2ssIHZwYyB9ID0gdGVzdEZpeHR1cmUoKTtcbiAgICBjb25zdCBjbHVzdGVyID0gbmV3IGVrcy5DbHVzdGVyKHN0YWNrLCAnQ2x1c3RlcicsIHtcbiAgICAgIHZwYyxcbiAgICAgIC4uLmNvbW1vblByb3BzLFxuICAgICAgcHJ1bmU6IGZhbHNlLFxuICAgIH0pO1xuXG4gICAgZXhwZWN0KCgpID0+IGNsdXN0ZXIuYWRkQXV0b1NjYWxpbmdHcm91cENhcGFjaXR5KCdCb3R0bGVyb2NrZXQnLCB7XG4gICAgICBpbnN0YW5jZVR5cGU6IG5ldyBlYzIuSW5zdGFuY2VUeXBlKCd0Mi5tZWRpdW0nKSxcbiAgICAgIG1hY2hpbmVJbWFnZVR5cGU6IGVrcy5NYWNoaW5lSW1hZ2VUeXBlLkJPVFRMRVJPQ0tFVCxcbiAgICAgIGJvb3RzdHJhcE9wdGlvbnM6IHt9LFxuICAgIH0pKS50b1Rocm93KC9ib290c3RyYXBPcHRpb25zIGlzIG5vdCBzdXBwb3J0ZWQgZm9yIEJvdHRsZXJvY2tldC8pO1xuICB9KTtcblxuICB0ZXN0KCdpbXBvcnQgY2x1c3RlciB3aXRoIGV4aXN0aW5nIGt1YmVjdGwgcHJvdmlkZXIgZnVuY3Rpb24nLCAoKSA9PiB7XG4gICAgY29uc3QgeyBzdGFjayB9ID0gdGVzdEZpeHR1cmUoKTtcblxuICAgIGNvbnN0IGhhbmRsZXJSb2xlID0gaWFtLlJvbGUuZnJvbVJvbGVBcm4oc3RhY2ssICdIYW5kbGVyUm9sZScsICdhcm46YXdzOmlhbTo6MTIzNDU2Nzg5MDEyOnJvbGUvbGFtYmRhLXJvbGUnKTtcblxuICAgIGNvbnN0IGt1YmVjdGxQcm92aWRlciA9IEt1YmVjdGxQcm92aWRlci5mcm9tS3ViZWN0bFByb3ZpZGVyQXR0cmlidXRlcyhzdGFjaywgJ0t1YmVjdGxQcm92aWRlcicsIHtcbiAgICAgIHNlcnZpY2VUb2tlbjogJ2Fybjphd3M6bGFtYmRhOnVzLWVhc3QtMjoxMjM0NTY3ODkwMTI6ZnVuY3Rpb246bXktZnVuY3Rpb246MScsXG4gICAgICByb2xlOiBoYW5kbGVyUm9sZSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGNsdXN0ZXIgPSBla3MuQ2x1c3Rlci5mcm9tQ2x1c3RlckF0dHJpYnV0ZXMoc3RhY2ssICdDbHVzdGVyJywge1xuICAgICAgY2x1c3Rlck5hbWU6ICdjbHVzdGVyJyxcbiAgICAgIGt1YmVjdGxQcm92aWRlcjoga3ViZWN0bFByb3ZpZGVyLFxuICAgIH0pO1xuXG4gICAgZXhwZWN0KGNsdXN0ZXIua3ViZWN0bFByb3ZpZGVyKS50b0VxdWFsKGt1YmVjdGxQcm92aWRlcik7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdpbXBvcnQgY2x1c3RlciB3aXRoIGV4aXN0aW5nIGt1YmVjdGwgcHJvdmlkZXIgZnVuY3Rpb24gc2hvdWxkIHdvcmsgYXMgZXhwZWN0ZWQgd2l0aCByZXNvdXJjZXMgcmVseWluZyBvbiBrdWJlY3RsIGdldE9yQ3JlYXRlJywgKCkgPT4ge1xuICAgIHRlc3QoJ2NyZWF0ZXMgaGVsbSBjaGFydCcsICgpID0+IHtcbiAgICAgIGNvbnN0IHsgc3RhY2sgfSA9IHRlc3RGaXh0dXJlKCk7XG5cbiAgICAgIGNvbnN0IGhhbmRsZXJSb2xlID0gaWFtLlJvbGUuZnJvbVJvbGVBcm4oc3RhY2ssICdIYW5kbGVyUm9sZScsICdhcm46YXdzOmlhbTo6MTIzNDU2Nzg5MDEyOnJvbGUvbGFtYmRhLXJvbGUnKTtcbiAgICAgIGNvbnN0IGt1YmVjdGxQcm92aWRlciA9IEt1YmVjdGxQcm92aWRlci5mcm9tS3ViZWN0bFByb3ZpZGVyQXR0cmlidXRlcyhzdGFjaywgJ0t1YmVjdGxQcm92aWRlcicsIHtcbiAgICAgICAgc2VydmljZVRva2VuOiAnYXJuOmF3czpsYW1iZGE6dXMtZWFzdC0yOjEyMzQ1Njc4OTAxMjpmdW5jdGlvbjpteS1mdW5jdGlvbjoxJyxcbiAgICAgICAgcm9sZTogaGFuZGxlclJvbGUsXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgY2x1c3RlciA9IGVrcy5DbHVzdGVyLmZyb21DbHVzdGVyQXR0cmlidXRlcyhzdGFjaywgJ0NsdXN0ZXInLCB7XG4gICAgICAgIGNsdXN0ZXJOYW1lOiAnY2x1c3RlcicsXG4gICAgICAgIGt1YmVjdGxQcm92aWRlcjoga3ViZWN0bFByb3ZpZGVyLFxuICAgICAgfSk7XG5cbiAgICAgIG5ldyBla3MuSGVsbUNoYXJ0KHN0YWNrLCAnQ2hhcnQnLCB7XG4gICAgICAgIGNsdXN0ZXI6IGNsdXN0ZXIsXG4gICAgICAgIGNoYXJ0OiAnY2hhcnQnLFxuICAgICAgfSk7XG5cbiAgICAgIFRlbXBsYXRlLmZyb21TdGFjayhzdGFjaykuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdDdXN0b206OkFXU0NESy1FS1MtSGVsbUNoYXJ0Jywge1xuICAgICAgICBTZXJ2aWNlVG9rZW46IGt1YmVjdGxQcm92aWRlci5zZXJ2aWNlVG9rZW4sXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ2NyZWF0ZXMgS3ViZXJuZXRlcyBwYXRjaCcsICgpID0+IHtcbiAgICAgIGNvbnN0IHsgc3RhY2sgfSA9IHRlc3RGaXh0dXJlKCk7XG5cbiAgICAgIGNvbnN0IGhhbmRsZXJSb2xlID0gaWFtLlJvbGUuZnJvbVJvbGVBcm4oc3RhY2ssICdIYW5kbGVyUm9sZScsICdhcm46YXdzOmlhbTo6MTIzNDU2Nzg5MDEyOnJvbGUvbGFtYmRhLXJvbGUnKTtcbiAgICAgIGNvbnN0IGt1YmVjdGxQcm92aWRlciA9IEt1YmVjdGxQcm92aWRlci5mcm9tS3ViZWN0bFByb3ZpZGVyQXR0cmlidXRlcyhzdGFjaywgJ0t1YmVjdGxQcm92aWRlcicsIHtcbiAgICAgICAgc2VydmljZVRva2VuOiAnYXJuOmF3czpsYW1iZGE6dXMtZWFzdC0yOjEyMzQ1Njc4OTAxMjpmdW5jdGlvbjpteS1mdW5jdGlvbjoxJyxcbiAgICAgICAgcm9sZTogaGFuZGxlclJvbGUsXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgY2x1c3RlciA9IGVrcy5DbHVzdGVyLmZyb21DbHVzdGVyQXR0cmlidXRlcyhzdGFjaywgJ0NsdXN0ZXInLCB7XG4gICAgICAgIGNsdXN0ZXJOYW1lOiAnY2x1c3RlcicsXG4gICAgICAgIGt1YmVjdGxQcm92aWRlcjoga3ViZWN0bFByb3ZpZGVyLFxuICAgICAgfSk7XG5cbiAgICAgIG5ldyBla3MuSGVsbUNoYXJ0KHN0YWNrLCAnQ2hhcnQnLCB7XG4gICAgICAgIGNsdXN0ZXI6IGNsdXN0ZXIsXG4gICAgICAgIGNoYXJ0OiAnY2hhcnQnLFxuICAgICAgfSk7XG5cbiAgICAgIG5ldyBla3MuS3ViZXJuZXRlc1BhdGNoKHN0YWNrLCAnUGF0Y2gnLCB7XG4gICAgICAgIGNsdXN0ZXI6IGNsdXN0ZXIsXG4gICAgICAgIGFwcGx5UGF0Y2g6IHt9LFxuICAgICAgICByZXN0b3JlUGF0Y2g6IHt9LFxuICAgICAgICByZXNvdXJjZU5hbWU6ICdQYXRjaFJlc291cmNlJyxcbiAgICAgIH0pO1xuXG4gICAgICBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spLmhhc1Jlc291cmNlUHJvcGVydGllcygnQ3VzdG9tOjpBV1NDREstRUtTLUt1YmVybmV0ZXNQYXRjaCcsIHtcbiAgICAgICAgU2VydmljZVRva2VuOiBrdWJlY3RsUHJvdmlkZXIuc2VydmljZVRva2VuLFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdjcmVhdGVzIEt1YmVybmV0ZXMgb2JqZWN0IHZhbHVlJywgKCkgPT4ge1xuICAgICAgY29uc3QgeyBzdGFjayB9ID0gdGVzdEZpeHR1cmUoKTtcblxuICAgICAgY29uc3QgaGFuZGxlclJvbGUgPSBpYW0uUm9sZS5mcm9tUm9sZUFybihzdGFjaywgJ0hhbmRsZXJSb2xlJywgJ2Fybjphd3M6aWFtOjoxMjM0NTY3ODkwMTI6cm9sZS9sYW1iZGEtcm9sZScpO1xuICAgICAgY29uc3Qga3ViZWN0bFByb3ZpZGVyID0gS3ViZWN0bFByb3ZpZGVyLmZyb21LdWJlY3RsUHJvdmlkZXJBdHRyaWJ1dGVzKHN0YWNrLCAnS3ViZWN0bFByb3ZpZGVyJywge1xuICAgICAgICBzZXJ2aWNlVG9rZW46ICdhcm46YXdzOmxhbWJkYTp1cy1lYXN0LTI6MTIzNDU2Nzg5MDEyOmZ1bmN0aW9uOm15LWZ1bmN0aW9uOjEnLFxuICAgICAgICByb2xlOiBoYW5kbGVyUm9sZSxcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBjbHVzdGVyID0gZWtzLkNsdXN0ZXIuZnJvbUNsdXN0ZXJBdHRyaWJ1dGVzKHN0YWNrLCAnQ2x1c3RlcicsIHtcbiAgICAgICAgY2x1c3Rlck5hbWU6ICdjbHVzdGVyJyxcbiAgICAgICAga3ViZWN0bFByb3ZpZGVyOiBrdWJlY3RsUHJvdmlkZXIsXG4gICAgICB9KTtcblxuICAgICAgbmV3IGVrcy5IZWxtQ2hhcnQoc3RhY2ssICdDaGFydCcsIHtcbiAgICAgICAgY2x1c3RlcjogY2x1c3RlcixcbiAgICAgICAgY2hhcnQ6ICdjaGFydCcsXG4gICAgICB9KTtcblxuICAgICAgbmV3IGVrcy5LdWJlcm5ldGVzUGF0Y2goc3RhY2ssICdQYXRjaCcsIHtcbiAgICAgICAgY2x1c3RlcjogY2x1c3RlcixcbiAgICAgICAgYXBwbHlQYXRjaDoge30sXG4gICAgICAgIHJlc3RvcmVQYXRjaDoge30sXG4gICAgICAgIHJlc291cmNlTmFtZTogJ1BhdGNoUmVzb3VyY2UnLFxuICAgICAgfSk7XG5cbiAgICAgIG5ldyBla3MuS3ViZXJuZXRlc01hbmlmZXN0KHN0YWNrLCAnTWFuaWZlc3QnLCB7XG4gICAgICAgIGNsdXN0ZXI6IGNsdXN0ZXIsXG4gICAgICAgIG1hbmlmZXN0OiBbXSxcbiAgICAgIH0pO1xuXG4gICAgICBuZXcgZWtzLkt1YmVybmV0ZXNPYmplY3RWYWx1ZShzdGFjaywgJ09iamVjdFZhbHVlJywge1xuICAgICAgICBjbHVzdGVyOiBjbHVzdGVyLFxuICAgICAgICBqc29uUGF0aDogJycsXG4gICAgICAgIG9iamVjdE5hbWU6ICduYW1lJyxcbiAgICAgICAgb2JqZWN0VHlwZTogJ3R5cGUnLFxuICAgICAgfSk7XG5cbiAgICAgIFRlbXBsYXRlLmZyb21TdGFjayhzdGFjaykuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdDdXN0b206OkFXU0NESy1FS1MtS3ViZXJuZXRlc09iamVjdFZhbHVlJywge1xuICAgICAgICBTZXJ2aWNlVG9rZW46IGt1YmVjdGxQcm92aWRlci5zZXJ2aWNlVG9rZW4sXG4gICAgICB9KTtcblxuICAgICAgZXhwZWN0KGNsdXN0ZXIua3ViZWN0bFByb3ZpZGVyKS5ub3QudG9CZUluc3RhbmNlT2YoZWtzLkt1YmVjdGxQcm92aWRlcik7XG4gICAgfSk7XG4gIH0pO1xuXG4gIHRlc3QoJ2V4ZXJjaXNlIGV4cG9ydC9pbXBvcnQnLCAoKSA9PiB7XG4gICAgLy8gR0lWRU5cbiAgICBjb25zdCB7IHN0YWNrOiBzdGFjazEsIHZwYywgYXBwIH0gPSB0ZXN0Rml4dHVyZSgpO1xuICAgIGNvbnN0IHN0YWNrMiA9IG5ldyBjZGsuU3RhY2soYXBwLCAnc3RhY2syJywgeyBlbnY6IHsgcmVnaW9uOiAndXMtZWFzdC0xJyB9IH0pO1xuICAgIGNvbnN0IGNsdXN0ZXIgPSBuZXcgZWtzLkNsdXN0ZXIoc3RhY2sxLCAnQ2x1c3RlcicsIHtcbiAgICAgIHZwYyxcbiAgICAgIC4uLmNvbW1vblByb3BzLFxuICAgICAgcHJ1bmU6IGZhbHNlLFxuICAgIH0pO1xuXG4gICAgLy8gV0hFTlxuICAgIGNvbnN0IGltcG9ydGVkID0gZWtzLkNsdXN0ZXIuZnJvbUNsdXN0ZXJBdHRyaWJ1dGVzKHN0YWNrMiwgJ0ltcG9ydGVkJywge1xuICAgICAgdnBjOiBjbHVzdGVyLnZwYyxcbiAgICAgIGNsdXN0ZXJFbmRwb2ludDogY2x1c3Rlci5jbHVzdGVyRW5kcG9pbnQsXG4gICAgICBjbHVzdGVyTmFtZTogY2x1c3Rlci5jbHVzdGVyTmFtZSxcbiAgICAgIHNlY3VyaXR5R3JvdXBJZHM6IGNsdXN0ZXIuY29ubmVjdGlvbnMuc2VjdXJpdHlHcm91cHMubWFwKHggPT4geC5zZWN1cml0eUdyb3VwSWQpLFxuICAgICAgY2x1c3RlckNlcnRpZmljYXRlQXV0aG9yaXR5RGF0YTogY2x1c3Rlci5jbHVzdGVyQ2VydGlmaWNhdGVBdXRob3JpdHlEYXRhLFxuICAgICAgY2x1c3RlclNlY3VyaXR5R3JvdXBJZDogY2x1c3Rlci5jbHVzdGVyU2VjdXJpdHlHcm91cElkLFxuICAgICAgY2x1c3RlckVuY3J5cHRpb25Db25maWdLZXlBcm46IGNsdXN0ZXIuY2x1c3RlckVuY3J5cHRpb25Db25maWdLZXlBcm4sXG4gICAgfSk7XG5cbiAgICAvLyB0aGlzIHNob3VsZCBjYXVzZSBhbiBleHBvcnQvaW1wb3J0XG4gICAgbmV3IGNkay5DZm5PdXRwdXQoc3RhY2syLCAnQ2x1c3RlckFSTicsIHsgdmFsdWU6IGltcG9ydGVkLmNsdXN0ZXJBcm4gfSk7XG5cbiAgICAvLyBUSEVOXG4gICAgVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrMikudGVtcGxhdGVNYXRjaGVzKHtcbiAgICAgIE91dHB1dHM6IHtcbiAgICAgICAgQ2x1c3RlckFSTjoge1xuICAgICAgICAgIFZhbHVlOiB7XG4gICAgICAgICAgICAnRm46OkpvaW4nOiBbXG4gICAgICAgICAgICAgICcnLFxuICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgJ2FybjonLFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIFJlZjogJ0FXUzo6UGFydGl0aW9uJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICc6ZWtzOnVzLWVhc3QtMTonLFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIFJlZjogJ0FXUzo6QWNjb3VudElkJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICc6Y2x1c3Rlci8nLFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICdGbjo6SW1wb3J0VmFsdWUnOiAnU3RhY2s6RXhwb3J0c091dHB1dFJlZkNsdXN0ZXJFQjAzODZBNzk2QTBFM0ZFJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9KTtcbiAgfSk7XG5cbiAgdGVzdCgnYWRkTWFuaWZlc3QgY2FuIGJlIHVzZWQgdG8gYXBwbHkgazhzIG1hbmlmZXN0cyBvbiB0aGlzIGNsdXN0ZXInLCAoKSA9PiB7XG4gICAgLy8gR0lWRU5cbiAgICBjb25zdCB7IHN0YWNrLCB2cGMgfSA9IHRlc3RGaXh0dXJlKCk7XG4gICAgY29uc3QgY2x1c3RlciA9IG5ldyBla3MuQ2x1c3RlcihzdGFjaywgJ0NsdXN0ZXInLCB7XG4gICAgICB2cGMsXG4gICAgICAuLi5jb21tb25Qcm9wcyxcbiAgICAgIHBydW5lOiBmYWxzZSxcbiAgICAgIGt1YmVjdGxQcm92aWRlck9wdGlvbnM6IHtcbiAgICAgICAga3ViZWN0bExheWVyOiBuZXcgS3ViZWN0bFYzM0xheWVyKHN0YWNrLCAna3ViZWN0bExheWVyJyksXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gV0hFTlxuICAgIGNsdXN0ZXIuYWRkTWFuaWZlc3QoJ21hbmlmZXN0MScsIHsgZm9vOiAxMjMgfSk7XG4gICAgY2x1c3Rlci5hZGRNYW5pZmVzdCgnbWFuaWZlc3QyJywgeyBiYXI6IDEyMyB9LCB7IGJvb3I6IFsxLCAyLCAzXSB9KTtcblxuICAgIC8vIFRIRU5cbiAgICBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spLmhhc1Jlc291cmNlUHJvcGVydGllcyhla3MuS3ViZXJuZXRlc01hbmlmZXN0LlJFU09VUkNFX1RZUEUsIHtcbiAgICAgIE1hbmlmZXN0OiAnW3tcImZvb1wiOjEyM31dJyxcbiAgICB9KTtcblxuICAgIFRlbXBsYXRlLmZyb21TdGFjayhzdGFjaykuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKGVrcy5LdWJlcm5ldGVzTWFuaWZlc3QuUkVTT1VSQ0VfVFlQRSwge1xuICAgICAgTWFuaWZlc3Q6ICdbe1wiYmFyXCI6MTIzfSx7XCJib29yXCI6WzEsMiwzXX1dJyxcbiAgICB9KTtcbiAgfSk7XG5cbiAgdGVzdCgna3ViZWN0bCByZXNvdXJjZXMgY2FuIGJlIGNyZWF0ZWQgaW4gYSBzZXBhcmF0ZSBzdGFjaycsICgpID0+IHtcbiAgICAvLyBHSVZFTlxuICAgIGNvbnN0IHsgc3RhY2ssIGFwcCB9ID0gdGVzdEZpeHR1cmUoKTtcbiAgICBjb25zdCBjbHVzdGVyID0gbmV3IGVrcy5DbHVzdGVyKHN0YWNrLCAnY2x1c3RlcicsIHtcbiAgICAgIHZlcnNpb246IENMVVNURVJfVkVSU0lPTixcbiAgICAgIHBydW5lOiBmYWxzZSxcbiAgICAgIGt1YmVjdGxQcm92aWRlck9wdGlvbnM6IHtcbiAgICAgICAga3ViZWN0bExheWVyOiBuZXcgS3ViZWN0bFYzM0xheWVyKHN0YWNrLCAna3ViZWN0bExheWVyJyksXG4gICAgICB9LFxuICAgIH0pOyAvLyBjbHVzdGVyIGlzIHVuZGVyIHN0YWNrMlxuXG4gICAgLy8gV0hFTiByZXNvdXJjZSBpcyB1bmRlciBzdGFjazJcbiAgICBjb25zdCBzdGFjazIgPSBuZXcgY2RrLlN0YWNrKGFwcCwgJ3N0YWNrMicsIHsgZW52OiB7IGFjY291bnQ6IHN0YWNrLmFjY291bnQsIHJlZ2lvbjogc3RhY2sucmVnaW9uIH0gfSk7XG4gICAgbmV3IGVrcy5LdWJlcm5ldGVzTWFuaWZlc3Qoc3RhY2syLCAnbXlyZXNvdXJjZScsIHtcbiAgICAgIGNsdXN0ZXIsXG4gICAgICBtYW5pZmVzdDogW3sgZm9vOiAnYmFyJyB9XSxcbiAgICB9KTtcblxuICAgIC8vIFRIRU5cbiAgICBhcHAuc3ludGgoKTsgLy8gbm8gY3ljbGljIGRlcGVuZGVuY3kgKHNlZSBodHRwczovL2dpdGh1Yi5jb20vYXdzL2F3cy1jZGsvaXNzdWVzLzcyMzEpXG5cbiAgICAvLyBleHBlY3QgYSBzaW5nbGUgcmVzb3VyY2UgaW4gdGhlIDJuZCBzdGFja1xuICAgIFRlbXBsYXRlLmZyb21TdGFjayhzdGFjazIpLnRlbXBsYXRlTWF0Y2hlcyh7XG4gICAgICBSZXNvdXJjZXM6IHtcbiAgICAgICAgbXlyZXNvdXJjZTQ5QzZEMzI1OiB7XG4gICAgICAgICAgVHlwZTogJ0N1c3RvbTo6QVdTQ0RLLUVLUy1LdWJlcm5ldGVzUmVzb3VyY2UnLFxuICAgICAgICAgIFByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgIFNlcnZpY2VUb2tlbjoge1xuICAgICAgICAgICAgICAnRm46OkltcG9ydFZhbHVlJzogJ1N0YWNrOkV4cG9ydHNPdXRwdXRGbkdldEF0dGNsdXN0ZXJLdWJlY3RsUHJvdmlkZXJmcmFtZXdvcmtvbkV2ZW50N0U4NDcwRjFBcm42MDg2QUFBNCcsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgTWFuaWZlc3Q6ICdbe1xcXCJmb29cXFwiOlxcXCJiYXJcXFwifV0nLFxuICAgICAgICAgICAgQ2x1c3Rlck5hbWU6IHsgJ0ZuOjpJbXBvcnRWYWx1ZSc6ICdTdGFjazpFeHBvcnRzT3V0cHV0UmVmY2x1c3RlcjYxMUY4QUZGQTA3RkMwNzknIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBVcGRhdGVSZXBsYWNlUG9saWN5OiAnRGVsZXRlJyxcbiAgICAgICAgICBEZWxldGlvblBvbGljeTogJ0RlbGV0ZScsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnb3V0cHV0cycsICgpID0+IHtcbiAgICB0ZXN0KCdubyBvdXRwdXRzIGFyZSBzeW50aGVzaXplZCBieSBkZWZhdWx0JywgKCkgPT4ge1xuICAgICAgLy8gR0lWRU5cbiAgICAgIGNvbnN0IHsgYXBwLCBzdGFjayB9ID0gdGVzdEZpeHR1cmVOb1ZwYygpO1xuXG4gICAgICAvLyBXSEVOXG4gICAgICBuZXcgZWtzLkNsdXN0ZXIoc3RhY2ssICdDbHVzdGVyJywgeyB2ZXJzaW9uOiBDTFVTVEVSX1ZFUlNJT04sIHBydW5lOiBmYWxzZSB9KTtcblxuICAgICAgLy8gVEhFTlxuICAgICAgY29uc3QgYXNzZW1ibHkgPSBhcHAuc3ludGgoKTtcbiAgICAgIGNvbnN0IHRlbXBsYXRlID0gYXNzZW1ibHkuZ2V0U3RhY2tCeU5hbWUoc3RhY2suc3RhY2tOYW1lKS50ZW1wbGF0ZTtcbiAgICAgIGV4cGVjdCh0ZW1wbGF0ZS5PdXRwdXRzKS50b0JlVW5kZWZpbmVkKCk7IC8vIG5vIG91dHB1dHNcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdib29zdHJhcCB1c2VyLWRhdGEnLCAoKSA9PiB7XG4gICAgICB0ZXN0KCdyZW5kZXJlZCBieSBkZWZhdWx0IGZvciBBU0dzJywgKCkgPT4ge1xuICAgICAgICAvLyBHSVZFTlxuICAgICAgICBjb25zdCB7IGFwcCwgc3RhY2sgfSA9IHRlc3RGaXh0dXJlTm9WcGMoKTtcbiAgICAgICAgY29uc3QgY2x1c3RlciA9IG5ldyBla3MuQ2x1c3RlcihzdGFjaywgJ0NsdXN0ZXInLCB7XG4gICAgICAgICAgLi4uY29tbW9uUHJvcHMsXG4gICAgICAgICAgcHJ1bmU6IGZhbHNlLFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBXSEVOXG4gICAgICAgIGNsdXN0ZXIuYWRkQXV0b1NjYWxpbmdHcm91cENhcGFjaXR5KCdNeUNhcGNpdHknLCB7IGluc3RhbmNlVHlwZTogbmV3IGVjMi5JbnN0YW5jZVR5cGUoJ20zLnhsYXJncycpIH0pO1xuXG4gICAgICAgIC8vIFRIRU5cbiAgICAgICAgY29uc3QgdGVtcGxhdGUgPSBhcHAuc3ludGgoKS5nZXRTdGFja0J5TmFtZShzdGFjay5zdGFja05hbWUpLnRlbXBsYXRlO1xuICAgICAgICBjb25zdCB1c2VyRGF0YSA9IHRlbXBsYXRlLlJlc291cmNlcy5DbHVzdGVyTXlDYXBjaXR5TGF1bmNoQ29uZmlnNTg1ODMzNDUuUHJvcGVydGllcy5Vc2VyRGF0YTtcbiAgICAgICAgZXhwZWN0KHVzZXJEYXRhKS50b0VxdWFsKHsgJ0ZuOjpCYXNlNjQnOiB7ICdGbjo6Sm9pbic6IFsnJywgWycjIS9iaW4vYmFzaFxcbnNldCAtbyB4dHJhY2VcXG4vZXRjL2Vrcy9ib290c3RyYXAuc2ggJywgeyBSZWY6ICdDbHVzdGVyRUIwMzg2QTcnIH0sICcgLS1rdWJlbGV0LWV4dHJhLWFyZ3MgXCItLW5vZGUtbGFiZWxzIGxpZmVjeWNsZT1PbkRlbWFuZFwiIC0tYXBpc2VydmVyLWVuZHBvaW50IFxcJycsIHsgJ0ZuOjpHZXRBdHQnOiBbJ0NsdXN0ZXJFQjAzODZBNycsICdFbmRwb2ludCddIH0sICdcXCcgLS1iNjQtY2x1c3Rlci1jYSBcXCcnLCB7ICdGbjo6R2V0QXR0JzogWydDbHVzdGVyRUIwMzg2QTcnLCAnQ2VydGlmaWNhdGVBdXRob3JpdHlEYXRhJ10gfSwgJ1xcJyAtLXVzZS1tYXgtcG9kcyB0cnVlXFxuL29wdC9hd3MvYmluL2Nmbi1zaWduYWwgLS1leGl0LWNvZGUgJD8gLS1zdGFjayBTdGFjayAtLXJlc291cmNlIENsdXN0ZXJNeUNhcGNpdHlBU0dENENEOEI5NyAtLXJlZ2lvbiB1cy1lYXN0LTEnXV0gfSB9KTtcbiAgICAgIH0pO1xuXG4gICAgICB0ZXN0KCdub3QgcmVuZGVyZWQgaWYgYm9vdHN0cmFwIGlzIGRpc2FibGVkJywgKCkgPT4ge1xuICAgICAgICAvLyBHSVZFTlxuICAgICAgICBjb25zdCB7IGFwcCwgc3RhY2sgfSA9IHRlc3RGaXh0dXJlTm9WcGMoKTtcbiAgICAgICAgY29uc3QgY2x1c3RlciA9IG5ldyBla3MuQ2x1c3RlcihzdGFjaywgJ0NsdXN0ZXInLCB7XG4gICAgICAgICAgLi4uY29tbW9uUHJvcHMsXG4gICAgICAgICAgcHJ1bmU6IGZhbHNlLFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBXSEVOXG4gICAgICAgIGNsdXN0ZXIuYWRkQXV0b1NjYWxpbmdHcm91cENhcGFjaXR5KCdNeUNhcGNpdHknLCB7XG4gICAgICAgICAgaW5zdGFuY2VUeXBlOiBuZXcgZWMyLkluc3RhbmNlVHlwZSgnbTMueGxhcmdzJyksXG4gICAgICAgICAgYm9vdHN0cmFwRW5hYmxlZDogZmFsc2UsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFRIRU5cbiAgICAgICAgY29uc3QgdGVtcGxhdGUgPSBhcHAuc3ludGgoKS5nZXRTdGFja0J5TmFtZShzdGFjay5zdGFja05hbWUpLnRlbXBsYXRlO1xuICAgICAgICBjb25zdCB1c2VyRGF0YSA9IHRlbXBsYXRlLlJlc291cmNlcy5DbHVzdGVyTXlDYXBjaXR5TGF1bmNoQ29uZmlnNTg1ODMzNDUuUHJvcGVydGllcy5Vc2VyRGF0YTtcbiAgICAgICAgZXhwZWN0KHVzZXJEYXRhKS50b0VxdWFsKHsgJ0ZuOjpCYXNlNjQnOiAnIyEvYmluL2Jhc2gnIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIGN1cnNvcnkgdGVzdCBmb3Igb3B0aW9uczogc2VlIHRlc3QudXNlci1kYXRhLnRzIGZvciBmdWxsIHN1aXRlXG4gICAgICB0ZXN0KCdib290c3RyYXAgb3B0aW9ucycsICgpID0+IHtcbiAgICAgICAgLy8gR0lWRU5cbiAgICAgICAgY29uc3QgeyBhcHAsIHN0YWNrIH0gPSB0ZXN0Rml4dHVyZU5vVnBjKCk7XG4gICAgICAgIGNvbnN0IGNsdXN0ZXIgPSBuZXcgZWtzLkNsdXN0ZXIoc3RhY2ssICdDbHVzdGVyJywge1xuICAgICAgICAgIC4uLmNvbW1vblByb3BzLFxuICAgICAgICAgIHBydW5lOiBmYWxzZSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gV0hFTlxuICAgICAgICBjbHVzdGVyLmFkZEF1dG9TY2FsaW5nR3JvdXBDYXBhY2l0eSgnTXlDYXBjaXR5Jywge1xuICAgICAgICAgIGluc3RhbmNlVHlwZTogbmV3IGVjMi5JbnN0YW5jZVR5cGUoJ20zLnhsYXJncycpLFxuICAgICAgICAgIGJvb3RzdHJhcE9wdGlvbnM6IHtcbiAgICAgICAgICAgIGt1YmVsZXRFeHRyYUFyZ3M6ICctLW5vZGUtbGFiZWxzIEZPTz00MicsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gVEhFTlxuICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IGFwcC5zeW50aCgpLmdldFN0YWNrQnlOYW1lKHN0YWNrLnN0YWNrTmFtZSkudGVtcGxhdGU7XG4gICAgICAgIGNvbnN0IHVzZXJEYXRhID0gdGVtcGxhdGUuUmVzb3VyY2VzLkNsdXN0ZXJNeUNhcGNpdHlMYXVuY2hDb25maWc1ODU4MzM0NS5Qcm9wZXJ0aWVzLlVzZXJEYXRhO1xuICAgICAgICBleHBlY3QodXNlckRhdGEpLnRvRXF1YWwoeyAnRm46OkJhc2U2NCc6IHsgJ0ZuOjpKb2luJzogWycnLCBbJyMhL2Jpbi9iYXNoXFxuc2V0IC1vIHh0cmFjZVxcbi9ldGMvZWtzL2Jvb3RzdHJhcC5zaCAnLCB7IFJlZjogJ0NsdXN0ZXJFQjAzODZBNycgfSwgJyAtLWt1YmVsZXQtZXh0cmEtYXJncyBcIi0tbm9kZS1sYWJlbHMgbGlmZWN5Y2xlPU9uRGVtYW5kICAtLW5vZGUtbGFiZWxzIEZPTz00MlwiIC0tYXBpc2VydmVyLWVuZHBvaW50IFxcJycsIHsgJ0ZuOjpHZXRBdHQnOiBbJ0NsdXN0ZXJFQjAzODZBNycsICdFbmRwb2ludCddIH0sICdcXCcgLS1iNjQtY2x1c3Rlci1jYSBcXCcnLCB7ICdGbjo6R2V0QXR0JzogWydDbHVzdGVyRUIwMzg2QTcnLCAnQ2VydGlmaWNhdGVBdXRob3JpdHlEYXRhJ10gfSwgJ1xcJyAtLXVzZS1tYXgtcG9kcyB0cnVlXFxuL29wdC9hd3MvYmluL2Nmbi1zaWduYWwgLS1leGl0LWNvZGUgJD8gLS1zdGFjayBTdGFjayAtLXJlc291cmNlIENsdXN0ZXJNeUNhcGNpdHlBU0dENENEOEI5NyAtLXJlZ2lvbiB1cy1lYXN0LTEnXV0gfSB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBkZXNjcmliZSgnc3BvdCBpbnN0YW5jZXMnLCAoKSA9PiB7XG4gICAgICAgIHRlc3QoJ25vZGVzIGxhYmVsZWQgYW4gdGFpbnRlZCBhY2NvcmRpbmdseScsICgpID0+IHtcbiAgICAgICAgICAvLyBHSVZFTlxuICAgICAgICAgIGNvbnN0IHsgYXBwLCBzdGFjayB9ID0gdGVzdEZpeHR1cmVOb1ZwYygpO1xuICAgICAgICAgIGNvbnN0IGNsdXN0ZXIgPSBuZXcgZWtzLkNsdXN0ZXIoc3RhY2ssICdDbHVzdGVyJywge1xuICAgICAgICAgICAgLi4uY29tbW9uUHJvcHMsXG4gICAgICAgICAgICBwcnVuZTogZmFsc2UsXG4gICAgICAgICAgICBrdWJlY3RsUHJvdmlkZXJPcHRpb25zOiB7XG4gICAgICAgICAgICAgIGt1YmVjdGxMYXllcjogbmV3IEt1YmVjdGxWMzNMYXllcihzdGFjaywgJ2t1YmVjdGxMYXllcicpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIC8vIFdIRU5cbiAgICAgICAgICBjbHVzdGVyLmFkZEF1dG9TY2FsaW5nR3JvdXBDYXBhY2l0eSgnTXlDYXBjaXR5Jywge1xuICAgICAgICAgICAgaW5zdGFuY2VUeXBlOiBuZXcgZWMyLkluc3RhbmNlVHlwZSgnbTMueGxhcmdzJyksXG4gICAgICAgICAgICBzcG90UHJpY2U6ICcwLjAxJyxcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIC8vIFRIRU5cbiAgICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IGFwcC5zeW50aCgpLmdldFN0YWNrQnlOYW1lKHN0YWNrLnN0YWNrTmFtZSkudGVtcGxhdGU7XG4gICAgICAgICAgY29uc3QgdXNlckRhdGEgPSB0ZW1wbGF0ZS5SZXNvdXJjZXMuQ2x1c3Rlck15Q2FwY2l0eUxhdW5jaENvbmZpZzU4NTgzMzQ1LlByb3BlcnRpZXMuVXNlckRhdGE7XG4gICAgICAgICAgZXhwZWN0KHVzZXJEYXRhKS50b0VxdWFsKHsgJ0ZuOjpCYXNlNjQnOiB7ICdGbjo6Sm9pbic6IFsnJywgWycjIS9iaW4vYmFzaFxcbnNldCAtbyB4dHJhY2VcXG4vZXRjL2Vrcy9ib290c3RyYXAuc2ggJywgeyBSZWY6ICdDbHVzdGVyRUIwMzg2QTcnIH0sICcgLS1rdWJlbGV0LWV4dHJhLWFyZ3MgXCItLW5vZGUtbGFiZWxzIGxpZmVjeWNsZT1FYzJTcG90IC0tcmVnaXN0ZXItd2l0aC10YWludHM9c3BvdEluc3RhbmNlPXRydWU6UHJlZmVyTm9TY2hlZHVsZVwiIC0tYXBpc2VydmVyLWVuZHBvaW50IFxcJycsIHsgJ0ZuOjpHZXRBdHQnOiBbJ0NsdXN0ZXJFQjAzODZBNycsICdFbmRwb2ludCddIH0sICdcXCcgLS1iNjQtY2x1c3Rlci1jYSBcXCcnLCB7ICdGbjo6R2V0QXR0JzogWydDbHVzdGVyRUIwMzg2QTcnLCAnQ2VydGlmaWNhdGVBdXRob3JpdHlEYXRhJ10gfSwgJ1xcJyAtLXVzZS1tYXgtcG9kcyB0cnVlXFxuL29wdC9hd3MvYmluL2Nmbi1zaWduYWwgLS1leGl0LWNvZGUgJD8gLS1zdGFjayBTdGFjayAtLXJlc291cmNlIENsdXN0ZXJNeUNhcGNpdHlBU0dENENEOEI5NyAtLXJlZ2lvbiB1cy1lYXN0LTEnXV0gfSB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ2lmIGJvb3RzdHJhcCBpcyBkaXNhYmxlZCBjYW5ub3Qgc3BlY2lmeSBvcHRpb25zJywgKCkgPT4ge1xuICAgICAgLy8gR0lWRU5cbiAgICAgIGNvbnN0IHsgc3RhY2sgfSA9IHRlc3RGaXh0dXJlTm9WcGMoKTtcbiAgICAgIGNvbnN0IGNsdXN0ZXIgPSBuZXcgZWtzLkNsdXN0ZXIoc3RhY2ssICdDbHVzdGVyJywge1xuICAgICAgICAuLi5jb21tb25Qcm9wcyxcbiAgICAgICAgcHJ1bmU6IGZhbHNlLFxuICAgICAgfSk7XG5cbiAgICAgIC8vIFRIRU5cbiAgICAgIGV4cGVjdCgoKSA9PiBjbHVzdGVyLmFkZEF1dG9TY2FsaW5nR3JvdXBDYXBhY2l0eSgnTXlDYXBjaXR5Jywge1xuICAgICAgICBpbnN0YW5jZVR5cGU6IG5ldyBlYzIuSW5zdGFuY2VUeXBlKCdtMy54bGFyZ3MnKSxcbiAgICAgICAgYm9vdHN0cmFwRW5hYmxlZDogZmFsc2UsXG4gICAgICAgIGJvb3RzdHJhcE9wdGlvbnM6IHsgYXdzQXBpUmV0cnlBdHRlbXB0czogMTAgfSxcbiAgICAgIH0pKS50b1Rocm93KC9DYW5ub3Qgc3BlY2lmeSBcImJvb3RzdHJhcE9wdGlvbnNcIiBpZiBcImJvb3RzdHJhcEVuYWJsZWRcIiBpcyBmYWxzZS8pO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnRWtzT3B0aW1pemVkSW1hZ2UoKSB3aXRoIG5vIG5vZGVUeXBlIGFsd2F5cyB1c2VzIFNUQU5EQVJEIHdpdGggTEFURVNUX0tVQkVSTkVURVNfVkVSU0lPTicsICgpID0+IHtcbiAgICAgIC8vIEdJVkVOXG4gICAgICBjb25zdCB7IGFwcCwgc3RhY2sgfSA9IHRlc3RGaXh0dXJlTm9WcGMoKTtcbiAgICAgIGNvbnN0IExBVEVTVF9LVUJFUk5FVEVTX1ZFUlNJT04gPSAnMS4yNCc7XG5cbiAgICAgIC8vIFdIRU5cbiAgICAgIG5ldyBla3MuRWtzT3B0aW1pemVkSW1hZ2UoKS5nZXRJbWFnZShzdGFjayk7XG5cbiAgICAgIC8vIFRIRU5cbiAgICAgIGNvbnN0IGFzc2VtYmx5ID0gYXBwLnN5bnRoKCk7XG4gICAgICBjb25zdCBwYXJhbWV0ZXJzID0gYXNzZW1ibHkuZ2V0U3RhY2tCeU5hbWUoc3RhY2suc3RhY2tOYW1lKS50ZW1wbGF0ZS5QYXJhbWV0ZXJzO1xuICAgICAgZXhwZWN0KE9iamVjdC5lbnRyaWVzKHBhcmFtZXRlcnMpLnNvbWUoXG4gICAgICAgIChbaywgdl0pID0+IGsuc3RhcnRzV2l0aCgnU3NtUGFyYW1ldGVyVmFsdWVhd3NzZXJ2aWNlZWtzb3B0aW1pemVkYW1pJykgJiZcbiAgICAgICAgICAodiBhcyBhbnkpLkRlZmF1bHQuaW5jbHVkZXMoJy9hbWF6b24tbGludXgtMi8nKSxcbiAgICAgICkpLnRvRXF1YWwodHJ1ZSk7XG4gICAgICBleHBlY3QoT2JqZWN0LmVudHJpZXMocGFyYW1ldGVycykuc29tZShcbiAgICAgICAgKFtrLCB2XSkgPT4gay5zdGFydHNXaXRoKCdTc21QYXJhbWV0ZXJWYWx1ZWF3c3NlcnZpY2Vla3NvcHRpbWl6ZWRhbWknKSAmJlxuICAgICAgICAgICh2IGFzIGFueSkuRGVmYXVsdC5pbmNsdWRlcyhMQVRFU1RfS1VCRVJORVRFU19WRVJTSU9OKSxcbiAgICAgICkpLnRvRXF1YWwodHJ1ZSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdFa3NPcHRpbWl6ZWRJbWFnZSgpIHdpdGggc3BlY2lmaWMga3ViZXJuZXRlc1ZlcnNpb24gcmV0dXJuIGNvcnJlY3QgQU1JJywgKCkgPT4ge1xuICAgICAgLy8gR0lWRU5cbiAgICAgIGNvbnN0IHsgYXBwLCBzdGFjayB9ID0gdGVzdEZpeHR1cmVOb1ZwYygpO1xuXG4gICAgICAvLyBXSEVOXG4gICAgICBuZXcgZWtzLkVrc09wdGltaXplZEltYWdlKHsga3ViZXJuZXRlc1ZlcnNpb246IENMVVNURVJfVkVSU0lPTi52ZXJzaW9uIH0pLmdldEltYWdlKHN0YWNrKTtcblxuICAgICAgLy8gVEhFTlxuICAgICAgY29uc3QgYXNzZW1ibHkgPSBhcHAuc3ludGgoKTtcbiAgICAgIGNvbnN0IHBhcmFtZXRlcnMgPSBhc3NlbWJseS5nZXRTdGFja0J5TmFtZShzdGFjay5zdGFja05hbWUpLnRlbXBsYXRlLlBhcmFtZXRlcnM7XG4gICAgICBleHBlY3QoT2JqZWN0LmVudHJpZXMocGFyYW1ldGVycykuc29tZShcbiAgICAgICAgKFtrLCB2XSkgPT4gay5zdGFydHNXaXRoKCdTc21QYXJhbWV0ZXJWYWx1ZWF3c3NlcnZpY2Vla3NvcHRpbWl6ZWRhbWknKSAmJlxuICAgICAgICAgICh2IGFzIGFueSkuRGVmYXVsdC5pbmNsdWRlcygnL2FtYXpvbi1saW51eC0yLycpLFxuICAgICAgKSkudG9FcXVhbCh0cnVlKTtcbiAgICAgIGV4cGVjdChPYmplY3QuZW50cmllcyhwYXJhbWV0ZXJzKS5zb21lKFxuICAgICAgICAoW2ssIHZdKSA9PiBrLnN0YXJ0c1dpdGgoJ1NzbVBhcmFtZXRlclZhbHVlYXdzc2VydmljZWVrc29wdGltaXplZGFtaScpICYmXG4gICAgICAgICAgKHYgYXMgYW55KS5EZWZhdWx0LmluY2x1ZGVzKCcvMS4zMy8nKSxcbiAgICAgICkpLnRvRXF1YWwodHJ1ZSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdkZWZhdWx0IGNsdXN0ZXIgY2FwYWNpdHkgd2l0aCBBUk02NCBpbnN0YW5jZSB0eXBlIGNvbWVzIHdpdGggbm9kZWdyb3VwIHdpdGggY29ycmVjdCBBbWlUeXBlJywgKCkgPT4ge1xuICAgICAgLy8gR0lWRU5cbiAgICAgIGNvbnN0IHsgc3RhY2sgfSA9IHRlc3RGaXh0dXJlTm9WcGMoKTtcblxuICAgICAgLy8gV0hFTlxuICAgICAgbmV3IGVrcy5DbHVzdGVyKHN0YWNrLCAnY2x1c3RlcicsIHtcbiAgICAgICAgZGVmYXVsdENhcGFjaXR5VHlwZTogZWtzLkRlZmF1bHRDYXBhY2l0eVR5cGUuTk9ERUdST1VQLFxuICAgICAgICBkZWZhdWx0Q2FwYWNpdHk6IDEsXG4gICAgICAgIHZlcnNpb246IENMVVNURVJfVkVSU0lPTixcbiAgICAgICAgcHJ1bmU6IGZhbHNlLFxuICAgICAgICBkZWZhdWx0Q2FwYWNpdHlJbnN0YW5jZTogbmV3IGVjMi5JbnN0YW5jZVR5cGUoJ202Zy5tZWRpdW0nKSxcbiAgICAgIH0pO1xuXG4gICAgICAvLyBUSEVOXG4gICAgICBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpFS1M6Ok5vZGVncm91cCcsIHtcbiAgICAgICAgQW1pVHlwZTogJ0FMMl9BUk1fNjQnLFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdhZGROb2RlZ3JvdXAgd2l0aCBBUk02NCBpbnN0YW5jZSB0eXBlIGNvbWVzIHdpdGggbm9kZWdyb3VwIHdpdGggY29ycmVjdCBBbWlUeXBlJywgKCkgPT4ge1xuICAgICAgLy8gR0lWRU5cbiAgICAgIGNvbnN0IHsgc3RhY2sgfSA9IHRlc3RGaXh0dXJlTm9WcGMoKTtcblxuICAgICAgLy8gV0hFTlxuICAgICAgbmV3IGVrcy5DbHVzdGVyKHN0YWNrLCAnY2x1c3RlcicsIHtcbiAgICAgICAgLi4uY29tbW9uUHJvcHMsXG4gICAgICAgIHBydW5lOiBmYWxzZSxcbiAgICAgICAgZGVmYXVsdENhcGFjaXR5SW5zdGFuY2U6IG5ldyBlYzIuSW5zdGFuY2VUeXBlKCdtNmcubWVkaXVtJyksXG4gICAgICB9KS5hZGROb2RlZ3JvdXBDYXBhY2l0eSgnbmcnLCB7XG4gICAgICAgIGluc3RhbmNlVHlwZXM6IFtuZXcgZWMyLkluc3RhbmNlVHlwZSgnbTZnLm1lZGl1bScpXSxcbiAgICAgIH0pO1xuXG4gICAgICAvLyBUSEVOXG4gICAgICBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpFS1M6Ok5vZGVncm91cCcsIHtcbiAgICAgICAgQW1pVHlwZTogJ0FMMl9BUk1fNjQnLFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdhZGROb2RlZ3JvdXBDYXBhY2l0eSB3aXRoIFQ0ZyBpbnN0YW5jZSB0eXBlIGNvbWVzIHdpdGggbm9kZWdyb3VwIHdpdGggY29ycmVjdCBBbWlUeXBlJywgKCkgPT4ge1xuICAgICAgLy8gR0lWRU5cbiAgICAgIGNvbnN0IHsgc3RhY2sgfSA9IHRlc3RGaXh0dXJlTm9WcGMoKTtcblxuICAgICAgLy8gV0hFTlxuICAgICAgbmV3IGVrcy5DbHVzdGVyKHN0YWNrLCAnY2x1c3RlcicsIHtcbiAgICAgICAgLi4uY29tbW9uUHJvcHMsXG4gICAgICAgIHBydW5lOiBmYWxzZSxcbiAgICAgICAgZGVmYXVsdENhcGFjaXR5SW5zdGFuY2U6IG5ldyBlYzIuSW5zdGFuY2VUeXBlKCd0NGcubWVkaXVtJyksXG4gICAgICB9KS5hZGROb2RlZ3JvdXBDYXBhY2l0eSgnbmcnLCB7XG4gICAgICAgIGluc3RhbmNlVHlwZXM6IFtuZXcgZWMyLkluc3RhbmNlVHlwZSgndDRnLm1lZGl1bScpXSxcbiAgICAgIH0pO1xuXG4gICAgICAvLyBUSEVOXG4gICAgICBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpFS1M6Ok5vZGVncm91cCcsIHtcbiAgICAgICAgQW1pVHlwZTogJ0FMMl9BUk1fNjQnLFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdhZGRBdXRvU2NhbGluZ0dyb3VwQ2FwYWNpdHkgd2l0aCBUNGcgaW5zdGFuY2UgdHlwZSBjb21lcyB3aXRoIG5vZGVncm91cCB3aXRoIGNvcnJlY3QgQW1pVHlwZScsICgpID0+IHtcbiAgICAgIC8vIEdJVkVOXG4gICAgICBjb25zdCB7IGFwcCwgc3RhY2sgfSA9IHRlc3RGaXh0dXJlTm9WcGMoKTtcblxuICAgICAgLy8gV0hFTlxuICAgICAgbmV3IGVrcy5DbHVzdGVyKHN0YWNrLCAnY2x1c3RlcicsIHtcbiAgICAgICAgLi4uY29tbW9uUHJvcHMsXG4gICAgICAgIHBydW5lOiBmYWxzZSxcbiAgICAgIH0pLmFkZEF1dG9TY2FsaW5nR3JvdXBDYXBhY2l0eSgnbmcnLCB7XG4gICAgICAgIGluc3RhbmNlVHlwZTogbmV3IGVjMi5JbnN0YW5jZVR5cGUoJ3Q0Zy5tZWRpdW0nKSxcbiAgICAgIH0pO1xuXG4gICAgICAvLyBUSEVOXG4gICAgICBjb25zdCBhc3NlbWJseSA9IGFwcC5zeW50aCgpO1xuICAgICAgY29uc3QgcGFyYW1ldGVycyA9IGFzc2VtYmx5LmdldFN0YWNrQnlOYW1lKHN0YWNrLnN0YWNrTmFtZSkudGVtcGxhdGUuUGFyYW1ldGVycztcbiAgICAgIGV4cGVjdChPYmplY3QuZW50cmllcyhwYXJhbWV0ZXJzKS5zb21lKFxuICAgICAgICAoW2ssIHZdKSA9PiBrLnN0YXJ0c1dpdGgoJ1NzbVBhcmFtZXRlclZhbHVlYXdzc2VydmljZWVrc29wdGltaXplZGFtaScpICYmXG4gICAgICAgICAgKHYgYXMgYW55KS5EZWZhdWx0LmluY2x1ZGVzKCdhbWF6b24tbGludXgtMi1hcm02NC8nKSxcbiAgICAgICkpLnRvRXF1YWwodHJ1ZSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdhZGROb2RlZ3JvdXBDYXBhY2l0eSB3aXRoIEM3ZyBpbnN0YW5jZSB0eXBlIGNvbWVzIHdpdGggbm9kZWdyb3VwIHdpdGggY29ycmVjdCBBbWlUeXBlJywgKCkgPT4ge1xuICAgICAgLy8gR0lWRU5cbiAgICAgIGNvbnN0IHsgc3RhY2sgfSA9IHRlc3RGaXh0dXJlTm9WcGMoKTtcblxuICAgICAgLy8gV0hFTlxuICAgICAgbmV3IGVrcy5DbHVzdGVyKHN0YWNrLCAnY2x1c3RlcicsIHtcbiAgICAgICAgLi4uY29tbW9uUHJvcHMsXG4gICAgICAgIHBydW5lOiBmYWxzZSxcbiAgICAgICAgZGVmYXVsdENhcGFjaXR5SW5zdGFuY2U6IG5ldyBlYzIuSW5zdGFuY2VUeXBlKCdjN2cubGFyZ2UnKSxcbiAgICAgIH0pLmFkZE5vZGVncm91cENhcGFjaXR5KCduZycsIHtcbiAgICAgICAgaW5zdGFuY2VUeXBlczogW25ldyBlYzIuSW5zdGFuY2VUeXBlKCdjN2cubGFyZ2UnKV0sXG4gICAgICB9KTtcblxuICAgICAgLy8gVEhFTlxuICAgICAgVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6RUtTOjpOb2RlZ3JvdXAnLCB7XG4gICAgICAgIEFtaVR5cGU6ICdBTDJfQVJNXzY0JyxcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnYWRkQXV0b1NjYWxpbmdHcm91cENhcGFjaXR5IHdpdGggQzdnIGluc3RhbmNlIHR5cGUgY29tZXMgd2l0aCBub2RlZ3JvdXAgd2l0aCBjb3JyZWN0IEFtaVR5cGUnLCAoKSA9PiB7XG4gICAgICAvLyBHSVZFTlxuICAgICAgY29uc3QgeyBhcHAsIHN0YWNrIH0gPSB0ZXN0Rml4dHVyZU5vVnBjKCk7XG5cbiAgICAgIC8vIFdIRU5cbiAgICAgIG5ldyBla3MuQ2x1c3RlcihzdGFjaywgJ2NsdXN0ZXInLCB7XG4gICAgICAgIC4uLmNvbW1vblByb3BzLFxuICAgICAgICBwcnVuZTogZmFsc2UsXG4gICAgICB9KS5hZGRBdXRvU2NhbGluZ0dyb3VwQ2FwYWNpdHkoJ25nJywge1xuICAgICAgICBpbnN0YW5jZVR5cGU6IG5ldyBlYzIuSW5zdGFuY2VUeXBlKCdjN2cubGFyZ2UnKSxcbiAgICAgIH0pO1xuXG4gICAgICAvLyBUSEVOXG4gICAgICBjb25zdCBhc3NlbWJseSA9IGFwcC5zeW50aCgpO1xuICAgICAgY29uc3QgcGFyYW1ldGVycyA9IGFzc2VtYmx5LmdldFN0YWNrQnlOYW1lKHN0YWNrLnN0YWNrTmFtZSkudGVtcGxhdGUuUGFyYW1ldGVycztcbiAgICAgIGV4cGVjdChPYmplY3QuZW50cmllcyhwYXJhbWV0ZXJzKS5zb21lKFxuICAgICAgICAoW2ssIHZdKSA9PiBrLnN0YXJ0c1dpdGgoJ1NzbVBhcmFtZXRlclZhbHVlYXdzc2VydmljZWVrc29wdGltaXplZGFtaScpICYmXG4gICAgICAgICAgKHYgYXMgYW55KS5EZWZhdWx0LmluY2x1ZGVzKCdhbWF6b24tbGludXgtMi1hcm02NC8nKSxcbiAgICAgICkpLnRvRXF1YWwodHJ1ZSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdFS1MtT3B0aW1pemVkIEFNSSB3aXRoIEdQVSBzdXBwb3J0IHdoZW4gYWRkQXV0b1NjYWxpbmdHcm91cENhcGFjaXR5JywgKCkgPT4ge1xuICAgICAgLy8gR0lWRU5cbiAgICAgIGNvbnN0IHsgYXBwLCBzdGFjayB9ID0gdGVzdEZpeHR1cmVOb1ZwYygpO1xuXG4gICAgICAvLyBXSEVOXG4gICAgICBuZXcgZWtzLkNsdXN0ZXIoc3RhY2ssICdjbHVzdGVyJywge1xuICAgICAgICAuLi5jb21tb25Qcm9wcyxcbiAgICAgICAgcHJ1bmU6IGZhbHNlLFxuICAgICAgfSkuYWRkQXV0b1NjYWxpbmdHcm91cENhcGFjaXR5KCdHUFVDYXBhY2l0eScsIHtcbiAgICAgICAgaW5zdGFuY2VUeXBlOiBuZXcgZWMyLkluc3RhbmNlVHlwZSgnZzRkbi54bGFyZ2UnKSxcbiAgICAgIH0pO1xuXG4gICAgICAvLyBUSEVOXG4gICAgICBjb25zdCBhc3NlbWJseSA9IGFwcC5zeW50aCgpO1xuICAgICAgY29uc3QgcGFyYW1ldGVycyA9IGFzc2VtYmx5LmdldFN0YWNrQnlOYW1lKHN0YWNrLnN0YWNrTmFtZSkudGVtcGxhdGUuUGFyYW1ldGVycztcbiAgICAgIGV4cGVjdChPYmplY3QuZW50cmllcyhwYXJhbWV0ZXJzKS5zb21lKFxuICAgICAgICAoW2ssIHZdKSA9PiBrLnN0YXJ0c1dpdGgoJ1NzbVBhcmFtZXRlclZhbHVlYXdzc2VydmljZWVrc29wdGltaXplZGFtaScpICYmICh2IGFzIGFueSkuRGVmYXVsdC5pbmNsdWRlcygnYW1hem9uLWxpbnV4LTItZ3B1JyksXG4gICAgICApKS50b0VxdWFsKHRydWUpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnRUtTLU9wdGltaXplZCBBTUkgd2l0aCBBUk02NCB3aGVuIGFkZEF1dG9TY2FsaW5nR3JvdXBDYXBhY2l0eScsICgpID0+IHtcbiAgICAgIC8vIEdJVkVOXG4gICAgICBjb25zdCB7IGFwcCwgc3RhY2sgfSA9IHRlc3RGaXh0dXJlTm9WcGMoKTtcblxuICAgICAgLy8gV0hFTlxuICAgICAgbmV3IGVrcy5DbHVzdGVyKHN0YWNrLCAnY2x1c3RlcicsIHtcbiAgICAgICAgLi4uY29tbW9uUHJvcHMsXG4gICAgICAgIHBydW5lOiBmYWxzZSxcbiAgICAgIH0pLmFkZEF1dG9TY2FsaW5nR3JvdXBDYXBhY2l0eSgnQVJNQ2FwYWNpdHknLCB7XG4gICAgICAgIGluc3RhbmNlVHlwZTogbmV3IGVjMi5JbnN0YW5jZVR5cGUoJ202Zy5tZWRpdW0nKSxcbiAgICAgIH0pO1xuXG4gICAgICAvLyBUSEVOXG4gICAgICBjb25zdCBhc3NlbWJseSA9IGFwcC5zeW50aCgpO1xuICAgICAgY29uc3QgcGFyYW1ldGVycyA9IGFzc2VtYmx5LmdldFN0YWNrQnlOYW1lKHN0YWNrLnN0YWNrTmFtZSkudGVtcGxhdGUuUGFyYW1ldGVycztcbiAgICAgIGV4cGVjdChPYmplY3QuZW50cmllcyhwYXJhbWV0ZXJzKS5zb21lKFxuICAgICAgICAoW2ssIHZdKSA9PiBrLnN0YXJ0c1dpdGgoJ1NzbVBhcmFtZXRlclZhbHVlYXdzc2VydmljZWVrc29wdGltaXplZGFtaScpICYmICh2IGFzIGFueSkuRGVmYXVsdC5pbmNsdWRlcygnL2FtYXpvbi1saW51eC0yLWFybTY0LycpLFxuICAgICAgKSkudG9FcXVhbCh0cnVlKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ0JvdHRsZVJvY2tldEltYWdlKCkgd2l0aCBzcGVjaWZpYyBrdWJlcm5ldGVzVmVyc2lvbiByZXR1cm4gY29ycmVjdCBBTUknLCAoKSA9PiB7XG4gICAgICAvLyBHSVZFTlxuICAgICAgY29uc3QgeyBhcHAsIHN0YWNrIH0gPSB0ZXN0Rml4dHVyZU5vVnBjKCk7XG5cbiAgICAgIC8vIFdIRU5cbiAgICAgIG5ldyBCb3R0bGVSb2NrZXRJbWFnZSh7IGt1YmVybmV0ZXNWZXJzaW9uOiBDTFVTVEVSX1ZFUlNJT04udmVyc2lvbiB9KS5nZXRJbWFnZShzdGFjayk7XG5cbiAgICAgIC8vIFRIRU5cbiAgICAgIGNvbnN0IGFzc2VtYmx5ID0gYXBwLnN5bnRoKCk7XG4gICAgICBjb25zdCBwYXJhbWV0ZXJzID0gYXNzZW1ibHkuZ2V0U3RhY2tCeU5hbWUoc3RhY2suc3RhY2tOYW1lKS50ZW1wbGF0ZS5QYXJhbWV0ZXJzO1xuICAgICAgZXhwZWN0KE9iamVjdC5lbnRyaWVzKHBhcmFtZXRlcnMpLnNvbWUoXG4gICAgICAgIChbaywgdl0pID0+IGsuc3RhcnRzV2l0aCgnU3NtUGFyYW1ldGVyVmFsdWVhd3NzZXJ2aWNlYm90dGxlcm9ja2V0YXdzJykgJiZcbiAgICAgICAgICAodiBhcyBhbnkpLkRlZmF1bHQuaW5jbHVkZXMoJy9ib3R0bGVyb2NrZXQvJyksXG4gICAgICApKS50b0VxdWFsKHRydWUpO1xuICAgICAgZXhwZWN0KE9iamVjdC5lbnRyaWVzKHBhcmFtZXRlcnMpLnNvbWUoXG4gICAgICAgIChbaywgdl0pID0+IGsuc3RhcnRzV2l0aCgnU3NtUGFyYW1ldGVyVmFsdWVhd3NzZXJ2aWNlYm90dGxlcm9ja2V0YXdzJykgJiZcbiAgICAgICAgICAodiBhcyBhbnkpLkRlZmF1bHQuaW5jbHVkZXMoJy9hd3MtazhzLTEuMzMvJyksXG4gICAgICApKS50b0VxdWFsKHRydWUpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnY29yZURuc0NvbXB1dGVUeXBlIHdpbGwgcGF0Y2ggdGhlIGNvcmVETlMgY29uZmlndXJhdGlvbiB0byB1c2UgYSBcImZhcmdhdGVcIiBjb21wdXRlIHR5cGUgYW5kIHJlc3RvcmUgdG8gXCJlYzJcIiB1cG9uIHJlbW92YWwnLCAoKSA9PiB7XG4gICAgICAvLyBHSVZFTlxuICAgICAgY29uc3Qgc3RhY2sgPSBuZXcgY2RrLlN0YWNrKCk7XG5cbiAgICAgIC8vIFdIRU5cbiAgICAgIG5ldyBla3MuQ2x1c3RlcihzdGFjaywgJ015Q2x1c3RlcicsIHtcbiAgICAgICAgY29yZURuc0NvbXB1dGVUeXBlOiBla3MuQ29yZURuc0NvbXB1dGVUeXBlLkZBUkdBVEUsXG4gICAgICAgIHZlcnNpb246IENMVVNURVJfVkVSU0lPTixcbiAgICAgICAgcHJ1bmU6IGZhbHNlLFxuICAgICAgICBrdWJlY3RsUHJvdmlkZXJPcHRpb25zOiB7XG4gICAgICAgICAga3ViZWN0bExheWVyOiBuZXcgS3ViZWN0bFYzM0xheWVyKHN0YWNrLCAna3ViZWN0bExheWVyJyksXG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgLy8gVEhFTlxuICAgICAgVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0N1c3RvbTo6QVdTQ0RLLUVLUy1LdWJlcm5ldGVzUGF0Y2gnLCB7XG4gICAgICAgIFJlc291cmNlTmFtZTogJ2RlcGxveW1lbnQvY29yZWRucycsXG4gICAgICAgIFJlc291cmNlTmFtZXNwYWNlOiAna3ViZS1zeXN0ZW0nLFxuICAgICAgICBBcHBseVBhdGNoSnNvbjogJ3tcInNwZWNcIjp7XCJ0ZW1wbGF0ZVwiOntcIm1ldGFkYXRhXCI6e1wiYW5ub3RhdGlvbnNcIjp7XCJla3MuYW1hem9uYXdzLmNvbS9jb21wdXRlLXR5cGVcIjpcImZhcmdhdGVcIn19fX19JyxcbiAgICAgICAgUmVzdG9yZVBhdGNoSnNvbjogJ3tcInNwZWNcIjp7XCJ0ZW1wbGF0ZVwiOntcIm1ldGFkYXRhXCI6e1wiYW5ub3RhdGlvbnNcIjp7XCJla3MuYW1hem9uYXdzLmNvbS9jb21wdXRlLXR5cGVcIjpcImVjMlwifX19fX0nLFxuICAgICAgICBDbHVzdGVyTmFtZToge1xuICAgICAgICAgIFJlZjogJ015Q2x1c3RlcjRDMUJBNTc5JyxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnaWYgb3BlbklEQ29ubmVjdFByb3ZpZGVyIGEgbmV3IE9wZW5JRENvbm5lY3RQcm92aWRlciByZXNvdXJjZSBpcyBjcmVhdGVkIGFuZCBleHBvc2VkJywgKCkgPT4ge1xuICAgICAgLy8gR0lWRU5cbiAgICAgIGNvbnN0IHsgc3RhY2sgfSA9IHRlc3RGaXh0dXJlTm9WcGMoKTtcbiAgICAgIGNvbnN0IGNsdXN0ZXIgPSBuZXcgZWtzLkNsdXN0ZXIoc3RhY2ssICdDbHVzdGVyJywge1xuICAgICAgICAuLi5jb21tb25Qcm9wcyxcbiAgICAgICAgcHJ1bmU6IGZhbHNlLFxuICAgICAgfSk7XG5cbiAgICAgIC8vIFdIRU5cbiAgICAgIGNvbnN0IHByb3ZpZGVyID0gY2x1c3Rlci5vcGVuSWRDb25uZWN0UHJvdmlkZXI7XG5cbiAgICAgIC8vIFRIRU5cbiAgICAgIGV4cGVjdChwcm92aWRlcikudG9FcXVhbChjbHVzdGVyLm9wZW5JZENvbm5lY3RQcm92aWRlcik7XG4gICAgICBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spLmhhc1Jlc291cmNlUHJvcGVydGllcygnQ3VzdG9tOjpBV1NDREtPcGVuSWRDb25uZWN0UHJvdmlkZXInLCB7XG4gICAgICAgIFNlcnZpY2VUb2tlbjoge1xuICAgICAgICAgICdGbjo6R2V0QXR0JzogW1xuICAgICAgICAgICAgJ0N1c3RvbUFXU0NES09wZW5JZENvbm5lY3RQcm92aWRlckN1c3RvbVJlc291cmNlUHJvdmlkZXJIYW5kbGVyRjJDNTQzRTAnLFxuICAgICAgICAgICAgJ0FybicsXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAgQ2xpZW50SURMaXN0OiBbXG4gICAgICAgICAgJ3N0cy5hbWF6b25hd3MuY29tJyxcbiAgICAgICAgXSxcbiAgICAgICAgVXJsOiB7XG4gICAgICAgICAgJ0ZuOjpHZXRBdHQnOiBbXG4gICAgICAgICAgICAnQ2x1c3RlckVCMDM4NkE3JyxcbiAgICAgICAgICAgICdPcGVuSWRDb25uZWN0SXNzdWVyVXJsJyxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdpZiBFS1NfVVNFX05BVElWRV9PSURDX1BST1ZJREVSIGZlYXR1cmUgZmxhZyBpcyBlbmFibGVkLCB1c2VzIG5hdGl2ZSBPSURDIHByb3ZpZGVyJywgKCkgPT4ge1xuICAgICAgLy8gR0lWRU5cbiAgICAgIGNvbnN0IHsgc3RhY2sgfSA9IHRlc3RGaXh0dXJlTm9WcGMoKTtcbiAgICAgIHN0YWNrLm5vZGUuc2V0Q29udGV4dCgnQGF3cy1jZGsvYXdzLWVrczp1c2VOYXRpdmVPaWRjUHJvdmlkZXInLCB0cnVlKTtcbiAgICAgIGNvbnN0IGNsdXN0ZXIgPSBuZXcgZWtzLkNsdXN0ZXIoc3RhY2ssICdDbHVzdGVyJywge1xuICAgICAgICAuLi5jb21tb25Qcm9wcyxcbiAgICAgICAgcHJ1bmU6IGZhbHNlLFxuICAgICAgfSk7XG5cbiAgICAgIC8vIFdIRU5cbiAgICAgIGNsdXN0ZXIub3BlbklkQ29ubmVjdFByb3ZpZGVyO1xuXG4gICAgICAvLyBUSEVOXG4gICAgICBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpJQU06Ok9JRENQcm92aWRlcicsIHtcbiAgICAgICAgQ2xpZW50SWRMaXN0OiBbXG4gICAgICAgICAgJ3N0cy5hbWF6b25hd3MuY29tJyxcbiAgICAgICAgXSxcbiAgICAgICAgVXJsOiB7XG4gICAgICAgICAgJ0ZuOjpHZXRBdHQnOiBbXG4gICAgICAgICAgICAnQ2x1c3RlckVCMDM4NkE3JyxcbiAgICAgICAgICAgICdPcGVuSWRDb25uZWN0SXNzdWVyVXJsJyxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdpZiBFS1NfVVNFX05BVElWRV9PSURDX1BST1ZJREVSIGZlYXR1cmUgZmxhZyBpcyBkaXNhYmxlZCwgdXNlcyBjdXN0b20gcmVzb3VyY2UgT0lEQyBwcm92aWRlcicsICgpID0+IHtcbiAgICAgIC8vIEdJVkVOXG4gICAgICBjb25zdCB7IHN0YWNrIH0gPSB0ZXN0Rml4dHVyZU5vVnBjKCk7XG4gICAgICBjb25zdCBjbHVzdGVyID0gbmV3IGVrcy5DbHVzdGVyKHN0YWNrLCAnQ2x1c3RlcicsIHtcbiAgICAgICAgLi4uY29tbW9uUHJvcHMsXG4gICAgICAgIHBydW5lOiBmYWxzZSxcbiAgICAgIH0pO1xuXG4gICAgICAvLyBXSEVOXG4gICAgICBjbHVzdGVyLm9wZW5JZENvbm5lY3RQcm92aWRlcjtcblxuICAgICAgLy8gVEhFTlxuXG4gICAgICBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spLmhhc1Jlc291cmNlUHJvcGVydGllcygnQ3VzdG9tOjpBV1NDREtPcGVuSWRDb25uZWN0UHJvdmlkZXInLCB7XG4gICAgICAgIENsaWVudElETGlzdDogW1xuICAgICAgICAgICdzdHMuYW1hem9uYXdzLmNvbScsXG4gICAgICAgIF0sXG4gICAgICAgIFVybDoge1xuICAgICAgICAgICdGbjo6R2V0QXR0JzogW1xuICAgICAgICAgICAgJ0NsdXN0ZXJFQjAzODZBNycsXG4gICAgICAgICAgICAnT3BlbklkQ29ubmVjdElzc3VlclVybCcsXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnY2x1c3RlciBjYW4gYmUgdXNlZCB3aXRoIGJvdGggT2lkY1Byb3ZpZGVyTmF0aXZlIGFuZCBPcGVuSWRDb25uZWN0UHJvdmlkZXInLCAoKSA9PiB7XG4gICAgICBjb25zdCB7IHN0YWNrIH0gPSB0ZXN0Rml4dHVyZU5vVnBjKCk7XG5cbiAgICAgIGNvbnN0IGltcG9ydGVkQ2x1c3Rlck9sZFByb3ZpZGVyID0gZWtzLkNsdXN0ZXIuZnJvbUNsdXN0ZXJBdHRyaWJ1dGVzKHN0YWNrLCAnSW1wb3J0ZWRDbHVzdGVyT2xkJywge1xuICAgICAgICBjbHVzdGVyTmFtZTogJ215LWNsdXN0ZXInLFxuICAgICAgICBvcGVuSWRDb25uZWN0UHJvdmlkZXI6IGVrcy5PcGVuSWRDb25uZWN0UHJvdmlkZXIuZnJvbU9wZW5JZENvbm5lY3RQcm92aWRlckFybihzdGFjaywgJ0ltcG9ydGVkT2lkY1Byb3ZpZGVyT2xkJywgJ2Fybjphd3M6aWFtOjoxMjM0NTY3ODkwMTI6b2lkYy1wcm92aWRlci9vaWRjLmVrcy51cy13ZXN0LTIuYW1hem9uYXdzLmNvbS9pZC9FWEFNUExFRDUzOUQ0NjMzRTUzREUxQjcxNkQzMDQxRScpLFxuICAgICAgfSk7XG5cbiAgICAgIGV4cGVjdChpbXBvcnRlZENsdXN0ZXJPbGRQcm92aWRlci5vcGVuSWRDb25uZWN0UHJvdmlkZXIub2lkY1Byb3ZpZGVyUmVmLm9pZGNQcm92aWRlckFybikudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChpbXBvcnRlZENsdXN0ZXJPbGRQcm92aWRlci5vcGVuSWRDb25uZWN0UHJvdmlkZXIub3BlbklkQ29ubmVjdFByb3ZpZGVySXNzdWVyKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KGltcG9ydGVkQ2x1c3Rlck9sZFByb3ZpZGVyLm9wZW5JZENvbm5lY3RQcm92aWRlci5vcGVuSWRDb25uZWN0UHJvdmlkZXJBcm4pLnRvQmVEZWZpbmVkKCk7XG5cbiAgICAgIGNvbnN0IGltcG9ydGVkQ2x1c3Rlck5hdGl2ZVByb3ZpZGVyID0gZWtzLkNsdXN0ZXIuZnJvbUNsdXN0ZXJBdHRyaWJ1dGVzKHN0YWNrLCAnSW1wb3J0ZWRDbHVzdGVyTmF0aXZlJywge1xuICAgICAgICBjbHVzdGVyTmFtZTogJ215LWNsdXN0ZXInLFxuICAgICAgICBvcGVuSWRDb25uZWN0UHJvdmlkZXI6IGVrcy5PaWRjUHJvdmlkZXJOYXRpdmUuZnJvbU9pZGNQcm92aWRlckFybihzdGFjaywgJ0ltcG9ydGVkT2lkY1Byb3ZpZGVyTmF0aXZlJywgJ2Fybjphd3M6aWFtOjoxMjM0NTY3ODkwMTI6b2lkYy1wcm92aWRlci9vaWRjLmVrcy51cy13ZXN0LTIuYW1hem9uYXdzLmNvbS9pZC9FWEFNUExFRDUzOUQ0NjMzRTUzREUxQjcxNkQzMDQxRScpLFxuICAgICAgfSk7XG5cbiAgICAgIGV4cGVjdChpbXBvcnRlZENsdXN0ZXJOYXRpdmVQcm92aWRlci5vcGVuSWRDb25uZWN0UHJvdmlkZXIub2lkY1Byb3ZpZGVyUmVmLm9pZGNQcm92aWRlckFybikudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChpbXBvcnRlZENsdXN0ZXJOYXRpdmVQcm92aWRlci5vcGVuSWRDb25uZWN0UHJvdmlkZXIub3BlbklkQ29ubmVjdFByb3ZpZGVySXNzdWVyKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KGltcG9ydGVkQ2x1c3Rlck5hdGl2ZVByb3ZpZGVyLm9wZW5JZENvbm5lY3RQcm92aWRlci5vcGVuSWRDb25uZWN0UHJvdmlkZXJBcm4pLnRvQmVEZWZpbmVkKCk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdpbmYxIGluc3RhbmNlcyBhcmUgc3VwcG9ydGVkJywgKCkgPT4ge1xuICAgICAgLy8gR0lWRU5cbiAgICAgIGNvbnN0IHsgc3RhY2sgfSA9IHRlc3RGaXh0dXJlTm9WcGMoKTtcbiAgICAgIGNvbnN0IGNsdXN0ZXIgPSBuZXcgZWtzLkNsdXN0ZXIoc3RhY2ssICdDbHVzdGVyJywge1xuICAgICAgICAuLi5jb21tb25Qcm9wcyxcbiAgICAgICAgcHJ1bmU6IGZhbHNlLFxuICAgICAgICBrdWJlY3RsUHJvdmlkZXJPcHRpb25zOiB7XG4gICAgICAgICAga3ViZWN0bExheWVyOiBuZXcgS3ViZWN0bFYzM0xheWVyKHN0YWNrLCAna3ViZWN0bExheWVyJyksXG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgLy8gV0hFTlxuICAgICAgY2x1c3Rlci5hZGRBdXRvU2NhbGluZ0dyb3VwQ2FwYWNpdHkoJ0luZmVyZW5jZUluc3RhbmNlcycsIHtcbiAgICAgICAgaW5zdGFuY2VUeXBlOiBuZXcgZWMyLkluc3RhbmNlVHlwZSgnaW5mMS4yeGxhcmdlJyksXG4gICAgICAgIG1pbkNhcGFjaXR5OiAxLFxuICAgICAgfSk7XG4gICAgICBjb25zdCBmaWxlQ29udGVudHMgPSBmcy5yZWFkRmlsZVN5bmMocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uJywgJ2xpYicsICdhZGRvbnMnLCAnbmV1cm9uLWRldmljZS1wbHVnaW4ueWFtbCcpLCAndXRmOCcpO1xuICAgICAgY29uc3Qgc2FuaXRpemVkID0gWUFNTC5wYXJzZShmaWxlQ29udGVudHMpO1xuXG4gICAgICAvLyBUSEVOXG4gICAgICBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spLmhhc1Jlc291cmNlUHJvcGVydGllcyhla3MuS3ViZXJuZXRlc01hbmlmZXN0LlJFU09VUkNFX1RZUEUsIHtcbiAgICAgICAgTWFuaWZlc3Q6IEpTT04uc3RyaW5naWZ5KFtzYW5pdGl6ZWRdKSxcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHRlc3QoJ2luZjIgaW5zdGFuY2VzIGFyZSBzdXBwb3J0ZWQnLCAoKSA9PiB7XG4gICAgICAvLyBHSVZFTlxuICAgICAgY29uc3QgeyBzdGFjayB9ID0gdGVzdEZpeHR1cmVOb1ZwYygpO1xuICAgICAgY29uc3QgY2x1c3RlciA9IG5ldyBla3MuQ2x1c3RlcihzdGFjaywgJ0NsdXN0ZXInLCB7XG4gICAgICAgIC4uLmNvbW1vblByb3BzLFxuICAgICAgICBwcnVuZTogZmFsc2UsXG4gICAgICAgIGt1YmVjdGxQcm92aWRlck9wdGlvbnM6IHtcbiAgICAgICAgICBrdWJlY3RsTGF5ZXI6IG5ldyBLdWJlY3RsVjMzTGF5ZXIoc3RhY2ssICdrdWJlY3RsTGF5ZXInKSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICAvLyBXSEVOXG4gICAgICBjbHVzdGVyLmFkZEF1dG9TY2FsaW5nR3JvdXBDYXBhY2l0eSgnSW5mZXJlbmNlSW5zdGFuY2VzJywge1xuICAgICAgICBpbnN0YW5jZVR5cGU6IG5ldyBlYzIuSW5zdGFuY2VUeXBlKCdpbmYyLnhsYXJnZScpLFxuICAgICAgICBtaW5DYXBhY2l0eTogMSxcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZmlsZUNvbnRlbnRzID0gZnMucmVhZEZpbGVTeW5jKHBhdGguam9pbihfX2Rpcm5hbWUsICcuLicsICdsaWInLCAnYWRkb25zJywgJ25ldXJvbi1kZXZpY2UtcGx1Z2luLnlhbWwnKSwgJ3V0ZjgnKTtcbiAgICAgIGNvbnN0IHNhbml0aXplZCA9IFlBTUwucGFyc2UoZmlsZUNvbnRlbnRzKTtcblxuICAgICAgLy8gVEhFTlxuICAgICAgVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoZWtzLkt1YmVybmV0ZXNNYW5pZmVzdC5SRVNPVVJDRV9UWVBFLCB7XG4gICAgICAgIE1hbmlmZXN0OiBKU09OLnN0cmluZ2lmeShbc2FuaXRpemVkXSksXG4gICAgICB9KTtcbiAgICB9KTtcbiAgICB0ZXN0KCd0cm4xIGluc3RhbmNlcyBhcmUgc3VwcG9ydGVkJywgKCkgPT4ge1xuICAgICAgLy8gR0lWRU5cbiAgICAgIGNvbnN0IHsgc3RhY2sgfSA9IHRlc3RGaXh0dXJlTm9WcGMoKTtcbiAgICAgIGNvbnN0IGNsdXN0ZXIgPSBuZXcgZWtzLkNsdXN0ZXIoc3RhY2ssICdDbHVzdGVyJywge1xuICAgICAgICAuLi5jb21tb25Qcm9wcyxcbiAgICAgICAgcHJ1bmU6IGZhbHNlLFxuICAgICAgICBrdWJlY3RsUHJvdmlkZXJPcHRpb25zOiB7XG4gICAgICAgICAga3ViZWN0bExheWVyOiBuZXcgS3ViZWN0bFYzM0xheWVyKHN0YWNrLCAna3ViZWN0bExheWVyJyksXG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgLy8gV0hFTlxuICAgICAgY2x1c3Rlci5hZGRBdXRvU2NhbGluZ0dyb3VwQ2FwYWNpdHkoJ1RyYWluaXVtSW5zdGFuY2VzJywge1xuICAgICAgICBpbnN0YW5jZVR5cGU6IG5ldyBlYzIuSW5zdGFuY2VUeXBlKCd0cm4xLjJ4bGFyZ2UnKSxcbiAgICAgICAgbWluQ2FwYWNpdHk6IDEsXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGZpbGVDb250ZW50cyA9IGZzLnJlYWRGaWxlU3luYyhwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4nLCAnbGliJywgJ2FkZG9ucycsICduZXVyb24tZGV2aWNlLXBsdWdpbi55YW1sJyksICd1dGY4Jyk7XG4gICAgICBjb25zdCBzYW5pdGl6ZWQgPSBZQU1MLnBhcnNlKGZpbGVDb250ZW50cyk7XG5cbiAgICAgIC8vIFRIRU5cbiAgICAgIFRlbXBsYXRlLmZyb21TdGFjayhzdGFjaykuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKGVrcy5LdWJlcm5ldGVzTWFuaWZlc3QuUkVTT1VSQ0VfVFlQRSwge1xuICAgICAgICBNYW5pZmVzdDogSlNPTi5zdHJpbmdpZnkoW3Nhbml0aXplZF0pLFxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgdGVzdCgndHJuMW4gaW5zdGFuY2VzIGFyZSBzdXBwb3J0ZWQnLCAoKSA9PiB7XG4gICAgICAvLyBHSVZFTlxuICAgICAgY29uc3QgeyBzdGFjayB9ID0gdGVzdEZpeHR1cmVOb1ZwYygpO1xuICAgICAgY29uc3QgY2x1c3RlciA9IG5ldyBla3MuQ2x1c3RlcihzdGFjaywgJ0NsdXN0ZXInLCB7XG4gICAgICAgIC4uLmNvbW1vblByb3BzLFxuICAgICAgICBwcnVuZTogZmFsc2UsXG4gICAgICAgIGt1YmVjdGxQcm92aWRlck9wdGlvbnM6IHtcbiAgICAgICAgICBrdWJlY3RsTGF5ZXI6IG5ldyBLdWJlY3RsVjMzTGF5ZXIoc3RhY2ssICdrdWJlY3RsTGF5ZXInKSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICAvLyBXSEVOXG4gICAgICBjbHVzdGVyLmFkZEF1dG9TY2FsaW5nR3JvdXBDYXBhY2l0eSgnVHJhaW5pdW1JbnN0YW5jZXMnLCB7XG4gICAgICAgIGluc3RhbmNlVHlwZTogbmV3IGVjMi5JbnN0YW5jZVR5cGUoJ3RybjFuLjJ4bGFyZ2UnKSxcbiAgICAgICAgbWluQ2FwYWNpdHk6IDEsXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGZpbGVDb250ZW50cyA9IGZzLnJlYWRGaWxlU3luYyhwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4nLCAnbGliJywgJ2FkZG9ucycsICduZXVyb24tZGV2aWNlLXBsdWdpbi55YW1sJyksICd1dGY4Jyk7XG4gICAgICBjb25zdCBzYW5pdGl6ZWQgPSBZQU1MLnBhcnNlKGZpbGVDb250ZW50cyk7XG5cbiAgICAgIC8vIFRIRU5cbiAgICAgIFRlbXBsYXRlLmZyb21TdGFjayhzdGFjaykuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKGVrcy5LdWJlcm5ldGVzTWFuaWZlc3QuUkVTT1VSQ0VfVFlQRSwge1xuICAgICAgICBNYW5pZmVzdDogSlNPTi5zdHJpbmdpZnkoW3Nhbml0aXplZF0pLFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdpbmYxIGluc3RhbmNlcyBhcmUgc3VwcG9ydGVkIGluIGFkZE5vZGVncm91cENhcGFjaXR5JywgKCkgPT4ge1xuICAgICAgLy8gR0lWRU5cbiAgICAgIGNvbnN0IHsgc3RhY2sgfSA9IHRlc3RGaXh0dXJlTm9WcGMoKTtcbiAgICAgIGNvbnN0IGNsdXN0ZXIgPSBuZXcgZWtzLkNsdXN0ZXIoc3RhY2ssICdDbHVzdGVyJywge1xuICAgICAgICAuLi5jb21tb25Qcm9wcyxcbiAgICAgICAgcHJ1bmU6IGZhbHNlLFxuICAgICAgICBrdWJlY3RsUHJvdmlkZXJPcHRpb25zOiB7XG4gICAgICAgICAga3ViZWN0bExheWVyOiBuZXcgS3ViZWN0bFYzM0xheWVyKHN0YWNrLCAna3ViZWN0bExheWVyJyksXG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgLy8gV0hFTlxuICAgICAgY2x1c3Rlci5hZGROb2RlZ3JvdXBDYXBhY2l0eSgnSW5mZXJlbmNlSW5zdGFuY2VzJywge1xuICAgICAgICBpbnN0YW5jZVR5cGVzOiBbbmV3IGVjMi5JbnN0YW5jZVR5cGUoJ2luZjEuMnhsYXJnZScpXSxcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZmlsZUNvbnRlbnRzID0gZnMucmVhZEZpbGVTeW5jKHBhdGguam9pbihfX2Rpcm5hbWUsICcuLicsICdsaWInLCAnYWRkb25zJywgJ25ldXJvbi1kZXZpY2UtcGx1Z2luLnlhbWwnKSwgJ3V0ZjgnKTtcbiAgICAgIGNvbnN0IHNhbml0aXplZCA9IFlBTUwucGFyc2UoZmlsZUNvbnRlbnRzKTtcblxuICAgICAgLy8gVEhFTlxuICAgICAgVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoZWtzLkt1YmVybmV0ZXNNYW5pZmVzdC5SRVNPVVJDRV9UWVBFLCB7XG4gICAgICAgIE1hbmlmZXN0OiBKU09OLnN0cmluZ2lmeShbc2FuaXRpemVkXSksXG4gICAgICB9KTtcbiAgICB9KTtcbiAgICB0ZXN0KCdpbmYyIGluc3RhbmNlcyBhcmUgc3VwcG9ydGVkIGluIGFkZE5vZGVncm91cENhcGFjaXR5JywgKCkgPT4ge1xuICAgICAgLy8gR0lWRU5cbiAgICAgIGNvbnN0IHsgc3RhY2sgfSA9IHRlc3RGaXh0dXJlTm9WcGMoKTtcbiAgICAgIGNvbnN0IGNsdXN0ZXIgPSBuZXcgZWtzLkNsdXN0ZXIoc3RhY2ssICdDbHVzdGVyJywge1xuICAgICAgICAuLi5jb21tb25Qcm9wcyxcbiAgICAgICAgcHJ1bmU6IGZhbHNlLFxuICAgICAgICBrdWJlY3RsUHJvdmlkZXJPcHRpb25zOiB7XG4gICAgICAgICAga3ViZWN0bExheWVyOiBuZXcgS3ViZWN0bFYzM0xheWVyKHN0YWNrLCAna3ViZWN0bExheWVyJyksXG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgLy8gV0hFTlxuICAgICAgY2x1c3Rlci5hZGROb2RlZ3JvdXBDYXBhY2l0eSgnSW5mZXJlbmNlSW5zdGFuY2VzJywge1xuICAgICAgICBpbnN0YW5jZVR5cGVzOiBbbmV3IGVjMi5JbnN0YW5jZVR5cGUoJ2luZjIueGxhcmdlJyldLFxuICAgICAgfSk7XG4gICAgICBjb25zdCBmaWxlQ29udGVudHMgPSBmcy5yZWFkRmlsZVN5bmMocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uJywgJ2xpYicsICdhZGRvbnMnLCAnbmV1cm9uLWRldmljZS1wbHVnaW4ueWFtbCcpLCAndXRmOCcpO1xuICAgICAgY29uc3Qgc2FuaXRpemVkID0gWUFNTC5wYXJzZShmaWxlQ29udGVudHMpO1xuXG4gICAgICAvLyBUSEVOXG4gICAgICBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spLmhhc1Jlc291cmNlUHJvcGVydGllcyhla3MuS3ViZXJuZXRlc01hbmlmZXN0LlJFU09VUkNFX1RZUEUsIHtcbiAgICAgICAgTWFuaWZlc3Q6IEpTT04uc3RyaW5naWZ5KFtzYW5pdGl6ZWRdKSxcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGVzdCgna3ViZWN0bCByZXNvdXJjZXMgYXJlIGFsd2F5cyBjcmVhdGVkIGFmdGVyIGFsbCBmYXJnYXRlIHByb2ZpbGVzJywgKCkgPT4ge1xuICAgICAgLy8gR0lWRU5cbiAgICAgIGNvbnN0IHsgc3RhY2ssIGFwcCB9ID0gdGVzdEZpeHR1cmUoKTtcbiAgICAgIGNvbnN0IGNsdXN0ZXIgPSBuZXcgZWtzLkNsdXN0ZXIoc3RhY2ssICdDbHVzdGVyJywge1xuICAgICAgICB2ZXJzaW9uOiBDTFVTVEVSX1ZFUlNJT04sXG4gICAgICAgIHBydW5lOiBmYWxzZSxcbiAgICAgICAga3ViZWN0bFByb3ZpZGVyT3B0aW9uczoge1xuICAgICAgICAgIGt1YmVjdGxMYXllcjogbmV3IEt1YmVjdGxWMzNMYXllcihzdGFjaywgJ2t1YmVjdGxMYXllcicpLFxuICAgICAgICB9LFxuICAgICAgfSk7XG5cbiAgICAgIC8vIFdIRU5cbiAgICAgIGNsdXN0ZXIuYWRkRmFyZ2F0ZVByb2ZpbGUoJ3Byb2ZpbGUxJywgeyBzZWxlY3RvcnM6IFt7IG5hbWVzcGFjZTogJ3Byb2ZpbGUxJyB9XSB9KTtcbiAgICAgIGNsdXN0ZXIuYWRkTWFuaWZlc3QoJ3Jlc291cmNlMScsIHsgZm9vOiAxMjMgfSk7XG4gICAgICBjbHVzdGVyLmFkZEZhcmdhdGVQcm9maWxlKCdwcm9maWxlMicsIHsgc2VsZWN0b3JzOiBbeyBuYW1lc3BhY2U6ICdwcm9maWxlMicgfV0gfSk7XG4gICAgICBuZXcgZWtzLkhlbG1DaGFydChzdGFjaywgJ2NoYXJ0JywgeyBjbHVzdGVyLCBjaGFydDogJ215Y2hhcnQnIH0pO1xuICAgICAgY2x1c3Rlci5hZGRGYXJnYXRlUHJvZmlsZSgncHJvZmlsZTMnLCB7IHNlbGVjdG9yczogW3sgbmFtZXNwYWNlOiAncHJvZmlsZTMnIH1dIH0pO1xuICAgICAgbmV3IGVrcy5LdWJlcm5ldGVzUGF0Y2goc3RhY2ssICdwYXRjaDEnLCB7XG4gICAgICAgIGNsdXN0ZXIsXG4gICAgICAgIGFwcGx5UGF0Y2g6IHsgZm9vOiAxMjMgfSxcbiAgICAgICAgcmVzdG9yZVBhdGNoOiB7IGJhcjogMTIzIH0sXG4gICAgICAgIHJlc291cmNlTmFtZTogJ2Zvby9iYXInLFxuICAgICAgfSk7XG4gICAgICBjbHVzdGVyLmFkZEZhcmdhdGVQcm9maWxlKCdwcm9maWxlNCcsIHsgc2VsZWN0b3JzOiBbeyBuYW1lc3BhY2U6ICdwcm9maWxlNCcgfV0gfSk7XG5cbiAgICAgIC8vIFRIRU5cbiAgICAgIGNvbnN0IHRlbXBsYXRlID0gYXBwLnN5bnRoKCkuZ2V0U3RhY2tBcnRpZmFjdChzdGFjay5hcnRpZmFjdElkKS50ZW1wbGF0ZTtcblxuICAgICAgY29uc3Qga3ViZWN0bFJlYWR5QmFycmllciA9ICdDbHVzdGVyS3ViZWN0bFJlYWR5QmFycmllcjIwMDA1MkFGJztcbiAgICAgIGNvbnN0IGJhcnJpZXIgPSB0ZW1wbGF0ZS5SZXNvdXJjZXNba3ViZWN0bFJlYWR5QmFycmllcl07XG5cbiAgICAgIGNvbnN0IGFkbWluUm9sZUFjY2VzcyA9ICdDbHVzdGVyQ2x1c3RlckFkbWluUm9sZUFjY2Vzc0YyQkZGNzU5JztcbiAgICAgIGNvbnN0IHByb2ZpbGUxUG9kRXhlY3V0aW9uUm9sZSA9ICdDbHVzdGVyZmFyZ2F0ZXByb2ZpbGVwcm9maWxlMVBvZEV4ZWN1dGlvblJvbGVFODVGODdCNSc7XG4gICAgICBjb25zdCBwcm9maWxlMSA9ICdDbHVzdGVyZmFyZ2F0ZXByb2ZpbGVwcm9maWxlMTI5QUVBM0M2JztcbiAgICAgIGNvbnN0IHByb2ZpbGUyUG9kRXhlY3V0aW9uUm9sZSA9ICdDbHVzdGVyZmFyZ2F0ZXByb2ZpbGVwcm9maWxlMlBvZEV4ZWN1dGlvblJvbGUyMjY3MEFGOCc7XG4gICAgICBjb25zdCBwcm9maWxlMiA9ICdDbHVzdGVyZmFyZ2F0ZXByb2ZpbGVwcm9maWxlMjMzQjlBMTE3JztcbiAgICAgIGNvbnN0IHByb2ZpbGUzUG9kRXhlY3V0aW9uUm9sZSA9ICdDbHVzdGVyZmFyZ2F0ZXByb2ZpbGVwcm9maWxlM1BvZEV4ZWN1dGlvblJvbGU0NzVDMEQ4Ric7XG4gICAgICBjb25zdCBwcm9maWxlMyA9ICdDbHVzdGVyZmFyZ2F0ZXByb2ZpbGVwcm9maWxlM0QwNkYzMDc2JztcbiAgICAgIGNvbnN0IHByb2ZpbGU0UG9kRXhlY3V0aW9uUm9sZSA9ICdDbHVzdGVyZmFyZ2F0ZXByb2ZpbGVwcm9maWxlNFBvZEV4ZWN1dGlvblJvbGUwODYwNTdGQic7XG4gICAgICBjb25zdCBwcm9maWxlNCA9ICdDbHVzdGVyZmFyZ2F0ZXByb2ZpbGVwcm9maWxlNEEwRTNCQkU4JztcbiAgICAgIGNvbnN0IGNsdXN0ZXJSZXNvdXJjZSA9ICdDbHVzdGVyRUIwMzg2QTcnO1xuXG4gICAgICBjb25zdCBleHBlY3RlZEJhcnJpZXJEZXBlbmRlbmNpZXMgPSBbXG4gICAgICAgIGFkbWluUm9sZUFjY2VzcyxcbiAgICAgICAgcHJvZmlsZTFQb2RFeGVjdXRpb25Sb2xlLFxuICAgICAgICBwcm9maWxlMSxcbiAgICAgICAgcHJvZmlsZTJQb2RFeGVjdXRpb25Sb2xlLFxuICAgICAgICBwcm9maWxlMixcbiAgICAgICAgcHJvZmlsZTNQb2RFeGVjdXRpb25Sb2xlLFxuICAgICAgICBwcm9maWxlMyxcbiAgICAgICAgcHJvZmlsZTRQb2RFeGVjdXRpb25Sb2xlLFxuICAgICAgICBwcm9maWxlNCxcbiAgICAgICAgY2x1c3RlclJlc291cmNlLFxuICAgICAgXTtcblxuICAgICAgZXhwZWN0KGJhcnJpZXIuRGVwZW5kc09uKS50b0VxdWFsKGV4cGVjdGVkQmFycmllckRlcGVuZGVuY2llcyk7XG5cbiAgICAgIGNvbnN0IGhlbG1DaGFydCA9ICdjaGFydEYyNDQ3QUZDJztcbiAgICAgIGNvbnN0IGt1YmVybmV0ZXNQYXRjaCA9ICdwYXRjaDFCOTY0QUM5Myc7XG4gICAgICBjb25zdCBrdWJlcm5ldGVzTWFuaWZlc3QgPSAnQ2x1c3Rlcm1hbmlmZXN0cmVzb3VyY2UxMEIxQzk1MDUnO1xuICAgICAgY29uc3Qga3ViZWN0bFJlc291cmNlcyA9IFtoZWxtQ2hhcnQsIGt1YmVybmV0ZXNQYXRjaCwga3ViZXJuZXRlc01hbmlmZXN0XTtcblxuICAgICAgLy8gY2hlY2sgdGhhdCBhbGwga3ViZWN0bCByZXNvdXJjZXMgZGVwZW5kIG9uIHRoZSBiYXJyaWVyXG4gICAgICBmb3IgKGNvbnN0IHJlc291cmNlIG9mIGt1YmVjdGxSZXNvdXJjZXMpIHtcbiAgICAgICAgZXhwZWN0KHRlbXBsYXRlLlJlc291cmNlc1tyZXNvdXJjZV0uRGVwZW5kc09uKS50b0VxdWFsKFtrdWJlY3RsUmVhZHlCYXJyaWVyXSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdrdWJlY3RsIHByb3ZpZGVyIHJvbGUgaGF2ZSByaWdodCBwb2xpY3knLCAoKSA9PiB7XG4gICAgICAvLyBHSVZFTlxuICAgICAgY29uc3QgeyBzdGFjayB9ID0gdGVzdEZpeHR1cmUoKTtcbiAgICAgIGNvbnN0IGMxID0gbmV3IGVrcy5DbHVzdGVyKHN0YWNrLCAnQ2x1c3RlcjEnLCB7XG4gICAgICAgIHZlcnNpb246IENMVVNURVJfVkVSU0lPTixcbiAgICAgICAgcHJ1bmU6IGZhbHNlLFxuICAgICAgICBrdWJlY3RsUHJvdmlkZXJPcHRpb25zOiB7XG4gICAgICAgICAga3ViZWN0bExheWVyOiBuZXcgS3ViZWN0bFYzM0xheWVyKHN0YWNrLCAna3ViZWN0bExheWVyJyksXG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgLy8gV0hFTlxuICAgICAgLy8gYWN0aXZhdGUga3ViZWN0bCBwcm92aWRlclxuICAgICAgYzEuYWRkTWFuaWZlc3QoJ2MxYScsIHsgZm9vOiAxMjMgfSk7XG4gICAgICBjMS5hZGRNYW5pZmVzdCgnYzFiJywgeyBmb286IDEyMyB9KTtcblxuICAgICAgLy8gVEhFTlxuICAgICAgVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6SUFNOjpQb2xpY3knLCB7XG4gICAgICAgIFBvbGljeURvY3VtZW50OiB7XG4gICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIEFjdGlvbjogJ2VrczpEZXNjcmliZUNsdXN0ZXInLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgIFJlc291cmNlOiB7XG4gICAgICAgICAgICAgICAgJ0ZuOjpHZXRBdHQnOiBbXG4gICAgICAgICAgICAgICAgICAnQ2x1c3RlcjE5MkNEMDM3NScsXG4gICAgICAgICAgICAgICAgICAnQXJuJyxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpJQU06OlJvbGUnLCB7XG4gICAgICAgIEFzc3VtZVJvbGVQb2xpY3lEb2N1bWVudDoge1xuICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBBY3Rpb246ICdzdHM6QXNzdW1lUm9sZScsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7IFNlcnZpY2U6ICdsYW1iZGEuYW1hem9uYXdzLmNvbScgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgIH0sXG4gICAgICAgIE1hbmFnZWRQb2xpY3lBcm5zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgJ0ZuOjpKb2luJzogWycnLCBbXG4gICAgICAgICAgICAgICdhcm46JyxcbiAgICAgICAgICAgICAgeyBSZWY6ICdBV1M6OlBhcnRpdGlvbicgfSxcbiAgICAgICAgICAgICAgJzppYW06OmF3czpwb2xpY3kvc2VydmljZS1yb2xlL0FXU0xhbWJkYUJhc2ljRXhlY3V0aW9uUm9sZScsXG4gICAgICAgICAgICBdXSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgICdGbjo6Sm9pbic6IFsnJywgW1xuICAgICAgICAgICAgICAnYXJuOicsXG4gICAgICAgICAgICAgIHsgUmVmOiAnQVdTOjpQYXJ0aXRpb24nIH0sXG4gICAgICAgICAgICAgICc6aWFtOjphd3M6cG9saWN5L3NlcnZpY2Utcm9sZS9BV1NMYW1iZGFWUENBY2Nlc3NFeGVjdXRpb25Sb2xlJyxcbiAgICAgICAgICAgIF1dLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgJ0ZuOjpKb2luJzogWycnLCBbXG4gICAgICAgICAgICAgICdhcm46JyxcbiAgICAgICAgICAgICAgeyBSZWY6ICdBV1M6OlBhcnRpdGlvbicgfSxcbiAgICAgICAgICAgICAgJzppYW06OmF3czpwb2xpY3kvQW1hem9uRUMyQ29udGFpbmVyUmVnaXN0cnlSZWFkT25seScsXG4gICAgICAgICAgICBdXSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgICdGbjo6SWYnOiBbXG4gICAgICAgICAgICAgICdDbHVzdGVyMUt1YmVjdGxQcm92aWRlckhhbmRsZXJIYXNFY3JQdWJsaWMwQjFDOTgyMCcsXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAnRm46OkpvaW4nOiBbXG4gICAgICAgICAgICAgICAgICAnJyxcbiAgICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICAgJ2FybjonLFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgUmVmOiAnQVdTOjpQYXJ0aXRpb24nLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAnOmlhbTo6YXdzOnBvbGljeS9BbWF6b25FbGFzdGljQ29udGFpbmVyUmVnaXN0cnlQdWJsaWNSZWFkT25seScsXG4gICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBSZWY6ICdBV1M6Ok5vVmFsdWUnLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIHRlc3QoJ2t1YmVjdGwgcHJvdmlkZXIgcGFzc2VzIHNlY3VyaXR5IGdyb3VwIHRvIHByb3ZpZGVyJywgKCkgPT4ge1xuICAgIGNvbnN0IHsgc3RhY2sgfSA9IHRlc3RGaXh0dXJlKCk7XG5cbiAgICBuZXcgZWtzLkNsdXN0ZXIoc3RhY2ssICdDbHVzdGVyMScsIHtcbiAgICAgIHZlcnNpb246IENMVVNURVJfVkVSU0lPTixcbiAgICAgIHBydW5lOiBmYWxzZSxcbiAgICAgIGVuZHBvaW50QWNjZXNzOiBla3MuRW5kcG9pbnRBY2Nlc3MuUFJJVkFURSxcbiAgICAgIGt1YmVjdGxQcm92aWRlck9wdGlvbnM6IHtcbiAgICAgICAga3ViZWN0bExheWVyOiBuZXcgS3ViZWN0bFYzM0xheWVyKHN0YWNrLCAna3ViZWN0bExheWVyJyksXG4gICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgRm9vOiAnQmFyJyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpMYW1iZGE6OkZ1bmN0aW9uJywge1xuICAgICAgVnBjQ29uZmlnOiB7XG4gICAgICAgIFNlY3VyaXR5R3JvdXBJZHM6IFt7ICdGbjo6R2V0QXR0JzogWydDbHVzdGVyMTkyQ0QwMzc1JywgJ0NsdXN0ZXJTZWN1cml0eUdyb3VwSWQnXSB9XSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH0pO1xuXG4gIHRlc3QoJ2t1YmVjdGwgcHJvdmlkZXIgcGFzc2VzIGVudmlyb25tZW50IHRvIGxhbWJkYScsICgpID0+IHtcbiAgICBjb25zdCB7IHN0YWNrIH0gPSB0ZXN0Rml4dHVyZSgpO1xuXG4gICAgY29uc3QgY2x1c3RlciA9IG5ldyBla3MuQ2x1c3RlcihzdGFjaywgJ0NsdXN0ZXIxJywge1xuICAgICAgdmVyc2lvbjogQ0xVU1RFUl9WRVJTSU9OLFxuICAgICAgcHJ1bmU6IGZhbHNlLFxuICAgICAgZW5kcG9pbnRBY2Nlc3M6IGVrcy5FbmRwb2ludEFjY2Vzcy5QUklWQVRFLFxuICAgICAga3ViZWN0bFByb3ZpZGVyT3B0aW9uczoge1xuICAgICAgICBrdWJlY3RsTGF5ZXI6IG5ldyBLdWJlY3RsVjMzTGF5ZXIoc3RhY2ssICdrdWJlY3RsTGF5ZXInKSxcbiAgICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgICBGb286ICdCYXInLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGNsdXN0ZXIuYWRkTWFuaWZlc3QoJ3Jlc291cmNlJywge1xuICAgICAga2luZDogJ0NvbmZpZ01hcCcsXG4gICAgICBhcGlWZXJzaW9uOiAndjEnLFxuICAgICAgZGF0YToge1xuICAgICAgICBoZWxsbzogJ3dvcmxkJyxcbiAgICAgIH0sXG4gICAgICBtZXRhZGF0YToge1xuICAgICAgICBuYW1lOiAnY29uZmlnLW1hcCcsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6TGFtYmRhOjpGdW5jdGlvbicsIHtcbiAgICAgIEVudmlyb25tZW50OiB7XG4gICAgICAgIFZhcmlhYmxlczoge1xuICAgICAgICAgIEZvbzogJ0JhcicsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgna3ViZWN0bCBwcm92aWRlciBwYXNzZXMgaWFtIHJvbGUgZW52aXJvbm1lbnQgdG8ga3ViZWN0bCBsYW1iZGEnLCAoKSA9PiB7XG4gICAgdGVzdCgnbmV3IGNsdXN0ZXInLCAoKSA9PiB7XG4gICAgICBjb25zdCB7IHN0YWNrIH0gPSB0ZXN0Rml4dHVyZSgpO1xuXG4gICAgICBjb25zdCBrdWJlY3RsUm9sZSA9IG5ldyBpYW0uUm9sZShzdGFjaywgJ0t1YmVjdGxJYW1Sb2xlJywge1xuICAgICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnbGFtYmRhLmFtYXpvbmF3cy5jb20nKSxcbiAgICAgIH0pO1xuXG4gICAgICAvLyB1c2luZyBfIHN5bnRheCB0byBzaWxlbmNlIHdhcm5pbmcgYWJvdXQgX2NsdXN0ZXIgbm90IGJlaW5nIHVzZWQsIHdoZW4gaXQgaXNcbiAgICAgIGNvbnN0IGNsdXN0ZXIgPSBuZXcgZWtzLkNsdXN0ZXIoc3RhY2ssICdDbHVzdGVyMScsIHtcbiAgICAgICAgdmVyc2lvbjogQ0xVU1RFUl9WRVJTSU9OLFxuICAgICAgICBwcnVuZTogZmFsc2UsXG4gICAgICAgIGVuZHBvaW50QWNjZXNzOiBla3MuRW5kcG9pbnRBY2Nlc3MuUFJJVkFURSxcbiAgICAgICAga3ViZWN0bFByb3ZpZGVyT3B0aW9uczoge1xuICAgICAgICAgIGt1YmVjdGxMYXllcjogbmV3IEt1YmVjdGxWMzNMYXllcihzdGFjaywgJ2t1YmVjdGxMYXllcicpLFxuICAgICAgICAgIHJvbGU6IGt1YmVjdGxSb2xlLFxuICAgICAgICB9LFxuICAgICAgfSk7XG5cbiAgICAgIGNsdXN0ZXIuYWRkTWFuaWZlc3QoJ3Jlc291cmNlJywge1xuICAgICAgICBraW5kOiAnQ29uZmlnTWFwJyxcbiAgICAgICAgYXBpVmVyc2lvbjogJ3YxJyxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIGhlbGxvOiAnd29ybGQnLFxuICAgICAgICB9LFxuICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgIG5hbWU6ICdjb25maWctbWFwJyxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpMYW1iZGE6OkZ1bmN0aW9uJywge1xuICAgICAgICBSb2xlOiB7XG4gICAgICAgICAgJ0ZuOjpHZXRBdHQnOiBbJ0NsdXN0ZXIxS3ViZWN0bFByb3ZpZGVyZnJhbWV3b3Jrb25FdmVudFNlcnZpY2VSb2xlNjc4MTlBQTknLCAnQXJuJ10sXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ2ltcG9ydGVkIGNsdXN0ZXInLCAoKSA9PiB7XG4gICAgICBjb25zdCBjbHVzdGVyTmFtZSA9ICdteS1jbHVzdGVyJztcbiAgICAgIGNvbnN0IHN0YWNrID0gbmV3IGNkay5TdGFjaygpO1xuXG4gICAgICBjb25zdCBoYW5kbGVyUm9sZSA9IGlhbS5Sb2xlLmZyb21Sb2xlQXJuKHN0YWNrLCAnSGFuZGxlclJvbGUnLCAnYXJuOmF3czppYW06OjEyMzQ1Njc4OTAxMjpyb2xlL2xhbWJkYS1yb2xlJyk7XG5cbiAgICAgIGNvbnN0IGt1YmVjdGxQcm92aWRlciA9IEt1YmVjdGxQcm92aWRlci5mcm9tS3ViZWN0bFByb3ZpZGVyQXR0cmlidXRlcyhzdGFjaywgJ0t1YmVjdGxQcm92aWRlcicsIHtcbiAgICAgICAgc2VydmljZVRva2VuOiAnYXJuOmF3czpsYW1iZGE6dXMtZWFzdC0yOjEyMzQ1Njc4OTAxMjpmdW5jdGlvbjpteS1mdW5jdGlvbjoxJyxcbiAgICAgICAgcm9sZTogaGFuZGxlclJvbGUsXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgY2x1c3RlciA9IGVrcy5DbHVzdGVyLmZyb21DbHVzdGVyQXR0cmlidXRlcyhzdGFjaywgJ0ltcG9ydGVkJywge1xuICAgICAgICBjbHVzdGVyTmFtZSxcbiAgICAgICAga3ViZWN0bFByb3ZpZGVyOiBrdWJlY3RsUHJvdmlkZXIsXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgY2hhcnQgPSAnaGVsbG8td29ybGQnO1xuICAgICAgY2x1c3Rlci5hZGRIZWxtQ2hhcnQoJ3Rlc3QtY2hhcnQnLCB7XG4gICAgICAgIGNoYXJ0LFxuICAgICAgfSk7XG5cbiAgICAgIFRlbXBsYXRlLmZyb21TdGFjayhzdGFjaykuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKEhlbG1DaGFydC5SRVNPVVJDRV9UWVBFLCB7XG4gICAgICAgIENsdXN0ZXJOYW1lOiBjbHVzdGVyTmFtZSxcbiAgICAgICAgUmVsZWFzZTogJ2ltcG9ydGVkY2hhcnR0ZXN0Y2hhcnRmM2FjZDZlNScsXG4gICAgICAgIENoYXJ0OiBjaGFydCxcbiAgICAgICAgTmFtZXNwYWNlOiAnZGVmYXVsdCcsXG4gICAgICAgIENyZWF0ZU5hbWVzcGFjZTogdHJ1ZSxcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnZW5kcG9pbnQgYWNjZXNzJywgKCkgPT4ge1xuICAgIHRlc3QoJ3B1YmxpYyByZXN0cmljdGVkJywgKCkgPT4ge1xuICAgICAgZXhwZWN0KCgpID0+IHtcbiAgICAgICAgZWtzLkVuZHBvaW50QWNjZXNzLlBVQkxJQy5vbmx5RnJvbSgnMS4yLjMuNC8zMicpO1xuICAgICAgfSkudG9UaHJvdygvQ2Fubm90IHJlc3RyaWMgcHVibGljIGFjY2VzcyB0byBlbmRwb2ludCB3aGVuIHByaXZhdGUgYWNjZXNzIGlzIGRpc2FibGVkLiBVc2UgUFVCTElDX0FORF9QUklWQVRFLm9ubHlGcm9tXFwoXFwpIGluc3RlYWQuLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdwdWJsaWMgbm9uIHJlc3RyaWN0ZWQgd2l0aG91dCBwcml2YXRlIHN1Ym5ldHMnLCAoKSA9PiB7XG4gICAgICBjb25zdCB7IHN0YWNrIH0gPSB0ZXN0Rml4dHVyZSgpO1xuXG4gICAgICBuZXcgZWtzLkNsdXN0ZXIoc3RhY2ssICdDbHVzdGVyJywge1xuICAgICAgICB2ZXJzaW9uOiBDTFVTVEVSX1ZFUlNJT04sXG4gICAgICAgIHBydW5lOiBmYWxzZSxcbiAgICAgICAgZW5kcG9pbnRBY2Nlc3M6IGVrcy5FbmRwb2ludEFjY2Vzcy5QVUJMSUMsXG4gICAgICAgIHZwY1N1Ym5ldHM6IFt7IHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBVQkxJQyB9XSxcbiAgICAgICAga3ViZWN0bFByb3ZpZGVyT3B0aW9uczoge1xuICAgICAgICAgIGt1YmVjdGxMYXllcjogbmV3IEt1YmVjdGxWMzNMYXllcihzdGFjaywgJ2t1YmVjdGxMYXllcicpLFxuICAgICAgICB9LFxuICAgICAgfSk7XG5cbiAgICAgIC8vIHdlIGRvbid0IGF0dGFjaCB2cGMgY29uZmlnIGluIGNhc2UgZW5kcG9pbnQgaXMgcHVibGljIG9ubHksIHJlZ2FyZGxlc3Mgb2Ygd2hldGhlclxuICAgICAgLy8gdGhlIHZwYyBoYXMgcHJpdmF0ZSBzdWJuZXRzIG9yIG5vdC5cbiAgICAgIFRlbXBsYXRlLmZyb21TdGFjayhzdGFjaykuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkxhbWJkYTo6RnVuY3Rpb24nLCB7XG4gICAgICAgIFZwY0NvbmZpZzogTWF0Y2guYWJzZW50KCksXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ3B1YmxpYyBub24gcmVzdHJpY3RlZCB3aXRoIHByaXZhdGUgc3VibmV0cycsICgpID0+IHtcbiAgICAgIGNvbnN0IHsgc3RhY2sgfSA9IHRlc3RGaXh0dXJlKCk7XG5cbiAgICAgIG5ldyBla3MuQ2x1c3RlcihzdGFjaywgJ0NsdXN0ZXInLCB7XG4gICAgICAgIHZlcnNpb246IENMVVNURVJfVkVSU0lPTixcbiAgICAgICAgZW5kcG9pbnRBY2Nlc3M6IGVrcy5FbmRwb2ludEFjY2Vzcy5QVUJMSUMsXG4gICAgICAgIGt1YmVjdGxQcm92aWRlck9wdGlvbnM6IHtcbiAgICAgICAgICBrdWJlY3RsTGF5ZXI6IG5ldyBLdWJlY3RsVjMzTGF5ZXIoc3RhY2ssICdrdWJlY3RsTGF5ZXInKSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICAvLyB3ZSBkb24ndCBhdHRhY2ggdnBjIGNvbmZpZyBpbiBjYXNlIGVuZHBvaW50IGlzIHB1YmxpYyBvbmx5LCByZWdhcmRsZXNzIG9mIHdoZXRoZXJcbiAgICAgIC8vIHRoZSB2cGMgaGFzIHByaXZhdGUgc3VibmV0cyBvciBub3QuXG4gICAgICBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpMYW1iZGE6OkZ1bmN0aW9uJywge1xuICAgICAgICBWcGNDb25maWc6IE1hdGNoLmFic2VudCgpLFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdwcml2YXRlIHdpdGhvdXQgcHJpdmF0ZSBzdWJuZXRzJywgKCkgPT4ge1xuICAgICAgY29uc3QgeyBzdGFjayB9ID0gdGVzdEZpeHR1cmUoKTtcblxuICAgICAgZXhwZWN0KCgpID0+IHtcbiAgICAgICAgbmV3IGVrcy5DbHVzdGVyKHN0YWNrLCAnQ2x1c3RlcicsIHtcbiAgICAgICAgICB2ZXJzaW9uOiBDTFVTVEVSX1ZFUlNJT04sXG4gICAgICAgICAgcHJ1bmU6IGZhbHNlLFxuICAgICAgICAgIGVuZHBvaW50QWNjZXNzOiBla3MuRW5kcG9pbnRBY2Nlc3MuUFJJVkFURSxcbiAgICAgICAgICB2cGNTdWJuZXRzOiBbeyBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QVUJMSUMgfV0sXG4gICAgICAgIH0pO1xuICAgICAgfSkudG9UaHJvdygvVnBjIG11c3QgY29udGFpbiBwcml2YXRlIHN1Ym5ldHMgd2hlbiBwdWJsaWMgZW5kcG9pbnQgYWNjZXNzIGlzIGRpc2FibGVkLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdwcml2YXRlIHdpdGggcHJpdmF0ZSBzdWJuZXRzJywgKCkgPT4ge1xuICAgICAgY29uc3QgeyBzdGFjayB9ID0gdGVzdEZpeHR1cmUoKTtcblxuICAgICAgbmV3IGVrcy5DbHVzdGVyKHN0YWNrLCAnQ2x1c3RlcicsIHtcbiAgICAgICAgdmVyc2lvbjogQ0xVU1RFUl9WRVJTSU9OLFxuICAgICAgICBwcnVuZTogZmFsc2UsXG4gICAgICAgIGVuZHBvaW50QWNjZXNzOiBla3MuRW5kcG9pbnRBY2Nlc3MuUFJJVkFURSxcbiAgICAgICAga3ViZWN0bFByb3ZpZGVyT3B0aW9uczoge1xuICAgICAgICAgIGt1YmVjdGxMYXllcjogbmV3IEt1YmVjdGxWMzNMYXllcihzdGFjaywgJ2t1YmVjdGxMYXllcicpLFxuICAgICAgICB9LFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGZ1bmN0aW9ucyA9IFRlbXBsYXRlLmZyb21TdGFjayhzdGFjaykuZmluZFJlc291cmNlcygnQVdTOjpMYW1iZGE6OkZ1bmN0aW9uJyk7XG4gICAgICBleHBlY3QoZnVuY3Rpb25zLkNsdXN0ZXJLdWJlY3RsUHJvdmlkZXJmcmFtZXdvcmtvbkV2ZW50NjhFMENGODAuUHJvcGVydGllcy5WcGNDb25maWcuU3VibmV0SWRzLmxlbmd0aCkubm90LnRvRXF1YWwoMCk7XG4gICAgICBleHBlY3QoZnVuY3Rpb25zLkNsdXN0ZXJLdWJlY3RsUHJvdmlkZXJmcmFtZXdvcmtvbkV2ZW50NjhFMENGODAuUHJvcGVydGllcy5WcGNDb25maWcuU2VjdXJpdHlHcm91cElkcy5sZW5ndGgpLm5vdC50b0VxdWFsKDApO1xuICAgIH0pO1xuXG4gICAgdGVzdCgncHJpdmF0ZSBhbmQgbm9uIHJlc3RyaWN0ZWQgcHVibGljIHdpdGhvdXQgcHJpdmF0ZSBzdWJuZXRzJywgKCkgPT4ge1xuICAgICAgY29uc3QgeyBzdGFjayB9ID0gdGVzdEZpeHR1cmUoKTtcblxuICAgICAgbmV3IGVrcy5DbHVzdGVyKHN0YWNrLCAnQ2x1c3RlcicsIHtcbiAgICAgICAgdmVyc2lvbjogQ0xVU1RFUl9WRVJTSU9OLFxuICAgICAgICBwcnVuZTogZmFsc2UsXG4gICAgICAgIGVuZHBvaW50QWNjZXNzOiBla3MuRW5kcG9pbnRBY2Nlc3MuUFVCTElDX0FORF9QUklWQVRFLFxuICAgICAgICB2cGNTdWJuZXRzOiBbeyBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QVUJMSUMgfV0sXG4gICAgICAgIGt1YmVjdGxQcm92aWRlck9wdGlvbnM6IHtcbiAgICAgICAgICBrdWJlY3RsTGF5ZXI6IG5ldyBLdWJlY3RsVjMzTGF5ZXIoc3RhY2ssICdrdWJlY3RsTGF5ZXInKSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICAvLyB3ZSBkb24ndCBoYXZlIHByaXZhdGUgc3VibmV0cywgYnV0IHdlIGRvbid0IG5lZWQgdGhlbSBzaW5jZSBwdWJsaWMgYWNjZXNzXG4gICAgICAvLyBpcyBub3QgcmVzdHJpY3RlZC5cbiAgICAgIFRlbXBsYXRlLmZyb21TdGFjayhzdGFjaykuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkxhbWJkYTo6RnVuY3Rpb24nLCB7XG4gICAgICAgIFZwY0NvbmZpZzogTWF0Y2guYWJzZW50KCksXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ3ByaXZhdGUgYW5kIG5vbiByZXN0cmljdGVkIHB1YmxpYyB3aXRoIHByaXZhdGUgc3VibmV0cycsICgpID0+IHtcbiAgICAgIGNvbnN0IHsgc3RhY2sgfSA9IHRlc3RGaXh0dXJlKCk7XG5cbiAgICAgIG5ldyBla3MuQ2x1c3RlcihzdGFjaywgJ0NsdXN0ZXInLCB7XG4gICAgICAgIHZlcnNpb246IENMVVNURVJfVkVSU0lPTixcbiAgICAgICAgcHJ1bmU6IGZhbHNlLFxuICAgICAgICBlbmRwb2ludEFjY2VzczogZWtzLkVuZHBvaW50QWNjZXNzLlBVQkxJQ19BTkRfUFJJVkFURSxcbiAgICAgICAga3ViZWN0bFByb3ZpZGVyT3B0aW9uczoge1xuICAgICAgICAgIGt1YmVjdGxMYXllcjogbmV3IEt1YmVjdGxWMzNMYXllcihzdGFjaywgJ2t1YmVjdGxMYXllcicpLFxuICAgICAgICB9LFxuICAgICAgfSk7XG5cbiAgICAgIC8vIHdlIGhhdmUgcHJpdmF0ZSBzdWJuZXRzIHNvIHdlIHNob3VsZCB1c2UgdGhlbS5cbiAgICAgIGNvbnN0IGZ1bmN0aW9ucyA9IFRlbXBsYXRlLmZyb21TdGFjayhzdGFjaykuZmluZFJlc291cmNlcygnQVdTOjpMYW1iZGE6OkZ1bmN0aW9uJyk7XG4gICAgICBleHBlY3QoZnVuY3Rpb25zLkNsdXN0ZXJLdWJlY3RsUHJvdmlkZXJmcmFtZXdvcmtvbkV2ZW50NjhFMENGODAuUHJvcGVydGllcy5WcGNDb25maWcuU3VibmV0SWRzLmxlbmd0aCkubm90LnRvRXF1YWwoMCk7XG4gICAgICBleHBlY3QoZnVuY3Rpb25zLkNsdXN0ZXJLdWJlY3RsUHJvdmlkZXJmcmFtZXdvcmtvbkV2ZW50NjhFMENGODAuUHJvcGVydGllcy5WcGNDb25maWcuU2VjdXJpdHlHcm91cElkcy5sZW5ndGgpLm5vdC50b0VxdWFsKDApO1xuICAgIH0pO1xuXG4gICAgdGVzdCgncHJpdmF0ZSBhbmQgcmVzdHJpY3RlZCBwdWJsaWMgd2l0aG91dCBwcml2YXRlIHN1Ym5ldHMnLCAoKSA9PiB7XG4gICAgICBjb25zdCB7IHN0YWNrIH0gPSB0ZXN0Rml4dHVyZSgpO1xuXG4gICAgICBleHBlY3QoKCkgPT4ge1xuICAgICAgICBuZXcgZWtzLkNsdXN0ZXIoc3RhY2ssICdDbHVzdGVyJywge1xuICAgICAgICAgIHZlcnNpb246IENMVVNURVJfVkVSU0lPTixcbiAgICAgICAgICBwcnVuZTogZmFsc2UsXG4gICAgICAgICAgZW5kcG9pbnRBY2Nlc3M6IGVrcy5FbmRwb2ludEFjY2Vzcy5QVUJMSUNfQU5EX1BSSVZBVEUub25seUZyb20oJzEuMi4zLjQvMzInKSxcbiAgICAgICAgICB2cGNTdWJuZXRzOiBbeyBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QVUJMSUMgfV0sXG4gICAgICAgIH0pO1xuICAgICAgfSkudG9UaHJvdygvVnBjIG11c3QgY29udGFpbiBwcml2YXRlIHN1Ym5ldHMgd2hlbiBwdWJsaWMgZW5kcG9pbnQgYWNjZXNzIGlzIHJlc3RyaWN0ZWQvKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ3ByaXZhdGUgYW5kIHJlc3RyaWN0ZWQgcHVibGljIHdpdGggcHJpdmF0ZSBzdWJuZXRzJywgKCkgPT4ge1xuICAgICAgY29uc3QgeyBzdGFjayB9ID0gdGVzdEZpeHR1cmUoKTtcblxuICAgICAgbmV3IGVrcy5DbHVzdGVyKHN0YWNrLCAnQ2x1c3RlcicsIHtcbiAgICAgICAgdmVyc2lvbjogQ0xVU1RFUl9WRVJTSU9OLFxuICAgICAgICBwcnVuZTogZmFsc2UsXG4gICAgICAgIGVuZHBvaW50QWNjZXNzOiBla3MuRW5kcG9pbnRBY2Nlc3MuUFVCTElDX0FORF9QUklWQVRFLm9ubHlGcm9tKCcxLjIuMy40LzMyJyksXG4gICAgICAgIGt1YmVjdGxQcm92aWRlck9wdGlvbnM6IHtcbiAgICAgICAgICBrdWJlY3RsTGF5ZXI6IG5ldyBLdWJlY3RsVjMzTGF5ZXIoc3RhY2ssICdrdWJlY3RsTGF5ZXInKSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICAvLyB3ZSBoYXZlIHByaXZhdGUgc3VibmV0cyBzbyB3ZSBzaG91bGQgdXNlIHRoZW0uXG4gICAgICBjb25zdCBmdW5jdGlvbnMgPSBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spLmZpbmRSZXNvdXJjZXMoJ0FXUzo6TGFtYmRhOjpGdW5jdGlvbicpO1xuICAgICAgZXhwZWN0KGZ1bmN0aW9ucy5DbHVzdGVyS3ViZWN0bFByb3ZpZGVyZnJhbWV3b3Jrb25FdmVudDY4RTBDRjgwLlByb3BlcnRpZXMuVnBjQ29uZmlnLlN1Ym5ldElkcy5sZW5ndGgpLm5vdC50b0VxdWFsKDApO1xuICAgICAgZXhwZWN0KGZ1bmN0aW9ucy5DbHVzdGVyS3ViZWN0bFByb3ZpZGVyZnJhbWV3b3Jrb25FdmVudDY4RTBDRjgwLlByb3BlcnRpZXMuVnBjQ29uZmlnLlNlY3VyaXR5R3JvdXBJZHMubGVuZ3RoKS5ub3QudG9FcXVhbCgwKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ3ByaXZhdGUgZW5kcG9pbnQgYWNjZXNzIHNlbGVjdHMgb25seSBwcml2YXRlIHN1Ym5ldHMgZnJvbSBsb29rZWQgdXAgdnBjJywgKCkgPT4ge1xuICAgICAgY29uc3QgdnBjSWQgPSAndnBjLTEyMzQ1JztcbiAgICAgIC8vIGNhbid0IHVzZSB0aGUgcmVndWxhciBmaXh0dXJlIGJlY2F1c2UgaXQgYWxzbyBhZGRzIGEgVlBDIHRvIHRoZSBzdGFjaywgd2hpY2ggcHJldmVudHNcbiAgICAgIC8vIHVzIGZyb20gc2V0dGluZyBjb250ZXh0LlxuICAgICAgY29uc3Qgc3RhY2sgPSBuZXcgY2RrLlN0YWNrKG5ldyBjZGsuQXBwKCksICdTdGFjaycsIHtcbiAgICAgICAgZW52OiB7XG4gICAgICAgICAgYWNjb3VudDogJzExMTEyMjIyJyxcbiAgICAgICAgICByZWdpb246ICd1cy1lYXN0LTEnLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICBzdGFjay5ub2RlLnNldENvbnRleHQoYHZwYy1wcm92aWRlcjphY2NvdW50PSR7c3RhY2suYWNjb3VudH06ZmlsdGVyLnZwYy1pZD0ke3ZwY0lkfTpyZWdpb249JHtzdGFjay5yZWdpb259OnJldHVybkFzeW1tZXRyaWNTdWJuZXRzPXRydWVgLCB7XG4gICAgICAgIHZwY0lkOiB2cGNJZCxcbiAgICAgICAgdnBjQ2lkckJsb2NrOiAnMTAuMC4wLjAvMTYnLFxuICAgICAgICBzdWJuZXRHcm91cHM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBuYW1lOiAnUHJpdmF0ZScsXG4gICAgICAgICAgICB0eXBlOiAnUHJpdmF0ZScsXG4gICAgICAgICAgICBzdWJuZXRzOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzdWJuZXRJZDogJ3N1Ym5ldC1wcml2YXRlLWluLXVzLWVhc3QtMWEnLFxuICAgICAgICAgICAgICAgIGNpZHI6ICcxMC4wLjEuMC8yNCcsXG4gICAgICAgICAgICAgICAgYXZhaWxhYmlsaXR5Wm9uZTogJ3VzLWVhc3QtMWEnLFxuICAgICAgICAgICAgICAgIHJvdXRlVGFibGVJZDogJ3J0Yi0wNjA2OGU0YzQwNDk5MjFlZicsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZTogJ1B1YmxpYycsXG4gICAgICAgICAgICB0eXBlOiAnUHVibGljJyxcbiAgICAgICAgICAgIHN1Ym5ldHM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHN1Ym5ldElkOiAnc3VibmV0LXB1YmxpYy1pbi11cy1lYXN0LTFjJyxcbiAgICAgICAgICAgICAgICBjaWRyOiAnMTAuMC4wLjAvMjQnLFxuICAgICAgICAgICAgICAgIGF2YWlsYWJpbGl0eVpvbmU6ICd1cy1lYXN0LTFjJyxcbiAgICAgICAgICAgICAgICByb3V0ZVRhYmxlSWQ6ICdydGItMGZmMDhlNjIxOTUxOThkYmInLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSk7XG4gICAgICBjb25zdCB2cGMgPSBlYzIuVnBjLmZyb21Mb29rdXAoc3RhY2ssICdWcGMnLCB7XG4gICAgICAgIHZwY0lkOiB2cGNJZCxcbiAgICAgIH0pO1xuXG4gICAgICBuZXcgZWtzLkNsdXN0ZXIoc3RhY2ssICdDbHVzdGVyJywge1xuICAgICAgICB2cGMsXG4gICAgICAgIHZlcnNpb246IENMVVNURVJfVkVSU0lPTixcbiAgICAgICAgcHJ1bmU6IGZhbHNlLFxuICAgICAgICBlbmRwb2ludEFjY2VzczogZWtzLkVuZHBvaW50QWNjZXNzLlBSSVZBVEUsXG4gICAgICAgIGt1YmVjdGxQcm92aWRlck9wdGlvbnM6IHtcbiAgICAgICAgICBrdWJlY3RsTGF5ZXI6IG5ldyBLdWJlY3RsVjMzTGF5ZXIoc3RhY2ssICdrdWJlY3RsTGF5ZXInKSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpMYW1iZGE6OkZ1bmN0aW9uJywge1xuICAgICAgICBWcGNDb25maWc6IHsgU3VibmV0SWRzOiBbJ3N1Ym5ldC1wcml2YXRlLWluLXVzLWVhc3QtMWEnXSB9LFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdwcml2YXRlIGVuZHBvaW50IGFjY2VzcyBzZWxlY3RzIG9ubHkgcHJpdmF0ZSBzdWJuZXRzIGZyb20gbG9va2VkIHVwIHZwYyB3aXRoIGNvbmNyZXRlIHN1Ym5ldCBzZWxlY3Rpb24nLCAoKSA9PiB7XG4gICAgICBjb25zdCB2cGNJZCA9ICd2cGMtMTIzNDUnO1xuICAgICAgLy8gY2FuJ3QgdXNlIHRoZSByZWd1bGFyIGZpeHR1cmUgYmVjYXVzZSBpdCBhbHNvIGFkZHMgYSBWUEMgdG8gdGhlIHN0YWNrLCB3aGljaCBwcmV2ZW50c1xuICAgICAgLy8gdXMgZnJvbSBzZXR0aW5nIGNvbnRleHQuXG4gICAgICBjb25zdCBzdGFjayA9IG5ldyBjZGsuU3RhY2sobmV3IGNkay5BcHAoKSwgJ1N0YWNrJywge1xuICAgICAgICBlbnY6IHtcbiAgICAgICAgICBhY2NvdW50OiAnMTExMTIyMjInLFxuICAgICAgICAgIHJlZ2lvbjogJ3VzLWVhc3QtMScsXG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgc3RhY2subm9kZS5zZXRDb250ZXh0KGB2cGMtcHJvdmlkZXI6YWNjb3VudD0ke3N0YWNrLmFjY291bnR9OmZpbHRlci52cGMtaWQ9JHt2cGNJZH06cmVnaW9uPSR7c3RhY2sucmVnaW9ufTpyZXR1cm5Bc3ltbWV0cmljU3VibmV0cz10cnVlYCwge1xuICAgICAgICB2cGNJZDogdnBjSWQsXG4gICAgICAgIHZwY0NpZHJCbG9jazogJzEwLjAuMC4wLzE2JyxcbiAgICAgICAgc3VibmV0R3JvdXBzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZTogJ1ByaXZhdGUnLFxuICAgICAgICAgICAgdHlwZTogJ1ByaXZhdGUnLFxuICAgICAgICAgICAgc3VibmV0czogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgc3VibmV0SWQ6ICdzdWJuZXQtcHJpdmF0ZS1pbi11cy1lYXN0LTFhJyxcbiAgICAgICAgICAgICAgICBjaWRyOiAnMTAuMC4xLjAvMjQnLFxuICAgICAgICAgICAgICAgIGF2YWlsYWJpbGl0eVpvbmU6ICd1cy1lYXN0LTFhJyxcbiAgICAgICAgICAgICAgICByb3V0ZVRhYmxlSWQ6ICdydGItMDYwNjhlNGM0MDQ5OTIxZWYnLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIG5hbWU6ICdQdWJsaWMnLFxuICAgICAgICAgICAgdHlwZTogJ1B1YmxpYycsXG4gICAgICAgICAgICBzdWJuZXRzOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzdWJuZXRJZDogJ3N1Ym5ldC1wdWJsaWMtaW4tdXMtZWFzdC0xYycsXG4gICAgICAgICAgICAgICAgY2lkcjogJzEwLjAuMC4wLzI0JyxcbiAgICAgICAgICAgICAgICBhdmFpbGFiaWxpdHlab25lOiAndXMtZWFzdC0xYycsXG4gICAgICAgICAgICAgICAgcm91dGVUYWJsZUlkOiAncnRiLTBmZjA4ZTYyMTk1MTk4ZGJiJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCB2cGMgPSBlYzIuVnBjLmZyb21Mb29rdXAoc3RhY2ssICdWcGMnLCB7XG4gICAgICAgIHZwY0lkOiB2cGNJZCxcbiAgICAgIH0pO1xuXG4gICAgICBuZXcgZWtzLkNsdXN0ZXIoc3RhY2ssICdDbHVzdGVyJywge1xuICAgICAgICB2cGMsXG4gICAgICAgIHZlcnNpb246IENMVVNURVJfVkVSU0lPTixcbiAgICAgICAgcHJ1bmU6IGZhbHNlLFxuICAgICAgICBlbmRwb2ludEFjY2VzczogZWtzLkVuZHBvaW50QWNjZXNzLlBSSVZBVEUsXG4gICAgICAgIHZwY1N1Ym5ldHM6IFt7XG4gICAgICAgICAgc3VibmV0czogW1xuICAgICAgICAgICAgZWMyLlN1Ym5ldC5mcm9tU3VibmV0SWQoc3RhY2ssICdQcml2YXRlJywgJ3N1Ym5ldC1wcml2YXRlLWluLXVzLWVhc3QtMWEnKSxcbiAgICAgICAgICAgIGVjMi5TdWJuZXQuZnJvbVN1Ym5ldElkKHN0YWNrLCAnUHVibGljJywgJ3N1Ym5ldC1wdWJsaWMtaW4tdXMtZWFzdC0xYycpLFxuICAgICAgICAgIF0sXG4gICAgICAgIH1dLFxuICAgICAgICBrdWJlY3RsUHJvdmlkZXJPcHRpb25zOiB7XG4gICAgICAgICAga3ViZWN0bExheWVyOiBuZXcgS3ViZWN0bFYzM0xheWVyKHN0YWNrLCAna3ViZWN0bExheWVyJyksXG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6TGFtYmRhOjpGdW5jdGlvbicsIHtcbiAgICAgICAgVnBjQ29uZmlnOiB7IFN1Ym5ldElkczogWydzdWJuZXQtcHJpdmF0ZS1pbi11cy1lYXN0LTFhJ10gfSxcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGVzdCgncHJpdmF0ZSBlbmRwb2ludCBhY2Nlc3Mgc2VsZWN0cyBvbmx5IHByaXZhdGUgc3VibmV0cyBmcm9tIG1hbmFnZWQgdnBjIHdpdGggY29uY3JldGUgc3VibmV0IHNlbGVjdGlvbicsICgpID0+IHtcbiAgICAgIGNvbnN0IHsgc3RhY2sgfSA9IHRlc3RGaXh0dXJlKCk7XG5cbiAgICAgIGNvbnN0IHZwYyA9IG5ldyBlYzIuVnBjKHN0YWNrLCAnVnBjJyk7XG5cbiAgICAgIG5ldyBla3MuQ2x1c3RlcihzdGFjaywgJ0NsdXN0ZXInLCB7XG4gICAgICAgIHZwYyxcbiAgICAgICAgdmVyc2lvbjogQ0xVU1RFUl9WRVJTSU9OLFxuICAgICAgICBwcnVuZTogZmFsc2UsXG4gICAgICAgIGVuZHBvaW50QWNjZXNzOiBla3MuRW5kcG9pbnRBY2Nlc3MuUFJJVkFURSxcbiAgICAgICAgdnBjU3VibmV0czogW3tcbiAgICAgICAgICBzdWJuZXRzOiBbXG4gICAgICAgICAgICB2cGMucHJpdmF0ZVN1Ym5ldHNbMF0sXG4gICAgICAgICAgICB2cGMucHVibGljU3VibmV0c1sxXSxcbiAgICAgICAgICAgIGVjMi5TdWJuZXQuZnJvbVN1Ym5ldElkKHN0YWNrLCAnUHJpdmF0ZScsICdzdWJuZXQtdW5rbm93bicpLFxuICAgICAgICAgIF0sXG4gICAgICAgIH1dLFxuICAgICAgICBrdWJlY3RsUHJvdmlkZXJPcHRpb25zOiB7XG4gICAgICAgICAga3ViZWN0bExheWVyOiBuZXcgS3ViZWN0bFYzM0xheWVyKHN0YWNrLCAna3ViZWN0bExheWVyJyksXG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6TGFtYmRhOjpGdW5jdGlvbicsIHtcbiAgICAgICAgVnBjQ29uZmlnOiB7XG4gICAgICAgICAgU3VibmV0SWRzOiBbXG4gICAgICAgICAgICB7IFJlZjogJ1ZwY1ByaXZhdGVTdWJuZXQxU3VibmV0NTM2Qjk5N0EnIH0sXG4gICAgICAgICAgICAnc3VibmV0LXVua25vd24nLFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ3ByaXZhdGUgZW5kcG9pbnQgYWNjZXNzIGNvbnNpZGVycyBzcGVjaWZpYyBzdWJuZXQgc2VsZWN0aW9uJywgKCkgPT4ge1xuICAgICAgY29uc3QgeyBzdGFjayB9ID0gdGVzdEZpeHR1cmUoKTtcbiAgICAgIG5ldyBla3MuQ2x1c3RlcihzdGFjaywgJ0NsdXN0ZXInLCB7XG4gICAgICAgIHZlcnNpb246IENMVVNURVJfVkVSU0lPTixcbiAgICAgICAgcHJ1bmU6IGZhbHNlLFxuICAgICAgICBlbmRwb2ludEFjY2VzczpcbiAgICAgICAgICBla3MuRW5kcG9pbnRBY2Nlc3MuUFJJVkFURSxcbiAgICAgICAgdnBjU3VibmV0czogW3tcbiAgICAgICAgICBzdWJuZXRzOiBbZWMyLlByaXZhdGVTdWJuZXQuZnJvbVN1Ym5ldEF0dHJpYnV0ZXMoc3RhY2ssICdQcml2YXRlMScsIHtcbiAgICAgICAgICAgIHN1Ym5ldElkOiAnc3VibmV0MScsXG4gICAgICAgICAgICBhdmFpbGFiaWxpdHlab25lOiAndXMtZWFzdC0xYScsXG4gICAgICAgICAgfSldLFxuICAgICAgICB9XSxcbiAgICAgICAga3ViZWN0bFByb3ZpZGVyT3B0aW9uczoge1xuICAgICAgICAgIGt1YmVjdGxMYXllcjogbmV3IEt1YmVjdGxWMzNMYXllcihzdGFjaywgJ2t1YmVjdGxMYXllcicpLFxuICAgICAgICB9LFxuICAgICAgfSk7XG5cbiAgICAgIFRlbXBsYXRlLmZyb21TdGFjayhzdGFjaykuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkxhbWJkYTo6RnVuY3Rpb24nLCB7XG4gICAgICAgIFZwY0NvbmZpZzogeyBTdWJuZXRJZHM6IFsnc3VibmV0MSddIH0sXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ2NhbiBjb25maWd1cmUgcHJpdmF0ZSBlbmRwb2ludCBhY2Nlc3MnLCAoKSA9PiB7XG4gICAgICAvLyBHSVZFTlxuICAgICAgY29uc3QgeyBzdGFjayB9ID0gdGVzdEZpeHR1cmUoKTtcbiAgICAgIG5ldyBla3MuQ2x1c3RlcihzdGFjaywgJ0NsdXN0ZXIxJywgeyB2ZXJzaW9uOiBDTFVTVEVSX1ZFUlNJT04sIGVuZHBvaW50QWNjZXNzOiBla3MuRW5kcG9pbnRBY2Nlc3MuUFJJVkFURSwgcHJ1bmU6IGZhbHNlIH0pO1xuXG4gICAgICBjb25zdCBhcHAgPSBzdGFjay5ub2RlLnJvb3QgYXMgY2RrLkFwcDtcbiAgICAgIGNvbnN0IHRlbXBsYXRlID0gYXBwLnN5bnRoKCkuZ2V0U3RhY2tBcnRpZmFjdChzdGFjay5zdGFja05hbWUpLnRlbXBsYXRlO1xuICAgICAgZXhwZWN0KHRlbXBsYXRlLlJlc291cmNlcy5DbHVzdGVyMTkyQ0QwMzc1LlByb3BlcnRpZXMuUmVzb3VyY2VzVnBjQ29uZmlnLkVuZHBvaW50UHJpdmF0ZUFjY2VzcykudG9FcXVhbCh0cnVlKTtcbiAgICAgIGV4cGVjdCh0ZW1wbGF0ZS5SZXNvdXJjZXMuQ2x1c3RlcjE5MkNEMDM3NS5Qcm9wZXJ0aWVzLlJlc291cmNlc1ZwY0NvbmZpZy5FbmRwb2ludFB1YmxpY0FjY2VzcykudG9FcXVhbChmYWxzZSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdrdWJlY3RsIHByb3ZpZGVyIGNob29zZXMgb25seSBwcml2YXRlIHN1Ym5ldHMnLCAoKSA9PiB7XG4gICAgICBjb25zdCB7IHN0YWNrIH0gPSB0ZXN0Rml4dHVyZSgpO1xuXG4gICAgICBjb25zdCB2cGMgPSBuZXcgZWMyLlZwYyhzdGFjaywgJ1ZwYycsIHtcbiAgICAgICAgbWF4QXpzOiAyLFxuICAgICAgICBuYXRHYXRld2F5czogMSxcbiAgICAgICAgc3VibmV0Q29uZmlndXJhdGlvbjogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBSSVZBVEVfV0lUSF9FR1JFU1MsXG4gICAgICAgICAgICBuYW1lOiAnUHJpdmF0ZTEnLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFVCTElDLFxuICAgICAgICAgICAgbmFtZTogJ1B1YmxpYzEnLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgY2x1c3RlciA9IG5ldyBla3MuQ2x1c3RlcihzdGFjaywgJ0NsdXN0ZXIxJywge1xuICAgICAgICB2ZXJzaW9uOiBDTFVTVEVSX1ZFUlNJT04sXG4gICAgICAgIHBydW5lOiBmYWxzZSxcbiAgICAgICAgZW5kcG9pbnRBY2Nlc3M6IGVrcy5FbmRwb2ludEFjY2Vzcy5QUklWQVRFLFxuICAgICAgICB2cGMsXG4gICAgICAgIGt1YmVjdGxQcm92aWRlck9wdGlvbnM6IHtcbiAgICAgICAgICBrdWJlY3RsTGF5ZXI6IG5ldyBLdWJlY3RsVjMzTGF5ZXIoc3RhY2ssICdrdWJlY3RsTGF5ZXInKSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICBjbHVzdGVyLmFkZE1hbmlmZXN0KCdyZXNvdXJjZScsIHtcbiAgICAgICAga2luZDogJ0NvbmZpZ01hcCcsXG4gICAgICAgIGFwaVZlcnNpb246ICd2MScsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICBoZWxsbzogJ3dvcmxkJyxcbiAgICAgICAgfSxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICBuYW1lOiAnY29uZmlnLW1hcCcsXG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6TGFtYmRhOjpGdW5jdGlvbicsIHtcbiAgICAgICAgVnBjQ29uZmlnOiB7XG4gICAgICAgICAgU2VjdXJpdHlHcm91cElkczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAnRm46OkdldEF0dCc6IFsnQ2x1c3RlcjE5MkNEMDM3NScsICdDbHVzdGVyU2VjdXJpdHlHcm91cElkJ10sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgICAgU3VibmV0SWRzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFJlZjogJ1ZwY1ByaXZhdGUxU3VibmV0MVN1Ym5ldEM2ODhCMkIxJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFJlZjogJ1ZwY1ByaXZhdGUxU3VibmV0MlN1Ym5ldEEyQUYxNUM3JyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGVzdCgna3ViZWN0bCBwcm92aWRlciBjb25zaWRlcnMgdnBjIHN1Ym5ldCBzZWxlY3Rpb24nLCAoKSA9PiB7XG4gICAgICBjb25zdCB7IHN0YWNrIH0gPSB0ZXN0Rml4dHVyZSgpO1xuXG4gICAgICBjb25zdCBzdWJuZXRDb25maWd1cmF0aW9uOiBlYzIuU3VibmV0Q29uZmlndXJhdGlvbltdID0gW107XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMjA7IGkrKykge1xuICAgICAgICBzdWJuZXRDb25maWd1cmF0aW9uLnB1c2goe1xuICAgICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBSSVZBVEVfV0lUSF9FR1JFU1MsXG4gICAgICAgICAgbmFtZTogYFByaXZhdGUke2l9YCxcbiAgICAgICAgfSxcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgc3VibmV0Q29uZmlndXJhdGlvbi5wdXNoKHtcbiAgICAgICAgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFVCTElDLFxuICAgICAgICBuYW1lOiAnUHVibGljMScsXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgdnBjMiA9IG5ldyBlYzIuVnBjKHN0YWNrLCAnVnBjJywge1xuICAgICAgICBtYXhBenM6IDIsXG4gICAgICAgIG5hdEdhdGV3YXlzOiAxLFxuICAgICAgICBzdWJuZXRDb25maWd1cmF0aW9uLFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGNsdXN0ZXIgPSBuZXcgZWtzLkNsdXN0ZXIoc3RhY2ssICdDbHVzdGVyMScsIHtcbiAgICAgICAgdmVyc2lvbjogQ0xVU1RFUl9WRVJTSU9OLFxuICAgICAgICBwcnVuZTogZmFsc2UsXG4gICAgICAgIGVuZHBvaW50QWNjZXNzOiBla3MuRW5kcG9pbnRBY2Nlc3MuUFJJVkFURSxcbiAgICAgICAgdnBjOiB2cGMyLFxuICAgICAgICB2cGNTdWJuZXRzOiBbeyBzdWJuZXRHcm91cE5hbWU6ICdQcml2YXRlMScgfSwgeyBzdWJuZXRHcm91cE5hbWU6ICdQcml2YXRlMicgfV0sXG4gICAgICAgIGt1YmVjdGxQcm92aWRlck9wdGlvbnM6IHtcbiAgICAgICAgICBrdWJlY3RsTGF5ZXI6IG5ldyBLdWJlY3RsVjMzTGF5ZXIoc3RhY2ssICdrdWJlY3RsTGF5ZXInKSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICBjbHVzdGVyLmFkZE1hbmlmZXN0KCdyZXNvdXJjZScsIHtcbiAgICAgICAga2luZDogJ0NvbmZpZ01hcCcsXG4gICAgICAgIGFwaVZlcnNpb246ICd2MScsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICBoZWxsbzogJ3dvcmxkJyxcbiAgICAgICAgfSxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICBuYW1lOiAnY29uZmlnLW1hcCcsXG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6TGFtYmRhOjpGdW5jdGlvbicsIHtcbiAgICAgICAgVnBjQ29uZmlnOiB7XG4gICAgICAgICAgU2VjdXJpdHlHcm91cElkczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAnRm46OkdldEF0dCc6IFsnQ2x1c3RlcjE5MkNEMDM3NScsICdDbHVzdGVyU2VjdXJpdHlHcm91cElkJ10sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgICAgU3VibmV0SWRzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFJlZjogJ1ZwY1ByaXZhdGUxU3VibmV0MVN1Ym5ldEM2ODhCMkIxJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFJlZjogJ1ZwY1ByaXZhdGUxU3VibmV0MlN1Ym5ldEEyQUYxNUM3JyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFJlZjogJ1ZwY1ByaXZhdGUyU3VibmV0MVN1Ym5ldEUxM0UyRTMwJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFJlZjogJ1ZwY1ByaXZhdGUyU3VibmV0MlN1Ym5ldDE1OEEzOEFCJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGVzdCgndGhyb3cgd2hlbiBwcml2YXRlIGFjY2VzcyBpcyBjb25maWd1cmVkIHdpdGhvdXQgZG5zIHN1cHBvcnQgZW5hYmxlZCBmb3IgdGhlIFZQQycsICgpID0+IHtcbiAgICAgIGNvbnN0IHsgc3RhY2sgfSA9IHRlc3RGaXh0dXJlKCk7XG5cbiAgICAgIGV4cGVjdCgoKSA9PiB7XG4gICAgICAgIG5ldyBla3MuQ2x1c3RlcihzdGFjaywgJ0NsdXN0ZXInLCB7XG4gICAgICAgICAgdnBjOiBuZXcgZWMyLlZwYyhzdGFjaywgJ1ZwYycsIHtcbiAgICAgICAgICAgIGVuYWJsZURuc1N1cHBvcnQ6IGZhbHNlLFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIHZlcnNpb246IENMVVNURVJfVkVSU0lPTixcbiAgICAgICAgICBwcnVuZTogZmFsc2UsXG4gICAgICAgIH0pO1xuICAgICAgfSkudG9UaHJvdygvUHJpdmF0ZSBlbmRwb2ludCBhY2Nlc3MgcmVxdWlyZXMgdGhlIFZQQyB0byBoYXZlIEROUyBzdXBwb3J0IGFuZCBETlMgaG9zdG5hbWVzIGVuYWJsZWQvKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ3Rocm93IHdoZW4gcHJpdmF0ZSBhY2Nlc3MgaXMgY29uZmlndXJlZCB3aXRob3V0IGRucyBob3N0bmFtZXMgZW5hYmxlZCBmb3IgdGhlIFZQQycsICgpID0+IHtcbiAgICAgIGNvbnN0IHsgc3RhY2sgfSA9IHRlc3RGaXh0dXJlKCk7XG5cbiAgICAgIGV4cGVjdCgoKSA9PiB7XG4gICAgICAgIG5ldyBla3MuQ2x1c3RlcihzdGFjaywgJ0NsdXN0ZXInLCB7XG4gICAgICAgICAgdnBjOiBuZXcgZWMyLlZwYyhzdGFjaywgJ1ZwYycsIHtcbiAgICAgICAgICAgIGVuYWJsZURuc0hvc3RuYW1lczogZmFsc2UsXG4gICAgICAgICAgfSksXG4gICAgICAgICAgdmVyc2lvbjogQ0xVU1RFUl9WRVJTSU9OLFxuICAgICAgICAgIHBydW5lOiBmYWxzZSxcbiAgICAgICAgfSk7XG4gICAgICB9KS50b1Rocm93KC9Qcml2YXRlIGVuZHBvaW50IGFjY2VzcyByZXF1aXJlcyB0aGUgVlBDIHRvIGhhdmUgRE5TIHN1cHBvcnQgYW5kIEROUyBob3N0bmFtZXMgZW5hYmxlZC8pO1xuICAgIH0pO1xuXG4gICAgdGVzdCgndGhyb3cgd2hlbiBjaWRycyBhcmUgY29uZmlndXJlZCB3aXRob3V0IHB1YmxpYyBhY2Nlc3MgZW5kcG9pbnQnLCAoKSA9PiB7XG4gICAgICBleHBlY3QoKCkgPT4ge1xuICAgICAgICBla3MuRW5kcG9pbnRBY2Nlc3MuUFJJVkFURS5vbmx5RnJvbSgnMS4yLjMuNC81Jyk7XG4gICAgICB9KS50b1Rocm93KC9DSURSIGJsb2NrcyBjYW4gb25seSBiZSBjb25maWd1cmVkIHdoZW4gcHVibGljIGFjY2VzcyBpcyBlbmFibGVkLyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIHRlc3QoJ2dldFNlcnZpY2VMb2FkQmFsYW5jZXJBZGRyZXNzJywgKCkgPT4ge1xuICAgIGNvbnN0IHsgc3RhY2sgfSA9IHRlc3RGaXh0dXJlKCk7XG4gICAgY29uc3QgY2x1c3RlciA9IG5ldyBla3MuQ2x1c3RlcihzdGFjaywgJ0NsdXN0ZXIxJywge1xuICAgICAgdmVyc2lvbjogQ0xVU1RFUl9WRVJTSU9OLFxuICAgICAgcHJ1bmU6IGZhbHNlLFxuICAgICAga3ViZWN0bFByb3ZpZGVyT3B0aW9uczoge1xuICAgICAgICBrdWJlY3RsTGF5ZXI6IG5ldyBLdWJlY3RsVjMzTGF5ZXIoc3RhY2ssICdrdWJlY3RsTGF5ZXInKSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBsb2FkQmFsYW5jZXJBZGRyZXNzID0gY2x1c3Rlci5nZXRTZXJ2aWNlTG9hZEJhbGFuY2VyQWRkcmVzcygnbXlzZXJ2aWNlJyk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dChzdGFjaywgJ0xvYWRCYWxhbmNlckFkZHJlc3MnLCB7XG4gICAgICB2YWx1ZTogbG9hZEJhbGFuY2VyQWRkcmVzcyxcbiAgICB9KTtcblxuICAgIGNvbnN0IGV4cGVjdGVkS3ViZXJuZXRlc0dldElkID0gJ0NsdXN0ZXIxbXlzZXJ2aWNlTG9hZEJhbGFuY2VyQWRkcmVzczE5OENDQjAzJztcblxuICAgIGxldCB0ZW1wbGF0ZSA9IFRlbXBsYXRlLmZyb21TdGFjayhzdGFjayk7XG4gICAgY29uc3QgcmVzb3VyY2VzID0gdGVtcGxhdGUuZmluZFJlc291cmNlcygnQ3VzdG9tOjpBV1NDREstRUtTLUt1YmVybmV0ZXNPYmplY3RWYWx1ZScpO1xuXG4gICAgLy8gbWFrZSBzdXJlIHRoZSBjdXN0b20gcmVzb3VyY2UgaXMgY3JlYXRlZCBjb3JyZWN0bHlcbiAgICBleHBlY3QocmVzb3VyY2VzW2V4cGVjdGVkS3ViZXJuZXRlc0dldElkXS5Qcm9wZXJ0aWVzKS50b0VxdWFsKHtcbiAgICAgIFNlcnZpY2VUb2tlbjoge1xuICAgICAgICAnRm46OkdldEF0dCc6IFtcbiAgICAgICAgICAnQ2x1c3RlcjFLdWJlY3RsUHJvdmlkZXJmcmFtZXdvcmtvbkV2ZW50QkIzOThDQUUnLFxuICAgICAgICAgICdBcm4nLFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICAgIENsdXN0ZXJOYW1lOiB7XG4gICAgICAgIFJlZjogJ0NsdXN0ZXIxOTJDRDAzNzUnLFxuICAgICAgfSxcbiAgICAgIE9iamVjdFR5cGU6ICdzZXJ2aWNlJyxcbiAgICAgIE9iamVjdE5hbWU6ICdteXNlcnZpY2UnLFxuICAgICAgT2JqZWN0TmFtZXNwYWNlOiAnZGVmYXVsdCcsXG4gICAgICBKc29uUGF0aDogJy5zdGF0dXMubG9hZEJhbGFuY2VyLmluZ3Jlc3NbMF0uaG9zdG5hbWUnLFxuICAgICAgVGltZW91dFNlY29uZHM6IDMwMCxcbiAgICB9KTtcblxuICAgIC8vIG1ha2Ugc3VyZSB0aGUgYXR0cmlidXRlIHBvaW50cyB0byB0aGUgZXhwZWN0ZWQgY3VzdG9tIHJlc291cmNlIGFuZCBleHRyYWN0cyB0aGUgY29ycmVjdCBhdHRyaWJ1dGVcbiAgICB0ZW1wbGF0ZS5oYXNPdXRwdXQoJ0xvYWRCYWxhbmNlckFkZHJlc3MnLCB7XG4gICAgICBWYWx1ZTogeyAnRm46OkdldEF0dCc6IFtleHBlY3RlZEt1YmVybmV0ZXNHZXRJZCwgJ1ZhbHVlJ10gfSxcbiAgICB9KTtcbiAgfSk7XG5cbiAgdGVzdCgnY3VzdG9tIGt1YmVjdGwgbGF5ZXIgY2FuIGJlIHByb3ZpZGVkJywgKCkgPT4ge1xuICAgIC8vIEdJVkVOXG4gICAgY29uc3QgeyBzdGFjayB9ID0gdGVzdEZpeHR1cmUoKTtcblxuICAgIC8vIFdIRU5cbiAgICBjb25zdCBsYXllciA9IGxhbWJkYS5MYXllclZlcnNpb24uZnJvbUxheWVyVmVyc2lvbkFybihzdGFjaywgJ015TGF5ZXInLCAnYXJuOm9mOmxheWVyJyk7XG4gICAgbmV3IGVrcy5DbHVzdGVyKHN0YWNrLCAnQ2x1c3RlcjEnLCB7XG4gICAgICB2ZXJzaW9uOiBDTFVTVEVSX1ZFUlNJT04sXG4gICAgICBwcnVuZTogZmFsc2UsXG4gICAgICBrdWJlY3RsUHJvdmlkZXJPcHRpb25zOiB7XG4gICAgICAgIGt1YmVjdGxMYXllcjogbGF5ZXIsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gVEhFTlxuICAgIFRlbXBsYXRlLmZyb21TdGFjayhzdGFjaykuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkxhbWJkYTo6RnVuY3Rpb24nLCB7XG4gICAgICBMYXllcnM6IFtcbiAgICAgICAgeyBSZWY6ICdDbHVzdGVyMUt1YmVjdGxQcm92aWRlckF3c0NsaUxheWVyNUNGNTAzMjEnIH0sXG4gICAgICAgICdhcm46b2Y6bGF5ZXInLFxuICAgICAgXSxcbiAgICB9KTtcbiAgfSk7XG5cbiAgdGVzdCgnY3VzdG9tIGF3c2NsaSBsYXllciBjYW4gYmUgcHJvdmlkZWQnLCAoKSA9PiB7XG4gICAgLy8gR0lWRU5cbiAgICBjb25zdCB7IHN0YWNrIH0gPSB0ZXN0Rml4dHVyZSgpO1xuXG4gICAgLy8gV0hFTlxuICAgIGNvbnN0IGxheWVyID0gbGFtYmRhLkxheWVyVmVyc2lvbi5mcm9tTGF5ZXJWZXJzaW9uQXJuKHN0YWNrLCAnTXlMYXllcicsICdhcm46b2Y6bGF5ZXInKTtcbiAgICBuZXcgZWtzLkNsdXN0ZXIoc3RhY2ssICdDbHVzdGVyMScsIHtcbiAgICAgIHZlcnNpb246IENMVVNURVJfVkVSU0lPTixcbiAgICAgIHBydW5lOiBmYWxzZSxcbiAgICAgIGt1YmVjdGxQcm92aWRlck9wdGlvbnM6IHtcbiAgICAgICAgYXdzY2xpTGF5ZXI6IGxheWVyLFxuICAgICAgICBrdWJlY3RsTGF5ZXI6IG5ldyBLdWJlY3RsVjMzTGF5ZXIoc3RhY2ssICdrdWJlY3RsTGF5ZXInKSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBUSEVOXG4gICAgVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6TGFtYmRhOjpGdW5jdGlvbicsIHtcbiAgICAgIExheWVyczogW1xuICAgICAgICAnYXJuOm9mOmxheWVyJyxcbiAgICAgICAgeyBSZWY6ICdrdWJlY3RsTGF5ZXI0NDMyMUUwOCcgfSxcbiAgICAgIF0sXG4gICAgfSk7XG4gIH0pO1xuXG4gIHRlc3QoJ2NyZWF0ZSBhIGNsdXN0ZXIgdXNpbmcgY3VzdG9tIHJlc291cmNlIHdpdGggc2VjcmV0cyBlbmNyeXB0aW9uIHVzaW5nIEtNUyBDTUsnLCAoKSA9PiB7XG4gICAgLy8gR0lWRU5cbiAgICBjb25zdCB7IHN0YWNrLCB2cGMgfSA9IHRlc3RGaXh0dXJlKCk7XG5cbiAgICAvLyBXSEVOXG4gICAgbmV3IGVrcy5DbHVzdGVyKHN0YWNrLCAnQ2x1c3RlcicsIHtcbiAgICAgIHZwYyxcbiAgICAgIHZlcnNpb246IENMVVNURVJfVkVSU0lPTixcbiAgICAgIHBydW5lOiBmYWxzZSxcbiAgICAgIHNlY3JldHNFbmNyeXB0aW9uS2V5OiBuZXcga21zLktleShzdGFjaywgJ0tleScpLFxuICAgIH0pO1xuXG4gICAgLy8gVEhFTlxuICAgIFRlbXBsYXRlLmZyb21TdGFjayhzdGFjaykuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkVLUzo6Q2x1c3RlcicsIHtcbiAgICAgIEVuY3J5cHRpb25Db25maWc6IFt7XG4gICAgICAgIFByb3ZpZGVyOiB7XG4gICAgICAgICAgS2V5QXJuOiB7XG4gICAgICAgICAgICAnRm46OkdldEF0dCc6IFtcbiAgICAgICAgICAgICAgJ0tleTk2MUI3M0ZEJyxcbiAgICAgICAgICAgICAgJ0FybicsXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFJlc291cmNlczogWydzZWNyZXRzJ10sXG4gICAgICB9XSxcbiAgICB9KTtcbiAgfSk7XG5cbiAgdGVzdCgnY3JlYXRlIGEgY2x1c3RlciB1c2luZyBjdXN0b20ga3ViZXJuZXRlcyBuZXR3b3JrIGNvbmZpZycsICgpID0+IHtcbiAgICAvLyBHSVZFTlxuICAgIGNvbnN0IHsgc3RhY2sgfSA9IHRlc3RGaXh0dXJlKCk7XG4gICAgY29uc3QgY3VzdG9tQ2lkciA9ICcxNzIuMTYuMC4wLzEyJztcblxuICAgIC8vIFdIRU5cbiAgICBuZXcgZWtzLkNsdXN0ZXIoc3RhY2ssICdDbHVzdGVyJywge1xuICAgICAgdmVyc2lvbjogQ0xVU1RFUl9WRVJTSU9OLFxuICAgICAgc2VydmljZUlwdjRDaWRyOiBjdXN0b21DaWRyLFxuICAgIH0pO1xuXG4gICAgLy8gVEhFTlxuICAgIFRlbXBsYXRlLmZyb21TdGFjayhzdGFjaykuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkVLUzo6Q2x1c3RlcicsIHtcbiAgICAgIEt1YmVybmV0ZXNOZXR3b3JrQ29uZmlnOiB7XG4gICAgICAgIFNlcnZpY2VJcHY0Q2lkcjogY3VzdG9tQ2lkcixcbiAgICAgIH0sXG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdBY2Nlc3NDb25maWcnLCAoKSA9PiB7XG4gICAgLy8gYm9vdHN0cmFwQ2x1c3RlckNyZWF0b3JBZG1pblBlcm1pc3Npb25zIGNhbiBiZSBleHBsaWNpdGx5IGVuYWJsZWQgb3IgZGlzYWJsZWRcbiAgICB0ZXN0LmVhY2goW1xuICAgICAgW3RydWUsIHRydWVdLFxuICAgICAgW2ZhbHNlLCBmYWxzZV0sXG4gICAgXSkoJ2Jvb3RzdHJhcENsdXN0ZXJDcmVhdG9yQWRtaW5QZXJtaXNzaW9ucyglcykgc2hvdWxkIHdvcmsnLFxuICAgICAgKGEsIGIpID0+IHtcbiAgICAgICAgLy8gR0lWRU5cbiAgICAgICAgY29uc3QgeyBzdGFjayB9ID0gdGVzdEZpeHR1cmUoKTtcblxuICAgICAgICAvLyBXSEVOXG4gICAgICAgIG5ldyBla3MuQ2x1c3RlcihzdGFjaywgJ0NsdXN0ZXInLCB7XG4gICAgICAgICAgdmVyc2lvbjogQ0xVU1RFUl9WRVJTSU9OLFxuICAgICAgICAgIGJvb3RzdHJhcENsdXN0ZXJDcmVhdG9yQWRtaW5QZXJtaXNzaW9uczogYSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gVEhFTlxuICAgICAgICBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpFS1M6OkNsdXN0ZXInLCB7XG4gICAgICAgICAgQWNjZXNzQ29uZmlnOiB7XG4gICAgICAgICAgICBCb290c3RyYXBDbHVzdGVyQ3JlYXRvckFkbWluUGVybWlzc2lvbnM6IGIsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdBY2Nlc3NFbnRyeScsICgpID0+IHtcbiAgICAvLyBjbHVzdGVyIGNhbiBncmFudEFjY2VzcygpO1xuICAgIHRlc3QoJ2NsdXN0ZXIgY2FuIGdyYW50QWNjZXNzJywgKCkgPT4ge1xuICAgICAgLy8gR0lWRU5cbiAgICAgIGNvbnN0IHsgc3RhY2ssIHZwYyB9ID0gdGVzdEZpeHR1cmUoKTtcbiAgICAgIC8vIFdIRU5cbiAgICAgIGNvbnN0IG1hc3RlcnNSb2xlID0gbmV3IGlhbS5Sb2xlKHN0YWNrLCAncm9sZScsIHsgYXNzdW1lZEJ5OiBuZXcgaWFtLkFjY291bnRSb290UHJpbmNpcGFsKCkgfSk7XG4gICAgICBuZXcgZWtzLkNsdXN0ZXIoc3RhY2ssICdDbHVzdGVyJywge1xuICAgICAgICB2cGMsXG4gICAgICAgIG1hc3RlcnNSb2xlLFxuICAgICAgICB2ZXJzaW9uOiBDTFVTVEVSX1ZFUlNJT04sXG4gICAgICB9KTtcbiAgICAgIC8vIFRIRU5cbiAgICAgIFRlbXBsYXRlLmZyb21TdGFjayhzdGFjaykuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkVLUzo6QWNjZXNzRW50cnknLCB7XG4gICAgICAgIEFjY2Vzc1BvbGljaWVzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgQWNjZXNzU2NvcGU6IHtcbiAgICAgICAgICAgICAgVHlwZTogJ2NsdXN0ZXInLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFBvbGljeUFybjoge1xuICAgICAgICAgICAgICAnRm46OkpvaW4nOiBbXG4gICAgICAgICAgICAgICAgJycsIFtcbiAgICAgICAgICAgICAgICAgICdhcm46JyxcbiAgICAgICAgICAgICAgICAgIHsgUmVmOiAnQVdTOjpQYXJ0aXRpb24nIH0sXG4gICAgICAgICAgICAgICAgICAnOmVrczo6YXdzOmNsdXN0ZXItYWNjZXNzLXBvbGljeS9BbWF6b25FS1NDbHVzdGVyQWRtaW5Qb2xpY3knLFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59KTtcbiJdfQ==