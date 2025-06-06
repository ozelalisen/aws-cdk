import { Construct } from 'constructs';
import { SubscriptionProps } from './subscription';
import * as iam from '../../aws-iam';
import * as lambda from '../../aws-lambda';
import * as sns from '../../aws-sns';
import { Names, ValidationError } from '../../core';
import { regionFromArn } from './private/util';

/**
 * Properties for a Lambda subscription
 */
export interface LambdaSubscriptionProps extends SubscriptionProps {

}
/**
 * Use a Lambda function as a subscription target
 */
export class LambdaSubscription implements sns.ITopicSubscription {
  constructor(private readonly fn: lambda.IFunction, private readonly props: LambdaSubscriptionProps = {}) {
  }

  /**
   * Returns a configuration for a Lambda function to subscribe to an SNS topic
   */
  public bind(topic: sns.ITopic): sns.TopicSubscriptionConfig {
    // Create subscription under *consuming* construct to make sure it ends up
    // in the correct stack in cases of cross-stack subscriptions.
    if (!Construct.isConstruct(this.fn)) {
      throw new ValidationError('The supplied lambda Function object must be an instance of Construct', topic);
    }

    this.fn.addPermission(`AllowInvoke:${Names.nodeUniqueId(topic.node)}`, {
      sourceArn: topic.topicArn,
      principal: new iam.ServicePrincipal('sns.amazonaws.com'),
    });

    // if the topic and function are created in different stacks
    // then we need to make sure the topic is created first
    if (topic instanceof sns.Topic && topic.stack !== this.fn.stack) {
      this.fn.stack.addDependency(topic.stack);
    }

    return {
      subscriberScope: this.fn,
      subscriberId: topic.node.id,
      endpoint: this.fn.functionArn,
      protocol: sns.SubscriptionProtocol.LAMBDA,
      filterPolicy: this.props.filterPolicy,
      filterPolicyWithMessageBody: this.props.filterPolicyWithMessageBody,
      region: regionFromArn(topic, this.fn),
      deadLetterQueue: this.props.deadLetterQueue,
    };
  }
}
