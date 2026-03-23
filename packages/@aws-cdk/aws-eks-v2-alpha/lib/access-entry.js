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
exports.AccessEntry = exports.AccessEntryType = exports.AccessPolicy = exports.AccessPolicyArn = exports.AccessScopeType = void 0;
const jsiiDeprecationWarnings = require("../.warnings.jsii.js");
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
const aws_eks_1 = require("aws-cdk-lib/aws-eks");
const core_1 = require("aws-cdk-lib/core");
const helpers_internal_1 = require("aws-cdk-lib/core/lib/helpers-internal");
const metadata_resource_1 = require("aws-cdk-lib/core/lib/metadata-resource");
const prop_injectable_1 = require("aws-cdk-lib/core/lib/prop-injectable");
/**
 * Represents the scope type of an access policy.
 *
 * The scope type determines the level of access granted by the policy.
 *
 * @export
 * @enum {string}
 */
var AccessScopeType;
(function (AccessScopeType) {
    /**
     * The policy applies to a specific namespace within the cluster.
     */
    AccessScopeType["NAMESPACE"] = "namespace";
    /**
     * The policy applies to the entire cluster.
     */
    AccessScopeType["CLUSTER"] = "cluster";
})(AccessScopeType || (exports.AccessScopeType = AccessScopeType = {}));
/**
 * Represents an Amazon EKS Access Policy ARN.
 *
 * Amazon EKS Access Policies are used to control access to Amazon EKS clusters.
 *
 * @see https://docs.aws.amazon.com/eks/latest/userguide/access-policies.html
 */
class AccessPolicyArn {
    policyName;
    static [JSII_RTTI_SYMBOL_1] = { fqn: "@aws-cdk/aws-eks-v2-alpha.AccessPolicyArn", version: "0.0.0" };
    /**
     * The Amazon EKS Admin Policy. This access policy includes permissions that grant an IAM principal
     * most permissions to resources. When associated to an access entry, its access scope is typically
     * one or more Kubernetes namespaces.
     */
    static AMAZON_EKS_ADMIN_POLICY = AccessPolicyArn.of('AmazonEKSAdminPolicy');
    /**
     * The Amazon EKS Cluster Admin Policy. This access policy includes permissions that grant an IAM
     * principal administrator access to a cluster. When associated to an access entry, its access scope
     * is typically the cluster, rather than a Kubernetes namespace.
     */
    static AMAZON_EKS_CLUSTER_ADMIN_POLICY = AccessPolicyArn.of('AmazonEKSClusterAdminPolicy');
    /**
     * The Amazon EKS Admin View Policy. This access policy includes permissions that grant an IAM principal
     * access to list/view all resources in a cluster.
     */
    static AMAZON_EKS_ADMIN_VIEW_POLICY = AccessPolicyArn.of('AmazonEKSAdminViewPolicy');
    /**
     * The Amazon EKS Edit Policy. This access policy includes permissions that allow an IAM principal
     * to edit most Kubernetes resources.
     */
    static AMAZON_EKS_EDIT_POLICY = AccessPolicyArn.of('AmazonEKSEditPolicy');
    /**
     * The Amazon EKS View Policy. This access policy includes permissions that grant an IAM principal
     * access to list/view all resources in a cluster.
     */
    static AMAZON_EKS_VIEW_POLICY = AccessPolicyArn.of('AmazonEKSViewPolicy');
    /**
     * Creates a new instance of the AccessPolicy class with the specified policy name.
     * @param policyName The name of the access policy.
     * @returns A new instance of the AccessPolicy class.
     */
    static of(policyName) { return new AccessPolicyArn(policyName); }
    /**
     * The Amazon Resource Name (ARN) of the access policy.
     */
    policyArn;
    /**
     * Constructs a new instance of the `AccessEntry` class.
     *
     * @param policyName - The name of the Amazon EKS access policy. This is used to construct the policy ARN.
     */
    constructor(policyName) {
        this.policyName = policyName;
        this.policyArn = `arn:${core_1.Aws.PARTITION}:eks::aws:cluster-access-policy/${policyName}`;
    }
}
exports.AccessPolicyArn = AccessPolicyArn;
/**
 * Represents an Amazon EKS Access Policy that implements the IAccessPolicy interface.
 *
 * @implements {IAccessPolicy}
 */
class AccessPolicy {
    static [JSII_RTTI_SYMBOL_1] = { fqn: "@aws-cdk/aws-eks-v2-alpha.AccessPolicy", version: "0.0.0" };
    /**
     * Import AccessPolicy by name.
     */
    static fromAccessPolicyName(policyName, options) {
        try {
            jsiiDeprecationWarnings._aws_cdk_aws_eks_v2_alpha_AccessPolicyNameOptions(options);
        }
        catch (error) {
            if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                Error.captureStackTrace(error, this.fromAccessPolicyName);
            }
            throw error;
        }
        class Import {
            policy = `arn:${core_1.Aws.PARTITION}:eks::aws:cluster-access-policy/${policyName}`;
            accessScope = {
                type: options.accessScopeType,
                namespaces: options.namespaces,
            };
        }
        return new Import();
    }
    /**
     * The scope of the access policy, which determines the level of access granted.
     */
    accessScope;
    /**
     * The access policy itself, which defines the specific permissions.
     */
    policy;
    /**
     * Constructs a new instance of the AccessPolicy class.
     *
     * @param {AccessPolicyProps} props - The properties for configuring the access policy.
     */
    constructor(props) {
        try {
            jsiiDeprecationWarnings._aws_cdk_aws_eks_v2_alpha_AccessPolicyProps(props);
        }
        catch (error) {
            if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                Error.captureStackTrace(error, AccessPolicy);
            }
            throw error;
        }
        this.accessScope = props.accessScope;
        this.policy = props.policy.policyArn;
    }
}
exports.AccessPolicy = AccessPolicy;
/**
 * Represents the different types of access entries that can be used in an Amazon EKS cluster.
 *
 * @enum {string}
 */
