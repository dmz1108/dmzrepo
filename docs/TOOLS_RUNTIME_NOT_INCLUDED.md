# Tools Runtime Not Included

The cloud server has a `tools/` directory, but it contains large runtime binaries and downloaded installers.

Examples:

- Python/QMT runtime
- Caddy executable and downloaded zip
- Torch/TensorFlow/NumPy binary dependencies

Those files are intentionally not included in the GitHub seed package. Keep dependency installation in documentation or setup scripts instead of committing those binaries.