"use strict";
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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OidcProviderNative = exports.OpenIdConnectProvider = void 0;
const jsiiDeprecationWarnings = require("../.warnings.jsii.js");
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
const iam = require("aws-cdk-lib/aws-iam");
const metadata_resource_1 = require("aws-cdk-lib/core/lib/metadata-resource");
const prop_injectable_1 = require("aws-cdk-lib/core/lib/prop-injectable");
/**
 * IAM OIDC identity providers are entities in IAM that describe an external
 * identity provider (IdP) service that supports the OpenID Connect (OIDC)
 * standard, such as Google or Salesforce. You use an IAM OIDC identity provider
 * when you want to establish trust between an OIDC-compatible IdP and your AWS
 * account.
 *
 * This implementation has default values for thumbprints and clientIds props
 * that will be compatible with the eks cluster
 *
 * @see http://openid.net/connect
 * @see https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_oidc.html
 *
 * @resource AWS::CloudFormation::CustomResource
 * @deprecated Use `OidcProviderNative` instead. This construct will be removed in a future major release.
 */
let OpenIdConnectProvider = (() => {
    let _classDecorators = [prop_injectable_1.propertyInjectable];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = iam.OpenIdConnectProvider;
    var OpenIdConnectProvider = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            OpenIdConnectProvider = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        static [JSII_RTTI_SYMBOL_1] = { fqn: "@aws-cdk/aws-eks-v2-alpha.OpenIdConnectProvider", version: "0.0.0" };
        /** Uniquely identifies this class. */
        static PROPERTY_INJECTION_ID = '@aws-cdk.aws-eks-v2-alpha.OpenIdConnectProvider';
        /**
         * Defines an OpenID Connect provider.
         * @param scope The definition scope
         * @param id Construct ID
         * @param props Initialization properties
         */
        constructor(scope, id, props) {
            try {
                jsiiDeprecationWarnings.print("@aws-cdk/aws-eks-v2-alpha.OpenIdConnectProvider", "Use `OidcProviderNative` instead. This construct will be removed in a future major release.");
                jsiiDeprecationWarnings._aws_cdk_aws_eks_v2_alpha_OpenIdConnectProviderProps(props);
            }
            catch (error) {
                if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                    Error.captureStackTrace(error, OpenIdConnectProvider);
                }
                throw error;
            }
            const clientIds = ['sts.amazonaws.com'];
            super(scope, id, {
                url: props.url,
                clientIds,
                removalPolicy: props.removalPolicy,
            });
            // Enhanced CDK Analytics Telemetry
            (0, metadata_resource_1.addConstructMetadata)(this, props);
        }
        static {
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return OpenIdConnectProvider = _classThis;
})();
exports.OpenIdConnectProvider = OpenIdConnectProvider;
/**
 * IAM OIDC identity providers are entities in IAM that describe an external
 * identity provider (IdP) service that supports the OpenID Connect (OIDC)
 * standard, such as Google or Salesforce. You use an IAM OIDC identity provider
 * when you want to establish trust between an OIDC-compatible IdP and your AWS
 * account.
 *
 * This implementation uses the native CloudFormation resource and has default
 * values for thumbprints and clientIds props that will be compatible with the eks cluster.
 *
 * @see http://openid.net/connect
 * @see https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_oidc.html
 *
 * @resource AWS::IAM::OIDCProvider
 */
