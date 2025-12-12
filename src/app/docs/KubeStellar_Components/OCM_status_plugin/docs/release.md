# Status AddOn Release process 

This GitHub repository has an automated process, using GoReleaser and a GitHub workflow,
that creates a release corresponding to each Git tag whose name starts with "v".
The [GitHub workflow](../.github/workflows/goreleaser.yml) defines the automated process. 
This workflow runs in response to a new tag whose name starts with "v". This workflow 
invokes [GoReleaser](https://goreleaser.com) with a [config file](../.goreleaser.yaml) that says to use `ko` to 
build and publish the [container image](https://github.com/kubestellar/ocm-status-addon/pkgs/container/ocm-status-addon). 
This workflow also uses `make chart` to customize the Helm chart to the release and 
then uses Helm to package the chart and publish it at [ghcr.io/kubestellar/ocm-status-addon-chart](https://github.com/kubestellar/ocm-status-addon/pkgs/container/ocm-status-addon-chart). Installing this Helm chart 
in a Kubernetes cluster adds the status addon there.

The steps outlined below assume that a release branch for the release that is going to be
created already exists. Typically a release branch is created at the beginning of each
new release cycle with `git checkout -b <release branch>`.

## Steps to make release

The main line of development is done in the git branch named `main`. There are also release 
branches, with names like `release-0.1`, on which patches to existing releases can be made.

A release is identified by "major.minor.patch" numbers, according to [semantic versioning](https://semver.org).

Start a new release branch by making it the same as main 
(`git checkout main; git merge --ff-only upstream/main; git branch -b release-$major.$minor`). 
Continue work on any release branch in the usual way for working on a branch.

Create a release by creating a git tag of the form `v$major.$minor.$patch`. This should 
be applied to a commit in the branch named `release-$major.$minor`. That commit should also 
be in `main` if `$patch` is 0. Push the tag upstream with the command `git push upstream --tag v$major.$minor.$patch`

Pushing the tag triggers the GitHub release Workflow that, if successfull, creates  a new release 
and publish the release artifacts (container image and helm chart) under https://github.com/orgs/kubestellar/packages.