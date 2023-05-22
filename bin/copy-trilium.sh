#!/usr/bin/env bash

if [[ $# -eq 0 ]] ; then
    echo "Missing argument of target directory"
    exit 1
fi

npm run webpack

DIR=$1

rm -rf $DIR
mkdir $DIR

echo "Copying Trilium to build directory $DIR"

cp -r images $DIR/
cp -r libraries $DIR/
cp -r src $DIR/
cp -r db $DIR/
cp -r package.json $DIR/
cp -r package-lock.json $DIR/
cp -r yarn.lock $DIR/
cp -r README.md $DIR/
cp -r LICENSE $DIR/
cp -r config-sample.ini $DIR/
cp -r electron.js $DIR/
cp webpack.config.js $DIR/

oldpwd=$(pwd);
cd $DIR 
yarn --only=prod
cd $oldpwd

# cleanup of useless files in dependencies
rm -r $DIR/node_modules/image-q/demo
rm -r $DIR/node_modules/better-sqlite3/Release
rm -r $DIR/node_modules/better-sqlite3/deps/sqlite3.tar.gz
rm -r $DIR/node_modules/@jimp/plugin-print/fonts
rm -r $DIR/node_modules/jimp/browser
rm -r $DIR/node_modules/jimp/fonts

# delete all tests (there are often large images as test file for jimp etc.)
find $DIR/node_modules -name test -exec rm -rf {} \;
find $DIR/node_modules -name docs -exec rm -rf {} \;
find $DIR/node_modules -name demo -exec rm -rf {} \;

find $DIR/libraries -name "*.map" -type f -delete

cp $DIR/src/public/app/share.js $DIR/src/public/app-dist/
cp -r $DIR/src/public/app/doc_notes $DIR/src/public/app-dist/

rm -rf $DIR/src/public/app
