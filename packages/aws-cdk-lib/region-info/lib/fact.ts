import { AWS_REGIONS } from './aws-entities';
import { UnscopedValidationError } from '../../core/lib/errors';

/**
 * A database of regional information.
 */
export class Fact {
  /**
   * @returns the list of names of AWS Regions for which there is at least one registered fact. This
   *          includes Regions defined in AWS_REGIONS plus custom defined regions.
   */
  public static get regions(): string[] {
    // Return the union of regions in AWS_REGIONS and custom defined regions.
    return [...new Set([...AWS_REGIONS, ...Object.keys(this.database)])];
  }

  /**
   * Returns the list of names of registered facts.
   *
   * All facts will be present in at least one region.
   */
  public static get names(): string[] {
    return [...new Set(Object.values(this.database).flatMap(regionFacts => Object.keys(regionFacts)))];
  }

  /**
   * Return all pairs of (region, factName) that are defined
   */
  public static definedFacts(): Array<string[]> {
    return Object.entries(this.database)
      .flatMap(([regionName, regionFacts]) =>
        Object.keys(regionFacts).map((factName) =>
          [regionName, factName] satisfies [string, string]));
  }

  /**
   * Retrieves a fact from this Fact database.
   *
   * @param region the name of the region (e.g: `us-east-1`)
   * @param name   the name of the fact being looked up (see the `FactName` class for details)
   *
   * @returns the fact value if it is known, and `undefined` otherwise.
   */
  public static find(region: string, name: string): string | undefined {
    const regionFacts = this.database[region];
    return regionFacts && regionFacts[name];
  }

  /**
   * Retrieve a fact from the Fact database. (retrieval will fail if the specified region or
   * fact name does not exist.)
   *
   * @param region the name of the region (e.g: `us-east-1`)
   * @param name the name of the fact being looked up (see the `FactName` class for details)
   */
  public static requireFact(region: string, name: string): string {
    const foundFact = this.find(region, name);

    if (!foundFact) {
      throw new UnscopedValidationError(`No fact ${name} could be found for region: ${region} and name: ${name}.`);
    }

    return foundFact;
  }

  /**
   * Registers a new fact in this Fact database.
   *
   * @param fact           the new fact to be registered.
   * @param allowReplacing whether new facts can replace existing facts or not.
   */
  public static register(fact: IFact, allowReplacing = false): void {
    const regionFacts = this.database[fact.region] || (this.database[fact.region] = {});
    if (fact.name in regionFacts && regionFacts[fact.name] !== fact.value && !allowReplacing) {
      throw new UnscopedValidationError(`Region ${fact.region} already has a fact ${fact.name}, with value ${regionFacts[fact.name]}`);
    }
    if (fact.value !== undefined) {
      regionFacts[fact.name] = fact.value;
    }
  }

  /**
   * Removes a fact from the database.
   * @param region the region for which the fact is to be removed.
   * @param name   the name of the fact to remove.
   * @param value  the value that should be removed (removal will fail if the value is specified, but does not match the
   *               current stored value).
   */
  public static unregister(region: string, name: string, value?: string): void {
    const regionFacts = this.database[region] || {};
    if (name in regionFacts && value && regionFacts[name] !== value) {
      throw new UnscopedValidationError(`Attempted to remove ${name} from ${region} with value ${value}, but the fact's value is ${regionFacts[name]}`);
    }
    delete regionFacts[name];
  }

  private static readonly database: { [region: string]: { [name: string]: string } } = {};

  private constructor() {
    throw new UnscopedValidationError('Use the static methods of Fact instead!');
  }
}

/**
 * A fact that can be registered about a particular region.
 */
export interface IFact {
  /**
   * The region for which this fact applies.
   */
  readonly region: string;

  /**
   * The name of this fact. Standardized values are provided by the `Facts` class.
   */
  readonly name: string;

  /**
   * The value of this fact.
   */
  readonly value: string | undefined;
}

/**
 * All standardized fact names.
 */
export class FactName {
  /**
   * The name of the partition for a region (e.g: 'aws', 'aws-cn', ...)
   */
  public static readonly PARTITION = 'partition';

  /**
   * The domain suffix for a region (e.g: 'amazonaws.com`)
   */
  public static readonly DOMAIN_SUFFIX = 'domainSuffix';

  /**
   * Whether the AWS::CDK::Metadata CloudFormation Resource is available in-region or not. The value is a boolean
   * modelled as `YES` or `NO`.
   */
  public static readonly CDK_METADATA_RESOURCE_AVAILABLE = 'cdk:metadata-resource:available';

  /**
   * Whether the given region is an opt-in region or not. The value is a boolean
   * modelled as `YES` or `NO`.
   */
  public static readonly IS_OPT_IN_REGION = 'aws:is-opt-in-region';

