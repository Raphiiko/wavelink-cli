# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2026-01-11

### Added
- Initial release of wavelink-cli

## [0.0.2] - 2026-01-11

### Fixed
- Resolved build issues.

## [0.0.3] - 2026-01-11

### Changed
- Updated `mix set-output` to remove unassigned devices from the mix instead of reassigning them to another mix.
- Removed the requirement for at least two mixes when using `mix set-output`.


## [0.0.4] - 2026-01-11

### Added
- Added `channel toggle-mute-in-mix` command.
- Added `channel isolate` command to mute all channels in a mix except one.
