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
exports.Nodegroup = exports.TaintEffect = exports.CapacityType = exports.NodegroupAmiType = void 0;
const jsiiDeprecationWarnings = require("../.warnings.jsii.js");
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
const aws_ec2_1 = require("aws-cdk-lib/aws-ec2");
const aws_eks_1 = require("aws-cdk-lib/aws-eks");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const core_1 = require("aws-cdk-lib/core");
const helpers_internal_1 = require("aws-cdk-lib/core/lib/helpers-internal");
const metadata_resource_1 = require("aws-cdk-lib/core/lib/metadata-resource");
const prop_injectable_1 = require("aws-cdk-lib/core/lib/prop-injectable");
const cxapi = require("aws-cdk-lib/cx-api");
const constructs_1 = require("constructs");
const cluster_1 = require("./cluster");
const nodegroup_1 = require("./private/nodegroup");
/**
 * The AMI type for your node group.
 *
 * GPU instance types should use the `AL2_x86_64_GPU` AMI type, which uses the
 * Amazon EKS-optimized Linux AMI with GPU support or the `BOTTLEROCKET_ARM_64_NVIDIA` or `BOTTLEROCKET_X86_64_NVIDIA`
 * AMI types, which uses the Amazon EKS-optimized Linux AMI with Nvidia-GPU support.
 *
 * Non-GPU instances should use the `AL2_x86_64` AMI type, which uses the Amazon EKS-optimized Linux AMI.
 */
var NodegroupAmiType;
(function (NodegroupAmiType) {
    /**
     * Amazon Linux 2 (x86-64)
     */
    NodegroupAmiType["AL2_X86_64"] = "AL2_x86_64";
    /**
     * Amazon Linux 2 with GPU support
     */
    NodegroupAmiType["AL2_X86_64_GPU"] = "AL2_x86_64_GPU";
    /**
     * Amazon Linux 2 (ARM-64)
     */
    NodegroupAmiType["AL2_ARM_64"] = "AL2_ARM_64";
    /**
     *  Bottlerocket Linux (ARM-64)
     */
    NodegroupAmiType["BOTTLEROCKET_ARM_64"] = "BOTTLEROCKET_ARM_64";
    /**
     * Bottlerocket (x86-64)
     */
    NodegroupAmiType["BOTTLEROCKET_X86_64"] = "BOTTLEROCKET_x86_64";
    /**
     *  Bottlerocket Linux with Nvidia-GPU support (ARM-64)
     */
    NodegroupAmiType["BOTTLEROCKET_ARM_64_NVIDIA"] = "BOTTLEROCKET_ARM_64_NVIDIA";
    /**
     * Bottlerocket with Nvidia-GPU support (x86-64)
     */
    NodegroupAmiType["BOTTLEROCKET_X86_64_NVIDIA"] = "BOTTLEROCKET_x86_64_NVIDIA";
    /**
     * Bottlerocket Linux (ARM-64) with FIPS enabled
     */
    NodegroupAmiType["BOTTLEROCKET_ARM_64_FIPS"] = "BOTTLEROCKET_ARM_64_FIPS";
    /**
     * Bottlerocket (x86-64) with FIPS enabled
     */
    NodegroupAmiType["BOTTLEROCKET_X86_64_FIPS"] = "BOTTLEROCKET_x86_64_FIPS";
    /**
     * Windows Core 2019 (x86-64)
     */
    NodegroupAmiType["WINDOWS_CORE_2019_X86_64"] = "WINDOWS_CORE_2019_x86_64";
    /**
     * Windows Core 2022 (x86-64)
     */
    NodegroupAmiType["WINDOWS_CORE_2022_X86_64"] = "WINDOWS_CORE_2022_x86_64";
    /**
     * Windows Full 2019 (x86-64)
     */
    NodegroupAmiType["WINDOWS_FULL_2019_X86_64"] = "WINDOWS_FULL_2019_x86_64";
    /**
     * Windows Full 2022 (x86-64)
     */
    NodegroupAmiType["WINDOWS_FULL_2022_X86_64"] = "WINDOWS_FULL_2022_x86_64";
    /**
     * Amazon Linux 2023 (x86-64)
     */
    NodegroupAmiType["AL2023_X86_64_STANDARD"] = "AL2023_x86_64_STANDARD";
    /**
     * Amazon Linux 2023 with AWS Neuron drivers (x86-64)
     */
    NodegroupAmiType["AL2023_X86_64_NEURON"] = "AL2023_x86_64_NEURON";
    /**
     * Amazon Linux 2023 with NVIDIA drivers (x86-64)
     */
    NodegroupAmiType["AL2023_X86_64_NVIDIA"] = "AL2023_x86_64_NVIDIA";
    /**
     * Amazon Linux 2023 with NVIDIA drivers (ARM-64)
     */
    NodegroupAmiType["AL2023_ARM_64_NVIDIA"] = "AL2023_ARM_64_NVIDIA";
    /**
     * Amazon Linux 2023 (ARM-64)
     */
    NodegroupAmiType["AL2023_ARM_64_STANDARD"] = "AL2023_ARM_64_STANDARD";
})(NodegroupAmiType || (exports.NodegroupAmiType = NodegroupAmiType = {}));
/**
 * Capacity type of the managed node group
 */
var CapacityType;
(function (CapacityType) {
    /**
     * spot instances
     */
    CapacityType["SPOT"] = "SPOT";
    /**
     * on-demand instances
     */
    CapacityType["ON_DEMAND"] = "ON_DEMAND";
    /**
     * capacity block instances
     */
    CapacityType["CAPACITY_BLOCK"] = "CAPACITY_BLOCK";
})(CapacityType || (exports.CapacityType = CapacityType = {}));
/**
 * Effect types of kubernetes node taint.
 *
 * Note: These values are specifically for AWS EKS NodeGroups and use the AWS API format.
 * When using AWS CLI or API, taint effects must be NO_SCHEDULE, PREFER_NO_SCHEDULE, or NO_EXECUTE.
 * When using Kubernetes directly or kubectl, taint effects must be NoSchedule, PreferNoSchedule, or NoExecute.
 *
 * For Kubernetes manifests (like Karpenter NodePools), use string literals with PascalCase format:
 * - 'NoSchedule' instead of TaintEffect.NO_SCHEDULE
 * - 'PreferNoSchedule' instead of TaintEffect.PREFER_NO_SCHEDULE
 * - 'NoExecute' instead of TaintEffect.NO_EXECUTE
 *
 * @see https://docs.aws.amazon.com/eks/latest/userguide/node-taints-managed-node-groups.html
 */
var TaintEffect;
(function (TaintEffect) {
    /**
     * NoSchedule
     */
    TaintEffect["NO_SCHEDULE"] = "NO_SCHEDULE";
    /**
     * PreferNoSchedule
     */
    TaintEffect["PREFER_NO_SCHEDULE"] = "PREFER_NO_SCHEDULE";
    /**
     * NoExecute
     */
    TaintEffect["NO_EXECUTE"] = "NO_EXECUTE";
})(TaintEffect || (exports.TaintEffect = TaintEffect = {}));
/**
 * The Nodegroup resource class
 * @resource AWS::EKS::Nodegroup
 */
