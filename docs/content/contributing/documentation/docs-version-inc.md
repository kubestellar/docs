# Version Management in the KubeStellar Documentation Architecture

The documentation supports multiple versions through the `versions.ts` config:

- **Default Version**: Set in `getDefaultVersion()`
- **Branch Mapping**: Map versions to Git branches in `getBranchForVersion()`
- **Version Switching**: Users can switch versions via query parameter: `?version=0.23.0`

The site supports multiple versions of the docs for the assorted components of KubeStellar via branches of the [kubestellar/docs](https://github.com/kubestellar/docs) repository.

The site when first loaded shows the **latest** tagged version of the KubeStellar docs. The _main_ branch of a repository corresponds to the **dev** version on the site. Edits to the _main_ branch referring to a code repository will not show unless the **dev** version is selected.


### Versioning Strategy:
 - Each project has its own version scheme
 - Branch naming convention:
   - KubeStellar: main (latest), docs/\{version\} (e.g., docs/0.28.0)
   - a2a: main (latest), docs/a2a/\{version\} (e.g., docs/a2a/0.1.0)
   - kubeflex: main (latest), docs/kubeflex/\{version\} (e.g., docs/kubeflex/0.8.0)
 - The main branch always displays the version tagged **latest** of the content files for all projects when rendered

 _This page is an excerpt of the [Detailed Contribution Guide](contributing-inc.md). The complete file is viewable there or at [github.com/kubestellar/docs/CONTRIBUTING.md](https://github.com/kubestellar/docs/blob/main/CONTRIBUTING.md). Changes to this page content should be made in CONTRIBUTING.md on GitHub._
