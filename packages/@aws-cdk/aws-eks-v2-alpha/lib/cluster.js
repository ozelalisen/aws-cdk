"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MachineImageType = exports.DefaultCapacityType = exports.CoreDnsComputeType = exports.CpuArch = exports.NodeType = exports.EksOptimizedImage = exports.Cluster = exports.IpFamily = exports.ClusterLoggingTypes = exports.KubernetesVersion = exports.EndpointAccess = void 0;
const jsiiDeprecationWarnings = require("../.warnings.jsii.js");
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
const fs = require("fs");
const path = require("path");
const autoscaling = require("aws-cdk-lib/aws-autoscaling");
const ec2 = require("aws-cdk-lib/aws-ec2");
const aws_eks_1 = require("aws-cdk-lib/aws-eks");
const iam = require("aws-cdk-lib/aws-iam");
const ssm = require("aws-cdk-lib/aws-ssm");
const core_1 = require("aws-cdk-lib/core");
const helpers_internal_1 = require("aws-cdk-lib/core/lib/helpers-internal");
const metadata_resource_1 = require("aws-cdk-lib/core/lib/metadata-resource");
const prop_injectable_1 = require("aws-cdk-lib/core/lib/prop-injectable");
const cx_api_1 = require("aws-cdk-lib/cx-api");
const constructs_1 = require("constructs");
const YAML = require("yaml");
const access_entry_1 = require("./access-entry");
const addon_1 = require("./addon");
const alb_controller_1 = require("./alb-controller");
const fargate_profile_1 = require("./fargate-profile");
const helm_chart_1 = require("./helm-chart");
const instance_types_1 = require("./instance-types");
const k8s_manifest_1 = require("./k8s-manifest");
const k8s_object_value_1 = require("./k8s-object-value");
const k8s_patch_1 = require("./k8s-patch");
const kubectl_provider_1 = require("./kubectl-provider");
const managed_nodegroup_1 = require("./managed-nodegroup");
const oidc_provider_1 = require("./oidc-provider");
const bottlerocket_1 = require("./private/bottlerocket");
const service_account_1 = require("./service-account");
const user_data_1 = require("./user-data");
// defaults are based on https://eksctl.io
const DEFAULT_CAPACITY_COUNT = 2;
const DEFAULT_CAPACITY_TYPE = ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.LARGE);
/**
 * Endpoint access characteristics.
 */
class EndpointAccess {
    _config;
    static [JSII_RTTI_SYMBOL_1] = { fqn: "@aws-cdk/aws-eks-v2-alpha.EndpointAccess", version: "0.0.0" };
    /**
     * The cluster endpoint is accessible from outside of your VPC.
     * Worker node traffic will leave your VPC to connect to the endpoint.
     *
     * By default, the endpoint is exposed to all adresses. You can optionally limit the CIDR blocks that can access the public endpoint using the `PUBLIC.onlyFrom` method.
     * If you limit access to specific CIDR blocks, you must ensure that the CIDR blocks that you
     * specify include the addresses that worker nodes and Fargate pods (if you use them)
     * access the public endpoint from.
     *
     * @param cidr The CIDR blocks.
     */
    static PUBLIC = new EndpointAccess({ privateAccess: false, publicAccess: true });
    /**
     * The cluster endpoint is only accessible through your VPC.
     * Worker node traffic to the endpoint will stay within your VPC.
     */
    static PRIVATE = new EndpointAccess({ privateAccess: true, publicAccess: false });
    /**
     * The cluster endpoint is accessible from outside of your VPC.
     * Worker node traffic to the endpoint will stay within your VPC.
     *
     * By default, the endpoint is exposed to all adresses. You can optionally limit the CIDR blocks that can access the public endpoint using the `PUBLIC_AND_PRIVATE.onlyFrom` method.
     * If you limit access to specific CIDR blocks, you must ensure that the CIDR blocks that you
     * specify include the addresses that worker nodes and Fargate pods (if you use them)
     * access the public endpoint from.
     *
     * @param cidr The CIDR blocks.
     */
    static PUBLIC_AND_PRIVATE = new EndpointAccess({ privateAccess: true, publicAccess: true });
    constructor(
    /**
     * Configuration properties.
     *
     * @internal
     */
    _config) {
        this._config = _config;
        if (!_config.publicAccess && _config.publicCidrs && _config.publicCidrs.length > 0) {
            throw new core_1.UnscopedValidationError('CIDR blocks can only be configured when public access is enabled');
        }
    }
    /**
     * Restrict public access to specific CIDR blocks.
     * If public access is disabled, this method will result in an error.
     *
     * @param cidr CIDR blocks.
     */
    onlyFrom(...cidr) {
        if (!this._config.privateAccess) {
            // when private access is disabled, we can't restric public
            // access since it will render the kubectl provider unusable.
            throw new core_1.UnscopedValidationError('Cannot restric public access to endpoint when private access is disabled. Use PUBLIC_AND_PRIVATE.onlyFrom() instead.');
        }
        return new EndpointAccess({
            ...this._config,
            // override CIDR
            publicCidrs: cidr,
        });
    }
}
exports.EndpointAccess = EndpointAccess;
/**
 * Kubernetes cluster version
 * @see https://docs.aws.amazon.com/eks/latest/userguide/kubernetes-versions.html#kubernetes-release-calendar
 */
class KubernetesVersion {
    version;
    static [JSII_RTTI_SYMBOL_1] = { fqn: "@aws-cdk/aws-eks-v2-alpha.KubernetesVersion", version: "0.0.0" };
    /**
     * Kubernetes version 1.25
     *
     * When creating a `Cluster` with this version, you need to also specify the
     * `kubectlLayer` property with a `KubectlV25Layer` from
     * `@aws-cdk/lambda-layer-kubectl-v25`.
     */
    static V1_25 = KubernetesVersion.of('1.25');
    /**
     * Kubernetes version 1.26
     *
     * When creating a `Cluster` with this version, you need to also specify the
     * `kubectlLayer` property with a `KubectlV26Layer` from
     * `@aws-cdk/lambda-layer-kubectl-v26`.
     */
    static V1_26 = KubernetesVersion.of('1.26');
    /**
     * Kubernetes version 1.27
     *
     * When creating a `Cluster` with this version, you need to also specify the
     * `kubectlLayer` property with a `KubectlV27Layer` from
     * `@aws-cdk/lambda-layer-kubectl-v27`.
     */
    static V1_27 = KubernetesVersion.of('1.27');
    /**
     * Kubernetes version 1.28
     *
     * When creating a `Cluster` with this version, you need to also specify the
     * `kubectlLayer` property with a `KubectlV28Layer` from
     * `@aws-cdk/lambda-layer-kubectl-v28`.
     */
    static V1_28 = KubernetesVersion.of('1.28');
    /**
     * Kubernetes version 1.29
     *
     * When creating a `Cluster` with this version, you need to also specify the
     * `kubectlLayer` property with a `KubectlV29Layer` from
     * `@aws-cdk/lambda-layer-kubectl-v29`.
     */
    static V1_29 = KubernetesVersion.of('1.29');
    /**
     * Kubernetes version 1.30
     *
     * When creating a `Cluster` with this version, you need to also specify the
     * `kubectlLayer` property with a `KubectlV30Layer` from
     * `@aws-cdk/lambda-layer-kubectl-v30`.
     */
    static V1_30 = KubernetesVersion.of('1.30');
    /**
     * Kubernetes version 1.31
     *
     * When creating a `Cluster` with this version, you need to also specify the
     * `kubectlLayer` property with a `KubectlV31Layer` from
     * `@aws-cdk/lambda-layer-kubectl-v31`.
     */
    static V1_31 = KubernetesVersion.of('1.31');
    /**
     * Kubernetes version 1.32
     *
     * When creating a `Cluster` with this version, you need to also specify the
     * `kubectlLayer` property with a `KubectlV32Layer` from
     * `@aws-cdk/lambda-layer-kubectl-v32`.
     */
    static V1_32 = KubernetesVersion.of('1.32');
    /**
     * Kubernetes version 1.33
     *
     * When creating a `Cluster` with this version, you need to also specify the
     * `kubectlLayer` property with a `KubectlV33Layer` from
     * `@aws-cdk/lambda-layer-kubectl-v33`.
     */
    static V1_33 = KubernetesVersion.of('1.33');
    /**
     * Kubernetes version 1.34
     *
     * When creating a `Cluster` with this version, you need to also specify the
     * `kubectlLayer` property with a `KubectlV34Layer` from
     * `@aws-cdk/lambda-layer-kubectl-v34`.
     */
    static V1_34 = KubernetesVersion.of('1.34');
    /**
     * Custom cluster version
     * @param version custom version number
     */
    static of(version) { return new KubernetesVersion(version); }
    /**
     *
     * @param version cluster version number
     */
    constructor(version) {
        this.version = version;
    }
}
exports.KubernetesVersion = KubernetesVersion;
// Shared definition with packages/@aws-cdk/custom-resource-handlers/test/aws-eks/compare-log.test.ts
/**
 * EKS cluster logging types
 */
var ClusterLoggingTypes;
(function (ClusterLoggingTypes) {
    /**
     * Logs pertaining to API requests to the cluster.
     */
    ClusterLoggingTypes["API"] = "api";
    /**
     * Logs pertaining to cluster access via the Kubernetes API.
     */
    ClusterLoggingTypes["AUDIT"] = "audit";
    /**
     * Logs pertaining to authentication requests into the cluster.
     */
    ClusterLoggingTypes["AUTHENTICATOR"] = "authenticator";
    /**
     * Logs pertaining to state of cluster controllers.
     */
    ClusterLoggingTypes["CONTROLLER_MANAGER"] = "controllerManager";
    /**
     * Logs pertaining to scheduling decisions.
     */
    ClusterLoggingTypes["SCHEDULER"] = "scheduler";
})(ClusterLoggingTypes || (exports.ClusterLoggingTypes = ClusterLoggingTypes = {}));
/**
 * EKS cluster IP family.
 */
var IpFamily;
(function (IpFamily) {
    /**
     * Use IPv4 for pods and services in your cluster.
     */
    IpFamily["IP_V4"] = "ipv4";
    /**
     * Use IPv6 for pods and services in your cluster.
     */
    IpFamily["IP_V6"] = "ipv6";
})(IpFamily || (exports.IpFamily = IpFamily = {}));
class ClusterBase extends core_1.Resource {
    /**
     * Defines a Kubernetes resource in this cluster.
     *
     * The manifest will be applied/deleted using kubectl as needed.
     *
     * @param id logical id of this manifest
     * @param manifest a list of Kubernetes resource specifications
     * @returns a `KubernetesResource` object.
     */
    addManifest(id, ...manifest) {
        return new k8s_manifest_1.KubernetesManifest(this, `manifest-${id}`, { cluster: this, manifest });
    }
    /**
     * Defines a Helm chart in this cluster.
     *
     * @param id logical id of this chart.
     * @param options options of this chart.
     * @returns a `HelmChart` construct
     */
    addHelmChart(id, options) {
        return new helm_chart_1.HelmChart(this, `chart-${id}`, { cluster: this, ...options });
    }
    /**
     * Defines a CDK8s chart in this cluster.
     *
     * @param id logical id of this chart.
     * @param chart the cdk8s chart.
     * @returns a `KubernetesManifest` construct representing the chart.
     */
    addCdk8sChart(id, chart, options = {}) {
        const cdk8sChart = chart;
        // see https://github.com/awslabs/cdk8s/blob/master/packages/cdk8s/src/chart.ts#L84
        if (typeof cdk8sChart.toJson !== 'function') {
            throw new core_1.UnscopedValidationError(`Invalid cdk8s chart. Must contain a 'toJson' method, but found ${typeof cdk8sChart.toJson}`);
        }
        const manifest = new k8s_manifest_1.KubernetesManifest(this, id, {
            cluster: this,
            manifest: cdk8sChart.toJson(),
            ...options,
        });
        return manifest;
    }
    addServiceAccount(id, options = {}) {
        return new service_account_1.ServiceAccount(this, id, {
            ...options,
            cluster: this,
        });
    }
    /**
     * Connect capacity in the form of an existing AutoScalingGroup to the EKS cluster.
     *
     * The AutoScalingGroup must be running an EKS-optimized AMI containing the
     * /etc/eks/bootstrap.sh script. This method will configure Security Groups,
     * add the right policies to the instance role, apply the right tags, and add
     * the required user data to the instance's launch configuration.
     *
     * Prefer to use `addAutoScalingGroupCapacity` if possible.
     *
     * @see https://docs.aws.amazon.com/eks/latest/userguide/launch-workers.html
     * @param autoScalingGroup [disable-awslint:ref-via-interface]
     * @param options options for adding auto scaling groups, like customizing the bootstrap script
     */
    connectAutoScalingGroupCapacity(autoScalingGroup, options) {
        // self rules
        autoScalingGroup.connections.allowInternally(ec2.Port.allTraffic());
        // Cluster to:nodes rules
        autoScalingGroup.connections.allowFrom(this, ec2.Port.tcp(443));
        autoScalingGroup.connections.allowFrom(this, ec2.Port.tcpRange(1025, 65535));
        // Allow HTTPS from Nodes to Cluster
        autoScalingGroup.connections.allowTo(this, ec2.Port.tcp(443));
        // Allow all node outbound traffic
        autoScalingGroup.connections.allowToAnyIpv4(ec2.Port.allTcp());
        autoScalingGroup.connections.allowToAnyIpv4(ec2.Port.allUdp());
        autoScalingGroup.connections.allowToAnyIpv4(ec2.Port.allIcmp());
        // allow traffic to/from managed node groups (eks attaches this security group to the managed nodes)
        autoScalingGroup.addSecurityGroup(this.clusterSecurityGroup);
        const bootstrapEnabled = options.bootstrapEnabled ?? true;
        if (options.bootstrapOptions && !bootstrapEnabled) {
            throw new core_1.UnscopedValidationError('Cannot specify "bootstrapOptions" if "bootstrapEnabled" is false');
        }
        if (bootstrapEnabled) {
            const userData = options.machineImageType === MachineImageType.BOTTLEROCKET ?
                (0, user_data_1.renderBottlerocketUserData)(this) :
                (0, user_data_1.renderAmazonLinuxUserData)(this, autoScalingGroup, options.bootstrapOptions);
            autoScalingGroup.addUserData(...userData);
        }
        autoScalingGroup.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSWorkerNodePolicy'));
        autoScalingGroup.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKS_CNI_Policy'));
        autoScalingGroup.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'));
        // EKS Required Tags
        // https://docs.aws.amazon.com/eks/latest/userguide/worker.html
        core_1.Tags.of(autoScalingGroup).add(`kubernetes.io/cluster/${this.clusterName}`, 'owned', {
            applyToLaunchedInstances: true,
            // exclude security groups to avoid multiple "owned" security groups.
            // (the cluster security group already has this tag)
            excludeResourceTypes: ['AWS::EC2::SecurityGroup'],
        });
        // since we are not mapping the instance role to RBAC, synthesize an
        // output so it can be pasted into `aws-auth-cm.yaml`
        new core_1.CfnOutput(autoScalingGroup, 'InstanceRoleARN', {
            value: autoScalingGroup.role.roleArn,
        });
        if (this instanceof Cluster && this.albController) {
            // the controller runs on the worker nodes so they cannot
            // be deleted before the controller.
            constructs_1.Node.of(this.albController).addDependency(autoScalingGroup);
        }
    }
}
/**
 * A Cluster represents a managed Kubernetes Service (EKS)
 *
 * This is a fully managed cluster of API Servers (control-plane)
 * The user is still required to create the worker nodes.
 * @resource AWS::EKS::Cluster
 */
