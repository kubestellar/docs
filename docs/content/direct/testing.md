# Testing

Make sure all pre-requisites are installed as described in [pre-reqs](pre-reqs.md).

## Unit testing

The Makefile has a target for running all the unit tests.

```shell
make test
```

## Integration testing

There are currently three integration tests. Contributors can run them. There is also a GitHub Actions workflow (in `.github/workflows/pr-test-integration.yml`) that runs these tests.

These tests require you to already have `etcd` on your `$PATH`.
See https://github.com/kubernetes/kubernetes/blob/v1.29.10/hack/install-etcd.sh for an example of how to do that.

To run the tests sequentially, issue a command like the following.

```shell
CONTROLLER_TEST_NUM_OBJECTS=24 go test -v ./test/integration/controller-manager &> /tmp/test.log
```

If `CONTROLLER_TEST_NUM_OBJECTS` is not set then the number of objects
will be 18. This parameterization by an environment variable is only a
point-in-time hack, it is expected to go away once we have a test that
runs reliably on a large number of objects.

To run one of the individual tests, issue a command like the following example.

```shell
go test -v -timeout 60s -run ^TestCRDHandling$ ./test/integration/controller-manager
```

## End-to-end testing

See `test/e2e/` in the GitHub repository. It has a README.

## CI Security Scanning

KubeStellar will include automated security scanning workflows as part of its CI
infrastructure. These planned workflows are designed to improve supply-chain security
and provide early visibility into potential vulnerabilities.

### OpenSSF Scorecard

KubeStellar will run an OpenSSF Scorecard workflow to evaluate the repository
against a set of security best practices, such as branch protection,
dependency management, and CI configuration.

The planned Scorecard workflow is expected to:
- Run on a schedule and on changes to the main branch
- Produce results in SARIF format
- Publish findings to the GitHub **Security** tab

### Trivy Container Image Scanning

KubeStellar will also use Trivy to scan container images built in CI for known
vulnerabilities (CVEs).

The planned Trivy scanning workflow is expected to:
- Build container images during CI
- Scan for **CRITICAL** and **HIGH** severity vulnerabilities
- Upload results in SARIF format to the GitHub **Security** tab

These workflows are part of the project’s CI infrastructure only (and may not yet
be present in this repository) and do not affect the runtime behavior of KubeStellar
deployments.

## Testing releases

See [the release testing doc](release-testing.md).