var AccessEntryType;
(function (AccessEntryType) {
    /**
     * Represents a standard access entry.
     */
    AccessEntryType["STANDARD"] = "STANDARD";
    /**
     * Represents a Fargate Linux access entry.
     */
    AccessEntryType["FARGATE_LINUX"] = "FARGATE_LINUX";
    /**
     * Represents an EC2 Linux access entry.
     */
    AccessEntryType["EC2_LINUX"] = "EC2_LINUX";
    /**
     * Represents an EC2 Windows access entry.
     */
    AccessEntryType["EC2_WINDOWS"] = "EC2_WINDOWS";
})(AccessEntryType || (exports.AccessEntryType = AccessEntryType = {}));
/**
 * Represents an access entry in an Amazon EKS cluster.
 *
 * An access entry defines the permissions and scope for a user or role to access an Amazon EKS cluster.
 *
 * @implements {IAccessEntry}
 * @resource AWS::EKS::AccessEntry
 */
let AccessEntry = (() => {
    let _classDecorators = [prop_injectable_1.propertyInjectable];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = core_1.Resource;
    let _instanceExtraInitializers = [];
    let _get_accessEntryName_decorators;
    let _get_accessEntryArn_decorators;
    let _addAccessPolicies_decorators;
    var AccessEntry = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _get_accessEntryName_decorators = [helpers_internal_1.memoizedGetter];
            _get_accessEntryArn_decorators = [helpers_internal_1.memoizedGetter];
            _addAccessPolicies_decorators = [(0, metadata_resource_1.MethodMetadata)()];
            __esDecorate(this, null, _get_accessEntryName_decorators, { kind: "getter", name: "accessEntryName", static: false, private: false, access: { has: obj => "accessEntryName" in obj, get: obj => obj.accessEntryName }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _get_accessEntryArn_decorators, { kind: "getter", name: "accessEntryArn", static: false, private: false, access: { has: obj => "accessEntryArn" in obj, get: obj => obj.accessEntryArn }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _addAccessPolicies_decorators, { kind: "method", name: "addAccessPolicies", static: false, private: false, access: { has: obj => "addAccessPolicies" in obj, get: obj => obj.addAccessPolicies }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AccessEntry = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        static [JSII_RTTI_SYMBOL_1] = { fqn: "@aws-cdk/aws-eks-v2-alpha.AccessEntry", version: "0.0.0" };
        /** Uniquely identifies this class. */
        static PROPERTY_INJECTION_ID = '@aws-cdk.aws-eks-v2-alpha.AccessEntry';
        /**
         * Imports an `AccessEntry` from its attributes.
         *
         * @param scope - The parent construct.
         * @param id - The ID of the imported construct.
         * @param attrs - The attributes of the access entry to import.
         * @returns The imported access entry.
         */
        static fromAccessEntryAttributes(scope, id, attrs) {
            try {
                jsiiDeprecationWarnings._aws_cdk_aws_eks_v2_alpha_AccessEntryAttributes(attrs);
            }
            catch (error) {
                if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                    Error.captureStackTrace(error, this.fromAccessEntryAttributes);
                }
                throw error;
            }
            class Import extends core_1.Resource {
                accessEntryName = attrs.accessEntryName;
                accessEntryArn = attrs.accessEntryArn;
            }
            return new Import(scope, id);
        }
        resource = __runInitializers(this, _instanceExtraInitializers);
        cluster;
        principal;
        accessPolicies;
        constructor(scope, id, props) {
            super(scope, id);
            try {
                jsiiDeprecationWarnings._aws_cdk_aws_eks_v2_alpha_AccessEntryProps(props);
            }
            catch (error) {
                if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                    Error.captureStackTrace(error, AccessEntry);
                }
                throw error;
            }
            // Enhanced CDK Analytics Telemetry
            (0, metadata_resource_1.addConstructMetadata)(this, props);
            this.cluster = props.cluster;
            this.principal = props.principal;
            this.accessPolicies = props.accessPolicies;
            this.resource = new aws_eks_1.CfnAccessEntry(this, 'Resource', {
                clusterName: this.cluster.clusterName,
                principalArn: this.principal,
                type: props.accessEntryType,
                accessPolicies: core_1.Lazy.any({
                    produce: () => this.accessPolicies.map(p => ({
                        accessScope: {
                            type: p.accessScope.type,
                            namespaces: p.accessScope.namespaces,
                        },
                        policyArn: p.policy,
                    })),
                }),
            });
        }
        get accessEntryName() {
            return this.getResourceNameAttribute(this.resource.ref);
        }
        get accessEntryArn() {
            return this.getResourceArnAttribute(this.resource.attrAccessEntryArn, {
                service: 'eks',
                resource: 'accessentry',
                resourceName: this.physicalName,
            });
        }
        /**
         * Add the access policies for this entry.
         * @param newAccessPolicies - The new access policies to add.
         */
        addAccessPolicies(newAccessPolicies) {
            // add newAccessPolicies to this.accessPolicies
            this.accessPolicies.push(...newAccessPolicies);
        }
        static {
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return AccessEntry = _classThis;
})();
exports.AccessEntry = AccessEntry;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjZXNzLWVudHJ5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYWNjZXNzLWVudHJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFxRDtBQUNyRCwyQ0FBa0U7QUFDbEUsNEVBQXVFO0FBQ3ZFLDhFQUE4RjtBQUM5RiwwRUFBMEU7QUF5QzFFOzs7Ozs7O0dBT0c7QUFDSCxJQUFZLGVBU1g7QUFURCxXQUFZLGVBQWU7SUFDekI7O09BRUc7SUFDSCwwQ0FBdUIsQ0FBQTtJQUN2Qjs7T0FFRztJQUNILHNDQUFtQixDQUFBO0FBQ3JCLENBQUMsRUFUVyxlQUFlLCtCQUFmLGVBQWUsUUFTMUI7QUF5QkQ7Ozs7OztHQU1HO0FBQ0gsTUFBYSxlQUFlO0lBaURFOztJQWhENUI7Ozs7T0FJRztJQUNJLE1BQU0sQ0FBVSx1QkFBdUIsR0FBRyxlQUFlLENBQUMsRUFBRSxDQUFDLHNCQUFzQixDQUFDLENBQUM7SUFFNUY7Ozs7T0FJRztJQUNJLE1BQU0sQ0FBVSwrQkFBK0IsR0FBRyxlQUFlLENBQUMsRUFBRSxDQUFDLDZCQUE2QixDQUFDLENBQUM7SUFFM0c7OztPQUdHO0lBQ0ksTUFBTSxDQUFVLDRCQUE0QixHQUFHLGVBQWUsQ0FBQyxFQUFFLENBQUMsMEJBQTBCLENBQUMsQ0FBQztJQUVyRzs7O09BR0c7SUFDSSxNQUFNLENBQVUsc0JBQXNCLEdBQUcsZUFBZSxDQUFDLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0lBRTFGOzs7T0FHRztJQUNJLE1BQU0sQ0FBVSxzQkFBc0IsR0FBRyxlQUFlLENBQUMsRUFBRSxDQUFDLHFCQUFxQixDQUFDLENBQUM7SUFFMUY7Ozs7T0FJRztJQUNJLE1BQU0sQ0FBQyxFQUFFLENBQUMsVUFBa0IsSUFBSSxPQUFPLElBQUksZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUU7SUFFaEY7O09BRUc7SUFDYSxTQUFTLENBQVM7SUFD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ay1saWIvYXdzLWVrcyc7XG5pbXBvcnQgeyBSZXNvdXJjZSwgSVJlc291cmNlLCBBd3MsIExhenkgfSBmcm9tICdhd3MtY2RrLWxpYi9jb3JlJztcbmltcG9ydCB7IG1lbW9pemVkR2V0dGVyIH0gZnJvbSAnYXdzLWNkay1saWIvY29yZS9saWIvaGVscGVycy1pbnRlcm5hbCc7XG5pbXBvcnQgeyBNZXRob2RNZXRhZGF0YSwgYWRkQ29uc3RydWN0TWV0YWRhdGEgfSBmcm9tICdhd3MtY2RrLWxpYi9jb3JlL2xpYi9tZXRhZGF0YS1yZXNvdXJjZSc7XG5pbXBvcnQgeyBwcm9wZXJ0eUluamVjdGFibGUgfSBmcm9tICdhd3MtY2RrLWxpYi9jb3JlL2xpYi9wcm9wLWluamVjdGFibGUnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgeyBJQ2x1c3RlciB9IGZyb20gJy4vY2x1c3Rlcic7XG5cbi8qKlxuICogUmVwcmVzZW50cyBhbiBhY2Nlc3MgZW50cnkgaW4gYW4gQW1hem9uIEVLUyBjbHVzdGVyLlxuICpcbiAqIEFuIGFjY2VzcyBlbnRyeSBkZWZpbmVzIHRoZSBwZXJtaXNzaW9ucyBhbmQgc2NvcGUgZm9yIGEgdXNlciBvciByb2xlIHRvIGFjY2VzcyBhbiBBbWF6b24gRUtTIGNsdXN0ZXIuXG4gKlxuICogQGludGVyZmFjZSBJQWNjZXNzRW50cnlcbiAqIEBleHRlbmRzIHtJUmVzb3VyY2V9XG4gKiBAcHJvcGVydHkge3N0cmluZ30gYWNjZXNzRW50cnlOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIGFjY2VzcyBlbnRyeS5cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBhY2Nlc3NFbnRyeUFybiAtIFRoZSBBbWF6b24gUmVzb3VyY2UgTmFtZSAoQVJOKSBvZiB0aGUgYWNjZXNzIGVudHJ5LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIElBY2Nlc3NFbnRyeSBleHRlbmRzIElSZXNvdXJjZSB7XG4gIC8qKlxuICAgKiBUaGUgbmFtZSBvZiB0aGUgYWNjZXNzIGVudHJ5LlxuICAgKiBAYXR0cmlidXRlXG4gICAqL1xuICByZWFkb25seSBhY2Nlc3NFbnRyeU5hbWU6IHN0cmluZztcbiAgLyoqXG4gICAqIFRoZSBBbWF6b24gUmVzb3VyY2UgTmFtZSAoQVJOKSBvZiB0aGUgYWNjZXNzIGVudHJ5LlxuICAgKiBAYXR0cmlidXRlXG4gICAqL1xuICByZWFkb25seSBhY2Nlc3NFbnRyeUFybjogc3RyaW5nO1xufVxuXG4vKipcbiAqIFJlcHJlc2VudHMgdGhlIGF0dHJpYnV0ZXMgb2YgYW4gYWNjZXNzIGVudHJ5LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEFjY2Vzc0VudHJ5QXR0cmlidXRlcyB7XG4gIC8qKlxuICAgKiBUaGUgbmFtZSBvZiB0aGUgYWNjZXNzIGVudHJ5LlxuICAgKi9cbiAgcmVhZG9ubHkgYWNjZXNzRW50cnlOYW1lOiBzdHJpbmc7XG4gIC8qKlxuICAgKiBUaGUgQW1hem9uIFJlc291cmNlIE5hbWUgKEFSTikgb2YgdGhlIGFjY2VzcyBlbnRyeS5cbiAgICovXG4gIHJlYWRvbmx5IGFjY2Vzc0VudHJ5QXJuOiBzdHJpbmc7XG59XG5cbi8qKlxuICogUmVwcmVzZW50cyB0aGUgc2NvcGUgdHlwZSBvZiBhbiBhY2Nlc3MgcG9saWN5LlxuICpcbiAqIFRoZSBzY29wZSB0eXBlIGRldGVybWluZXMgdGhlIGxldmVsIG9mIGFjY2VzcyBncmFudGVkIGJ5IHRoZSBwb2xpY3kuXG4gKlxuICogQGV4cG9ydFxuICogQGVudW0ge3N0cmluZ31cbiAqL1xuZXhwb3J0IGVudW0gQWNjZXNzU2NvcGVUeXBlIHtcbiAgLyoqXG4gICAqIFRoZSBwb2xpY3kgYXBwbGllcyB0byBhIHNwZWNpZmljIG5hbWVzcGFjZSB3aXRoaW4gdGhlIGNsdXN0ZXIuXG4gICAqL1xuICBOQU1FU1BBQ0UgPSAnbmFtZXNwYWNlJyxcbiAgLyoqXG4gICAqIFRoZSBwb2xpY3kgYXBwbGllcyB0byB0aGUgZW50aXJlIGNsdXN0ZXIuXG4gICAqL1xuICBDTFVTVEVSID0gJ2NsdXN0ZXInLFxufVxuXG4vKipcbiAqIFJlcHJlc2VudHMgdGhlIHNjb3BlIG9mIGFuIGFjY2VzcyBwb2xpY3kuXG4gKlxuICogVGhlIHNjb3BlIGRlZmluZXMgdGhlIG5hbWVzcGFjZXMgb3IgY2x1c3Rlci1sZXZlbCBhY2Nlc3MgZ3JhbnRlZCBieSB0aGUgcG9saWN5LlxuICpcbiAqIEBpbnRlcmZhY2UgQWNjZXNzU2NvcGVcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nW119IFtuYW1lc3BhY2VzXSAtIFRoZSBuYW1lc3BhY2VzIHRvIHdoaWNoIHRoZSBwb2xpY3kgYXBwbGllcywgaWYgdGhlIHNjb3BlIHR5cGUgaXMgJ25hbWVzcGFjZScuXG4gKiBAcHJvcGVydHkge0FjY2Vzc1Njb3BlVHlwZX0gdHlwZSAtIFRoZSBzY29wZSB0eXBlIG9mIHRoZSBwb2xpY3ksIGVpdGhlciAnbmFtZXNwYWNlJyBvciAnY2x1c3RlcicuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQWNjZXNzU2NvcGUge1xuICAvKipcbiAgICogQSBLdWJlcm5ldGVzIG5hbWVzcGFjZSB0aGF0IGFuIGFjY2VzcyBwb2xpY3kgaXMgc2NvcGVkIHRvLiBBIHZhbHVlIGlzIHJlcXVpcmVkIGlmIHlvdSBzcGVjaWZpZWRcbiAgICogbmFtZXNwYWNlIGZvciBUeXBlLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIG5vIHNwZWNpZmljIG5hbWVzcGFjZXMgZm9yIHRoaXMgc2NvcGUuXG4gICAqL1xuICByZWFkb25seSBuYW1lc3BhY2VzPzogc3RyaW5nW107XG4gIC8qKlxuICAgKiBUaGUgc2NvcGUgdHlwZSBvZiB0aGUgcG9saWN5LCBlaXRoZXIgJ25hbWVzcGFjZScgb3IgJ2NsdXN0ZXInLlxuICAgKi9cbiAgcmVhZG9ubHkgdHlwZTogQWNjZXNzU2NvcGVUeXBlO1xufVxuXG4vKipcbiAqIFJlcHJlc2VudHMgYW4gQW1hem9uIEVLUyBBY2Nlc3MgUG9saWN5IEFSTi5cbiAqXG4gKiBBbWF6b24gRUtTIEFjY2VzcyBQb2xpY2llcyBhcmUgdXNlZCB0byBjb250cm9sIGFjY2VzcyB0byBBbWF6b24gRUtTIGNsdXN0ZXJzLlxuICpcbiAqIEBzZWUgaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL2Vrcy9sYXRlc3QvdXNlcmd1aWRlL2FjY2Vzcy1wb2xpY2llcy5odG1sXG4gKi9cbmV4cG9ydCBjbGFzcyBBY2Nlc3NQb2xpY3lBcm4ge1xuICAvKipcbiAgICogVGhlIEFtYXpvbiBFS1MgQWRtaW4gUG9saWN5LiBUaGlzIGFjY2VzcyBwb2xpY3kgaW5jbHVkZXMgcGVybWlzc2lvbnMgdGhhdCBncmFudCBhbiBJQU0gcHJpbmNpcGFsXG4gICAqIG1vc3QgcGVybWlzc2lvbnMgdG8gcmVzb3VyY2VzLiBXaGVuIGFzc29jaWF0ZWQgdG8gYW4gYWNjZXNzIGVudHJ5LCBpdHMgYWNjZXNzIHNjb3BlIGlzIHR5cGljYWxseVxuICAgKiBvbmUgb3IgbW9yZSBLdWJlcm5ldGVzIG5hbWVzcGFjZXMuXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IEFNQVpPTl9FS1NfQURNSU5fUE9MSUNZID0gQWNjZXNzUG9saWN5QXJuLm9mKCdBbWF6b25FS1NBZG1pblBvbGljeScpO1xuXG4gIC8qKlxuICAgKiBUaGUgQW1hem9uIEVLUyBDbHVzdGVyIEFkbWluIFBvbGljeS4gVGhpcyBhY2Nlc3MgcG9saWN5IGluY2x1ZGVzIHBlcm1pc3Npb25zIHRoYXQgZ3JhbnQgYW4gSUFNXG4gICAqIHByaW5jaXBhbCBhZG1pbmlzdHJhdG9yIGFjY2VzcyB0byBhIGNsdXN0ZXIuIFdoZW4gYXNzb2NpYXRlZCB0byBhbiBhY2Nlc3MgZW50cnksIGl0cyBhY2Nlc3Mgc2NvcGVcbiAgICogaXMgdHlwaWNhbGx5IHRoZSBjbHVzdGVyLCByYXRoZXIgdGhhbiBhIEt1YmVybmV0ZXMgbmFtZXNwYWNlLlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBBTUFaT05fRUtTX0NMVVNURVJfQURNSU5fUE9MSUNZID0gQWNjZXNzUG9saWN5QXJuLm9mKCdBbWF6b25FS1NDbHVzdGVyQWRtaW5Qb2xpY3knKTtcblxuICAvKipcbiAgICogVGhlIEFtYXpvbiBFS1MgQWRtaW4gVmlldyBQb2xpY3kuIFRoaXMgYWNjZXNzIHBvbGljeSBpbmNsdWRlcyBwZXJtaXNzaW9ucyB0aGF0IGdyYW50IGFuIElBTSBwcmluY2lwYWxcbiAgICogYWNjZXNzIHRvIGxpc3QvdmlldyBhbGwgcmVzb3VyY2VzIGluIGEgY2x1c3Rlci5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgQU1BWk9OX0VLU19BRE1JTl9WSUVXX1BPTElDWSA9IEFjY2Vzc1BvbGljeUFybi5vZignQW1hem9uRUtTQWRtaW5WaWV3UG9saWN5Jyk7XG5cbiAgLyoqXG4gICAqIFRoZSBBbWF6b24gRUtTIEVkaXQgUG9saWN5LiBUaGlzIGFjY2VzcyBwb2xpY3kgaW5jbHVkZXMgcGVybWlzc2lvbnMgdGhhdCBhbGxvdyBhbiBJQU0gcHJpbmNpcGFsXG4gICAqIHRvIGVkaXQgbW9zdCBLdWJlcm5ldGVzIHJlc291cmNlcy5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgQU1BWk9OX0VLU19FRElUX1BPTElDWSA9IEFjY2Vzc1BvbGljeUFybi5vZignQW1hem9uRUtTRWRpdFBvbGljeScpO1xuXG4gIC8qKlxuICAgKiBUaGUgQW1hem9uIEVLUyBWaWV3IFBvbGljeS4gVGhpcyBhY2Nlc3MgcG9saWN5IGluY2x1ZGVzIHBlcm1pc3Npb25zIHRoYXQgZ3JhbnQgYW4gSUFNIHByaW5jaXBhbFxuICAgKiBhY2Nlc3MgdG8gbGlzdC92aWV3IGFsbCByZXNvdXJjZXMgaW4gYSBjbHVzdGVyLlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBBTUFaT05fRUtTX1ZJRVdfUE9MSUNZID0gQWNjZXNzUG9saWN5QXJuLm9mKCdBbWF6b25FS1NWaWV3UG9saWN5Jyk7XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIEFjY2Vzc1BvbGljeSBjbGFzcyB3aXRoIHRoZSBzcGVjaWZpZWQgcG9saWN5IG5hbWUuXG4gICAqIEBwYXJhbSBwb2xpY3lOYW1lIFRoZSBuYW1lIG9mIHRoZSBhY2Nlc3MgcG9saWN5LlxuICAgKiBAcmV0dXJucyBBIG5ldyBpbnN0YW5jZSBvZiB0aGUgQWNjZXNzUG9saWN5IGNsYXNzLlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBvZihwb2xpY3lOYW1lOiBzdHJpbmcpIHsgcmV0dXJuIG5ldyBBY2Nlc3NQb2xpY3lBcm4ocG9saWN5TmFtZSk7IH1cblxuICAvKipcbiAgICogVGhlIEFtYXpvbiBSZXNvdXJjZSBOYW1lIChBUk4pIG9mIHRoZSBhY2Nlc3MgcG9saWN5LlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IHBvbGljeUFybjogc3RyaW5nO1xuICAvKipcbiAgICogQ29uc3RydWN0cyBhIG5ldyBpbnN0YW5jZSBvZiB0aGUgYEFjY2Vzc0VudHJ5YCBjbGFzcy5cbiAgICpcbiAgICogQHBhcmFtIHBvbGljeU5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgQW1hem9uIEVLUyBhY2Nlc3MgcG9saWN5LiBUaGlzIGlzIHVzZWQgdG8gY29uc3RydWN0IHRoZSBwb2xpY3kgQVJOLlxuICAgKi9cbiAgY29uc3RydWN0b3IocHVibGljIHJlYWRvbmx5IHBvbGljeU5hbWU6IHN0cmluZykge1xuICAgIHRoaXMucG9saWN5QXJuID0gYGFybjoke0F3cy5QQVJUSVRJT059OmVrczo6YXdzOmNsdXN0ZXItYWNjZXNzLXBvbGljeS8ke3BvbGljeU5hbWV9YDtcbiAgfVxufVxuXG4vKipcbiAqIFJlcHJlc2VudHMgYW4gYWNjZXNzIHBvbGljeSB0aGF0IGRlZmluZXMgdGhlIHBlcm1pc3Npb25zIGFuZCBzY29wZSBmb3IgYSB1c2VyIG9yIHJvbGUgdG8gYWNjZXNzIGFuIEFtYXpvbiBFS1MgY2x1c3Rlci5cbiAqXG4gKiBAaW50ZXJmYWNlIElBY2Nlc3NQb2xpY3lcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBJQWNjZXNzUG9saWN5IHtcbiAgLyoqXG4gICAqIFRoZSBzY29wZSBvZiB0aGUgYWNjZXNzIHBvbGljeSwgd2hpY2ggZGV0ZXJtaW5lcyB0aGUgbGV2ZWwgb2YgYWNjZXNzIGdyYW50ZWQuXG4gICAqL1xuICByZWFkb25seSBhY2Nlc3NTY29wZTogQWNjZXNzU2NvcGU7XG4gIC8qKlxuICAgKiBUaGUgYWNjZXNzIHBvbGljeSBpdHNlbGYsIHdoaWNoIGRlZmluZXMgdGhlIHNwZWNpZmljIHBlcm1pc3Npb25zLlxuICAgKi9cbiAgcmVhZG9ubHkgcG9saWN5OiBzdHJpbmc7XG59XG5cbi8qKlxuICogUHJvcGVydGllcyBmb3IgY29uZmlndXJpbmcgYW4gQW1hem9uIEVLUyBBY2Nlc3MgUG9saWN5LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEFjY2Vzc1BvbGljeVByb3BzIHtcbiAgLyoqXG4gICAqIFRoZSBzY29wZSBvZiB0aGUgYWNjZXNzIHBvbGljeSwgd2hpY2ggZGV0ZXJtaW5lcyB0aGUgbGV2ZWwgb2YgYWNjZXNzIGdyYW50ZWQuXG4gICAqL1xuICByZWFkb25seSBhY2Nlc3NTY29wZTogQWNjZXNzU2NvcGU7XG4gIC8qKlxuICAgKiBUaGUgYWNjZXNzIHBvbGljeSBpdHNlbGYsIHdoaWNoIGRlZmluZXMgdGhlIHNwZWNpZmljIHBlcm1pc3Npb25zLlxuICAgKi9cbiAgcmVhZG9ubHkgcG9saWN5OiBBY2Nlc3NQb2xpY3lBcm47XG59XG5cbi8qKlxuICogUmVwcmVzZW50cyB0aGUgb3B0aW9ucyByZXF1aXJlZCB0byBjcmVhdGUgYW4gQW1hem9uIEVLUyBBY2Nlc3MgUG9saWN5IHVzaW5nIHRoZSBgZnJvbUFjY2Vzc1BvbGljeU5hbWUoKWAgbWV0aG9kLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEFjY2Vzc1BvbGljeU5hbWVPcHRpb25zIHtcbiAgLyoqXG4gICAqIFRoZSBzY29wZSBvZiB0aGUgYWNjZXNzIHBvbGljeS4gVGhpcyBkZXRlcm1pbmVzIHRoZSBsZXZlbCBvZiBhY2Nlc3MgZ3JhbnRlZCBieSB0aGUgcG9saWN5LlxuICAgKi9cbiAgcmVhZG9ubHkgYWNjZXNzU2NvcGVUeXBlOiBBY2Nlc3NTY29wZVR5cGU7XG4gIC8qKlxuICAgKiBBbiBvcHRpb25hbCBhcnJheSBvZiBLdWJlcm5ldGVzIG5hbWVzcGFjZXMgdG8gd2hpY2ggdGhlIGFjY2VzcyBwb2xpY3kgYXBwbGllcy5cbiAgICogQGRlZmF1bHQgLSBubyBzcGVjaWZpYyBuYW1lc3BhY2VzIGZvciB0aGlzIHNjb3BlXG4gICAqL1xuICByZWFkb25seSBuYW1lc3BhY2VzPzogc3RyaW5nW107XG59XG5cbi8qKlxuICogUmVwcmVzZW50cyBhbiBBbWF6b24gRUtTIEFjY2VzcyBQb2xpY3kgdGhhdCBpbXBsZW1lbnRzIHRoZSBJQWNjZXNzUG9saWN5IGludGVyZmFjZS5cbiAqXG4gKiBAaW1wbGVtZW50cyB7SUFjY2Vzc1BvbGljeX1cbiAqL1xuZXhwb3J0IGNsYXNzIEFjY2Vzc1BvbGljeSBpbXBsZW1lbnRzIElBY2Nlc3NQb2xpY3kge1xuICAvKipcbiAgICogSW1wb3J0IEFjY2Vzc1BvbGljeSBieSBuYW1lLlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBmcm9tQWNjZXNzUG9saWN5TmFtZShwb2xpY3lOYW1lOiBzdHJpbmcsIG9wdGlvbnM6IEFjY2Vzc1BvbGljeU5hbWVPcHRpb25zKTogSUFjY2Vzc1BvbGljeSB7XG4gICAgY2xhc3MgSW1wb3J0IGltcGxlbWVudHMgSUFjY2Vzc1BvbGljeSB7XG4gICAgICBwdWJsaWMgcmVhZG9ubHkgcG9saWN5ID0gYGFybjoke0F3cy5QQVJUSVRJT059OmVrczo6YXdzOmNsdXN0ZXItYWNjZXNzLXBvbGljeS8ke3BvbGljeU5hbWV9YDtcbiAgICAgIHB1YmxpYyByZWFkb25seSBhY2Nlc3NTY29wZTogQWNjZXNzU2NvcGUgPSB7XG4gICAgICAgIHR5cGU6IG9wdGlvbnMuYWNjZXNzU2NvcGVUeXBlLFxuICAgICAgICBuYW1lc3BhY2VzOiBvcHRpb25zLm5hbWVzcGFjZXMsXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gbmV3IEltcG9ydCgpO1xuICB9XG4gIC8qKlxuICAgKiBUaGUgc2NvcGUgb2YgdGhlIGFjY2VzcyBwb2xpY3ksIHdoaWNoIGRldGVybWluZXMgdGhlIGxldmVsIG9mIGFjY2VzcyBncmFudGVkLlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IGFjY2Vzc1Njb3BlOiBBY2Nlc3NTY29wZTtcblxuICAvKipcbiAgICogVGhlIGFjY2VzcyBwb2xpY3kgaXRzZWxmLCB3aGljaCBkZWZpbmVzIHRoZSBzcGVjaWZpYyBwZXJtaXNzaW9ucy5cbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBwb2xpY3k6IHN0cmluZztcblxuICAvKipcbiAgICogQ29uc3RydWN0cyBhIG5ldyBpbnN0YW5jZSBvZiB0aGUgQWNjZXNzUG9saWN5IGNsYXNzLlxuICAgKlxuICAgKiBAcGFyYW0ge0FjY2Vzc1BvbGljeVByb3BzfSBwcm9wcyAtIFRoZSBwcm9wZXJ0aWVzIGZvciBjb25maWd1cmluZyB0aGUgYWNjZXNzIHBvbGljeS5cbiAgICovXG4gIGNvbnN0cnVjdG9yKHByb3BzOiBBY2Nlc3NQb2xpY3lQcm9wcykge1xuICAgIHRoaXMuYWNjZXNzU2NvcGUgPSBwcm9wcy5hY2Nlc3NTY29wZTtcbiAgICB0aGlzLnBvbGljeSA9IHByb3BzLnBvbGljeS5wb2xpY3lBcm47XG4gIH1cbn1cblxuLyoqXG4gKiBSZXByZXNlbnRzIHRoZSBkaWZmZXJlbnQgdHlwZXMgb2YgYWNjZXNzIGVudHJpZXMgdGhhdCBjYW4gYmUgdXNlZCBpbiBhbiBBbWF6b24gRUtTIGNsdXN0ZXIuXG4gKlxuICogQGVudW0ge3N0cmluZ31cbiAqL1xuZXhwb3J0IGVudW0gQWNjZXNzRW50cnlUeXBlIHtcbiAgLyoqXG4gICAqIFJlcHJlc2VudHMgYSBzdGFuZGFyZCBhY2Nlc3MgZW50cnkuXG4gICAqL1xuICBTVEFOREFSRCA9ICdTVEFOREFSRCcsXG5cbiAgLyoqXG4gICAqIFJlcHJlc2VudHMgYSBGYXJnYXRlIExpbnV4IGFjY2VzcyBlbnRyeS5cbiAgICovXG4gIEZBUkdBVEVfTElOVVggPSAnRkFSR0FURV9MSU5VWCcsXG5cbiAgLyoqXG4gICAqIFJlcHJlc2VudHMgYW4gRUMyIExpbnV4IGFjY2VzcyBlbnRyeS5cbiAgICovXG4gIEVDMl9MSU5VWCA9ICdFQzJfTElOVVgnLFxuXG4gIC8qKlxuICAgKiBSZXByZXNlbnRzIGFuIEVDMiBXaW5kb3dzIGFjY2VzcyBlbnRyeS5cbiAgICovXG4gIEVDMl9XSU5ET1dTID0gJ0VDMl9XSU5ET1dTJyxcbn1cblxuLyoqXG4gKiBSZXByZXNlbnRzIHRoZSBwcm9wZXJ0aWVzIHJlcXVpcmVkIHRvIGNyZWF0ZSBhbiBBbWF6b24gRUtTIGFjY2VzcyBlbnRyeS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBY2Nlc3NFbnRyeVByb3BzIHtcbiAgLyoqXG4gICAqIFRoZSBuYW1lIG9mIHRoZSBBY2Nlc3NFbnRyeS5cbiAgICpcbiAgICogQGRlZmF1bHQgLSBObyBhY2Nlc3MgZW50cnkgbmFtZSBpcyBwcm92aWRlZFxuICAgKi9cbiAgcmVhZG9ubHkgYWNjZXNzRW50cnlOYW1lPzogc3RyaW5nO1xuICAvKipcbiAgICogVGhlIHR5cGUgb2YgdGhlIEFjY2Vzc0VudHJ5LlxuICAgKlxuICAgKiBAZGVmYXVsdCBTVEFOREFSRFxuICAgKi9cbiAgcmVhZG9ubHkgYWNjZXNzRW50cnlUeXBlPzogQWNjZXNzRW50cnlUeXBlO1xuICAvKipcbiAgICogVGhlIEFtYXpvbiBFS1MgY2x1c3RlciB0byB3aGljaCB0aGUgYWNjZXNzIGVudHJ5IGFwcGxpZXMuXG4gICAqL1xuICByZWFkb25seSBjbHVzdGVyOiBJQ2x1c3RlcjtcbiAgLyoqXG4gICAqIFRoZSBhY2Nlc3MgcG9saWNpZXMgdGhhdCBkZWZpbmUgdGhlIHBlcm1pc3Npb25zIGFuZCBzY29wZSBmb3IgdGhlIGFjY2VzcyBlbnRyeS5cbiAgICovXG4gIHJlYWRvbmx5IGFjY2Vzc1BvbGljaWVzOiBJQWNjZXNzUG9saWN5W107XG4gIC8qKlxuICAgKiBUaGUgQW1hem9uIFJlc291cmNlIE5hbWUgKEFSTikgb2YgdGhlIHByaW5jaXBhbCAodXNlciBvciByb2xlKSB0byBhc3NvY2lhdGUgdGhlIGFjY2VzcyBlbnRyeSB3aXRoLlxuICAgKi9cbiAgcmVhZG9ubHkgcHJpbmNpcGFsOiBzdHJpbmc7XG59XG5cbi8qKlxuICogUmVwcmVzZW50cyBhbiBhY2Nlc3MgZW50cnkgaW4gYW4gQW1hem9uIEVLUyBjbHVzdGVyLlxuICpcbiAqIEFuIGFjY2VzcyBlbnRyeSBkZWZpbmVzIHRoZSBwZXJtaXNzaW9ucyBhbmQgc2NvcGUgZm9yIGEgdXNlciBvciByb2xlIHRvIGFjY2VzcyBhbiBBbWF6b24gRUtTIGNsdXN0ZXIuXG4gKlxuICogQGltcGxlbWVudHMge0lBY2Nlc3NFbnRyeX1cbiAqIEByZXNvdXJjZSBBV1M6OkVLUzo6QWNjZXNzRW50cnlcbiAqL1xuQHByb3BlcnR5SW5qZWN0YWJsZVxuZXhwb3J0IGNsYXNzIEFjY2Vzc0VudHJ5IGV4dGVuZHMgUmVzb3VyY2UgaW1wbGVtZW50cyBJQWNjZXNzRW50cnkge1xuICAvKiogVW5pcXVlbHkgaWRlbnRpZmllcyB0aGlzIGNsYXNzLiAqL1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFBST1BFUlRZX0lOSkVDVElPTl9JRDogc3RyaW5nID0gJ0Bhd3MtY2RrLmF3cy1la3MtdjItYWxwaGEuQWNjZXNzRW50cnknO1xuXG4gIC8qKlxuICAgKiBJbXBvcnRzIGFuIGBBY2Nlc3NFbnRyeWAgZnJvbSBpdHMgYXR0cmlidXRlcy5cbiAgICpcbiAgICogQHBhcmFtIHNjb3BlIC0gVGhlIHBhcmVudCBjb25zdHJ1Y3QuXG4gICAqIEBwYXJhbSBpZCAtIFRoZSBJRCBvZiB0aGUgaW1wb3J0ZWQgY29uc3RydWN0LlxuICAgKiBAcGFyYW0gYXR0cnMgLSBUaGUgYXR0cmlidXRlcyBvZiB0aGUgYWNjZXNzIGVudHJ5IHRvIGltcG9ydC5cbiAgICogQHJldHVybnMgVGhlIGltcG9ydGVkIGFjY2VzcyBlbnRyeS5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgZnJvbUFjY2Vzc0VudHJ5QXR0cmlidXRlcyhzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBhdHRyczogQWNjZXNzRW50cnlBdHRyaWJ1dGVzKTogSUFjY2Vzc0VudHJ5IHtcbiAgICBjbGFzcyBJbXBvcnQgZXh0ZW5kcyBSZXNvdXJjZSBpbXBsZW1lbnRzIElBY2Nlc3NFbnRyeSB7XG4gICAgICBwdWJsaWMgcmVhZG9ubHkgYWNjZXNzRW50cnlOYW1lID0gYXR0cnMuYWNjZXNzRW50cnlOYW1lO1xuICAgICAgcHVibGljIHJlYWRvbmx5IGFjY2Vzc0VudHJ5QXJuID0gYXR0cnMuYWNjZXNzRW50cnlBcm47XG4gICAgfVxuICAgIHJldHVybiBuZXcgSW1wb3J0KHNjb3BlLCBpZCk7XG4gIH1cbiAgcHJpdmF0ZSByZXNvdXJjZTogQ2ZuQWNjZXNzRW50cnk7XG4gIHByaXZhdGUgY2x1c3RlcjogSUNsdXN0ZXI7XG4gIHByaXZhdGUgcHJpbmNpcGFsOiBzdHJpbmc7XG4gIHByaXZhdGUgYWNjZXNzUG9saWNpZXM6IElBY2Nlc3NQb2xpY3lbXTtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogQWNjZXNzRW50cnlQcm9wcyApIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuICAgIC8vIEVuaGFuY2VkIENESyBBbmFseXRpY3MgVGVsZW1ldHJ5XG4gICAgYWRkQ29uc3RydWN0TWV0YWRhdGEodGhpcywgcHJvcHMpO1xuXG4gICAgdGhpcy5jbHVzdGVyID0gcHJvcHMuY2x1c3RlcjtcbiAgICB0aGlzLnByaW5jaXBhbCA9IHByb3BzLnByaW5jaXBhbDtcbiAgICB0aGlzLmFjY2Vzc1BvbGljaWVzID0gcHJvcHMuYWNjZXNzUG9saWNpZXM7XG5cbiAgICB0aGlzLnJlc291cmNlID0gbmV3IENmbkFjY2Vzc0VudHJ5KHRoaXMsICdSZXNvdXJjZScsIHtcbiAgICAgIGNsdXN0ZXJOYW1lOiB0aGlzLmNsdXN0ZXIuY2x1c3Rlck5hbWUsXG4gICAgICBwcmluY2lwYWxBcm46IHRoaXMucHJpbmNpcGFsLFxuICAgICAgdHlwZTogcHJvcHMuYWNjZXNzRW50cnlUeXBlLFxuICAgICAgYWNjZXNzUG9saWNpZXM6IExhenkuYW55KHtcbiAgICAgICAgcHJvZHVjZTogKCkgPT4gdGhpcy5hY2Nlc3NQb2xpY2llcy5tYXAocCA9PiAoe1xuICAgICAgICAgIGFjY2Vzc1Njb3BlOiB7XG4gICAgICAgICAgICB0eXBlOiBwLmFjY2Vzc1Njb3BlLnR5cGUsXG4gICAgICAgICAgICBuYW1lc3BhY2VzOiBwLmFjY2Vzc1Njb3BlLm5hbWVzcGFjZXMsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBwb2xpY3lBcm46IHAucG9saWN5LFxuICAgICAgICB9KSksXG4gICAgICB9KSxcbiAgICB9KTtcbiAgfVxuXG4gIEBtZW1vaXplZEdldHRlclxuICBwdWJsaWMgZ2V0IGFjY2Vzc0VudHJ5TmFtZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmdldFJlc291cmNlTmFtZUF0dHJpYnV0ZSh0aGlzLnJlc291cmNlLnJlZik7XG4gIH1cblxuICBAbWVtb2l6ZWRHZXR0ZXJcbiAgcHVibGljIGdldCBhY2Nlc3NFbnRyeUFybigpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmdldFJlc291cmNlQXJuQXR0cmlidXRlKHRoaXMucmVzb3VyY2UuYXR0ckFjY2Vzc0VudHJ5QXJuLCB7XG4gICAgICBzZXJ2aWNlOiAnZWtzJyxcbiAgICAgIHJlc291cmNlOiAnYWNjZXNzZW50cnknLFxuICAgICAgcmVzb3VyY2VOYW1lOiB0aGlzLnBoeXNpY2FsTmFtZSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgdGhlIGFjY2VzcyBwb2xpY2llcyBmb3IgdGhpcyBlbnRyeS5cbiAgICogQHBhcmFtIG5ld0FjY2Vzc1BvbGljaWVzIC0gVGhlIG5ldyBhY2Nlc3MgcG9saWNpZXMgdG8gYWRkLlxuICAgKi9cbiAgQE1ldGhvZE1ldGFkYXRhKClcbiAgcHVibGljIGFkZEFjY2Vzc1BvbGljaWVzKG5ld0FjY2Vzc1BvbGljaWVzOiBJQWNjZXNzUG9saWN5W10pOiB2b2lkIHtcbiAgICAvLyBhZGQgbmV3QWNjZXNzUG9saWNpZXMgdG8gdGhpcy5hY2Nlc3NQb2xpY2llc1xuICAgIHRoaXMuYWNjZXNzUG9saWNpZXMucHVzaCguLi5uZXdBY2Nlc3NQb2xpY2llcyk7XG4gIH1cbn1cbiJdfQ==