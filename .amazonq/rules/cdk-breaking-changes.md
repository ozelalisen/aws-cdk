Breaking changes are ONLY allowed in experimental modules with `-alpha` suffix and `stability: experimental` in package.json.

All modules in `aws-cdk-lib` are stable and MUST NOT introduce breaking changes.

API surface changes that are breaking: renaming classes/methods/properties, adding required properties to structs, removing public properties, changing nullable to non-nullable types.

Behavior changes that are breaking: service interruption during CloudFormation updates, data loss through Logical ID changes, resource property changes requiring replacement.

All breaking behavior changes must use feature flags with `FeatureFlags.of(construct).isEnabled()`.

All deprecated APIs must be marked with `@deprecated` and provide migration alternatives.

All breaking changes must be explicitly called out in PR descriptions with `BREAKING CHANGE:` format.

CloudFormation template changes must not cause resource replacement of stateful resources without feature flags.