  /**
   * The endpoint used for hosting S3 static websites
   */
  public static readonly S3_STATIC_WEBSITE_ENDPOINT = 's3-static-website:endpoint';

  /**
   * The endpoint used for aliasing S3 static websites in Route 53
   */
  public static readonly S3_STATIC_WEBSITE_ZONE_53_HOSTED_ZONE_ID = 's3-static-website:route-53-hosted-zone-id';

  /**
   * The hosted zone ID used by Route 53 to alias a EBS environment endpoint in this region (e.g: Z2O1EMRO9K5GLX)
   */
  public static readonly EBS_ENV_ENDPOINT_HOSTED_ZONE_ID = 'ebs-environment:route-53-hosted-zone-id';

  /**
   * The prefix for VPC Endpoint Service names,
   * cn.com.amazonaws.vpce for China regions,
   * com.amazonaws.vpce otherwise.
   */
  public static readonly VPC_ENDPOINT_SERVICE_NAME_PREFIX = 'vpcEndpointServiceNamePrefix';

  /**
   * The account for ELBv2 in this region
   */
  public static readonly ELBV2_ACCOUNT = 'elbv2Account';

  /**
   * The ID of the AWS account that owns the public ECR repository that contains the
   * AWS Deep Learning Containers images in a given region.
   */
  public static readonly DLC_REPOSITORY_ACCOUNT = 'dlcRepositoryAccount';

  /**
   * The ID of the AWS account that owns the public ECR repository that contains the
   * AWS App Mesh Envoy Proxy images in a given region.
   */
  public static readonly APPMESH_ECR_ACCOUNT = 'appMeshRepositoryAccount';

  /**
   * The CIDR block used by Amazon Data Firehose servers.
   */
  public static readonly FIREHOSE_CIDR_BLOCK = 'firehoseCidrBlock';

  /**
   * The SAML Sign On URL for partition used by IAM SAML Principal
   */
  public static readonly SAML_SIGN_ON_URL = 'samlSignOnUrl';

  /**
   * The latest Lambda NodeJS runtime available in a given region.
   */
  public static readonly LATEST_NODE_RUNTIME = 'latestNodeRuntime';

  /**
   * The ARN of CloudWatch Lambda Insights for a version (e.g. 1.0.98.0)
   */
  public static cloudwatchLambdaInsightsVersion(version: string, arch?: string) {
    // if we are provided an architecture use that, otherwise
    // default to x86_64 for backwards compatibility
    const suffix = version.split('.').join('_') + `_${arch ?? 'x86_64'}`;
    return `cloudwatch-lambda-insights-version:${suffix}`;
  }

  /**
   * The ARN of AppConfig Lambda Layer for a given version (e.g. 2.0.181)
   * @param version The layer version.
   * @param arch The architecture (optional), defaults to x86_64.
   */
  public static appConfigLambdaLayerVersion(version: string, arch?: string) {
    const suffix = version.split('.').join('_') + `_${arch ?? 'x86_64'}`;
    return `appconfig-lambda-layer:${suffix}`;
  }

  /**
   * The name of the regional service principal for a given service.
   *
   * @param service the service name, either simple (e.g: `s3`, `codedeploy`) or qualified (e.g: `s3.amazonaws.com`).
   *                The `.amazonaws.com` and `.amazonaws.com.cn` domains are stripped from service names, so they are
   *                canonicalized in that respect.
   *
   * @deprecated - Use `iam.ServicePrincipal.servicePrincipalName()` instead.
   */
  public static servicePrincipal(service: string): string {
    return `${service.replace(/\.amazonaws\.com(\.cn)?$/, '')}.amazonaws.com`;
  }

  /**
   * The ARN of Amazon Distro for OpenTelemetry (ADOT) Lambda layer for a given lambda type, version and architecture.
   *
   * @param type the type of the ADOT lambda layer
   * @param version the layer version.
   * @param architecture the Lambda Function architecture (e.g. 'x86_64' or 'arm64')
   */
  public static adotLambdaLayer(type: string, version: string, architecture: string): string {
    const suffix = type + '_' + version.split('.').join('_') + '_' + architecture;
    return `adot-lambda-layer:${suffix}`;
  }

  /**
   * The ARN of Parameters and Secrets Lambda layer for a given lambda architecture.
   *
   * @param version the layer version
   * @param architecture the Lambda Function architecture (e.g. 'x86_64' or 'arm64')
   */
  public static paramsAndSecretsLambdaLayer(version: string, architecture: string): string {
    const suffix = version.split('.').join('_') + `_${architecture}`;
    return `params-and-secrets-layer:${suffix}`;
  }
}
