# KubeStellar A2A

📚 **[View Full Documentation](https://kubestellar.github.io/a2a/)**

```
╭─────────────────────────────────────────────────────────────────────────────────────────────╮
│  ██╗  ██╗██╗   ██╗██████╗ ███████╗███████╗████████╗███████╗██╗     ██╗      █████╗ ██████╗  │
│  ██║ ██╔╝██║   ██║██╔══██╗██╔════╝██╔════╝╚══██╔══╝██╔════╝██║     ██║     ██╔══██╗██╔══██╗ │
│  █████╔╝ ██║   ██║██████╔╝█████╗  ███████╗   ██║   █████╗  ██║     ██║     ███████║██████╔╝ │
│  ██╔═██╗ ██║   ██║██╔══██╗██╔══╝  ╚════██║   ██║   ██╔══╝  ██║     ██║     ██╔══██║██╔══██╗ │
│  ██║  ██╗╚██████╔╝██████╔╝███████╗███████║   ██║   ███████╗███████╗███████╗██║  ██║██║  ██║ │
│  ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝╚══════╝   ╚═╝   ╚══════╝╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝ │
│                       Multi-Cluster Kubernetes Management Agent                             │
╰─────────────────────────────────────────────────────────────────────────────────────────────╯
```


https://github.com/user-attachments/assets/fd5746f9-6620-4aeb-8150-dd9bf9eab694


## CLI Setup (uv)

```bash
# Enable virtual environment
uv venv

# Install with uv
uv pip install -e ".[dev]"

# Run commands
uv run kubestellar --help
uv run kubestellar list-functions
uv run kubestellar execute <function_name>
uv run kubestellar agent  # Start interactive AI agent
```

## kubectl Plugin Installation

You can install and use this project as a kubectl plugin. Primary plugin name is `kubestellar` (for Krew and release binaries). We also ship a Python-installed alias `a2a` for convenience. kubectl discovers plugins via executables named `kubectl-<name>` on your `PATH`.

Installation options:

```bash
# Using uv tool (recommended for per-user install)
uv tool install .

# Using pipx (isolated virtualenv)
pipx install .

# Or directly from GitHub
pipx install 'git+https://github.com/kubestellar/a2a'

# Using pip (installs into current Python environment)
python -m pip install .
```

Usage:

```bash
# kubectl will find the plugin as long as the executable is on PATH
# Python-installed alias (uv/pipx/pip):
kubectl a2a --help
kubectl a2a list-functions
kubectl a2a execute <function_name> -P key=value
kubectl a2a agent

# Krew or release binary name:
kubectl kubestellar --help
kubectl kubestellar list-functions
kubectl kubestellar execute <function_name> -P key=value
kubectl kubestellar agent
```

Notes:

- The plugin entrypoint is provided by the executable `kubectl-a2a`, which is installed via the Python package entry points. This makes `kubectl a2a` behave the same as running the `kubestellar` CLI directly.
- With `uv tool install`, executables are placed under `~/.local/bin` by default. Ensure it is on your `PATH`.

### Install via Krew

Once a release is published, you can use the generated Krew manifest to install:

```bash
# Install from the generated manifest attached to a release (name: kubestellar.yaml)
kubectl krew install --manifest=kubestellar.yaml

# Use the plugin
kubectl kubestellar --help
```

To make installation available via the central krew-index and install like `kubectl krew install kubestellar`, submit a PR to https://github.com/kubernetes-sigs/krew-index with the `kubestellar.yaml` manifest from your release.

### Direct install (no package manager)

You can install the plugin by placing a binary named `kubectl-kubestellar` (or `kubectl-kubestellar.exe` on Windows) on your `PATH`. Alternatively, the Python package installs `kubectl-a2a` which kubectl also discovers.

Option A — use a release binary (kubectl-kubestellar):

```bash
# Download the tarball for your OS/arch from the latest Release
tar -xzf kubectl-kubestellar-<os>-<arch>.tar.gz
chmod +x kubectl-kubestellar
mv kubectl-kubestellar ~/.local/bin/   # or any dir on your PATH

# verify
which kubectl-kubestellar
kubectl plugin list | grep kubestellar || true
kubectl kubestellar --help
```

Option B — build locally and copy to PATH (kubectl-kubestellar):

```bash
uv sync --dev
uv pip install pyinstaller
uv run pyinstaller --onefile --name kubectl-kubestellar --distpath dist --workpath build packaging/entry_kubectl_a2a.py
install -m 0755 dist/kubectl-kubestellar ~/.local/bin/kubectl-kubestellar
```

Option C — reuse the Python entrypoint by symlink (alias `a2a`):

```bash
# If you've installed the package via uv tool/pipx and have `kubestellar` on PATH,
# create a symlink named kubectl-kubestellar pointing to it
ln -sf "$(command -v kubestellar)" ~/.local/bin/kubectl-kubestellar
kubectl kubestellar --help
```

Windows:

- Use the `.exe` from the Windows release archive and place it in a directory on your `%PATH%`.
- Or create `kubectl-a2a.bat` forwarding to `kubestellar.exe` if using a symlink alternative isn’t convenient.

### How kubectl plugin discovery works (Kubectl Plugins)

- kubectl discovers plugins by searching your `PATH` for executables named `kubectl-<name>` (per the official docs). Examples: `kubectl-kubestellar`, `kubectl-a2a`.
- When you run `kubectl <name> ...`, kubectl executes the first `kubectl-<name>` found on `PATH` and passes through the arguments.
- List discovered plugins with `kubectl plugin list`.
- Krew is a plugin manager that installs such binaries under its own path; `kubectl krew install <name>` makes `<name>` available as `kubectl <name>`.
- This project provides `kubectl-kubestellar` (for Krew and binary releases) and `kubectl-a2a` (Python entrypoint). Once on your PATH, use `kubectl kubestellar ...` or `kubectl a2a ...`.

Reference: https://kubernetes.io/docs/tasks/extend-kubectl/kubectl-plugins/

### Get the latest version

For users who installed via uv tool from GitHub:

```bash
# Install latest from main
uv tool install --upgrade 'git+https://github.com/kubestellar/a2a@main'

# Or upgrade an existing install (uses original source spec)
uv tool upgrade kubestellar
```

For pipx installs:

```bash
pipx upgrade kubestellar
# or reinstall from GitHub
pipx install --force 'git+https://github.com/kubestellar/a2a@main'
```

## Releasing

This repo includes an automated release workflow that builds platform-specific plugin binaries and publishes a Krew manifest.

Steps:

- Create a version tag and push, e.g.: `git tag v0.1.0 && git push origin v0.1.0`
- Or run manually via Actions → Release → Run workflow (optional tag input).
- Or publish a GitHub Release with tag `vX.Y.Z` to trigger the workflow.
- GitHub Actions workflow `.github/workflows/release.yml` runs and produces:
  - Tarballs for `kubectl-kubestellar` on Linux amd64, macOS amd64/arm64, Windows amd64
  - SHA256 checksums
  - `kubestellar.yaml` Krew manifest with versioned asset URLs and checksums
  - A GitHub Release containing the above assets

Users can then install via Krew using the attached manifest, or you can submit it to the central krew-index.

### Troubleshooting release CI

- If the workflow didn’t run: ensure tag matches `v*.*.*`, Actions are enabled, and branch protections allow workflows.
- For manual runs: use the `workflow_dispatch` entry. Optionally provide the `tag` input.
- For Release events: make sure the release is “published” (not draft/prerelease) and has a tag like `vX.Y.Z`.

## Local Plugin Testing

You can test `kubectl a2a` locally in two ways.

- Using uv tool (recommended):

```bash
# From the repo root
uv tool uninstall kubectl-a2a || true
uv tool uninstall kubestellar || true
uv tool install .

# Ensure ~/.local/bin is on PATH, then verify
which kubectl-a2a
kubectl plugin list | grep a2a || true
kubectl a2a --help
kubectl a2a list-functions

# Debug kubectl plugin discovery if needed
kubectl -v=6 a2a --help
```

- Using a locally built single-file binary (optional):

```bash
# Build the binary
uv sync --dev
uv pip install pyinstaller
uv run pyinstaller --onefile --name kubectl-a2a --distpath dist --workpath build packaging/entry_kubectl_a2a.py

# Put it on PATH for this shell and test
export PATH="$PWD/dist:$PATH"
kubectl plugin list | grep a2a || true
kubectl a2a --help
```

Notes:
- If your shell caches command paths, run `hash -r` (bash/zsh) after replacing the binary.
- On Windows, ensure `dist/kubectl-a2a.exe` is on your PATH.
- If you use `pip` rather than `pipx`, ensure the Python scripts directory is on your `PATH` (e.g., `~/.local/bin` on Linux, `~/Library/Python/<version>/bin` on macOS, or the virtual environment's `bin`).
- For isolated installs, `pipx` is the simplest way to get `kubectl-a2a` onto your `PATH`.

## AI Provider Configuration

The agent supports multiple AI providers:

### Available Providers
- **OpenAI** (GPT-4, GPT-4o, etc.)
- **Google Gemini** (gemini-1.5-flash, gemini-1.5-pro, etc.)

### Setting Up API Keys

```bash
# Set OpenAI API key
uv run kubestellar config set-key openai YOUR_OPENAI_API_KEY

# Set Gemini API key  
uv run kubestellar config set-key gemini YOUR_GEMINI_API_KEY

# Set default provider
uv run kubestellar config set-default gemini

# List configured providers
uv run kubestellar config list-keys

# Show current configuration
uv run kubestellar config show
```

### Using Different Providers

```bash
# Use default provider
uv run kubestellar agent

# Use specific provider
uv run kubestellar agent --provider gemini
uv run kubestellar agent --provider openai
```

## MCP Server Setup

Add to MCP server (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "kubestellar": {
      "command": "uv",
      "args": ["run", "kubestellar-mcp"],
      "cwd": "/path/to/a2a"
    }
  }
}
```

## Documentation

📖 **Complete Documentation:** https://kubestellar.github.io/a2a/

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [MCP SDK](https://github.com/anthropics/mcp-sdk)
- Inspired by the KubeStellar project for multi-cluster Kubernetes management
- Thanks to all contributors and the open-source community

---

Made with ❤️ by the KubeStellar community