let OidcProviderNative = (() => {
    let _classDecorators = [prop_injectable_1.propertyInjectable];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = iam.OidcProviderNative;
    var OidcProviderNative = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            OidcProviderNative = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        static [JSII_RTTI_SYMBOL_1] = { fqn: "@aws-cdk/aws-eks-v2-alpha.OidcProviderNative", version: "0.0.0" };
        /** Uniquely identifies this class. */
        static PROPERTY_INJECTION_ID = '@aws-cdk.aws-eks-v2-alpha.OidcProviderNative';
        /**
         * Defines a native OpenID Connect provider.
         * @param scope The definition scope
         * @param id Construct ID
         * @param props Initialization properties
         */
        constructor(scope, id, props) {
            try {
                jsiiDeprecationWarnings._aws_cdk_aws_eks_v2_alpha_OidcProviderNativeProps(props);
            }
            catch (error) {
                if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                    Error.captureStackTrace(error, OidcProviderNative);
                }
                throw error;
            }
            const clientIds = ['sts.amazonaws.com'];
            super(scope, id, {
                url: props.url,
                clientIds,
                removalPolicy: props.removalPolicy,
            });
            // Enhanced CDK Analytics Telemetry
            (0, metadata_resource_1.addConstructMetadata)(this, props);
        }
        static {
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return OidcProviderNative = _classThis;
})();
exports.OidcProviderNative = OidcProviderNative;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2lkYy1wcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm9pZGMtcHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsMkNBQTJDO0FBQzNDLDhFQUE4RTtBQUM5RSwwRUFBMEU7QUFpQzFFOzs7Ozs7Ozs7Ozs7Ozs7R0FlRztJQUVVLHFCQUFxQjs0QkFEakMsb0NBQWtCOzs7O3NCQUN3QixHQUFHLENBQUMscUJBQXFCO3FDQUFqQyxTQUFRLFdBQXlCOzs7O1lBQXBFLDZLQXNCQzs7Ozs7UUFyQkMsc0NBQXNDO1FBQy9CLE1BQU0sQ0FBVSxxQkFBcUIsR0FBVyxpREFBaUQsQ0FBQztRQUV6Rzs7Ozs7V0FLRztRQUNILFlBQW1CLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQWlDOzs7Ozs7O21EQVZ2RSxxQkFBcUI7Ozs7WUFXOUIsTUFBTSxTQUFTLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBRXhDLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFO2dCQUNmLEdBQUcsRUFBRSxLQUFLLENBQUMsR0FBRztnQkFDZCxTQUFTO2dCQUNULGFBQWEsRUFBRSxLQUFLLENBQUMsYUFBYTthQUNuQyxDQUFDLENBQUM7WUFFSCxtQ0FBbUM7WUFDbkMsSUFBQSx3Q0FBb0IsRUFBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDbkM7O1lBckJVLHVEQUFxQjs7Ozs7QUFBckIsc0RBQXFCO0FBd0JsQzs7Ozs7Ozs7Ozs7Ozs7R0FjRztJQUVVLGtCQUFrQjs0QkFEOUIsb0NBQWtCOzs7O3NCQUNxQixHQUFHLENBQUMsa0JBQWtCO2tDQUE5QixTQUFRLFdBQXNCOzs7O1lBQTlELDZLQXNCQzs7Ozs7UUFyQkMsc0NBQXNDO1FBQy9CLE1BQU0sQ0FBVSxxQkFBcUIsR0FBVyw4Q0FBOEMsQ0FBQztRQUV0Rzs7Ozs7V0FLRztRQUNILFlBQW1CLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQThCOzs7Ozs7bURBVnBFLGtCQUFrQjs7OztZQVczQixNQUFNLFNBQVMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFFeEMsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUU7Z0JBQ2YsR0FBRyxFQUFFLEtBQUssQ0FBQyxHQUFHO2dCQUNkLFNBQVM7Z0JBQ1QsYUFBYSxFQUFFLEtBQUssQ0FBQyxhQUFhO2FBQ25DLENBQUMsQ0FBQztZQUVILG1DQUFtQztZQUNuQyxJQUFBLHdDQUFvQixFQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztTQUNuQzs7WUFyQlUsdURBQWtCOzs7OztBQUFsQixnREFBa0IiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBSZW1vdmFsUG9saWN5IH0gZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0IHsgYWRkQ29uc3RydWN0TWV0YWRhdGEgfSBmcm9tICdhd3MtY2RrLWxpYi9jb3JlL2xpYi9tZXRhZGF0YS1yZXNvdXJjZSc7XG5pbXBvcnQgeyBwcm9wZXJ0eUluamVjdGFibGUgfSBmcm9tICdhd3MtY2RrLWxpYi9jb3JlL2xpYi9wcm9wLWluamVjdGFibGUnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbi8qKlxuICogSW5pdGlhbGl6YXRpb24gcHJvcGVydGllcyBmb3IgYE9wZW5JZENvbm5lY3RQcm92aWRlcmAuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgT3BlbklkQ29ubmVjdFByb3ZpZGVyUHJvcHMge1xuICAvKipcbiAgICogVGhlIFVSTCBvZiB0aGUgaWRlbnRpdHkgcHJvdmlkZXIuIFRoZSBVUkwgbXVzdCBiZWdpbiB3aXRoIGh0dHBzOi8vIGFuZFxuICAgKiBzaG91bGQgY29ycmVzcG9uZCB0byB0aGUgaXNzIGNsYWltIGluIHRoZSBwcm92aWRlcidzIE9wZW5JRCBDb25uZWN0IElEXG4gICAqIHRva2Vucy4gUGVyIHRoZSBPSURDIHN0YW5kYXJkLCBwYXRoIGNvbXBvbmVudHMgYXJlIGFsbG93ZWQgYnV0IHF1ZXJ5XG4gICAqIHBhcmFtZXRlcnMgYXJlIG5vdC4gVHlwaWNhbGx5IHRoZSBVUkwgY29uc2lzdHMgb2Ygb25seSBhIGhvc3RuYW1lLCBsaWtlXG4gICAqIGh0dHBzOi8vc2VydmVyLmV4YW1wbGUub3JnIG9yIGh0dHBzOi8vZXhhbXBsZS5jb20uXG4gICAqXG4gICAqIFlvdSBjYW4gZmluZCB5b3VyIE9JREMgSXNzdWVyIFVSTCBieTpcbiAgICogYXdzIGVrcyBkZXNjcmliZS1jbHVzdGVyIC0tbmFtZSAlY2x1c3Rlcl9uYW1lJSAtLXF1ZXJ5IFwiY2x1c3Rlci5pZGVudGl0eS5vaWRjLmlzc3VlclwiIC0tb3V0cHV0IHRleHRcbiAgICovXG4gIHJlYWRvbmx5IHVybDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBUaGUgcmVtb3ZhbCBwb2xpY3kgdG8gYXBwbHkgdG8gdGhlIE9wZW5JRCBDb25uZWN0IFByb3ZpZGVyXG4gICAqXG4gICAqIEBkZWZhdWx0IC0gUmVtb3ZhbFBvbGljeS5ERVNUUk9ZXG4gICAqL1xuICByZWFkb25seSByZW1vdmFsUG9saWN5PzogUmVtb3ZhbFBvbGljeTtcbn1cblxuLyoqXG4gKiBJbml0aWFsaXphdGlvbiBwcm9wZXJ0aWVzIGZvciBgT2lkY1Byb3ZpZGVyTmF0aXZlYC5cbiAqL1xuLy8gYXdzbGludDppZ25vcmU6cHJvcHMtcGh5c2ljYWwtbmFtZVxuZXhwb3J0IGludGVyZmFjZSBPaWRjUHJvdmlkZXJOYXRpdmVQcm9wcyBleHRlbmRzIE9wZW5JZENvbm5lY3RQcm92aWRlclByb3BzIHt9XG5cbi8qKlxuICogSUFNIE9JREMgaWRlbnRpdHkgcHJvdmlkZXJzIGFyZSBlbnRpdGllcyBpbiBJQU0gdGhhdCBkZXNjcmliZSBhbiBleHRlcm5hbFxuICogaWRlbnRpdHkgcHJvdmlkZXIgKElkUCkgc2VydmljZSB0aGF0IHN1cHBvcnRzIHRoZSBPcGVuSUQgQ29ubmVjdCAoT0lEQylcbiAqIHN0YW5kYXJkLCBzdWNoIGFzIEdvb2dsZSBvciBTYWxlc2ZvcmNlLiBZb3UgdXNlIGFuIElBTSBPSURDIGlkZW50aXR5IHByb3ZpZGVyXG4gKiB3aGVuIHlvdSB3YW50IHRvIGVzdGFibGlzaCB0cnVzdCBiZXR3ZWVuIGFuIE9JREMtY29tcGF0aWJsZSBJZFAgYW5kIHlvdXIgQVdTXG4gKiBhY2NvdW50LlxuICpcbiAqIFRoaXMgaW1wbGVtZW50YXRpb24gaGFzIGRlZmF1bHQgdmFsdWVzIGZvciB0aHVtYnByaW50cyBhbmQgY2xpZW50SWRzIHByb3BzXG4gKiB0aGF0IHdpbGwgYmUgY29tcGF0aWJsZSB3aXRoIHRoZSBla3MgY2x1c3RlclxuICpcbiAqIEBzZWUgaHR0cDovL29wZW5pZC5uZXQvY29ubmVjdFxuICogQHNlZSBodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vSUFNL2xhdGVzdC9Vc2VyR3VpZGUvaWRfcm9sZXNfcHJvdmlkZXJzX29pZGMuaHRtbFxuICpcbiAqIEByZXNvdXJjZSBBV1M6OkNsb3VkRm9ybWF0aW9uOjpDdXN0b21SZXNvdXJjZVxuICogQGRlcHJlY2F0ZWQgVXNlIGBPaWRjUHJvdmlkZXJOYXRpdmVgIGluc3RlYWQuIFRoaXMgY29uc3RydWN0IHdpbGwgYmUgcmVtb3ZlZCBpbiBhIGZ1dHVyZSBtYWpvciByZWxlYXNlLlxuICovXG5AcHJvcGVydHlJbmplY3RhYmxlXG5leHBvcnQgY2xhc3MgT3BlbklkQ29ubmVjdFByb3ZpZGVyIGV4dGVuZHMgaWFtLk9wZW5JZENvbm5lY3RQcm92aWRlciB7XG4gIC8qKiBVbmlxdWVseSBpZGVudGlmaWVzIHRoaXMgY2xhc3MuICovXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgUFJPUEVSVFlfSU5KRUNUSU9OX0lEOiBzdHJpbmcgPSAnQGF3cy1jZGsuYXdzLWVrcy12Mi1hbHBoYS5PcGVuSWRDb25uZWN0UHJvdmlkZXInO1xuXG4gIC8qKlxuICAgKiBEZWZpbmVzIGFuIE9wZW5JRCBDb25uZWN0IHByb3ZpZGVyLlxuICAgKiBAcGFyYW0gc2NvcGUgVGhlIGRlZmluaXRpb24gc2NvcGVcbiAgICogQHBhcmFtIGlkIENvbnN0cnVjdCBJRFxuICAgKiBAcGFyYW0gcHJvcHMgSW5pdGlhbGl6YXRpb24gcHJvcGVydGllc1xuICAgKi9cbiAgcHVibGljIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBPcGVuSWRDb25uZWN0UHJvdmlkZXJQcm9wcykge1xuICAgIGNvbnN0IGNsaWVudElkcyA9IFsnc3RzLmFtYXpvbmF3cy5jb20nXTtcblxuICAgIHN1cGVyKHNjb3BlLCBpZCwge1xuICAgICAgdXJsOiBwcm9wcy51cmwsXG4gICAgICBjbGllbnRJZHMsXG4gICAgICByZW1vdmFsUG9saWN5OiBwcm9wcy5yZW1vdmFsUG9saWN5LFxuICAgIH0pO1xuXG4gICAgLy8gRW5oYW5jZWQgQ0RLIEFuYWx5dGljcyBUZWxlbWV0cnlcbiAgICBhZGRDb25zdHJ1Y3RNZXRhZGF0YSh0aGlzLCBwcm9wcyk7XG4gIH1cbn1cblxuLyoqXG4gKiBJQU0gT0lEQyBpZGVudGl0eSBwcm92aWRlcnMgYXJlIGVudGl0aWVzIGluIElBTSB0aGF0IGRlc2NyaWJlIGFuIGV4dGVybmFsXG4gKiBpZGVudGl0eSBwcm92aWRlciAoSWRQKSBzZXJ2aWNlIHRoYXQgc3VwcG9ydHMgdGhlIE9wZW5JRCBDb25uZWN0IChPSURDKVxuICogc3RhbmRhcmQsIHN1Y2ggYXMgR29vZ2xlIG9yIFNhbGVzZm9yY2UuIFlvdSB1c2UgYW4gSUFNIE9JREMgaWRlbnRpdHkgcHJvdmlkZXJcbiAqIHdoZW4geW91IHdhbnQgdG8gZXN0YWJsaXNoIHRydXN0IGJldHdlZW4gYW4gT0lEQy1jb21wYXRpYmxlIElkUCBhbmQgeW91ciBBV1NcbiAqIGFjY291bnQuXG4gKlxuICogVGhpcyBpbXBsZW1lbnRhdGlvbiB1c2VzIHRoZSBuYXRpdmUgQ2xvdWRGb3JtYXRpb24gcmVzb3VyY2UgYW5kIGhhcyBkZWZhdWx0XG4gKiB2YWx1ZXMgZm9yIHRodW1icHJpbnRzIGFuZCBjbGllbnRJZHMgcHJvcHMgdGhhdCB3aWxsIGJlIGNvbXBhdGlibGUgd2l0aCB0aGUgZWtzIGNsdXN0ZXIuXG4gKlxuICogQHNlZSBodHRwOi8vb3BlbmlkLm5ldC9jb25uZWN0XG4gKiBAc2VlIGh0dHBzOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9JQU0vbGF0ZXN0L1VzZXJHdWlkZS9pZF9yb2xlc19wcm92aWRlcnNfb2lkYy5odG1sXG4gKlxuICogQHJlc291cmNlIEFXUzo6SUFNOjpPSURDUHJvdmlkZXJcbiAqL1xuQHByb3BlcnR5SW5qZWN0YWJsZVxuZXhwb3J0IGNsYXNzIE9pZGNQcm92aWRlck5hdGl2ZSBleHRlbmRzIGlhbS5PaWRjUHJvdmlkZXJOYXRpdmUge1xuICAvKiogVW5pcXVlbHkgaWRlbnRpZmllcyB0aGlzIGNsYXNzLiAqL1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFBST1BFUlRZX0lOSkVDVElPTl9JRDogc3RyaW5nID0gJ0Bhd3MtY2RrLmF3cy1la3MtdjItYWxwaGEuT2lkY1Byb3ZpZGVyTmF0aXZlJztcblxuICAvKipcbiAgICogRGVmaW5lcyBhIG5hdGl2ZSBPcGVuSUQgQ29ubmVjdCBwcm92aWRlci5cbiAgICogQHBhcmFtIHNjb3BlIFRoZSBkZWZpbml0aW9uIHNjb3BlXG4gICAqIEBwYXJhbSBpZCBDb25zdHJ1Y3QgSURcbiAgICogQHBhcmFtIHByb3BzIEluaXRpYWxpemF0aW9uIHByb3BlcnRpZXNcbiAgICovXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogT2lkY1Byb3ZpZGVyTmF0aXZlUHJvcHMpIHtcbiAgICBjb25zdCBjbGllbnRJZHMgPSBbJ3N0cy5hbWF6b25hd3MuY29tJ107XG5cbiAgICBzdXBlcihzY29wZSwgaWQsIHtcbiAgICAgIHVybDogcHJvcHMudXJsLFxuICAgICAgY2xpZW50SWRzLFxuICAgICAgcmVtb3ZhbFBvbGljeTogcHJvcHMucmVtb3ZhbFBvbGljeSxcbiAgICB9KTtcblxuICAgIC8vIEVuaGFuY2VkIENESyBBbmFseXRpY3MgVGVsZW1ldHJ5XG4gICAgYWRkQ29uc3RydWN0TWV0YWRhdGEodGhpcywgcHJvcHMpO1xuICB9XG59XG4iXX0=