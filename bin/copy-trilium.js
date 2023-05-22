

module.exports = function copyTrilium(targetDir) {
    const shell = require('shelljs');

    if (!targetDir) {
        throw new Error('Missing argument of target directory');
    }

    console.log(targetDir);

    shell.rm('-rf', targetDir);
    shell.mkdir(targetDir);

    shell.echo(`Copying Trilium to build directory ${targetDir}`);

    const targetDirSlash = `${targetDir}/`;

    shell.cp('-R', 'images', targetDirSlash);
    shell.cp('-R', 'libraries', targetDirSlash);
    shell.cp('-R', 'src', targetDirSlash);
    shell.cp('-R', 'db', targetDirSlash);
    shell.cp('-R', 'package.json', targetDirSlash);
    shell.cp('-R', 'yarn.lock', targetDirSlash);
    shell.cp('-R', 'README.md', targetDirSlash);
    shell.cp('-R', 'LICENSE', targetDirSlash);
    shell.cp('-R', 'config-sample.ini', targetDirSlash);
    shell.cp('-R', 'electron.js', targetDirSlash);
    shell.cp('webpack.config.js', targetDirSlash);

    shell.cd(targetDirSlash);
    try {
        shell.exec('yarn --only=prod');
    } catch (error) {
        shell.echo(error);
    }
    shell.cd('..');

    shell.echo('cleanup of useless files in dependencies');
    // cleanup of useless files in dependencies

    shell.rm('-rf', `${targetDir}/node_modules/image-q/demo`);
    shell.rm('-rf', `${targetDir}/node_modules/better-sqlite3/Release`);
    shell.rm('-rf', `${targetDir}/node_modules/better-sqlite3/deps/sqlite3.tar.gz`);
    shell.rm('-rf', `${targetDir}/node_modules/@jimp/plugin-print/fonts`);
    shell.rm('-rf', `${targetDir}/node_modules/jimp/browser`);
    shell.rm('-rf', `${targetDir}/node_modules/jimp/fonts`);


    shell.find(`${targetDir}/node_modules`).forEach(file => {
        if (/test|demo|docs/.test(file)) {
            shell.rm('-rf', file);
        }
    });

    shell.find(`${targetDir}/libraries`).forEach(file => {
        if (/.*\.map/.test(file)) {
            shell.rm('-rf', file);
        }
    });



    shell.cp(`${targetDir}/src/public/app/share.js`, `${targetDir}/src/public/app-dist/`);
    shell.cp('-R', `${targetDir}/src/public/app/doc_notes`, `${targetDir}/src/public/app-dist/`);

    shell.rm('-rf', `${targetDir}/src/public/app`);


}