let Cluster = (() => {
    let _classDecorators = [prop_injectable_1.propertyInjectable];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ClusterBase;
    let _instanceExtraInitializers = [];
    let _get_clusterName_decorators;
    let _get_clusterArn_decorators;
    let _grantAccess_decorators;
    let _grantClusterAdmin_decorators;
    let _getServiceLoadBalancerAddress_decorators;
    let _getIngressLoadBalancerAddress_decorators;
    let _addAutoScalingGroupCapacity_decorators;
    let _addNodegroupCapacity_decorators;
    let _addFargateProfile_decorators;
    var Cluster = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _get_clusterName_decorators = [helpers_internal_1.memoizedGetter];
            _get_clusterArn_decorators = [helpers_internal_1.memoizedGetter];
            _grantAccess_decorators = [(0, metadata_resource_1.MethodMetadata)()];
            _grantClusterAdmin_decorators = [(0, metadata_resource_1.MethodMetadata)()];
            _getServiceLoadBalancerAddress_decorators = [(0, metadata_resource_1.MethodMetadata)()];
            _getIngressLoadBalancerAddress_decorators = [(0, metadata_resource_1.MethodMetadata)()];
            _addAutoScalingGroupCapacity_decorators = [(0, metadata_resource_1.MethodMetadata)()];
            _addNodegroupCapacity_decorators = [(0, metadata_resource_1.MethodMetadata)()];
            _addFargateProfile_decorators = [(0, metadata_resource_1.MethodMetadata)()];
            __esDecorate(this, null, _get_clusterName_decorators, { kind: "getter", name: "clusterName", static: false, private: false, access: { has: obj => "clusterName" in obj, get: obj => obj.clusterName }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _get_clusterArn_decorators, { kind: "getter", name: "clusterArn", static: false, private: false, access: { has: obj => "clusterArn" in obj, get: obj => obj.clusterArn }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _grantAccess_decorators, { kind: "method", name: "grantAccess", static: false, private: false, access: { has: obj => "grantAccess" in obj, get: obj => obj.grantAccess }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _grantClusterAdmin_decorators, { kind: "method", name: "grantClusterAdmin", static: false, private: false, access: { has: obj => "grantClusterAdmin" in obj, get: obj => obj.grantClusterAdmin }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getServiceLoadBalancerAddress_decorators, { kind: "method", name: "getServiceLoadBalancerAddress", static: false, private: false, access: { has: obj => "getServiceLoadBalancerAddress" in obj, get: obj => obj.getServiceLoadBalancerAddress }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getIngressLoadBalancerAddress_decorators, { kind: "method", name: "getIngressLoadBalancerAddress", static: false, private: false, access: { has: obj => "getIngressLoadBalancerAddress" in obj, get: obj => obj.getIngressLoadBalancerAddress }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _addAutoScalingGroupCapacity_decorators, { kind: "method", name: "addAutoScalingGroupCapacity", static: false, private: false, access: { has: obj => "addAutoScalingGroupCapacity" in obj, get: obj => obj.addAutoScalingGroupCapacity }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _addNodegroupCapacity_decorators, { kind: "method", name: "addNodegroupCapacity", static: false, private: false, access: { has: obj => "addNodegroupCapacity" in obj, get: obj => obj.addNodegroupCapacity }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _addFargateProfile_decorators, { kind: "method", name: "addFargateProfile", static: false, private: false, access: { has: obj => "addFargateProfile" in obj, get: obj => obj.addFargateProfile }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            Cluster = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        static [JSII_RTTI_SYMBOL_1] = { fqn: "@aws-cdk/aws-eks-v2-alpha.Cluster", version: "0.0.0" };
        /** Uniquely identifies this class. */
        static PROPERTY_INJECTION_ID = '@aws-cdk.aws-eks-v2-alpha.Cluster';
        /**
         * Import an existing cluster
         *
         * @param scope the construct scope, in most cases 'this'
         * @param id the id or name to import as
         * @param attrs the cluster properties to use for importing information
         */
        static fromClusterAttributes(scope, id, attrs) {
            try {
                jsiiDeprecationWarnings._aws_cdk_aws_eks_v2_alpha_ClusterAttributes(attrs);
            }
            catch (error) {
                if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                    Error.captureStackTrace(error, this.fromClusterAttributes);
                }
                throw error;
            }
            return new ImportedCluster(scope, id, attrs);
        }
        accessEntries = (__runInitializers(this, _instanceExtraInitializers), new Map());
        /**
         * The VPC in which this Cluster was created
         */
        vpc;
        /**
         * The Name of the created EKS Cluster
         */
        get clusterName() {
            return this.getResourceNameAttribute(this.resource.ref);
        }
        /**
         * The AWS generated ARN for the Cluster resource
         *
         * For example, `arn:aws:eks:us-west-2:666666666666:cluster/prod`
         */
        get clusterArn() {
            return this.getResourceArnAttribute(this.resource.attrArn, clusterArnComponents(this.physicalName));
        }
        /**
         * The endpoint URL for the Cluster
         *
         * This is the URL inside the kubeconfig file to use with kubectl
         *
         * For example, `https://5E1D0CEXAMPLEA591B746AFC5AB30262.yl4.us-west-2.eks.amazonaws.com`
         */
        clusterEndpoint;
        /**
         * The certificate-authority-data for your cluster.
         */
        clusterCertificateAuthorityData;
        /**
         * The id of the cluster security group that was created by Amazon EKS for the cluster.
         */
        clusterSecurityGroupId;
        /**
         * The cluster security group that was created by Amazon EKS for the cluster.
         */
        clusterSecurityGroup;
        /**
         * Amazon Resource Name (ARN) or alias of the customer master key (CMK).
         */
        clusterEncryptionConfigKeyArn;
        /**
         * Manages connection rules (Security Group Rules) for the cluster
         *
         * @type {ec2.Connections}
         * @memberof Cluster
         */
        connections;
        /**
         * IAM role assumed by the EKS Control Plane
         */
        role;
        /**
         * The auto scaling group that hosts the default capacity for this cluster.
         * This will be `undefined` if the `defaultCapacityType` is not `EC2` or
         * `defaultCapacityType` is `EC2` but default capacity is set to 0.
         */
        defaultCapacity;
        /**
         * The node group that hosts the default capacity for this cluster.
         * This will be `undefined` if the `defaultCapacityType` is `EC2` or
         * `defaultCapacityType` is `NODEGROUP` but default capacity is set to 0.
         */
        defaultNodegroup;
        /**
         * Specify which IP family is used to assign Kubernetes pod and service IP addresses.
         *
         * @default IpFamily.IP_V4
         * @see https://docs.aws.amazon.com/eks/latest/APIReference/API_KubernetesNetworkConfigRequest.html#AmazonEKS-Type-KubernetesNetworkConfigRequest-ipFamily
         */
        ipFamily;
        /**
         * If the cluster has one (or more) FargateProfiles associated, this array
         * will hold a reference to each.
         */
        _fargateProfiles = [];
        /**
         * an Open ID Connect Provider instance
         */
        _openIdConnectProvider;
        /**
         * an EKS Pod Identity Agent instance
         */
        _eksPodIdentityAgent;
        /**
         * Determines if Kubernetes resources can be pruned automatically.
         */
        prune;
        /**
         * The ALB Controller construct defined for this cluster.
         * Will be undefined if `albController` wasn't configured.
         */
        albController;
        resource;
        _neuronDevicePlugin;
        endpointAccess;
        vpcSubnets;
        version;
        // TODO: revisit logging format
        logging;
        /**
         * A dummy CloudFormation resource that is used as a wait barrier which
         * represents that the cluster is ready to receive "kubectl" commands.
         *
         * Specifically, all fargate profiles are automatically added as a dependency
         * of this barrier, which means that it will only be "signaled" when all
         * fargate profiles have been successfully created.
         *
         * When kubectl resources call `_attachKubectlResourceScope()`, this resource
         * is added as their dependency which implies that they can only be deployed
         * after the cluster is ready.
         */
        _kubectlReadyBarrier;
        _kubectlProviderOptions;
        _kubectlProvider;
        _clusterAdminAccess;
        /**
         * Initiates an EKS Cluster with the supplied arguments
         *
         * @param scope a Construct, most likely a cdk.Stack created
         * @param id the id of the Construct to create
         * @param props properties in the IClusterProps interface
         */
        constructor(scope, id, props) {
            super(scope, id, {
                physicalName: props.clusterName,
            });
            try {
                jsiiDeprecationWarnings._aws_cdk_aws_eks_v2_alpha_ClusterProps(props);
            }
            catch (error) {
                if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                    Error.captureStackTrace(error, Cluster);
                }
                throw error;
            }
            // Enhanced CDK Analytics Telemetry
            (0, metadata_resource_1.addConstructMetadata)(this, props);
            this.prune = props.prune ?? true;
            this.vpc = props.vpc || new ec2.Vpc(this, 'DefaultVpc');
            this.version = props.version;
            this._kubectlProviderOptions = props.kubectlProviderOptions;
            this.tagSubnets();
            // this is the role used by EKS when interacting with AWS resources
            this.role = props.role || new iam.Role(this, 'Role', {
                assumedBy: new iam.ServicePrincipal('eks.amazonaws.com'),
                managedPolicies: [
                    iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSClusterPolicy'),
                ],
            });
            // validate all automode relevant configurations
            const autoModeEnabled = this.isValidAutoModeConfig(props);
            if (autoModeEnabled) {
                // attach required managed policy for the cluster role in EKS Auto Mode
                // see - https://docs.aws.amazon.com/eks/latest/userguide/auto-cluster-iam-role.html
                ['AmazonEKSComputePolicy',
                    'AmazonEKSBlockStoragePolicy',
                    'AmazonEKSLoadBalancingPolicy',
                    'AmazonEKSNetworkingPolicy'].forEach((policyName) => {
                    this.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName(policyName));
                });
                // sts:TagSession is required for EKS Auto Mode or when using EKS Pod Identity features.
                // see https://docs.aws.amazon.com/eks/latest/userguide/pod-id-role.html
                // https://docs.aws.amazon.com/eks/latest/userguide/automode-get-started-cli.html#_create_an_eks_auto_mode_cluster_iam_role
                if (this.role instanceof iam.Role) {
                    this.role.assumeRolePolicy?.addStatements(new iam.PolicyStatement({
                        effect: iam.Effect.ALLOW,
                        principals: [new iam.ServicePrincipal('eks.amazonaws.com')],
                        actions: ['sts:TagSession'],
                    }));
                }
            }
            const securityGroup = props.securityGroup || new ec2.SecurityGroup(this, 'ControlPlaneSecurityGroup', {
                vpc: this.vpc,
                description: 'EKS Control Plane Security Group',
            });
            this.vpcSubnets = props.vpcSubnets ?? [{ subnetType: ec2.SubnetType.PUBLIC }, { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }];
            const selectedSubnetIdsPerGroup = this.vpcSubnets.map(s => this.vpc.selectSubnets(s).subnetIds);
            if (selectedSubnetIdsPerGroup.some(core_1.Token.isUnresolved) && selectedSubnetIdsPerGroup.length > 1) {
                throw new core_1.UnscopedValidationError('eks.Cluster: cannot select multiple subnet groups from a VPC imported from list tokens with unknown length. Select only one subnet group, pass a length to Fn.split, or switch to Vpc.fromLookup.');
            }
            // Get subnetIds for all selected subnets
            const subnetIds = Array.from(new Set(flatten(selectedSubnetIdsPerGroup)));
            this.logging = props.clusterLogging ? {
                clusterLogging: {
                    enabledTypes: props.clusterLogging.map((type) => ({ type })),
                },
            } : undefined;
            this.endpointAccess = props.endpointAccess ?? EndpointAccess.PUBLIC_AND_PRIVATE;
            this.ipFamily = props.ipFamily ?? IpFamily.IP_V4;
            const privateSubnets = this.selectPrivateSubnets().slice(0, 16);
            const publicAccessDisabled = !this.endpointAccess._config.publicAccess;
            const publicAccessRestricted = !publicAccessDisabled
                && this.endpointAccess._config.publicCidrs
                && this.endpointAccess._config.publicCidrs.length !== 0;
            // validate endpoint access configuration
            if (privateSubnets.length === 0 && publicAccessDisabled) {
                // no private subnets and no public access at all, no good.
                throw new core_1.UnscopedValidationError('Vpc must contain private subnets when public endpoint access is disabled');
            }
            if (privateSubnets.length === 0 && publicAccessRestricted) {
                // no private subnets and public access is restricted, no good.
                throw new core_1.UnscopedValidationError('Vpc must contain private subnets when public endpoint access is restricted');
            }
            if (props.serviceIpv4Cidr && props.ipFamily == IpFamily.IP_V6) {
                throw new core_1.UnscopedValidationError('Cannot specify serviceIpv4Cidr with ipFamily equal to IpFamily.IP_V6');
            }
            const resource = this.resource = new aws_eks_1.CfnCluster(this, 'Resource', {
                name: this.physicalName,
                roleArn: this.role.roleArn,
                version: props.version.version,
                accessConfig: {
                    authenticationMode: 'API',
                    bootstrapClusterCreatorAdminPermissions: props.bootstrapClusterCreatorAdminPermissions,
                },
                computeConfig: {
                    enabled: autoModeEnabled,
                    // If the computeConfig enabled flag is set to false when creating a cluster with Auto Mode,
                    // the request must not include values for the nodeRoleArn or nodePools fields.
                    // Also, if nodePools is empty, nodeRoleArn should not be included to prevent deployment failures
                    nodePools: !autoModeEnabled ? undefined : props.compute?.nodePools ?? ['system', 'general-purpose'],
                    nodeRoleArn: !autoModeEnabled || (props.compute?.nodePools && props.compute.nodePools.length === 0) ?
                        undefined :
                        props.compute?.nodeRole?.roleArn ?? this.addNodePoolRole(`${id}nodePoolRole`).roleArn,
                },
                storageConfig: {
                    blockStorage: {
                        enabled: autoModeEnabled,
                    },
                },
                kubernetesNetworkConfig: {
                    ipFamily: this.ipFamily,
                    serviceIpv4Cidr: props.serviceIpv4Cidr,
                    elasticLoadBalancing: {
                        enabled: autoModeEnabled,
                    },
                },
                resourcesVpcConfig: {
                    securityGroupIds: [securityGroup.securityGroupId],
                    subnetIds,
                    endpointPrivateAccess: this.endpointAccess._config.privateAccess,
                    endpointPublicAccess: this.endpointAccess._config.publicAccess,
                    publicAccessCidrs: this.endpointAccess._config.publicCidrs,
                },
                ...(props.secretsEncryptionKey ? {
                    encryptionConfig: [{
                            provider: {
                                keyArn: props.secretsEncryptionKey.keyRef.keyArn,
                            },
                            resources: ['secrets'],
                        }],
                } : {}),
                tags: Object.keys(props.tags ?? {}).map(k => ({ key: k, value: props.tags[k] })),
                logging: this.logging,
            });
            let kubectlSubnets = this._kubectlProviderOptions?.privateSubnets;
            if (this.endpointAccess._config.privateAccess && privateSubnets.length !== 0) {
                // when private access is enabled and the vpc has private subnets, lets connect
                // the provider to the vpc so that it will work even when restricting public access.
                // validate VPC properties according to: https://docs.aws.amazon.com/eks/latest/userguide/cluster-endpoint.html
                if (this.vpc instanceof ec2.Vpc && !(this.vpc.dnsHostnamesEnabled && this.vpc.dnsSupportEnabled)) {
                    throw new core_1.UnscopedValidationError('Private endpoint access requires the VPC to have DNS support and DNS hostnames enabled. Use `enableDnsHostnames: true` and `enableDnsSupport: true` when creating the VPC.');
                }
                kubectlSubnets = privateSubnets;
                // the vpc must exist in order to properly delete the cluster (since we run `kubectl delete`).
                // this ensures that.
                this.resource.node.addDependency(this.vpc);
            }
            // we use an SSM parameter as a barrier because it's free and fast.
            this._kubectlReadyBarrier = new core_1.CfnResource(this, 'KubectlReadyBarrier', {
                type: 'AWS::SSM::Parameter',
                properties: {
                    Type: 'String',
                    Value: 'aws:cdk:eks:kubectl-ready',
                },
            });
            // add the cluster resource itself as a dependency of the barrier
            this._kubectlReadyBarrier.node.addDependency(this.resource);
            this.clusterEndpoint = resource.attrEndpoint;
            this.clusterCertificateAuthorityData = resource.attrCertificateAuthorityData;
            this.clusterSecurityGroupId = resource.attrClusterSecurityGroupId;
            this.clusterEncryptionConfigKeyArn = resource.attrEncryptionConfigKeyArn;
            this.clusterSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, 'ClusterSecurityGroup', this.clusterSecurityGroupId);
            this.connections = new ec2.Connections({
                securityGroups: [this.clusterSecurityGroup, securityGroup],
                defaultPort: ec2.Port.tcp(443), // Control Plane has an HTTPS API
            });
            const stack = core_1.Stack.of(this);
            const updateConfigCommandPrefix = `aws eks update-kubeconfig --name ${this.clusterName}`;
            const getTokenCommandPrefix = `aws eks get-token --cluster-name ${this.clusterName}`;
            const commonCommandOptions = [`--region ${stack.region}`];
            if (props.kubectlProviderOptions) {
                this._kubectlProvider = new kubectl_provider_1.KubectlProvider(this, 'KubectlProvider', {
                    cluster: this,
                    role: this._kubectlProviderOptions?.role,
                    awscliLayer: this._kubectlProviderOptions?.awscliLayer,
                    kubectlLayer: this._kubectlProviderOptions.kubectlLayer,
                    environment: this._kubectlProviderOptions?.environment,
                    memory: this._kubectlProviderOptions?.memory,
                    privateSubnets: kubectlSubnets,
                });
                // give the handler role admin access to the cluster
                // so it can deploy/query any resource.
                this._clusterAdminAccess = this.grantClusterAdmin('ClusterAdminRoleAccess', this._kubectlProvider?.role.roleArn);
                // Ensure kubectl is marked as ready only after admin access has been granted
                this._kubectlReadyBarrier.node.addDependency(this._clusterAdminAccess);
            }
            // do not create a masters role if one is not provided. Trusting the accountRootPrincipal() is too permissive.
            if (props.mastersRole) {
                const mastersRole = props.mastersRole;
                this.grantAccess('mastersRoleAccess', props.mastersRole.roleArn, [
                    access_entry_1.AccessPolicy.fromAccessPolicyName('AmazonEKSClusterAdminPolicy', {
                        accessScopeType: access_entry_1.AccessScopeType.CLUSTER,
                    }),
                ]);
                commonCommandOptions.push(`--role-arn ${mastersRole.roleArn}`);
            }
            if (props.albController) {
                this.albController = alb_controller_1.AlbController.create(this, { ...props.albController, cluster: this });
            }
            // if any of defaultCapacity* properties are set, we need a default capacity(nodegroup)
            if (props.defaultCapacity !== undefined ||
                props.defaultCapacityType !== undefined ||
                props.defaultCapacityInstance !== undefined) {
                const minCapacity = props.defaultCapacity ?? DEFAULT_CAPACITY_COUNT;
                if (minCapacity > 0) {
                    const instanceType = props.defaultCapacityInstance || DEFAULT_CAPACITY_TYPE;
                    // If defaultCapacityType is undefined, use AUTOMODE as the default
                    const capacityType = props.defaultCapacityType ?? DefaultCapacityType.AUTOMODE;
                    // Only create EC2 or Nodegroup capacity if not using AUTOMODE
                    if (capacityType === DefaultCapacityType.EC2) {
                        this.defaultCapacity = this.addAutoScalingGroupCapacity('DefaultCapacity', { instanceType, minCapacity });
                    }
                    else if (capacityType === DefaultCapacityType.NODEGROUP) {
                        this.defaultNodegroup = this.addNodegroupCapacity('DefaultCapacity', { instanceTypes: [instanceType], minSize: minCapacity });
                    }
                    // For AUTOMODE, we don't create any explicit capacity as it's managed by EKS
                }
            }
            // ensure FARGATE still applies here
            if (props.coreDnsComputeType === CoreDnsComputeType.FARGATE) {
                this.defineCoreDnsComputeType(CoreDnsComputeType.FARGATE);
            }
            const outputConfigCommand = (props.outputConfigCommand ?? true) && props.mastersRole;
            if (outputConfigCommand) {
                const postfix = commonCommandOptions.join(' ');
                new core_1.CfnOutput(this, 'ConfigCommand', { value: `${updateConfigCommandPrefix} ${postfix}` });
                new core_1.CfnOutput(this, 'GetTokenCommand', { value: `${getTokenCommandPrefix} ${postfix}` });
            }
        }
        /**
         * Grants the specified IAM principal access to the EKS cluster based on the provided access policies.
         *
         * This method creates an `AccessEntry` construct that grants the specified IAM principal the access permissions
         * defined by the provided `IAccessPolicy` array. This allows the IAM principal to perform the actions permitted
         * by the access policies within the EKS cluster.
         * [disable-awslint:no-grants]
         *
         * @param id - The ID of the `AccessEntry` construct to be created.
         * @param principal - The IAM principal (role or user) to be granted access to the EKS cluster.
         * @param accessPolicies - An array of `IAccessPolicy` objects that define the access permissions to be granted to the IAM principal.
         */
        grantAccess(id, principal, accessPolicies) {
            this.addToAccessEntry(id, principal, accessPolicies);
        }
        /**
         * Grants the specified IAM principal cluster admin access to the EKS cluster.
         *
         * This method creates an `AccessEntry` construct that grants the specified IAM principal the cluster admin
         * access permissions. This allows the IAM principal to perform the actions permitted
         * by the cluster admin acces.
         * [disable-awslint:no-grants]
         *
         * @param id - The ID of the `AccessEntry` construct to be created.
         * @param principal - The IAM principal (role or user) to be granted access to the EKS cluster.
         * @returns the access entry construct
         */
        grantClusterAdmin(id, principal) {
            const newEntry = new access_entry_1.AccessEntry(this, id, {
                principal,
                cluster: this,
                accessPolicies: [
                    access_entry_1.AccessPolicy.fromAccessPolicyName('AmazonEKSClusterAdminPolicy', {
                        accessScopeType: access_entry_1.AccessScopeType.CLUSTER,
                    }),
                ],
            });
            this.accessEntries.set(principal, newEntry);
            return newEntry;
        }
        /**
         * Fetch the load balancer address of a service of type 'LoadBalancer'.
         *
         * @param serviceName The name of the service.
         * @param options Additional operation options.
         */
        getServiceLoadBalancerAddress(serviceName, options = {}) {
            try {
                jsiiDeprecationWarnings._aws_cdk_aws_eks_v2_alpha_ServiceLoadBalancerAddressOptions(options);
            }
            catch (error) {
                if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                    Error.captureStackTrace(error, this.getServiceLoadBalancerAddress);
                }
                throw error;
            }
            const loadBalancerAddress = new k8s_object_value_1.KubernetesObjectValue(this, `${serviceName}LoadBalancerAddress`, {
                cluster: this,
                objectType: 'service',
                objectName: serviceName,
                objectNamespace: options.namespace,
                jsonPath: '.status.loadBalancer.ingress[0].hostname',
                timeout: options.timeout,
            });
            return loadBalancerAddress.value;
        }
        /**
         * Fetch the load balancer address of an ingress backed by a load balancer.
         *
         * @param ingressName The name of the ingress.
         * @param options Additional operation options.
         */
        getIngressLoadBalancerAddress(ingressName, options = {}) {
            try {
                jsiiDeprecationWarnings._aws_cdk_aws_eks_v2_alpha_IngressLoadBalancerAddressOptions(options);
            }
            catch (error) {
                if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                    Error.captureStackTrace(error, this.getIngressLoadBalancerAddress);
                }
                throw error;
            }
            const loadBalancerAddress = new k8s_object_value_1.KubernetesObjectValue(this, `${ingressName}LoadBalancerAddress`, {
                cluster: this,
                objectType: 'ingress',
                objectName: ingressName,
                objectNamespace: options.namespace,
                jsonPath: '.status.loadBalancer.ingress[0].hostname',
                timeout: options.timeout,
            });
            return loadBalancerAddress.value;
        }
        /**
         * Add nodes to this EKS cluster
         *
         * The nodes will automatically be configured with the right VPC and AMI
         * for the instance type and Kubernetes version.
         *
         * Note that if you specify `updateType: RollingUpdate` or `updateType: ReplacingUpdate`, your nodes might be replaced at deploy
         * time without notice in case the recommended AMI for your machine image type has been updated by AWS.
         * The default behavior for `updateType` is `None`, which means only new instances will be launched using the new AMI.
         *
         */
        addAutoScalingGroupCapacity(id, options) {
            try {
                jsiiDeprecationWarnings._aws_cdk_aws_eks_v2_alpha_AutoScalingGroupCapacityOptions(options);
            }
            catch (error) {
                if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                    Error.captureStackTrace(error, this.addAutoScalingGroupCapacity);
                }
                throw error;
            }
            if (options.machineImageType === MachineImageType.BOTTLEROCKET && options.bootstrapOptions !== undefined) {
                throw new core_1.UnscopedValidationError('bootstrapOptions is not supported for Bottlerocket');
            }
            const asg = new autoscaling.AutoScalingGroup(this, id, {
                ...options,
                vpc: this.vpc,
                machineImage: options.machineImageType === MachineImageType.BOTTLEROCKET ?
                    new bottlerocket_1.BottleRocketImage({
                        kubernetesVersion: this.version.version,
                    }) :
                    new EksOptimizedImage({
                        nodeType: nodeTypeForInstanceType(options.instanceType),
                        cpuArch: cpuArchForInstanceType(options.instanceType),
                        kubernetesVersion: this.version.version,
                    }),
            });
            this.connectAutoScalingGroupCapacity(asg, {
                bootstrapOptions: options.bootstrapOptions,
                bootstrapEnabled: options.bootstrapEnabled,
                machineImageType: options.machineImageType,
            });
            if (nodeTypeForInstanceType(options.instanceType) === NodeType.INFERENTIA ||
                nodeTypeForInstanceType(options.instanceType) === NodeType.TRAINIUM) {
                this.addNeuronDevicePlugin();
            }
            return asg;
        }
        /**
         * Add managed nodegroup to this Amazon EKS cluster
         *
         * This method will create a new managed nodegroup and add into the capacity.
         *
         * @see https://docs.aws.amazon.com/eks/latest/userguide/managed-node-groups.html
         * @param id The ID of the nodegroup
         * @param options options for creating a new nodegroup
         */
        addNodegroupCapacity(id, options) {
            try {
                jsiiDeprecationWarnings._aws_cdk_aws_eks_v2_alpha_NodegroupOptions(options);
            }
            catch (error) {
                if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                    Error.captureStackTrace(error, this.addNodegroupCapacity);
                }
                throw error;
            }
            const hasInferentiaOrTrainiumInstanceType = [
                options?.instanceType,
                ...options?.instanceTypes ?? [],
            ].some(i => i && (nodeTypeForInstanceType(i) === NodeType.INFERENTIA ||
                nodeTypeForInstanceType(i) === NodeType.TRAINIUM));
            if (hasInferentiaOrTrainiumInstanceType) {
                this.addNeuronDevicePlugin();
            }
            return new managed_nodegroup_1.Nodegroup(this, `Nodegroup${id}`, {
                cluster: this,
                ...options,
            });
        }
        /**
         * If this cluster is kubectl-enabled, returns the OpenID Connect issuer url.
         * If this cluster is not kubectl-enabled (i.e. uses the
         * stock `CfnCluster`), this is `undefined`.
         * @attribute
         */
        get clusterOpenIdConnectIssuerUrl() {
            return this.resource.attrOpenIdConnectIssuerUrl;
        }
        /**
         * An `OpenIdConnectProvider` resource associated with this cluster, and which can be used
         * to link this cluster to AWS IAM.
         *
         * A provider will only be defined if this property is accessed (lazy initialization).
         *
         */
        get openIdConnectProvider() {
            if (!this._openIdConnectProvider) {
                if (core_1.FeatureFlags.of(this).isEnabled(cx_api_1.EKS_USE_NATIVE_OIDC_PROVIDER)) {
                    this._openIdConnectProvider = new oidc_provider_1.OidcProviderNative(this, 'OidcProviderNative', {
                        url: this.clusterOpenIdConnectIssuerUrl,
                    });
                }
                else {
                    this._openIdConnectProvider = new oidc_provider_1.OpenIdConnectProvider(this, 'OpenIdConnectProvider', {
                        url: this.clusterOpenIdConnectIssuerUrl,
                    });
                }
            }
            return this._openIdConnectProvider;
        }
        get kubectlProvider() {
            return this._kubectlProvider;
        }
        /**
         * Retrieves the EKS Pod Identity Agent addon for the EKS cluster.
         *
         * The EKS Pod Identity Agent is responsible for managing the temporary credentials
         * used by pods in the cluster to access AWS resources. It runs as a DaemonSet on
         * each node and provides the necessary credentials to the pods based on their
         * associated service account.
         *
         */
        get eksPodIdentityAgent() {
            if (!this._eksPodIdentityAgent) {
                this._eksPodIdentityAgent = new addon_1.Addon(this, 'EksPodIdentityAgentAddon', {
                    cluster: this,
                    addonName: 'eks-pod-identity-agent',
                });
            }
            return this._eksPodIdentityAgent;
        }
        /**
         * Adds a Fargate profile to this cluster.
         * @see https://docs.aws.amazon.com/eks/latest/userguide/fargate-profile.html
         *
         * @param id the id of this profile
         * @param options profile options
         */
        addFargateProfile(id, options) {
            try {
                jsiiDeprecationWarnings._aws_cdk_aws_eks_v2_alpha_FargateProfileOptions(options);
            }
            catch (error) {
                if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                    Error.captureStackTrace(error, this.addFargateProfile);
                }
                throw error;
            }
            return new fargate_profile_1.FargateProfile(this, `fargate-profile-${id}`, {
                ...options,
                cluster: this,
            });
        }
        /**
         * Internal API used by `FargateProfile` to keep inventory of Fargate profiles associated with
         * this cluster, for the sake of ensuring the profiles are created sequentially.
         *
         * @returns the list of FargateProfiles attached to this cluster, including the one just attached.
         * @internal
         */
        _attachFargateProfile(fargateProfile) {
            this._fargateProfiles.push(fargateProfile);
            // add all profiles as a dependency of the "kubectl-ready" barrier because all kubectl-
            // resources can only be deployed after all fargate profiles are created.
            this._kubectlReadyBarrier.node.addDependency(fargateProfile);
            return this._fargateProfiles;
        }
        /**
         * validate all autoMode relevant configurations to ensure they are correct and throw
         * errors if they are not.
         *
         * @param props ClusterProps
         *
         */
        isValidAutoModeConfig(props) {
            const autoModeEnabled = props.defaultCapacityType === undefined || props.defaultCapacityType == DefaultCapacityType.AUTOMODE;
            // if using AUTOMODE
            if (autoModeEnabled) {
                // When using AUTOMODE, nodePools values are case-sensitive and must be general-purpose and/or system
                if (props.compute?.nodePools) {
                    const validNodePools = ['general-purpose', 'system'];
                    const invalidPools = props.compute.nodePools.filter(pool => !validNodePools.includes(pool));
                    if (invalidPools.length > 0) {
                        throw new core_1.UnscopedValidationError(`Invalid node pool values: ${invalidPools.join(', ')}. Valid values are: ${validNodePools.join(', ')}`);
                    }
                }
                // When using AUTOMODE, defaultCapacity and defaultCapacityInstance cannot be specified
                if (props.defaultCapacity !== undefined || props.defaultCapacityInstance !== undefined) {
                    throw new core_1.UnscopedValidationError('Cannot specify defaultCapacity or defaultCapacityInstance when using Auto Mode. Auto Mode manages compute resources automatically.');
                }
            }
            else {
                // if NOT using AUTOMODE
                if (props.compute) {
                    // When not using AUTOMODE, compute must be undefined
                    throw new core_1.UnscopedValidationError('Cannot specify compute without using DefaultCapacityType.AUTOMODE');
                }
            }
            return autoModeEnabled;
        }
        addNodePoolRole(id) {
            const role = new iam.Role(this, id, {
                assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
                // to be able to access the AWSLoadBalancerController
                managedPolicies: [
                    // see https://docs.aws.amazon.com/eks/latest/userguide/automode-get-started-cli.html#auto-mode-create-roles
                    iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSWorkerNodePolicy'),
                    iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'),
                ],
            });
            return role;
        }
        /**
         * Adds an access entry to the cluster's access entries map.
         *
         * If an entry already exists for the given principal, it adds the provided access policies to the existing entry.
         * If no entry exists for the given principal, it creates a new access entry with the provided access policies.
         *
         * @param principal - The principal (e.g., IAM user or role) for which the access entry is being added.
         * @param policies - An array of access policies to be associated with the principal.
         *
         * @throws {Error} If the uniqueName generated for the new access entry is not unique.
         *
         * @returns {void}
         */
        addToAccessEntry(id, principal, policies) {
            const entry = this.accessEntries.get(principal);
            if (entry) {
                entry.addAccessPolicies(policies);
            }
            else {
                const newEntry = new access_entry_1.AccessEntry(this, id, {
                    principal,
                    cluster: this,
                    accessPolicies: policies,
                });
                this.accessEntries.set(principal, newEntry);
            }
        }
        /**
         * Adds a resource scope that requires `kubectl` to this cluster and returns
         *
         * @internal
         */
        _dependOnKubectlBarrier(resource) {
            resource.node.addDependency(this._kubectlReadyBarrier);
        }
        selectPrivateSubnets() {
            const privateSubnets = [];
            const vpcPrivateSubnetIds = this.vpc.privateSubnets.map(s => s.subnetId);
            const vpcPublicSubnetIds = this.vpc.publicSubnets.map(s => s.subnetId);
            for (const placement of this.vpcSubnets) {
                for (const subnet of this.vpc.selectSubnets(placement).subnets) {
                    if (vpcPrivateSubnetIds.includes(subnet.subnetId)) {
                        // definitely private, take it.
                        privateSubnets.push(subnet);
                        continue;
                    }
                    if (vpcPublicSubnetIds.includes(subnet.subnetId)) {
                        // definitely public, skip it.
                        continue;
                    }
                    // neither public and nor private - what is it then? this means its a subnet instance that was explicitly passed
                    // in the subnet selection. since ISubnet doesn't contain information on type, we have to assume its private and let it
                    // fail at deploy time :\ (its better than filtering it out and preventing a possibly successful deployment)
                    privateSubnets.push(subnet);
                }
            }
            return privateSubnets;
        }
        /**
         * Installs the Neuron device plugin on the cluster if it's not
         * already added.
         */
        addNeuronDevicePlugin() {
            if (!this._neuronDevicePlugin) {
                const fileContents = fs.readFileSync(path.join(__dirname, 'addons', 'neuron-device-plugin.yaml'), 'utf8');
                const sanitized = YAML.parse(fileContents);
                this._neuronDevicePlugin = this.addManifest('NeuronDevicePlugin', sanitized);
            }
            return this._neuronDevicePlugin;
        }
        /**
         * Opportunistically tag subnets with the required tags.
         *
         * If no subnets could be found (because this is an imported VPC), add a warning.
         *
         * @see https://docs.aws.amazon.com/eks/latest/userguide/network_reqs.html
         */
        tagSubnets() {
            const tagAllSubnets = (type, subnets, tag) => {
                for (const subnet of subnets) {
                    // if this is not a concrete subnet, attach a construct warning
                    if (!ec2.Subnet.isVpcSubnet(subnet)) {
                        // message (if token): "could not auto-tag public/private subnet with tag..."
                        // message (if not token): "count not auto-tag public/private subnet xxxxx with tag..."
                        const subnetID = core_1.Token.isUnresolved(subnet.subnetId) || core_1.Token.isUnresolved([subnet.subnetId]) ? '' : ` ${subnet.subnetId}`;
                        core_1.Annotations.of(this).addWarningV2('@aws-cdk/aws-eks:clusterMustManuallyTagSubnet', `Could not auto-tag ${type} subnet${subnetID} with "${tag}=1", please remember to do this manually`);
                        continue;
                    }
                    core_1.Tags.of(subnet).add(tag, '1');
                }
            };
            // https://docs.aws.amazon.com/eks/latest/userguide/network_reqs.html
            tagAllSubnets('private', this.vpc.privateSubnets, 'kubernetes.io/role/internal-elb');
            tagAllSubnets('public', this.vpc.publicSubnets, 'kubernetes.io/role/elb');
        }
        /**
         * Patches the CoreDNS deployment configuration and sets the "eks.amazonaws.com/compute-type"
         * annotation to either "ec2" or "fargate". Note that if "ec2" is selected, the resource is
         * omitted/removed, since the cluster is created with the "ec2" compute type by default.
         */
        defineCoreDnsComputeType(type) {
            // ec2 is the "built in" compute type of the cluster so if this is the
            // requested type we can simply omit the resource. since the resource's
            // `restorePatch` is configured to restore the value to "ec2" this means
            // that deletion of the resource will change to "ec2" as well.
            if (type === CoreDnsComputeType.EC2) {
                return;
            }
            // this is the json patch we merge into the resource based off of:
            // https://docs.aws.amazon.com/eks/latest/userguide/fargate-getting-started.html#fargate-gs-coredns
            const renderPatch = (computeType) => ({
                spec: {
                    template: {
                        metadata: {
                            annotations: {
                                'eks.amazonaws.com/compute-type': computeType,
                            },
                        },
                    },
                },
            });
            const k8sPatch = new k8s_patch_1.KubernetesPatch(this, 'CoreDnsComputeTypePatch', {
                cluster: this,
                resourceName: 'deployment/coredns',
                resourceNamespace: 'kube-system',
                applyPatch: renderPatch(CoreDnsComputeType.FARGATE),
                restorePatch: renderPatch(CoreDnsComputeType.EC2),
            });
            // In Patch deletion, it needs to apply the restore patch to the cluster
            // So the cluster admin access can only be deleted after the patch
            if (this._clusterAdminAccess) {
                k8sPatch.node.addDependency(this._clusterAdminAccess);
            }
        }
        static {
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return Cluster = _classThis;
})();
exports.Cluster = Cluster;
/**
 * Import a cluster to use in another stack
 */
let ImportedCluster = (() => {
    let _classDecorators = [prop_injectable_1.propertyInjectable];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ClusterBase;
    var ImportedCluster = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ImportedCluster = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        props;
        /** Uniquely identifies this class. */
        static PROPERTY_INJECTION_ID = '@aws-cdk.aws-eks-v2-alpha.ImportedCluster';
        clusterName;
        clusterArn;
        connections = new ec2.Connections();
        ipFamily;
        prune;
        kubectlProvider;
        // so that `clusterSecurityGroup` on `ICluster` can be configured without optionality, avoiding users from having
        // to null check on an instance of `Cluster`, which will always have this configured.
        _clusterSecurityGroup;
        constructor(scope, id, props) {
            super(scope, id);
            this.props = props;
            // Enhanced CDK Analytics Telemetry
            (0, metadata_resource_1.addConstructMetadata)(this, props);
            this.clusterName = props.clusterName;
            this.clusterArn = this.stack.formatArn(clusterArnComponents(props.clusterName));
            this.ipFamily = props.ipFamily;
            this.kubectlProvider = props.kubectlProvider;
            this.prune = props.prune ?? true;
            let i = 1;
            for (const sgid of props.securityGroupIds ?? []) {
                this.connections.addSecurityGroup(ec2.SecurityGroup.fromSecurityGroupId(this, `SecurityGroup${i}`, sgid));
                i++;
            }
            if (props.clusterSecurityGroupId) {
                this._clusterSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, 'ClusterSecurityGroup', this.clusterSecurityGroupId);
                this.connections.addSecurityGroup(this._clusterSecurityGroup);
            }
        }
        get vpc() {
            if (!this.props.vpc) {
                throw new core_1.UnscopedValidationError('"vpc" is not defined for this imported cluster');
            }
            return this.props.vpc;
        }
        get clusterSecurityGroup() {
            if (!this._clusterSecurityGroup) {
                throw new core_1.UnscopedValidationError('"clusterSecurityGroup" is not defined for this imported cluster');
            }
            return this._clusterSecurityGroup;
        }
        get clusterSecurityGroupId() {
            if (!this.props.clusterSecurityGroupId) {
                throw new core_1.UnscopedValidationError('"clusterSecurityGroupId" is not defined for this imported cluster');
            }
            return this.props.clusterSecurityGroupId;
        }
        get clusterEndpoint() {
            if (!this.props.clusterEndpoint) {
                throw new core_1.UnscopedValidationError('"clusterEndpoint" is not defined for this imported cluster');
            }
            return this.props.clusterEndpoint;
        }
        get clusterCertificateAuthorityData() {
            if (!this.props.clusterCertificateAuthorityData) {
                throw new core_1.UnscopedValidationError('"clusterCertificateAuthorityData" is not defined for this imported cluster');
            }
            return this.props.clusterCertificateAuthorityData;
        }
        get clusterEncryptionConfigKeyArn() {
            if (!this.props.clusterEncryptionConfigKeyArn) {
                throw new core_1.UnscopedValidationError('"clusterEncryptionConfigKeyArn" is not defined for this imported cluster');
            }
            return this.props.clusterEncryptionConfigKeyArn;
        }
        get openIdConnectProvider() {
            if (!this.props.openIdConnectProvider) {
                throw new core_1.UnscopedValidationError('"openIdConnectProvider" is not defined for this imported cluster');
            }
            return this.props.openIdConnectProvider;
        }
        static {
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return ImportedCluster = _classThis;
})();
/**
 * Construct an Amazon Linux 2 image from the latest EKS Optimized AMI published in SSM
 */
class EksOptimizedImage {
    static [JSII_RTTI_SYMBOL_1] = { fqn: "@aws-cdk/aws-eks-v2-alpha.EksOptimizedImage", version: "0.0.0" };
    nodeType;
    cpuArch;
    kubernetesVersion;
    amiParameterName;
    /**
     * Constructs a new instance of the EcsOptimizedAmi class.
     */
    constructor(props = {}) {
        try {
            jsiiDeprecationWarnings._aws_cdk_aws_eks_v2_alpha_EksOptimizedImageProps(props);
        }
        catch (error) {
            if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                Error.captureStackTrace(error, EksOptimizedImage);
            }
            throw error;
        }
        this.nodeType = props.nodeType ?? NodeType.STANDARD;
        this.cpuArch = props.cpuArch ?? CpuArch.X86_64;
        this.kubernetesVersion = props.kubernetesVersion ?? LATEST_KUBERNETES_VERSION;
        // set the SSM parameter name
        this.amiParameterName = `/aws/service/eks/optimized-ami/${this.kubernetesVersion}/`
            + (this.nodeType === NodeType.STANDARD ? this.cpuArch === CpuArch.X86_64 ?
                'amazon-linux-2/' : 'amazon-linux-2-arm64/' : '')
            + (this.nodeType === NodeType.GPU ? 'amazon-linux-2-gpu/' : '')
            + (this.nodeType === NodeType.INFERENTIA ? 'amazon-linux-2-gpu/' : '')
            + (this.nodeType === NodeType.TRAINIUM ? 'amazon-linux-2-gpu/' : '')
            + 'recommended/image_id';
    }
    /**
     * Return the correct image
     */
    getImage(scope) {
        const ami = ssm.StringParameter.valueForStringParameter(scope, this.amiParameterName);
        return {
            imageId: ami,
            osType: ec2.OperatingSystemType.LINUX,
            userData: ec2.UserData.forLinux(),
        };
    }
}
exports.EksOptimizedImage = EksOptimizedImage;
// MAINTAINERS: use ./scripts/kube_bump.sh to update LATEST_KUBERNETES_VERSION
const LATEST_KUBERNETES_VERSION = '1.24';
/**
 * Whether the worker nodes should support GPU or just standard instances
 */
var NodeType;
(function (NodeType) {
    /**
     * Standard instances
     */
    NodeType["STANDARD"] = "Standard";
    /**
     * GPU instances
     */
    NodeType["GPU"] = "GPU";
    /**
     * Inferentia instances
     */
    NodeType["INFERENTIA"] = "INFERENTIA";
    /**
     * Trainium instances
     */
    NodeType["TRAINIUM"] = "TRAINIUM";
})(NodeType || (exports.NodeType = NodeType = {}));
/**
 * CPU architecture
 */
var CpuArch;
(function (CpuArch) {
    /**
     * arm64 CPU type
     */
    CpuArch["ARM_64"] = "arm64";
    /**
     * x86_64 CPU type
     */
    CpuArch["X86_64"] = "x86_64";
})(CpuArch || (exports.CpuArch = CpuArch = {}));
/**
 * The type of compute resources to use for CoreDNS.
 */
var CoreDnsComputeType;
(function (CoreDnsComputeType) {
    /**
     * Deploy CoreDNS on EC2 instances.
     */
    CoreDnsComputeType["EC2"] = "ec2";
    /**
     * Deploy CoreDNS on Fargate-managed instances.
     */
    CoreDnsComputeType["FARGATE"] = "fargate";
})(CoreDnsComputeType || (exports.CoreDnsComputeType = CoreDnsComputeType = {}));
/**
 * The default capacity type for the cluster
 */
var DefaultCapacityType;
(function (DefaultCapacityType) {
    /**
     * managed node group
     */
    DefaultCapacityType[DefaultCapacityType["NODEGROUP"] = 0] = "NODEGROUP";
    /**
     * EC2 autoscaling group
     */
    DefaultCapacityType[DefaultCapacityType["EC2"] = 1] = "EC2";
    /**
     * Auto Mode
     */
    DefaultCapacityType[DefaultCapacityType["AUTOMODE"] = 2] = "AUTOMODE";
})(DefaultCapacityType || (exports.DefaultCapacityType = DefaultCapacityType = {}));
/**
 * The machine image type
 */
var MachineImageType;
(function (MachineImageType) {
    /**
     * Amazon EKS-optimized Linux AMI
     */
    MachineImageType[MachineImageType["AMAZON_LINUX_2"] = 0] = "AMAZON_LINUX_2";
    /**
     * Bottlerocket AMI
     */
    MachineImageType[MachineImageType["BOTTLEROCKET"] = 1] = "BOTTLEROCKET";
})(MachineImageType || (exports.MachineImageType = MachineImageType = {}));
function nodeTypeForInstanceType(instanceType) {
    if (instance_types_1.INSTANCE_TYPES.gpu.includes(instanceType.toString().substring(0, 2))) {
        return NodeType.GPU;
    }
    else if (instance_types_1.INSTANCE_TYPES.inferentia.includes(instanceType.toString().substring(0, 4))) {
        return NodeType.INFERENTIA;
    }
    else if (instance_types_1.INSTANCE_TYPES.trainium.includes(instanceType.toString().substring(0, 4))) {
        return NodeType.TRAINIUM;
    }
    return NodeType.STANDARD;
}
function cpuArchForInstanceType(instanceType) {
    return instance_types_1.INSTANCE_TYPES.graviton2.includes(instanceType.toString().substring(0, 3)) ? CpuArch.ARM_64 :
        instance_types_1.INSTANCE_TYPES.graviton3.includes(instanceType.toString().substring(0, 3)) ? CpuArch.ARM_64 :
            instance_types_1.INSTANCE_TYPES.graviton.includes(instanceType.toString().substring(0, 2)) ? CpuArch.ARM_64 :
                CpuArch.X86_64;
}
function flatten(xss) {
    return Array.prototype.concat.call([], ...xss);
}
function clusterArnComponents(clusterName) {
    return {
        service: 'eks',
        resource: 'cluster',
        resourceName: clusterName,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2x1c3Rlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNsdXN0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEseUJBQXlCO0FBQ3pCLDZCQUE2QjtBQUM3QiwyREFBMkQ7QUFDM0QsMkNBQTJDO0FBQzNDLGlEQUFpRDtBQUNqRCwyQ0FBMkM7QUFFM0MsMkNBQTJDO0FBQzNDLDJDQUFnTDtBQUNoTCw0RUFBdUU7QUFDdkUsOEVBQThGO0FBQzlGLDBFQUEwRTtBQUMxRSwrQ0FBa0U7QUFDbEUsMkNBQTZDO0FBQzdDLDZCQUE2QjtBQUM3QixpREFBeUc7QUFDekcsbUNBQXdDO0FBQ3hDLHFEQUF1RTtBQUN2RSx1REFBMEU7QUFDMUUsNkNBQTJEO0FBQzNELHFEQUFrRDtBQUNsRCxpREFBK0U7QUFDL0UseURBQTJEO0FBQzNELDJDQUE4QztBQUM5Qyx5REFBK0Y7QUFDL0YsMkRBQWtFO0FBQ2xFLG1EQUE0RTtBQUM1RSx5REFBMkQ7QUFDM0QsdURBQTBFO0FBQzFFLDJDQUFvRjtBQUVwRiwwQ0FBMEM7QUFDMUMsTUFBTSxzQkFBc0IsR0FBRyxDQUFDLENBQUM7QUFDakMsTUFBTSxxQkFBcUIsR0FBRyxHQUFHLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBaWFoRzs7R0FFRztBQUNILE1BQWEsY0FBYztJQXVDUDs7SUF0Q2xCOzs7Ozs7Ozs7O09BVUc7SUFDSSxNQUFNLENBQVUsTUFBTSxHQUFHLElBQUksY0FBYyxDQUFDLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUVqRzs7O09BR0c7SUFDSSxNQUFNLENBQVUsT0FBTyxHQUFHLElBQUksY0FBYyxDQUFDLEVBQUUsYUFBYSxFQUFFLElBQUks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QUM7SUFDRCxPQUFPLFFBQVEsQ0FBQyxRQUFRLENBQUM7QUFDM0IsQ0FBQztBQUVELFNBQVMsc0JBQXNCLENBQUMsWUFBOEI7SUFDNUQsT0FBTywrQkFBYyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2xHLCtCQUFjLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDM0YsK0JBQWMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDMUYsT0FBTyxDQUFDLE1BQU0sQ0FBQztBQUN2QixDQUFDO0FBRUQsU0FBUyxPQUFPLENBQUksR0FBVTtJQUM1QixPQUFPLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQztBQUNqRCxDQUFDO0FBRUQsU0FBUyxvQkFBb0IsQ0FBQyxXQUFtQjtJQUMvQyxPQUFPO1FBQ0wsT0FBTyxFQUFFLEtBQUs7UUFDZCxRQUFRLEVBQUUsU0FBUztRQUNuQixZQUFZLEVBQUUsV0FBVztLQUMxQixDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBhdXRvc2NhbGluZyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXV0b3NjYWxpbmcnO1xuaW1wb3J0ICogYXMgZWMyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lYzInO1xuaW1wb3J0IHsgQ2ZuQ2x1c3RlciB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1la3MnO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0ICogYXMga21zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1rbXMnO1xuaW1wb3J0ICogYXMgc3NtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zc20nO1xuaW1wb3J0IHsgQW5ub3RhdGlvbnMsIENmbk91dHB1dCwgQ2ZuUmVzb3VyY2UsIElSZXNvdXJjZSwgUmVzb3VyY2UsIFRhZ3MsIFRva2VuLCBEdXJhdGlvbiwgQXJuQ29tcG9uZW50cywgU3RhY2ssIFVuc2NvcGVkVmFsaWRhdGlvbkVycm9yLCBGZWF0dXJlRmxhZ3MgfSBmcm9tICdhd3MtY2RrLWxpYi9jb3JlJztcbmltcG9ydCB7IG1lbW9pemVkR2V0dGVyIH0gZnJvbSAnYXdzLWNkay1saWIvY29yZS9saWIvaGVscGVycy1pbnRlcm5hbCc7XG5pbXBvcnQgeyBNZXRob2RNZXRhZGF0YSwgYWRkQ29uc3RydWN0TWV0YWRhdGEgfSBmcm9tICdhd3MtY2RrLWxpYi9jb3JlL2xpYi9tZXRhZGF0YS1yZXNvdXJjZSc7XG5pbXBvcnQgeyBwcm9wZXJ0eUluamVjdGFibGUgfSBmcm9tICdhd3MtY2RrLWxpYi9jb3JlL2xpYi9wcm9wLWluamVjdGFibGUnO1xuaW1wb3J0IHsgRUtTX1VTRV9OQVRJVkVfT0lEQ19QUk9WSURFUiB9IGZyb20gJ2F3cy1jZGstbGliL2N4LWFwaSc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QsIE5vZGUgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCAqIGFzIFlBTUwgZnJvbSAneWFtbCc7XG5pbXBvcnQgeyBJQWNjZXNzUG9saWN5LCBJQWNjZXNzRW50cnksIEFjY2Vzc0VudHJ5LCBBY2Nlc3NQb2xpY3ksIEFjY2Vzc1Njb3BlVHlwZSB9IGZyb20gJy4vYWNjZXNzLWVudHJ5JztcbmltcG9ydCB7IElBZGRvbiwgQWRkb24gfSBmcm9tICcuL2FkZG9uJztcbmltcG9ydCB7IEFsYkNvbnRyb2xsZXIsIEFsYkNvbnRyb2xsZXJPcHRpb25zIH0gZnJvbSAnLi9hbGItY29udHJvbGxlcic7XG5pbXBvcnQgeyBGYXJnYXRlUHJvZmlsZSwgRmFyZ2F0ZVByb2ZpbGVPcHRpb25zIH0gZnJvbSAnLi9mYXJnYXRlLXByb2ZpbGUnO1xuaW1wb3J0IHsgSGVsbUNoYXJ0LCBIZWxtQ2hhcnRPcHRpb25zIH0gZnJvbSAnLi9oZWxtLWNoYXJ0JztcbmltcG9ydCB7IElOU1RBTkNFX1RZUEVTIH0gZnJvbSAnLi9pbnN0YW5jZS10eXBlcyc7XG5pbXBvcnQgeyBLdWJlcm5ldGVzTWFuaWZlc3QsIEt1YmVybmV0ZXNNYW5pZmVzdE9wdGlvbnMgfSBmcm9tICcuL2s4cy1tYW5pZmVzdCc7XG5pbXBvcnQgeyBLdWJlcm5ldGVzT2JqZWN0VmFsdWUgfSBmcm9tICcuL2s4cy1vYmplY3QtdmFsdWUnO1xuaW1wb3J0IHsgS3ViZXJuZXRlc1BhdGNoIH0gZnJvbSAnLi9rOHMtcGF0Y2gnO1xuaW1wb3J0IHsgSUt1YmVjdGxQcm92aWRlciwgS3ViZWN0bFByb3ZpZGVyLCBLdWJlY3RsUHJvdmlkZXJPcHRpb25zIH0gZnJvbSAnLi9rdWJlY3RsLXByb3ZpZGVyJztcbmltcG9ydCB7IE5vZGVncm91cCwgTm9kZWdyb3VwT3B0aW9ucyB9IGZyb20gJy4vbWFuYWdlZC1ub2RlZ3JvdXAnO1xuaW1wb3J0IHsgT3BlbklkQ29ubmVjdFByb3ZpZGVyLCBPaWRjUHJvdmlkZXJOYXRpdmUgfSBmcm9tICcuL29pZGMtcHJvdmlkZXInO1xuaW1wb3J0IHsgQm90dGxlUm9ja2V0SW1hZ2UgfSBmcm9tICcuL3ByaXZhdGUvYm90dGxlcm9ja2V0JztcbmltcG9ydCB7IFNlcnZpY2VBY2NvdW50LCBTZXJ2aWNlQWNjb3VudE9wdGlvbnMgfSBmcm9tICcuL3NlcnZpY2UtYWNjb3VudCc7XG5pbXBvcnQgeyByZW5kZXJBbWF6b25MaW51eFVzZXJEYXRhLCByZW5kZXJCb3R0bGVyb2NrZXRVc2VyRGF0YSB9IGZyb20gJy4vdXNlci1kYXRhJztcblxuLy8gZGVmYXVsdHMgYXJlIGJhc2VkIG9uIGh0dHBzOi8vZWtzY3RsLmlvXG5jb25zdCBERUZBVUxUX0NBUEFDSVRZX0NPVU5UID0gMjtcbmNvbnN0IERFRkFVTFRfQ0FQQUNJVFlfVFlQRSA9IGVjMi5JbnN0YW5jZVR5cGUub2YoZWMyLkluc3RhbmNlQ2xhc3MuTTUsIGVjMi5JbnN0YW5jZVNpemUuTEFSR0UpO1xuXG4vKipcbiAqIEFuIEVLUyBjbHVzdGVyXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSUNsdXN0ZXIgZXh0ZW5kcyBJUmVzb3VyY2UsIGVjMi5JQ29ubmVjdGFibGUge1xuICAvKipcbiAgICogVGhlIFZQQyBpbiB3aGljaCB0aGlzIENsdXN0ZXIgd2FzIGNyZWF0ZWRcbiAgICovXG4gIHJlYWRvbmx5IHZwYzogZWMyLklWcGM7XG5cbiAgLyoqXG4gICAqIFRoZSBwaHlzaWNhbCBuYW1lIG9mIHRoZSBDbHVzdGVyXG4gICAqIEBhdHRyaWJ1dGVcbiAgICovXG4gIHJlYWRvbmx5IGNsdXN0ZXJOYW1lOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFRoZSB1bmlxdWUgQVJOIGFzc2lnbmVkIHRvIHRoZSBzZXJ2aWNlIGJ5IEFXU1xuICAgKiBpbiB0aGUgZm9ybSBvZiBhcm46YXdzOmVrczpcbiAgICogQGF0dHJpYnV0ZVxuICAgKi9cbiAgcmVhZG9ubHkgY2x1c3RlckFybjogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBUaGUgQVBJIFNlcnZlciBlbmRwb2ludCBVUkxcbiAgICogQGF0dHJpYnV0ZVxuICAgKi9cbiAgcmVhZG9ubHkgY2x1c3RlckVuZHBvaW50OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFRoZSBjZXJ0aWZpY2F0ZS1hdXRob3JpdHktZGF0YSBmb3IgeW91ciBjbHVzdGVyLlxuICAgKiBAYXR0cmlidXRlXG4gICAqL1xuICByZWFkb25seSBjbHVzdGVyQ2VydGlmaWNhdGVBdXRob3JpdHlEYXRhOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFRoZSBpZCBvZiB0aGUgY2x1c3RlciBzZWN1cml0eSBncm91cCB0aGF0IHdhcyBjcmVhdGVkIGJ5IEFtYXpvbiBFS1MgZm9yIHRoZSBjbHVzdGVyLlxuICAgKiBAYXR0cmlidXRlXG4gICAqL1xuICByZWFkb25seSBjbHVzdGVyU2VjdXJpdHlHcm91cElkOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFRoZSBjbHVzdGVyIHNlY3VyaXR5IGdyb3VwIHRoYXQgd2FzIGNyZWF0ZWQgYnkgQW1hem9uIEVLUyBmb3IgdGhlIGNsdXN0ZXIuXG4gICAqIEBhdHRyaWJ1dGVcbiAgICovXG4gIHJlYWRvbmx5IGNsdXN0ZXJTZWN1cml0eUdyb3VwOiBlYzIuSVNlY3VyaXR5R3JvdXA7XG5cbiAgLyoqXG4gICAqIEFtYXpvbiBSZXNvdXJjZSBOYW1lIChBUk4pIG9yIGFsaWFzIG9mIHRoZSBjdXN0b21lciBtYXN0ZXIga2V5IChDTUspLlxuICAgKiBAYXR0cmlidXRlXG4gICAqL1xuICByZWFkb25seSBjbHVzdGVyRW5jcnlwdGlvbkNvbmZpZ0tleUFybjogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBUaGUgT3BlbiBJRCBDb25uZWN0IFByb3ZpZGVyIG9mIHRoZSBjbHVzdGVyIHVzZWQgdG8gY29uZmlndXJlIFNlcnZpY2UgQWNjb3VudHMuXG4gICAqL1xuICByZWFkb25seSBvcGVuSWRDb25uZWN0UHJvdmlkZXI6IGlhbS5JT3BlbklkQ29ubmVjdFByb3ZpZGVyO1xuXG4gIC8qKlxuICAgKiBUaGUgRUtTIFBvZCBJZGVudGl0eSBBZ2VudCBhZGRvbiBmb3IgdGhlIEVLUyBjbHVzdGVyLlxuICAgKlxuICAgKiBUaGUgRUtTIFBvZCBJZGVudGl0eSBBZ2VudCBpcyByZXNwb25zaWJsZSBmb3IgbWFuYWdpbmcgdGhlIHRlbXBvcmFyeSBjcmVkZW50aWFsc1xuICAgKiB1c2VkIGJ5IHBvZHMgaW4gdGhlIGNsdXN0ZXIgdG8gYWNjZXNzIEFXUyByZXNvdXJjZXMuIEl0IHJ1bnMgYXMgYSBEYWVtb25TZXQgb25cbiAgICogZWFjaCBub2RlIGFuZCBwcm92aWRlcyB0aGUgbmVjZXNzYXJ5IGNyZWRlbnRpYWxzIHRvIHRoZSBwb2RzIGJhc2VkIG9uIHRoZWlyXG4gICAqIGFzc29jaWF0ZWQgc2VydmljZSBhY2NvdW50LlxuICAgKlxuICAgKiBUaGlzIHByb3BlcnR5IHJldHVybnMgdGhlIGBDZm5BZGRvbmAgcmVzb3VyY2UgcmVwcmVzZW50aW5nIHRoZSBFS1MgUG9kIElkZW50aXR5XG4gICAqIEFnZW50IGFkZG9uLiBJZiB0aGUgYWRkb24gaGFzIG5vdCBiZWVuIGNyZWF0ZWQgeWV0LCBpdCB3aWxsIGJlIGNyZWF0ZWQgYW5kXG4gICAqIHJldHVybmVkLlxuICAgKi9cbiAgcmVhZG9ubHkgZWtzUG9kSWRlbnRpdHlBZ2VudD86IElBZGRvbjtcblxuICAvKipcbiAgICogU3BlY2lmeSB3aGljaCBJUCBmYW1pbHkgaXMgdXNlZCB0byBhc3NpZ24gS3ViZXJuZXRlcyBwb2QgYW5kIHNlcnZpY2UgSVAgYWRkcmVzc2VzLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIElwRmFtaWx5LklQX1Y0XG4gICAqIEBzZWUgaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL2Vrcy9sYXRlc3QvQVBJUmVmZXJlbmNlL0FQSV9LdWJlcm5ldGVzTmV0d29ya0NvbmZpZ1JlcXVlc3QuaHRtbCNBbWF6b25FS1MtVHlwZS1LdWJlcm5ldGVzTmV0d29ya0NvbmZpZ1JlcXVlc3QtaXBGYW1pbHlcbiAgICovXG4gIHJlYWRvbmx5IGlwRmFtaWx5PzogSXBGYW1pbHk7XG5cbiAgLyoqXG4gICAqIE9wdGlvbnMgZm9yIGNyZWF0aW5nIHRoZSBrdWJlY3RsIHByb3ZpZGVyIC0gYSBsYW1iZGEgZnVuY3Rpb24gdGhhdCBleGVjdXRlcyBga3ViZWN0bGAgYW5kIGBoZWxtYFxuICAgKiBhZ2FpbnN0IHRoZSBjbHVzdGVyLiBJZiBkZWZpbmVkLCBga3ViZWN0bExheWVyYCBpcyBhIHJlcXVpcmVkIHByb3BlcnR5LlxuICAgKlxuICAgKiBJZiBub3QgZGVmaW5lZCwga3ViZWN0bCBwcm92aWRlciB3aWxsIG5vdCBiZSBjcmVhdGVkIGJ5IGRlZmF1bHQuXG4gICAqL1xuICByZWFkb25seSBrdWJlY3RsUHJvdmlkZXJPcHRpb25zPzogS3ViZWN0bFByb3ZpZGVyT3B0aW9ucztcblxuICAvKipcbiAgICogS3ViZWN0bCBQcm92aWRlciBmb3IgaXNzdWluZyBrdWJlY3RsIGNvbW1hbmRzIGFnYWluc3QgaXRcbiAgICpcbiAgICogSWYgbm90IGRlZmluZWQsIGEgZGVmYXVsdCBwcm92aWRlciB3aWxsIGJlIHVzZWRcbiAgICovXG4gIHJlYWRvbmx5IGt1YmVjdGxQcm92aWRlcj86IElLdWJlY3RsUHJvdmlkZXI7XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyB3aGV0aGVyIEt1YmVybmV0ZXMgcmVzb3VyY2VzIGNhbiBiZSBhdXRvbWF0aWNhbGx5IHBydW5lZC4gV2hlblxuICAgKiB0aGlzIGlzIGVuYWJsZWQgKGRlZmF1bHQpLCBwcnVuZSBsYWJlbHMgd2lsbCBiZSBhbGxvY2F0ZWQgYW5kIGluamVjdGVkIHRvXG4gICAqIGVhY2ggcmVzb3VyY2UuIFRoZXNlIGxhYmVscyB3aWxsIHRoZW4gYmUgdXNlZCB3aGVuIGlzc3VpbmcgdGhlIGBrdWJlY3RsXG4gICAqIGFwcGx5YCBvcGVyYXRpb24gd2l0aCB0aGUgYC0tcHJ1bmVgIHN3aXRjaC5cbiAgICovXG4gIHJlYWRvbmx5IHBydW5lOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IHNlcnZpY2UgYWNjb3VudCB3aXRoIGNvcnJlc3BvbmRpbmcgSUFNIFJvbGUgKElSU0EpLlxuICAgKlxuICAgKiBAcGFyYW0gaWQgbG9naWNhbCBpZCBvZiBzZXJ2aWNlIGFjY291bnRcbiAgICogQHBhcmFtIG9wdGlvbnMgc2VydmljZSBhY2NvdW50IG9wdGlvbnNcbiAgICovXG4gIGFkZFNlcnZpY2VBY2NvdW50KGlkOiBzdHJpbmcsIG9wdGlvbnM/OiBTZXJ2aWNlQWNjb3VudE9wdGlvbnMpOiBTZXJ2aWNlQWNjb3VudDtcblxuICAvKipcbiAgICogRGVmaW5lcyBhIEt1YmVybmV0ZXMgcmVzb3VyY2UgaW4gdGhpcyBjbHVzdGVyLlxuICAgKlxuICAgKiBUaGUgbWFuaWZlc3Qgd2lsbCBiZSBhcHBsaWVkL2RlbGV0ZWQgdXNpbmcga3ViZWN0bCBhcyBuZWVkZWQuXG4gICAqXG4gICAqIEBwYXJhbSBpZCBsb2dpY2FsIGlkIG9mIHRoaXMgbWFuaWZlc3RcbiAgICogQHBhcmFtIG1hbmlmZXN0IGEgbGlzdCBvZiBLdWJlcm5ldGVzIHJlc291cmNlIHNwZWNpZmljYXRpb25zXG4gICAqIEByZXR1cm5zIGEgYEt1YmVybmV0ZXNNYW5pZmVzdGAgb2JqZWN0LlxuICAgKi9cbiAgYWRkTWFuaWZlc3QoaWQ6IHN0cmluZywgLi4ubWFuaWZlc3Q6IFJlY29yZDxzdHJpbmcsIGFueT5bXSk6IEt1YmVybmV0ZXNNYW5pZmVzdDtcblxuICAvKipcbiAgICogRGVmaW5lcyBhIEhlbG0gY2hhcnQgaW4gdGhpcyBjbHVzdGVyLlxuICAgKlxuICAgKiBAcGFyYW0gaWQgbG9naWNhbCBpZCBvZiB0aGlzIGNoYXJ0LlxuICAgKiBAcGFyYW0gb3B0aW9ucyBvcHRpb25zIG9mIHRoaXMgY2hhcnQuXG4gICAqIEByZXR1cm5zIGEgYEhlbG1DaGFydGAgY29uc3RydWN0XG4gICAqL1xuICBhZGRIZWxtQ2hhcnQoaWQ6IHN0cmluZywgb3B0aW9uczogSGVsbUNoYXJ0T3B0aW9ucyk6IEhlbG1DaGFydDtcblxuICAvKipcbiAgICogRGVmaW5lcyBhIENESzhzIGNoYXJ0IGluIHRoaXMgY2x1c3Rlci5cbiAgICpcbiAgICogQHBhcmFtIGlkIGxvZ2ljYWwgaWQgb2YgdGhpcyBjaGFydC5cbiAgICogQHBhcmFtIGNoYXJ0IHRoZSBjZGs4cyBjaGFydC5cbiAgICogQHJldHVybnMgYSBgS3ViZXJuZXRlc01hbmlmZXN0YCBjb25zdHJ1Y3QgcmVwcmVzZW50aW5nIHRoZSBjaGFydC5cbiAgICovXG4gIGFkZENkazhzQ2hhcnQoaWQ6IHN0cmluZywgY2hhcnQ6IENvbnN0cnVjdCwgb3B0aW9ucz86IEt1YmVybmV0ZXNNYW5pZmVzdE9wdGlvbnMpOiBLdWJlcm5ldGVzTWFuaWZlc3Q7XG5cbiAgLyoqXG4gICAqIENvbm5lY3QgY2FwYWNpdHkgaW4gdGhlIGZvcm0gb2YgYW4gZXhpc3RpbmcgQXV0b1NjYWxpbmdHcm91cCB0byB0aGUgRUtTIGNsdXN0ZXIuXG4gICAqXG4gICAqIFRoZSBBdXRvU2NhbGluZ0dyb3VwIG11c3QgYmUgcnVubmluZyBhbiBFS1Mtb3B0aW1pemVkIEFNSSBjb250YWluaW5nIHRoZVxuICAgKiAvZXRjL2Vrcy9ib290c3RyYXAuc2ggc2NyaXB0LiBUaGlzIG1ldGhvZCB3aWxsIGNvbmZpZ3VyZSBTZWN1cml0eSBHcm91cHMsXG4gICAqIGFkZCB0aGUgcmlnaHQgcG9saWNpZXMgdG8gdGhlIGluc3RhbmNlIHJvbGUsIGFwcGx5IHRoZSByaWdodCB0YWdzLCBhbmQgYWRkXG4gICAqIHRoZSByZXF1aXJlZCB1c2VyIGRhdGEgdG8gdGhlIGluc3RhbmNlJ3MgbGF1bmNoIGNvbmZpZ3VyYXRpb24uXG4gICAqXG4gICAqIFByZWZlciB0byB1c2UgYGFkZEF1dG9TY2FsaW5nR3JvdXBDYXBhY2l0eWAgaWYgcG9zc2libGUuXG4gICAqXG4gICAqIEBzZWUgaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL2Vrcy9sYXRlc3QvdXNlcmd1aWRlL2xhdW5jaC13b3JrZXJzLmh0bWxcbiAgICogQHBhcmFtIGF1dG9TY2FsaW5nR3JvdXAgW2Rpc2FibGUtYXdzbGludDpyZWYtdmlhLWludGVyZmFjZV1cbiAgICogQHBhcmFtIG9wdGlvbnMgb3B0aW9ucyBmb3IgYWRkaW5nIGF1dG8gc2NhbGluZyBncm91cHMsIGxpa2UgY3VzdG9taXppbmcgdGhlIGJvb3RzdHJhcCBzY3JpcHRcbiAgICovXG4gIGNvbm5lY3RBdXRvU2NhbGluZ0dyb3VwQ2FwYWNpdHkoYXV0b1NjYWxpbmdHcm91cDogYXV0b3NjYWxpbmcuQXV0b1NjYWxpbmdHcm91cCwgb3B0aW9uczogQXV0b1NjYWxpbmdHcm91cE9wdGlvbnMpOiB2b2lkO1xufVxuXG4vKipcbiAqIEF0dHJpYnV0ZXMgZm9yIEVLUyBjbHVzdGVycy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDbHVzdGVyQXR0cmlidXRlcyB7XG4gIC8qKlxuICAgKiBUaGUgVlBDIGluIHdoaWNoIHRoaXMgQ2x1c3RlciB3YXMgY3JlYXRlZFxuICAgKiBAZGVmYXVsdCAtIGlmIG5vdCBzcGVjaWZpZWQgYGNsdXN0ZXIudnBjYCB3aWxsIHRocm93IGFuIGVycm9yXG4gICAqL1xuICByZWFkb25seSB2cGM/OiBlYzIuSVZwYztcblxuICAvKipcbiAgICogVGhlIHBoeXNpY2FsIG5hbWUgb2YgdGhlIENsdXN0ZXJcbiAgICovXG4gIHJlYWRvbmx5IGNsdXN0ZXJOYW1lOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFRoZSBBUEkgU2VydmVyIGVuZHBvaW50IFVSTFxuICAgKiBAZGVmYXVsdCAtIGlmIG5vdCBzcGVjaWZpZWQgYGNsdXN0ZXIuY2x1c3RlckVuZHBvaW50YCB3aWxsIHRocm93IGFuIGVycm9yLlxuICAgKi9cbiAgcmVhZG9ubHkgY2x1c3RlckVuZHBvaW50Pzogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBUaGUgY2VydGlmaWNhdGUtYXV0aG9yaXR5LWRhdGEgZm9yIHlvdXIgY2x1c3Rlci5cbiAgICogQGRlZmF1bHQgLSBpZiBub3Qgc3BlY2lmaWVkIGBjbHVzdGVyLmNsdXN0ZXJDZXJ0aWZpY2F0ZUF1dGhvcml0eURhdGFgIHdpbGxcbiAgICogdGhyb3cgYW4gZXJyb3JcbiAgICovXG4gIHJlYWRvbmx5IGNsdXN0ZXJDZXJ0aWZpY2F0ZUF1dGhvcml0eURhdGE/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFRoZSBjbHVzdGVyIHNlY3VyaXR5IGdyb3VwIHRoYXQgd2FzIGNyZWF0ZWQgYnkgQW1hem9uIEVLUyBmb3IgdGhlIGNsdXN0ZXIuXG4gICAqIEBkZWZhdWx0IC0gaWYgbm90IHNwZWNpZmllZCBgY2x1c3Rlci5jbHVzdGVyU2VjdXJpdHlHcm91cElkYCB3aWxsIHRocm93IGFuXG4gICAqIGVycm9yXG4gICAqL1xuICByZWFkb25seSBjbHVzdGVyU2VjdXJpdHlHcm91cElkPzogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBBbWF6b24gUmVzb3VyY2UgTmFtZSAoQVJOKSBvciBhbGlhcyBvZiB0aGUgY3VzdG9tZXIgbWFzdGVyIGtleSAoQ01LKS5cbiAgICogQGRlZmF1bHQgLSBpZiBub3Qgc3BlY2lmaWVkIGBjbHVzdGVyLmNsdXN0ZXJFbmNyeXB0aW9uQ29uZmlnS2V5QXJuYCB3aWxsXG4gICAqIHRocm93IGFuIGVycm9yXG4gICAqL1xuICByZWFkb25seSBjbHVzdGVyRW5jcnlwdGlvbkNvbmZpZ0tleUFybj86IHN0cmluZztcblxuICAvKipcbiAgICogU3BlY2lmeSB3aGljaCBJUCBmYW1pbHkgaXMgdXNlZCB0byBhc3NpZ24gS3ViZXJuZXRlcyBwb2QgYW5kIHNlcnZpY2UgSVAgYWRkcmVzc2VzLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIElwRmFtaWx5LklQX1Y0XG4gICAqIEBzZWUgaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL2Vrcy9sYXRlc3QvQVBJUmVmZXJlbmNlL0FQSV9LdWJlcm5ldGVzTmV0d29ya0NvbmZpZ1JlcXVlc3QuaHRtbCNBbWF6b25FS1MtVHlwZS1LdWJlcm5ldGVzTmV0d29ya0NvbmZpZ1JlcXVlc3QtaXBGYW1pbHlcbiAgICovXG4gIHJlYWRvbmx5IGlwRmFtaWx5PzogSXBGYW1pbHk7XG5cbiAgLyoqXG4gICAqIEFkZGl0aW9uYWwgc2VjdXJpdHkgZ3JvdXBzIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGNsdXN0ZXIuXG4gICAqIEBkZWZhdWx0IC0gaWYgbm90IHNwZWNpZmllZCwgbm8gYWRkaXRpb25hbCBzZWN1cml0eSBncm91cHMgd2lsbCBiZVxuICAgKiBjb25zaWRlcmVkIGluIGBjbHVzdGVyLmNvbm5lY3Rpb25zYC5cbiAgICovXG4gIHJlYWRvbmx5IHNlY3VyaXR5R3JvdXBJZHM/OiBzdHJpbmdbXTtcblxuICAvKipcbiAgICogQW4gT3BlbiBJRCBDb25uZWN0IHByb3ZpZGVyIGZvciB0aGlzIGNsdXN0ZXIgdGhhdCBjYW4gYmUgdXNlZCB0byBjb25maWd1cmUgc2VydmljZSBhY2NvdW50cy5cbiAgICogWW91IGNhbiBlaXRoZXIgaW1wb3J0IGFuIGV4aXN0aW5nIHByb3ZpZGVyIHVzaW5nIGBpYW0uT3BlbklkQ29ubmVjdFByb3ZpZGVyLmZyb21Qcm92aWRlckFybmAsXG4gICAqIG9yIGNyZWF0ZSBhIG5ldyBwcm92aWRlciB1c2luZyBgbmV3IGVrcy5PcGVuSWRDb25uZWN0UHJvdmlkZXJgXG4gICAqIEBkZWZhdWx0IC0gaWYgbm90IHNwZWNpZmllZCBgY2x1c3Rlci5vcGVuSWRDb25uZWN0UHJvdmlkZXJgIGFuZCBgY2x1c3Rlci5hZGRTZXJ2aWNlQWNjb3VudGAgd2lsbCB0aHJvdyBhbiBlcnJvci5cbiAgICovXG4gIHJlYWRvbmx5IG9wZW5JZENvbm5lY3RQcm92aWRlcj86IGlhbS5JT3BlbklkQ29ubmVjdFByb3ZpZGVyO1xuXG4gIC8qKlxuICAgKiBLdWJlY3RsUHJvdmlkZXIgZm9yIGlzc3Vpbmcga3ViZWN0bCBjb21tYW5kcy5cbiAgICpcbiAgICogQGRlZmF1bHQgLSBEZWZhdWx0IENESyBwcm92aWRlclxuICAgKi9cbiAgcmVhZG9ubHkga3ViZWN0bFByb3ZpZGVyPzogSUt1YmVjdGxQcm92aWRlcjtcblxuICAvKipcbiAgICogT3B0aW9ucyBmb3IgY3JlYXRpbmcgdGhlIGt1YmVjdGwgcHJvdmlkZXIgLSBhIGxhbWJkYSBmdW5jdGlvbiB0aGF0IGV4ZWN1dGVzIGBrdWJlY3RsYCBhbmQgYGhlbG1gXG4gICAqIGFnYWluc3QgdGhlIGNsdXN0ZXIuIElmIGRlZmluZWQsIGBrdWJlY3RsTGF5ZXJgIGlzIGEgcmVxdWlyZWQgcHJvcGVydHkuXG4gICAqXG4gICAqIElmIG5vdCBkZWZpbmVkLCBrdWJlY3RsIHByb3ZpZGVyIHdpbGwgbm90IGJlIGNyZWF0ZWQgYnkgZGVmYXVsdC5cbiAgICovXG4gIHJlYWRvbmx5IGt1YmVjdGxQcm92aWRlck9wdGlvbnM/OiBLdWJlY3RsUHJvdmlkZXJPcHRpb25zO1xuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgd2hldGhlciBLdWJlcm5ldGVzIHJlc291cmNlcyBhZGRlZCB0aHJvdWdoIGBhZGRNYW5pZmVzdCgpYCBjYW4gYmVcbiAgICogYXV0b21hdGljYWxseSBwcnVuZWQuIFdoZW4gdGhpcyBpcyBlbmFibGVkIChkZWZhdWx0KSwgcHJ1bmUgbGFiZWxzIHdpbGwgYmVcbiAgICogYWxsb2NhdGVkIGFuZCBpbmplY3RlZCB0byBlYWNoIHJlc291cmNlLiBUaGVzZSBsYWJlbHMgd2lsbCB0aGVuIGJlIHVzZWRcbiAgICogd2hlbiBpc3N1aW5nIHRoZSBga3ViZWN0bCBhcHBseWAgb3BlcmF0aW9uIHdpdGggdGhlIGAtLXBydW5lYCBzd2l0Y2guXG4gICAqXG4gICAqIEBkZWZhdWx0IHRydWVcbiAgICovXG4gIHJlYWRvbmx5IHBydW5lPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBPcHRpb25zIGZvciBjb25maWd1cmluZyBhbiBFS1MgY2x1c3Rlci5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDbHVzdGVyQ29tbW9uT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBUaGUgVlBDIGluIHdoaWNoIHRvIGNyZWF0ZSB0aGUgQ2x1c3Rlci5cbiAgICpcbiAgICogQGRlZmF1bHQgLSBhIFZQQyB3aXRoIGRlZmF1bHQgY29uZmlndXJhdGlvbiB3aWxsIGJlIGNyZWF0ZWQgYW5kIGNhbiBiZSBhY2Nlc3NlZCB0aHJvdWdoIGBjbHVzdGVyLnZwY2AuXG4gICAqL1xuICByZWFkb25seSB2cGM/OiBlYzIuSVZwYztcblxuICAvKipcbiAgICogV2hlcmUgdG8gcGxhY2UgRUtTIENvbnRyb2wgUGxhbmUgRU5Jc1xuICAgKlxuICAgKiBGb3IgZXhhbXBsZSwgdG8gb25seSBzZWxlY3QgcHJpdmF0ZSBzdWJuZXRzLCBzdXBwbHkgdGhlIGZvbGxvd2luZzpcbiAgICpcbiAgICogYHZwY1N1Ym5ldHM6IFt7IHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBSSVZBVEVfV0lUSF9FR1JFU1MgfV1gXG4gICAqXG4gICAqIEBkZWZhdWx0IC0gQWxsIHB1YmxpYyBhbmQgcHJpdmF0ZSBzdWJuZXRzXG4gICAqL1xuICByZWFkb25seSB2cGNTdWJuZXRzPzogZWMyLlN1Ym5ldFNlbGVjdGlvbltdO1xuXG4gIC8qKlxuICAgKiBSb2xlIHRoYXQgcHJvdmlkZXMgcGVybWlzc2lvbnMgZm9yIHRoZSBLdWJlcm5ldGVzIGNvbnRyb2wgcGxhbmUgdG8gbWFrZSBjYWxscyB0byBBV1MgQVBJIG9wZXJhdGlvbnMgb24geW91ciBiZWhhbGYuXG4gICAqXG4gICAqIEBkZWZhdWx0IC0gQSByb2xlIGlzIGF1dG9tYXRpY2FsbHkgY3JlYXRlZCBmb3IgeW91XG4gICAqL1xuICByZWFkb25seSByb2xlPzogaWFtLklSb2xlO1xuXG4gIC8qKlxuICAgKiBOYW1lIGZvciB0aGUgY2x1c3Rlci5cbiAgICpcbiAgICogQGRlZmF1bHQgLSBBdXRvbWF0aWNhbGx5IGdlbmVyYXRlZCBuYW1lXG4gICAqL1xuICByZWFkb25seSBjbHVzdGVyTmFtZT86IHN0cmluZztcblxuICAvKipcbiAgICogU2VjdXJpdHkgR3JvdXAgdG8gdXNlIGZvciBDb250cm9sIFBsYW5lIEVOSXNcbiAgICpcbiAgICogQGRlZmF1bHQgLSBBIHNlY3VyaXR5IGdyb3VwIGlzIGF1dG9tYXRpY2FsbHkgY3JlYXRlZFxuICAgKi9cbiAgcmVhZG9ubHkgc2VjdXJpdHlHcm91cD86IGVjMi5JU2VjdXJpdHlHcm91cDtcblxuICAvKipcbiAgICogVGhlIEt1YmVybmV0ZXMgdmVyc2lvbiB0byBydW4gaW4gdGhlIGNsdXN0ZXJcbiAgICovXG4gIHJlYWRvbmx5IHZlcnNpb246IEt1YmVybmV0ZXNWZXJzaW9uO1xuXG4gIC8qKlxuICAgKiBBbiBJQU0gcm9sZSB0aGF0IHdpbGwgYmUgYWRkZWQgdG8gdGhlIGBzeXN0ZW06bWFzdGVyc2AgS3ViZXJuZXRlcyBSQkFDXG4gICAqIGdyb3VwLlxuICAgKlxuICAgKiBAc2VlIGh0dHBzOi8va3ViZXJuZXRlcy5pby9kb2NzL3JlZmVyZW5jZS9hY2Nlc3MtYXV0aG4tYXV0aHovcmJhYy8jZGVmYXVsdC1yb2xlcy1hbmQtcm9sZS1iaW5kaW5nc1xuICAgKlxuICAgKiBAZGVmYXVsdCAtIG5vIG1hc3RlcnMgcm9sZS5cbiAgICovXG4gIHJlYWRvbmx5IG1hc3RlcnNSb2xlPzogaWFtLklSb2xlO1xuXG4gIC8qKlxuICAgKiBDb250cm9scyB0aGUgXCJla3MuYW1hem9uYXdzLmNvbS9jb21wdXRlLXR5cGVcIiBhbm5vdGF0aW9uIGluIHRoZSBDb3JlRE5TXG4gICAqIGNvbmZpZ3VyYXRpb24gb24geW91ciBjbHVzdGVyIHRvIGRldGVybWluZSB3aGljaCBjb21wdXRlIHR5cGUgdG8gdXNlXG4gICAqIGZvciBDb3JlRE5TLlxuICAgKlxuICAgKiBAZGVmYXVsdCBDb3JlRG5zQ29tcHV0ZVR5cGUuRUMyIChmb3IgYEZhcmdhdGVDbHVzdGVyYCB0aGUgZGVmYXVsdCBpcyBGQVJHQVRFKVxuICAgKi9cbiAgcmVhZG9ubHkgY29yZURuc0NvbXB1dGVUeXBlPzogQ29yZURuc0NvbXB1dGVUeXBlO1xuXG4gIC8qKlxuICAgKiBDb25maWd1cmUgYWNjZXNzIHRvIHRoZSBLdWJlcm5ldGVzIEFQSSBzZXJ2ZXIgZW5kcG9pbnQuLlxuICAgKlxuICAgKiBAc2VlIGh0dHBzOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9la3MvbGF0ZXN0L3VzZXJndWlkZS9jbHVzdGVyLWVuZHBvaW50Lmh0bWxcbiAgICpcbiAgICogQGRlZmF1bHQgRW5kcG9pbnRBY2Nlc3MuUFVCTElDX0FORF9QUklWQVRFXG4gICAqL1xuICByZWFkb25seSBlbmRwb2ludEFjY2Vzcz86IEVuZHBvaW50QWNjZXNzO1xuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgd2hldGhlciBLdWJlcm5ldGVzIHJlc291cmNlcyBhZGRlZCB0aHJvdWdoIGBhZGRNYW5pZmVzdCgpYCBjYW4gYmVcbiAgICogYXV0b21hdGljYWxseSBwcnVuZWQuIFdoZW4gdGhpcyBpcyBlbmFibGVkIChkZWZhdWx0KSwgcHJ1bmUgbGFiZWxzIHdpbGwgYmVcbiAgICogYWxsb2NhdGVkIGFuZCBpbmplY3RlZCB0byBlYWNoIHJlc291cmNlLiBUaGVzZSBsYWJlbHMgd2lsbCB0aGVuIGJlIHVzZWRcbiAgICogd2hlbiBpc3N1aW5nIHRoZSBga3ViZWN0bCBhcHBseWAgb3BlcmF0aW9uIHdpdGggdGhlIGAtLXBydW5lYCBzd2l0Y2guXG4gICAqXG4gICAqIEBkZWZhdWx0IHRydWVcbiAgICovXG4gIHJlYWRvbmx5IHBydW5lPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogS01TIHNlY3JldCBmb3IgZW52ZWxvcGUgZW5jcnlwdGlvbiBmb3IgS3ViZXJuZXRlcyBzZWNyZXRzLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIEJ5IGRlZmF1bHQsIEt1YmVybmV0ZXMgc3RvcmVzIGFsbCBzZWNyZXQgb2JqZWN0IGRhdGEgd2l0aGluIGV0Y2QgYW5kXG4gICAqICAgICAgICAgICAgYWxsIGV0Y2Qgdm9sdW1lcyB1c2VkIGJ5IEFtYXpvbiBFS1MgYXJlIGVuY3J5cHRlZCBhdCB0aGUgZGlzay1sZXZlbFxuICAgKiAgICAgICAgICAgIHVzaW5nIEFXUy1NYW5hZ2VkIGVuY3J5cHRpb24ga2V5cy5cbiAgICovXG4gIHJlYWRvbmx5IHNlY3JldHNFbmNyeXB0aW9uS2V5Pzoga21zLklLZXlSZWY7XG5cbiAgLyoqXG4gICAqIFNwZWNpZnkgd2hpY2ggSVAgZmFtaWx5IGlzIHVzZWQgdG8gYXNzaWduIEt1YmVybmV0ZXMgcG9kIGFuZCBzZXJ2aWNlIElQIGFkZHJlc3Nlcy5cbiAgICpcbiAgICogQGRlZmF1bHQgSXBGYW1pbHkuSVBfVjRcbiAgICogQHNlZSBodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vZWtzL2xhdGVzdC9BUElSZWZlcmVuY2UvQVBJX0t1YmVybmV0ZXNOZXR3b3JrQ29uZmlnUmVxdWVzdC5odG1sI0FtYXpvbkVLUy1UeXBlLUt1YmVybmV0ZXNOZXR3b3JrQ29uZmlnUmVxdWVzdC1pcEZhbWlseVxuICAgKi9cbiAgcmVhZG9ubHkgaXBGYW1pbHk/OiBJcEZhbWlseTtcblxuICAvKipcbiAgICogVGhlIENJRFIgYmxvY2sgdG8gYXNzaWduIEt1YmVybmV0ZXMgc2VydmljZSBJUCBhZGRyZXNzZXMgZnJvbS5cbiAgICpcbiAgICogQGRlZmF1bHQgLSBLdWJlcm5ldGVzIGFzc2lnbnMgYWRkcmVzc2VzIGZyb20gZWl0aGVyIHRoZVxuICAgKiAgICAgICAgICAgIDEwLjEwMC4wLjAvMTYgb3IgMTcyLjIwLjAuMC8xNiBDSURSIGJsb2Nrc1xuICAgKiBAc2VlIGh0dHBzOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9la3MvbGF0ZXN0L0FQSVJlZmVyZW5jZS9BUElfS3ViZXJuZXRlc05ldHdvcmtDb25maWdSZXF1ZXN0Lmh0bWwjQW1hem9uRUtTLVR5cGUtS3ViZXJuZXRlc05ldHdvcmtDb25maWdSZXF1ZXN0LXNlcnZpY2VJcHY0Q2lkclxuICAgKi9cbiAgcmVhZG9ubHkgc2VydmljZUlwdjRDaWRyPzogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBJbnN0YWxsIHRoZSBBV1MgTG9hZCBCYWxhbmNlciBDb250cm9sbGVyIG9udG8gdGhlIGNsdXN0ZXIuXG4gICAqXG4gICAqIEBzZWUgaHR0cHM6Ly9rdWJlcm5ldGVzLXNpZ3MuZ2l0aHViLmlvL2F3cy1sb2FkLWJhbGFuY2VyLWNvbnRyb2xsZXJcbiAgICpcbiAgICogQGRlZmF1bHQgLSBUaGUgY29udHJvbGxlciBpcyBub3QgaW5zdGFsbGVkLlxuICAgKi9cbiAgcmVhZG9ubHkgYWxiQ29udHJvbGxlcj86IEFsYkNvbnRyb2xsZXJPcHRpb25zO1xuXG4gIC8qKlxuICAgKiBUaGUgY2x1c3RlciBsb2cgdHlwZXMgd2hpY2ggeW91IHdhbnQgdG8gZW5hYmxlLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIG5vbmVcbiAgICovXG4gIHJlYWRvbmx5IGNsdXN0ZXJMb2dnaW5nPzogQ2x1c3RlckxvZ2dpbmdUeXBlc1tdO1xuXG4gIC8qKlxuICAgKiBUaGUgdGFncyBhc3NpZ25lZCB0byB0aGUgRUtTIGNsdXN0ZXJcbiAgICpcbiAgICogQGRlZmF1bHQgLSBub25lXG4gICAqL1xuICByZWFkb25seSB0YWdzPzogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfTtcblxuICAvKipcbiAgICogT3B0aW9ucyBmb3IgY3JlYXRpbmcgdGhlIGt1YmVjdGwgcHJvdmlkZXIgLSBhIGxhbWJkYSBmdW5jdGlvbiB0aGF0IGV4ZWN1dGVzIGBrdWJlY3RsYCBhbmQgYGhlbG1gXG4gICAqIGFnYWluc3QgdGhlIGNsdXN0ZXIuIElmIGRlZmluZWQsIGBrdWJlY3RsTGF5ZXJgIGlzIGEgcmVxdWlyZWQgcHJvcGVydHkuXG4gICAqXG4gICAqIElmIG5vdCBkZWZpbmVkLCBrdWJlY3RsIHByb3ZpZGVyIHdpbGwgbm90IGJlIGNyZWF0ZWQgYnkgZGVmYXVsdC5cbiAgICovXG4gIHJlYWRvbmx5IGt1YmVjdGxQcm92aWRlck9wdGlvbnM/OiBLdWJlY3RsUHJvdmlkZXJPcHRpb25zO1xufVxuXG4vKipcbiAqIEdyb3VwIGFjY2VzcyBjb25maWd1cmF0aW9uIHRvZ2V0aGVyLlxuICovXG5pbnRlcmZhY2UgRW5kcG9pbnRBY2Nlc3NDb25maWcge1xuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgcHJpdmF0ZSBhY2Nlc3MgaXMgZW5hYmxlZC5cbiAgICovXG4gIHJlYWRvbmx5IHByaXZhdGVBY2Nlc3M6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiBwdWJsaWMgYWNjZXNzIGlzIGVuYWJsZWQuXG4gICAqL1xuICByZWFkb25seSBwdWJsaWNBY2Nlc3M6IGJvb2xlYW47XG4gIC8qKlxuICAgKiBQdWJsaWMgYWNjZXNzIGlzIGFsbG93ZWQgb25seSBmcm9tIHRoZXNlIENJRFIgYmxvY2tzLlxuICAgKiBBbiBlbXB0eSBhcnJheSBtZWFucyBhY2Nlc3MgaXMgb3BlbiB0byBhbnkgYWRkcmVzcy5cbiAgICpcbiAgICogQGRlZmF1bHQgLSBObyByZXN0cmljdGlvbnMuXG4gICAqL1xuICByZWFkb25seSBwdWJsaWNDaWRycz86IHN0cmluZ1tdO1xuXG59XG5cbi8qKlxuICogRW5kcG9pbnQgYWNjZXNzIGNoYXJhY3RlcmlzdGljcy5cbiAqL1xuZXhwb3J0IGNsYXNzIEVuZHBvaW50QWNjZXNzIHtcbiAgLyoqXG4gICAqIFRoZSBjbHVzdGVyIGVuZHBvaW50IGlzIGFjY2Vzc2libGUgZnJvbSBvdXRzaWRlIG9mIHlvdXIgVlBDLlxuICAgKiBXb3JrZXIgbm9kZSB0cmFmZmljIHdpbGwgbGVhdmUgeW91ciBWUEMgdG8gY29ubmVjdCB0byB0aGUgZW5kcG9pbnQuXG4gICAqXG4gICAqIEJ5IGRlZmF1bHQsIHRoZSBlbmRwb2ludCBpcyBleHBvc2VkIHRvIGFsbCBhZHJlc3Nlcy4gWW91IGNhbiBvcHRpb25hbGx5IGxpbWl0IHRoZSBDSURSIGJsb2NrcyB0aGF0IGNhbiBhY2Nlc3MgdGhlIHB1YmxpYyBlbmRwb2ludCB1c2luZyB0aGUgYFBVQkxJQy5vbmx5RnJvbWAgbWV0aG9kLlxuICAgKiBJZiB5b3UgbGltaXQgYWNjZXNzIHRvIHNwZWNpZmljIENJRFIgYmxvY2tzLCB5b3UgbXVzdCBlbnN1cmUgdGhhdCB0aGUgQ0lEUiBibG9ja3MgdGhhdCB5b3VcbiAgICogc3BlY2lmeSBpbmNsdWRlIHRoZSBhZGRyZXNzZXMgdGhhdCB3b3JrZXIgbm9kZXMgYW5kIEZhcmdhdGUgcG9kcyAoaWYgeW91IHVzZSB0aGVtKVxuICAgKiBhY2Nlc3MgdGhlIHB1YmxpYyBlbmRwb2ludCBmcm9tLlxuICAgKlxuICAgKiBAcGFyYW0gY2lkciBUaGUgQ0lEUiBibG9ja3MuXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFBVQkxJQyA9IG5ldyBFbmRwb2ludEFjY2Vzcyh7IHByaXZhdGVBY2Nlc3M6IGZhbHNlLCBwdWJsaWNBY2Nlc3M6IHRydWUgfSk7XG5cbiAgLyoqXG4gICAqIFRoZSBjbHVzdGVyIGVuZHBvaW50IGlzIG9ubHkgYWNjZXNzaWJsZSB0aHJvdWdoIHlvdXIgVlBDLlxuICAgKiBXb3JrZXIgbm9kZSB0cmFmZmljIHRvIHRoZSBlbmRwb2ludCB3aWxsIHN0YXkgd2l0aGluIHlvdXIgVlBDLlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBQUklWQVRFID0gbmV3IEVuZHBvaW50QWNjZXNzKHsgcHJpdmF0ZUFjY2VzczogdHJ1ZSwgcHVibGljQWNjZXNzOiBmYWxzZSB9KTtcblxuICAvKipcbiAgICogVGhlIGNsdXN0ZXIgZW5kcG9pbnQgaXMgYWNjZXNzaWJsZSBmcm9tIG91dHNpZGUgb2YgeW91ciBWUEMuXG4gICAqIFdvcmtlciBub2RlIHRyYWZmaWMgdG8gdGhlIGVuZHBvaW50IHdpbGwgc3RheSB3aXRoaW4geW91ciBWUEMuXG4gICAqXG4gICAqIEJ5IGRlZmF1bHQsIHRoZSBlbmRwb2ludCBpcyBleHBvc2VkIHRvIGFsbCBhZHJlc3Nlcy4gWW91IGNhbiBvcHRpb25hbGx5IGxpbWl0IHRoZSBDSURSIGJsb2NrcyB0aGF0IGNhbiBhY2Nlc3MgdGhlIHB1YmxpYyBlbmRwb2ludCB1c2luZyB0aGUgYFBVQkxJQ19BTkRfUFJJVkFURS5vbmx5RnJvbWAgbWV0aG9kLlxuICAgKiBJZiB5b3UgbGltaXQgYWNjZXNzIHRvIHNwZWNpZmljIENJRFIgYmxvY2tzLCB5b3UgbXVzdCBlbnN1cmUgdGhhdCB0aGUgQ0lEUiBibG9ja3MgdGhhdCB5b3VcbiAgICogc3BlY2lmeSBpbmNsdWRlIHRoZSBhZGRyZXNzZXMgdGhhdCB3b3JrZXIgbm9kZXMgYW5kIEZhcmdhdGUgcG9kcyAoaWYgeW91IHVzZSB0aGVtKVxuICAgKiBhY2Nlc3MgdGhlIHB1YmxpYyBlbmRwb2ludCBmcm9tLlxuICAgKlxuICAgKiBAcGFyYW0gY2lkciBUaGUgQ0lEUiBibG9ja3MuXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFBVQkxJQ19BTkRfUFJJVkFURSA9IG5ldyBFbmRwb2ludEFjY2Vzcyh7IHByaXZhdGVBY2Nlc3M6IHRydWUsIHB1YmxpY0FjY2VzczogdHJ1ZSB9KTtcblxuICBwcml2YXRlIGNvbnN0cnVjdG9yKFxuICAgIC8qKlxuICAgICAqIENvbmZpZ3VyYXRpb24gcHJvcGVydGllcy5cbiAgICAgKlxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqL1xuICAgIHB1YmxpYyByZWFkb25seSBfY29uZmlnOiBFbmRwb2ludEFjY2Vzc0NvbmZpZykge1xuICAgIGlmICghX2NvbmZpZy5wdWJsaWNBY2Nlc3MgJiYgX2NvbmZpZy5wdWJsaWNDaWRycyAmJiBfY29uZmlnLnB1YmxpY0NpZHJzLmxlbmd0aCA+IDApIHtcbiAgICAgIHRocm93IG5ldyBVbnNjb3BlZFZhbGlkYXRpb25FcnJvcignQ0lEUiBibG9ja3MgY2FuIG9ubHkgYmUgY29uZmlndXJlZCB3aGVuIHB1YmxpYyBhY2Nlc3MgaXMgZW5hYmxlZCcpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXN0cmljdCBwdWJsaWMgYWNjZXNzIHRvIHNwZWNpZmljIENJRFIgYmxvY2tzLlxuICAgKiBJZiBwdWJsaWMgYWNjZXNzIGlzIGRpc2FibGVkLCB0aGlzIG1ldGhvZCB3aWxsIHJlc3VsdCBpbiBhbiBlcnJvci5cbiAgICpcbiAgICogQHBhcmFtIGNpZHIgQ0lEUiBibG9ja3MuXG4gICAqL1xuICBwdWJsaWMgb25seUZyb20oLi4uY2lkcjogc3RyaW5nW10pIHtcbiAgICBpZiAoIXRoaXMuX2NvbmZpZy5wcml2YXRlQWNjZXNzKSB7XG4gICAgICAvLyB3aGVuIHByaXZhdGUgYWNjZXNzIGlzIGRpc2FibGVkLCB3ZSBjYW4ndCByZXN0cmljIHB1YmxpY1xuICAgICAgLy8gYWNjZXNzIHNpbmNlIGl0IHdpbGwgcmVuZGVyIHRoZSBrdWJlY3RsIHByb3ZpZGVyIHVudXNhYmxlLlxuICAgICAgdGhyb3cgbmV3IFVuc2NvcGVkVmFsaWRhdGlvbkVycm9yKCdDYW5ub3QgcmVzdHJpYyBwdWJsaWMgYWNjZXNzIHRvIGVuZHBvaW50IHdoZW4gcHJpdmF0ZSBhY2Nlc3MgaXMgZGlzYWJsZWQuIFVzZSBQVUJMSUNfQU5EX1BSSVZBVEUub25seUZyb20oKSBpbnN0ZWFkLicpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IEVuZHBvaW50QWNjZXNzKHtcbiAgICAgIC4uLnRoaXMuX2NvbmZpZyxcbiAgICAgIC8vIG92ZXJyaWRlIENJRFJcbiAgICAgIHB1YmxpY0NpZHJzOiBjaWRyLFxuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogT3B0aW9ucyBmb3IgY29uZmlndXJpbmcgRUtTIEF1dG8gTW9kZSBjb21wdXRlIHNldHRpbmdzLlxuICogV2hlbiBlbmFibGVkLCBFS1Mgd2lsbCBhdXRvbWF0aWNhbGx5IG1hbmFnZSBjb21wdXRlIHJlc291cmNlcyBsaWtlIG5vZGUgZ3JvdXBzIGFuZCBGYXJnYXRlIHByb2ZpbGVzLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIENvbXB1dGVDb25maWcge1xuICAvKipcbiAgICogTmFtZXMgb2Ygbm9kZVBvb2xzIHRvIGluY2x1ZGUgaW4gQXV0byBNb2RlLlxuICAgKiBZb3UgY2Fubm90IG1vZGlmeSB0aGUgYnVpbHQgaW4gc3lzdGVtIGFuZCBnZW5lcmFsLXB1cnBvc2Ugbm9kZSBwb29scy4gWW91IGNhbiBvbmx5IGVuYWJsZSBvciBkaXNhYmxlIHRoZW0uXG4gICAqIE5vZGUgcG9vbCB2YWx1ZXMgYXJlIGNhc2Utc2Vuc2l0aXZlIGFuZCBtdXN0IGJlIGBnZW5lcmFsLXB1cnBvc2VgIGFuZC9vciBgc3lzdGVtYC5cbiAgICpcbiAgICogQHNlZSAtIGh0dHBzOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9la3MvbGF0ZXN0L3VzZXJndWlkZS9jcmVhdGUtbm9kZS1wb29sLmh0bWxcbiAgICpcbiAgICogQGRlZmF1bHQgLSBbJ3N5c3RlbScsICdnZW5lcmFsLXB1cnBvc2UnXVxuICAgKi9cbiAgcmVhZG9ubHkgbm9kZVBvb2xzPzogc3RyaW5nW107XG5cbiAgLyoqXG4gICAqIElBTSByb2xlIGZvciB0aGUgbm9kZVBvb2xzLlxuICAgKlxuICAgKiBAc2VlIC0gaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL2Vrcy9sYXRlc3QvdXNlcmd1aWRlL2NyZWF0ZS1ub2RlLXJvbGUuaHRtbFxuICAgKlxuICAgKiBAZGVmYXVsdCAtIGdlbmVyYXRlZCBieSB0aGUgQ0RLXG4gICAqL1xuICByZWFkb25seSBub2RlUm9sZT86IGlhbS5JUm9sZTtcblxufVxuXG4vKipcbiAqIFByb3BlcnRpZXMgZm9yIGNvbmZpZ3VyaW5nIGEgc3RhbmRhcmQgRUtTIGNsdXN0ZXIgKG5vbi1GYXJnYXRlKVxuICovXG5leHBvcnQgaW50ZXJmYWNlIENsdXN0ZXJQcm9wcyBleHRlbmRzIENsdXN0ZXJDb21tb25PcHRpb25zIHtcbiAgLyoqXG4gICAqIENvbmZpZ3VyYXRpb24gZm9yIGNvbXB1dGUgc2V0dGluZ3MgaW4gQXV0byBNb2RlLlxuICAgKiBXaGVuIGVuYWJsZWQsIEVLUyB3aWxsIGF1dG9tYXRpY2FsbHkgbWFuYWdlIGNvbXB1dGUgcmVzb3VyY2VzLlxuICAgKiBAZGVmYXVsdCAtIEF1dG8gTW9kZSBjb21wdXRlIGRpc2FibGVkXG4gICAqL1xuICByZWFkb25seSBjb21wdXRlPzogQ29tcHV0ZUNvbmZpZztcblxuICAvKipcbiAgICogTnVtYmVyIG9mIGluc3RhbmNlcyB0byBhbGxvY2F0ZSBhcyBhbiBpbml0aWFsIGNhcGFjaXR5IGZvciB0aGlzIGNsdXN0ZXIuXG4gICAqIEluc3RhbmNlIHR5cGUgY2FuIGJlIGNvbmZpZ3VyZWQgdGhyb3VnaCBgZGVmYXVsdENhcGFjaXR5SW5zdGFuY2VUeXBlYCxcbiAgICogd2hpY2ggZGVmYXVsdHMgdG8gYG01LmxhcmdlYC5cbiAgICpcbiAgICogVXNlIGBjbHVzdGVyLmFkZEF1dG9TY2FsaW5nR3JvdXBDYXBhY2l0eWAgdG8gYWRkIGFkZGl0aW9uYWwgY3VzdG9taXplZCBjYXBhY2l0eS4gU2V0IHRoaXNcbiAgICogdG8gYDBgIGlzIHlvdSB3aXNoIHRvIGF2b2lkIHRoZSBpbml0aWFsIGNhcGFjaXR5IGFsbG9jYXRpb24uXG4gICAqXG4gICAqIEBkZWZhdWx0IDJcbiAgICovXG4gIHJlYWRvbmx5IGRlZmF1bHRDYXBhY2l0eT86IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIGluc3RhbmNlIHR5cGUgdG8gdXNlIGZvciB0aGUgZGVmYXVsdCBjYXBhY2l0eS4gVGhpcyB3aWxsIG9ubHkgYmUgdGFrZW5cbiAgICogaW50byBhY2NvdW50IGlmIGBkZWZhdWx0Q2FwYWNpdHlgIGlzID4gMC5cbiAgICpcbiAgICogQGRlZmF1bHQgbTUubGFyZ2VcbiAgICovXG4gIHJlYWRvbmx5IGRlZmF1bHRDYXBhY2l0eUluc3RhbmNlPzogZWMyLkluc3RhbmNlVHlwZTtcblxuICAvKipcbiAgICogVGhlIGRlZmF1bHQgY2FwYWNpdHkgdHlwZSBmb3IgdGhlIGNsdXN0ZXIuXG4gICAqXG4gICAqIEBkZWZhdWx0IEFVVE9NT0RFXG4gICAqL1xuICByZWFkb25seSBkZWZhdWx0Q2FwYWNpdHlUeXBlPzogRGVmYXVsdENhcGFjaXR5VHlwZTtcblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgSUFNIHByaW5jaXBhbCBvZiB0aGUgY2x1c3RlciBjcmVhdG9yIHdhcyBzZXQgYXMgYSBjbHVzdGVyIGFkbWluIGFjY2VzcyBlbnRyeVxuICAgKiBkdXJpbmcgY2x1c3RlciBjcmVhdGlvbiB0aW1lLlxuICAgKlxuICAgKiBDaGFuZ2luZyB0aGlzIHZhbHVlIGFmdGVyIHRoZSBjbHVzdGVyIGhhcyBiZWVuIGNyZWF0ZWQgd2lsbCByZXN1bHQgaW4gdGhlIGNsdXN0ZXIgYmVpbmcgcmVwbGFjZWQuXG4gICAqXG4gICAqIEBkZWZhdWx0IHRydWVcbiAgICovXG4gIHJlYWRvbmx5IGJvb3RzdHJhcENsdXN0ZXJDcmVhdG9yQWRtaW5QZXJtaXNzaW9ucz86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgd2hldGhlciBhIENsb3VkRm9ybWF0aW9uIG91dHB1dCB3aXRoIHRoZSBgYXdzIGVrc1xuICAgKiB1cGRhdGUta3ViZWNvbmZpZ2AgY29tbWFuZCB3aWxsIGJlIHN5bnRoZXNpemVkLiBUaGlzIGNvbW1hbmQgd2lsbCBpbmNsdWRlXG4gICAqIHRoZSBjbHVzdGVyIG5hbWUgYW5kLCBpZiBhcHBsaWNhYmxlLCB0aGUgQVJOIG9mIHRoZSBtYXN0ZXJzIElBTSByb2xlLlxuICAgKlxuICAgKiBAZGVmYXVsdCB0cnVlXG4gICAqL1xuICByZWFkb25seSBvdXRwdXRDb25maWdDb21tYW5kPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBLdWJlcm5ldGVzIGNsdXN0ZXIgdmVyc2lvblxuICogQHNlZSBodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vZWtzL2xhdGVzdC91c2VyZ3VpZGUva3ViZXJuZXRlcy12ZXJzaW9ucy5odG1sI2t1YmVybmV0ZXMtcmVsZWFzZS1jYWxlbmRhclxuICovXG5leHBvcnQgY2xhc3MgS3ViZXJuZXRlc1ZlcnNpb24ge1xuICAvKipcbiAgICogS3ViZXJuZXRlcyB2ZXJzaW9uIDEuMjVcbiAgICpcbiAgICogV2hlbiBjcmVhdGluZyBhIGBDbHVzdGVyYCB3aXRoIHRoaXMgdmVyc2lvbiwgeW91IG5lZWQgdG8gYWxzbyBzcGVjaWZ5IHRoZVxuICAgKiBga3ViZWN0bExheWVyYCBwcm9wZXJ0eSB3aXRoIGEgYEt1YmVjdGxWMjVMYXllcmAgZnJvbVxuICAgKiBgQGF3cy1jZGsvbGFtYmRhLWxheWVyLWt1YmVjdGwtdjI1YC5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgVjFfMjUgPSBLdWJlcm5ldGVzVmVyc2lvbi5vZignMS4yNScpO1xuXG4gIC8qKlxuICAgKiBLdWJlcm5ldGVzIHZlcnNpb24gMS4yNlxuICAgKlxuICAgKiBXaGVuIGNyZWF0aW5nIGEgYENsdXN0ZXJgIHdpdGggdGhpcyB2ZXJzaW9uLCB5b3UgbmVlZCB0byBhbHNvIHNwZWNpZnkgdGhlXG4gICAqIGBrdWJlY3RsTGF5ZXJgIHByb3BlcnR5IHdpdGggYSBgS3ViZWN0bFYyNkxheWVyYCBmcm9tXG4gICAqIGBAYXdzLWNkay9sYW1iZGEtbGF5ZXIta3ViZWN0bC12MjZgLlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBWMV8yNiA9IEt1YmVybmV0ZXNWZXJzaW9uLm9mKCcxLjI2Jyk7XG5cbiAgLyoqXG4gICAqIEt1YmVybmV0ZXMgdmVyc2lvbiAxLjI3XG4gICAqXG4gICAqIFdoZW4gY3JlYXRpbmcgYSBgQ2x1c3RlcmAgd2l0aCB0aGlzIHZlcnNpb24sIHlvdSBuZWVkIHRvIGFsc28gc3BlY2lmeSB0aGVcbiAgICogYGt1YmVjdGxMYXllcmAgcHJvcGVydHkgd2l0aCBhIGBLdWJlY3RsVjI3TGF5ZXJgIGZyb21cbiAgICogYEBhd3MtY2RrL2xhbWJkYS1sYXllci1rdWJlY3RsLXYyN2AuXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFYxXzI3ID0gS3ViZXJuZXRlc1ZlcnNpb24ub2YoJzEuMjcnKTtcblxuICAvKipcbiAgICogS3ViZXJuZXRlcyB2ZXJzaW9uIDEuMjhcbiAgICpcbiAgICogV2hlbiBjcmVhdGluZyBhIGBDbHVzdGVyYCB3aXRoIHRoaXMgdmVyc2lvbiwgeW91IG5lZWQgdG8gYWxzbyBzcGVjaWZ5IHRoZVxuICAgKiBga3ViZWN0bExheWVyYCBwcm9wZXJ0eSB3aXRoIGEgYEt1YmVjdGxWMjhMYXllcmAgZnJvbVxuICAgKiBgQGF3cy1jZGsvbGFtYmRhLWxheWVyLWt1YmVjdGwtdjI4YC5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgVjFfMjggPSBLdWJlcm5ldGVzVmVyc2lvbi5vZignMS4yOCcpO1xuXG4gIC8qKlxuICAgKiBLdWJlcm5ldGVzIHZlcnNpb24gMS4yOVxuICAgKlxuICAgKiBXaGVuIGNyZWF0aW5nIGEgYENsdXN0ZXJgIHdpdGggdGhpcyB2ZXJzaW9uLCB5b3UgbmVlZCB0byBhbHNvIHNwZWNpZnkgdGhlXG4gICAqIGBrdWJlY3RsTGF5ZXJgIHByb3BlcnR5IHdpdGggYSBgS3ViZWN0bFYyOUxheWVyYCBmcm9tXG4gICAqIGBAYXdzLWNkay9sYW1iZGEtbGF5ZXIta3ViZWN0bC12MjlgLlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBWMV8yOSA9IEt1YmVybmV0ZXNWZXJzaW9uLm9mKCcxLjI5Jyk7XG5cbiAgLyoqXG4gICAqIEt1YmVybmV0ZXMgdmVyc2lvbiAxLjMwXG4gICAqXG4gICAqIFdoZW4gY3JlYXRpbmcgYSBgQ2x1c3RlcmAgd2l0aCB0aGlzIHZlcnNpb24sIHlvdSBuZWVkIHRvIGFsc28gc3BlY2lmeSB0aGVcbiAgICogYGt1YmVjdGxMYXllcmAgcHJvcGVydHkgd2l0aCBhIGBLdWJlY3RsVjMwTGF5ZXJgIGZyb21cbiAgICogYEBhd3MtY2RrL2xhbWJkYS1sYXllci1rdWJlY3RsLXYzMGAuXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFYxXzMwID0gS3ViZXJuZXRlc1ZlcnNpb24ub2YoJzEuMzAnKTtcblxuICAvKipcbiAgICogS3ViZXJuZXRlcyB2ZXJzaW9uIDEuMzFcbiAgICpcbiAgICogV2hlbiBjcmVhdGluZyBhIGBDbHVzdGVyYCB3aXRoIHRoaXMgdmVyc2lvbiwgeW91IG5lZWQgdG8gYWxzbyBzcGVjaWZ5IHRoZVxuICAgKiBga3ViZWN0bExheWVyYCBwcm9wZXJ0eSB3aXRoIGEgYEt1YmVjdGxWMzFMYXllcmAgZnJvbVxuICAgKiBgQGF3cy1jZGsvbGFtYmRhLWxheWVyLWt1YmVjdGwtdjMxYC5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgVjFfMzEgPSBLdWJlcm5ldGVzVmVyc2lvbi5vZignMS4zMScpO1xuXG4gIC8qKlxuICAgKiBLdWJlcm5ldGVzIHZlcnNpb24gMS4zMlxuICAgKlxuICAgKiBXaGVuIGNyZWF0aW5nIGEgYENsdXN0ZXJgIHdpdGggdGhpcyB2ZXJzaW9uLCB5b3UgbmVlZCB0byBhbHNvIHNwZWNpZnkgdGhlXG4gICAqIGBrdWJlY3RsTGF5ZXJgIHByb3BlcnR5IHdpdGggYSBgS3ViZWN0bFYzMkxheWVyYCBmcm9tXG4gICAqIGBAYXdzLWNkay9sYW1iZGEtbGF5ZXIta3ViZWN0bC12MzJgLlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBWMV8zMiA9IEt1YmVybmV0ZXNWZXJzaW9uLm9mKCcxLjMyJyk7XG5cbiAgLyoqXG4gICAqIEt1YmVybmV0ZXMgdmVyc2lvbiAxLjMzXG4gICAqXG4gICAqIFdoZW4gY3JlYXRpbmcgYSBgQ2x1c3RlcmAgd2l0aCB0aGlzIHZlcnNpb24sIHlvdSBuZWVkIHRvIGFsc28gc3BlY2lmeSB0aGVcbiAgICogYGt1YmVjdGxMYXllcmAgcHJvcGVydHkgd2l0aCBhIGBLdWJlY3RsVjMzTGF5ZXJgIGZyb21cbiAgICogYEBhd3MtY2RrL2xhbWJkYS1sYXllci1rdWJlY3RsLXYzM2AuXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFYxXzMzID0gS3ViZXJuZXRlc1ZlcnNpb24ub2YoJzEuMzMnKTtcblxuICAvKipcbiAgICogS3ViZXJuZXRlcyB2ZXJzaW9uIDEuMzRcbiAgICpcbiAgICogV2hlbiBjcmVhdGluZyBhIGBDbHVzdGVyYCB3aXRoIHRoaXMgdmVyc2lvbiwgeW91IG5lZWQgdG8gYWxzbyBzcGVjaWZ5IHRoZVxuICAgKiBga3ViZWN0bExheWVyYCBwcm9wZXJ0eSB3aXRoIGEgYEt1YmVjdGxWMzRMYXllcmAgZnJvbVxuICAgKiBgQGF3cy1jZGsvbGFtYmRhLWxheWVyLWt1YmVjdGwtdjM0YC5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgVjFfMzQgPSBLdWJlcm5ldGVzVmVyc2lvbi5vZignMS4zNCcpO1xuXG4gIC8qKlxuICAgKiBDdXN0b20gY2x1c3RlciB2ZXJzaW9uXG4gICAqIEBwYXJhbSB2ZXJzaW9uIGN1c3RvbSB2ZXJzaW9uIG51bWJlclxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBvZih2ZXJzaW9uOiBzdHJpbmcpIHsgcmV0dXJuIG5ldyBLdWJlcm5ldGVzVmVyc2lvbih2ZXJzaW9uKTsgfVxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIHZlcnNpb24gY2x1c3RlciB2ZXJzaW9uIG51bWJlclxuICAgKi9cbiAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihwdWJsaWMgcmVhZG9ubHkgdmVyc2lvbjogc3RyaW5nKSB7IH1cbn1cblxuLy8gU2hhcmVkIGRlZmluaXRpb24gd2l0aCBwYWNrYWdlcy9AYXdzLWNkay9jdXN0b20tcmVzb3VyY2UtaGFuZGxlcnMvdGVzdC9hd3MtZWtzL2NvbXBhcmUtbG9nLnRlc3QudHNcbi8qKlxuICogRUtTIGNsdXN0ZXIgbG9nZ2luZyB0eXBlc1xuICovXG5leHBvcnQgZW51bSBDbHVzdGVyTG9nZ2luZ1R5cGVzIHtcbiAgLyoqXG4gICAqIExvZ3MgcGVydGFpbmluZyB0byBBUEkgcmVxdWVzdHMgdG8gdGhlIGNsdXN0ZXIuXG4gICAqL1xuICBBUEkgPSAnYXBpJyxcbiAgLyoqXG4gICAqIExvZ3MgcGVydGFpbmluZyB0byBjbHVzdGVyIGFjY2VzcyB2aWEgdGhlIEt1YmVybmV0ZXMgQVBJLlxuICAgKi9cbiAgQVVESVQgPSAnYXVkaXQnLFxuICAvKipcbiAgICogTG9ncyBwZXJ0YWluaW5nIHRvIGF1dGhlbnRpY2F0aW9uIHJlcXVlc3RzIGludG8gdGhlIGNsdXN0ZXIuXG4gICAqL1xuICBBVVRIRU5USUNBVE9SID0gJ2F1dGhlbnRpY2F0b3InLFxuICAvKipcbiAgICogTG9ncyBwZXJ0YWluaW5nIHRvIHN0YXRlIG9mIGNsdXN0ZXIgY29udHJvbGxlcnMuXG4gICAqL1xuICBDT05UUk9MTEVSX01BTkFHRVIgPSAnY29udHJvbGxlck1hbmFnZXInLFxuICAvKipcbiAgICogTG9ncyBwZXJ0YWluaW5nIHRvIHNjaGVkdWxpbmcgZGVjaXNpb25zLlxuICAgKi9cbiAgU0NIRURVTEVSID0gJ3NjaGVkdWxlcicsXG59XG5cbi8qKlxuICogRUtTIGNsdXN0ZXIgSVAgZmFtaWx5LlxuICovXG5leHBvcnQgZW51bSBJcEZhbWlseSB7XG4gIC8qKlxuICAgKiBVc2UgSVB2NCBmb3IgcG9kcyBhbmQgc2VydmljZXMgaW4geW91ciBjbHVzdGVyLlxuICAgKi9cbiAgSVBfVjQgPSAnaXB2NCcsXG4gIC8qKlxuICAgKiBVc2UgSVB2NiBmb3IgcG9kcyBhbmQgc2VydmljZXMgaW4geW91ciBjbHVzdGVyLlxuICAgKi9cbiAgSVBfVjYgPSAnaXB2NicsXG59XG5cbmFic3RyYWN0IGNsYXNzIENsdXN0ZXJCYXNlIGV4dGVuZHMgUmVzb3VyY2UgaW1wbGVtZW50cyBJQ2x1c3RlciB7XG4gIHB1YmxpYyBhYnN0cmFjdCByZWFkb25seSBjb25uZWN0aW9uczogZWMyLkNvbm5lY3Rpb25zO1xuICBwdWJsaWMgYWJzdHJhY3QgcmVhZG9ubHkgdnBjOiBlYzIuSVZwYztcbiAgcHVibGljIGFic3RyYWN0IHJlYWRvbmx5IGNsdXN0ZXJOYW1lOiBzdHJpbmc7XG4gIHB1YmxpYyBhYnN0cmFjdCByZWFkb25seSBjbHVzdGVyQXJuOiBzdHJpbmc7XG4gIHB1YmxpYyBhYnN0cmFjdCByZWFkb25seSBjbHVzdGVyRW5kcG9pbnQ6IHN0cmluZztcbiAgcHVibGljIGFic3RyYWN0IHJlYWRvbmx5IGNsdXN0ZXJDZXJ0aWZpY2F0ZUF1dGhvcml0eURhdGE6IHN0cmluZztcbiAgcHVibGljIGFic3RyYWN0IHJlYWRvbmx5IGNsdXN0ZXJTZWN1cml0eUdyb3VwSWQ6IHN0cmluZztcbiAgcHVibGljIGFic3RyYWN0IHJlYWRvbmx5IGNsdXN0ZXJTZWN1cml0eUdyb3VwOiBlYzIuSVNlY3VyaXR5R3JvdXA7XG4gIHB1YmxpYyBhYnN0cmFjdCByZWFkb25seSBjbHVzdGVyRW5jcnlwdGlvbkNvbmZpZ0tleUFybjogc3RyaW5nO1xuICBwdWJsaWMgYWJzdHJhY3QgcmVhZG9ubHkgaXBGYW1pbHk/OiBJcEZhbWlseTtcbiAgcHVibGljIGFic3RyYWN0IHJlYWRvbmx5IHBydW5lOiBib29sZWFuO1xuICBwdWJsaWMgYWJzdHJhY3QgcmVhZG9ubHkgb3BlbklkQ29ubmVjdFByb3ZpZGVyOiBpYW0uSU9wZW5JZENvbm5lY3RQcm92aWRlcjtcblxuICAvKipcbiAgICogRGVmaW5lcyBhIEt1YmVybmV0ZXMgcmVzb3VyY2UgaW4gdGhpcyBjbHVzdGVyLlxuICAgKlxuICAgKiBUaGUgbWFuaWZlc3Qgd2lsbCBiZSBhcHBsaWVkL2RlbGV0ZWQgdXNpbmcga3ViZWN0bCBhcyBuZWVkZWQuXG4gICAqXG4gICAqIEBwYXJhbSBpZCBsb2dpY2FsIGlkIG9mIHRoaXMgbWFuaWZlc3RcbiAgICogQHBhcmFtIG1hbmlmZXN0IGEgbGlzdCBvZiBLdWJlcm5ldGVzIHJlc291cmNlIHNwZWNpZmljYXRpb25zXG4gICAqIEByZXR1cm5zIGEgYEt1YmVybmV0ZXNSZXNvdXJjZWAgb2JqZWN0LlxuICAgKi9cbiAgcHVibGljIGFkZE1hbmlmZXN0KGlkOiBzdHJpbmcsIC4uLm1hbmlmZXN0OiBSZWNvcmQ8c3RyaW5nLCBhbnk+W10pOiBLdWJlcm5ldGVzTWFuaWZlc3Qge1xuICAgIHJldHVybiBuZXcgS3ViZXJuZXRlc01hbmlmZXN0KHRoaXMsIGBtYW5pZmVzdC0ke2lkfWAsIHsgY2x1c3RlcjogdGhpcywgbWFuaWZlc3QgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGVmaW5lcyBhIEhlbG0gY2hhcnQgaW4gdGhpcyBjbHVzdGVyLlxuICAgKlxuICAgKiBAcGFyYW0gaWQgbG9naWNhbCBpZCBvZiB0aGlzIGNoYXJ0LlxuICAgKiBAcGFyYW0gb3B0aW9ucyBvcHRpb25zIG9mIHRoaXMgY2hhcnQuXG4gICAqIEByZXR1cm5zIGEgYEhlbG1DaGFydGAgY29uc3RydWN0XG4gICAqL1xuICBwdWJsaWMgYWRkSGVsbUNoYXJ0KGlkOiBzdHJpbmcsIG9wdGlvbnM6IEhlbG1DaGFydE9wdGlvbnMpOiBIZWxtQ2hhcnQge1xuICAgIHJldHVybiBuZXcgSGVsbUNoYXJ0KHRoaXMsIGBjaGFydC0ke2lkfWAsIHsgY2x1c3RlcjogdGhpcywgLi4ub3B0aW9ucyB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWZpbmVzIGEgQ0RLOHMgY2hhcnQgaW4gdGhpcyBjbHVzdGVyLlxuICAgKlxuICAgKiBAcGFyYW0gaWQgbG9naWNhbCBpZCBvZiB0aGlzIGNoYXJ0LlxuICAgKiBAcGFyYW0gY2hhcnQgdGhlIGNkazhzIGNoYXJ0LlxuICAgKiBAcmV0dXJucyBhIGBLdWJlcm5ldGVzTWFuaWZlc3RgIGNvbnN0cnVjdCByZXByZXNlbnRpbmcgdGhlIGNoYXJ0LlxuICAgKi9cbiAgcHVibGljIGFkZENkazhzQ2hhcnQoaWQ6IHN0cmluZywgY2hhcnQ6IENvbnN0cnVjdCwgb3B0aW9uczogS3ViZXJuZXRlc01hbmlmZXN0T3B0aW9ucyA9IHt9KTogS3ViZXJuZXRlc01hbmlmZXN0IHtcbiAgICBjb25zdCBjZGs4c0NoYXJ0ID0gY2hhcnQgYXMgYW55O1xuXG4gICAgLy8gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hd3NsYWJzL2NkazhzL2Jsb2IvbWFzdGVyL3BhY2thZ2VzL2NkazhzL3NyYy9jaGFydC50cyNMODRcbiAgICBpZiAodHlwZW9mIGNkazhzQ2hhcnQudG9Kc29uICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgVW5zY29wZWRWYWxpZGF0aW9uRXJyb3IoYEludmFsaWQgY2RrOHMgY2hhcnQuIE11c3QgY29udGFpbiBhICd0b0pzb24nIG1ldGhvZCwgYnV0IGZvdW5kICR7dHlwZW9mIGNkazhzQ2hhcnQudG9Kc29ufWApO1xuICAgIH1cblxuICAgIGNvbnN0IG1hbmlmZXN0ID0gbmV3IEt1YmVybmV0ZXNNYW5pZmVzdCh0aGlzLCBpZCwge1xuICAgICAgY2x1c3RlcjogdGhpcyxcbiAgICAgIG1hbmlmZXN0OiBjZGs4c0NoYXJ0LnRvSnNvbigpLFxuICAgICAgLi4ub3B0aW9ucyxcbiAgICB9KTtcblxuICAgIHJldHVybiBtYW5pZmVzdDtcbiAgfVxuXG4gIHB1YmxpYyBhZGRTZXJ2aWNlQWNjb3VudChpZDogc3RyaW5nLCBvcHRpb25zOiBTZXJ2aWNlQWNjb3VudE9wdGlvbnMgPSB7fSk6IFNlcnZpY2VBY2NvdW50IHtcbiAgICByZXR1cm4gbmV3IFNlcnZpY2VBY2NvdW50KHRoaXMsIGlkLCB7XG4gICAgICAuLi5vcHRpb25zLFxuICAgICAgY2x1c3RlcjogdGhpcyxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25uZWN0IGNhcGFjaXR5IGluIHRoZSBmb3JtIG9mIGFuIGV4aXN0aW5nIEF1dG9TY2FsaW5nR3JvdXAgdG8gdGhlIEVLUyBjbHVzdGVyLlxuICAgKlxuICAgKiBUaGUgQXV0b1NjYWxpbmdHcm91cCBtdXN0IGJlIHJ1bm5pbmcgYW4gRUtTLW9wdGltaXplZCBBTUkgY29udGFpbmluZyB0aGVcbiAgICogL2V0Yy9la3MvYm9vdHN0cmFwLnNoIHNjcmlwdC4gVGhpcyBtZXRob2Qgd2lsbCBjb25maWd1cmUgU2VjdXJpdHkgR3JvdXBzLFxuICAgKiBhZGQgdGhlIHJpZ2h0IHBvbGljaWVzIHRvIHRoZSBpbnN0YW5jZSByb2xlLCBhcHBseSB0aGUgcmlnaHQgdGFncywgYW5kIGFkZFxuICAgKiB0aGUgcmVxdWlyZWQgdXNlciBkYXRhIHRvIHRoZSBpbnN0YW5jZSdzIGxhdW5jaCBjb25maWd1cmF0aW9uLlxuICAgKlxuICAgKiBQcmVmZXIgdG8gdXNlIGBhZGRBdXRvU2NhbGluZ0dyb3VwQ2FwYWNpdHlgIGlmIHBvc3NpYmxlLlxuICAgKlxuICAgKiBAc2VlIGh0dHBzOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9la3MvbGF0ZXN0L3VzZXJndWlkZS9sYXVuY2gtd29ya2Vycy5odG1sXG4gICAqIEBwYXJhbSBhdXRvU2NhbGluZ0dyb3VwIFtkaXNhYmxlLWF3c2xpbnQ6cmVmLXZpYS1pbnRlcmZhY2VdXG4gICAqIEBwYXJhbSBvcHRpb25zIG9wdGlvbnMgZm9yIGFkZGluZyBhdXRvIHNjYWxpbmcgZ3JvdXBzLCBsaWtlIGN1c3RvbWl6aW5nIHRoZSBib290c3RyYXAgc2NyaXB0XG4gICAqL1xuICBwdWJsaWMgY29ubmVjdEF1dG9TY2FsaW5nR3JvdXBDYXBhY2l0eShhdXRvU2NhbGluZ0dyb3VwOiBhdXRvc2NhbGluZy5BdXRvU2NhbGluZ0dyb3VwLCBvcHRpb25zOiBBdXRvU2NhbGluZ0dyb3VwT3B0aW9ucykge1xuICAgIC8vIHNlbGYgcnVsZXNcbiAgICBhdXRvU2NhbGluZ0dyb3VwLmNvbm5lY3Rpb25zLmFsbG93SW50ZXJuYWxseShlYzIuUG9ydC5hbGxUcmFmZmljKCkpO1xuXG4gICAgLy8gQ2x1c3RlciB0bzpub2RlcyBydWxlc1xuICAgIGF1dG9TY2FsaW5nR3JvdXAuY29ubmVjdGlvbnMuYWxsb3dGcm9tKHRoaXMsIGVjMi5Qb3J0LnRjcCg0NDMpKTtcbiAgICBhdXRvU2NhbGluZ0dyb3VwLmNvbm5lY3Rpb25zLmFsbG93RnJvbSh0aGlzLCBlYzIuUG9ydC50Y3BSYW5nZSgxMDI1LCA2NTUzNSkpO1xuXG4gICAgLy8gQWxsb3cgSFRUUFMgZnJvbSBOb2RlcyB0byBDbHVzdGVyXG4gICAgYXV0b1NjYWxpbmdHcm91cC5jb25uZWN0aW9ucy5hbGxvd1RvKHRoaXMsIGVjMi5Qb3J0LnRjcCg0NDMpKTtcblxuICAgIC8vIEFsbG93IGFsbCBub2RlIG91dGJvdW5kIHRyYWZmaWNcbiAgICBhdXRvU2NhbGluZ0dyb3VwLmNvbm5lY3Rpb25zLmFsbG93VG9BbnlJcHY0KGVjMi5Qb3J0LmFsbFRjcCgpKTtcbiAgICBhdXRvU2NhbGluZ0dyb3VwLmNvbm5lY3Rpb25zLmFsbG93VG9BbnlJcHY0KGVjMi5Qb3J0LmFsbFVkcCgpKTtcbiAgICBhdXRvU2NhbGluZ0dyb3VwLmNvbm5lY3Rpb25zLmFsbG93VG9BbnlJcHY0KGVjMi5Qb3J0LmFsbEljbXAoKSk7XG5cbiAgICAvLyBhbGxvdyB0cmFmZmljIHRvL2Zyb20gbWFuYWdlZCBub2RlIGdyb3VwcyAoZWtzIGF0dGFjaGVzIHRoaXMgc2VjdXJpdHkgZ3JvdXAgdG8gdGhlIG1hbmFnZWQgbm9kZXMpXG4gICAgYXV0b1NjYWxpbmdHcm91cC5hZGRTZWN1cml0eUdyb3VwKHRoaXMuY2x1c3RlclNlY3VyaXR5R3JvdXApO1xuXG4gICAgY29uc3QgYm9vdHN0cmFwRW5hYmxlZCA9IG9wdGlvbnMuYm9vdHN0cmFwRW5hYmxlZCA/PyB0cnVlO1xuICAgIGlmIChvcHRpb25zLmJvb3RzdHJhcE9wdGlvbnMgJiYgIWJvb3RzdHJhcEVuYWJsZWQpIHtcbiAgICAgIHRocm93IG5ldyBVbnNjb3BlZFZhbGlkYXRpb25FcnJvcignQ2Fubm90IHNwZWNpZnkgXCJib290c3RyYXBPcHRpb25zXCIgaWYgXCJib290c3RyYXBFbmFibGVkXCIgaXMgZmFsc2UnKTtcbiAgICB9XG5cbiAgICBpZiAoYm9vdHN0cmFwRW5hYmxlZCkge1xuICAgICAgY29uc3QgdXNlckRhdGEgPSBvcHRpb25zLm1hY2hpbmVJbWFnZVR5cGUgPT09IE1hY2hpbmVJbWFnZVR5cGUuQk9UVExFUk9DS0VUID9cbiAgICAgICAgcmVuZGVyQm90dGxlcm9ja2V0VXNlckRhdGEodGhpcykgOlxuICAgICAgICByZW5kZXJBbWF6b25MaW51eFVzZXJEYXRhKHRoaXMsIGF1dG9TY2FsaW5nR3JvdXAsIG9wdGlvbnMuYm9vdHN0cmFwT3B0aW9ucyk7XG4gICAgICBhdXRvU2NhbGluZ0dyb3VwLmFkZFVzZXJEYXRhKC4uLnVzZXJEYXRhKTtcbiAgICB9XG5cbiAgICBhdXRvU2NhbGluZ0dyb3VwLnJvbGUuYWRkTWFuYWdlZFBvbGljeShpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ0FtYXpvbkVLU1dvcmtlck5vZGVQb2xpY3knKSk7XG4gICAgYXV0b1NjYWxpbmdHcm91cC5yb2xlLmFkZE1hbmFnZWRQb2xpY3koaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdBbWF6b25FS1NfQ05JX1BvbGljeScpKTtcbiAgICBhdXRvU2NhbGluZ0dyb3VwLnJvbGUuYWRkTWFuYWdlZFBvbGljeShpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ0FtYXpvbkVDMkNvbnRhaW5lclJlZ2lzdHJ5UmVhZE9ubHknKSk7XG5cbiAgICAvLyBFS1MgUmVxdWlyZWQgVGFnc1xuICAgIC8vIGh0dHBzOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9la3MvbGF0ZXN0L3VzZXJndWlkZS93b3JrZXIuaHRtbFxuICAgIFRhZ3Mub2YoYXV0b1NjYWxpbmdHcm91cCkuYWRkKGBrdWJlcm5ldGVzLmlvL2NsdXN0ZXIvJHt0aGlzLmNsdXN0ZXJOYW1lfWAsICdvd25lZCcsIHtcbiAgICAgIGFwcGx5VG9MYXVuY2hlZEluc3RhbmNlczogdHJ1ZSxcbiAgICAgIC8vIGV4Y2x1ZGUgc2VjdXJpdHkgZ3JvdXBzIHRvIGF2b2lkIG11bHRpcGxlIFwib3duZWRcIiBzZWN1cml0eSBncm91cHMuXG4gICAgICAvLyAodGhlIGNsdXN0ZXIgc2VjdXJpdHkgZ3JvdXAgYWxyZWFkeSBoYXMgdGhpcyB0YWcpXG4gICAgICBleGNsdWRlUmVzb3VyY2VUeXBlczogWydBV1M6OkVDMjo6U2VjdXJpdHlHcm91cCddLFxuICAgIH0pO1xuXG4gICAgLy8gc2luY2Ugd2UgYXJlIG5vdCBtYXBwaW5nIHRoZSBpbnN0YW5jZSByb2xlIHRvIFJCQUMsIHN5bnRoZXNpemUgYW5cbiAgICAvLyBvdXRwdXQgc28gaXQgY2FuIGJlIHBhc3RlZCBpbnRvIGBhd3MtYXV0aC1jbS55YW1sYFxuICAgIG5ldyBDZm5PdXRwdXQoYXV0b1NjYWxpbmdHcm91cCwgJ0luc3RhbmNlUm9sZUFSTicsIHtcbiAgICAgIHZhbHVlOiBhdXRvU2NhbGluZ0dyb3VwLnJvbGUucm9sZUFybixcbiAgICB9KTtcblxuICAgIGlmICh0aGlzIGluc3RhbmNlb2YgQ2x1c3RlciAmJiB0aGlzLmFsYkNvbnRyb2xsZXIpIHtcbiAgICAgIC8vIHRoZSBjb250cm9sbGVyIHJ1bnMgb24gdGhlIHdvcmtlciBub2RlcyBzbyB0aGV5IGNhbm5vdFxuICAgICAgLy8gYmUgZGVsZXRlZCBiZWZvcmUgdGhlIGNvbnRyb2xsZXIuXG4gICAgICBOb2RlLm9mKHRoaXMuYWxiQ29udHJvbGxlcikuYWRkRGVwZW5kZW5jeShhdXRvU2NhbGluZ0dyb3VwKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBPcHRpb25zIGZvciBmZXRjaGluZyBhIFNlcnZpY2VMb2FkQmFsYW5jZXJBZGRyZXNzLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFNlcnZpY2VMb2FkQmFsYW5jZXJBZGRyZXNzT3B0aW9ucyB7XG5cbiAgLyoqXG4gICAqIFRpbWVvdXQgZm9yIHdhaXRpbmcgb24gdGhlIGxvYWQgYmFsYW5jZXIgYWRkcmVzcy5cbiAgICpcbiAgICogQGRlZmF1bHQgRHVyYXRpb24ubWludXRlcyg1KVxuICAgKi9cbiAgcmVhZG9ubHkgdGltZW91dD86IER1cmF0aW9uO1xuXG4gIC8qKlxuICAgKiBUaGUgbmFtZXNwYWNlIHRoZSBzZXJ2aWNlIGJlbG9uZ3MgdG8uXG4gICAqXG4gICAqIEBkZWZhdWx0ICdkZWZhdWx0J1xuICAgKi9cbiAgcmVhZG9ubHkgbmFtZXNwYWNlPzogc3RyaW5nO1xuXG59XG5cbi8qKlxuICogT3B0aW9ucyBmb3IgZmV0Y2hpbmcgYW4gSW5ncmVzc0xvYWRCYWxhbmNlckFkZHJlc3MuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSW5ncmVzc0xvYWRCYWxhbmNlckFkZHJlc3NPcHRpb25zIGV4dGVuZHMgU2VydmljZUxvYWRCYWxhbmNlckFkZHJlc3NPcHRpb25zIHt9XG5cbi8qKlxuICogQSBDbHVzdGVyIHJlcHJlc2VudHMgYSBtYW5hZ2VkIEt1YmVybmV0ZXMgU2VydmljZSAoRUtTKVxuICpcbiAqIFRoaXMgaXMgYSBmdWxseSBtYW5hZ2VkIGNsdXN0ZXIgb2YgQVBJIFNlcnZlcnMgKGNvbnRyb2wtcGxhbmUpXG4gKiBUaGUgdXNlciBpcyBzdGlsbCByZXF1aXJlZCB0byBjcmVhdGUgdGhlIHdvcmtlciBub2Rlcy5cbiAqIEByZXNvdXJjZSBBV1M6OkVLUzo6Q2x1c3RlclxuICovXG5AcHJvcGVydHlJbmplY3RhYmxlXG5leHBvcnQgY2xhc3MgQ2x1c3RlciBleHRlbmRzIENsdXN0ZXJCYXNlIHtcbiAgLyoqIFVuaXF1ZWx5IGlkZW50aWZpZXMgdGhpcyBjbGFzcy4gKi9cbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBQUk9QRVJUWV9JTkpFQ1RJT05fSUQ6IHN0cmluZyA9ICdAYXdzLWNkay5hd3MtZWtzLXYyLWFscGhhLkNsdXN0ZXInO1xuXG4gIC8qKlxuICAgKiBJbXBvcnQgYW4gZXhpc3RpbmcgY2x1c3RlclxuICAgKlxuICAgKiBAcGFyYW0gc2NvcGUgdGhlIGNvbnN0cnVjdCBzY29wZSwgaW4gbW9zdCBjYXNlcyAndGhpcydcbiAgICogQHBhcmFtIGlkIHRoZSBpZCBvciBuYW1lIHRvIGltcG9ydCBhc1xuICAgKiBAcGFyYW0gYXR0cnMgdGhlIGNsdXN0ZXIgcHJvcGVydGllcyB0byB1c2UgZm9yIGltcG9ydGluZyBpbmZvcm1hdGlvblxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBmcm9tQ2x1c3RlckF0dHJpYnV0ZXMoc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgYXR0cnM6IENsdXN0ZXJBdHRyaWJ1dGVzKTogSUNsdXN0ZXIge1xuICAgIHJldHVybiBuZXcgSW1wb3J0ZWRDbHVzdGVyKHNjb3BlLCBpZCwgYXR0cnMpO1xuICB9XG5cbiAgcHJpdmF0ZSBhY2Nlc3NFbnRyaWVzOiBNYXA8c3RyaW5nLCBJQWNjZXNzRW50cnk+ID0gbmV3IE1hcCgpO1xuXG4gIC8qKlxuICAgKiBUaGUgVlBDIGluIHdoaWNoIHRoaXMgQ2x1c3RlciB3YXMgY3JlYXRlZFxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IHZwYzogZWMyLklWcGM7XG5cbiAgLyoqXG4gICAqIFRoZSBOYW1lIG9mIHRoZSBjcmVhdGVkIEVLUyBDbHVzdGVyXG4gICAqL1xuICBAbWVtb2l6ZWRHZXR0ZXJcbiAgcHVibGljIGdldCBjbHVzdGVyTmFtZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmdldFJlc291cmNlTmFtZUF0dHJpYnV0ZSh0aGlzLnJlc291cmNlLnJlZik7XG4gIH1cblxuICAvKipcbiAgICogVGhlIEFXUyBnZW5lcmF0ZWQgQVJOIGZvciB0aGUgQ2x1c3RlciByZXNvdXJjZVxuICAgKlxuICAgKiBGb3IgZXhhbXBsZSwgYGFybjphd3M6ZWtzOnVzLXdlc3QtMjo2NjY2NjY2NjY2NjY6Y2x1c3Rlci9wcm9kYFxuICAgKi9cbiAgQG1lbW9pemVkR2V0dGVyXG4gIHB1YmxpYyBnZXQgY2x1c3RlckFybigpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmdldFJlc291cmNlQXJuQXR0cmlidXRlKHRoaXMucmVzb3VyY2UuYXR0ckFybiwgY2x1c3RlckFybkNvbXBvbmVudHModGhpcy5waHlzaWNhbE5hbWUpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgZW5kcG9pbnQgVVJMIGZvciB0aGUgQ2x1c3RlclxuICAgKlxuICAgKiBUaGlzIGlzIHRoZSBVUkwgaW5zaWRlIHRoZSBrdWJlY29uZmlnIGZpbGUgdG8gdXNlIHdpdGgga3ViZWN0bFxuICAgKlxuICAgKiBGb3IgZXhhbXBsZSwgYGh0dHBzOi8vNUUxRDBDRVhBTVBMRUE1OTFCNzQ2QUZDNUFCMzAyNjIueWw0LnVzLXdlc3QtMi5la3MuYW1hem9uYXdzLmNvbWBcbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBjbHVzdGVyRW5kcG9pbnQ6IHN0cmluZztcblxuICAvKipcbiAgICogVGhlIGNlcnRpZmljYXRlLWF1dGhvcml0eS1kYXRhIGZvciB5b3VyIGNsdXN0ZXIuXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgY2x1c3RlckNlcnRpZmljYXRlQXV0aG9yaXR5RGF0YTogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBUaGUgaWQgb2YgdGhlIGNsdXN0ZXIgc2VjdXJpdHkgZ3JvdXAgdGhhdCB3YXMgY3JlYXRlZCBieSBBbWF6b24gRUtTIGZvciB0aGUgY2x1c3Rlci5cbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBjbHVzdGVyU2VjdXJpdHlHcm91cElkOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFRoZSBjbHVzdGVyIHNlY3VyaXR5IGdyb3VwIHRoYXQgd2FzIGNyZWF0ZWQgYnkgQW1hem9uIEVLUyBmb3IgdGhlIGNsdXN0ZXIuXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgY2x1c3RlclNlY3VyaXR5R3JvdXA6IGVjMi5JU2VjdXJpdHlHcm91cDtcblxuICAvKipcbiAgICogQW1hem9uIFJlc291cmNlIE5hbWUgKEFSTikgb3IgYWxpYXMgb2YgdGhlIGN1c3RvbWVyIG1hc3RlciBrZXkgKENNSykuXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgY2x1c3RlckVuY3J5cHRpb25Db25maWdLZXlBcm46IHN0cmluZztcblxuICAvKipcbiAgICogTWFuYWdlcyBjb25uZWN0aW9uIHJ1bGVzIChTZWN1cml0eSBHcm91cCBSdWxlcykgZm9yIHRoZSBjbHVzdGVyXG4gICAqXG4gICAqIEB0eXBlIHtlYzIuQ29ubmVjdGlvbnN9XG4gICAqIEBtZW1iZXJvZiBDbHVzdGVyXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgY29ubmVjdGlvbnM6IGVjMi5Db25uZWN0aW9ucztcblxuICAvKipcbiAgICogSUFNIHJvbGUgYXNzdW1lZCBieSB0aGUgRUtTIENvbnRyb2wgUGxhbmVcbiAgICovXG4gIHB1YmxpYyByZWFkb25seSByb2xlOiBpYW0uSVJvbGU7XG5cbiAgLyoqXG4gICAqIFRoZSBhdXRvIHNjYWxpbmcgZ3JvdXAgdGhhdCBob3N0cyB0aGUgZGVmYXVsdCBjYXBhY2l0eSBmb3IgdGhpcyBjbHVzdGVyLlxuICAgKiBUaGlzIHdpbGwgYmUgYHVuZGVmaW5lZGAgaWYgdGhlIGBkZWZhdWx0Q2FwYWNpdHlUeXBlYCBpcyBub3QgYEVDMmAgb3JcbiAgICogYGRlZmF1bHRDYXBhY2l0eVR5cGVgIGlzIGBFQzJgIGJ1dCBkZWZhdWx0IGNhcGFjaXR5IGlzIHNldCB0byAwLlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IGRlZmF1bHRDYXBhY2l0eT86IGF1dG9zY2FsaW5nLkF1dG9TY2FsaW5nR3JvdXA7XG5cbiAgLyoqXG4gICAqIFRoZSBub2RlIGdyb3VwIHRoYXQgaG9zdHMgdGhlIGRlZmF1bHQgY2FwYWNpdHkgZm9yIHRoaXMgY2x1c3Rlci5cbiAgICogVGhpcyB3aWxsIGJlIGB1bmRlZmluZWRgIGlmIHRoZSBgZGVmYXVsdENhcGFjaXR5VHlwZWAgaXMgYEVDMmAgb3JcbiAgICogYGRlZmF1bHRDYXBhY2l0eVR5cGVgIGlzIGBOT0RFR1JPVVBgIGJ1dCBkZWZhdWx0IGNhcGFjaXR5IGlzIHNldCB0byAwLlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IGRlZmF1bHROb2RlZ3JvdXA/OiBOb2RlZ3JvdXA7XG5cbiAgLyoqXG4gICAqIFNwZWNpZnkgd2hpY2ggSVAgZmFtaWx5IGlzIHVzZWQgdG8gYXNzaWduIEt1YmVybmV0ZXMgcG9kIGFuZCBzZXJ2aWNlIElQIGFkZHJlc3Nlcy5cbiAgICpcbiAgICogQGRlZmF1bHQgSXBGYW1pbHkuSVBfVjRcbiAgICogQHNlZSBodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vZWtzL2xhdGVzdC9BUElSZWZlcmVuY2UvQVBJX0t1YmVybmV0ZXNOZXR3b3JrQ29uZmlnUmVxdWVzdC5odG1sI0FtYXpvbkVLUy1UeXBlLUt1YmVybmV0ZXNOZXR3b3JrQ29uZmlnUmVxdWVzdC1pcEZhbWlseVxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IGlwRmFtaWx5PzogSXBGYW1pbHk7XG5cbiAgLyoqXG4gICAqIElmIHRoZSBjbHVzdGVyIGhhcyBvbmUgKG9yIG1vcmUpIEZhcmdhdGVQcm9maWxlcyBhc3NvY2lhdGVkLCB0aGlzIGFycmF5XG4gICAqIHdpbGwgaG9sZCBhIHJlZmVyZW5jZSB0byBlYWNoLlxuICAgKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfZmFyZ2F0ZVByb2ZpbGVzOiBGYXJnYXRlUHJvZmlsZVtdID0gW107XG5cbiAgLyoqXG4gICAqIGFuIE9wZW4gSUQgQ29ubmVjdCBQcm92aWRlciBpbnN0YW5jZVxuICAgKi9cbiAgcHJpdmF0ZSBfb3BlbklkQ29ubmVjdFByb3ZpZGVyPzogaWFtLklPcGVuSWRDb25uZWN0UHJvdmlkZXI7XG5cbiAgLyoqXG4gICAqIGFuIEVLUyBQb2QgSWRlbnRpdHkgQWdlbnQgaW5zdGFuY2VcbiAgICovXG4gIHByaXZhdGUgX2Vrc1BvZElkZW50aXR5QWdlbnQ/OiBJQWRkb247XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgS3ViZXJuZXRlcyByZXNvdXJjZXMgY2FuIGJlIHBydW5lZCBhdXRvbWF0aWNhbGx5LlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IHBydW5lOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBUaGUgQUxCIENvbnRyb2xsZXIgY29uc3RydWN0IGRlZmluZWQgZm9yIHRoaXMgY2x1c3Rlci5cbiAgICogV2lsbCBiZSB1bmRlZmluZWQgaWYgYGFsYkNvbnRyb2xsZXJgIHdhc24ndCBjb25maWd1cmVkLlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IGFsYkNvbnRyb2xsZXI/OiBBbGJDb250cm9sbGVyO1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgcmVzb3VyY2U6IENmbkNsdXN0ZXI7XG5cbiAgcHJpdmF0ZSBfbmV1cm9uRGV2aWNlUGx1Z2luPzogS3ViZXJuZXRlc01hbmlmZXN0O1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgZW5kcG9pbnRBY2Nlc3M6IEVuZHBvaW50QWNjZXNzO1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgdnBjU3VibmV0czogZWMyLlN1Ym5ldFNlbGVjdGlvbltdO1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgdmVyc2lvbjogS3ViZXJuZXRlc1ZlcnNpb247XG5cbiAgLy8gVE9ETzogcmV2aXNpdCBsb2dnaW5nIGZvcm1hdFxuICBwcml2YXRlIHJlYWRvbmx5IGxvZ2dpbmc/OiB7IFtrZXk6IHN0cmluZ106IHsgW2tleTpzdHJpbmddOiBhbnl9IH07XG5cbiAgLyoqXG4gICAqIEEgZHVtbXkgQ2xvdWRGb3JtYXRpb24gcmVzb3VyY2UgdGhhdCBpcyB1c2VkIGFzIGEgd2FpdCBiYXJyaWVyIHdoaWNoXG4gICAqIHJlcHJlc2VudHMgdGhhdCB0aGUgY2x1c3RlciBpcyByZWFkeSB0byByZWNlaXZlIFwia3ViZWN0bFwiIGNvbW1hbmRzLlxuICAgKlxuICAgKiBTcGVjaWZpY2FsbHksIGFsbCBmYXJnYXRlIHByb2ZpbGVzIGFyZSBhdXRvbWF0aWNhbGx5IGFkZGVkIGFzIGEgZGVwZW5kZW5jeVxuICAgKiBvZiB0aGlzIGJhcnJpZXIsIHdoaWNoIG1lYW5zIHRoYXQgaXQgd2lsbCBvbmx5IGJlIFwic2lnbmFsZWRcIiB3aGVuIGFsbFxuICAgKiBmYXJnYXRlIHByb2ZpbGVzIGhhdmUgYmVlbiBzdWNjZXNzZnVsbHkgY3JlYXRlZC5cbiAgICpcbiAgICogV2hlbiBrdWJlY3RsIHJlc291cmNlcyBjYWxsIGBfYXR0YWNoS3ViZWN0bFJlc291cmNlU2NvcGUoKWAsIHRoaXMgcmVzb3VyY2VcbiAgICogaXMgYWRkZWQgYXMgdGhlaXIgZGVwZW5kZW5jeSB3aGljaCBpbXBsaWVzIHRoYXQgdGhleSBjYW4gb25seSBiZSBkZXBsb3llZFxuICAgKiBhZnRlciB0aGUgY2x1c3RlciBpcyByZWFkeS5cbiAgICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX2t1YmVjdGxSZWFkeUJhcnJpZXI6IENmblJlc291cmNlO1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgX2t1YmVjdGxQcm92aWRlck9wdGlvbnM/OiBLdWJlY3RsUHJvdmlkZXJPcHRpb25zO1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgX2t1YmVjdGxQcm92aWRlcj86IElLdWJlY3RsUHJvdmlkZXI7XG5cbiAgcHJpdmF0ZSByZWFkb25seSBfY2x1c3RlckFkbWluQWNjZXNzPzogQWNjZXNzRW50cnk7XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlcyBhbiBFS1MgQ2x1c3RlciB3aXRoIHRoZSBzdXBwbGllZCBhcmd1bWVudHNcbiAgICpcbiAgICogQHBhcmFtIHNjb3BlIGEgQ29uc3RydWN0LCBtb3N0IGxpa2VseSBhIGNkay5TdGFjayBjcmVhdGVkXG4gICAqIEBwYXJhbSBpZCB0aGUgaWQgb2YgdGhlIENvbnN0cnVjdCB0byBjcmVhdGVcbiAgICogQHBhcmFtIHByb3BzIHByb3BlcnRpZXMgaW4gdGhlIElDbHVzdGVyUHJvcHMgaW50ZXJmYWNlXG4gICAqL1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogQ2x1c3RlclByb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCB7XG4gICAgICBwaHlzaWNhbE5hbWU6IHByb3BzLmNsdXN0ZXJOYW1lLFxuICAgIH0pO1xuICAgIC8vIEVuaGFuY2VkIENESyBBbmFseXRpY3MgVGVsZW1ldHJ5XG4gICAgYWRkQ29uc3RydWN0TWV0YWRhdGEodGhpcywgcHJvcHMpO1xuXG4gICAgdGhpcy5wcnVuZSA9IHByb3BzLnBydW5lID8/IHRydWU7XG4gICAgdGhpcy52cGMgPSBwcm9wcy52cGMgfHwgbmV3IGVjMi5WcGModGhpcywgJ0RlZmF1bHRWcGMnKTtcbiAgICB0aGlzLnZlcnNpb24gPSBwcm9wcy52ZXJzaW9uO1xuXG4gICAgdGhpcy5fa3ViZWN0bFByb3ZpZGVyT3B0aW9ucyA9IHByb3BzLmt1YmVjdGxQcm92aWRlck9wdGlvbnM7XG5cbiAgICB0aGlzLnRhZ1N1Ym5ldHMoKTtcblxuICAgIC8vIHRoaXMgaXMgdGhlIHJvbGUgdXNlZCBieSBFS1Mgd2hlbiBpbnRlcmFjdGluZyB3aXRoIEFXUyByZXNvdXJjZXNcbiAgICB0aGlzLnJvbGUgPSBwcm9wcy5yb2xlIHx8IG5ldyBpYW0uUm9sZSh0aGlzLCAnUm9sZScsIHtcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdla3MuYW1hem9uYXdzLmNvbScpLFxuICAgICAgbWFuYWdlZFBvbGljaWVzOiBbXG4gICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQW1hem9uRUtTQ2x1c3RlclBvbGljeScpLFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIHZhbGlkYXRlIGFsbCBhdXRvbW9kZSByZWxldmFudCBjb25maWd1cmF0aW9uc1xuICAgIGNvbnN0IGF1dG9Nb2RlRW5hYmxlZCA9IHRoaXMuaXNWYWxpZEF1dG9Nb2RlQ29uZmlnKHByb3BzKTtcblxuICAgIGlmIChhdXRvTW9kZUVuYWJsZWQpIHtcbiAgICAgIC8vIGF0dGFjaCByZXF1aXJlZCBtYW5hZ2VkIHBvbGljeSBmb3IgdGhlIGNsdXN0ZXIgcm9sZSBpbiBFS1MgQXV0byBNb2RlXG4gICAgICAvLyBzZWUgLSBodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vZWtzL2xhdGVzdC91c2VyZ3VpZGUvYXV0by1jbHVzdGVyLWlhbS1yb2xlLmh0bWxcbiAgICAgIFsnQW1hem9uRUtTQ29tcHV0ZVBvbGljeScsXG4gICAgICAgICdBbWF6b25FS1NCbG9ja1N0b3JhZ2VQb2xpY3knLFxuICAgICAgICAnQW1hem9uRUtTTG9hZEJhbGFuY2luZ1BvbGljeScsXG4gICAgICAgICdBbWF6b25FS1NOZXR3b3JraW5nUG9saWN5J10uZm9yRWFjaCgocG9saWN5TmFtZSkgPT4ge1xuICAgICAgICB0aGlzLnJvbGUuYWRkTWFuYWdlZFBvbGljeShpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUocG9saWN5TmFtZSkpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIHN0czpUYWdTZXNzaW9uIGlzIHJlcXVpcmVkIGZvciBFS1MgQXV0byBNb2RlIG9yIHdoZW4gdXNpbmcgRUtTIFBvZCBJZGVudGl0eSBmZWF0dXJlcy5cbiAgICAgIC8vIHNlZSBodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vZWtzL2xhdGVzdC91c2VyZ3VpZGUvcG9kLWlkLXJvbGUuaHRtbFxuICAgICAgLy8gaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL2Vrcy9sYXRlc3QvdXNlcmd1aWRlL2F1dG9tb2RlLWdldC1zdGFydGVkLWNsaS5odG1sI19jcmVhdGVfYW5fZWtzX2F1dG9fbW9kZV9jbHVzdGVyX2lhbV9yb2xlXG4gICAgICBpZiAodGhpcy5yb2xlIGluc3RhbmNlb2YgaWFtLlJvbGUpIHtcbiAgICAgICAgdGhpcy5yb2xlLmFzc3VtZVJvbGVQb2xpY3k/LmFkZFN0YXRlbWVudHMoXG4gICAgICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgICAgICAgcHJpbmNpcGFsczogW25ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnZWtzLmFtYXpvbmF3cy5jb20nKV0sXG4gICAgICAgICAgICBhY3Rpb25zOiBbJ3N0czpUYWdTZXNzaW9uJ10sXG4gICAgICAgICAgfSksXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3Qgc2VjdXJpdHlHcm91cCA9IHByb3BzLnNlY3VyaXR5R3JvdXAgfHwgbmV3IGVjMi5TZWN1cml0eUdyb3VwKHRoaXMsICdDb250cm9sUGxhbmVTZWN1cml0eUdyb3VwJywge1xuICAgICAgdnBjOiB0aGlzLnZwYyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnRUtTIENvbnRyb2wgUGxhbmUgU2VjdXJpdHkgR3JvdXAnLFxuICAgIH0pO1xuXG4gICAgdGhpcy52cGNTdWJuZXRzID0gcHJvcHMudnBjU3VibmV0cyA/PyBbeyBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QVUJMSUMgfSwgeyBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QUklWQVRFX1dJVEhfRUdSRVNTIH1dO1xuXG4gICAgY29uc3Qgc2VsZWN0ZWRTdWJuZXRJZHNQZXJHcm91cCA9IHRoaXMudnBjU3VibmV0cy5tYXAocyA9PiB0aGlzLnZwYy5zZWxlY3RTdWJuZXRzKHMpLnN1Ym5ldElkcyk7XG4gICAgaWYgKHNlbGVjdGVkU3VibmV0SWRzUGVyR3JvdXAuc29tZShUb2tlbi5pc1VucmVzb2x2ZWQpICYmIHNlbGVjdGVkU3VibmV0SWRzUGVyR3JvdXAubGVuZ3RoID4gMSkge1xuICAgICAgdGhyb3cgbmV3IFVuc2NvcGVkVmFsaWRhdGlvbkVycm9yKCdla3MuQ2x1c3RlcjogY2Fubm90IHNlbGVjdCBtdWx0aXBsZSBzdWJuZXQgZ3JvdXBzIGZyb20gYSBWUEMgaW1wb3J0ZWQgZnJvbSBsaXN0IHRva2VucyB3aXRoIHVua25vd24gbGVuZ3RoLiBTZWxlY3Qgb25seSBvbmUgc3VibmV0IGdyb3VwLCBwYXNzIGEgbGVuZ3RoIHRvIEZuLnNwbGl0LCBvciBzd2l0Y2ggdG8gVnBjLmZyb21Mb29rdXAuJyk7XG4gICAgfVxuXG4gICAgLy8gR2V0IHN1Ym5ldElkcyBmb3IgYWxsIHNlbGVjdGVkIHN1Ym5ldHNcbiAgICBjb25zdCBzdWJuZXRJZHMgPSBBcnJheS5mcm9tKG5ldyBTZXQoZmxhdHRlbihzZWxlY3RlZFN1Ym5ldElkc1Blckdyb3VwKSkpO1xuXG4gICAgdGhpcy5sb2dnaW5nID0gcHJvcHMuY2x1c3RlckxvZ2dpbmcgPyB7XG4gICAgICBjbHVzdGVyTG9nZ2luZzoge1xuICAgICAgICBlbmFibGVkVHlwZXM6IHByb3BzLmNsdXN0ZXJMb2dnaW5nLm1hcCgodHlwZSkgPT4gKHsgdHlwZSB9KSksXG4gICAgICB9LFxuICAgIH0gOiB1bmRlZmluZWQ7XG5cbiAgICB0aGlzLmVuZHBvaW50QWNjZXNzID0gcHJvcHMuZW5kcG9pbnRBY2Nlc3MgPz8gRW5kcG9pbnRBY2Nlc3MuUFVCTElDX0FORF9QUklWQVRFO1xuICAgIHRoaXMuaXBGYW1pbHkgPSBwcm9wcy5pcEZhbWlseSA/PyBJcEZhbWlseS5JUF9WNDtcblxuICAgIGNvbnN0IHByaXZhdGVTdWJuZXRzID0gdGhpcy5zZWxlY3RQcml2YXRlU3VibmV0cygpLnNsaWNlKDAsIDE2KTtcbiAgICBjb25zdCBwdWJsaWNBY2Nlc3NEaXNhYmxlZCA9ICF0aGlzLmVuZHBvaW50QWNjZXNzLl9jb25maWcucHVibGljQWNjZXNzO1xuICAgIGNvbnN0IHB1YmxpY0FjY2Vzc1Jlc3RyaWN0ZWQgPSAhcHVibGljQWNjZXNzRGlzYWJsZWRcbiAgICAgICYmIHRoaXMuZW5kcG9pbnRBY2Nlc3MuX2NvbmZpZy5wdWJsaWNDaWRyc1xuICAgICAgJiYgdGhpcy5lbmRwb2ludEFjY2Vzcy5fY29uZmlnLnB1YmxpY0NpZHJzLmxlbmd0aCAhPT0gMDtcblxuICAgIC8vIHZhbGlkYXRlIGVuZHBvaW50IGFjY2VzcyBjb25maWd1cmF0aW9uXG5cbiAgICBpZiAocHJpdmF0ZVN1Ym5ldHMubGVuZ3RoID09PSAwICYmIHB1YmxpY0FjY2Vzc0Rpc2FibGVkKSB7XG4gICAgICAvLyBubyBwcml2YXRlIHN1Ym5ldHMgYW5kIG5vIHB1YmxpYyBhY2Nlc3MgYXQgYWxsLCBubyBnb29kLlxuICAgICAgdGhyb3cgbmV3IFVuc2NvcGVkVmFsaWRhdGlvbkVycm9yKCdWcGMgbXVzdCBjb250YWluIHByaXZhdGUgc3VibmV0cyB3aGVuIHB1YmxpYyBlbmRwb2ludCBhY2Nlc3MgaXMgZGlzYWJsZWQnKTtcbiAgICB9XG5cbiAgICBpZiAocHJpdmF0ZVN1Ym5ldHMubGVuZ3RoID09PSAwICYmIHB1YmxpY0FjY2Vzc1Jlc3RyaWN0ZWQpIHtcbiAgICAgIC8vIG5vIHByaXZhdGUgc3VibmV0cyBhbmQgcHVibGljIGFjY2VzcyBpcyByZXN0cmljdGVkLCBubyBnb29kLlxuICAgICAgdGhyb3cgbmV3IFVuc2NvcGVkVmFsaWRhdGlvbkVycm9yKCdWcGMgbXVzdCBjb250YWluIHByaXZhdGUgc3VibmV0cyB3aGVuIHB1YmxpYyBlbmRwb2ludCBhY2Nlc3MgaXMgcmVzdHJpY3RlZCcpO1xuICAgIH1cblxuICAgIGlmIChwcm9wcy5zZXJ2aWNlSXB2NENpZHIgJiYgcHJvcHMuaXBGYW1pbHkgPT0gSXBGYW1pbHkuSVBfVjYpIHtcbiAgICAgIHRocm93IG5ldyBVbnNjb3BlZFZhbGlkYXRpb25FcnJvcignQ2Fubm90IHNwZWNpZnkgc2VydmljZUlwdjRDaWRyIHdpdGggaXBGYW1pbHkgZXF1YWwgdG8gSXBGYW1pbHkuSVBfVjYnKTtcbiAgICB9XG5cbiAgICBjb25zdCByZXNvdXJjZSA9IHRoaXMucmVzb3VyY2UgPSBuZXcgQ2ZuQ2x1c3Rlcih0aGlzLCAnUmVzb3VyY2UnLCB7XG4gICAgICBuYW1lOiB0aGlzLnBoeXNpY2FsTmFtZSxcbiAgICAgIHJvbGVBcm46IHRoaXMucm9sZS5yb2xlQXJuLFxuICAgICAgdmVyc2lvbjogcHJvcHMudmVyc2lvbi52ZXJzaW9uLFxuICAgICAgYWNjZXNzQ29uZmlnOiB7XG4gICAgICAgIGF1dGhlbnRpY2F0aW9uTW9kZTogJ0FQSScsXG4gICAgICAgIGJvb3RzdHJhcENsdXN0ZXJDcmVhdG9yQWRtaW5QZXJtaXNzaW9uczogcHJvcHMuYm9vdHN0cmFwQ2x1c3RlckNyZWF0b3JBZG1pblBlcm1pc3Npb25zLFxuICAgICAgfSxcbiAgICAgIGNvbXB1dGVDb25maWc6IHtcbiAgICAgICAgZW5hYmxlZDogYXV0b01vZGVFbmFibGVkLFxuICAgICAgICAvLyBJZiB0aGUgY29tcHV0ZUNvbmZpZyBlbmFibGVkIGZsYWcgaXMgc2V0IHRvIGZhbHNlIHdoZW4gY3JlYXRpbmcgYSBjbHVzdGVyIHdpdGggQXV0byBNb2RlLFxuICAgICAgICAvLyB0aGUgcmVxdWVzdCBtdXN0IG5vdCBpbmNsdWRlIHZhbHVlcyBmb3IgdGhlIG5vZGVSb2xlQXJuIG9yIG5vZGVQb29scyBmaWVsZHMuXG4gICAgICAgIC8vIEFsc28sIGlmIG5vZGVQb29scyBpcyBlbXB0eSwgbm9kZVJvbGVBcm4gc2hvdWxkIG5vdCBiZSBpbmNsdWRlZCB0byBwcmV2ZW50IGRlcGxveW1lbnQgZmFpbHVyZXNcbiAgICAgICAgbm9kZVBvb2xzOiAhYXV0b01vZGVFbmFibGVkID8gdW5kZWZpbmVkIDogcHJvcHMuY29tcHV0ZT8ubm9kZVBvb2xzID8/IFsnc3lzdGVtJywgJ2dlbmVyYWwtcHVycG9zZSddLFxuICAgICAgICBub2RlUm9sZUFybjogIWF1dG9Nb2RlRW5hYmxlZCB8fCAocHJvcHMuY29tcHV0ZT8ubm9kZVBvb2xzICYmIHByb3BzLmNvbXB1dGUubm9kZVBvb2xzLmxlbmd0aCA9PT0gMCkgP1xuICAgICAgICAgIHVuZGVmaW5lZCA6XG4gICAgICAgICAgcHJvcHMuY29tcHV0ZT8ubm9kZVJvbGU/LnJvbGVBcm4gPz8gdGhpcy5hZGROb2RlUG9vbFJvbGUoYCR7aWR9bm9kZVBvb2xSb2xlYCkucm9sZUFybixcbiAgICAgIH0sXG4gICAgICBzdG9yYWdlQ29uZmlnOiB7XG4gICAgICAgIGJsb2NrU3RvcmFnZToge1xuICAgICAgICAgIGVuYWJsZWQ6IGF1dG9Nb2RlRW5hYmxlZCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBrdWJlcm5ldGVzTmV0d29ya0NvbmZpZzoge1xuICAgICAgICBpcEZhbWlseTogdGhpcy5pcEZhbWlseSxcbiAgICAgICAgc2VydmljZUlwdjRDaWRyOiBwcm9wcy5zZXJ2aWNlSXB2NENpZHIsXG4gICAgICAgIGVsYXN0aWNMb2FkQmFsYW5jaW5nOiB7XG4gICAgICAgICAgZW5hYmxlZDogYXV0b01vZGVFbmFibGVkLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHJlc291cmNlc1ZwY0NvbmZpZzoge1xuICAgICAgICBzZWN1cml0eUdyb3VwSWRzOiBbc2VjdXJpdHlHcm91cC5zZWN1cml0eUdyb3VwSWRdLFxuICAgICAgICBzdWJuZXRJZHMsXG4gICAgICAgIGVuZHBvaW50UHJpdmF0ZUFjY2VzczogdGhpcy5lbmRwb2ludEFjY2Vzcy5fY29uZmlnLnByaXZhdGVBY2Nlc3MsXG4gICAgICAgIGVuZHBvaW50UHVibGljQWNjZXNzOiB0aGlzLmVuZHBvaW50QWNjZXNzLl9jb25maWcucHVibGljQWNjZXNzLFxuICAgICAgICBwdWJsaWNBY2Nlc3NDaWRyczogdGhpcy5lbmRwb2ludEFjY2Vzcy5fY29uZmlnLnB1YmxpY0NpZHJzLFxuICAgICAgfSxcbiAgICAgIC4uLihwcm9wcy5zZWNyZXRzRW5jcnlwdGlvbktleSA/IHtcbiAgICAgICAgZW5jcnlwdGlvbkNvbmZpZzogW3tcbiAgICAgICAgICBwcm92aWRlcjoge1xuICAgICAgICAgICAga2V5QXJuOiBwcm9wcy5zZWNyZXRzRW5jcnlwdGlvbktleS5rZXlSZWYua2V5QXJuLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgcmVzb3VyY2VzOiBbJ3NlY3JldHMnXSxcbiAgICAgICAgfV0sXG4gICAgICB9IDoge30pLFxuICAgICAgdGFnczogT2JqZWN0LmtleXMocHJvcHMudGFncyA/PyB7fSkubWFwKGsgPT4gKHsga2V5OiBrLCB2YWx1ZTogcHJvcHMudGFncyFba10gfSkpLFxuICAgICAgbG9nZ2luZzogdGhpcy5sb2dnaW5nLFxuICAgIH0pO1xuXG4gICAgbGV0IGt1YmVjdGxTdWJuZXRzID0gdGhpcy5fa3ViZWN0bFByb3ZpZGVyT3B0aW9ucz8ucHJpdmF0ZVN1Ym5ldHM7XG5cbiAgICBpZiAodGhpcy5lbmRwb2ludEFjY2Vzcy5fY29uZmlnLnByaXZhdGVBY2Nlc3MgJiYgcHJpdmF0ZVN1Ym5ldHMubGVuZ3RoICE9PSAwKSB7XG4gICAgICAvLyB3aGVuIHByaXZhdGUgYWNjZXNzIGlzIGVuYWJsZWQgYW5kIHRoZSB2cGMgaGFzIHByaXZhdGUgc3VibmV0cywgbGV0cyBjb25uZWN0XG4gICAgICAvLyB0aGUgcHJvdmlkZXIgdG8gdGhlIHZwYyBzbyB0aGF0IGl0IHdpbGwgd29yayBldmVuIHdoZW4gcmVzdHJpY3RpbmcgcHVibGljIGFjY2Vzcy5cblxuICAgICAgLy8gdmFsaWRhdGUgVlBDIHByb3BlcnRpZXMgYWNjb3JkaW5nIHRvOiBodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vZWtzL2xhdGVzdC91c2VyZ3VpZGUvY2x1c3Rlci1lbmRwb2ludC5odG1sXG4gICAgICBpZiAodGhpcy52cGMgaW5zdGFuY2VvZiBlYzIuVnBjICYmICEodGhpcy52cGMuZG5zSG9zdG5hbWVzRW5hYmxlZCAmJiB0aGlzLnZwYy5kbnNTdXBwb3J0RW5hYmxlZCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IFVuc2NvcGVkVmFsaWRhdGlvbkVycm9yKCdQcml2YXRlIGVuZHBvaW50IGFjY2VzcyByZXF1aXJlcyB0aGUgVlBDIHRvIGhhdmUgRE5TIHN1cHBvcnQgYW5kIEROUyBob3N0bmFtZXMgZW5hYmxlZC4gVXNlIGBlbmFibGVEbnNIb3N0bmFtZXM6IHRydWVgIGFuZCBgZW5hYmxlRG5zU3VwcG9ydDogdHJ1ZWAgd2hlbiBjcmVhdGluZyB0aGUgVlBDLicpO1xuICAgICAgfVxuXG4gICAgICBrdWJlY3RsU3VibmV0cyA9IHByaXZhdGVTdWJuZXRzO1xuXG4gICAgICAvLyB0aGUgdnBjIG11c3QgZXhpc3QgaW4gb3JkZXIgdG8gcHJvcGVybHkgZGVsZXRlIHRoZSBjbHVzdGVyIChzaW5jZSB3ZSBydW4gYGt1YmVjdGwgZGVsZXRlYCkuXG4gICAgICAvLyB0aGlzIGVuc3VyZXMgdGhhdC5cbiAgICAgIHRoaXMucmVzb3VyY2Uubm9kZS5hZGREZXBlbmRlbmN5KHRoaXMudnBjKTtcbiAgICB9XG5cbiAgICAvLyB3ZSB1c2UgYW4gU1NNIHBhcmFtZXRlciBhcyBhIGJhcnJpZXIgYmVjYXVzZSBpdCdzIGZyZWUgYW5kIGZhc3QuXG4gICAgdGhpcy5fa3ViZWN0bFJlYWR5QmFycmllciA9IG5ldyBDZm5SZXNvdXJjZSh0aGlzLCAnS3ViZWN0bFJlYWR5QmFycmllcicsIHtcbiAgICAgIHR5cGU6ICdBV1M6OlNTTTo6UGFyYW1ldGVyJyxcbiAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgVHlwZTogJ1N0cmluZycsXG4gICAgICAgIFZhbHVlOiAnYXdzOmNkazpla3M6a3ViZWN0bC1yZWFkeScsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gYWRkIHRoZSBjbHVzdGVyIHJlc291cmNlIGl0c2VsZiBhcyBhIGRlcGVuZGVuY3kgb2YgdGhlIGJhcnJpZXJcbiAgICB0aGlzLl9rdWJlY3RsUmVhZHlCYXJyaWVyLm5vZGUuYWRkRGVwZW5kZW5jeSh0aGlzLnJlc291cmNlKTtcblxuICAgIHRoaXMuY2x1c3RlckVuZHBvaW50ID0gcmVzb3VyY2UuYXR0ckVuZHBvaW50O1xuICAgIHRoaXMuY2x1c3RlckNlcnRpZmljYXRlQXV0aG9yaXR5RGF0YSA9IHJlc291cmNlLmF0dHJDZXJ0aWZpY2F0ZUF1dGhvcml0eURhdGE7XG4gICAgdGhpcy5jbHVzdGVyU2VjdXJpdHlHcm91cElkID0gcmVzb3VyY2UuYXR0ckNsdXN0ZXJTZWN1cml0eUdyb3VwSWQ7XG4gICAgdGhpcy5jbHVzdGVyRW5jcnlwdGlvbkNvbmZpZ0tleUFybiA9IHJlc291cmNlLmF0dHJFbmNyeXB0aW9uQ29uZmlnS2V5QXJuO1xuXG4gICAgdGhpcy5jbHVzdGVyU2VjdXJpdHlHcm91cCA9IGVjMi5TZWN1cml0eUdyb3VwLmZyb21TZWN1cml0eUdyb3VwSWQodGhpcywgJ0NsdXN0ZXJTZWN1cml0eUdyb3VwJywgdGhpcy5jbHVzdGVyU2VjdXJpdHlHcm91cElkKTtcblxuICAgIHRoaXMuY29ubmVjdGlvbnMgPSBuZXcgZWMyLkNvbm5lY3Rpb25zKHtcbiAgICAgIHNlY3VyaXR5R3JvdXBzOiBbdGhpcy5jbHVzdGVyU2VjdXJpdHlHcm91cCwgc2VjdXJpdHlHcm91cF0sXG4gICAgICBkZWZhdWx0UG9ydDogZWMyLlBvcnQudGNwKDQ0MyksIC8vIENvbnRyb2wgUGxhbmUgaGFzIGFuIEhUVFBTIEFQSVxuICAgIH0pO1xuXG4gICAgY29uc3Qgc3RhY2sgPSBTdGFjay5vZih0aGlzKTtcbiAgICBjb25zdCB1cGRhdGVDb25maWdDb21tYW5kUHJlZml4ID0gYGF3cyBla3MgdXBkYXRlLWt1YmVjb25maWcgLS1uYW1lICR7dGhpcy5jbHVzdGVyTmFtZX1gO1xuICAgIGNvbnN0IGdldFRva2VuQ29tbWFuZFByZWZpeCA9IGBhd3MgZWtzIGdldC10b2tlbiAtLWNsdXN0ZXItbmFtZSAke3RoaXMuY2x1c3Rlck5hbWV9YDtcbiAgICBjb25zdCBjb21tb25Db21tYW5kT3B0aW9ucyA9IFtgLS1yZWdpb24gJHtzdGFjay5yZWdpb259YF07XG5cbiAgICBpZiAocHJvcHMua3ViZWN0bFByb3ZpZGVyT3B0aW9ucykge1xuICAgICAgdGhpcy5fa3ViZWN0bFByb3ZpZGVyID0gbmV3IEt1YmVjdGxQcm92aWRlcih0aGlzLCAnS3ViZWN0bFByb3ZpZGVyJywge1xuICAgICAgICBjbHVzdGVyOiB0aGlzLFxuICAgICAgICByb2xlOiB0aGlzLl9rdWJlY3RsUHJvdmlkZXJPcHRpb25zPy5yb2xlLFxuICAgICAgICBhd3NjbGlMYXllcjogdGhpcy5fa3ViZWN0bFByb3ZpZGVyT3B0aW9ucz8uYXdzY2xpTGF5ZXIsXG4gICAgICAgIGt1YmVjdGxMYXllcjogdGhpcy5fa3ViZWN0bFByb3ZpZGVyT3B0aW9ucyEua3ViZWN0bExheWVyLFxuICAgICAgICBlbnZpcm9ubWVudDogdGhpcy5fa3ViZWN0bFByb3ZpZGVyT3B0aW9ucz8uZW52aXJvbm1lbnQsXG4gICAgICAgIG1lbW9yeTogdGhpcy5fa3ViZWN0bFByb3ZpZGVyT3B0aW9ucz8ubWVtb3J5LFxuICAgICAgICBwcml2YXRlU3VibmV0czoga3ViZWN0bFN1Ym5ldHMsXG4gICAgICB9KTtcblxuICAgICAgLy8gZ2l2ZSB0aGUgaGFuZGxlciByb2xlIGFkbWluIGFjY2VzcyB0byB0aGUgY2x1c3RlclxuICAgICAgLy8gc28gaXQgY2FuIGRlcGxveS9xdWVyeSBhbnkgcmVzb3VyY2UuXG4gICAgICB0aGlzLl9jbHVzdGVyQWRtaW5BY2Nlc3MgPSB0aGlzLmdyYW50Q2x1c3RlckFkbWluKCdDbHVzdGVyQWRtaW5Sb2xlQWNjZXNzJywgdGhpcy5fa3ViZWN0bFByb3ZpZGVyPy5yb2xlIS5yb2xlQXJuKTtcblxuICAgICAgLy8gRW5zdXJlIGt1YmVjdGwgaXMgbWFya2VkIGFzIHJlYWR5IG9ubHkgYWZ0ZXIgYWRtaW4gYWNjZXNzIGhhcyBiZWVuIGdyYW50ZWRcbiAgICAgIHRoaXMuX2t1YmVjdGxSZWFkeUJhcnJpZXIubm9kZS5hZGREZXBlbmRlbmN5KHRoaXMuX2NsdXN0ZXJBZG1pbkFjY2Vzcyk7XG4gICAgfVxuXG4gICAgLy8gZG8gbm90IGNyZWF0ZSBhIG1hc3RlcnMgcm9sZSBpZiBvbmUgaXMgbm90IHByb3ZpZGVkLiBUcnVzdGluZyB0aGUgYWNjb3VudFJvb3RQcmluY2lwYWwoKSBpcyB0b28gcGVybWlzc2l2ZS5cbiAgICBpZiAocHJvcHMubWFzdGVyc1JvbGUpIHtcbiAgICAgIGNvbnN0IG1hc3RlcnNSb2xlID0gcHJvcHMubWFzdGVyc1JvbGU7XG4gICAgICB0aGlzLmdyYW50QWNjZXNzKCdtYXN0ZXJzUm9sZUFjY2VzcycsIHByb3BzLm1hc3RlcnNSb2xlLnJvbGVBcm4sIFtcbiAgICAgICAgQWNjZXNzUG9saWN5LmZyb21BY2Nlc3NQb2xpY3lOYW1lKCdBbWF6b25FS1NDbHVzdGVyQWRtaW5Qb2xpY3knLCB7XG4gICAgICAgICAgYWNjZXNzU2NvcGVUeXBlOiBBY2Nlc3NTY29wZVR5cGUuQ0xVU1RFUixcbiAgICAgICAgfSksXG4gICAgICBdKTtcblxuICAgICAgY29tbW9uQ29tbWFuZE9wdGlvbnMucHVzaChgLS1yb2xlLWFybiAke21hc3RlcnNSb2xlLnJvbGVBcm59YCk7XG4gICAgfVxuXG4gICAgaWYgKHByb3BzLmFsYkNvbnRyb2xsZXIpIHtcbiAgICAgIHRoaXMuYWxiQ29udHJvbGxlciA9IEFsYkNvbnRyb2xsZXIuY3JlYXRlKHRoaXMsIHsgLi4ucHJvcHMuYWxiQ29udHJvbGxlciwgY2x1c3RlcjogdGhpcyB9KTtcbiAgICB9XG5cbiAgICAvLyBpZiBhbnkgb2YgZGVmYXVsdENhcGFjaXR5KiBwcm9wZXJ0aWVzIGFyZSBzZXQsIHdlIG5lZWQgYSBkZWZhdWx0IGNhcGFjaXR5KG5vZGVncm91cClcbiAgICBpZiAocHJvcHMuZGVmYXVsdENhcGFjaXR5ICE9PSB1bmRlZmluZWQgfHxcbiAgICAgICAgcHJvcHMuZGVmYXVsdENhcGFjaXR5VHlwZSAhPT0gdW5kZWZpbmVkIHx8XG4gICAgICAgIHByb3BzLmRlZmF1bHRDYXBhY2l0eUluc3RhbmNlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IG1pbkNhcGFjaXR5ID0gcHJvcHMuZGVmYXVsdENhcGFjaXR5ID8/IERFRkFVTFRfQ0FQQUNJVFlfQ09VTlQ7XG4gICAgICBpZiAobWluQ2FwYWNpdHkgPiAwKSB7XG4gICAgICAgIGNvbnN0IGluc3RhbmNlVHlwZSA9IHByb3BzLmRlZmF1bHRDYXBhY2l0eUluc3RhbmNlIHx8IERFRkFVTFRfQ0FQQUNJVFlfVFlQRTtcbiAgICAgICAgLy8gSWYgZGVmYXVsdENhcGFjaXR5VHlwZSBpcyB1bmRlZmluZWQsIHVzZSBBVVRPTU9ERSBhcyB0aGUgZGVmYXVsdFxuICAgICAgICBjb25zdCBjYXBhY2l0eVR5cGUgPSBwcm9wcy5kZWZhdWx0Q2FwYWNpdHlUeXBlID8/IERlZmF1bHRDYXBhY2l0eVR5cGUuQVVUT01PREU7XG5cbiAgICAgICAgLy8gT25seSBjcmVhdGUgRUMyIG9yIE5vZGVncm91cCBjYXBhY2l0eSBpZiBub3QgdXNpbmcgQVVUT01PREVcbiAgICAgICAgaWYgKGNhcGFjaXR5VHlwZSA9PT0gRGVmYXVsdENhcGFjaXR5VHlwZS5FQzIpIHtcbiAgICAgICAgICB0aGlzLmRlZmF1bHRDYXBhY2l0eSA9IHRoaXMuYWRkQXV0b1NjYWxpbmdHcm91cENhcGFjaXR5KCdEZWZhdWx0Q2FwYWNpdHknLCB7IGluc3RhbmNlVHlwZSwgbWluQ2FwYWNpdHkgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoY2FwYWNpdHlUeXBlID09PSBEZWZhdWx0Q2FwYWNpdHlUeXBlLk5PREVHUk9VUCkge1xuICAgICAgICAgIHRoaXMuZGVmYXVsdE5vZGVncm91cCA9IHRoaXMuYWRkTm9kZWdyb3VwQ2FwYWNpdHkoJ0RlZmF1bHRDYXBhY2l0eScsIHsgaW5zdGFuY2VUeXBlczogW2luc3RhbmNlVHlwZV0sIG1pblNpemU6IG1pbkNhcGFjaXR5IH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vIEZvciBBVVRPTU9ERSwgd2UgZG9uJ3QgY3JlYXRlIGFueSBleHBsaWNpdCBjYXBhY2l0eSBhcyBpdCdzIG1hbmFnZWQgYnkgRUtTXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gZW5zdXJlIEZBUkdBVEUgc3RpbGwgYXBwbGllcyBoZXJlXG4gICAgaWYgKHByb3BzLmNvcmVEbnNDb21wdXRlVHlwZSA9PT0gQ29yZURuc0NvbXB1dGVUeXBlLkZBUkdBVEUpIHtcbiAgICAgIHRoaXMuZGVmaW5lQ29yZURuc0NvbXB1dGVUeXBlKENvcmVEbnNDb21wdXRlVHlwZS5GQVJHQVRFKTtcbiAgICB9XG5cbiAgICBjb25zdCBvdXRwdXRDb25maWdDb21tYW5kID0gKHByb3BzLm91dHB1dENvbmZpZ0NvbW1hbmQgPz8gdHJ1ZSkgJiYgcHJvcHMubWFzdGVyc1JvbGU7XG4gICAgaWYgKG91dHB1dENvbmZpZ0NvbW1hbmQpIHtcbiAgICAgIGNvbnN0IHBvc3RmaXggPSBjb21tb25Db21tYW5kT3B0aW9ucy5qb2luKCcgJyk7XG4gICAgICBuZXcgQ2ZuT3V0cHV0KHRoaXMsICdDb25maWdDb21tYW5kJywgeyB2YWx1ZTogYCR7dXBkYXRlQ29uZmlnQ29tbWFuZFByZWZpeH0gJHtwb3N0Zml4fWAgfSk7XG4gICAgICBuZXcgQ2ZuT3V0cHV0KHRoaXMsICdHZXRUb2tlbkNvbW1hbmQnLCB7IHZhbHVlOiBgJHtnZXRUb2tlbkNvbW1hbmRQcmVmaXh9ICR7cG9zdGZpeH1gIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHcmFudHMgdGhlIHNwZWNpZmllZCBJQU0gcHJpbmNpcGFsIGFjY2VzcyB0byB0aGUgRUtTIGNsdXN0ZXIgYmFzZWQgb24gdGhlIHByb3ZpZGVkIGFjY2VzcyBwb2xpY2llcy5cbiAgICpcbiAgICogVGhpcyBtZXRob2QgY3JlYXRlcyBhbiBgQWNjZXNzRW50cnlgIGNvbnN0cnVjdCB0aGF0IGdyYW50cyB0aGUgc3BlY2lmaWVkIElBTSBwcmluY2lwYWwgdGhlIGFjY2VzcyBwZXJtaXNzaW9uc1xuICAgKiBkZWZpbmVkIGJ5IHRoZSBwcm92aWRlZCBgSUFjY2Vzc1BvbGljeWAgYXJyYXkuIFRoaXMgYWxsb3dzIHRoZSBJQU0gcHJpbmNpcGFsIHRvIHBlcmZvcm0gdGhlIGFjdGlvbnMgcGVybWl0dGVkXG4gICAqIGJ5IHRoZSBhY2Nlc3MgcG9saWNpZXMgd2l0aGluIHRoZSBFS1MgY2x1c3Rlci5cbiAgICogW2Rpc2FibGUtYXdzbGludDpuby1ncmFudHNdXG4gICAqXG4gICAqIEBwYXJhbSBpZCAtIFRoZSBJRCBvZiB0aGUgYEFjY2Vzc0VudHJ5YCBjb25zdHJ1Y3QgdG8gYmUgY3JlYXRlZC5cbiAgICogQHBhcmFtIHByaW5jaXBhbCAtIFRoZSBJQU0gcHJpbmNpcGFsIChyb2xlIG9yIHVzZXIpIHRvIGJlIGdyYW50ZWQgYWNjZXNzIHRvIHRoZSBFS1MgY2x1c3Rlci5cbiAgICogQHBhcmFtIGFjY2Vzc1BvbGljaWVzIC0gQW4gYXJyYXkgb2YgYElBY2Nlc3NQb2xpY3lgIG9iamVjdHMgdGhhdCBkZWZpbmUgdGhlIGFjY2VzcyBwZXJtaXNzaW9ucyB0byBiZSBncmFudGVkIHRvIHRoZSBJQU0gcHJpbmNpcGFsLlxuICAgKi9cbiAgQE1ldGhvZE1ldGFkYXRhKClcbiAgcHVibGljIGdyYW50QWNjZXNzKGlkOiBzdHJpbmcsIHByaW5jaXBhbDogc3RyaW5nLCBhY2Nlc3NQb2xpY2llczogSUFjY2Vzc1BvbGljeVtdKSB7XG4gICAgdGhpcy5hZGRUb0FjY2Vzc0VudHJ5KGlkLCBwcmluY2lwYWwsIGFjY2Vzc1BvbGljaWVzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHcmFudHMgdGhlIHNwZWNpZmllZCBJQU0gcHJpbmNpcGFsIGNsdXN0ZXIgYWRtaW4gYWNjZXNzIHRvIHRoZSBFS1MgY2x1c3Rlci5cbiAgICpcbiAgICogVGhpcyBtZXRob2QgY3JlYXRlcyBhbiBgQWNjZXNzRW50cnlgIGNvbnN0cnVjdCB0aGF0IGdyYW50cyB0aGUgc3BlY2lmaWVkIElBTSBwcmluY2lwYWwgdGhlIGNsdXN0ZXIgYWRtaW5cbiAgICogYWNjZXNzIHBlcm1pc3Npb25zLiBUaGlzIGFsbG93cyB0aGUgSUFNIHByaW5jaXBhbCB0byBwZXJmb3JtIHRoZSBhY3Rpb25zIHBlcm1pdHRlZFxuICAgKiBieSB0aGUgY2x1c3RlciBhZG1pbiBhY2Nlcy5cbiAgICogW2Rpc2FibGUtYXdzbGludDpuby1ncmFudHNdXG4gICAqXG4gICAqIEBwYXJhbSBpZCAtIFRoZSBJRCBvZiB0aGUgYEFjY2Vzc0VudHJ5YCBjb25zdHJ1Y3QgdG8gYmUgY3JlYXRlZC5cbiAgICogQHBhcmFtIHByaW5jaXBhbCAtIFRoZSBJQU0gcHJpbmNpcGFsIChyb2xlIG9yIHVzZXIpIHRvIGJlIGdyYW50ZWQgYWNjZXNzIHRvIHRoZSBFS1MgY2x1c3Rlci5cbiAgICogQHJldHVybnMgdGhlIGFjY2VzcyBlbnRyeSBjb25zdHJ1Y3RcbiAgICovXG4gIEBNZXRob2RNZXRhZGF0YSgpXG4gIHB1YmxpYyBncmFudENsdXN0ZXJBZG1pbihpZDogc3RyaW5nLCBwcmluY2lwYWw6IHN0cmluZyk6IEFjY2Vzc0VudHJ5IHtcbiAgICBjb25zdCBuZXdFbnRyeSA9IG5ldyBBY2Nlc3NFbnRyeSh0aGlzLCBpZCwge1xuICAgICAgcHJpbmNpcGFsLFxuICAgICAgY2x1c3RlcjogdGhpcyxcbiAgICAgIGFjY2Vzc1BvbGljaWVzOiBbXG4gICAgICAgIEFjY2Vzc1BvbGljeS5mcm9tQWNjZXNzUG9saWN5TmFtZSgnQW1hem9uRUtTQ2x1c3RlckFkbWluUG9saWN5Jywge1xuICAgICAgICAgIGFjY2Vzc1Njb3BlVHlwZTogQWNjZXNzU2NvcGVUeXBlLkNMVVNURVIsXG4gICAgICAgIH0pLFxuICAgICAgXSxcbiAgICB9KTtcbiAgICB0aGlzLmFjY2Vzc0VudHJpZXMuc2V0KHByaW5jaXBhbCwgbmV3RW50cnkpO1xuICAgIHJldHVybiBuZXdFbnRyeTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCB0aGUgbG9hZCBiYWxhbmNlciBhZGRyZXNzIG9mIGEgc2VydmljZSBvZiB0eXBlICdMb2FkQmFsYW5jZXInLlxuICAgKlxuICAgKiBAcGFyYW0gc2VydmljZU5hbWUgVGhlIG5hbWUgb2YgdGhlIHNlcnZpY2UuXG4gICAqIEBwYXJhbSBvcHRpb25zIEFkZGl0aW9uYWwgb3BlcmF0aW9uIG9wdGlvbnMuXG4gICAqL1xuICBATWV0aG9kTWV0YWRhdGEoKVxuICBwdWJsaWMgZ2V0U2VydmljZUxvYWRCYWxhbmNlckFkZHJlc3Moc2VydmljZU5hbWU6IHN0cmluZywgb3B0aW9uczogU2VydmljZUxvYWRCYWxhbmNlckFkZHJlc3NPcHRpb25zID0ge30pOiBzdHJpbmcge1xuICAgIGNvbnN0IGxvYWRCYWxhbmNlckFkZHJlc3MgPSBuZXcgS3ViZXJuZXRlc09iamVjdFZhbHVlKHRoaXMsIGAke3NlcnZpY2VOYW1lfUxvYWRCYWxhbmNlckFkZHJlc3NgLCB7XG4gICAgICBjbHVzdGVyOiB0aGlzLFxuICAgICAgb2JqZWN0VHlwZTogJ3NlcnZpY2UnLFxuICAgICAgb2JqZWN0TmFtZTogc2VydmljZU5hbWUsXG4gICAgICBvYmplY3ROYW1lc3BhY2U6IG9wdGlvbnMubmFtZXNwYWNlLFxuICAgICAganNvblBhdGg6ICcuc3RhdHVzLmxvYWRCYWxhbmNlci5pbmdyZXNzWzBdLmhvc3RuYW1lJyxcbiAgICAgIHRpbWVvdXQ6IG9wdGlvbnMudGltZW91dCxcbiAgICB9KTtcblxuICAgIHJldHVybiBsb2FkQmFsYW5jZXJBZGRyZXNzLnZhbHVlO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIHRoZSBsb2FkIGJhbGFuY2VyIGFkZHJlc3Mgb2YgYW4gaW5ncmVzcyBiYWNrZWQgYnkgYSBsb2FkIGJhbGFuY2VyLlxuICAgKlxuICAgKiBAcGFyYW0gaW5ncmVzc05hbWUgVGhlIG5hbWUgb2YgdGhlIGluZ3Jlc3MuXG4gICAqIEBwYXJhbSBvcHRpb25zIEFkZGl0aW9uYWwgb3BlcmF0aW9uIG9wdGlvbnMuXG4gICAqL1xuICBATWV0aG9kTWV0YWRhdGEoKVxuICBwdWJsaWMgZ2V0SW5ncmVzc0xvYWRCYWxhbmNlckFkZHJlc3MoaW5ncmVzc05hbWU6IHN0cmluZywgb3B0aW9uczogSW5ncmVzc0xvYWRCYWxhbmNlckFkZHJlc3NPcHRpb25zID0ge30pOiBzdHJpbmcge1xuICAgIGNvbnN0IGxvYWRCYWxhbmNlckFkZHJlc3MgPSBuZXcgS3ViZXJuZXRlc09iamVjdFZhbHVlKHRoaXMsIGAke2luZ3Jlc3NOYW1lfUxvYWRCYWxhbmNlckFkZHJlc3NgLCB7XG4gICAgICBjbHVzdGVyOiB0aGlzLFxuICAgICAgb2JqZWN0VHlwZTogJ2luZ3Jlc3MnLFxuICAgICAgb2JqZWN0TmFtZTogaW5ncmVzc05hbWUsXG4gICAgICBvYmplY3ROYW1lc3BhY2U6IG9wdGlvbnMubmFtZXNwYWNlLFxuICAgICAganNvblBhdGg6ICcuc3RhdHVzLmxvYWRCYWxhbmNlci5pbmdyZXNzWzBdLmhvc3RuYW1lJyxcbiAgICAgIHRpbWVvdXQ6IG9wdGlvbnMudGltZW91dCxcbiAgICB9KTtcblxuICAgIHJldHVybiBsb2FkQmFsYW5jZXJBZGRyZXNzLnZhbHVlO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBub2RlcyB0byB0aGlzIEVLUyBjbHVzdGVyXG4gICAqXG4gICAqIFRoZSBub2RlcyB3aWxsIGF1dG9tYXRpY2FsbHkgYmUgY29uZmlndXJlZCB3aXRoIHRoZSByaWdodCBWUEMgYW5kIEFNSVxuICAgKiBmb3IgdGhlIGluc3RhbmNlIHR5cGUgYW5kIEt1YmVybmV0ZXMgdmVyc2lvbi5cbiAgICpcbiAgICogTm90ZSB0aGF0IGlmIHlvdSBzcGVjaWZ5IGB1cGRhdGVUeXBlOiBSb2xsaW5nVXBkYXRlYCBvciBgdXBkYXRlVHlwZTogUmVwbGFjaW5nVXBkYXRlYCwgeW91ciBub2RlcyBtaWdodCBiZSByZXBsYWNlZCBhdCBkZXBsb3lcbiAgICogdGltZSB3aXRob3V0IG5vdGljZSBpbiBjYXNlIHRoZSByZWNvbW1lbmRlZCBBTUkgZm9yIHlvdXIgbWFjaGluZSBpbWFnZSB0eXBlIGhhcyBiZWVuIHVwZGF0ZWQgYnkgQVdTLlxuICAgKiBUaGUgZGVmYXVsdCBiZWhhdmlvciBmb3IgYHVwZGF0ZVR5cGVgIGlzIGBOb25lYCwgd2hpY2ggbWVhbnMgb25seSBuZXcgaW5zdGFuY2VzIHdpbGwgYmUgbGF1bmNoZWQgdXNpbmcgdGhlIG5ldyBBTUkuXG4gICAqXG4gICAqL1xuICBATWV0aG9kTWV0YWRhdGEoKVxuICBwdWJsaWMgYWRkQXV0b1NjYWxpbmdHcm91cENhcGFjaXR5KGlkOiBzdHJpbmcsIG9wdGlvbnM6IEF1dG9TY2FsaW5nR3JvdXBDYXBhY2l0eU9wdGlvbnMpOiBhdXRvc2NhbGluZy5BdXRvU2NhbGluZ0dyb3VwIHtcbiAgICBpZiAob3B0aW9ucy5tYWNoaW5lSW1hZ2VUeXBlID09PSBNYWNoaW5lSW1hZ2VUeXBlLkJPVFRMRVJPQ0tFVCAmJiBvcHRpb25zLmJvb3RzdHJhcE9wdGlvbnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IFVuc2NvcGVkVmFsaWRhdGlvbkVycm9yKCdib290c3RyYXBPcHRpb25zIGlzIG5vdCBzdXBwb3J0ZWQgZm9yIEJvdHRsZXJvY2tldCcpO1xuICAgIH1cbiAgICBjb25zdCBhc2cgPSBuZXcgYXV0b3NjYWxpbmcuQXV0b1NjYWxpbmdHcm91cCh0aGlzLCBpZCwge1xuICAgICAgLi4ub3B0aW9ucyxcbiAgICAgIHZwYzogdGhpcy52cGMsXG4gICAgICBtYWNoaW5lSW1hZ2U6IG9wdGlvbnMubWFjaGluZUltYWdlVHlwZSA9PT0gTWFjaGluZUltYWdlVHlwZS5CT1RUTEVST0NLRVQgP1xuICAgICAgICBuZXcgQm90dGxlUm9ja2V0SW1hZ2Uoe1xuICAgICAgICAgIGt1YmVybmV0ZXNWZXJzaW9uOiB0aGlzLnZlcnNpb24udmVyc2lvbixcbiAgICAgICAgfSkgOlxuICAgICAgICBuZXcgRWtzT3B0aW1pemVkSW1hZ2Uoe1xuICAgICAgICAgIG5vZGVUeXBlOiBub2RlVHlwZUZvckluc3RhbmNlVHlwZShvcHRpb25zLmluc3RhbmNlVHlwZSksXG4gICAgICAgICAgY3B1QXJjaDogY3B1QXJjaEZvckluc3RhbmNlVHlwZShvcHRpb25zLmluc3RhbmNlVHlwZSksXG4gICAgICAgICAga3ViZXJuZXRlc1ZlcnNpb246IHRoaXMudmVyc2lvbi52ZXJzaW9uLFxuICAgICAgICB9KSxcbiAgICB9KTtcblxuICAgIHRoaXMuY29ubmVjdEF1dG9TY2FsaW5nR3JvdXBDYXBhY2l0eShhc2csIHtcbiAgICAgIGJvb3RzdHJhcE9wdGlvbnM6IG9wdGlvbnMuYm9vdHN0cmFwT3B0aW9ucyxcbiAgICAgIGJvb3RzdHJhcEVuYWJsZWQ6IG9wdGlvbnMuYm9vdHN0cmFwRW5hYmxlZCxcbiAgICAgIG1hY2hpbmVJbWFnZVR5cGU6IG9wdGlvbnMubWFjaGluZUltYWdlVHlwZSxcbiAgICB9KTtcblxuICAgIGlmIChub2RlVHlwZUZvckluc3RhbmNlVHlwZShvcHRpb25zLmluc3RhbmNlVHlwZSkgPT09IE5vZGVUeXBlLklORkVSRU5USUEgfHxcbiAgICAgIG5vZGVUeXBlRm9ySW5zdGFuY2VUeXBlKG9wdGlvbnMuaW5zdGFuY2VUeXBlKSA9PT0gTm9kZVR5cGUuVFJBSU5JVU0pIHtcbiAgICAgIHRoaXMuYWRkTmV1cm9uRGV2aWNlUGx1Z2luKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGFzZztcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgbWFuYWdlZCBub2RlZ3JvdXAgdG8gdGhpcyBBbWF6b24gRUtTIGNsdXN0ZXJcbiAgICpcbiAgICogVGhpcyBtZXRob2Qgd2lsbCBjcmVhdGUgYSBuZXcgbWFuYWdlZCBub2RlZ3JvdXAgYW5kIGFkZCBpbnRvIHRoZSBjYXBhY2l0eS5cbiAgICpcbiAgICogQHNlZSBodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vZWtzL2xhdGVzdC91c2VyZ3VpZGUvbWFuYWdlZC1ub2RlLWdyb3Vwcy5odG1sXG4gICAqIEBwYXJhbSBpZCBUaGUgSUQgb2YgdGhlIG5vZGVncm91cFxuICAgKiBAcGFyYW0gb3B0aW9ucyBvcHRpb25zIGZvciBjcmVhdGluZyBhIG5ldyBub2RlZ3JvdXBcbiAgICovXG4gIEBNZXRob2RNZXRhZGF0YSgpXG4gIHB1YmxpYyBhZGROb2RlZ3JvdXBDYXBhY2l0eShpZDogc3RyaW5nLCBvcHRpb25zPzogTm9kZWdyb3VwT3B0aW9ucyk6IE5vZGVncm91cCB7XG4gICAgY29uc3QgaGFzSW5mZXJlbnRpYU9yVHJhaW5pdW1JbnN0YW5jZVR5cGUgPSBbXG4gICAgICBvcHRpb25zPy5pbnN0YW5jZVR5cGUsXG4gICAgICAuLi5vcHRpb25zPy5pbnN0YW5jZVR5cGVzID8/IFtdLFxuICAgIF0uc29tZShpID0+IGkgJiYgKG5vZGVUeXBlRm9ySW5zdGFuY2VUeXBlKGkpID09PSBOb2RlVHlwZS5JTkZFUkVOVElBIHx8XG4gICAgICBub2RlVHlwZUZvckluc3RhbmNlVHlwZShpKSA9PT0gTm9kZVR5cGUuVFJBSU5JVU0pKTtcblxuICAgIGlmIChoYXNJbmZlcmVudGlhT3JUcmFpbml1bUluc3RhbmNlVHlwZSkge1xuICAgICAgdGhpcy5hZGROZXVyb25EZXZpY2VQbHVnaW4oKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBOb2RlZ3JvdXAodGhpcywgYE5vZGVncm91cCR7aWR9YCwge1xuICAgICAgY2x1c3RlcjogdGhpcyxcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSWYgdGhpcyBjbHVzdGVyIGlzIGt1YmVjdGwtZW5hYmxlZCwgcmV0dXJucyB0aGUgT3BlbklEIENvbm5lY3QgaXNzdWVyIHVybC5cbiAgICogSWYgdGhpcyBjbHVzdGVyIGlzIG5vdCBrdWJlY3RsLWVuYWJsZWQgKGkuZS4gdXNlcyB0aGVcbiAgICogc3RvY2sgYENmbkNsdXN0ZXJgKSwgdGhpcyBpcyBgdW5kZWZpbmVkYC5cbiAgICogQGF0dHJpYnV0ZVxuICAgKi9cbiAgcHVibGljIGdldCBjbHVzdGVyT3BlbklkQ29ubmVjdElzc3VlclVybCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnJlc291cmNlLmF0dHJPcGVuSWRDb25uZWN0SXNzdWVyVXJsO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuIGBPcGVuSWRDb25uZWN0UHJvdmlkZXJgIHJlc291cmNlIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGNsdXN0ZXIsIGFuZCB3aGljaCBjYW4gYmUgdXNlZFxuICAgKiB0byBsaW5rIHRoaXMgY2x1c3RlciB0byBBV1MgSUFNLlxuICAgKlxuICAgKiBBIHByb3ZpZGVyIHdpbGwgb25seSBiZSBkZWZpbmVkIGlmIHRoaXMgcHJvcGVydHkgaXMgYWNjZXNzZWQgKGxhenkgaW5pdGlhbGl6YXRpb24pLlxuICAgKlxuICAgKi9cbiAgcHVibGljIGdldCBvcGVuSWRDb25uZWN0UHJvdmlkZXIoKTogaWFtLklPcGVuSWRDb25uZWN0UHJvdmlkZXIge1xuICAgIGlmICghdGhpcy5fb3BlbklkQ29ubmVjdFByb3ZpZGVyKSB7XG4gICAgICBpZiAoRmVhdHVyZUZsYWdzLm9mKHRoaXMpLmlzRW5hYmxlZChFS1NfVVNFX05BVElWRV9PSURDX1BST1ZJREVSKSkge1xuICAgICAgICB0aGlzLl9vcGVuSWRDb25uZWN0UHJvdmlkZXIgPSBuZXcgT2lkY1Byb3ZpZGVyTmF0aXZlKHRoaXMsICdPaWRjUHJvdmlkZXJOYXRpdmUnLCB7XG4gICAgICAgICAgdXJsOiB0aGlzLmNsdXN0ZXJPcGVuSWRDb25uZWN0SXNzdWVyVXJsLFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX29wZW5JZENvbm5lY3RQcm92aWRlciA9IG5ldyBPcGVuSWRDb25uZWN0UHJvdmlkZXIodGhpcywgJ09wZW5JZENvbm5lY3RQcm92aWRlcicsIHtcbiAgICAgICAgICB1cmw6IHRoaXMuY2x1c3Rlck9wZW5JZENvbm5lY3RJc3N1ZXJVcmwsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9vcGVuSWRDb25uZWN0UHJvdmlkZXI7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGt1YmVjdGxQcm92aWRlcigpIHtcbiAgICByZXR1cm4gdGhpcy5fa3ViZWN0bFByb3ZpZGVyO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyB0aGUgRUtTIFBvZCBJZGVudGl0eSBBZ2VudCBhZGRvbiBmb3IgdGhlIEVLUyBjbHVzdGVyLlxuICAgKlxuICAgKiBUaGUgRUtTIFBvZCBJZGVudGl0eSBBZ2VudCBpcyByZXNwb25zaWJsZSBmb3IgbWFuYWdpbmcgdGhlIHRlbXBvcmFyeSBjcmVkZW50aWFsc1xuICAgKiB1c2VkIGJ5IHBvZHMgaW4gdGhlIGNsdXN0ZXIgdG8gYWNjZXNzIEFXUyByZXNvdXJjZXMuIEl0IHJ1bnMgYXMgYSBEYWVtb25TZXQgb25cbiAgICogZWFjaCBub2RlIGFuZCBwcm92aWRlcyB0aGUgbmVjZXNzYXJ5IGNyZWRlbnRpYWxzIHRvIHRoZSBwb2RzIGJhc2VkIG9uIHRoZWlyXG4gICAqIGFzc29jaWF0ZWQgc2VydmljZSBhY2NvdW50LlxuICAgKlxuICAgKi9cbiAgcHVibGljIGdldCBla3NQb2RJZGVudGl0eUFnZW50KCk6IElBZGRvbiB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKCF0aGlzLl9la3NQb2RJZGVudGl0eUFnZW50KSB7XG4gICAgICB0aGlzLl9la3NQb2RJZGVudGl0eUFnZW50ID0gbmV3IEFkZG9uKHRoaXMsICdFa3NQb2RJZGVudGl0eUFnZW50QWRkb24nLCB7XG4gICAgICAgIGNsdXN0ZXI6IHRoaXMsXG4gICAgICAgIGFkZG9uTmFtZTogJ2Vrcy1wb2QtaWRlbnRpdHktYWdlbnQnLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX2Vrc1BvZElkZW50aXR5QWdlbnQ7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIEZhcmdhdGUgcHJvZmlsZSB0byB0aGlzIGNsdXN0ZXIuXG4gICAqIEBzZWUgaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL2Vrcy9sYXRlc3QvdXNlcmd1aWRlL2ZhcmdhdGUtcHJvZmlsZS5odG1sXG4gICAqXG4gICAqIEBwYXJhbSBpZCB0aGUgaWQgb2YgdGhpcyBwcm9maWxlXG4gICAqIEBwYXJhbSBvcHRpb25zIHByb2ZpbGUgb3B0aW9uc1xuICAgKi9cbiAgQE1ldGhvZE1ldGFkYXRhKClcbiAgcHVibGljIGFkZEZhcmdhdGVQcm9maWxlKGlkOiBzdHJpbmcsIG9wdGlvbnM6IEZhcmdhdGVQcm9maWxlT3B0aW9ucykge1xuICAgIHJldHVybiBuZXcgRmFyZ2F0ZVByb2ZpbGUodGhpcywgYGZhcmdhdGUtcHJvZmlsZS0ke2lkfWAsIHtcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgICBjbHVzdGVyOiB0aGlzLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEludGVybmFsIEFQSSB1c2VkIGJ5IGBGYXJnYXRlUHJvZmlsZWAgdG8ga2VlcCBpbnZlbnRvcnkgb2YgRmFyZ2F0ZSBwcm9maWxlcyBhc3NvY2lhdGVkIHdpdGhcbiAgICogdGhpcyBjbHVzdGVyLCBmb3IgdGhlIHNha2Ugb2YgZW5zdXJpbmcgdGhlIHByb2ZpbGVzIGFyZSBjcmVhdGVkIHNlcXVlbnRpYWxseS5cbiAgICpcbiAgICogQHJldHVybnMgdGhlIGxpc3Qgb2YgRmFyZ2F0ZVByb2ZpbGVzIGF0dGFjaGVkIHRvIHRoaXMgY2x1c3RlciwgaW5jbHVkaW5nIHRoZSBvbmUganVzdCBhdHRhY2hlZC5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBwdWJsaWMgX2F0dGFjaEZhcmdhdGVQcm9maWxlKGZhcmdhdGVQcm9maWxlOiBGYXJnYXRlUHJvZmlsZSk6IEZhcmdhdGVQcm9maWxlW10ge1xuICAgIHRoaXMuX2ZhcmdhdGVQcm9maWxlcy5wdXNoKGZhcmdhdGVQcm9maWxlKTtcblxuICAgIC8vIGFkZCBhbGwgcHJvZmlsZXMgYXMgYSBkZXBlbmRlbmN5IG9mIHRoZSBcImt1YmVjdGwtcmVhZHlcIiBiYXJyaWVyIGJlY2F1c2UgYWxsIGt1YmVjdGwtXG4gICAgLy8gcmVzb3VyY2VzIGNhbiBvbmx5IGJlIGRlcGxveWVkIGFmdGVyIGFsbCBmYXJnYXRlIHByb2ZpbGVzIGFyZSBjcmVhdGVkLlxuICAgIHRoaXMuX2t1YmVjdGxSZWFkeUJhcnJpZXIubm9kZS5hZGREZXBlbmRlbmN5KGZhcmdhdGVQcm9maWxlKTtcblxuICAgIHJldHVybiB0aGlzLl9mYXJnYXRlUHJvZmlsZXM7XG4gIH1cblxuICAvKipcbiAgICogdmFsaWRhdGUgYWxsIGF1dG9Nb2RlIHJlbGV2YW50IGNvbmZpZ3VyYXRpb25zIHRvIGVuc3VyZSB0aGV5IGFyZSBjb3JyZWN0IGFuZCB0aHJvd1xuICAgKiBlcnJvcnMgaWYgdGhleSBhcmUgbm90LlxuICAgKlxuICAgKiBAcGFyYW0gcHJvcHMgQ2x1c3RlclByb3BzXG4gICAqXG4gICAqL1xuICBwcml2YXRlIGlzVmFsaWRBdXRvTW9kZUNvbmZpZyhwcm9wczogQ2x1c3RlclByb3BzKTogYm9vbGVhbiB7XG4gICAgY29uc3QgYXV0b01vZGVFbmFibGVkID0gcHJvcHMuZGVmYXVsdENhcGFjaXR5VHlwZSA9PT0gdW5kZWZpbmVkIHx8IHByb3BzLmRlZmF1bHRDYXBhY2l0eVR5cGUgPT0gRGVmYXVsdENhcGFjaXR5VHlwZS5BVVRPTU9ERTtcbiAgICAvLyBpZiB1c2luZyBBVVRPTU9ERVxuICAgIGlmIChhdXRvTW9kZUVuYWJsZWQpIHtcbiAgICAgIC8vIFdoZW4gdXNpbmcgQVVUT01PREUsIG5vZGVQb29scyB2YWx1ZXMgYXJlIGNhc2Utc2Vuc2l0aXZlIGFuZCBtdXN0IGJlIGdlbmVyYWwtcHVycG9zZSBhbmQvb3Igc3lzdGVtXG4gICAgICBpZiAocHJvcHMuY29tcHV0ZT8ubm9kZVBvb2xzKSB7XG4gICAgICAgIGNvbnN0IHZhbGlkTm9kZVBvb2xzID0gWydnZW5lcmFsLXB1cnBvc2UnLCAnc3lzdGVtJ107XG4gICAgICAgIGNvbnN0IGludmFsaWRQb29scyA9IHByb3BzLmNvbXB1dGUubm9kZVBvb2xzLmZpbHRlcihwb29sID0+ICF2YWxpZE5vZGVQb29scy5pbmNsdWRlcyhwb29sKSk7XG4gICAgICAgIGlmIChpbnZhbGlkUG9vbHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHRocm93IG5ldyBVbnNjb3BlZFZhbGlkYXRpb25FcnJvcihgSW52YWxpZCBub2RlIHBvb2wgdmFsdWVzOiAke2ludmFsaWRQb29scy5qb2luKCcsICcpfS4gVmFsaWQgdmFsdWVzIGFyZTogJHt2YWxpZE5vZGVQb29scy5qb2luKCcsICcpfWApO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFdoZW4gdXNpbmcgQVVUT01PREUsIGRlZmF1bHRDYXBhY2l0eSBhbmQgZGVmYXVsdENhcGFjaXR5SW5zdGFuY2UgY2Fubm90IGJlIHNwZWNpZmllZFxuICAgICAgaWYgKHByb3BzLmRlZmF1bHRDYXBhY2l0eSAhPT0gdW5kZWZpbmVkIHx8IHByb3BzLmRlZmF1bHRDYXBhY2l0eUluc3RhbmNlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IFVuc2NvcGVkVmFsaWRhdGlvbkVycm9yKCdDYW5ub3Qgc3BlY2lmeSBkZWZhdWx0Q2FwYWNpdHkgb3IgZGVmYXVsdENhcGFjaXR5SW5zdGFuY2Ugd2hlbiB1c2luZyBBdXRvIE1vZGUuIEF1dG8gTW9kZSBtYW5hZ2VzIGNvbXB1dGUgcmVzb3VyY2VzIGF1dG9tYXRpY2FsbHkuJyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGlmIE5PVCB1c2luZyBBVVRPTU9ERVxuICAgICAgaWYgKHByb3BzLmNvbXB1dGUpIHtcbiAgICAgICAgLy8gV2hlbiBub3QgdXNpbmcgQVVUT01PREUsIGNvbXB1dGUgbXVzdCBiZSB1bmRlZmluZWRcbiAgICAgICAgdGhyb3cgbmV3IFVuc2NvcGVkVmFsaWRhdGlvbkVycm9yKCdDYW5ub3Qgc3BlY2lmeSBjb21wdXRlIHdpdGhvdXQgdXNpbmcgRGVmYXVsdENhcGFjaXR5VHlwZS5BVVRPTU9ERScpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBhdXRvTW9kZUVuYWJsZWQ7XG4gIH1cblxuICBwcml2YXRlIGFkZE5vZGVQb29sUm9sZShpZDogc3RyaW5nKTogaWFtLlJvbGUge1xuICAgIGNvbnN0IHJvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgaWQsIHtcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdlYzIuYW1hem9uYXdzLmNvbScpLFxuICAgICAgLy8gdG8gYmUgYWJsZSB0byBhY2Nlc3MgdGhlIEFXU0xvYWRCYWxhbmNlckNvbnRyb2xsZXJcbiAgICAgIG1hbmFnZWRQb2xpY2llczogW1xuICAgICAgICAvLyBzZWUgaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL2Vrcy9sYXRlc3QvdXNlcmd1aWRlL2F1dG9tb2RlLWdldC1zdGFydGVkLWNsaS5odG1sI2F1dG8tbW9kZS1jcmVhdGUtcm9sZXNcbiAgICAgICAgaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdBbWF6b25FS1NXb3JrZXJOb2RlUG9saWN5JyksXG4gICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQW1hem9uRUMyQ29udGFpbmVyUmVnaXN0cnlSZWFkT25seScpLFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIHJldHVybiByb2xlO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYW4gYWNjZXNzIGVudHJ5IHRvIHRoZSBjbHVzdGVyJ3MgYWNjZXNzIGVudHJpZXMgbWFwLlxuICAgKlxuICAgKiBJZiBhbiBlbnRyeSBhbHJlYWR5IGV4aXN0cyBmb3IgdGhlIGdpdmVuIHByaW5jaXBhbCwgaXQgYWRkcyB0aGUgcHJvdmlkZWQgYWNjZXNzIHBvbGljaWVzIHRvIHRoZSBleGlzdGluZyBlbnRyeS5cbiAgICogSWYgbm8gZW50cnkgZXhpc3RzIGZvciB0aGUgZ2l2ZW4gcHJpbmNpcGFsLCBpdCBjcmVhdGVzIGEgbmV3IGFjY2VzcyBlbnRyeSB3aXRoIHRoZSBwcm92aWRlZCBhY2Nlc3MgcG9saWNpZXMuXG4gICAqXG4gICAqIEBwYXJhbSBwcmluY2lwYWwgLSBUaGUgcHJpbmNpcGFsIChlLmcuLCBJQU0gdXNlciBvciByb2xlKSBmb3Igd2hpY2ggdGhlIGFjY2VzcyBlbnRyeSBpcyBiZWluZyBhZGRlZC5cbiAgICogQHBhcmFtIHBvbGljaWVzIC0gQW4gYXJyYXkgb2YgYWNjZXNzIHBvbGljaWVzIHRvIGJlIGFzc29jaWF0ZWQgd2l0aCB0aGUgcHJpbmNpcGFsLlxuICAgKlxuICAgKiBAdGhyb3dzIHtFcnJvcn0gSWYgdGhlIHVuaXF1ZU5hbWUgZ2VuZXJhdGVkIGZvciB0aGUgbmV3IGFjY2VzcyBlbnRyeSBpcyBub3QgdW5pcXVlLlxuICAgKlxuICAgKiBAcmV0dXJucyB7dm9pZH1cbiAgICovXG4gIHByaXZhdGUgYWRkVG9BY2Nlc3NFbnRyeShpZDogc3RyaW5nLCBwcmluY2lwYWw6IHN0cmluZywgcG9saWNpZXM6IElBY2Nlc3NQb2xpY3lbXSkge1xuICAgIGNvbnN0IGVudHJ5ID0gdGhpcy5hY2Nlc3NFbnRyaWVzLmdldChwcmluY2lwYWwpO1xuICAgIGlmIChlbnRyeSkge1xuICAgICAgKGVudHJ5IGFzIEFjY2Vzc0VudHJ5KS5hZGRBY2Nlc3NQb2xpY2llcyhwb2xpY2llcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IG5ld0VudHJ5ID0gbmV3IEFjY2Vzc0VudHJ5KHRoaXMsIGlkLCB7XG4gICAgICAgIHByaW5jaXBhbCxcbiAgICAgICAgY2x1c3RlcjogdGhpcyxcbiAgICAgICAgYWNjZXNzUG9saWNpZXM6IHBvbGljaWVzLFxuICAgICAgfSk7XG4gICAgICB0aGlzLmFjY2Vzc0VudHJpZXMuc2V0KHByaW5jaXBhbCwgbmV3RW50cnkpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgcmVzb3VyY2Ugc2NvcGUgdGhhdCByZXF1aXJlcyBga3ViZWN0bGAgdG8gdGhpcyBjbHVzdGVyIGFuZCByZXR1cm5zXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHVibGljIF9kZXBlbmRPbkt1YmVjdGxCYXJyaWVyKHJlc291cmNlOiBDb25zdHJ1Y3QpIHtcbiAgICByZXNvdXJjZS5ub2RlLmFkZERlcGVuZGVuY3kodGhpcy5fa3ViZWN0bFJlYWR5QmFycmllcik7XG4gIH1cblxuICBwcml2YXRlIHNlbGVjdFByaXZhdGVTdWJuZXRzKCk6IGVjMi5JU3VibmV0W10ge1xuICAgIGNvbnN0IHByaXZhdGVTdWJuZXRzOiBlYzIuSVN1Ym5ldFtdID0gW107XG4gICAgY29uc3QgdnBjUHJpdmF0ZVN1Ym5ldElkcyA9IHRoaXMudnBjLnByaXZhdGVTdWJuZXRzLm1hcChzID0+IHMuc3VibmV0SWQpO1xuICAgIGNvbnN0IHZwY1B1YmxpY1N1Ym5ldElkcyA9IHRoaXMudnBjLnB1YmxpY1N1Ym5ldHMubWFwKHMgPT4gcy5zdWJuZXRJZCk7XG5cbiAgICBmb3IgKGNvbnN0IHBsYWNlbWVudCBvZiB0aGlzLnZwY1N1Ym5ldHMpIHtcbiAgICAgIGZvciAoY29uc3Qgc3VibmV0IG9mIHRoaXMudnBjLnNlbGVjdFN1Ym5ldHMocGxhY2VtZW50KS5zdWJuZXRzKSB7XG4gICAgICAgIGlmICh2cGNQcml2YXRlU3VibmV0SWRzLmluY2x1ZGVzKHN1Ym5ldC5zdWJuZXRJZCkpIHtcbiAgICAgICAgICAvLyBkZWZpbml0ZWx5IHByaXZhdGUsIHRha2UgaXQuXG4gICAgICAgICAgcHJpdmF0ZVN1Ym5ldHMucHVzaChzdWJuZXQpO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZwY1B1YmxpY1N1Ym5ldElkcy5pbmNsdWRlcyhzdWJuZXQuc3VibmV0SWQpKSB7XG4gICAgICAgICAgLy8gZGVmaW5pdGVseSBwdWJsaWMsIHNraXAgaXQuXG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBuZWl0aGVyIHB1YmxpYyBhbmQgbm9yIHByaXZhdGUgLSB3aGF0IGlzIGl0IHRoZW4/IHRoaXMgbWVhbnMgaXRzIGEgc3VibmV0IGluc3RhbmNlIHRoYXQgd2FzIGV4cGxpY2l0bHkgcGFzc2VkXG4gICAgICAgIC8vIGluIHRoZSBzdWJuZXQgc2VsZWN0aW9uLiBzaW5jZSBJU3VibmV0IGRvZXNuJ3QgY29udGFpbiBpbmZvcm1hdGlvbiBvbiB0eXBlLCB3ZSBoYXZlIHRvIGFzc3VtZSBpdHMgcHJpdmF0ZSBhbmQgbGV0IGl0XG4gICAgICAgIC8vIGZhaWwgYXQgZGVwbG95IHRpbWUgOlxcIChpdHMgYmV0dGVyIHRoYW4gZmlsdGVyaW5nIGl0IG91dCBhbmQgcHJldmVudGluZyBhIHBvc3NpYmx5IHN1Y2Nlc3NmdWwgZGVwbG95bWVudClcbiAgICAgICAgcHJpdmF0ZVN1Ym5ldHMucHVzaChzdWJuZXQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBwcml2YXRlU3VibmV0cztcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnN0YWxscyB0aGUgTmV1cm9uIGRldmljZSBwbHVnaW4gb24gdGhlIGNsdXN0ZXIgaWYgaXQncyBub3RcbiAgICogYWxyZWFkeSBhZGRlZC5cbiAgICovXG4gIHByaXZhdGUgYWRkTmV1cm9uRGV2aWNlUGx1Z2luKCkge1xuICAgIGlmICghdGhpcy5fbmV1cm9uRGV2aWNlUGx1Z2luKSB7XG4gICAgICBjb25zdCBmaWxlQ29udGVudHMgPSBmcy5yZWFkRmlsZVN5bmMocGF0aC5qb2luKF9fZGlybmFtZSwgJ2FkZG9ucycsICduZXVyb24tZGV2aWNlLXBsdWdpbi55YW1sJyksICd1dGY4Jyk7XG4gICAgICBjb25zdCBzYW5pdGl6ZWQgPSBZQU1MLnBhcnNlKGZpbGVDb250ZW50cyk7XG4gICAgICB0aGlzLl9uZXVyb25EZXZpY2VQbHVnaW4gPSB0aGlzLmFkZE1hbmlmZXN0KCdOZXVyb25EZXZpY2VQbHVnaW4nLCBzYW5pdGl6ZWQpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9uZXVyb25EZXZpY2VQbHVnaW47XG4gIH1cblxuICAvKipcbiAgICogT3Bwb3J0dW5pc3RpY2FsbHkgdGFnIHN1Ym5ldHMgd2l0aCB0aGUgcmVxdWlyZWQgdGFncy5cbiAgICpcbiAgICogSWYgbm8gc3VibmV0cyBjb3VsZCBiZSBmb3VuZCAoYmVjYXVzZSB0aGlzIGlzIGFuIGltcG9ydGVkIFZQQyksIGFkZCBhIHdhcm5pbmcuXG4gICAqXG4gICAqIEBzZWUgaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL2Vrcy9sYXRlc3QvdXNlcmd1aWRlL25ldHdvcmtfcmVxcy5odG1sXG4gICAqL1xuICBwcml2YXRlIHRhZ1N1Ym5ldHMoKSB7XG4gICAgY29uc3QgdGFnQWxsU3VibmV0cyA9ICh0eXBlOiBzdHJpbmcsIHN1Ym5ldHM6IGVjMi5JU3VibmV0W10sIHRhZzogc3RyaW5nKSA9PiB7XG4gICAgICBmb3IgKGNvbnN0IHN1Ym5ldCBvZiBzdWJuZXRzKSB7XG4gICAgICAgIC8vIGlmIHRoaXMgaXMgbm90IGEgY29uY3JldGUgc3VibmV0LCBhdHRhY2ggYSBjb25zdHJ1Y3Qgd2FybmluZ1xuICAgICAgICBpZiAoIWVjMi5TdWJuZXQuaXNWcGNTdWJuZXQoc3VibmV0KSkge1xuICAgICAgICAgIC8vIG1lc3NhZ2UgKGlmIHRva2VuKTogXCJjb3VsZCBub3QgYXV0by10YWcgcHVibGljL3ByaXZhdGUgc3VibmV0IHdpdGggdGFnLi4uXCJcbiAgICAgICAgICAvLyBtZXNzYWdlIChpZiBub3QgdG9rZW4pOiBcImNvdW50IG5vdCBhdXRvLXRhZyBwdWJsaWMvcHJpdmF0ZSBzdWJuZXQgeHh4eHggd2l0aCB0YWcuLi5cIlxuICAgICAgICAgIGNvbnN0IHN1Ym5ldElEID0gVG9rZW4uaXNVbnJlc29sdmVkKHN1Ym5ldC5zdWJuZXRJZCkgfHwgVG9rZW4uaXNVbnJlc29sdmVkKFtzdWJuZXQuc3VibmV0SWRdKSA/ICcnIDogYCAke3N1Ym5ldC5zdWJuZXRJZH1gO1xuICAgICAgICAgIEFubm90YXRpb25zLm9mKHRoaXMpLmFkZFdhcm5pbmdWMignQGF3cy1jZGsvYXdzLWVrczpjbHVzdGVyTXVzdE1hbnVhbGx5VGFnU3VibmV0JywgYENvdWxkIG5vdCBhdXRvLXRhZyAke3R5cGV9IHN1Ym5ldCR7c3VibmV0SUR9IHdpdGggXCIke3RhZ309MVwiLCBwbGVhc2UgcmVtZW1iZXIgdG8gZG8gdGhpcyBtYW51YWxseWApO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgVGFncy5vZihzdWJuZXQpLmFkZCh0YWcsICcxJyk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8vIGh0dHBzOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9la3MvbGF0ZXN0L3VzZXJndWlkZS9uZXR3b3JrX3JlcXMuaHRtbFxuICAgIHRhZ0FsbFN1Ym5ldHMoJ3ByaXZhdGUnLCB0aGlzLnZwYy5wcml2YXRlU3VibmV0cywgJ2t1YmVybmV0ZXMuaW8vcm9sZS9pbnRlcm5hbC1lbGInKTtcbiAgICB0YWdBbGxTdWJuZXRzKCdwdWJsaWMnLCB0aGlzLnZwYy5wdWJsaWNTdWJuZXRzLCAna3ViZXJuZXRlcy5pby9yb2xlL2VsYicpO1xuICB9XG5cbiAgLyoqXG4gICAqIFBhdGNoZXMgdGhlIENvcmVETlMgZGVwbG95bWVudCBjb25maWd1cmF0aW9uIGFuZCBzZXRzIHRoZSBcImVrcy5hbWF6b25hd3MuY29tL2NvbXB1dGUtdHlwZVwiXG4gICAqIGFubm90YXRpb24gdG8gZWl0aGVyIFwiZWMyXCIgb3IgXCJmYXJnYXRlXCIuIE5vdGUgdGhhdCBpZiBcImVjMlwiIGlzIHNlbGVjdGVkLCB0aGUgcmVzb3VyY2UgaXNcbiAgICogb21pdHRlZC9yZW1vdmVkLCBzaW5jZSB0aGUgY2x1c3RlciBpcyBjcmVhdGVkIHdpdGggdGhlIFwiZWMyXCIgY29tcHV0ZSB0eXBlIGJ5IGRlZmF1bHQuXG4gICAqL1xuICBwcml2YXRlIGRlZmluZUNvcmVEbnNDb21wdXRlVHlwZSh0eXBlOiBDb3JlRG5zQ29tcHV0ZVR5cGUpIHtcbiAgICAvLyBlYzIgaXMgdGhlIFwiYnVpbHQgaW5cIiBjb21wdXRlIHR5cGUgb2YgdGhlIGNsdXN0ZXIgc28gaWYgdGhpcyBpcyB0aGVcbiAgICAvLyByZXF1ZXN0ZWQgdHlwZSB3ZSBjYW4gc2ltcGx5IG9taXQgdGhlIHJlc291cmNlLiBzaW5jZSB0aGUgcmVzb3VyY2Unc1xuICAgIC8vIGByZXN0b3JlUGF0Y2hgIGlzIGNvbmZpZ3VyZWQgdG8gcmVzdG9yZSB0aGUgdmFsdWUgdG8gXCJlYzJcIiB0aGlzIG1lYW5zXG4gICAgLy8gdGhhdCBkZWxldGlvbiBvZiB0aGUgcmVzb3VyY2Ugd2lsbCBjaGFuZ2UgdG8gXCJlYzJcIiBhcyB3ZWxsLlxuICAgIGlmICh0eXBlID09PSBDb3JlRG5zQ29tcHV0ZVR5cGUuRUMyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gdGhpcyBpcyB0aGUganNvbiBwYXRjaCB3ZSBtZXJnZSBpbnRvIHRoZSByZXNvdXJjZSBiYXNlZCBvZmYgb2Y6XG4gICAgLy8gaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL2Vrcy9sYXRlc3QvdXNlcmd1aWRlL2ZhcmdhdGUtZ2V0dGluZy1zdGFydGVkLmh0bWwjZmFyZ2F0ZS1ncy1jb3JlZG5zXG4gICAgY29uc3QgcmVuZGVyUGF0Y2ggPSAoY29tcHV0ZVR5cGU6IENvcmVEbnNDb21wdXRlVHlwZSkgPT4gKHtcbiAgICAgIHNwZWM6IHtcbiAgICAgICAgdGVtcGxhdGU6IHtcbiAgICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgICAgYW5ub3RhdGlvbnM6IHtcbiAgICAgICAgICAgICAgJ2Vrcy5hbWF6b25hd3MuY29tL2NvbXB1dGUtdHlwZSc6IGNvbXB1dGVUeXBlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGs4c1BhdGNoID0gbmV3IEt1YmVybmV0ZXNQYXRjaCh0aGlzLCAnQ29yZURuc0NvbXB1dGVUeXBlUGF0Y2gnLCB7XG4gICAgICBjbHVzdGVyOiB0aGlzLFxuICAgICAgcmVzb3VyY2VOYW1lOiAnZGVwbG95bWVudC9jb3JlZG5zJyxcbiAgICAgIHJlc291cmNlTmFtZXNwYWNlOiAna3ViZS1zeXN0ZW0nLFxuICAgICAgYXBwbHlQYXRjaDogcmVuZGVyUGF0Y2goQ29yZURuc0NvbXB1dGVUeXBlLkZBUkdBVEUpLFxuICAgICAgcmVzdG9yZVBhdGNoOiByZW5kZXJQYXRjaChDb3JlRG5zQ29tcHV0ZVR5cGUuRUMyKSxcbiAgICB9KTtcblxuICAgIC8vIEluIFBhdGNoIGRlbGV0aW9uLCBpdCBuZWVkcyB0byBhcHBseSB0aGUgcmVzdG9yZSBwYXRjaCB0byB0aGUgY2x1c3RlclxuICAgIC8vIFNvIHRoZSBjbHVzdGVyIGFkbWluIGFjY2VzcyBjYW4gb25seSBiZSBkZWxldGVkIGFmdGVyIHRoZSBwYXRjaFxuICAgIGlmICh0aGlzLl9jbHVzdGVyQWRtaW5BY2Nlc3MpIHtcbiAgICAgIGs4c1BhdGNoLm5vZGUuYWRkRGVwZW5kZW5jeSh0aGlzLl9jbHVzdGVyQWRtaW5BY2Nlc3MpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIE9wdGlvbnMgZm9yIGFkZGluZyB3b3JrZXIgbm9kZXNcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBdXRvU2NhbGluZ0dyb3VwQ2FwYWNpdHlPcHRpb25zIGV4dGVuZHMgYXV0b3NjYWxpbmcuQ29tbW9uQXV0b1NjYWxpbmdHcm91cFByb3BzIHtcbiAgLyoqXG4gICAqIEluc3RhbmNlIHR5cGUgb2YgdGhlIGluc3RhbmNlcyB0byBzdGFydFxuICAgKi9cbiAgcmVhZG9ubHkgaW5zdGFuY2VUeXBlOiBlYzIuSW5zdGFuY2VUeXBlO1xuXG4gIC8qKlxuICAgKiBDb25maWd1cmVzIHRoZSBFQzIgdXNlci1kYXRhIHNjcmlwdCBmb3IgaW5zdGFuY2VzIGluIHRoaXMgYXV0b3NjYWxpbmcgZ3JvdXBcbiAgICogdG8gYm9vdHN0cmFwIHRoZSBub2RlIChpbnZva2UgYC9ldGMvZWtzL2Jvb3RzdHJhcC5zaGApIGFuZCBhc3NvY2lhdGUgaXRcbiAgICogd2l0aCB0aGUgRUtTIGNsdXN0ZXIuXG4gICAqXG4gICAqIElmIHlvdSB3aXNoIHRvIHByb3ZpZGUgYSBjdXN0b20gdXNlciBkYXRhIHNjcmlwdCwgc2V0IHRoaXMgdG8gYGZhbHNlYCBhbmRcbiAgICogbWFudWFsbHkgaW52b2tlIGBhdXRvc2NhbGluZ0dyb3VwLmFkZFVzZXJEYXRhKClgLlxuICAgKlxuICAgKiBAZGVmYXVsdCB0cnVlXG4gICAqL1xuICByZWFkb25seSBib290c3RyYXBFbmFibGVkPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogRUtTIG5vZGUgYm9vdHN0cmFwcGluZyBvcHRpb25zLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIG5vbmVcbiAgICovXG4gIHJlYWRvbmx5IGJvb3RzdHJhcE9wdGlvbnM/OiBCb290c3RyYXBPcHRpb25zO1xuXG4gIC8qKlxuICAgKiBNYWNoaW5lIGltYWdlIHR5cGVcbiAgICpcbiAgICogQGRlZmF1bHQgTWFjaGluZUltYWdlVHlwZS5BTUFaT05fTElOVVhfMlxuICAgKi9cbiAgcmVhZG9ubHkgbWFjaGluZUltYWdlVHlwZT86IE1hY2hpbmVJbWFnZVR5cGU7XG59XG5cbi8qKlxuICogRUtTIG5vZGUgYm9vdHN0cmFwcGluZyBvcHRpb25zLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEJvb3RzdHJhcE9wdGlvbnMge1xuICAvKipcbiAgICogU2V0cyBgLS1tYXgtcG9kc2AgZm9yIHRoZSBrdWJlbGV0IGJhc2VkIG9uIHRoZSBjYXBhY2l0eSBvZiB0aGUgRUMyIGluc3RhbmNlLlxuICAgKlxuICAgKiBAZGVmYXVsdCB0cnVlXG4gICAqL1xuICByZWFkb25seSB1c2VNYXhQb2RzPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogUmVzdG9yZXMgdGhlIGRvY2tlciBkZWZhdWx0IGJyaWRnZSBuZXR3b3JrLlxuICAgKlxuICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgKi9cbiAgcmVhZG9ubHkgZW5hYmxlRG9ja2VyQnJpZGdlPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogTnVtYmVyIG9mIHJldHJ5IGF0dGVtcHRzIGZvciBBV1MgQVBJIGNhbGwgKERlc2NyaWJlQ2x1c3RlcikuXG4gICAqXG4gICAqIEBkZWZhdWx0IDNcbiAgICovXG4gIHJlYWRvbmx5IGF3c0FwaVJldHJ5QXR0ZW1wdHM/OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBjb250ZW50cyBvZiB0aGUgYC9ldGMvZG9ja2VyL2RhZW1vbi5qc29uYCBmaWxlLiBVc2VmdWwgaWYgeW91IHdhbnQgYVxuICAgKiBjdXN0b20gY29uZmlnIGRpZmZlcmluZyBmcm9tIHRoZSBkZWZhdWx0IG9uZSBpbiB0aGUgRUtTIEFNSS5cbiAgICpcbiAgICogQGRlZmF1bHQgLSBub25lXG4gICAqL1xuICByZWFkb25seSBkb2NrZXJDb25maWdKc29uPzogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBPdmVycmlkZXMgdGhlIElQIGFkZHJlc3MgdG8gdXNlIGZvciBETlMgcXVlcmllcyB3aXRoaW4gdGhlXG4gICAqIGNsdXN0ZXIuXG4gICAqXG4gICAqIEBkZWZhdWx0IC0gMTAuMTAwLjAuMTAgb3IgMTcyLjIwLjAuMTAgYmFzZWQgb24gdGhlIElQXG4gICAqIGFkZHJlc3Mgb2YgdGhlIHByaW1hcnkgaW50ZXJmYWNlLlxuICAgKi9cbiAgcmVhZG9ubHkgZG5zQ2x1c3RlcklwPzogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBFeHRyYSBhcmd1bWVudHMgdG8gYWRkIHRvIHRoZSBrdWJlbGV0LiBVc2VmdWwgZm9yIGFkZGluZyBsYWJlbHMgb3IgdGFpbnRzLlxuICAgKlxuICAgKiBGb3IgZXhhbXBsZSwgYC0tbm9kZS1sYWJlbHMgZm9vPWJhcixnb289ZmFyYC5cbiAgICpcbiAgICogQGRlZmF1bHQgLSBub25lXG4gICAqL1xuICByZWFkb25seSBrdWJlbGV0RXh0cmFBcmdzPzogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBBZGRpdGlvbmFsIGNvbW1hbmQgbGluZSBhcmd1bWVudHMgdG8gcGFzcyB0byB0aGUgYC9ldGMvZWtzL2Jvb3RzdHJhcC5zaGBcbiAgICogY29tbWFuZC5cbiAgICpcbiAgICogQHNlZSBodHRwczovL2dpdGh1Yi5jb20vYXdzbGFicy9hbWF6b24tZWtzLWFtaS9ibG9iL21hc3Rlci9maWxlcy9ib290c3RyYXAuc2hcbiAgICogQGRlZmF1bHQgLSBub25lXG4gICAqL1xuICByZWFkb25seSBhZGRpdGlvbmFsQXJncz86IHN0cmluZztcbn1cblxuLyoqXG4gKiBPcHRpb25zIGZvciBhZGRpbmcgYW4gQXV0b1NjYWxpbmdHcm91cCBhcyBjYXBhY2l0eVxuICovXG5leHBvcnQgaW50ZXJmYWNlIEF1dG9TY2FsaW5nR3JvdXBPcHRpb25zIHtcbiAgLyoqXG4gICAqIENvbmZpZ3VyZXMgdGhlIEVDMiB1c2VyLWRhdGEgc2NyaXB0IGZvciBpbnN0YW5jZXMgaW4gdGhpcyBhdXRvc2NhbGluZyBncm91cFxuICAgKiB0byBib290c3RyYXAgdGhlIG5vZGUgKGludm9rZSBgL2V0Yy9la3MvYm9vdHN0cmFwLnNoYCkgYW5kIGFzc29jaWF0ZSBpdFxuICAgKiB3aXRoIHRoZSBFS1MgY2x1c3Rlci5cbiAgICpcbiAgICogSWYgeW91IHdpc2ggdG8gcHJvdmlkZSBhIGN1c3RvbSB1c2VyIGRhdGEgc2NyaXB0LCBzZXQgdGhpcyB0byBgZmFsc2VgIGFuZFxuICAgKiBtYW51YWxseSBpbnZva2UgYGF1dG9zY2FsaW5nR3JvdXAuYWRkVXNlckRhdGEoKWAuXG4gICAqXG4gICAqIEBkZWZhdWx0IHRydWVcbiAgICovXG4gIHJlYWRvbmx5IGJvb3RzdHJhcEVuYWJsZWQ/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBBbGxvd3Mgb3B0aW9ucyBmb3Igbm9kZSBib290c3RyYXBwaW5nIHRocm91Z2ggRUMyIHVzZXIgZGF0YS5cbiAgICogQGRlZmF1bHQgLSBkZWZhdWx0IG9wdGlvbnNcbiAgICovXG4gIHJlYWRvbmx5IGJvb3RzdHJhcE9wdGlvbnM/OiBCb290c3RyYXBPcHRpb25zO1xuXG4gIC8qKlxuICAgKiBBbGxvdyBvcHRpb25zIHRvIHNwZWNpZnkgZGlmZmVyZW50IG1hY2hpbmUgaW1hZ2UgdHlwZVxuICAgKlxuICAgKiBAZGVmYXVsdCBNYWNoaW5lSW1hZ2VUeXBlLkFNQVpPTl9MSU5VWF8yXG4gICAqL1xuICByZWFkb25seSBtYWNoaW5lSW1hZ2VUeXBlPzogTWFjaGluZUltYWdlVHlwZTtcbn1cblxuLyoqXG4gKiBJbXBvcnQgYSBjbHVzdGVyIHRvIHVzZSBpbiBhbm90aGVyIHN0YWNrXG4gKi9cbkBwcm9wZXJ0eUluamVjdGFibGVcbmNsYXNzIEltcG9ydGVkQ2x1c3RlciBleHRlbmRzIENsdXN0ZXJCYXNlIHtcbiAgLyoqIFVuaXF1ZWx5IGlkZW50aWZpZXMgdGhpcyBjbGFzcy4gKi9cbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBQUk9QRVJUWV9JTkpFQ1RJT05fSUQ6IHN0cmluZyA9ICdAYXdzLWNkay5hd3MtZWtzLXYyLWFscGhhLkltcG9ydGVkQ2x1c3Rlcic7XG4gIHB1YmxpYyByZWFkb25seSBjbHVzdGVyTmFtZTogc3RyaW5nO1xuICBwdWJsaWMgcmVhZG9ubHkgY2x1c3RlckFybjogc3RyaW5nO1xuICBwdWJsaWMgcmVhZG9ubHkgY29ubmVjdGlvbnMgPSBuZXcgZWMyLkNvbm5lY3Rpb25zKCk7XG4gIHB1YmxpYyByZWFkb25seSBpcEZhbWlseT86IElwRmFtaWx5O1xuICBwdWJsaWMgcmVhZG9ubHkgcHJ1bmU6IGJvb2xlYW47XG4gIHB1YmxpYyByZWFkb25seSBrdWJlY3RsUHJvdmlkZXI/OiBJS3ViZWN0bFByb3ZpZGVyO1xuXG4gIC8vIHNvIHRoYXQgYGNsdXN0ZXJTZWN1cml0eUdyb3VwYCBvbiBgSUNsdXN0ZXJgIGNhbiBiZSBjb25maWd1cmVkIHdpdGhvdXQgb3B0aW9uYWxpdHksIGF2b2lkaW5nIHVzZXJzIGZyb20gaGF2aW5nXG4gIC8vIHRvIG51bGwgY2hlY2sgb24gYW4gaW5zdGFuY2Ugb2YgYENsdXN0ZXJgLCB3aGljaCB3aWxsIGFsd2F5cyBoYXZlIHRoaXMgY29uZmlndXJlZC5cbiAgcHJpdmF0ZSByZWFkb25seSBfY2x1c3RlclNlY3VyaXR5R3JvdXA/OiBlYzIuSVNlY3VyaXR5R3JvdXA7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJpdmF0ZSByZWFkb25seSBwcm9wczogQ2x1c3RlckF0dHJpYnV0ZXMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuICAgIC8vIEVuaGFuY2VkIENESyBBbmFseXRpY3MgVGVsZW1ldHJ5XG4gICAgYWRkQ29uc3RydWN0TWV0YWRhdGEodGhpcywgcHJvcHMpO1xuXG4gICAgdGhpcy5jbHVzdGVyTmFtZSA9IHByb3BzLmNsdXN0ZXJOYW1lO1xuICAgIHRoaXMuY2x1c3RlckFybiA9IHRoaXMuc3RhY2suZm9ybWF0QXJuKGNsdXN0ZXJBcm5Db21wb25lbnRzKHByb3BzLmNsdXN0ZXJOYW1lKSk7XG4gICAgdGhpcy5pcEZhbWlseSA9IHByb3BzLmlwRmFtaWx5O1xuICAgIHRoaXMua3ViZWN0bFByb3ZpZGVyID0gcHJvcHMua3ViZWN0bFByb3ZpZGVyO1xuICAgIHRoaXMucHJ1bmUgPSBwcm9wcy5wcnVuZSA/PyB0cnVlO1xuXG4gICAgbGV0IGkgPSAxO1xuICAgIGZvciAoY29uc3Qgc2dpZCBvZiBwcm9wcy5zZWN1cml0eUdyb3VwSWRzID8/IFtdKSB7XG4gICAgICB0aGlzLmNvbm5lY3Rpb25zLmFkZFNlY3VyaXR5R3JvdXAoZWMyLlNlY3VyaXR5R3JvdXAuZnJvbVNlY3VyaXR5R3JvdXBJZCh0aGlzLCBgU2VjdXJpdHlHcm91cCR7aX1gLCBzZ2lkKSk7XG4gICAgICBpKys7XG4gICAgfVxuXG4gICAgaWYgKHByb3BzLmNsdXN0ZXJTZWN1cml0eUdyb3VwSWQpIHtcbiAgICAgIHRoaXMuX2NsdXN0ZXJTZWN1cml0eUdyb3VwID0gZWMyLlNlY3VyaXR5R3JvdXAuZnJvbVNlY3VyaXR5R3JvdXBJZCh0aGlzLCAnQ2x1c3RlclNlY3VyaXR5R3JvdXAnLCB0aGlzLmNsdXN0ZXJTZWN1cml0eUdyb3VwSWQpO1xuICAgICAgdGhpcy5jb25uZWN0aW9ucy5hZGRTZWN1cml0eUdyb3VwKHRoaXMuX2NsdXN0ZXJTZWN1cml0eUdyb3VwKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgZ2V0IHZwYygpIHtcbiAgICBpZiAoIXRoaXMucHJvcHMudnBjKSB7XG4gICAgICB0aHJvdyBuZXcgVW5zY29wZWRWYWxpZGF0aW9uRXJyb3IoJ1widnBjXCIgaXMgbm90IGRlZmluZWQgZm9yIHRoaXMgaW1wb3J0ZWQgY2x1c3RlcicpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5wcm9wcy52cGM7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGNsdXN0ZXJTZWN1cml0eUdyb3VwKCk6IGVjMi5JU2VjdXJpdHlHcm91cCB7XG4gICAgaWYgKCF0aGlzLl9jbHVzdGVyU2VjdXJpdHlHcm91cCkge1xuICAgICAgdGhyb3cgbmV3IFVuc2NvcGVkVmFsaWRhdGlvbkVycm9yKCdcImNsdXN0ZXJTZWN1cml0eUdyb3VwXCIgaXMgbm90IGRlZmluZWQgZm9yIHRoaXMgaW1wb3J0ZWQgY2x1c3RlcicpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fY2x1c3RlclNlY3VyaXR5R3JvdXA7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGNsdXN0ZXJTZWN1cml0eUdyb3VwSWQoKTogc3RyaW5nIHtcbiAgICBpZiAoIXRoaXMucHJvcHMuY2x1c3RlclNlY3VyaXR5R3JvdXBJZCkge1xuICAgICAgdGhyb3cgbmV3IFVuc2NvcGVkVmFsaWRhdGlvbkVycm9yKCdcImNsdXN0ZXJTZWN1cml0eUdyb3VwSWRcIiBpcyBub3QgZGVmaW5lZCBmb3IgdGhpcyBpbXBvcnRlZCBjbHVzdGVyJyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnByb3BzLmNsdXN0ZXJTZWN1cml0eUdyb3VwSWQ7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGNsdXN0ZXJFbmRwb2ludCgpOiBzdHJpbmcge1xuICAgIGlmICghdGhpcy5wcm9wcy5jbHVzdGVyRW5kcG9pbnQpIHtcbiAgICAgIHRocm93IG5ldyBVbnNjb3BlZFZhbGlkYXRpb25FcnJvcignXCJjbHVzdGVyRW5kcG9pbnRcIiBpcyBub3QgZGVmaW5lZCBmb3IgdGhpcyBpbXBvcnRlZCBjbHVzdGVyJyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnByb3BzLmNsdXN0ZXJFbmRwb2ludDtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgY2x1c3RlckNlcnRpZmljYXRlQXV0aG9yaXR5RGF0YSgpOiBzdHJpbmcge1xuICAgIGlmICghdGhpcy5wcm9wcy5jbHVzdGVyQ2VydGlmaWNhdGVBdXRob3JpdHlEYXRhKSB7XG4gICAgICB0aHJvdyBuZXcgVW5zY29wZWRWYWxpZGF0aW9uRXJyb3IoJ1wiY2x1c3RlckNlcnRpZmljYXRlQXV0aG9yaXR5RGF0YVwiIGlzIG5vdCBkZWZpbmVkIGZvciB0aGlzIGltcG9ydGVkIGNsdXN0ZXInKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMucHJvcHMuY2x1c3RlckNlcnRpZmljYXRlQXV0aG9yaXR5RGF0YTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgY2x1c3RlckVuY3J5cHRpb25Db25maWdLZXlBcm4oKTogc3RyaW5nIHtcbiAgICBpZiAoIXRoaXMucHJvcHMuY2x1c3RlckVuY3J5cHRpb25Db25maWdLZXlBcm4pIHtcbiAgICAgIHRocm93IG5ldyBVbnNjb3BlZFZhbGlkYXRpb25FcnJvcignXCJjbHVzdGVyRW5jcnlwdGlvbkNvbmZpZ0tleUFyblwiIGlzIG5vdCBkZWZpbmVkIGZvciB0aGlzIGltcG9ydGVkIGNsdXN0ZXInKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMucHJvcHMuY2x1c3RlckVuY3J5cHRpb25Db25maWdLZXlBcm47XG4gIH1cblxuICBwdWJsaWMgZ2V0IG9wZW5JZENvbm5lY3RQcm92aWRlcigpOiBpYW0uSU9wZW5JZENvbm5lY3RQcm92aWRlciB7XG4gICAgaWYgKCF0aGlzLnByb3BzLm9wZW5JZENvbm5lY3RQcm92aWRlcikge1xuICAgICAgdGhyb3cgbmV3IFVuc2NvcGVkVmFsaWRhdGlvbkVycm9yKCdcIm9wZW5JZENvbm5lY3RQcm92aWRlclwiIGlzIG5vdCBkZWZpbmVkIGZvciB0aGlzIGltcG9ydGVkIGNsdXN0ZXInKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMucHJvcHMub3BlbklkQ29ubmVjdFByb3ZpZGVyO1xuICB9XG59XG5cbi8qKlxuICogUHJvcGVydGllcyBmb3IgRWtzT3B0aW1pemVkSW1hZ2VcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBFa3NPcHRpbWl6ZWRJbWFnZVByb3BzIHtcbiAgLyoqXG4gICAqIFdoYXQgaW5zdGFuY2UgdHlwZSB0byByZXRyaWV2ZSB0aGUgaW1hZ2UgZm9yIChzdGFuZGFyZCBvciBHUFUtb3B0aW1pemVkKVxuICAgKlxuICAgKiBAZGVmYXVsdCBOb2RlVHlwZS5TVEFOREFSRFxuICAgKi9cbiAgcmVhZG9ubHkgbm9kZVR5cGU/OiBOb2RlVHlwZTtcblxuICAvKipcbiAgICogV2hhdCBjcHUgYXJjaGl0ZWN0dXJlIHRvIHJldHJpZXZlIHRoZSBpbWFnZSBmb3IgKGFybTY0IG9yIHg4Nl82NClcbiAgICpcbiAgICogQGRlZmF1bHQgQ3B1QXJjaC5YODZfNjRcbiAgICovXG4gIHJlYWRvbmx5IGNwdUFyY2g/OiBDcHVBcmNoO1xuXG4gIC8qKlxuICAgKiBUaGUgS3ViZXJuZXRlcyB2ZXJzaW9uIHRvIHVzZVxuICAgKlxuICAgKiBAZGVmYXVsdCAtIFRoZSBsYXRlc3QgdmVyc2lvblxuICAgKi9cbiAgcmVhZG9ubHkga3ViZXJuZXRlc1ZlcnNpb24/OiBzdHJpbmc7XG59XG5cbi8qKlxuICogQ29uc3RydWN0IGFuIEFtYXpvbiBMaW51eCAyIGltYWdlIGZyb20gdGhlIGxhdGVzdCBFS1MgT3B0aW1pemVkIEFNSSBwdWJsaXNoZWQgaW4gU1NNXG4gKi9cbmV4cG9ydCBjbGFzcyBFa3NPcHRpbWl6ZWRJbWFnZSBpbXBsZW1lbnRzIGVjMi5JTWFjaGluZUltYWdlIHtcbiAgcHJpdmF0ZSByZWFkb25seSBub2RlVHlwZT86IE5vZGVUeXBlO1xuICBwcml2YXRlIHJlYWRvbmx5IGNwdUFyY2g/OiBDcHVBcmNoO1xuICBwcml2YXRlIHJlYWRvbmx5IGt1YmVybmV0ZXNWZXJzaW9uPzogc3RyaW5nO1xuICBwcml2YXRlIHJlYWRvbmx5IGFtaVBhcmFtZXRlck5hbWU6IHN0cmluZztcblxuICAvKipcbiAgICogQ29uc3RydWN0cyBhIG5ldyBpbnN0YW5jZSBvZiB0aGUgRWNzT3B0aW1pemVkQW1pIGNsYXNzLlxuICAgKi9cbiAgcHVibGljIGNvbnN0cnVjdG9yKHByb3BzOiBFa3NPcHRpbWl6ZWRJbWFnZVByb3BzID0ge30pIHtcbiAgICB0aGlzLm5vZGVUeXBlID0gcHJvcHMubm9kZVR5cGUgPz8gTm9kZVR5cGUuU1RBTkRBUkQ7XG4gICAgdGhpcy5jcHVBcmNoID0gcHJvcHMuY3B1QXJjaCA/PyBDcHVBcmNoLlg4Nl82NDtcbiAgICB0aGlzLmt1YmVybmV0ZXNWZXJzaW9uID0gcHJvcHMua3ViZXJuZXRlc1ZlcnNpb24gPz8gTEFURVNUX0tVQkVSTkVURVNfVkVSU0lPTjtcblxuICAgIC8vIHNldCB0aGUgU1NNIHBhcmFtZXRlciBuYW1lXG4gICAgdGhpcy5hbWlQYXJhbWV0ZXJOYW1lID0gYC9hd3Mvc2VydmljZS9la3Mvb3B0aW1pemVkLWFtaS8ke3RoaXMua3ViZXJuZXRlc1ZlcnNpb259L2BcbiAgICAgICsgKHRoaXMubm9kZVR5cGUgPT09IE5vZGVUeXBlLlNUQU5EQVJEID8gdGhpcy5jcHVBcmNoID09PSBDcHVBcmNoLlg4Nl82NCA/XG4gICAgICAgICdhbWF6b24tbGludXgtMi8nIDogJ2FtYXpvbi1saW51eC0yLWFybTY0LycgOiAnJylcbiAgICAgICsgKHRoaXMubm9kZVR5cGUgPT09IE5vZGVUeXBlLkdQVSA/ICdhbWF6b24tbGludXgtMi1ncHUvJyA6ICcnKVxuICAgICAgKyAodGhpcy5ub2RlVHlwZSA9PT0gTm9kZVR5cGUuSU5GRVJFTlRJQSA/ICdhbWF6b24tbGludXgtMi1ncHUvJyA6ICcnKVxuICAgICAgKyAodGhpcy5ub2RlVHlwZSA9PT0gTm9kZVR5cGUuVFJBSU5JVU0gPyAnYW1hem9uLWxpbnV4LTItZ3B1LycgOiAnJylcbiAgICAgICsgJ3JlY29tbWVuZGVkL2ltYWdlX2lkJztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIGNvcnJlY3QgaW1hZ2VcbiAgICovXG4gIHB1YmxpYyBnZXRJbWFnZShzY29wZTogQ29uc3RydWN0KTogZWMyLk1hY2hpbmVJbWFnZUNvbmZpZyB7XG4gICAgY29uc3QgYW1pID0gc3NtLlN0cmluZ1BhcmFtZXRlci52YWx1ZUZvclN0cmluZ1BhcmFtZXRlcihzY29wZSwgdGhpcy5hbWlQYXJhbWV0ZXJOYW1lKTtcbiAgICByZXR1cm4ge1xuICAgICAgaW1hZ2VJZDogYW1pLFxuICAgICAgb3NUeXBlOiBlYzIuT3BlcmF0aW5nU3lzdGVtVHlwZS5MSU5VWCxcbiAgICAgIHVzZXJEYXRhOiBlYzIuVXNlckRhdGEuZm9yTGludXgoKSxcbiAgICB9O1xuICB9XG59XG5cbi8vIE1BSU5UQUlORVJTOiB1c2UgLi9zY3JpcHRzL2t1YmVfYnVtcC5zaCB0byB1cGRhdGUgTEFURVNUX0tVQkVSTkVURVNfVkVSU0lPTlxuY29uc3QgTEFURVNUX0tVQkVSTkVURVNfVkVSU0lPTiA9ICcxLjI0JztcblxuLyoqXG4gKiBXaGV0aGVyIHRoZSB3b3JrZXIgbm9kZXMgc2hvdWxkIHN1cHBvcnQgR1BVIG9yIGp1c3Qgc3RhbmRhcmQgaW5zdGFuY2VzXG4gKi9cbmV4cG9ydCBlbnVtIE5vZGVUeXBlIHtcbiAgLyoqXG4gICAqIFN0YW5kYXJkIGluc3RhbmNlc1xuICAgKi9cbiAgU1RBTkRBUkQgPSAnU3RhbmRhcmQnLFxuXG4gIC8qKlxuICAgKiBHUFUgaW5zdGFuY2VzXG4gICAqL1xuICBHUFUgPSAnR1BVJyxcblxuICAvKipcbiAgICogSW5mZXJlbnRpYSBpbnN0YW5jZXNcbiAgICovXG4gIElORkVSRU5USUEgPSAnSU5GRVJFTlRJQScsXG5cbiAgLyoqXG4gICAqIFRyYWluaXVtIGluc3RhbmNlc1xuICAgKi9cbiAgVFJBSU5JVU0gPSAnVFJBSU5JVU0nLFxufVxuXG4vKipcbiAqIENQVSBhcmNoaXRlY3R1cmVcbiAqL1xuZXhwb3J0IGVudW0gQ3B1QXJjaCB7XG4gIC8qKlxuICAgKiBhcm02NCBDUFUgdHlwZVxuICAgKi9cbiAgQVJNXzY0ID0gJ2FybTY0JyxcblxuICAvKipcbiAgICogeDg2XzY0IENQVSB0eXBlXG4gICAqL1xuICBYODZfNjQgPSAneDg2XzY0Jyxcbn1cblxuLyoqXG4gKiBUaGUgdHlwZSBvZiBjb21wdXRlIHJlc291cmNlcyB0byB1c2UgZm9yIENvcmVETlMuXG4gKi9cbmV4cG9ydCBlbnVtIENvcmVEbnNDb21wdXRlVHlwZSB7XG4gIC8qKlxuICAgKiBEZXBsb3kgQ29yZUROUyBvbiBFQzIgaW5zdGFuY2VzLlxuICAgKi9cbiAgRUMyID0gJ2VjMicsXG5cbiAgLyoqXG4gICAqIERlcGxveSBDb3JlRE5TIG9uIEZhcmdhdGUtbWFuYWdlZCBpbnN0YW5jZXMuXG4gICAqL1xuICBGQVJHQVRFID0gJ2ZhcmdhdGUnLFxufVxuXG4vKipcbiAqIFRoZSBkZWZhdWx0IGNhcGFjaXR5IHR5cGUgZm9yIHRoZSBjbHVzdGVyXG4gKi9cbmV4cG9ydCBlbnVtIERlZmF1bHRDYXBhY2l0eVR5cGUge1xuICAvKipcbiAgICogbWFuYWdlZCBub2RlIGdyb3VwXG4gICAqL1xuICBOT0RFR1JPVVAsXG4gIC8qKlxuICAgKiBFQzIgYXV0b3NjYWxpbmcgZ3JvdXBcbiAgICovXG4gIEVDMixcbiAgLyoqXG4gICAqIEF1dG8gTW9kZVxuICAgKi9cbiAgQVVUT01PREUsXG59XG5cbi8qKlxuICogVGhlIG1hY2hpbmUgaW1hZ2UgdHlwZVxuICovXG5leHBvcnQgZW51bSBNYWNoaW5lSW1hZ2VUeXBlIHtcbiAgLyoqXG4gICAqIEFtYXpvbiBFS1Mtb3B0aW1pemVkIExpbnV4IEFNSVxuICAgKi9cbiAgQU1BWk9OX0xJTlVYXzIsXG4gIC8qKlxuICAgKiBCb3R0bGVyb2NrZXQgQU1JXG4gICAqL1xuICBCT1RUTEVST0NLRVQsXG59XG5cbmZ1bmN0aW9uIG5vZGVUeXBlRm9ySW5zdGFuY2VUeXBlKGluc3RhbmNlVHlwZTogZWMyLkluc3RhbmNlVHlwZSkge1xuICBpZiAoSU5TVEFOQ0VfVFlQRVMuZ3B1LmluY2x1ZGVzKGluc3RhbmNlVHlwZS50b1N0cmluZygpLnN1YnN0cmluZygwLCAyKSkpIHtcbiAgICByZXR1cm4gTm9kZVR5cGUuR1BVO1xuICB9IGVsc2UgaWYgKElOU1RBTkNFX1RZUEVTLmluZmVyZW50aWEuaW5jbHVkZXMoaW5zdGFuY2VUeXBlLnRvU3RyaW5nKCkuc3Vic3RyaW5nKDAsIDQpKSkge1xuICAgIHJldHVybiBOb2RlVHlwZS5JTkZFUkVOVElBO1xuICB9IGVsc2UgaWYgKElOU1RBTkNFX1RZUEVTLnRyYWluaXVtLmluY2x1ZGVzKGluc3RhbmNlVHlwZS50b1N0cmluZygpLnN1YnN0cmluZygwLCA0KSkpIHtcbiAgICByZXR1cm4gTm9kZVR5cGUuVFJBSU5JVU07XG4gIH1cbiAgcmV0dXJuIE5vZGVUeXBlLlNUQU5EQVJEO1xufVxuXG5mdW5jdGlvbiBjcHVBcmNoRm9ySW5zdGFuY2VUeXBlKGluc3RhbmNlVHlwZTogZWMyLkluc3RhbmNlVHlwZSkge1xuICByZXR1cm4gSU5TVEFOQ0VfVFlQRVMuZ3Jhdml0b24yLmluY2x1ZGVzKGluc3RhbmNlVHlwZS50b1N0cmluZygpLnN1YnN0cmluZygwLCAzKSkgPyBDcHVBcmNoLkFSTV82NCA6XG4gICAgSU5TVEFOQ0VfVFlQRVMuZ3Jhdml0b24zLmluY2x1ZGVzKGluc3RhbmNlVHlwZS50b1N0cmluZygpLnN1YnN0cmluZygwLCAzKSkgPyBDcHVBcmNoLkFSTV82NCA6XG4gICAgICBJTlNUQU5DRV9UWVBFUy5ncmF2aXRvbi5pbmNsdWRlcyhpbnN0YW5jZVR5cGUudG9TdHJpbmcoKS5zdWJzdHJpbmcoMCwgMikpID8gQ3B1QXJjaC5BUk1fNjQgOlxuICAgICAgICBDcHVBcmNoLlg4Nl82NDtcbn1cblxuZnVuY3Rpb24gZmxhdHRlbjxBPih4c3M6IEFbXVtdKTogQVtdIHtcbiAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5jb25jYXQuY2FsbChbXSwgLi4ueHNzKTtcbn1cblxuZnVuY3Rpb24gY2x1c3RlckFybkNvbXBvbmVudHMoY2x1c3Rlck5hbWU6IHN0cmluZyk6IEFybkNvbXBvbmVudHMge1xuICByZXR1cm4ge1xuICAgIHNlcnZpY2U6ICdla3MnLFxuICAgIHJlc291cmNlOiAnY2x1c3RlcicsXG4gICAgcmVzb3VyY2VOYW1lOiBjbHVzdGVyTmFtZSxcbiAgfTtcbn1cbiJdfQ==