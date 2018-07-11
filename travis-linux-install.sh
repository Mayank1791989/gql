#!/bin/sh
set -x
if [ "$TEST_USE_WATCHMAN" = "true" ]
then
  git clone https://github.com/facebook/watchman.git
  cd watchman
  git checkout v4.9.0
  ./autogen.sh
  ./configure
  make
  sudo make install
  watchman --version
else
  echo "TEST_USE_WATCHMAN is false. Skipping watchman install"
fi
