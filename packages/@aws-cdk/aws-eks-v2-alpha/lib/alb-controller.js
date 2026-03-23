"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlbController = exports.AlbScheme = exports.AlbControllerVersion = void 0;
const jsiiDeprecationWarnings = require("../.warnings.jsii.js");
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
const fs = require("fs");
const path = require("path");
const iam = require("aws-cdk-lib/aws-iam");
const constructs_1 = require("constructs");
const helm_chart_1 = require("./helm-chart");
const service_account_1 = require("./service-account");
// v2 - keep this import as a separate section to reduce merge conflict when forward merging with the v2 branch.
// eslint-disable-next-line
const core_1 = require("aws-cdk-lib/core");
/**
 * Controller version.
 *
 * Corresponds to the image tag of 'amazon/aws-load-balancer-controller' image.
 */
class AlbControllerVersion {
    version;
    helmChartVersion;
    custom;
    static [JSII_RTTI_SYMBOL_1] = { fqn: "@aws-cdk/aws-eks-v2-alpha.AlbControllerVersion", version: "0.0.0" };
    /**
     * v2.0.0
     */
    static V2_0_0 = new AlbControllerVersion('v2.0.0', '1.4.1', false);
    /**
     * v2.0.1
     */
    static V2_0_1 = new AlbControllerVersion('v2.0.1', '1.4.1', false);
    /**
     * v2.1.0
     */
    static V2_1_0 = new AlbControllerVersion('v2.1.0', '1.4.1', false);
    /**
     * v2.1.1
     */
    static V2_1_1 = new AlbControllerVersion('v2.1.1', '1.4.1', false);
    /**
     * v2.1.2
     */
    static V2_1_2 = new AlbControllerVersion('v2.1.2', '1.4.1', false);
    /**
     * v2.1.3
     */
    static V2_1_3 = new AlbControllerVersion('v2.1.3', '1.4.1', false);
    /**
     * v2.0.0
     */
    static V2_2_0 = new AlbControllerVersion('v2.2.0', '1.4.1', false);
    /**
     * v2.2.1
     */
    static V2_2_1 = new AlbControllerVersion('v2.2.1', '1.4.1', false);
    /**
     * v2.2.2
     */
    static V2_2_2 = new AlbControllerVersion('v2.2.2', '1.4.1', false);
    /**
     * v2.2.3
     */
    static V2_2_3 = new AlbControllerVersion('v2.2.3', '1.4.1', false);
    /**
     * v2.2.4
     */
    static V2_2_4 = new AlbControllerVersion('v2.2.4', '1.4.1', false);
    /**
     * v2.3.0
     */
    static V2_3_0 = new AlbControllerVersion('v2.3.0', '1.4.1', false);
    /**
     * v2.3.1
     */
    static V2_3_1 = new AlbControllerVersion('v2.3.1', '1.4.1', false);
    /**
     * v2.4.1
     */
    static V2_4_1 = new AlbControllerVersion('v2.4.1', '1.4.1', false);
    /**
     * v2.4.2
     */
    static V2_4_2 = new AlbControllerVersion('v2.4.2', '1.4.3', false);
    /**
     * v2.4.3
     */
    static V2_4_3 = new AlbControllerVersion('v2.4.3', '1.4.4', false);
    /**
     * v2.4.4
     */
    static V2_4_4 = new AlbControllerVersion('v2.4.4', '1.4.5', false);
    /**
     * v2.4.5
     */
    static V2_4_5 = new AlbControllerVersion('v2.4.5', '1.4.6', false);
    /**
     * v2.4.6
     */
    static V2_4_6 = new AlbControllerVersion('v2.4.6', '1.4.7', false);
    /**
     * v2.4.7
     */
    static V2_4_7 = new AlbControllerVersion('v2.4.7', '1.4.8', false);
    /**
     * v2.5.0
     */
    static V2_5_0 = new AlbControllerVersion('v2.5.0', '1.5.0', false);
    /**
     * v2.5.1
     */
    static V2_5_1 = new AlbControllerVersion('v2.5.1', '1.5.2', false);
    /**
     * v2.5.2
     */
    static V2_5_2 = new AlbControllerVersion('v2.5.2', '1.5.3', false);
    /**
     * v2.5.3
     */
    static V2_5_3 = new AlbControllerVersion('v2.5.3', '1.5.4', false);
    /**
     * v2.5.4
     */
    static V2_5_4 = new AlbControllerVersion('v2.5.4', '1.5.5', false);
    /**
     * v2.6.0
     */
    static V2_6_0 = new AlbControllerVersion('v2.6.0', '1.6.0', false);
    /**
     * v2.6.1
     */
    static V2_6_1 = new AlbControllerVersion('v2.6.1', '1.6.1', false);
    /**
     * v2.6.2
     */
    static V2_6_2 = new AlbControllerVersion('v2.6.2', '1.6.2', false);
    /**
     * v2.7.0
     */
    static V2_7_0 = new AlbControllerVersion('v2.7.0', '1.7.0', false);
    /**
     * v2.7.1
     */
    static V2_7_1 = new AlbControllerVersion('v2.7.1', '1.7.1', false);
    /**
     * v2.7.2
     */
    static V2_7_2 = new AlbControllerVersion('v2.7.2', '1.7.2', false);
    /**
     * v2.8.0
     */
    static V2_8_0 = new AlbControllerVersion('v2.8.0', '1.8.0', false);
    /**
     * v2.8.1
     */
    static V2_8_1 = new AlbControllerVersion('v2.8.1', '1.8.1', false);
    /**
     * v2.8.2
     */
    static V2_8_2 = new AlbControllerVersion('v2.8.2', '1.8.2', false);
    /**
     * Specify a custom version and an associated helm chart version.
     * Use this if the version you need is not available in one of the predefined versions.
     * Note that in this case, you will also need to provide an IAM policy in the controller options.
     *
     * ALB controller version and helm chart version compatibility information can be found
     * here: https://github.com/aws/eks-charts/blob/v0.0.133/stable/aws-load-balancer-controller/Chart.yaml
     *
     * @param version The version number.
     * @param helmChartVersion The version of the helm chart. Version 1.4.1 is the default version to support legacy
     * users.
     */
    static of(version, helmChartVersion = '1.4.1') {
        return new AlbControllerVersion(version, helmChartVersion, true);
    }
    constructor(
    /**
     * The version string.
     */
    version, 
    /**
     * The version of the helm chart to use.
     */
    helmChartVersion, 
    /**
     * Whether or not its a custom version.
     */
    custom) {
        this.version = version;
        this.helmChartVersion = helmChartVersion;
        this.custom = custom;
    }
}
exports.AlbControllerVersion = AlbControllerVersion;
/**
 * ALB Scheme.
 *
 * @see https://kubernetes-sigs.github.io/aws-load-balancer-controller/v2.3/guide/ingress/annotations/#scheme
 */
