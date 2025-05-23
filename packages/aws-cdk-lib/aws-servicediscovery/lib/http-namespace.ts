import { Construct } from 'constructs';
import { BaseNamespaceProps, INamespace, NamespaceType } from './namespace';
import { BaseServiceProps, Service } from './service';
import { CfnHttpNamespace } from './servicediscovery.generated';
import { Resource } from '../../core';
import { addConstructMetadata, MethodMetadata } from '../../core/lib/metadata-resource';
import { propertyInjectable } from '../../core/lib/prop-injectable';

export interface HttpNamespaceProps extends BaseNamespaceProps {}
export interface IHttpNamespace extends INamespace { }
export interface HttpNamespaceAttributes {
  /**
   * A name for the Namespace.
   */
  readonly namespaceName: string;

  /**
   * Namespace Id for the Namespace.
   */
  readonly namespaceId: string;

  /**
   * Namespace ARN for the Namespace.
   */
  readonly namespaceArn: string;
}

/**
 * Define an HTTP Namespace
 */
@propertyInjectable
export class HttpNamespace extends Resource implements IHttpNamespace {
  /** Uniquely identifies this class. */
  public static readonly PROPERTY_INJECTION_ID: string = 'aws-cdk-lib.aws-servicediscovery.HttpNamespace';

  public static fromHttpNamespaceAttributes(scope: Construct, id: string, attrs: HttpNamespaceAttributes): IHttpNamespace {
    class Import extends Resource implements IHttpNamespace {
      public namespaceName = attrs.namespaceName;
      public namespaceId = attrs.namespaceId;
      public namespaceArn = attrs.namespaceArn;
      public type = NamespaceType.HTTP;
    }
    return new Import(scope, id);
  }

  /**
   * A name for the namespace.
   */
  public readonly namespaceName: string;

  /**
   * Namespace Id for the namespace.
   */
  public readonly namespaceId: string;

  /**
   * Namespace Arn for the namespace.
   */
  public readonly namespaceArn: string;

  /**
   * Type of the namespace.
   */
  public readonly type: NamespaceType;

  constructor(scope: Construct, id: string, props: HttpNamespaceProps) {
    super(scope, id);
    // Enhanced CDK Analytics Telemetry
    addConstructMetadata(this, props);

    const ns = new CfnHttpNamespace(this, 'Resource', {
      name: props.name,
      description: props.description,
    });

    this.namespaceName = props.name;
    this.namespaceId = ns.attrId;
    this.namespaceArn = ns.attrArn;
    this.type = NamespaceType.HTTP;
  }

  /** @attribute */
  public get httpNamespaceArn() { return this.namespaceArn; }

  /** @attribute */
  public get httpNamespaceName() { return this.namespaceName; }

  /** @attribute */
  public get httpNamespaceId() { return this.namespaceId; }

  /**
   * Creates a service within the namespace
   */
  @MethodMetadata()
  public createService(id: string, props?: BaseServiceProps): Service {
    return new Service(this, id, {
      namespace: this,
      ...props,
    });
  }
}
