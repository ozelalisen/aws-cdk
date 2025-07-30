import { App, RemovalPolicy, Stack, StackProps } from '../../core';
import { FilterPattern, LogGroup, MetricFilter } from '../lib';
import { Dashboard } from '../../aws-cloudwatch';

class MetricFilterIntegStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const logGroup = new LogGroup(this, 'LogGroup', {
      removalPolicy: RemovalPolicy.DESTROY,
    });

    /// !show
    // Create a metric filter with dimensions
    const metricFilter = new MetricFilter(this, 'MetricFilter', {
      logGroup,
      metricNamespace: 'MyApp',
      metricName: 'Latency',
      filterPattern: FilterPattern.all(
        FilterPattern.exists('$.latency'),
        FilterPattern.regexValue('$.message', '=', 'bind: address already in use'),
      ),
      metricValue: '$.latency',
      dimensions: {
        Service: 'MyService',
        Environment: 'Production',
      },
    });

    // Create a dashboard to verify the metrics with dimensions
    const dashboard = new Dashboard(this, 'Dashboard', {
      dashboardName: 'MetricFilterTest',
    });

    // Add the metric with default dimensions
    dashboard.addWidgets(metricFilter.metric().toGraphWidget({
      title: 'Latency with Default Dimensions',
    }));

    // Add the metric with overridden dimensions
    dashboard.addWidgets(metricFilter.metric({
      dimensionsMap: {
        Service: 'MyService',
        Environment: 'Staging',
      },
    }).toGraphWidget({
      title: 'Latency with Custom Dimensions',
    }));
    /// !hide
  }
}

const app = new App();
new MetricFilterIntegStack(app, 'aws-cdk-metricfilter-integ');
app.synth();
