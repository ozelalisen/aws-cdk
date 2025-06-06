/* eslint-disable import/order */
import { Construct, Node } from 'constructs';
import { debugModeEnabled } from './debug';
import { Lazy } from './lazy';
import * as cxschema from '../../cloud-assembly-schema';
import * as cxapi from '../../cx-api';

const CFN_ELEMENT_SYMBOL = Symbol.for('@aws-cdk/core.CfnElement');

/**
 * An element of a CloudFormation stack.
 */
export abstract class CfnElement extends Construct {
  /**
   * Returns `true` if a construct is a stack element (i.e. part of the
   * synthesized cloudformation template).
   *
   * Uses duck-typing instead of `instanceof` to allow stack elements from different
   * versions of this library to be included in the same stack.
   *
   * @returns The construct as a stack element or undefined if it is not a stack element.
   */
  public static isCfnElement(x: any): x is CfnElement {
    return CFN_ELEMENT_SYMBOL in x;
  }

  /**
   * The logical ID for this CloudFormation stack element. The logical ID of the element
   * is calculated from the path of the resource node in the construct tree.
   *
   * To override this value, use `overrideLogicalId(newLogicalId)`.
   *
   * @returns the logical ID as a stringified token. This value will only get
   * resolved during synthesis.
   */
  public readonly logicalId: string;

  /**
   * The stack in which this element is defined. CfnElements must be defined within a stack scope (directly or indirectly).
   */
  public readonly stack: Stack;

  /**
   * An explicit logical ID provided by `overrideLogicalId`.
   */
  private _logicalIdOverride?: string;

  /**
   * If the logicalId is locked then it can no longer be overridden.
   * This is needed for cases where the logicalId is consumed prior to synthesis
   * (i.e. Stack.exportValue).
   */
  private _logicalIdLocked?: boolean;

  /**
   * Creates an entity and binds it to a tree.
   * Note that the root of the tree must be a Stack object (not just any Root).
   *
   * @param scope The parent construct
   * @param props Construct properties
   */
  constructor(scope: Construct, id: string) {
    super(scope, id);

    Object.defineProperty(this, CFN_ELEMENT_SYMBOL, { value: true });

    this.stack = Stack.of(this);

    this.logicalId = Lazy.uncachedString({ produce: () => this.synthesizeLogicalId() }, {
      displayHint: `${notTooLong(Node.of(this).path)}.LogicalID`,
    });

    if (!this.node.tryGetContext(cxapi.DISABLE_LOGICAL_ID_METADATA)) {
      Node.of(this).addMetadata(cxschema.ArtifactMetadataEntryType.LOGICAL_ID, this.logicalId, {
        stackTrace: debugModeEnabled(),
        traceFromFunction: this.constructor,
      });
    }
  }

  /**
   * Overrides the auto-generated logical ID with a specific ID.
   * @param newLogicalId The new logical ID to use for this stack element.
   */
  public overrideLogicalId(newLogicalId: string) {
    if (this._logicalIdLocked) {
      throw new ValidationError(`The logicalId for resource at path ${Node.of(this).path} has been locked and cannot be overridden\n` +
        'Make sure you are calling "overrideLogicalId" before Stack.exportValue', this);
    } else {
      this._logicalIdOverride = newLogicalId;
    }
  }

  /**
   * Lock the logicalId of the element and do not allow
   * any updates (e.g. via overrideLogicalId)
   *
   * This is needed in cases where you are consuming the LogicalID
   * of an element prior to synthesis and you need to not allow future
   * changes to the id since doing so would cause the value you just
   * consumed to differ from the synth time value of the logicalId.
   *
   * For example:
   *
   * const bucket = new Bucket(stack, 'Bucket');
   * stack.exportValue(bucket.bucketArn) <--- consuming the logicalId
   * bucket.overrideLogicalId('NewLogicalId') <--- updating logicalId
   *
   * You should most likely never need to use this method, and if
   * you are implementing a feature that requires this, make sure
   * you actually require it.
   *
   * @internal
   */
  public _lockLogicalId(): void {
    this._logicalIdLocked = true;
  }

  /**
   * @returns the stack trace of the point where this Resource was created from, sourced
   *      from the +metadata+ entry typed +aws:cdk:logicalId+, and with the bottom-most
   *      node +internal+ entries filtered.
   */
  public get creationStack(): string[] {
    const trace = Node.of(this).metadata.find(md => md.type === cxschema.ArtifactMetadataEntryType.LOGICAL_ID)!.trace;
    if (!trace) {
      return [];
    }

    return filterStackTrace(trace);

    function filterStackTrace(stack: string[]): string[] {
      const result = Array.of(...stack);
      while (result.length > 0 && shouldFilter(result[result.length - 1])) {
        result.pop();
      }
      // It's weird if we filtered everything, so return the whole stack...
      return result.length === 0 ? stack : result;
    }

    function shouldFilter(str: string): boolean {
      return str.match(/[^(]+\(internal\/.*/) !== null;
    }
  }

  /**
   * Returns the CloudFormation 'snippet' for this entity. The snippet will only be merged
   * at the root level to ensure there are no identity conflicts.
   *
   * For example, a Resource class will return something like:
   * {
   *   Resources: {
   *     [this.logicalId]: {
   *       Type: this.resourceType,
   *       Properties: this.props,
   *       Condition: this.condition
   *     }
   *   }
   * }
   *
   * @internal
   */
  public abstract _toCloudFormation(): object;

  /**
   * Called during synthesize to render the logical ID of this element. If
   * `overrideLogicalId` was it will be used, otherwise, we will allocate the
   * logical ID through the stack.
   */
  private synthesizeLogicalId() {
    if (this._logicalIdOverride) {
      return this._logicalIdOverride;
    } else {
      return this.stack.getLogicalId(this);
    }
  }
}

/**
 * Base class for referencable CloudFormation constructs which are not Resources
 *
 * These constructs are things like Conditions and Parameters, can be
 * referenced by taking the `.ref` attribute.
 *
 * Resource constructs do not inherit from CfnRefElement because they have their
 * own, more specific types returned from the .ref attribute. Also, some
 * resources aren't referencable at all (such as BucketPolicies or GatewayAttachments).
 */
export abstract class CfnRefElement extends CfnElement {
  /**
   * Return a string that will be resolved to a CloudFormation `{ Ref }` for this element.
   *
   * If, by any chance, the intrinsic reference of a resource is not a string, you could
   * coerce it to an IResolvable through `Lazy.any({ produce: resource.ref })`.
   */
  public get ref(): string {
    return Token.asString(CfnReference.for(this, 'Ref'));
  }
}

function notTooLong(x: string) {
  if (x.length < 100) { return x; }
  return x.slice(0, 47) + '...' + x.slice(-47);
}

// These imports have to be at the end to prevent circular imports
import { CfnReference } from './private/cfn-reference';
import { Stack } from './stack';
import { Token } from './token';import { ValidationError } from './errors';

