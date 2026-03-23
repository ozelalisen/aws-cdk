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
exports.Addon = void 0;
const jsiiDeprecationWarnings = require("../.warnings.jsii.js");
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
const aws_eks_1 = require("aws-cdk-lib/aws-eks");
const core_1 = require("aws-cdk-lib/core");
const helpers_internal_1 = require("aws-cdk-lib/core/lib/helpers-internal");
const metadata_resource_1 = require("aws-cdk-lib/core/lib/metadata-resource");
const prop_injectable_1 = require("aws-cdk-lib/core/lib/prop-injectable");
/**
 * Represents an Amazon EKS Add-On.
 * @resource AWS::EKS::Addon
 */
let Addon = (() => {
    let _classDecorators = [prop_injectable_1.propertyInjectable];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = core_1.Resource;
    let _instanceExtraInitializers = [];
    let _get_addonName_decorators;
    let _get_addonArn_decorators;
    var Addon = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _get_addonName_decorators = [helpers_internal_1.memoizedGetter];
            _get_addonArn_decorators = [helpers_internal_1.memoizedGetter];
            __esDecorate(this, null, _get_addonName_decorators, { kind: "getter", name: "addonName", static: false, private: false, access: { has: obj => "addonName" in obj, get: obj => obj.addonName }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _get_addonArn_decorators, { kind: "getter", name: "addonArn", static: false, private: false, access: { has: obj => "addonArn" in obj, get: obj => obj.addonArn }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            Addon = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        static [JSII_RTTI_SYMBOL_1] = { fqn: "@aws-cdk/aws-eks-v2-alpha.Addon", version: "0.0.0" };
        /** Uniquely identifies this class. */
        static PROPERTY_INJECTION_ID = '@aws-cdk.aws-eks-v2-alpha.Addon';
        /**
         * Creates an `IAddon` instance from the given addon attributes.
         *
         * @param scope - The parent construct.
         * @param id - The construct ID.
         * @param attrs - The attributes of the addon, including the addon name and the cluster name.
         * @returns An `IAddon` instance.
         */
        static fromAddonAttributes(scope, id, attrs) {
            try {
                jsiiDeprecationWarnings._aws_cdk_aws_eks_v2_alpha_AddonAttributes(attrs);
            }
            catch (error) {
                if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                    Error.captureStackTrace(error, this.fromAddonAttributes);
                }
                throw error;
            }
            class Import extends core_1.Resource {
                addonName = attrs.addonName;
                addonArn = core_1.Stack.of(scope).formatArn({
                    service: 'eks',
                    resource: 'addon',
                    resourceName: `${attrs.clusterName}/${attrs.addonName}`,
                });
            }
            return new Import(scope, id);
        }
        /**
         * Creates an `IAddon` from an existing addon ARN.
         *
         * @param scope - The parent construct.
         * @param id - The ID of the construct.
         * @param addonArn - The ARN of the addon.
         * @returns An `IAddon` implementation.
         */
        static fromAddonArn(scope, id, addonArn) {
            const parsedArn = core_1.Stack.of(scope).splitArn(addonArn, core_1.ArnFormat.COLON_RESOURCE_NAME);
            const splitResourceName = core_1.Fn.split('/', parsedArn.resourceName);
            class Import extends core_1.Resource {
                addonName = core_1.Fn.select(1, splitResourceName);
                addonArn = addonArn;
            }
            return new Import(scope, id);
        }
        clusterName = __runInitializers(this, _instanceExtraInitializers);
        resource;
        /**
         * Creates a new Amazon EKS Add-On.
         * @param scope The parent construct.
         * @param id The construct ID.
         * @param props The properties for the Add-On.
         */
        constructor(scope, id, props) {
            super(scope, id, {
                physicalName: props.addonName,
            });
            try {
                jsiiDeprecationWarnings._aws_cdk_aws_eks_v2_alpha_AddonProps(props);
            }
            catch (error) {
                if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                    Error.captureStackTrace(error, Addon);
                }
                throw error;
            }
            // Enhanced CDK Analytics Telemetry
            (0, metadata_resource_1.addConstructMetadata)(this, props);
            this.clusterName = props.cluster.clusterName;
            this.resource = new aws_eks_1.CfnAddon(this, 'Resource', {
                addonName: props.addonName,
                clusterName: this.clusterName,
                addonVersion: props.addonVersion,
                preserveOnDelete: props.preserveOnDelete,
                configurationValues: this.stack.toJsonString(props.configurationValues),
            });
        }
        /**
         * Name of the addon.
         */
        get addonName() {
            return this.getResourceNameAttribute(this.resource.ref);
        }
        get addonArn() {
            return this.getResourceArnAttribute(this.resource.attrArn, {
                service: 'eks',
                resource: 'addon',
                resourceName: `${this.clusterName}/${this.addonName}/`,
            });
        }
        static {
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return Addon = _classThis;
})();
exports.Addon = Addon;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWRkb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhZGRvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBK0M7QUFDL0MsMkNBQTZFO0FBQzdFLDRFQUF1RTtBQUN2RSw4RUFBOEU7QUFDOUUsMEVBQTBFO0FBd0UxRTs7O0dBR0c7SUFFVSxLQUFLOzRCQURqQixvQ0FBa0I7Ozs7c0JBQ1EsZUFBUTs7OztxQkFBaEIsU0FBUSxXQUFROzs7O3lDQXdFaEMsaUNBQWM7d0NBS2QsaUNBQWM7WUFKZixrTEFBVyxTQUFTLDZEQUVuQjtZQUdELCtLQUFXLFFBQVEsNkRBTWxCO1lBcEZILDZLQXFGQzs7Ozs7UUFwRkMsc0NBQXNDO1FBQy9CLE1BQU0sQ0FBVSxxQkFBcUIsR0FBVyxpQ0FBaUMsQ0FBQztRQUV6Rjs7Ozs7OztXQU9HO1FBQ0ksTUFBTSxDQUFDLG1CQUFtQixDQUFDLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCOzs7Ozs7Ozs7O1lBQ3BGLE1BQU0sTUFBTyxTQUFRLGVBQVE7Z0JBQ1gsU0FBUyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUM7Z0JBQzVCLFFBQVEsR0FBRyxZQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLFNBQVMsQ0FBQztvQkFDbkQsT0FBTyxFQUFFLEtBQUs7b0JBQ2QsUUFBUSxFQUFFLE9BQU87b0JBQ2pCLFlBQVksRUFBRSxHQUFHLEtBQUssQ0FBQyxXQUFXLElBQUksS0FBSyxDQUFDLFNBQVMsRUFBRTtpQkFDeEQsQ0FBQyxDQUFDO2FBQ0o7WUFDRCxPQUFPLElBQUksTUFBTSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztTQUM5QjtRQUNEOzs7Ozs7O1dBT0c7UUFDSSxNQUFNLENBQUMsWUFBWSxDQUFDLEtBQWdCLEVBQUUsRUFBVSxFQUFFLFFBQWdCO1lBQ3ZFLE1BQU0sU0FBUyxHQUFHLFlBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxnQkFBUyxDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFDcEYsTUFBTSxpQkFBaUIsR0FBRyxTQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxTQUFTLENBQUMsWUFBYSxDQUFDLENBQUM7WUFDakUsTUFBTSxNQUFPLFNBQVEsZUFBUTtnQkFDWCxTQUFTLEdBQUcsU0FBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztnQkFDNUMsUUFBUSxHQUFHLFFBQVEsQ0FBQzthQUNyQztZQUVELE9BQU8sSUFBSSxNQUFNLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1NBQzlCO1FBRWdCLFdBQVcsR0ExQ2pCLG1EQUFLLENBMENxQjtRQUM3QixRQUFRLENBQVc7UUFFM0I7Ozs7O1dBS0c7UUFDSCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQWlCO1lBQ3pELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFO2dCQUNmLFlBQVksRUFBRSxLQUFLLENBQUMsU0FBUzthQUM5QixDQUFDLENBQUM7Ozs7OzttREF0RE0sS0FBSzs7OztZQXVEZCxtQ0FBbUM7WUFDbkMsSUFBQSx3Q0FBb0IsRUFBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFbEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQztZQUU3QyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksa0JBQVEsQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFO2dCQUM3QyxTQUFTLEVBQUUsS0FBSyxDQUFDLFNBQVM7Z0JBQzFCLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVztnQkFDN0IsWUFBWSxFQUFFLEtBQUssQ0FBQyxZQUFZO2dCQUNoQyxnQkFBZ0IsRUFBRSxLQUFLLENBQUMsZ0JBQWdCO2dCQUN4QyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUM7YUFDeEUsQ0FBQyxDQUFDO1NBQ0o7UUFFRDs7V0FFRztRQUVILElBQVcsU0FBUztZQUNsQixPQUFPLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ3pEO1FBR0QsSUFBVyxRQUFRO1lBQ2pCLE9BQU8sSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFO2dCQUN6RCxPQUFPLEVBQUUsS0FBSztnQkFDZCxRQUFRLEVBQUUsT0FBTztnQkFDakIsWUFBWSxFQUFFLEdBQUcsSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsU0FBUyxHQUFHO2FBQ3ZELENBQUMsQ0FBQztTQUNKOztZQXBGVSx1REFBSzs7Ozs7QUFBTCxzQkFBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENmbkFkZG9uIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWVrcyc7XG5pbXBvcnQgeyBBcm5Gb3JtYXQsIElSZXNvdXJjZSwgUmVzb3VyY2UsIFN0YWNrLCBGbiB9IGZyb20gJ2F3cy1jZGstbGliL2NvcmUnO1xuaW1wb3J0IHsgbWVtb2l6ZWRHZXR0ZXIgfSBmcm9tICdhd3MtY2RrLWxpYi9jb3JlL2xpYi9oZWxwZXJzLWludGVybmFsJztcbmltcG9ydCB7IGFkZENvbnN0cnVjdE1ldGFkYXRhIH0gZnJvbSAnYXdzLWNkay1saWIvY29yZS9saWIvbWV0YWRhdGEtcmVzb3VyY2UnO1xuaW1wb3J0IHsgcHJvcGVydHlJbmplY3RhYmxlIH0gZnJvbSAnYXdzLWNkay1saWIvY29yZS9saWIvcHJvcC1pbmplY3RhYmxlJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0IHsgSUNsdXN0ZXIgfSBmcm9tICcuL2NsdXN0ZXInO1xuXG4vKipcbiAqIFJlcHJlc2VudHMgYW4gQW1hem9uIEVLUyBBZGQtT24uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSUFkZG9uIGV4dGVuZHMgSVJlc291cmNlIHtcbiAgLyoqXG4gICAqIE5hbWUgb2YgdGhlIEFkZC1Pbi5cbiAgICogQGF0dHJpYnV0ZVxuICAgKi9cbiAgcmVhZG9ubHkgYWRkb25OYW1lOiBzdHJpbmc7XG4gIC8qKlxuICAgKiBBUk4gb2YgdGhlIEFkZC1Pbi5cbiAgICogQGF0dHJpYnV0ZVxuICAgKi9cbiAgcmVhZG9ubHkgYWRkb25Bcm46IHN0cmluZztcbn1cblxuLyoqXG4gKiBQcm9wZXJ0aWVzIGZvciBjcmVhdGluZyBhbiBBbWF6b24gRUtTIEFkZC1Pbi5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBZGRvblByb3BzIHtcbiAgLyoqXG4gICAqIE5hbWUgb2YgdGhlIEFkZC1Pbi5cbiAgICovXG4gIHJlYWRvbmx5IGFkZG9uTmFtZTogc3RyaW5nO1xuICAvKipcbiAgICogVmVyc2lvbiBvZiB0aGUgQWRkLU9uLiBZb3UgY2FuIGNoZWNrIGFsbCBhdmFpbGFibGUgdmVyc2lvbnMgd2l0aCBkZXNjcmliZS1hZGRvbi12ZXJzaW9ucy5cbiAgICogRm9yIGV4YW1wbGUsIHRoaXMgbGlzdHMgYWxsIGF2YWlsYWJsZSB2ZXJzaW9ucyBmb3IgdGhlIGBla3MtcG9kLWlkZW50aXR5LWFnZW50YCBhZGRvbjpcbiAgICogJCBhd3MgZWtzIGRlc2NyaWJlLWFkZG9uLXZlcnNpb25zIC0tYWRkb24tbmFtZSBla3MtcG9kLWlkZW50aXR5LWFnZW50IFxcXG4gICAqIC0tcXVlcnkgJ2FkZG9uc1sqXS5hZGRvblZlcnNpb25zWypdLmFkZG9uVmVyc2lvbidcbiAgICpcbiAgICogQGRlZmF1bHQgdGhlIGxhdGVzdCB2ZXJzaW9uLlxuICAgKi9cbiAgcmVhZG9ubHkgYWRkb25WZXJzaW9uPzogc3RyaW5nO1xuICAvKipcbiAgICogVGhlIEVLUyBjbHVzdGVyIHRoZSBBZGQtT24gaXMgYXNzb2NpYXRlZCB3aXRoLlxuICAgKi9cbiAgcmVhZG9ubHkgY2x1c3RlcjogSUNsdXN0ZXI7XG4gIC8qKlxuICAgKiBTcGVjaWZ5aW5nIHRoaXMgb3B0aW9uIHByZXNlcnZlcyB0aGUgYWRkLW9uIHNvZnR3YXJlIG9uIHlvdXIgY2x1c3RlciBidXQgQW1hem9uIEVLUyBzdG9wcyBtYW5hZ2luZyBhbnkgc2V0dGluZ3MgZm9yIHRoZSBhZGQtb24uXG4gICAqIElmIGFuIElBTSBhY2NvdW50IGlzIGFzc29jaWF0ZWQgd2l0aCB0aGUgYWRkLW9uLCBpdCBpc24ndCByZW1vdmVkLlxuICAgKlxuICAgKiBAZGVmYXVsdCB0cnVlXG4gICAqL1xuICByZWFkb25seSBwcmVzZXJ2ZU9uRGVsZXRlPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogVGhlIGNvbmZpZ3VyYXRpb24gdmFsdWVzIGZvciB0aGUgQWRkLW9uLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIFVzZSBkZWZhdWx0IGNvbmZpZ3VyYXRpb24uXG4gICAqL1xuICByZWFkb25seSBjb25maWd1cmF0aW9uVmFsdWVzPzogUmVjb3JkPHN0cmluZywgYW55Pjtcbn1cblxuLyoqXG4gKiBSZXByZXNlbnRzIHRoZSBhdHRyaWJ1dGVzIG9mIGFuIGFkZG9uIGZvciBhbiBBbWF6b24gRUtTIGNsdXN0ZXIuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQWRkb25BdHRyaWJ1dGVzIHtcbiAgLyoqXG4gICAqIFRoZSBuYW1lIG9mIHRoZSBhZGRvbi5cbiAgICovXG4gIHJlYWRvbmx5IGFkZG9uTmFtZTogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBUaGUgbmFtZSBvZiB0aGUgQW1hem9uIEVLUyBjbHVzdGVyIHRoZSBhZGRvbiBpcyBhc3NvY2lhdGVkIHdpdGguXG4gICAqL1xuICByZWFkb25seSBjbHVzdGVyTmFtZTogc3RyaW5nO1xufVxuXG4vKipcbiAqIFJlcHJlc2VudHMgYW4gQW1hem9uIEVLUyBBZGQtT24uXG4gKiBAcmVzb3VyY2UgQVdTOjpFS1M6OkFkZG9uXG4gKi9cbkBwcm9wZXJ0eUluamVjdGFibGVcbmV4cG9ydCBjbGFzcyBBZGRvbiBleHRlbmRzIFJlc291cmNlIGltcGxlbWVudHMgSUFkZG9uIHtcbiAgLyoqIFVuaXF1ZWx5IGlkZW50aWZpZXMgdGhpcyBjbGFzcy4gKi9cbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBQUk9QRVJUWV9JTkpFQ1RJT05fSUQ6IHN0cmluZyA9ICdAYXdzLWNkay5hd3MtZWtzLXYyLWFscGhhLkFkZG9uJztcblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBgSUFkZG9uYCBpbnN0YW5jZSBmcm9tIHRoZSBnaXZlbiBhZGRvbiBhdHRyaWJ1dGVzLlxuICAgKlxuICAgKiBAcGFyYW0gc2NvcGUgLSBUaGUgcGFyZW50IGNvbnN0cnVjdC5cbiAgICogQHBhcmFtIGlkIC0gVGhlIGNvbnN0cnVjdCBJRC5cbiAgICogQHBhcmFtIGF0dHJzIC0gVGhlIGF0dHJpYnV0ZXMgb2YgdGhlIGFkZG9uLCBpbmNsdWRpbmcgdGhlIGFkZG9uIG5hbWUgYW5kIHRoZSBjbHVzdGVyIG5hbWUuXG4gICAqIEByZXR1cm5zIEFuIGBJQWRkb25gIGluc3RhbmNlLlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBmcm9tQWRkb25BdHRyaWJ1dGVzKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIGF0dHJzOiBBZGRvbkF0dHJpYnV0ZXMpOiBJQWRkb24ge1xuICAgIGNsYXNzIEltcG9ydCBleHRlbmRzIFJlc291cmNlIGltcGxlbWVudHMgSUFkZG9uIHtcbiAgICAgIHB1YmxpYyByZWFkb25seSBhZGRvbk5hbWUgPSBhdHRycy5hZGRvbk5hbWU7XG4gICAgICBwdWJsaWMgcmVhZG9ubHkgYWRkb25Bcm4gPSBTdGFjay5vZihzY29wZSkuZm9ybWF0QXJuKHtcbiAgICAgICAgc2VydmljZTogJ2VrcycsXG4gICAgICAgIHJlc291cmNlOiAnYWRkb24nLFxuICAgICAgICByZXNvdXJjZU5hbWU6IGAke2F0dHJzLmNsdXN0ZXJOYW1lfS8ke2F0dHJzLmFkZG9uTmFtZX1gLFxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgSW1wb3J0KHNjb3BlLCBpZCk7XG4gIH1cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gYElBZGRvbmAgZnJvbSBhbiBleGlzdGluZyBhZGRvbiBBUk4uXG4gICAqXG4gICAqIEBwYXJhbSBzY29wZSAtIFRoZSBwYXJlbnQgY29uc3RydWN0LlxuICAgKiBAcGFyYW0gaWQgLSBUaGUgSUQgb2YgdGhlIGNvbnN0cnVjdC5cbiAgICogQHBhcmFtIGFkZG9uQXJuIC0gVGhlIEFSTiBvZiB0aGUgYWRkb24uXG4gICAqIEByZXR1cm5zIEFuIGBJQWRkb25gIGltcGxlbWVudGF0aW9uLlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBmcm9tQWRkb25Bcm4oc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgYWRkb25Bcm46IHN0cmluZyk6IElBZGRvbiB7XG4gICAgY29uc3QgcGFyc2VkQXJuID0gU3RhY2sub2Yoc2NvcGUpLnNwbGl0QXJuKGFkZG9uQXJuLCBBcm5Gb3JtYXQuQ09MT05fUkVTT1VSQ0VfTkFNRSk7XG4gICAgY29uc3Qgc3BsaXRSZXNvdXJjZU5hbWUgPSBGbi5zcGxpdCgnLycsIHBhcnNlZEFybi5yZXNvdXJjZU5hbWUhKTtcbiAgICBjbGFzcyBJbXBvcnQgZXh0ZW5kcyBSZXNvdXJjZSBpbXBsZW1lbnRzIElBZGRvbiB7XG4gICAgICBwdWJsaWMgcmVhZG9ubHkgYWRkb25OYW1lID0gRm4uc2VsZWN0KDEsIHNwbGl0UmVzb3VyY2VOYW1lKTtcbiAgICAgIHB1YmxpYyByZWFkb25seSBhZGRvbkFybiA9IGFkZG9uQXJuO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgSW1wb3J0KHNjb3BlLCBpZCk7XG4gIH1cblxuICBwcml2YXRlIHJlYWRvbmx5IGNsdXN0ZXJOYW1lOiBzdHJpbmc7XG4gIHByaXZhdGUgcmVzb3VyY2U6IENmbkFkZG9uO1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IEFtYXpvbiBFS1MgQWRkLU9uLlxuICAgKiBAcGFyYW0gc2NvcGUgVGhlIHBhcmVudCBjb25zdHJ1Y3QuXG4gICAqIEBwYXJhbSBpZCBUaGUgY29uc3RydWN0IElELlxuICAgKiBAcGFyYW0gcHJvcHMgVGhlIHByb3BlcnRpZXMgZm9yIHRoZSBBZGQtT24uXG4gICAqL1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogQWRkb25Qcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwge1xuICAgICAgcGh5c2ljYWxOYW1lOiBwcm9wcy5hZGRvbk5hbWUsXG4gICAgfSk7XG4gICAgLy8gRW5oYW5jZWQgQ0RLIEFuYWx5dGljcyBUZWxlbWV0cnlcbiAgICBhZGRDb25zdHJ1Y3RNZXRhZGF0YSh0aGlzLCBwcm9wcyk7XG5cbiAgICB0aGlzLmNsdXN0ZXJOYW1lID0gcHJvcHMuY2x1c3Rlci5jbHVzdGVyTmFtZTtcblxuICAgIHRoaXMucmVzb3VyY2UgPSBuZXcgQ2ZuQWRkb24odGhpcywgJ1Jlc291cmNlJywge1xuICAgICAgYWRkb25OYW1lOiBwcm9wcy5hZGRvbk5hbWUsXG4gICAgICBjbHVzdGVyTmFtZTogdGhpcy5jbHVzdGVyTmFtZSxcbiAgICAgIGFkZG9uVmVyc2lvbjogcHJvcHMuYWRkb25WZXJzaW9uLFxuICAgICAgcHJlc2VydmVPbkRlbGV0ZTogcHJvcHMucHJlc2VydmVPbkRlbGV0ZSxcbiAgICAgIGNvbmZpZ3VyYXRpb25WYWx1ZXM6IHRoaXMuc3RhY2sudG9Kc29uU3RyaW5nKHByb3BzLmNvbmZpZ3VyYXRpb25WYWx1ZXMpLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIE5hbWUgb2YgdGhlIGFkZG9uLlxuICAgKi9cbiAgQG1lbW9pemVkR2V0dGVyXG4gIHB1YmxpYyBnZXQgYWRkb25OYW1lKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UmVzb3VyY2VOYW1lQXR0cmlidXRlKHRoaXMucmVzb3VyY2UucmVmKTtcbiAgfVxuXG4gIEBtZW1vaXplZEdldHRlclxuICBwdWJsaWMgZ2V0IGFkZG9uQXJuKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UmVzb3VyY2VBcm5BdHRyaWJ1dGUodGhpcy5yZXNvdXJjZS5hdHRyQXJuLCB7XG4gICAgICBzZXJ2aWNlOiAnZWtzJyxcbiAgICAgIHJlc291cmNlOiAnYWRkb24nLFxuICAgICAgcmVzb3VyY2VOYW1lOiBgJHt0aGlzLmNsdXN0ZXJOYW1lfS8ke3RoaXMuYWRkb25OYW1lfS9gLFxuICAgIH0pO1xuICB9XG59XG4iXX0=