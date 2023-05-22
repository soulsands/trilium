#!/usr/bin/env bash

VERSION=`jq -r ".version" package.json`
SERIES=${VERSION:0:4}-latest

cat package.json | grep -v electron > server-package.json

sudo docker build -t soulsands/trilium:$VERSION --network host -t soulsands/trilium:$SERIES .

if [[ $VERSION != *"beta"* ]]; then
  sudo docker tag soulsands/trilium:$VERSION soulsands/trilium:latest
fi