var AlbScheme;
(function (AlbScheme) {
    /**
     * The nodes of an internal load balancer have only private IP addresses.
     * The DNS name of an internal load balancer is publicly resolvable to the private IP addresses of the nodes.
     * Therefore, internal load balancers can only route requests from clients with access to the VPC for the load balancer.
     */
    AlbScheme["INTERNAL"] = "internal";
    /**
     * An internet-facing load balancer has a publicly resolvable DNS name, so it can route requests from clients over the internet
     * to the EC2 instances that are registered with the load balancer.
     */
    AlbScheme["INTERNET_FACING"] = "internet-facing";
})(AlbScheme || (exports.AlbScheme = AlbScheme = {}));
/**
 * Construct for installing the AWS ALB Contoller on EKS clusters.
 *
 * Use the factory functions `get` and `getOrCreate` to obtain/create instances of this controller.
 *
 * @see https://kubernetes-sigs.github.io/aws-load-balancer-controller
 *
 */
class AlbController extends constructs_1.Construct {
    static [JSII_RTTI_SYMBOL_1] = { fqn: "@aws-cdk/aws-eks-v2-alpha.AlbController", version: "0.0.0" };
    /**
     * Create the controller construct associated with this cluster and scope.
     *
     * Singleton per stack/cluster.
     */
    static create(scope, props) {
        try {
            jsiiDeprecationWarnings._aws_cdk_aws_eks_v2_alpha_AlbControllerProps(props);
        }
        catch (error) {
            if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                Error.captureStackTrace(error, this.create);
            }
            throw error;
        }
        const stack = core_1.Stack.of(scope);
        const uid = AlbController.uid(props.cluster);
        return new AlbController(stack, uid, props);
    }
    static uid(cluster) {
        return `${core_1.Names.nodeUniqueId(cluster.node)}-AlbController`;
    }
    constructor(scope, id, props) {
        super(scope, id);
        try {
            jsiiDeprecationWarnings._aws_cdk_aws_eks_v2_alpha_AlbControllerProps(props);
        }
        catch (error) {
            if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                Error.captureStackTrace(error, AlbController);
            }
            throw error;
        }
        const namespace = 'kube-system';
        const serviceAccount = new service_account_1.ServiceAccount(this, 'alb-sa', {
            namespace,
            name: 'aws-load-balancer-controller',
            cluster: props.cluster,
            overwriteServiceAccount: props.overwriteServiceAccount,
        });
        if (props.version.custom && !props.policy) {
            throw new core_1.ValidationError("'albControllerOptions.policy' is required when using a custom controller version", this);
        }
        // https://kubernetes-sigs.github.io/aws-load-balancer-controller/v2.2/deploy/installation/#iam-permissions
        const policy = props.policy ?? JSON.parse(fs.readFileSync(path.join(__dirname, 'addons', `alb-iam_policy-${props.version.version}.json`), 'utf8'));
        for (const statement of policy.Statement) {
            const rewrittenStatement = {
                ...statement,
                Resource: this.rewritePolicyResources(statement.Resource),
            };
            serviceAccount.addToPrincipalPolicy(iam.PolicyStatement.fromJson(rewrittenStatement));
        }
        // https://kubernetes-sigs.github.io/aws-load-balancer-controller/v2.2/deploy/installation/#add-controller-to-cluster
        const chart = new helm_chart_1.HelmChart(this, 'Resource', {
            cluster: props.cluster,
            chart: 'aws-load-balancer-controller',
            repository: 'https://aws.github.io/eks-charts',
            namespace,
            release: 'aws-load-balancer-controller',
            version: props.version.helmChartVersion,
            wait: true,
            timeout: core_1.Duration.minutes(15),
            values: {
                clusterName: props.cluster.clusterName,
                serviceAccount: {
                    create: false,
                    name: serviceAccount.serviceAccountName,
                },
                region: core_1.Stack.of(this).region,
                vpcId: props.cluster.vpc.vpcId,
                image: {
                    repository: props.repository ?? '602401143452.dkr.ecr.us-west-2.amazonaws.com/amazon/aws-load-balancer-controller',
                    tag: props.version.version,
                },
                ...props.additionalHelmChartValues,
            },
        });
        // the controller relies on permissions deployed using these resources.
        chart.node.addDependency(serviceAccount);
        chart.node.addDependency(props.cluster.openIdConnectProvider);
    }
    rewritePolicyResources(resources) {
        // This is safe to disable because we're actually replacing the literal partition with a reference to
        // the stack partition (which is hardcoded into the JSON files) to prevent issues such as
        // aws/aws-cdk#22520.
        // eslint-disable-next-line @cdklabs/no-literal-partition
        const rewriteResource = (s) => s.replace('arn:aws:', `arn:${core_1.Aws.PARTITION}:`);
        if (!resources) {
            return resources;
        }
        if (!Array.isArray(resources)) {
            return rewriteResource(resources);
        }
        return resources.map(rewriteResource);
    }
}
exports.AlbController = AlbController;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxiLWNvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhbGItY29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLHlCQUF5QjtBQUN6Qiw2QkFBNkI7QUFDN0IsMkNBQTJDO0FBQzNDLDJDQUF1QztBQUV2Qyw2Q0FBeUM7QUFDekMsdURBQW1EO0FBRW5ELGdIQUFnSDtBQUNoSCwyQkFBMkI7QUFDM0IsMkNBQWdGO0FBRWhGOzs7O0dBSUc7QUFDSCxNQUFhLG9CQUFvQjtJQStMYjtJQUlBO0lBSUE7O0lBdE1sQjs7T0FFRztJQUNJLE1BQU0sQ0FBVSxNQUFNLEdBQUcsSUFBSSxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRW5GOztPQUVHO0lBQ0ksTUFBTSxDQUFVLE1BQU0sR0FBRyxJQUFJLG9CQUFvQixDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFbkY7O09BRUc7SUFDSSxNQUFNLENBQVUsTUFBTSxHQUFHLElBQUksb0JBQW9CLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztJQUVuRjs7T0FFRztJQUNJLE1BQU0sQ0FBVSxNQUFNLEdBQUcsSUFBSSxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRW5GOztPQUVHO0lBQ0ksTUFBTSxDQUFVLE1BQU0sR0FBRyxJQUFJLG9CQUFvQixDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFbkY7O09BRUc7SUFDSSxNQUFNLENBQVUsTUFBTSxHQUFHLElBQUksb0JBQW9CLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztJQUVuRjs7T0FFRztJQUNJLE1BQU0sQ0FBVSxNQUFNLEdBQUcsSUFBSSxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxD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c291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0IHsgQ2x1c3RlciB9IGZyb20gJy4vY2x1c3Rlcic7XG5pbXBvcnQgeyBIZWxtQ2hhcnQgfSBmcm9tICcuL2hlbG0tY2hhcnQnO1xuaW1wb3J0IHsgU2VydmljZUFjY291bnQgfSBmcm9tICcuL3NlcnZpY2UtYWNjb3VudCc7XG5cbi8vIHYyIC0ga2VlcCB0aGlzIGltcG9ydCBhcyBhIHNlcGFyYXRlIHNlY3Rpb24gdG8gcmVkdWNlIG1lcmdlIGNvbmZsaWN0IHdoZW4gZm9yd2FyZCBtZXJnaW5nIHdpdGggdGhlIHYyIGJyYW5jaC5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZVxuaW1wb3J0IHsgQXdzLCBEdXJhdGlvbiwgTmFtZXMsIFN0YWNrLCBWYWxpZGF0aW9uRXJyb3IgfSBmcm9tICdhd3MtY2RrLWxpYi9jb3JlJztcblxuLyoqXG4gKiBDb250cm9sbGVyIHZlcnNpb24uXG4gKlxuICogQ29ycmVzcG9uZHMgdG8gdGhlIGltYWdlIHRhZyBvZiAnYW1hem9uL2F3cy1sb2FkLWJhbGFuY2VyLWNvbnRyb2xsZXInIGltYWdlLlxuICovXG5leHBvcnQgY2xhc3MgQWxiQ29udHJvbGxlclZlcnNpb24ge1xuICAvKipcbiAgICogdjIuMC4wXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFYyXzBfMCA9IG5ldyBBbGJDb250cm9sbGVyVmVyc2lvbigndjIuMC4wJywgJzEuNC4xJywgZmFsc2UpO1xuXG4gIC8qKlxuICAgKiB2Mi4wLjFcbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgVjJfMF8xID0gbmV3IEFsYkNvbnRyb2xsZXJWZXJzaW9uKCd2Mi4wLjEnLCAnMS40LjEnLCBmYWxzZSk7XG5cbiAgLyoqXG4gICAqIHYyLjEuMFxuICAgKi9cbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBWMl8xXzAgPSBuZXcgQWxiQ29udHJvbGxlclZlcnNpb24oJ3YyLjEuMCcsICcxLjQuMScsIGZhbHNlKTtcblxuICAvKipcbiAgICogdjIuMS4xXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFYyXzFfMSA9IG5ldyBBbGJDb250cm9sbGVyVmVyc2lvbigndjIuMS4xJywgJzEuNC4xJywgZmFsc2UpO1xuXG4gIC8qKlxuICAgKiB2Mi4xLjJcbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgVjJfMV8yID0gbmV3IEFsYkNvbnRyb2xsZXJWZXJzaW9uKCd2Mi4xLjInLCAnMS40LjEnLCBmYWxzZSk7XG5cbiAgLyoqXG4gICAqIHYyLjEuM1xuICAgKi9cbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBWMl8xXzMgPSBuZXcgQWxiQ29udHJvbGxlclZlcnNpb24oJ3YyLjEuMycsICcxLjQuMScsIGZhbHNlKTtcblxuICAvKipcbiAgICogdjIuMC4wXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFYyXzJfMCA9IG5ldyBBbGJDb250cm9sbGVyVmVyc2lvbigndjIuMi4wJywgJzEuNC4xJywgZmFsc2UpO1xuXG4gIC8qKlxuICAgKiB2Mi4yLjFcbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgVjJfMl8xID0gbmV3IEFsYkNvbnRyb2xsZXJWZXJzaW9uKCd2Mi4yLjEnLCAnMS40LjEnLCBmYWxzZSk7XG5cbiAgLyoqXG4gICAqIHYyLjIuMlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBWMl8yXzIgPSBuZXcgQWxiQ29udHJvbGxlclZlcnNpb24oJ3YyLjIuMicsICcxLjQuMScsIGZhbHNlKTtcblxuICAvKipcbiAgICogdjIuMi4zXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFYyXzJfMyA9IG5ldyBBbGJDb250cm9sbGVyVmVyc2lvbigndjIuMi4zJywgJzEuNC4xJywgZmFsc2UpO1xuXG4gIC8qKlxuICAgKiB2Mi4yLjRcbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgVjJfMl80ID0gbmV3IEFsYkNvbnRyb2xsZXJWZXJzaW9uKCd2Mi4yLjQnLCAnMS40LjEnLCBmYWxzZSk7XG5cbiAgLyoqXG4gICAqIHYyLjMuMFxuICAgKi9cbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBWMl8zXzAgPSBuZXcgQWxiQ29udHJvbGxlclZlcnNpb24oJ3YyLjMuMCcsICcxLjQuMScsIGZhbHNlKTtcblxuICAvKipcbiAgICogdjIuMy4xXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFYyXzNfMSA9IG5ldyBBbGJDb250cm9sbGVyVmVyc2lvbigndjIuMy4xJywgJzEuNC4xJywgZmFsc2UpO1xuXG4gIC8qKlxuICAgKiB2Mi40LjFcbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgVjJfNF8xID0gbmV3IEFsYkNvbnRyb2xsZXJWZXJzaW9uKCd2Mi40LjEnLCAnMS40LjEnLCBmYWxzZSk7XG5cbiAgLyoqXG4gICAqIHYyLjQuMlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBWMl80XzIgPSBuZXcgQWxiQ29udHJvbGxlclZlcnNpb24oJ3YyLjQuMicsICcxLjQuMycsIGZhbHNlKTtcblxuICAvKipcbiAgICogdjIuNC4zXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFYyXzRfMyA9IG5ldyBBbGJDb250cm9sbGVyVmVyc2lvbigndjIuNC4zJywgJzEuNC40JywgZmFsc2UpO1xuXG4gIC8qKlxuICAgKiB2Mi40LjRcbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgVjJfNF80ID0gbmV3IEFsYkNvbnRyb2xsZXJWZXJzaW9uKCd2Mi40LjQnLCAnMS40LjUnLCBmYWxzZSk7XG5cbiAgLyoqXG4gICAqIHYyLjQuNVxuICAgKi9cbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBWMl80XzUgPSBuZXcgQWxiQ29udHJvbGxlclZlcnNpb24oJ3YyLjQuNScsICcxLjQuNicsIGZhbHNlKTtcblxuICAvKipcbiAgICogdjIuNC42XG4gICAqL1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFYyXzRfNiA9IG5ldyBBbGJDb250cm9sbGVyVmVyc2lvbigndjIuNC42JywgJzEuNC43JywgZmFsc2UpO1xuXG4gIC8qKlxuICAgKiB2Mi40LjdcbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgVjJfNF83ID0gbmV3IEFsYkNvbnRyb2xsZXJWZXJzaW9uKCd2Mi40LjcnLCAnMS40LjgnLCBmYWxzZSk7XG5cbiAgLyoqXG4gICAqIHYyLjUuMFxuICAgKi9cbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBWMl81XzAgPSBuZXcgQWxiQ29udHJvbGxlclZlcnNpb24oJ3YyLjUuMCcsICcxLjUuMCcsIGZhbHNlKTtcblxuICAvKipcbiAgICogdjIuNS4xXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFYyXzVfMSA9IG5ldyBBbGJDb250cm9sbGVyVmVyc2lvbigndjIuNS4xJywgJzEuNS4yJywgZmFsc2UpO1xuXG4gIC8qKlxuICAgKiB2Mi41LjJcbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgVjJfNV8yID0gbmV3IEFsYkNvbnRyb2xsZXJWZXJzaW9uKCd2Mi41LjInLCAnMS41LjMnLCBmYWxzZSk7XG5cbiAgLyoqXG4gICAqIHYyLjUuM1xuICAgKi9cbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBWMl81XzMgPSBuZXcgQWxiQ29udHJvbGxlclZlcnNpb24oJ3YyLjUuMycsICcxLjUuNCcsIGZhbHNlKTtcblxuICAvKipcbiAgICogdjIuNS40XG4gICAqL1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFYyXzVfNCA9IG5ldyBBbGJDb250cm9sbGVyVmVyc2lvbigndjIuNS40JywgJzEuNS41JywgZmFsc2UpO1xuXG4gIC8qKlxuICAgKiB2Mi42LjBcbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgVjJfNl8wID0gbmV3IEFsYkNvbnRyb2xsZXJWZXJzaW9uKCd2Mi42LjAnLCAnMS42LjAnLCBmYWxzZSk7XG5cbiAgLyoqXG4gICAqIHYyLjYuMVxuICAgKi9cbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBWMl82XzEgPSBuZXcgQWxiQ29udHJvbGxlclZlcnNpb24oJ3YyLjYuMScsICcxLjYuMScsIGZhbHNlKTtcblxuICAvKipcbiAgICogdjIuNi4yXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFYyXzZfMiA9IG5ldyBBbGJDb250cm9sbGVyVmVyc2lvbigndjIuNi4yJywgJzEuNi4yJywgZmFsc2UpO1xuXG4gIC8qKlxuICAgKiB2Mi43LjBcbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgVjJfN18wID0gbmV3IEFsYkNvbnRyb2xsZXJWZXJzaW9uKCd2Mi43LjAnLCAnMS43LjAnLCBmYWxzZSk7XG5cbiAgLyoqXG4gICAqIHYyLjcuMVxuICAgKi9cbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBWMl83XzEgPSBuZXcgQWxiQ29udHJvbGxlclZlcnNpb24oJ3YyLjcuMScsICcxLjcuMScsIGZhbHNlKTtcblxuICAvKipcbiAgICogdjIuNy4yXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFYyXzdfMiA9IG5ldyBBbGJDb250cm9sbGVyVmVyc2lvbigndjIuNy4yJywgJzEuNy4yJywgZmFsc2UpO1xuXG4gIC8qKlxuICAgKiB2Mi44LjBcbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgVjJfOF8wID0gbmV3IEFsYkNvbnRyb2xsZXJWZXJzaW9uKCd2Mi44LjAnLCAnMS44LjAnLCBmYWxzZSk7XG5cbiAgLyoqXG4gICAqIHYyLjguMVxuICAgKi9cbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBWMl84XzEgPSBuZXcgQWxiQ29udHJvbGxlclZlcnNpb24oJ3YyLjguMScsICcxLjguMScsIGZhbHNlKTtcblxuICAvKipcbiAgICogdjIuOC4yXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFYyXzhfMiA9IG5ldyBBbGJDb250cm9sbGVyVmVyc2lvbigndjIuOC4yJywgJzEuOC4yJywgZmFsc2UpO1xuXG4gIC8qKlxuICAgKiBTcGVjaWZ5IGEgY3VzdG9tIHZlcnNpb24gYW5kIGFuIGFzc29jaWF0ZWQgaGVsbSBjaGFydCB2ZXJzaW9uLlxuICAgKiBVc2UgdGhpcyBpZiB0aGUgdmVyc2lvbiB5b3UgbmVlZCBpcyBub3QgYXZhaWxhYmxlIGluIG9uZSBvZiB0aGUgcHJlZGVmaW5lZCB2ZXJzaW9ucy5cbiAgICogTm90ZSB0aGF0IGluIHRoaXMgY2FzZSwgeW91IHdpbGwgYWxzbyBuZWVkIHRvIHByb3ZpZGUgYW4gSUFNIHBvbGljeSBpbiB0aGUgY29udHJvbGxlciBvcHRpb25zLlxuICAgKlxuICAgKiBBTEIgY29udHJvbGxlciB2ZXJzaW9uIGFuZCBoZWxtIGNoYXJ0IHZlcnNpb24gY29tcGF0aWJpbGl0eSBpbmZvcm1hdGlvbiBjYW4gYmUgZm91bmRcbiAgICogaGVyZTogaHR0cHM6Ly9naXRodWIuY29tL2F3cy9la3MtY2hhcnRzL2Jsb2IvdjAuMC4xMzMvc3RhYmxlL2F3cy1sb2FkLWJhbGFuY2VyLWNvbnRyb2xsZXIvQ2hhcnQueWFtbFxuICAgKlxuICAgKiBAcGFyYW0gdmVyc2lvbiBUaGUgdmVyc2lvbiBudW1iZXIuXG4gICAqIEBwYXJhbSBoZWxtQ2hhcnRWZXJzaW9uIFRoZSB2ZXJzaW9uIG9mIHRoZSBoZWxtIGNoYXJ0LiBWZXJzaW9uIDEuNC4xIGlzIHRoZSBkZWZhdWx0IHZlcnNpb24gdG8gc3VwcG9ydCBsZWdhY3lcbiAgICogdXNlcnMuXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIG9mKHZlcnNpb246IHN0cmluZywgaGVsbUNoYXJ0VmVyc2lvbjogc3RyaW5nID0gJzEuNC4xJykge1xuICAgIHJldHVybiBuZXcgQWxiQ29udHJvbGxlclZlcnNpb24odmVyc2lvbiwgaGVsbUNoYXJ0VmVyc2lvbiwgdHJ1ZSk7XG4gIH1cblxuICBwcml2YXRlIGNvbnN0cnVjdG9yKFxuICAgIC8qKlxuICAgICAqIFRoZSB2ZXJzaW9uIHN0cmluZy5cbiAgICAgKi9cbiAgICBwdWJsaWMgcmVhZG9ubHkgdmVyc2lvbjogc3RyaW5nLFxuICAgIC8qKlxuICAgICAqIFRoZSB2ZXJzaW9uIG9mIHRoZSBoZWxtIGNoYXJ0IHRvIHVzZS5cbiAgICAgKi9cbiAgICBwdWJsaWMgcmVhZG9ubHkgaGVsbUNoYXJ0VmVyc2lvbjogc3RyaW5nLFxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgb3Igbm90IGl0cyBhIGN1c3RvbSB2ZXJzaW9uLlxuICAgICAqL1xuICAgIHB1YmxpYyByZWFkb25seSBjdXN0b206IGJvb2xlYW4pIHsgfVxufVxuXG4vKipcbiAqIEFMQiBTY2hlbWUuXG4gKlxuICogQHNlZSBodHRwczovL2t1YmVybmV0ZXMtc2lncy5naXRodWIuaW8vYXdzLWxvYWQtYmFsYW5jZXItY29udHJvbGxlci92Mi4zL2d1aWRlL2luZ3Jlc3MvYW5ub3RhdGlvbnMvI3NjaGVtZVxuICovXG5leHBvcnQgZW51bSBBbGJTY2hlbWUge1xuXG4gIC8qKlxuICAgKiBUaGUgbm9kZXMgb2YgYW4gaW50ZXJuYWwgbG9hZCBiYWxhbmNlciBoYXZlIG9ubHkgcHJpdmF0ZSBJUCBhZGRyZXNzZXMuXG4gICAqIFRoZSBETlMgbmFtZSBvZiBhbiBpbnRlcm5hbCBsb2FkIGJhbGFuY2VyIGlzIHB1YmxpY2x5IHJlc29sdmFibGUgdG8gdGhlIHByaXZhdGUgSVAgYWRkcmVzc2VzIG9mIHRoZSBub2Rlcy5cbiAgICogVGhlcmVmb3JlLCBpbnRlcm5hbCBsb2FkIGJhbGFuY2VycyBjYW4gb25seSByb3V0ZSByZXF1ZXN0cyBmcm9tIGNsaWVudHMgd2l0aCBhY2Nlc3MgdG8gdGhlIFZQQyBmb3IgdGhlIGxvYWQgYmFsYW5jZXIuXG4gICAqL1xuICBJTlRFUk5BTCA9ICdpbnRlcm5hbCcsXG5cbiAgLyoqXG4gICAqIEFuIGludGVybmV0LWZhY2luZyBsb2FkIGJhbGFuY2VyIGhhcyBhIHB1YmxpY2x5IHJlc29sdmFibGUgRE5TIG5hbWUsIHNvIGl0IGNhbiByb3V0ZSByZXF1ZXN0cyBmcm9tIGNsaWVudHMgb3ZlciB0aGUgaW50ZXJuZXRcbiAgICogdG8gdGhlIEVDMiBpbnN0YW5jZXMgdGhhdCBhcmUgcmVnaXN0ZXJlZCB3aXRoIHRoZSBsb2FkIGJhbGFuY2VyLlxuICAgKi9cbiAgSU5URVJORVRfRkFDSU5HID0gJ2ludGVybmV0LWZhY2luZycsXG59XG5cbi8qKlxuICogT3B0aW9ucyBmb3IgYEFsYkNvbnRyb2xsZXJgLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEFsYkNvbnRyb2xsZXJPcHRpb25zIHtcblxuICAvKipcbiAgICogVmVyc2lvbiBvZiB0aGUgY29udHJvbGxlci5cbiAgICovXG4gIHJlYWRvbmx5IHZlcnNpb246IEFsYkNvbnRyb2xsZXJWZXJzaW9uO1xuXG4gIC8qKlxuICAgKiBUaGUgcmVwb3NpdG9yeSB0byBwdWxsIHRoZSBjb250cm9sbGVyIGltYWdlIGZyb20uXG4gICAqXG4gICAqIE5vdGUgdGhhdCB0aGUgZGVmYXVsdCByZXBvc2l0b3J5IHdvcmtzIGZvciBtb3N0IHJlZ2lvbnMsIGJ1dCBub3QgYWxsLlxuICAgKiBJZiB0aGUgcmVwb3NpdG9yeSBpcyBub3QgYXBwbGljYWJsZSB0byB5b3VyIHJlZ2lvbiwgdXNlIGEgY3VzdG9tIHJlcG9zaXRvcnlcbiAgICogYWNjb3JkaW5nIHRvIHRoZSBpbmZvcm1hdGlvbiBoZXJlOiBodHRwczovL2dpdGh1Yi5jb20va3ViZXJuZXRlcy1zaWdzL2F3cy1sb2FkLWJhbGFuY2VyLWNvbnRyb2xsZXIvcmVsZWFzZXMuXG4gICAqXG4gICAqIEBkZWZhdWx0ICc2MDI0MDExNDM0NTIuZGtyLmVjci51cy13ZXN0LTIuYW1hem9uYXdzLmNvbS9hbWF6b24vYXdzLWxvYWQtYmFsYW5jZXItY29udHJvbGxlcidcbiAgICovXG4gIHJlYWRvbmx5IHJlcG9zaXRvcnk/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFRoZSBJQU0gcG9saWN5IHRvIGFwcGx5IHRvIHRoZSBzZXJ2aWNlIGFjY291bnQuXG4gICAqXG4gICAqIElmIHlvdSdyZSB1c2luZyBvbmUgb2YgdGhlIGJ1aWx0LWluIHZlcnNpb25zLCB0aGlzIGlzIG5vdCByZXF1aXJlZCBzaW5jZVxuICAgKiBDREsgc2hpcHMgd2l0aCB0aGUgYXBwcm9wcmlhdGUgcG9saWNpZXMgZm9yIHRob3NlIHZlcnNpb25zLlxuICAgKlxuICAgKiBIb3dldmVyLCBpZiB5b3UgYXJlIHVzaW5nIGEgY3VzdG9tIHZlcnNpb24sIHRoaXMgaXMgcmVxdWlyZWQgKGFuZCB2YWxpZGF0ZWQpLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIENvcnJlc3BvbmRzIHRvIHRoZSBwcmVkZWZpbmVkIHZlcnNpb24uXG4gICAqL1xuICByZWFkb25seSBwb2xpY3k/OiBhbnk7XG5cbiAgLyoqXG4gICAqIEFkZGl0aW9uYWwgaGVsbSBjaGFydCB2YWx1ZXMgZm9yIEFMQiBjb250cm9sbGVyXG4gICAqXG4gICAqIEZvciBhdmFpbGFibGUgb3B0aW9ucywgc2VlOlxuICAgKiBodHRwczovL2dpdGh1Yi5jb20va3ViZXJuZXRlcy1zaWdzL2F3cy1sb2FkLWJhbGFuY2VyLWNvbnRyb2xsZXIvYmxvYi9tYWluL2hlbG0vYXdzLWxvYWQtYmFsYW5jZXItY29udHJvbGxlci92YWx1ZXMueWFtbFxuICAgKlxuICAgKiBAZGVmYXVsdCAtIG5vIGFkZGl0aW9uYWwgaGVsbSBjaGFydCB2YWx1ZXNcbiAgICovXG4gIHJlYWRvbmx5IGFkZGl0aW9uYWxIZWxtQ2hhcnRWYWx1ZXM/OiB7W2tleTogc3RyaW5nXTogYW55fTtcblxuICAvKipcbiAgICogT3ZlcndyaXRlIGFueSBleGlzdGluZyBBTEIgY29udHJvbGxlciBzZXJ2aWNlIGFjY291bnQuXG4gICAqXG4gICAqIElmIHRoaXMgaXMgc2V0LCB3ZSB3aWxsIHVzZSBga3ViZWN0bCBhcHBseWAgaW5zdGVhZCBvZiBga3ViZWN0bCBjcmVhdGVgXG4gICAqIHdoZW4gdGhlIEFMQiBjb250cm9sbGVyIHNlcnZpY2UgYWNjb3VudCBpcyBjcmVhdGVkLiBPdGhlcndpc2UsIGlmIHRoZXJlIGlzIGFscmVhZHkgYSBzZXJ2aWNlIGFjY291bnRcbiAgICogbmFtZWQgJ2F3cy1sb2FkLWJhbGFuY2VyLWNvbnRyb2xsZXInIGluIHRoZSBrdWJlLXN5c3RlbSBuYW1lc3BhY2UsIHRoZSBvcGVyYXRpb24gd2lsbCBmYWlsLlxuICAgKlxuICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgKi9cbiAgcmVhZG9ubHkgb3ZlcndyaXRlU2VydmljZUFjY291bnQ/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIFByb3BlcnRpZXMgZm9yIGBBbGJDb250cm9sbGVyYC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBbGJDb250cm9sbGVyUHJvcHMgZXh0ZW5kcyBBbGJDb250cm9sbGVyT3B0aW9ucyB7XG5cbiAgLyoqXG4gICAqIFtkaXNhYmxlLWF3c2xpbnQ6cmVmLXZpYS1pbnRlcmZhY2VdXG4gICAqIENsdXN0ZXIgdG8gaW5zdGFsbCB0aGUgY29udHJvbGxlciBvbnRvLlxuICAgKi9cbiAgcmVhZG9ubHkgY2x1c3RlcjogQ2x1c3Rlcjtcbn1cblxuLyoqXG4gKiBDb25zdHJ1Y3QgZm9yIGluc3RhbGxpbmcgdGhlIEFXUyBBTEIgQ29udG9sbGVyIG9uIEVLUyBjbHVzdGVycy5cbiAqXG4gKiBVc2UgdGhlIGZhY3RvcnkgZnVuY3Rpb25zIGBnZXRgIGFuZCBgZ2V0T3JDcmVhdGVgIHRvIG9idGFpbi9jcmVhdGUgaW5zdGFuY2VzIG9mIHRoaXMgY29udHJvbGxlci5cbiAqXG4gKiBAc2VlIGh0dHBzOi8va3ViZXJuZXRlcy1zaWdzLmdpdGh1Yi5pby9hd3MtbG9hZC1iYWxhbmNlci1jb250cm9sbGVyXG4gKlxuICovXG5leHBvcnQgY2xhc3MgQWxiQ29udHJvbGxlciBleHRlbmRzIENvbnN0cnVjdCB7XG4gIC8qKlxuICAgKiBDcmVhdGUgdGhlIGNvbnRyb2xsZXIgY29uc3RydWN0IGFzc29jaWF0ZWQgd2l0aCB0aGlzIGNsdXN0ZXIgYW5kIHNjb3BlLlxuICAgKlxuICAgKiBTaW5nbGV0b24gcGVyIHN0YWNrL2NsdXN0ZXIuXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGNyZWF0ZShzY29wZTogQ29uc3RydWN0LCBwcm9wczogQWxiQ29udHJvbGxlclByb3BzKSB7XG4gICAgY29uc3Qgc3RhY2sgPSBTdGFjay5vZihzY29wZSk7XG4gICAgY29uc3QgdWlkID0gQWxiQ29udHJvbGxlci51aWQocHJvcHMuY2x1c3Rlcik7XG4gICAgcmV0dXJuIG5ldyBBbGJDb250cm9sbGVyKHN0YWNrLCB1aWQsIHByb3BzKTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIHVpZChjbHVzdGVyOiBDbHVzdGVyKSB7XG4gICAgcmV0dXJuIGAke05hbWVzLm5vZGVVbmlxdWVJZChjbHVzdGVyLm5vZGUpfS1BbGJDb250cm9sbGVyYDtcbiAgfVxuXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogQWxiQ29udHJvbGxlclByb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIGNvbnN0IG5hbWVzcGFjZSA9ICdrdWJlLXN5c3RlbSc7XG4gICAgY29uc3Qgc2VydmljZUFjY291bnQgPSBuZXcgU2VydmljZUFjY291bnQodGhpcywgJ2FsYi1zYScsIHtcbiAgICAgIG5hbWVzcGFjZSxcbiAgICAgIG5hbWU6ICdhd3MtbG9hZC1iYWxhbmNlci1jb250cm9sbGVyJyxcbiAgICAgIGNsdXN0ZXI6IHByb3BzLmNsdXN0ZXIsXG4gICAgICBvdmVyd3JpdGVTZXJ2aWNlQWNjb3VudDogcHJvcHMub3ZlcndyaXRlU2VydmljZUFjY291bnQsXG4gICAgfSk7XG5cbiAgICBpZiAocHJvcHMudmVyc2lvbi5jdXN0b20gJiYgIXByb3BzLnBvbGljeSkge1xuICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcihcIidhbGJDb250cm9sbGVyT3B0aW9ucy5wb2xpY3knIGlzIHJlcXVpcmVkIHdoZW4gdXNpbmcgYSBjdXN0b20gY29udHJvbGxlciB2ZXJzaW9uXCIsIHRoaXMpO1xuICAgIH1cblxuICAgIC8vIGh0dHBzOi8va3ViZXJuZXRlcy1zaWdzLmdpdGh1Yi5pby9hd3MtbG9hZC1iYWxhbmNlci1jb250cm9sbGVyL3YyLjIvZGVwbG95L2luc3RhbGxhdGlvbi8jaWFtLXBlcm1pc3Npb25zXG4gICAgY29uc3QgcG9saWN5OiBhbnkgPSBwcm9wcy5wb2xpY3kgPz8gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMocGF0aC5qb2luKF9fZGlybmFtZSwgJ2FkZG9ucycsIGBhbGItaWFtX3BvbGljeS0ke3Byb3BzLnZlcnNpb24udmVyc2lvbn0uanNvbmApLCAndXRmOCcpKTtcblxuICAgIGZvciAoY29uc3Qgc3RhdGVtZW50IG9mIHBvbGljeS5TdGF0ZW1lbnQpIHtcbiAgICAgIGNvbnN0IHJld3JpdHRlblN0YXRlbWVudCA9IHtcbiAgICAgICAgLi4uc3RhdGVtZW50LFxuICAgICAgICBSZXNvdXJjZTogdGhpcy5yZXdyaXRlUG9saWN5UmVzb3VyY2VzKHN0YXRlbWVudC5SZXNvdXJjZSksXG4gICAgICB9O1xuICAgICAgc2VydmljZUFjY291bnQuYWRkVG9QcmluY2lwYWxQb2xpY3koaWFtLlBvbGljeVN0YXRlbWVudC5mcm9tSnNvbihyZXdyaXR0ZW5TdGF0ZW1lbnQpKTtcbiAgICB9XG5cbiAgICAvLyBodHRwczovL2t1YmVybmV0ZXMtc2lncy5naXRodWIuaW8vYXdzLWxvYWQtYmFsYW5jZXItY29udHJvbGxlci92Mi4yL2RlcGxveS9pbnN0YWxsYXRpb24vI2FkZC1jb250cm9sbGVyLXRvLWNsdXN0ZXJcbiAgICBjb25zdCBjaGFydCA9IG5ldyBIZWxtQ2hhcnQodGhpcywgJ1Jlc291cmNlJywge1xuICAgICAgY2x1c3RlcjogcHJvcHMuY2x1c3RlcixcbiAgICAgIGNoYXJ0OiAnYXdzLWxvYWQtYmFsYW5jZXItY29udHJvbGxlcicsXG4gICAgICByZXBvc2l0b3J5OiAnaHR0cHM6Ly9hd3MuZ2l0aHViLmlvL2Vrcy1jaGFydHMnLFxuICAgICAgbmFtZXNwYWNlLFxuICAgICAgcmVsZWFzZTogJ2F3cy1sb2FkLWJhbGFuY2VyLWNvbnRyb2xsZXInLFxuICAgICAgdmVyc2lvbjogcHJvcHMudmVyc2lvbi5oZWxtQ2hhcnRWZXJzaW9uLFxuXG4gICAgICB3YWl0OiB0cnVlLFxuICAgICAgdGltZW91dDogRHVyYXRpb24ubWludXRlcygxNSksXG4gICAgICB2YWx1ZXM6IHtcbiAgICAgICAgY2x1c3Rlck5hbWU6IHByb3BzLmNsdXN0ZXIuY2x1c3Rlck5hbWUsXG4gICAgICAgIHNlcnZpY2VBY2NvdW50OiB7XG4gICAgICAgICAgY3JlYXRlOiBmYWxzZSxcbiAgICAgICAgICBuYW1lOiBzZXJ2aWNlQWNjb3VudC5zZXJ2aWNlQWNjb3VudE5hbWUsXG4gICAgICAgIH0sXG4gICAgICAgIHJlZ2lvbjogU3RhY2sub2YodGhpcykucmVnaW9uLFxuICAgICAgICB2cGNJZDogcHJvcHMuY2x1c3Rlci52cGMudnBjSWQsXG4gICAgICAgIGltYWdlOiB7XG4gICAgICAgICAgcmVwb3NpdG9yeTogcHJvcHMucmVwb3NpdG9yeSA/PyAnNjAyNDAxMTQzNDUyLmRrci5lY3IudXMtd2VzdC0yLmFtYXpvbmF3cy5jb20vYW1hem9uL2F3cy1sb2FkLWJhbGFuY2VyLWNvbnRyb2xsZXInLFxuICAgICAgICAgIHRhZzogcHJvcHMudmVyc2lvbi52ZXJzaW9uLFxuICAgICAgICB9LFxuICAgICAgICAuLi5wcm9wcy5hZGRpdGlvbmFsSGVsbUNoYXJ0VmFsdWVzLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIHRoZSBjb250cm9sbGVyIHJlbGllcyBvbiBwZXJtaXNzaW9ucyBkZXBsb3llZCB1c2luZyB0aGVzZSByZXNvdXJjZXMuXG4gICAgY2hhcnQubm9kZS5hZGREZXBlbmRlbmN5KHNlcnZpY2VBY2NvdW50KTtcbiAgICBjaGFydC5ub2RlLmFkZERlcGVuZGVuY3kocHJvcHMuY2x1c3Rlci5vcGVuSWRDb25uZWN0UHJvdmlkZXIpO1xuICB9XG5cbiAgcHJpdmF0ZSByZXdyaXRlUG9saWN5UmVzb3VyY2VzKHJlc291cmNlczogc3RyaW5nIHwgc3RyaW5nW10gfCB1bmRlZmluZWQpOiBzdHJpbmcgfCBzdHJpbmdbXSB8IHVuZGVmaW5lZCB7XG4gICAgLy8gVGhpcyBpcyBzYWZlIHRvIGRpc2FibGUgYmVjYXVzZSB3ZSdyZSBhY3R1YWxseSByZXBsYWNpbmcgdGhlIGxpdGVyYWwgcGFydGl0aW9uIHdpdGggYSByZWZlcmVuY2UgdG9cbiAgICAvLyB0aGUgc3RhY2sgcGFydGl0aW9uICh3aGljaCBpcyBoYXJkY29kZWQgaW50byB0aGUgSlNPTiBmaWxlcykgdG8gcHJldmVudCBpc3N1ZXMgc3VjaCBhc1xuICAgIC8vIGF3cy9hd3MtY2RrIzIyNTIwLlxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAY2RrbGFicy9uby1saXRlcmFsLXBhcnRpdGlvblxuICAgIGNvbnN0IHJld3JpdGVSZXNvdXJjZSA9IChzOiBzdHJpbmcpID0+IHMucmVwbGFjZSgnYXJuOmF3czonLCBgYXJuOiR7QXdzLlBBUlRJVElPTn06YCk7XG5cbiAgICBpZiAoIXJlc291cmNlcykge1xuICAgICAgcmV0dXJuIHJlc291cmNlcztcbiAgICB9XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHJlc291cmNlcykpIHtcbiAgICAgIHJldHVybiByZXdyaXRlUmVzb3VyY2UocmVzb3VyY2VzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc291cmNlcy5tYXAocmV3cml0ZVJlc291cmNlKTtcbiAgfVxufVxuIl19