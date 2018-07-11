#!/bin/sh
set -x
HOMEBREW_NO_AUTO_UPDATE=1 brew install watchman
watchman --version
