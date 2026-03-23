## Motivation / Problem Statement
Right now to deploy the integration tests you need to do multiple manual steps stated below. We want to have way more simplified steps but keeping the output the same deploying the integration tests. Beside that we want to deploy the integration test that changed on every PR deployed not only the one that has specific label.

1. add label `pr/needs-integration-tests-deployment`
2. approve the workflow
3. approve the PR
4. when the mergify merge to main you need to approve again the workflow

## Proposed Solution
Modify the existing workflow to deploy the integration tests after the the PR get approved and before the Mergify merge to main. **For now make this workflow as shadow mode so even if it failed it will merge to main.** That's only temporary until we're sure that's not making a lot of pain because false positive in the future it will block merging the PR if failed.

---

## Task 1: Enable Integration Test Deployment in Shadow Mode

### Acceptance Criteria
- [ ] PRs with integration test changes and `pr/needs-integration-tests-deployment` label run the workflow
- [ ] Workflow only runs after approval from a maintainer group member
- [ ] Workflow only runs once on approval (not after merge to main)
- [ ] Workflow runs in shadow mode (failures don't block PR merge)
- [ ] PRs without integration test changes have no new behaviour
- [ ] **Keep** the label `pr/needs-integration-tests-deployment` so we can review workflow results and give feedback

### Why Keep the Label During Shadow Mode
With shadow mode enabled, we must **keep** the `pr/needs-integration-tests-deployment` label. This is because:
- Shadow mode doesn't block PRs on failure, so PRs will merge regardless of workflow result
- Without the label, there's no way to know if the integration test was successful before the PR merges
- The label triggers the workflow, allowing us to review results and give feedback

---

## Task 2: Enforce Integration Test Deployment (Disable Shadow Mode)

### Description
After validating Task 1 is working correctly and we're confident in the workflow, disable shadow mode and remove the label requirement.

### Acceptance Criteria
- [ ] Disable shadow mode in the workflow
- [ ] Remove the `pr/needs-integration-tests-deployment` label requirement
- [ ] PRs with integration test changes automatically run the workflow (no label needed)
- [ ] PRs with integration test changes are blocked from merging if the workflow fails
- [ ] PRs without integration test changes have no new behaviour