let Nodegroup = (() => {
    let _classDecorators = [prop_injectable_1.propertyInjectable];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = core_1.Resource;
    let _instanceExtraInitializers = [];
    let _get_nodegroupArn_decorators;
    let _get_nodegroupName_decorators;
    var Nodegroup = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _get_nodegroupArn_decorators = [helpers_internal_1.memoizedGetter];
            _get_nodegroupName_decorators = [helpers_internal_1.memoizedGetter];
            __esDecorate(this, null, _get_nodegroupArn_decorators, { kind: "getter", name: "nodegroupArn", static: false, private: false, access: { has: obj => "nodegroupArn" in obj, get: obj => obj.nodegroupArn }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _get_nodegroupName_decorators, { kind: "getter", name: "nodegroupName", static: false, private: false, access: { has: obj => "nodegroupName" in obj, get: obj => obj.nodegroupName }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            Nodegroup = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        static [JSII_RTTI_SYMBOL_1] = { fqn: "@aws-cdk/aws-eks-v2-alpha.Nodegroup", version: "0.0.0" };
        /** Uniquely identifies this class. */
        static PROPERTY_INJECTION_ID = '@aws-cdk.aws-eks-v2-alpha.Nodegroup';
        /**
         * Import the Nodegroup from attributes
         */
        static fromNodegroupName(scope, id, nodegroupName) {
            class Import extends core_1.Resource {
                nodegroupName = nodegroupName;
            }
            return new Import(scope, id);
        }
        /**
         * the Amazon EKS cluster resource
         *
         * @attribute ClusterName
         */
        cluster = __runInitializers(this, _instanceExtraInitializers);
        /**
         * IAM role of the instance profile for the nodegroup
         */
        role;
        resource;
        desiredSize;
        maxSize;
        minSize;
        constructor(scope, id, props) {
            super(scope, id, {
                physicalName: props.nodegroupName,
            });
            try {
                jsiiDeprecationWarnings._aws_cdk_aws_eks_v2_alpha_NodegroupProps(props);
            }
            catch (error) {
                if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                    Error.captureStackTrace(error, Nodegroup);
                }
                throw error;
            }
            // Enhanced CDK Analytics Telemetry
            (0, metadata_resource_1.addConstructMetadata)(this, props);
            this.cluster = props.cluster;
            this.desiredSize = props.desiredSize ?? props.minSize ?? 2;
            this.maxSize = props.maxSize ?? this.desiredSize;
            this.minSize = props.minSize ?? 1;
            (0, core_1.withResolved)(this.desiredSize, this.maxSize, (desired, max) => {
                if (desired === undefined) {
                    return;
                }
                if (desired > max) {
                    throw new Error(`Desired capacity ${desired} can't be greater than max size ${max}`);
                }
            });
            (0, core_1.withResolved)(this.desiredSize, this.minSize, (desired, min) => {
                if (desired === undefined) {
                    return;
                }
                if (desired < min) {
                    throw new Error(`Minimum capacity ${min} can't be greater than desired size ${desired}`);
                }
            });
            if (props.launchTemplateSpec && props.diskSize) {
                // see - https://docs.aws.amazon.com/eks/latest/userguide/launch-templates.html
                // and https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-eks-nodegroup.html#cfn-eks-nodegroup-disksize
                throw new Error('diskSize must be specified within the launch template');
            }
            if (props.instanceType && props.instanceTypes) {
                throw new Error('"instanceType is deprecated, please use "instanceTypes" only.');
            }
            if (props.instanceType) {
                core_1.Annotations.of(this).addWarningV2('@aws-cdk/aws-eks:managedNodeGroupDeprecatedInstanceType', '"instanceType" is deprecated and will be removed in the next major version. please use "instanceTypes" instead');
            }
            const instanceTypes = props.instanceTypes ?? (props.instanceType ? [props.instanceType] : undefined);
            let possibleAmiTypes = [];
            if (instanceTypes && instanceTypes.length > 0) {
                /**
                 * if the user explicitly configured instance types, we can't caculate the expected ami type as we support
                 * Amazon Linux 2, Bottlerocket, and Windows now. However we can check:
                 *
                 * 1. instance types of different CPU architectures are not mixed(e.g. X86 with ARM).
                 * 2. user-specified amiType should be included in `possibleAmiTypes`.
                 */
                possibleAmiTypes = getPossibleAmiTypes(instanceTypes);
                // if the user explicitly configured an ami type, make sure it's included in the possibleAmiTypes
                if (props.amiType && !possibleAmiTypes.includes(props.amiType)) {
                    throw new Error(`The specified AMI does not match the instance types architecture, either specify one of ${possibleAmiTypes.join(', ').toUpperCase()} or don't specify any`);
                }
                // if the user explicitly configured a Windows ami type, make sure the instanceType is allowed
                if (props.amiType && windowsAmiTypes.includes(props.amiType) &&
                    instanceTypes.filter(isWindowsSupportedInstanceType).length < instanceTypes.length) {
                    throw new Error('The specified instanceType does not support Windows workloads. '
                        + 'Amazon EC2 instance types C3, C4, D2, I2, M4 (excluding m4.16xlarge), M6a.x, and '
                        + 'R3 instances aren\'t supported for Windows workloads.');
                }
            }
            if (!props.nodeRole) {
                const ngRole = new aws_iam_1.Role(this, 'NodeGroupRole', {
                    assumedBy: new aws_iam_1.ServicePrincipal('ec2.amazonaws.com'),
                });
                ngRole.addManagedPolicy(aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSWorkerNodePolicy'));
                ngRole.addManagedPolicy(aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKS_CNI_Policy'));
                ngRole.addManagedPolicy(aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'));
                // Grant additional IPv6 networking permissions if running in IPv6
                // https://docs.aws.amazon.com/eks/latest/userguide/cni-iam-role.html
                if (props.cluster.ipFamily == cluster_1.IpFamily.IP_V6) {
                    ngRole.addToPrincipalPolicy(new aws_iam_1.PolicyStatement({
                        // eslint-disable-next-line @cdklabs/no-literal-partition
                        resources: ['arn:aws:ec2:*:*:network-interface/*'],
                        actions: [
                            'ec2:AssignIpv6Addresses',
                            'ec2:UnassignIpv6Addresses',
                        ],
                    }));
                }
                this.role = ngRole;
            }
            else {
                this.role = props.nodeRole;
            }
            this.validateUpdateConfig(props.maxUnavailable, props.maxUnavailablePercentage);
            this.resource = new aws_eks_1.CfnNodegroup(this, 'Resource', {
                clusterName: this.cluster.clusterName,
                nodegroupName: props.nodegroupName,
                nodeRole: this.role.roleArn,
                subnets: this.cluster.vpc.selectSubnets(props.subnets).subnetIds,
                /**
                 * Case 1: If launchTemplate is explicitly specified with custom AMI, we cannot specify amiType, or the node group deployment will fail.
                 * As we don't know if the custom AMI is specified in the lauchTemplate, we just use props.amiType.
                 *
                 * Case 2: If launchTemplate is not specified, we try to determine amiType from the instanceTypes and it could be either AL2 or Bottlerocket.
                 * To avoid breaking changes, we use possibleAmiTypes[0] if amiType is undefined and make sure AL2 is always the first element in possibleAmiTypes
                 * as AL2 is previously the `expectedAmi` and this avoids breaking changes.
                 *
                 * That being said, users now either have to explicitly specify correct amiType or just leave it undefined.
                 */
                amiType: props.launchTemplateSpec ? props.amiType : (props.amiType ?? possibleAmiTypes[0]),
                capacityType: props.capacityType ? props.capacityType.valueOf() : undefined,
                diskSize: props.diskSize,
                forceUpdateEnabled: props.forceUpdate ?? true,
                // note that we don't check if a launch template is configured here (even though it might configure instance types as well)
                // because this doesn't have a default value, meaning the user had to explicitly configure this.
                instanceTypes: instanceTypes?.map(t => t.toString()),
                labels: props.labels,
                taints: props.taints,
                launchTemplate: props.launchTemplateSpec,
                releaseVersion: props.releaseVersion,
                remoteAccess: props.remoteAccess ? {
                    ec2SshKey: props.remoteAccess.sshKeyName,
                    sourceSecurityGroups: props.remoteAccess.sourceSecurityGroups ?
                        props.remoteAccess.sourceSecurityGroups.map(m => m.securityGroupId) : undefined,
                } : undefined,
                scalingConfig: {
                    desiredSize: this.desiredSize,
                    maxSize: this.maxSize,
                    minSize: this.minSize,
                },
                tags: props.tags,
                updateConfig: props.maxUnavailable || props.maxUnavailablePercentage ? {
                    maxUnavailable: props.maxUnavailable,
                    maxUnavailablePercentage: props.maxUnavailablePercentage,
                } : undefined,
                nodeRepairConfig: props.enableNodeAutoRepair ? {
                    enabled: props.enableNodeAutoRepair,
                } : undefined,
            });
            if (this.cluster instanceof cluster_1.Cluster) {
                // the controller runs on the worker nodes so they cannot
                // be deleted before the controller.
                if (this.cluster.albController) {
                    constructs_1.Node.of(this.cluster.albController).addDependency(this);
                }
            }
        }
        /**
         * ARN of the nodegroup
         *
         * @attribute
         */
        get nodegroupArn() {
            return this.getResourceArnAttribute(this.resource.attrArn, {
                service: 'eks',
                resource: 'nodegroup',
                resourceName: this.physicalName,
            });
        }
        /**
         * Nodegroup name
         *
         * @attribute
         */
        get nodegroupName() {
            if (core_1.FeatureFlags.of(this).isEnabled(cxapi.EKS_NODEGROUP_NAME)) {
                return this.getResourceNameAttribute(this.resource.attrNodegroupName);
            }
            else {
                return this.getResourceNameAttribute(this.resource.ref);
            }
        }
        validateUpdateConfig(maxUnavailable, maxUnavailablePercentage) {
            if (!maxUnavailable && !maxUnavailablePercentage)
                return;
            if (maxUnavailable && maxUnavailablePercentage) {
                throw new Error('maxUnavailable and maxUnavailablePercentage are not allowed to be defined together');
            }
            if (maxUnavailablePercentage && (maxUnavailablePercentage < 1 || maxUnavailablePercentage > 100)) {
                throw new Error(`maxUnavailablePercentage must be between 1 and 100, got ${maxUnavailablePercentage}`);
            }
            if (maxUnavailable) {
                if (maxUnavailable > this.maxSize) {
                    throw new Error(`maxUnavailable must be lower than maxSize (${this.maxSize}), got ${maxUnavailable}`);
                }
                if (maxUnavailable < 1 || maxUnavailable > 100) {
                    throw new Error(`maxUnavailable must be between 1 and 100, got ${maxUnavailable}`);
                }
            }
        }
        static {
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return Nodegroup = _classThis;
})();
exports.Nodegroup = Nodegroup;
/**
 * AMI types of different architectures. Make sure AL2 is always the first element, which will be the default
 * AmiType if amiType and launchTemplateSpec are both undefined.
 */
const arm64AmiTypes = [
    NodegroupAmiType.AL2_ARM_64,
    NodegroupAmiType.AL2023_ARM_64_STANDARD,
    NodegroupAmiType.BOTTLEROCKET_ARM_64,
];
const x8664AmiTypes = [
    NodegroupAmiType.AL2_X86_64,
    NodegroupAmiType.AL2023_X86_64_STANDARD,
    NodegroupAmiType.BOTTLEROCKET_X86_64,
    NodegroupAmiType.WINDOWS_CORE_2019_X86_64,
    NodegroupAmiType.WINDOWS_CORE_2022_X86_64,
    NodegroupAmiType.WINDOWS_FULL_2019_X86_64,
    NodegroupAmiType.WINDOWS_FULL_2022_X86_64,
];
const windowsAmiTypes = [
    NodegroupAmiType.WINDOWS_CORE_2019_X86_64,
    NodegroupAmiType.WINDOWS_CORE_2022_X86_64,
    NodegroupAmiType.WINDOWS_FULL_2019_X86_64,
    NodegroupAmiType.WINDOWS_FULL_2022_X86_64,
];
const gpuAmiTypes = [
    NodegroupAmiType.AL2_X86_64_GPU,
    NodegroupAmiType.AL2023_X86_64_NEURON,
    NodegroupAmiType.AL2023_X86_64_NVIDIA,
    NodegroupAmiType.AL2023_ARM_64_NVIDIA,
    NodegroupAmiType.BOTTLEROCKET_X86_64_NVIDIA,
    NodegroupAmiType.BOTTLEROCKET_ARM_64_NVIDIA,
];
/**
 * This function check if the instanceType is supported by Windows AMI.
 * https://docs.aws.amazon.com/eks/latest/userguide/windows-support.html
 * @param instanceType The EC2 instance type
 */
function isWindowsSupportedInstanceType(instanceType) {
    // compare instanceType to forbidden InstanceTypes for Windows. Add exception for m6a.16xlarge.
    // NOTE: i2 instance class is not present in the InstanceClass enum.
    const forbiddenInstanceClasses = [aws_ec2_1.InstanceClass.C3, aws_ec2_1.InstanceClass.C4, aws_ec2_1.InstanceClass.D2, aws_ec2_1.InstanceClass.M4,
        aws_ec2_1.InstanceClass.M6A, aws_ec2_1.InstanceClass.R3];
    return instanceType.toString() === aws_ec2_1.InstanceType.of(aws_ec2_1.InstanceClass.M4, aws_ec2_1.InstanceSize.XLARGE16).toString() ||
        forbiddenInstanceClasses.every((c) => !instanceType.sameInstanceClassAs(aws_ec2_1.InstanceType.of(c, aws_ec2_1.InstanceSize.LARGE)) && !instanceType.toString().match(/^i2/));
}
/**
 * This function examines the CPU architecture of every instance type and determines
 * what AMI types are compatible for all of them. it either throws or produces an array of possible AMI types because
 * instance types of different CPU architectures are not supported.
 * @param instanceTypes The instance types
 * @returns NodegroupAmiType[]
 */
function getPossibleAmiTypes(instanceTypes) {
    function typeToArch(instanceType) {
        return (0, nodegroup_1.isGpuInstanceType)(instanceType) ? 'GPU' : instanceType.architecture;
    }
    const archAmiMap = new Map([
        [aws_ec2_1.InstanceArchitecture.ARM_64, arm64AmiTypes],
        [aws_ec2_1.InstanceArchitecture.X86_64, x8664AmiTypes],
        ['GPU', gpuAmiTypes],
    ]);
    const architectures = new Set(instanceTypes.map(typeToArch));
    if (architectures.size === 0) { // protective code, the current implementation will never result in this.
        throw new Error(`Cannot determine any ami type compatible with instance types: ${instanceTypes.map(i => i.toString()).join(', ')}`);
    }
    if (architectures.size > 1) {
        throw new Error('instanceTypes of different architectures is not allowed');
    }
    return archAmiMap.get(Array.from(architectures)[0]);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFuYWdlZC1ub2RlZ3JvdXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtYW5hZ2VkLW5vZGVncm91cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBdUk7QUFDdkksaURBQW1EO0FBQ25ELGlEQUFvRztBQUNwRywyQ0FBZ0c7QUFDaEcsNEVBQXVFO0FBQ3ZFLDhFQUE4RTtBQUM5RSwwRUFBMEU7QUFDMUUsNENBQTRDO0FBQzVDLDJDQUE2QztBQUM3Qyx1Q0FBd0Q7QUFDeEQsbURBQXdEO0FBYXhEOzs7Ozs7OztHQVFHO0FBQ0gsSUFBWSxnQkF5RVg7QUF6RUQsV0FBWSxnQkFBZ0I7SUFDMUI7O09BRUc7SUFDSCw2Q0FBeUIsQ0FBQTtJQUN6Qjs7T0FFRztJQUNILHFEQUFpQyxDQUFBO0lBQ2pDOztPQUVHO0lBQ0gsNkNBQXlCLENBQUE7SUFDekI7O09BRUc7SUFDSCwrREFBMkMsQ0FBQTtJQUMzQzs7T0FFRztJQUNILCtEQUEyQyxDQUFBO0lBQzNDOztPQUVHO0lBQ0gsNkVBQXlELENBQUE7SUFDekQ7O09BRUc7SUFDSCw2RUFBeUQsQ0FBQTtJQUN6RDs7T0FFRztJQUNILHlFQUFxRCxDQUFBO0lBQ3JEOztPQUVHO0lBQ0gseUVBQXFELENBQUE7SUFDckQ7O09BRUc7SUFDSCx5RUFBcUQsQ0FBQTtJQUNyRDs7T0FFRztJQUNILHlFQUFxRCxDQUFBO0lBQ3JEOztPQUVHO0lBQ0gseUVBQXFELENBQUE7SUFDckQ7O09BRUc7SUFDSCx5RUFBcUQsQ0FBQTtJQUNyRDs7T0FFRztJQUNILHFFQUFpRCxDQUFBO0lBQ2pEOztPQUVHO0lBQ0gsaUVBQTZDLENBQUE7SUFDN0M7O09BRUc7SUFDSCxpRUFBNkMsQ0FBQTtJQUM3Qzs7T0FFRztJQUNILGlFQUE2QyxDQUFBO0lBQzdDOztPQUVHO0lBQ0gscUVBQWlELENBQUE7QUFDbkQsQ0FBQyxFQXpFVyxnQkFBZ0IsZ0NB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QyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQztJQUM3RSxDQUFDO0lBQ0QsTUFBTSxVQUFVLEdBQUcsSUFBSSxHQUFHLENBQXNDO1FBQzlELENBQUMsOEJBQW9CLENBQUMsTUFBTSxFQUFFLGFBQWEsQ0FBQztRQUM1QyxDQUFDLDhCQUFvQixDQUFDLE1BQU0sRUFBRSxhQUFhLENBQUM7UUFDNUMsQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDO0tBQ3JCLENBQUMsQ0FBQztJQUNILE1BQU0sYUFBYSxHQUF5QixJQUFJLEdBQUcsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFFbkYsSUFBSSxhQUFhLENBQUMsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMseUVBQXlFO1FBQ3ZHLE1BQU0sSUFBSSxLQUFLLENBQUMsaUVBQWlFLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3RJLENBQUM7SUFFRCxJQUFJLGFBQWEsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDM0IsTUFBTSxJQUFJLEtBQUssQ0FBQyx5REFBeUQsQ0FBQyxDQUFDO0lBQzdFLENBQUM7SUFFRCxPQUFPLFVBQVUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDO0FBQ3ZELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbnN0YW5jZVR5cGUsIElTZWN1cml0eUdyb3VwLCBTdWJuZXRTZWxlY3Rpb24sIEluc3RhbmNlQXJjaGl0ZWN0dXJlLCBJbnN0YW5jZUNsYXNzLCBJbnN0YW5jZVNpemUgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWMyJztcbmltcG9ydCB7IENmbk5vZGVncm91cCB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1la3MnO1xuaW1wb3J0IHsgSVJvbGUsIE1hbmFnZWRQb2xpY3ksIFBvbGljeVN0YXRlbWVudCwgUm9sZSwgU2VydmljZVByaW5jaXBhbCB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0IHsgSVJlc291cmNlLCBSZXNvdXJjZSwgQW5ub3RhdGlvbnMsIHdpdGhSZXNvbHZlZCwgRmVhdHVyZUZsYWdzIH0gZnJvbSAnYXdzLWNkay1saWIvY29yZSc7XG5pbXBvcnQgeyBtZW1vaXplZEdldHRlciB9IGZyb20gJ2F3cy1jZGstbGliL2NvcmUvbGliL2hlbHBlcnMtaW50ZXJuYWwnO1xuaW1wb3J0IHsgYWRkQ29uc3RydWN0TWV0YWRhdGEgfSBmcm9tICdhd3MtY2RrLWxpYi9jb3JlL2xpYi9tZXRhZGF0YS1yZXNvdXJjZSc7XG5pbXBvcnQgeyBwcm9wZXJ0eUluamVjdGFibGUgfSBmcm9tICdhd3MtY2RrLWxpYi9jb3JlL2xpYi9wcm9wLWluamVjdGFibGUnO1xuaW1wb3J0ICogYXMgY3hhcGkgZnJvbSAnYXdzLWNkay1saWIvY3gtYXBpJztcbmltcG9ydCB7IENvbnN0cnVjdCwgTm9kZSB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0IHsgQ2x1c3RlciwgSUNsdXN0ZXIsIElwRmFtaWx5IH0gZnJvbSAnLi9jbHVzdGVyJztcbmltcG9ydCB7IGlzR3B1SW5zdGFuY2VUeXBlIH0gZnJvbSAnLi9wcml2YXRlL25vZGVncm91cCc7XG5cbi8qKlxuICogTm9kZUdyb3VwIGludGVyZmFjZVxuICovXG5leHBvcnQgaW50ZXJmYWNlIElOb2RlZ3JvdXAgZXh0ZW5kcyBJUmVzb3VyY2Uge1xuICAvKipcbiAgICogTmFtZSBvZiB0aGUgbm9kZWdyb3VwXG4gICAqIEBhdHRyaWJ1dGVcbiAgICovXG4gIHJlYWRvbmx5IG5vZGVncm91cE5hbWU6IHN0cmluZztcbn1cblxuLyoqXG4gKiBUaGUgQU1JIHR5cGUgZm9yIHlvdXIgbm9kZSBncm91cC5cbiAqXG4gKiBHUFUgaW5zdGFuY2UgdHlwZXMgc2hvdWxkIHVzZSB0aGUgYEFMMl94ODZfNjRfR1BVYCBBTUkgdHlwZSwgd2hpY2ggdXNlcyB0aGVcbiAqIEFtYXpvbiBFS1Mtb3B0aW1pemVkIExpbnV4IEFNSSB3aXRoIEdQVSBzdXBwb3J0IG9yIHRoZSBgQk9UVExFUk9DS0VUX0FSTV82NF9OVklESUFgIG9yIGBCT1RUTEVST0NLRVRfWDg2XzY0X05WSURJQWBcbiAqIEFNSSB0eXBlcywgd2hpY2ggdXNlcyB0aGUgQW1hem9uIEVLUy1vcHRpbWl6ZWQgTGludXggQU1JIHdpdGggTnZpZGlhLUdQVSBzdXBwb3J0LlxuICpcbiAqIE5vbi1HUFUgaW5zdGFuY2VzIHNob3VsZCB1c2UgdGhlIGBBTDJfeDg2XzY0YCBBTUkgdHlwZSwgd2hpY2ggdXNlcyB0aGUgQW1hem9uIEVLUy1vcHRpbWl6ZWQgTGludXggQU1JLlxuICovXG5leHBvcnQgZW51bSBOb2RlZ3JvdXBBbWlUeXBlIHtcbiAgLyoqXG4gICAqIEFtYXpvbiBMaW51eCAyICh4ODYtNjQpXG4gICAqL1xuICBBTDJfWDg2XzY0ID0gJ0FMMl94ODZfNjQnLFxuICAvKipcbiAgICogQW1hem9uIExpbnV4IDIgd2l0aCBHUFUgc3VwcG9ydFxuICAgKi9cbiAgQUwyX1g4Nl82NF9HUFUgPSAnQUwyX3g4Nl82NF9HUFUnLFxuICAvKipcbiAgICogQW1hem9uIExpbnV4IDIgKEFSTS02NClcbiAgICovXG4gIEFMMl9BUk1fNjQgPSAnQUwyX0FSTV82NCcsXG4gIC8qKlxuICAgKiAgQm90dGxlcm9ja2V0IExpbnV4IChBUk0tNjQpXG4gICAqL1xuICBCT1RUTEVST0NLRVRfQVJNXzY0ID0gJ0JPVFRMRVJPQ0tFVF9BUk1fNjQnLFxuICAvKipcbiAgICogQm90dGxlcm9ja2V0ICh4ODYtNjQpXG4gICAqL1xuICBCT1RUTEVST0NLRVRfWDg2XzY0ID0gJ0JPVFRMRVJPQ0tFVF94ODZfNjQnLFxuICAvKipcbiAgICogIEJvdHRsZXJvY2tldCBMaW51eCB3aXRoIE52aWRpYS1HUFUgc3VwcG9ydCAoQVJNLTY0KVxuICAgKi9cbiAgQk9UVExFUk9DS0VUX0FSTV82NF9OVklESUEgPSAnQk9UVExFUk9DS0VUX0FSTV82NF9OVklESUEnLFxuICAvKipcbiAgICogQm90dGxlcm9ja2V0IHdpdGggTnZpZGlhLUdQVSBzdXBwb3J0ICh4ODYtNjQpXG4gICAqL1xuICBCT1RUTEVST0NLRVRfWDg2XzY0X05WSURJQSA9ICdCT1RUTEVST0NLRVRfeDg2XzY0X05WSURJQScsXG4gIC8qKlxuICAgKiBCb3R0bGVyb2NrZXQgTGludXggKEFSTS02NCkgd2l0aCBGSVBTIGVuYWJsZWRcbiAgICovXG4gIEJPVFRMRVJPQ0tFVF9BUk1fNjRfRklQUyA9ICdCT1RUTEVST0NLRVRfQVJNXzY0X0ZJUFMnLFxuICAvKipcbiAgICogQm90dGxlcm9ja2V0ICh4ODYtNjQpIHdpdGggRklQUyBlbmFibGVkXG4gICAqL1xuICBCT1RUTEVST0NLRVRfWDg2XzY0X0ZJUFMgPSAnQk9UVExFUk9DS0VUX3g4Nl82NF9GSVBTJyxcbiAgLyoqXG4gICAqIFdpbmRvd3MgQ29yZSAyMDE5ICh4ODYtNjQpXG4gICAqL1xuICBXSU5ET1dTX0NPUkVfMjAxOV9YODZfNjQgPSAnV0lORE9XU19DT1JFXzIwMTlfeDg2XzY0JyxcbiAgLyoqXG4gICAqIFdpbmRvd3MgQ29yZSAyMDIyICh4ODYtNjQpXG4gICAqL1xuICBXSU5ET1dTX0NPUkVfMjAyMl9YODZfNjQgPSAnV0lORE9XU19DT1JFXzIwMjJfeDg2XzY0JyxcbiAgLyoqXG4gICAqIFdpbmRvd3MgRnVsbCAyMDE5ICh4ODYtNjQpXG4gICAqL1xuICBXSU5ET1dTX0ZVTExfMjAxOV9YODZfNjQgPSAnV0lORE9XU19GVUxMXzIwMTlfeDg2XzY0JyxcbiAgLyoqXG4gICAqIFdpbmRvd3MgRnVsbCAyMDIyICh4ODYtNjQpXG4gICAqL1xuICBXSU5ET1dTX0ZVTExfMjAyMl9YODZfNjQgPSAnV0lORE9XU19GVUxMXzIwMjJfeDg2XzY0JyxcbiAgLyoqXG4gICAqIEFtYXpvbiBMaW51eCAyMDIzICh4ODYtNjQpXG4gICAqL1xuICBBTDIwMjNfWDg2XzY0X1NUQU5EQVJEID0gJ0FMMjAyM194ODZfNjRfU1RBTkRBUkQnLFxuICAvKipcbiAgICogQW1hem9uIExpbnV4IDIwMjMgd2l0aCBBV1MgTmV1cm9uIGRyaXZlcnMgKHg4Ni02NClcbiAgICovXG4gIEFMMjAyM19YODZfNjRfTkVVUk9OID0gJ0FMMjAyM194ODZfNjRfTkVVUk9OJyxcbiAgLyoqXG4gICAqIEFtYXpvbiBMaW51eCAyMDIzIHdpdGggTlZJRElBIGRyaXZlcnMgKHg4Ni02NClcbiAgICovXG4gIEFMMjAyM19YODZfNjRfTlZJRElBID0gJ0FMMjAyM194ODZfNjRfTlZJRElBJyxcbiAgLyoqXG4gICAqIEFtYXpvbiBMaW51eCAyMDIzIHdpdGggTlZJRElBIGRyaXZlcnMgKEFSTS02NClcbiAgICovXG4gIEFMMjAyM19BUk1fNjRfTlZJRElBID0gJ0FMMjAyM19BUk1fNjRfTlZJRElBJyxcbiAgLyoqXG4gICAqIEFtYXpvbiBMaW51eCAyMDIzIChBUk0tNjQpXG4gICAqL1xuICBBTDIwMjNfQVJNXzY0X1NUQU5EQVJEID0gJ0FMMjAyM19BUk1fNjRfU1RBTkRBUkQnLFxufVxuXG4vKipcbiAqIENhcGFjaXR5IHR5cGUgb2YgdGhlIG1hbmFnZWQgbm9kZSBncm91cFxuICovXG5leHBvcnQgZW51bSBDYXBhY2l0eVR5cGUge1xuICAvKipcbiAgICogc3BvdCBpbnN0YW5jZXNcbiAgICovXG4gIFNQT1QgPSAnU1BPVCcsXG4gIC8qKlxuICAgKiBvbi1kZW1hbmQgaW5zdGFuY2VzXG4gICAqL1xuICBPTl9ERU1BTkQgPSAnT05fREVNQU5EJyxcbiAgLyoqXG4gICAqIGNhcGFjaXR5IGJsb2NrIGluc3RhbmNlc1xuICAgKi9cbiAgQ0FQQUNJVFlfQkxPQ0sgPSAnQ0FQQUNJVFlfQkxPQ0snLFxufVxuXG4vKipcbiAqIFRoZSByZW1vdGUgYWNjZXNzIChTU0gpIGNvbmZpZ3VyYXRpb24gdG8gdXNlIHdpdGggeW91ciBub2RlIGdyb3VwLlxuICpcbiAqIEBzZWUgaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL0FXU0Nsb3VkRm9ybWF0aW9uL2xhdGVzdC9Vc2VyR3VpZGUvYXdzLXByb3BlcnRpZXMtZWtzLW5vZGVncm91cC1yZW1vdGVhY2Nlc3MuaHRtbFxuICovXG5leHBvcnQgaW50ZXJmYWNlIE5vZGVncm91cFJlbW90ZUFjY2VzcyB7XG4gIC8qKlxuICAgKiBUaGUgQW1hem9uIEVDMiBTU0gga2V5IHRoYXQgcHJvdmlkZXMgYWNjZXNzIGZvciBTU0ggY29tbXVuaWNhdGlvbiB3aXRoIHRoZSB3b3JrZXIgbm9kZXMgaW4gdGhlIG1hbmFnZWQgbm9kZSBncm91cC5cbiAgICovXG4gIHJlYWRvbmx5IHNzaEtleU5hbWU6IHN0cmluZztcbiAgLyoqXG4gICAqIFRoZSBzZWN1cml0eSBncm91cHMgdGhhdCBhcmUgYWxsb3dlZCBTU0ggYWNjZXNzIChwb3J0IDIyKSB0byB0aGUgd29ya2VyIG5vZGVzLiBJZiB5b3Ugc3BlY2lmeSBhbiBBbWF6b24gRUMyIFNTSFxuICAgKiBrZXkgYnV0IGRvIG5vdCBzcGVjaWZ5IGEgc291cmNlIHNlY3VyaXR5IGdyb3VwIHdoZW4geW91IGNyZWF0ZSBhIG1hbmFnZWQgbm9kZSBncm91cCwgdGhlbiBwb3J0IDIyIG9uIHRoZSB3b3JrZXJcbiAgICogbm9kZXMgaXMgb3BlbmVkIHRvIHRoZSBpbnRlcm5ldCAoMC4wLjAuMC8wKS5cbiAgICpcbiAgICogQGRlZmF1bHQgLSBwb3J0IDIyIG9uIHRoZSB3b3JrZXIgbm9kZXMgaXMgb3BlbmVkIHRvIHRoZSBpbnRlcm5ldCAoMC4wLjAuMC8wKVxuICAgKi9cbiAgcmVhZG9ubHkgc291cmNlU2VjdXJpdHlHcm91cHM/OiBJU2VjdXJpdHlHcm91cFtdO1xufVxuXG4vKipcbiAqIExhdW5jaCB0ZW1wbGF0ZSBwcm9wZXJ0eSBzcGVjaWZpY2F0aW9uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTGF1bmNoVGVtcGxhdGVTcGVjIHtcbiAgLyoqXG4gICAqIFRoZSBMYXVuY2ggdGVtcGxhdGUgSURcbiAgICovXG4gIHJlYWRvbmx5IGlkOiBzdHJpbmc7XG4gIC8qKlxuICAgKiBUaGUgbGF1bmNoIHRlbXBsYXRlIHZlcnNpb24gdG8gYmUgdXNlZCAob3B0aW9uYWwpLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIHRoZSBkZWZhdWx0IHZlcnNpb24gb2YgdGhlIGxhdW5jaCB0ZW1wbGF0ZVxuICAgKi9cbiAgcmVhZG9ubHkgdmVyc2lvbj86IHN0cmluZztcbn1cblxuLyoqXG4gKiBFZmZlY3QgdHlwZXMgb2Yga3ViZXJuZXRlcyBub2RlIHRhaW50LlxuICpcbiAqIE5vdGU6IFRoZXNlIHZhbHVlcyBhcmUgc3BlY2lmaWNhbGx5IGZvciBBV1MgRUtTIE5vZGVHcm91cHMgYW5kIHVzZSB0aGUgQVdTIEFQSSBmb3JtYXQuXG4gKiBXaGVuIHVzaW5nIEFXUyBDTEkgb3IgQVBJLCB0YWludCBlZmZlY3RzIG11c3QgYmUgTk9fU0NIRURVTEUsIFBSRUZFUl9OT19TQ0hFRFVMRSwgb3IgTk9fRVhFQ1VURS5cbiAqIFdoZW4gdXNpbmcgS3ViZXJuZXRlcyBkaXJlY3RseSBvciBrdWJlY3RsLCB0YWludCBlZmZlY3RzIG11c3QgYmUgTm9TY2hlZHVsZSwgUHJlZmVyTm9TY2hlZHVsZSwgb3IgTm9FeGVjdXRlLlxuICpcbiAqIEZvciBLdWJlcm5ldGVzIG1hbmlmZXN0cyAobGlrZSBLYXJwZW50ZXIgTm9kZVBvb2xzKSwgdXNlIHN0cmluZyBsaXRlcmFscyB3aXRoIFBhc2NhbENhc2UgZm9ybWF0OlxuICogLSAnTm9TY2hlZHVsZScgaW5zdGVhZCBvZiBUYWludEVmZmVjdC5OT19TQ0hFRFVMRVxuICogLSAnUHJlZmVyTm9TY2hlZHVsZScgaW5zdGVhZCBvZiBUYWludEVmZmVjdC5QUkVGRVJfTk9fU0NIRURVTEVcbiAqIC0gJ05vRXhlY3V0ZScgaW5zdGVhZCBvZiBUYWludEVmZmVjdC5OT19FWEVDVVRFXG4gKlxuICogQHNlZSBodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vZWtzL2xhdGVzdC91c2VyZ3VpZGUvbm9kZS10YWludHMtbWFuYWdlZC1ub2RlLWdyb3Vwcy5odG1sXG4gKi9cbmV4cG9ydCBlbnVtIFRhaW50RWZmZWN0IHtcbiAgLyoqXG4gICAqIE5vU2NoZWR1bGVcbiAgICovXG4gIE5PX1NDSEVEVUxFID0gJ05PX1NDSEVEVUxFJyxcbiAgLyoqXG4gICAqIFByZWZlck5vU2NoZWR1bGVcbiAgICovXG4gIFBSRUZFUl9OT19TQ0hFRFVMRSA9ICdQUkVGRVJfTk9fU0NIRURVTEUnLFxuICAvKipcbiAgICogTm9FeGVjdXRlXG4gICAqL1xuICBOT19FWEVDVVRFID0gJ05PX0VYRUNVVEUnLFxufVxuXG4vKipcbiAqIFRhaW50IGludGVyZmFjZVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRhaW50U3BlYyB7XG4gIC8qKlxuICAgKiBFZmZlY3QgdHlwZVxuICAgKlxuICAgKiBAZGVmYXVsdCAtIE5vbmVcbiAgICovXG4gIHJlYWRvbmx5IGVmZmVjdD86IFRhaW50RWZmZWN0O1xuICAvKipcbiAgICogVGFpbnQga2V5XG4gICAqXG4gICAqIEBkZWZhdWx0IC0gTm9uZVxuICAgKi9cbiAgcmVhZG9ubHkga2V5Pzogc3RyaW5nO1xuICAvKipcbiAgICogVGFpbnQgdmFsdWVcbiAgICpcbiAgICogQGRlZmF1bHQgLSBOb25lXG4gICAqL1xuICByZWFkb25seSB2YWx1ZT86IHN0cmluZztcbn1cblxuLyoqXG4gKiBUaGUgTm9kZWdyb3VwIE9wdGlvbnMgZm9yIGFkZE5vZGVHcm91cCgpIG1ldGhvZFxuICovXG5leHBvcnQgaW50ZXJmYWNlIE5vZGVncm91cE9wdGlvbnMge1xuICAvKipcbiAgICogTmFtZSBvZiB0aGUgTm9kZWdyb3VwXG4gICAqXG4gICAqIEBkZWZhdWx0IC0gcmVzb3VyY2UgSURcbiAgICovXG4gIHJlYWRvbmx5IG5vZGVncm91cE5hbWU/OiBzdHJpbmc7XG4gIC8qKlxuICAgKiBUaGUgc3VibmV0cyB0byB1c2UgZm9yIHRoZSBBdXRvIFNjYWxpbmcgZ3JvdXAgdGhhdCBpcyBjcmVhdGVkIGZvciB5b3VyIG5vZGUgZ3JvdXAuIEJ5IHNwZWNpZnlpbmcgdGhlXG4gICAqIFN1Ym5ldFNlbGVjdGlvbiwgdGhlIHNlbGVjdGVkIHN1Ym5ldHMgd2lsbCBhdXRvbWF0aWNhbGx5IGFwcGx5IHJlcXVpcmVkIHRhZ3MgaS5lLlxuICAgKiBga3ViZXJuZXRlcy5pby9jbHVzdGVyL0NMVVNURVJfTkFNRWAgd2l0aCBhIHZhbHVlIG9mIGBzaGFyZWRgLCB3aGVyZSBgQ0xVU1RFUl9OQU1FYCBpcyByZXBsYWNlZCB3aXRoXG4gICAqIHRoZSBuYW1lIG9mIHlvdXIgY2x1c3Rlci5cbiAgICpcbiAgICogQGRlZmF1bHQgLSBwcml2YXRlIHN1Ym5ldHNcbiAgICovXG4gIHJlYWRvbmx5IHN1Ym5ldHM/OiBTdWJuZXRTZWxlY3Rpb247XG4gIC8qKlxuICAgKiBUaGUgQU1JIHR5cGUgZm9yIHlvdXIgbm9kZSBncm91cC4gSWYgeW91IGV4cGxpY2l0bHkgc3BlY2lmeSB0aGUgbGF1bmNoVGVtcGxhdGUgd2l0aCBjdXN0b20gQU1JLCBkbyBub3Qgc3BlY2lmeSB0aGlzIHByb3BlcnR5LCBvclxuICAgKiB0aGUgbm9kZSBncm91cCBkZXBsb3ltZW50IHdpbGwgZmFpbC4gSW4gb3RoZXIgY2FzZXMsIHlvdSB3aWxsIG5lZWQgdG8gc3BlY2lmeSBjb3JyZWN0IGFtaVR5cGUgZm9yIHRoZSBub2RlZ3JvdXAuXG4gICAqXG4gICAqIEBkZWZhdWx0IC0gYXV0by1kZXRlcm1pbmVkIGZyb20gdGhlIGluc3RhbmNlVHlwZXMgcHJvcGVydHkgd2hlbiBsYXVuY2hUZW1wbGF0ZVNwZWMgcHJvcGVydHkgaXMgbm90IHNwZWNpZmllZFxuICAgKi9cbiAgcmVhZG9ubHkgYW1pVHlwZT86IE5vZGVncm91cEFtaVR5cGU7XG4gIC8qKlxuICAgKiBUaGUgcm9vdCBkZXZpY2UgZGlzayBzaXplIChpbiBHaUIpIGZvciB5b3VyIG5vZGUgZ3JvdXAgaW5zdGFuY2VzLlxuICAgKlxuICAgKiBAZGVmYXVsdCAyMFxuICAgKi9cbiAgcmVhZG9ubHkgZGlza1NpemU/OiBudW1iZXI7XG4gIC8qKlxuICAgKiBUaGUgY3VycmVudCBudW1iZXIgb2Ygd29ya2VyIG5vZGVzIHRoYXQgdGhlIG1hbmFnZWQgbm9kZSBncm91cCBzaG91bGQgbWFpbnRhaW4uIElmIG5vdCBzcGVjaWZpZWQsXG4gICAqIHRoZSBub2Rld2dyb3VwIHdpbGwgaW5pdGlhbGx5IGNyZWF0ZSBgbWluU2l6ZWAgaW5zdGFuY2VzLlxuICAgKlxuICAgKiBAZGVmYXVsdCAyXG4gICAqL1xuICByZWFkb25seSBkZXNpcmVkU2l6ZT86IG51bWJlcjtcbiAgLyoqXG4gICAqIFRoZSBtYXhpbXVtIG51bWJlciBvZiB3b3JrZXIgbm9kZXMgdGhhdCB0aGUgbWFuYWdlZCBub2RlIGdyb3VwIGNhbiBzY2FsZSBvdXQgdG8uIE1hbmFnZWQgbm9kZSBncm91cHMgY2FuIHN1cHBvcnQgdXAgdG8gMTAwIG5vZGVzIGJ5IGRlZmF1bHQuXG4gICAqXG4gICAqIEBkZWZhdWx0IC0gc2FtZSBhcyBkZXNpcmVkU2l6ZSBwcm9wZXJ0eVxuICAgKi9cbiAgcmVhZG9ubHkgbWF4U2l6ZT86IG51bWJlcjtcbiAgLyoqXG4gICAqIFRoZSBtaW5pbXVtIG51bWJlciBvZiB3b3JrZXIgbm9kZXMgdGhhdCB0aGUgbWFuYWdlZCBub2RlIGdyb3VwIGNhbiBzY2FsZSBpbiB0by4gVGhpcyBudW1iZXIgbXVzdCBiZSBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gemVyby5cbiAgICpcbiAgICogQGRlZmF1bHQgMVxuICAgKi9cbiAgcmVhZG9ubHkgbWluU2l6ZT86IG51bWJlcjtcbiAgLyoqXG4gICAqIEZvcmNlIHRoZSB1cGRhdGUgaWYgdGhlIGV4aXN0aW5nIG5vZGUgZ3JvdXAncyBwb2RzIGFyZSB1bmFibGUgdG8gYmUgZHJhaW5lZCBkdWUgdG8gYSBwb2QgZGlzcnVwdGlvbiBidWRnZXQgaXNzdWUuXG4gICAqIElmIGFuIHVwZGF0ZSBmYWlscyBiZWNhdXNlIHBvZHMgY291bGQgbm90IGJlIGRyYWluZWQsIHlvdSBjYW4gZm9yY2UgdGhlIHVwZGF0ZSBhZnRlciBpdCBmYWlscyB0byB0ZXJtaW5hdGUgdGhlIG9sZFxuICAgKiBub2RlIHdoZXRoZXIgb3Igbm90IGFueSBwb2RzIGFyZVxuICAgKiBydW5uaW5nIG9uIHRoZSBub2RlLlxuICAgKlxuICAgKiBAZGVmYXVsdCB0cnVlXG4gICAqL1xuICByZWFkb25seSBmb3JjZVVwZGF0ZT86IGJvb2xlYW47XG4gIC8qKlxuICAgKiBUaGUgaW5zdGFuY2UgdHlwZSB0byB1c2UgZm9yIHlvdXIgbm9kZSBncm91cC4gQ3VycmVudGx5LCB5b3UgY2FuIHNwZWNpZnkgYSBzaW5nbGUgaW5zdGFuY2UgdHlwZSBmb3IgYSBub2RlIGdyb3VwLlxuICAgKiBUaGUgZGVmYXVsdCB2YWx1ZSBmb3IgdGhpcyBwYXJhbWV0ZXIgaXMgYHQzLm1lZGl1bWAuIElmIHlvdSBjaG9vc2UgYSBHUFUgaW5zdGFuY2UgdHlwZSwgYmUgc3VyZSB0byBzcGVjaWZ5IHRoZVxuICAgKiBgQUwyX3g4Nl82NF9HUFVgLCBgQk9UVExFUk9DS0VUX0FSTV82NF9OVklESUFgLCBvciBgQk9UVExFUk9DS0VUX3g4Nl82NF9OVklESUFgIHdpdGggdGhlIGFtaVR5cGUgcGFyYW1ldGVyLlxuICAgKlxuICAgKiBAZGVmYXVsdCB0My5tZWRpdW1cbiAgICogQGRlcHJlY2F0ZWQgVXNlIGBpbnN0YW5jZVR5cGVzYCBpbnN0ZWFkLlxuICAgKi9cbiAgcmVhZG9ubHkgaW5zdGFuY2VUeXBlPzogSW5zdGFuY2VUeXBlO1xuICAvKipcbiAgICogVGhlIGluc3RhbmNlIHR5cGVzIHRvIHVzZSBmb3IgeW91ciBub2RlIGdyb3VwLlxuICAgKiBAZGVmYXVsdCB0My5tZWRpdW0gd2lsbCBiZSB1c2VkIGFjY29yZGluZyB0byB0aGUgY2xvdWRmb3JtYXRpb24gZG9jdW1lbnQuXG4gICAqIEBzZWUgaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL0FXU0Nsb3VkRm9ybWF0aW9uL2xhdGVzdC9Vc2VyR3VpZGUvYXdzLXJlc291cmNlLWVrcy1ub2RlZ3JvdXAuaHRtbCNjZm4tZWtzLW5vZGVncm91cC1pbnN0YW5jZXR5cGVzXG4gICAqL1xuICByZWFkb25seSBpbnN0YW5jZVR5cGVzPzogSW5zdGFuY2VUeXBlW107XG4gIC8qKlxuICAgKiBUaGUgS3ViZXJuZXRlcyBsYWJlbHMgdG8gYmUgYXBwbGllZCB0byB0aGUgbm9kZXMgaW4gdGhlIG5vZGUgZ3JvdXAgd2hlbiB0aGV5IGFyZSBjcmVhdGVkLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIE5vbmVcbiAgICovXG4gIHJlYWRvbmx5IGxhYmVscz86IHsgW25hbWU6IHN0cmluZ106IHN0cmluZyB9O1xuICAvKipcbiAgICogVGhlIEt1YmVybmV0ZXMgdGFpbnRzIHRvIGJlIGFwcGxpZWQgdG8gdGhlIG5vZGVzIGluIHRoZSBub2RlIGdyb3VwIHdoZW4gdGhleSBhcmUgY3JlYXRlZC5cbiAgICpcbiAgICogQGRlZmF1bHQgLSBOb25lXG4gICAqL1xuICByZWFkb25seSB0YWludHM/OiBUYWludFNwZWNbXTtcbiAgLyoqXG4gICAqIFRoZSBJQU0gcm9sZSB0byBhc3NvY2lhdGUgd2l0aCB5b3VyIG5vZGUgZ3JvdXAuIFRoZSBBbWF6b24gRUtTIHdvcmtlciBub2RlIGt1YmVsZXQgZGFlbW9uXG4gICAqIG1ha2VzIGNhbGxzIHRvIEFXUyBBUElzIG9uIHlvdXIgYmVoYWxmLiBXb3JrZXIgbm9kZXMgcmVjZWl2ZSBwZXJtaXNzaW9ucyBmb3IgdGhlc2UgQVBJIGNhbGxzIHRocm91Z2hcbiAgICogYW4gSUFNIGluc3RhbmNlIHByb2ZpbGUgYW5kIGFzc29jaWF0ZWQgcG9saWNpZXMuIEJlZm9yZSB5b3UgY2FuIGxhdW5jaCB3b3JrZXIgbm9kZXMgYW5kIHJlZ2lzdGVyIHRoZW1cbiAgICogaW50byBhIGNsdXN0ZXIsIHlvdSBtdXN0IGNyZWF0ZSBhbiBJQU0gcm9sZSBmb3IgdGhvc2Ugd29ya2VyIG5vZGVzIHRvIHVzZSB3aGVuIHRoZXkgYXJlIGxhdW5jaGVkLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIE5vbmUuIEF1dG8tZ2VuZXJhdGVkIGlmIG5vdCBzcGVjaWZpZWQuXG4gICAqL1xuICByZWFkb25seSBub2RlUm9sZT86IElSb2xlO1xuICAvKipcbiAgICogVGhlIEFNSSB2ZXJzaW9uIG9mIHRoZSBBbWF6b24gRUtTLW9wdGltaXplZCBBTUkgdG8gdXNlIHdpdGggeW91ciBub2RlIGdyb3VwIChmb3IgZXhhbXBsZSwgYDEuMTQuNy1ZWVlZTU1ERGApLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIFRoZSBsYXRlc3QgYXZhaWxhYmxlIEFNSSB2ZXJzaW9uIGZvciB0aGUgbm9kZSBncm91cCdzIGN1cnJlbnQgS3ViZXJuZXRlcyB2ZXJzaW9uIGlzIHVzZWQuXG4gICAqL1xuICByZWFkb25seSByZWxlYXNlVmVyc2lvbj86IHN0cmluZztcbiAgLyoqXG4gICAqIFRoZSByZW1vdGUgYWNjZXNzIChTU0gpIGNvbmZpZ3VyYXRpb24gdG8gdXNlIHdpdGggeW91ciBub2RlIGdyb3VwLiBEaXNhYmxlZCBieSBkZWZhdWx0LCBob3dldmVyLCBpZiB5b3VcbiAgICogc3BlY2lmeSBhbiBBbWF6b24gRUMyIFNTSCBrZXkgYnV0IGRvIG5vdCBzcGVjaWZ5IGEgc291cmNlIHNlY3VyaXR5IGdyb3VwIHdoZW4geW91IGNyZWF0ZSBhIG1hbmFnZWQgbm9kZSBncm91cCxcbiAgICogdGhlbiBwb3J0IDIyIG9uIHRoZSB3b3JrZXIgbm9kZXMgaXMgb3BlbmVkIHRvIHRoZSBpbnRlcm5ldCAoMC4wLjAuMC8wKVxuICAgKlxuICAgKiBAZGVmYXVsdCAtIGRpc2FibGVkXG4gICAqL1xuICByZWFkb25seSByZW1vdGVBY2Nlc3M/OiBOb2RlZ3JvdXBSZW1vdGVBY2Nlc3M7XG4gIC8qKlxuICAgKiBUaGUgbWV0YWRhdGEgdG8gYXBwbHkgdG8gdGhlIG5vZGUgZ3JvdXAgdG8gYXNzaXN0IHdpdGggY2F0ZWdvcml6YXRpb24gYW5kIG9yZ2FuaXphdGlvbi4gRWFjaCB0YWcgY29uc2lzdHMgb2ZcbiAgICogYSBrZXkgYW5kIGFuIG9wdGlvbmFsIHZhbHVlLCBib3RoIG9mIHdoaWNoIHlvdSBkZWZpbmUuIE5vZGUgZ3JvdXAgdGFncyBkbyBub3QgcHJvcGFnYXRlIHRvIGFueSBvdGhlciByZXNvdXJjZXNcbiAgICogYXNzb2NpYXRlZCB3aXRoIHRoZSBub2RlIGdyb3VwLCBzdWNoIGFzIHRoZSBBbWF6b24gRUMyIGluc3RhbmNlcyBvciBzdWJuZXRzLlxuICAgKlxuICAgKiBAZGVmYXVsdCBOb25lXG4gICAqL1xuICByZWFkb25seSB0YWdzPzogeyBbbmFtZTogc3RyaW5nXTogc3RyaW5nIH07XG4gIC8qKlxuICAgKiBMYXVuY2ggdGVtcGxhdGUgc3BlY2lmaWNhdGlvbiB1c2VkIGZvciB0aGUgbm9kZWdyb3VwXG4gICAqIEBzZWUgaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL2Vrcy9sYXRlc3QvdXNlcmd1aWRlL2xhdW5jaC10ZW1wbGF0ZXMuaHRtbFxuICAgKiBAZGVmYXVsdCAtIG5vIGxhdW5jaCB0ZW1wbGF0ZVxuICAgKi9cbiAgcmVhZG9ubHkgbGF1bmNoVGVtcGxhdGVTcGVjPzogTGF1bmNoVGVtcGxhdGVTcGVjO1xuICAvKipcbiAgICogVGhlIGNhcGFjaXR5IHR5cGUgb2YgdGhlIG5vZGVncm91cC5cbiAgICpcbiAgICogQGRlZmF1bHQgQ2FwYWNpdHlUeXBlLk9OX0RFTUFORFxuICAgKi9cbiAgcmVhZG9ubHkgY2FwYWNpdHlUeXBlPzogQ2FwYWNpdHlUeXBlO1xuXG4gIC8qKlxuICAgKiBUaGUgbWF4aW11bSBudW1iZXIgb2Ygbm9kZXMgdW5hdmFpbGFibGUgYXQgb25jZSBkdXJpbmcgYSB2ZXJzaW9uIHVwZGF0ZS5cbiAgICogTm9kZXMgd2lsbCBiZSB1cGRhdGVkIGluIHBhcmFsbGVsLiBUaGUgbWF4aW11bSBudW1iZXIgaXMgMTAwLlxuICAgKlxuICAgKiBUaGlzIHZhbHVlIG9yIGBtYXhVbmF2YWlsYWJsZVBlcmNlbnRhZ2VgIGlzIHJlcXVpcmVkIHRvIGhhdmUgYSB2YWx1ZSBmb3IgY3VzdG9tIHVwZGF0ZSBjb25maWd1cmF0aW9ucyB0byBiZSBhcHBsaWVkLlxuICAgKlxuICAgKiBAc2VlIGh0dHBzOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9BV1NDbG91ZEZvcm1hdGlvbi9sYXRlc3QvVXNlckd1aWRlL2F3cy1wcm9wZXJ0aWVzLWVrcy1ub2RlZ3JvdXAtdXBkYXRlY29uZmlnLmh0bWwjY2ZuLWVrcy1ub2RlZ3JvdXAtdXBkYXRlY29uZmlnLW1heHVuYXZhaWxhYmxlXG4gICAqIEBkZWZhdWx0IDFcbiAgICovXG4gIHJlYWRvbmx5IG1heFVuYXZhaWxhYmxlPzogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgbWF4aW11bSBwZXJjZW50YWdlIG9mIG5vZGVzIHVuYXZhaWxhYmxlIGR1cmluZyBhIHZlcnNpb24gdXBkYXRlLlxuICAgKiBUaGlzIHBlcmNlbnRhZ2Ugb2Ygbm9kZXMgd2lsbCBiZSB1cGRhdGVkIGluIHBhcmFsbGVsLCB1cCB0byAxMDAgbm9kZXMgYXQgb25jZS5cbiAgICpcbiAgICogVGhpcyB2YWx1ZSBvciBgbWF4VW5hdmFpbGFibGVgIGlzIHJlcXVpcmVkIHRvIGhhdmUgYSB2YWx1ZSBmb3IgY3VzdG9tIHVwZGF0ZSBjb25maWd1cmF0aW9ucyB0byBiZSBhcHBsaWVkLlxuICAgKlxuICAgKiBAc2VlIGh0dHBzOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9BV1NDbG91ZEZvcm1hdGlvbi9sYXRlc3QvVXNlckd1aWRlL2F3cy1wcm9wZXJ0aWVzLWVrcy1ub2RlZ3JvdXAtdXBkYXRlY29uZmlnLmh0bWwjY2ZuLWVrcy1ub2RlZ3JvdXAtdXBkYXRlY29uZmlnLW1heHVuYXZhaWxhYmxlcGVyY2VudGFnZVxuICAgKiBAZGVmYXVsdCB1bmRlZmluZWQgLSBub2RlIGdyb3VwcyB3aWxsIHVwZGF0ZSBpbnN0YW5jZXMgb25lIGF0IGEgdGltZVxuICAgKi9cbiAgcmVhZG9ubHkgbWF4VW5hdmFpbGFibGVQZXJjZW50YWdlPzogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBTcGVjaWZpZXMgd2hldGhlciB0byBlbmFibGUgbm9kZSBhdXRvIHJlcGFpciBmb3IgdGhlIG5vZGUgZ3JvdXAuIE5vZGUgYXV0byByZXBhaXIgaXMgZGlzYWJsZWQgYnkgZGVmYXVsdC5cbiAgICpcbiAgICogQHNlZSBodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vZWtzL2xhdGVzdC91c2VyZ3VpZGUvbm9kZS1oZWFsdGguaHRtbCNub2RlLWF1dG8tcmVwYWlyXG4gICAqIEBkZWZhdWx0IGZhbHNlXG4gICAqL1xuICByZWFkb25seSBlbmFibGVOb2RlQXV0b1JlcGFpcj86IGJvb2xlYW47XG59XG5cbi8qKlxuICogTm9kZUdyb3VwIHByb3BlcnRpZXMgaW50ZXJmYWNlXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTm9kZWdyb3VwUHJvcHMgZXh0ZW5kcyBOb2RlZ3JvdXBPcHRpb25zIHtcbiAgLyoqXG4gICAqIENsdXN0ZXIgcmVzb3VyY2VcbiAgICovXG4gIHJlYWRvbmx5IGNsdXN0ZXI6IElDbHVzdGVyO1xufVxuXG4vKipcbiAqIFRoZSBOb2RlZ3JvdXAgcmVzb3VyY2UgY2xhc3NcbiAqIEByZXNvdXJjZSBBV1M6OkVLUzo6Tm9kZWdyb3VwXG4gKi9cbkBwcm9wZXJ0eUluamVjdGFibGVcbmV4cG9ydCBjbGFzcyBOb2RlZ3JvdXAgZXh0ZW5kcyBSZXNvdXJjZSBpbXBsZW1lbnRzIElOb2RlZ3JvdXAge1xuICAvKiogVW5pcXVlbHkgaWRlbnRpZmllcyB0aGlzIGNsYXNzLiAqL1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFBST1BFUlRZX0lOSkVDVElPTl9JRDogc3RyaW5nID0gJ0Bhd3MtY2RrLmF3cy1la3MtdjItYWxwaGEuTm9kZWdyb3VwJztcblxuICAvKipcbiAgICogSW1wb3J0IHRoZSBOb2RlZ3JvdXAgZnJvbSBhdHRyaWJ1dGVzXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGZyb21Ob2RlZ3JvdXBOYW1lKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIG5vZGVncm91cE5hbWU6IHN0cmluZyk6IElOb2RlZ3JvdXAge1xuICAgIGNsYXNzIEltcG9ydCBleHRlbmRzIFJlc291cmNlIGltcGxlbWVudHMgSU5vZGVncm91cCB7XG4gICAgICBwdWJsaWMgcmVhZG9ubHkgbm9kZWdyb3VwTmFtZSA9IG5vZGVncm91cE5hbWU7XG4gICAgfVxuICAgIHJldHVybiBuZXcgSW1wb3J0KHNjb3BlLCBpZCk7XG4gIH1cbiAgLyoqXG4gICAqIHRoZSBBbWF6b24gRUtTIGNsdXN0ZXIgcmVzb3VyY2VcbiAgICpcbiAgICogQGF0dHJpYnV0ZSBDbHVzdGVyTmFtZVxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IGNsdXN0ZXI6IElDbHVzdGVyO1xuICAvKipcbiAgICogSUFNIHJvbGUgb2YgdGhlIGluc3RhbmNlIHByb2ZpbGUgZm9yIHRoZSBub2RlZ3JvdXBcbiAgICovXG4gIHB1YmxpYyByZWFkb25seSByb2xlOiBJUm9sZTtcblxuICBwcml2YXRlIHJlYWRvbmx5IHJlc291cmNlOiBDZm5Ob2RlZ3JvdXA7XG5cbiAgcHJpdmF0ZSByZWFkb25seSBkZXNpcmVkU2l6ZTogbnVtYmVyO1xuICBwcml2YXRlIHJlYWRvbmx5IG1heFNpemU6IG51bWJlcjtcbiAgcHJpdmF0ZSByZWFkb25seSBtaW5TaXplOiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IE5vZGVncm91cFByb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCB7XG4gICAgICBwaHlzaWNhbE5hbWU6IHByb3BzLm5vZGVncm91cE5hbWUsXG4gICAgfSk7XG4gICAgLy8gRW5oYW5jZWQgQ0RLIEFuYWx5dGljcyBUZWxlbWV0cnlcbiAgICBhZGRDb25zdHJ1Y3RNZXRhZGF0YSh0aGlzLCBwcm9wcyk7XG5cbiAgICB0aGlzLmNsdXN0ZXIgPSBwcm9wcy5jbHVzdGVyO1xuXG4gICAgdGhpcy5kZXNpcmVkU2l6ZSA9IHByb3BzLmRlc2lyZWRTaXplID8/IHByb3BzLm1pblNpemUgPz8gMjtcbiAgICB0aGlzLm1heFNpemUgPSBwcm9wcy5tYXhTaXplID8/IHRoaXMuZGVzaXJlZFNpemU7XG4gICAgdGhpcy5taW5TaXplID0gcHJvcHMubWluU2l6ZSA/PyAxO1xuXG4gICAgd2l0aFJlc29sdmVkKHRoaXMuZGVzaXJlZFNpemUsIHRoaXMubWF4U2l6ZSwgKGRlc2lyZWQsIG1heCkgPT4ge1xuICAgICAgaWYgKGRlc2lyZWQgPT09IHVuZGVmaW5lZCkge3JldHVybiA7fVxuICAgICAgaWYgKGRlc2lyZWQgPiBtYXgpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBEZXNpcmVkIGNhcGFjaXR5ICR7ZGVzaXJlZH0gY2FuJ3QgYmUgZ3JlYXRlciB0aGFuIG1heCBzaXplICR7bWF4fWApO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgd2l0aFJlc29sdmVkKHRoaXMuZGVzaXJlZFNpemUsIHRoaXMubWluU2l6ZSwgKGRlc2lyZWQsIG1pbikgPT4ge1xuICAgICAgaWYgKGRlc2lyZWQgPT09IHVuZGVmaW5lZCkge3JldHVybiA7fVxuICAgICAgaWYgKGRlc2lyZWQgPCBtaW4pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBNaW5pbXVtIGNhcGFjaXR5ICR7bWlufSBjYW4ndCBiZSBncmVhdGVyIHRoYW4gZGVzaXJlZCBzaXplICR7ZGVzaXJlZH1gKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmIChwcm9wcy5sYXVuY2hUZW1wbGF0ZVNwZWMgJiYgcHJvcHMuZGlza1NpemUpIHtcbiAgICAgIC8vIHNlZSAtIGh0dHBzOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9la3MvbGF0ZXN0L3VzZXJndWlkZS9sYXVuY2gtdGVtcGxhdGVzLmh0bWxcbiAgICAgIC8vIGFuZCBodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vQVdTQ2xvdWRGb3JtYXRpb24vbGF0ZXN0L1VzZXJHdWlkZS9hd3MtcmVzb3VyY2UtZWtzLW5vZGVncm91cC5odG1sI2Nmbi1la3Mtbm9kZWdyb3VwLWRpc2tzaXplXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Rpc2tTaXplIG11c3QgYmUgc3BlY2lmaWVkIHdpdGhpbiB0aGUgbGF1bmNoIHRlbXBsYXRlJyk7XG4gICAgfVxuXG4gICAgaWYgKHByb3BzLmluc3RhbmNlVHlwZSAmJiBwcm9wcy5pbnN0YW5jZVR5cGVzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1wiaW5zdGFuY2VUeXBlIGlzIGRlcHJlY2F0ZWQsIHBsZWFzZSB1c2UgXCJpbnN0YW5jZVR5cGVzXCIgb25seS4nKTtcbiAgICB9XG5cbiAgICBpZiAocHJvcHMuaW5zdGFuY2VUeXBlKSB7XG4gICAgICBBbm5vdGF0aW9ucy5vZih0aGlzKS5hZGRXYXJuaW5nVjIoJ0Bhd3MtY2RrL2F3cy1la3M6bWFuYWdlZE5vZGVHcm91cERlcHJlY2F0ZWRJbnN0YW5jZVR5cGUnLCAnXCJpbnN0YW5jZVR5cGVcIiBpcyBkZXByZWNhdGVkIGFuZCB3aWxsIGJlIHJlbW92ZWQgaW4gdGhlIG5leHQgbWFqb3IgdmVyc2lvbi4gcGxlYXNlIHVzZSBcImluc3RhbmNlVHlwZXNcIiBpbnN0ZWFkJyk7XG4gICAgfVxuICAgIGNvbnN0IGluc3RhbmNlVHlwZXMgPSBwcm9wcy5pbnN0YW5jZVR5cGVzID8/IChwcm9wcy5pbnN0YW5jZVR5cGUgPyBbcHJvcHMuaW5zdGFuY2VUeXBlXSA6IHVuZGVmaW5lZCk7XG4gICAgbGV0IHBvc3NpYmxlQW1pVHlwZXM6IE5vZGVncm91cEFtaVR5cGVbXSA9IFtdO1xuXG4gICAgaWYgKGluc3RhbmNlVHlwZXMgJiYgaW5zdGFuY2VUeXBlcy5sZW5ndGggPiAwKSB7XG4gICAgICAvKipcbiAgICAgICAqIGlmIHRoZSB1c2VyIGV4cGxpY2l0bHkgY29uZmlndXJlZCBpbnN0YW5jZSB0eXBlcywgd2UgY2FuJ3QgY2FjdWxhdGUgdGhlIGV4cGVjdGVkIGFtaSB0eXBlIGFzIHdlIHN1cHBvcnRcbiAgICAgICAqIEFtYXpvbiBMaW51eCAyLCBCb3R0bGVyb2NrZXQsIGFuZCBXaW5kb3dzIG5vdy4gSG93ZXZlciB3ZSBjYW4gY2hlY2s6XG4gICAgICAgKlxuICAgICAgICogMS4gaW5zdGFuY2UgdHlwZXMgb2YgZGlmZmVyZW50IENQVSBhcmNoaXRlY3R1cmVzIGFyZSBub3QgbWl4ZWQoZS5nLiBYODYgd2l0aCBBUk0pLlxuICAgICAgICogMi4gdXNlci1zcGVjaWZpZWQgYW1pVHlwZSBzaG91bGQgYmUgaW5jbHVkZWQgaW4gYHBvc3NpYmxlQW1pVHlwZXNgLlxuICAgICAgICovXG4gICAgICBwb3NzaWJsZUFtaVR5cGVzID0gZ2V0UG9zc2libGVBbWlUeXBlcyhpbnN0YW5jZVR5cGVzKTtcblxuICAgICAgLy8gaWYgdGhlIHVzZXIgZXhwbGljaXRseSBjb25maWd1cmVkIGFuIGFtaSB0eXBlLCBtYWtlIHN1cmUgaXQncyBpbmNsdWRlZCBpbiB0aGUgcG9zc2libGVBbWlUeXBlc1xuICAgICAgaWYgKHByb3BzLmFtaVR5cGUgJiYgIXBvc3NpYmxlQW1pVHlwZXMuaW5jbHVkZXMocHJvcHMuYW1pVHlwZSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBUaGUgc3BlY2lmaWVkIEFNSSBkb2VzIG5vdCBtYXRjaCB0aGUgaW5zdGFuY2UgdHlwZXMgYXJjaGl0ZWN0dXJlLCBlaXRoZXIgc3BlY2lmeSBvbmUgb2YgJHtwb3NzaWJsZUFtaVR5cGVzLmpvaW4oJywgJykudG9VcHBlckNhc2UoKX0gb3IgZG9uJ3Qgc3BlY2lmeSBhbnlgKTtcbiAgICAgIH1cblxuICAgICAgLy8gaWYgdGhlIHVzZXIgZXhwbGljaXRseSBjb25maWd1cmVkIGEgV2luZG93cyBhbWkgdHlwZSwgbWFrZSBzdXJlIHRoZSBpbnN0YW5jZVR5cGUgaXMgYWxsb3dlZFxuICAgICAgaWYgKHByb3BzLmFtaVR5cGUgJiYgd2luZG93c0FtaVR5cGVzLmluY2x1ZGVzKHByb3BzLmFtaVR5cGUpICYmXG4gICAgICBpbnN0YW5jZVR5cGVzLmZpbHRlcihpc1dpbmRvd3NTdXBwb3J0ZWRJbnN0YW5jZVR5cGUpLmxlbmd0aCA8IGluc3RhbmNlVHlwZXMubGVuZ3RoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHNwZWNpZmllZCBpbnN0YW5jZVR5cGUgZG9lcyBub3Qgc3VwcG9ydCBXaW5kb3dzIHdvcmtsb2Fkcy4gJ1xuICAgICAgICArICdBbWF6b24gRUMyIGluc3RhbmNlIHR5cGVzIEMzLCBDNCwgRDIsIEkyLCBNNCAoZXhjbHVkaW5nIG00LjE2eGxhcmdlKSwgTTZhLngsIGFuZCAnXG4gICAgICAgICsgJ1IzIGluc3RhbmNlcyBhcmVuXFwndCBzdXBwb3J0ZWQgZm9yIFdpbmRvd3Mgd29ya2xvYWRzLicpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghcHJvcHMubm9kZVJvbGUpIHtcbiAgICAgIGNvbnN0IG5nUm9sZSA9IG5ldyBSb2xlKHRoaXMsICdOb2RlR3JvdXBSb2xlJywge1xuICAgICAgICBhc3N1bWVkQnk6IG5ldyBTZXJ2aWNlUHJpbmNpcGFsKCdlYzIuYW1hem9uYXdzLmNvbScpLFxuICAgICAgfSk7XG5cbiAgICAgIG5nUm9sZS5hZGRNYW5hZ2VkUG9saWN5KE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdBbWF6b25FS1NXb3JrZXJOb2RlUG9saWN5JykpO1xuICAgICAgbmdSb2xlLmFkZE1hbmFnZWRQb2xpY3koTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ0FtYXpvbkVLU19DTklfUG9saWN5JykpO1xuICAgICAgbmdSb2xlLmFkZE1hbmFnZWRQb2xpY3koTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ0FtYXpvbkVDMkNvbnRhaW5lclJlZ2lzdHJ5UmVhZE9ubHknKSk7XG5cbiAgICAgIC8vIEdyYW50IGFkZGl0aW9uYWwgSVB2NiBuZXR3b3JraW5nIHBlcm1pc3Npb25zIGlmIHJ1bm5pbmcgaW4gSVB2NlxuICAgICAgLy8gaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL2Vrcy9sYXRlc3QvdXNlcmd1aWRlL2NuaS1pYW0tcm9sZS5odG1sXG4gICAgICBpZiAocHJvcHMuY2x1c3Rlci5pcEZhbWlseSA9PSBJcEZhbWlseS5JUF9WNikge1xuICAgICAgICBuZ1JvbGUuYWRkVG9QcmluY2lwYWxQb2xpY3kobmV3IFBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEBjZGtsYWJzL25vLWxpdGVyYWwtcGFydGl0aW9uXG4gICAgICAgICAgcmVzb3VyY2VzOiBbJ2Fybjphd3M6ZWMyOio6KjpuZXR3b3JrLWludGVyZmFjZS8qJ10sXG4gICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgJ2VjMjpBc3NpZ25JcHY2QWRkcmVzc2VzJyxcbiAgICAgICAgICAgICdlYzI6VW5hc3NpZ25JcHY2QWRkcmVzc2VzJyxcbiAgICAgICAgICBdLFxuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgICB0aGlzLnJvbGUgPSBuZ1JvbGU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucm9sZSA9IHByb3BzLm5vZGVSb2xlO1xuICAgIH1cblxuICAgIHRoaXMudmFsaWRhdGVVcGRhdGVDb25maWcocHJvcHMubWF4VW5hdmFpbGFibGUsIHByb3BzLm1heFVuYXZhaWxhYmxlUGVyY2VudGFnZSk7XG5cbiAgICB0aGlzLnJlc291cmNlID0gbmV3IENmbk5vZGVncm91cCh0aGlzLCAnUmVzb3VyY2UnLCB7XG4gICAgICBjbHVzdGVyTmFtZTogdGhpcy5jbHVzdGVyLmNsdXN0ZXJOYW1lLFxuICAgICAgbm9kZWdyb3VwTmFtZTogcHJvcHMubm9kZWdyb3VwTmFtZSxcbiAgICAgIG5vZGVSb2xlOiB0aGlzLnJvbGUucm9sZUFybixcbiAgICAgIHN1Ym5ldHM6IHRoaXMuY2x1c3Rlci52cGMuc2VsZWN0U3VibmV0cyhwcm9wcy5zdWJuZXRzKS5zdWJuZXRJZHMsXG4gICAgICAvKipcbiAgICAgICAqIENhc2UgMTogSWYgbGF1bmNoVGVtcGxhdGUgaXMgZXhwbGljaXRseSBzcGVjaWZpZWQgd2l0aCBjdXN0b20gQU1JLCB3ZSBjYW5ub3Qgc3BlY2lmeSBhbWlUeXBlLCBvciB0aGUgbm9kZSBncm91cCBkZXBsb3ltZW50IHdpbGwgZmFpbC5cbiAgICAgICAqIEFzIHdlIGRvbid0IGtub3cgaWYgdGhlIGN1c3RvbSBBTUkgaXMgc3BlY2lmaWVkIGluIHRoZSBsYXVjaFRlbXBsYXRlLCB3ZSBqdXN0IHVzZSBwcm9wcy5hbWlUeXBlLlxuICAgICAgICpcbiAgICAgICAqIENhc2UgMjogSWYgbGF1bmNoVGVtcGxhdGUgaXMgbm90IHNwZWNpZmllZCwgd2UgdHJ5IHRvIGRldGVybWluZSBhbWlUeXBlIGZyb20gdGhlIGluc3RhbmNlVHlwZXMgYW5kIGl0IGNvdWxkIGJlIGVpdGhlciBBTDIgb3IgQm90dGxlcm9ja2V0LlxuICAgICAgICogVG8gYXZvaWQgYnJlYWtpbmcgY2hhbmdlcywgd2UgdXNlIHBvc3NpYmxlQW1pVHlwZXNbMF0gaWYgYW1pVHlwZSBpcyB1bmRlZmluZWQgYW5kIG1ha2Ugc3VyZSBBTDIgaXMgYWx3YXlzIHRoZSBmaXJzdCBlbGVtZW50IGluIHBvc3NpYmxlQW1pVHlwZXNcbiAgICAgICAqIGFzIEFMMiBpcyBwcmV2aW91c2x5IHRoZSBgZXhwZWN0ZWRBbWlgIGFuZCB0aGlzIGF2b2lkcyBicmVha2luZyBjaGFuZ2VzLlxuICAgICAgICpcbiAgICAgICAqIFRoYXQgYmVpbmcgc2FpZCwgdXNlcnMgbm93IGVpdGhlciBoYXZlIHRvIGV4cGxpY2l0bHkgc3BlY2lmeSBjb3JyZWN0IGFtaVR5cGUgb3IganVzdCBsZWF2ZSBpdCB1bmRlZmluZWQuXG4gICAgICAgKi9cbiAgICAgIGFtaVR5cGU6IHByb3BzLmxhdW5jaFRlbXBsYXRlU3BlYyA/IHByb3BzLmFtaVR5cGUgOiAocHJvcHMuYW1pVHlwZSA/PyBwb3NzaWJsZUFtaVR5cGVzWzBdKSxcbiAgICAgIGNhcGFjaXR5VHlwZTogcHJvcHMuY2FwYWNpdHlUeXBlID8gcHJvcHMuY2FwYWNpdHlUeXBlLnZhbHVlT2YoKSA6IHVuZGVmaW5lZCxcbiAgICAgIGRpc2tTaXplOiBwcm9wcy5kaXNrU2l6ZSxcbiAgICAgIGZvcmNlVXBkYXRlRW5hYmxlZDogcHJvcHMuZm9yY2VVcGRhdGUgPz8gdHJ1ZSxcblxuICAgICAgLy8gbm90ZSB0aGF0IHdlIGRvbid0IGNoZWNrIGlmIGEgbGF1bmNoIHRlbXBsYXRlIGlzIGNvbmZpZ3VyZWQgaGVyZSAoZXZlbiB0aG91Z2ggaXQgbWlnaHQgY29uZmlndXJlIGluc3RhbmNlIHR5cGVzIGFzIHdlbGwpXG4gICAgICAvLyBiZWNhdXNlIHRoaXMgZG9lc24ndCBoYXZlIGEgZGVmYXVsdCB2YWx1ZSwgbWVhbmluZyB0aGUgdXNlciBoYWQgdG8gZXhwbGljaXRseSBjb25maWd1cmUgdGhpcy5cbiAgICAgIGluc3RhbmNlVHlwZXM6IGluc3RhbmNlVHlwZXM/Lm1hcCh0ID0+IHQudG9TdHJpbmcoKSksXG4gICAgICBsYWJlbHM6IHByb3BzLmxhYmVscyxcbiAgICAgIHRhaW50czogcHJvcHMudGFpbnRzLFxuICAgICAgbGF1bmNoVGVtcGxhdGU6IHByb3BzLmxhdW5jaFRlbXBsYXRlU3BlYyxcbiAgICAgIHJlbGVhc2VWZXJzaW9uOiBwcm9wcy5yZWxlYXNlVmVyc2lvbixcbiAgICAgIHJlbW90ZUFjY2VzczogcHJvcHMucmVtb3RlQWNjZXNzID8ge1xuICAgICAgICBlYzJTc2hLZXk6IHByb3BzLnJlbW90ZUFjY2Vzcy5zc2hLZXlOYW1lLFxuICAgICAgICBzb3VyY2VTZWN1cml0eUdyb3VwczogcHJvcHMucmVtb3RlQWNjZXNzLnNvdXJjZVNlY3VyaXR5R3JvdXBzID9cbiAgICAgICAgICBwcm9wcy5yZW1vdGVBY2Nlc3Muc291cmNlU2VjdXJpdHlHcm91cHMubWFwKG0gPT4gbS5zZWN1cml0eUdyb3VwSWQpIDogdW5kZWZpbmVkLFxuICAgICAgfSA6IHVuZGVmaW5lZCxcbiAgICAgIHNjYWxpbmdDb25maWc6IHtcbiAgICAgICAgZGVzaXJlZFNpemU6IHRoaXMuZGVzaXJlZFNpemUsXG4gICAgICAgIG1heFNpemU6IHRoaXMubWF4U2l6ZSxcbiAgICAgICAgbWluU2l6ZTogdGhpcy5taW5TaXplLFxuICAgICAgfSxcbiAgICAgIHRhZ3M6IHByb3BzLnRhZ3MsXG4gICAgICB1cGRhdGVDb25maWc6IHByb3BzLm1heFVuYXZhaWxhYmxlIHx8IHByb3BzLm1heFVuYXZhaWxhYmxlUGVyY2VudGFnZSA/IHtcbiAgICAgICAgbWF4VW5hdmFpbGFibGU6IHByb3BzLm1heFVuYXZhaWxhYmxlLFxuICAgICAgICBtYXhVbmF2YWlsYWJsZVBlcmNlbnRhZ2U6IHByb3BzLm1heFVuYXZhaWxhYmxlUGVyY2VudGFnZSxcbiAgICAgIH0gOiB1bmRlZmluZWQsXG4gICAgICBub2RlUmVwYWlyQ29uZmlnOiBwcm9wcy5lbmFibGVOb2RlQXV0b1JlcGFpciA/IHtcbiAgICAgICAgZW5hYmxlZDogcHJvcHMuZW5hYmxlTm9kZUF1dG9SZXBhaXIsXG4gICAgICB9IDogdW5kZWZpbmVkLFxuICAgIH0pO1xuXG4gICAgaWYgKHRoaXMuY2x1c3RlciBpbnN0YW5jZW9mIENsdXN0ZXIpIHtcbiAgICAgIC8vIHRoZSBjb250cm9sbGVyIHJ1bnMgb24gdGhlIHdvcmtlciBub2RlcyBzbyB0aGV5IGNhbm5vdFxuICAgICAgLy8gYmUgZGVsZXRlZCBiZWZvcmUgdGhlIGNvbnRyb2xsZXIuXG4gICAgICBpZiAodGhpcy5jbHVzdGVyLmFsYkNvbnRyb2xsZXIpIHtcbiAgICAgICAgTm9kZS5vZih0aGlzLmNsdXN0ZXIuYWxiQ29udHJvbGxlcikuYWRkRGVwZW5kZW5jeSh0aGlzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQVJOIG9mIHRoZSBub2RlZ3JvdXBcbiAgICpcbiAgICogQGF0dHJpYnV0ZVxuICAgKi9cbiAgQG1lbW9pemVkR2V0dGVyXG4gIHB1YmxpYyBnZXQgbm9kZWdyb3VwQXJuKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UmVzb3VyY2VBcm5BdHRyaWJ1dGUodGhpcy5yZXNvdXJjZS5hdHRyQXJuLCB7XG4gICAgICBzZXJ2aWNlOiAnZWtzJyxcbiAgICAgIHJlc291cmNlOiAnbm9kZWdyb3VwJyxcbiAgICAgIHJlc291cmNlTmFtZTogdGhpcy5waHlzaWNhbE5hbWUsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogTm9kZWdyb3VwIG5hbWVcbiAgICpcbiAgICogQGF0dHJpYnV0ZVxuICAgKi9cbiAgQG1lbW9pemVkR2V0dGVyXG4gIHB1YmxpYyBnZXQgbm9kZWdyb3VwTmFtZSgpOiBzdHJpbmcge1xuICAgIGlmIChGZWF0dXJlRmxhZ3Mub2YodGhpcykuaXNFbmFibGVkKGN4YXBpLkVLU19OT0RFR1JPVVBfTkFNRSkpIHtcbiAgICAgIHJldHVybiB0aGlzLmdldFJlc291cmNlTmFtZUF0dHJpYnV0ZSh0aGlzLnJlc291cmNlLmF0dHJOb2RlZ3JvdXBOYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0UmVzb3VyY2VOYW1lQXR0cmlidXRlKHRoaXMucmVzb3VyY2UucmVmKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHZhbGlkYXRlVXBkYXRlQ29uZmlnKG1heFVuYXZhaWxhYmxlPzogbnVtYmVyLCBtYXhVbmF2YWlsYWJsZVBlcmNlbnRhZ2U/OiBudW1iZXIpIHtcbiAgICBpZiAoIW1heFVuYXZhaWxhYmxlICYmICFtYXhVbmF2YWlsYWJsZVBlcmNlbnRhZ2UpIHJldHVybjtcbiAgICBpZiAobWF4VW5hdmFpbGFibGUgJiYgbWF4VW5hdmFpbGFibGVQZXJjZW50YWdlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ21heFVuYXZhaWxhYmxlIGFuZCBtYXhVbmF2YWlsYWJsZVBlcmNlbnRhZ2UgYXJlIG5vdCBhbGxvd2VkIHRvIGJlIGRlZmluZWQgdG9nZXRoZXInKTtcbiAgICB9XG4gICAgaWYgKG1heFVuYXZhaWxhYmxlUGVyY2VudGFnZSAmJiAobWF4VW5hdmFpbGFibGVQZXJjZW50YWdlIDwgMSB8fCBtYXhVbmF2YWlsYWJsZVBlcmNlbnRhZ2UgPiAxMDApKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYG1heFVuYXZhaWxhYmxlUGVyY2VudGFnZSBtdXN0IGJlIGJldHdlZW4gMSBhbmQgMTAwLCBnb3QgJHttYXhVbmF2YWlsYWJsZVBlcmNlbnRhZ2V9YCk7XG4gICAgfVxuICAgIGlmIChtYXhVbmF2YWlsYWJsZSkge1xuICAgICAgaWYgKG1heFVuYXZhaWxhYmxlID4gdGhpcy5tYXhTaXplKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgbWF4VW5hdmFpbGFibGUgbXVzdCBiZSBsb3dlciB0aGFuIG1heFNpemUgKCR7dGhpcy5tYXhTaXplfSksIGdvdCAke21heFVuYXZhaWxhYmxlfWApO1xuICAgICAgfVxuICAgICAgaWYgKG1heFVuYXZhaWxhYmxlIDwgMSB8fCBtYXhVbmF2YWlsYWJsZSA+IDEwMCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYG1heFVuYXZhaWxhYmxlIG11c3QgYmUgYmV0d2VlbiAxIGFuZCAxMDAsIGdvdCAke21heFVuYXZhaWxhYmxlfWApO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEFNSSB0eXBlcyBvZiBkaWZmZXJlbnQgYXJjaGl0ZWN0dXJlcy4gTWFrZSBzdXJlIEFMMiBpcyBhbHdheXMgdGhlIGZpcnN0IGVsZW1lbnQsIHdoaWNoIHdpbGwgYmUgdGhlIGRlZmF1bHRcbiAqIEFtaVR5cGUgaWYgYW1pVHlwZSBhbmQgbGF1bmNoVGVtcGxhdGVTcGVjIGFyZSBib3RoIHVuZGVmaW5lZC5cbiAqL1xuY29uc3QgYXJtNjRBbWlUeXBlczogTm9kZWdyb3VwQW1pVHlwZVtdID0gW1xuICBOb2RlZ3JvdXBBbWlUeXBlLkFMMl9BUk1fNjQsXG4gIE5vZGVncm91cEFtaVR5cGUuQUwyMDIzX0FSTV82NF9TVEFOREFSRCxcbiAgTm9kZWdyb3VwQW1pVHlwZS5CT1RUTEVST0NLRVRfQVJNXzY0LFxuXTtcbmNvbnN0IHg4NjY0QW1pVHlwZXM6IE5vZGVncm91cEFtaVR5cGVbXSA9IFtcbiAgTm9kZWdyb3VwQW1pVHlwZS5BTDJfWDg2XzY0LFxuICBOb2RlZ3JvdXBBbWlUeXBlLkFMMjAyM19YODZfNjRfU1RBTkRBUkQsXG4gIE5vZGVncm91cEFtaVR5cGUuQk9UVExFUk9DS0VUX1g4Nl82NCxcbiAgTm9kZWdyb3VwQW1pVHlwZS5XSU5ET1dTX0NPUkVfMjAxOV9YODZfNjQsXG4gIE5vZGVncm91cEFtaVR5cGUuV0lORE9XU19DT1JFXzIwMjJfWDg2XzY0LFxuICBOb2RlZ3JvdXBBbWlUeXBlLldJTkRPV1NfRlVMTF8yMDE5X1g4Nl82NCxcbiAgTm9kZWdyb3VwQW1pVHlwZS5XSU5ET1dTX0ZVTExfMjAyMl9YODZfNjQsXG5dO1xuY29uc3Qgd2luZG93c0FtaVR5cGVzOiBOb2RlZ3JvdXBBbWlUeXBlW10gPSBbXG4gIE5vZGVncm91cEFtaVR5cGUuV0lORE9XU19DT1JFXzIwMTlfWDg2XzY0LFxuICBOb2RlZ3JvdXBBbWlUeXBlLldJTkRPV1NfQ09SRV8yMDIyX1g4Nl82NCxcbiAgTm9kZWdyb3VwQW1pVHlwZS5XSU5ET1dTX0ZVTExfMjAxOV9YODZfNjQsXG4gIE5vZGVncm91cEFtaVR5cGUuV0lORE9XU19GVUxMXzIwMjJfWDg2XzY0LFxuXTtcbmNvbnN0IGdwdUFtaVR5cGVzOiBOb2RlZ3JvdXBBbWlUeXBlW10gPSBbXG4gIE5vZGVncm91cEFtaVR5cGUuQUwyX1g4Nl82NF9HUFUsXG4gIE5vZGVncm91cEFtaVR5cGUuQUwyMDIzX1g4Nl82NF9ORVVST04sXG4gIE5vZGVncm91cEFtaVR5cGUuQUwyMDIzX1g4Nl82NF9OVklESUEsXG4gIE5vZGVncm91cEFtaVR5cGUuQUwyMDIzX0FSTV82NF9OVklESUEsXG4gIE5vZGVncm91cEFtaVR5cGUuQk9UVExFUk9DS0VUX1g4Nl82NF9OVklESUEsXG4gIE5vZGVncm91cEFtaVR5cGUuQk9UVExFUk9DS0VUX0FSTV82NF9OVklESUEsXG5dO1xuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gY2hlY2sgaWYgdGhlIGluc3RhbmNlVHlwZSBpcyBzdXBwb3J0ZWQgYnkgV2luZG93cyBBTUkuXG4gKiBodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vZWtzL2xhdGVzdC91c2VyZ3VpZGUvd2luZG93cy1zdXBwb3J0Lmh0bWxcbiAqIEBwYXJhbSBpbnN0YW5jZVR5cGUgVGhlIEVDMiBpbnN0YW5jZSB0eXBlXG4gKi9cbmZ1bmN0aW9uIGlzV2luZG93c1N1cHBvcnRlZEluc3RhbmNlVHlwZShpbnN0YW5jZVR5cGU6IEluc3RhbmNlVHlwZSk6IGJvb2xlYW4ge1xuICAvLyBjb21wYXJlIGluc3RhbmNlVHlwZSB0byBmb3JiaWRkZW4gSW5zdGFuY2VUeXBlcyBmb3IgV2luZG93cy4gQWRkIGV4Y2VwdGlvbiBmb3IgbTZhLjE2eGxhcmdlLlxuICAvLyBOT1RFOiBpMiBpbnN0YW5jZSBjbGFzcyBpcyBub3QgcHJlc2VudCBpbiB0aGUgSW5zdGFuY2VDbGFzcyBlbnVtLlxuICBjb25zdCBmb3JiaWRkZW5JbnN0YW5jZUNsYXNzZXM6IEluc3RhbmNlQ2xhc3NbXSA9IFtJbnN0YW5jZUNsYXNzLkMzLCBJbnN0YW5jZUNsYXNzLkM0LCBJbnN0YW5jZUNsYXNzLkQyLCBJbnN0YW5jZUNsYXNzLk00LFxuICAgIEluc3RhbmNlQ2xhc3MuTTZBLCBJbnN0YW5jZUNsYXNzLlIzXTtcbiAgcmV0dXJuIGluc3RhbmNlVHlwZS50b1N0cmluZygpID09PSBJbnN0YW5jZVR5cGUub2YoSW5zdGFuY2VDbGFzcy5NNCwgSW5zdGFuY2VTaXplLlhMQVJHRTE2KS50b1N0cmluZygpIHx8XG4gICAgZm9yYmlkZGVuSW5zdGFuY2VDbGFzc2VzLmV2ZXJ5KChjKSA9PiAhaW5zdGFuY2VUeXBlLnNhbWVJbnN0YW5jZUNsYXNzQXMoSW5zdGFuY2VUeXBlLm9mKGMsIEluc3RhbmNlU2l6ZS5MQVJHRSkpICYmICFpbnN0YW5jZVR5cGUudG9TdHJpbmcoKS5tYXRjaCgvXmkyLykpO1xufVxuXG50eXBlIEFtaUFyY2hpdGVjdHVyZSA9IEluc3RhbmNlQXJjaGl0ZWN0dXJlIHwgJ0dQVSc7XG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gZXhhbWluZXMgdGhlIENQVSBhcmNoaXRlY3R1cmUgb2YgZXZlcnkgaW5zdGFuY2UgdHlwZSBhbmQgZGV0ZXJtaW5lc1xuICogd2hhdCBBTUkgdHlwZXMgYXJlIGNvbXBhdGlibGUgZm9yIGFsbCBvZiB0aGVtLiBpdCBlaXRoZXIgdGhyb3dzIG9yIHByb2R1Y2VzIGFuIGFycmF5IG9mIHBvc3NpYmxlIEFNSSB0eXBlcyBiZWNhdXNlXG4gKiBpbnN0YW5jZSB0eXBlcyBvZiBkaWZmZXJlbnQgQ1BVIGFyY2hpdGVjdHVyZXMgYXJlIG5vdCBzdXBwb3J0ZWQuXG4gKiBAcGFyYW0gaW5zdGFuY2VUeXBlcyBUaGUgaW5zdGFuY2UgdHlwZXNcbiAqIEByZXR1cm5zIE5vZGVncm91cEFtaVR5cGVbXVxuICovXG5mdW5jdGlvbiBnZXRQb3NzaWJsZUFtaVR5cGVzKGluc3RhbmNlVHlwZXM6IEluc3RhbmNlVHlwZVtdKTogTm9kZWdyb3VwQW1pVHlwZVtdIHtcbiAgZnVuY3Rpb24gdHlwZVRvQXJjaChpbnN0YW5jZVR5cGU6IEluc3RhbmNlVHlwZSk6IEFtaUFyY2hpdGVjdHVyZSB7XG4gICAgcmV0dXJuIGlzR3B1SW5zdGFuY2VUeXBlKGluc3RhbmNlVHlwZSkgPyAnR1BVJyA6IGluc3RhbmNlVHlwZS5hcmNoaXRlY3R1cmU7XG4gIH1cbiAgY29uc3QgYXJjaEFtaU1hcCA9IG5ldyBNYXA8QW1pQXJjaGl0ZWN0dXJlLCBOb2RlZ3JvdXBBbWlUeXBlW10+KFtcbiAgICBbSW5zdGFuY2VBcmNoaXRlY3R1cmUuQVJNXzY0LCBhcm02NEFtaVR5cGVzXSxcbiAgICBbSW5zdGFuY2VBcmNoaXRlY3R1cmUuWDg2XzY0LCB4ODY2NEFtaVR5cGVzXSxcbiAgICBbJ0dQVScsIGdwdUFtaVR5cGVzXSxcbiAgXSk7XG4gIGNvbnN0IGFyY2hpdGVjdHVyZXM6IFNldDxBbWlBcmNoaXRlY3R1cmU+ID0gbmV3IFNldChpbnN0YW5jZVR5cGVzLm1hcCh0eXBlVG9BcmNoKSk7XG5cbiAgaWYgKGFyY2hpdGVjdHVyZXMuc2l6ZSA9PT0gMCkgeyAvLyBwcm90ZWN0aXZlIGNvZGUsIHRoZSBjdXJyZW50IGltcGxlbWVudGF0aW9uIHdpbGwgbmV2ZXIgcmVzdWx0IGluIHRoaXMuXG4gICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgZGV0ZXJtaW5lIGFueSBhbWkgdHlwZSBjb21wYXRpYmxlIHdpdGggaW5zdGFuY2UgdHlwZXM6ICR7aW5zdGFuY2VUeXBlcy5tYXAoaSA9PiBpLnRvU3RyaW5nKCkpLmpvaW4oJywgJyl9YCk7XG4gIH1cblxuICBpZiAoYXJjaGl0ZWN0dXJlcy5zaXplID4gMSkge1xuICAgIHRocm93IG5ldyBFcnJvcignaW5zdGFuY2VUeXBlcyBvZiBkaWZmZXJlbnQgYXJjaGl0ZWN0dXJlcyBpcyBub3QgYWxsb3dlZCcpO1xuICB9XG5cbiAgcmV0dXJuIGFyY2hBbWlNYXAuZ2V0KEFycmF5LmZyb20oYXJjaGl0ZWN0dXJlcylbMF0pITtcbn1cbiJdfQ==