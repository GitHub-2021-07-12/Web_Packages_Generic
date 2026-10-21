import * as PathManager from 'path';

// import {ObjectManager} from '/Files/Web/Packages/Generic/Js/ObjectManager/ObjectManager.js';


export class Bundler {
    static _svgIconSizes = [16, 24];
    static _svgIconTypes = ['fill', 'stroke'];

    static _buildPlugins = {
        cleaner: {
            onLoad: [
                {filter: /\.(css|html)$/},

                async ({path}) => {
                    let file = Bun.file(path);
                    let contents = (await file.text()).replace(/\r/g, '');
                    let fileType = file.type.replace(/;.*/, '');

                    switch (fileType) {
                        case 'text/css': {
                            contents = this.vacuumCss(contents);

                            break;
                        }
                        case 'text/html': {
                            contents = this.vacuumXml(contents);

                            break;
                        }
                    }

                    return {contents};
                },
            ],
        },

        componentBundler: {
            onLoad: [
                {filter: /\bComponents\b.*\.js$/},

                async function ({path}) {
                    let contents = await Bun.file(path).text();

                    if (~contents.search('_cssUrl = true')) {
                        contents = `
                            import css from '${path.replace('.js', '.css')}' with {type: 'text'};
                            ${contents}
                        `;
                        contents = contents.replace('_cssUrl = true', '_css = css');
                    }

                    if (~contents.search('_htmlUrl = true')) {
                        contents = `
                            import html from '${path.replace('.js', '.html')}' with {type: 'text'};
                            ${contents}
                        `;
                        contents = contents.replace('_htmlUrl = true', '_html = html');
                    }

                    return {contents};
                },
            ],
        },

        pathResolver: {
            onResolve: [
                {filter: /.*/},

                function ({path}) {
                    path = path.replace(process.stdin.path, '');

                    // console.log(path)

                    // if (this.appDirAliasRegExp?.test(path)) {
                    //     path = path.replace(this.appDirAliasRegExp, this.appDir);
                    // }
                    // else if (this.rootDirAliasRegExp?.test(path)) {
                    //     // path = path.replace(this.rootDirAliasRegExp, this.rootDir);
                    // }

                    path = this.resolvePath(path);

                    // console.log('->', path)

                    return {path};
                },
            ],
        },
    };

    static _extractSvgIconRecords = (iconSize, iconType) => {
        let elementsGroup = document.querySelectorAll(`#icons${iconSize} > [id^='${iconType}'] > g`);
        let svgIconRecords = [];

        for (let elementGroup of elementsGroup) {
            svgIconRecords.push({
                name: elementGroup.id.replace(/_\d+$/, ''),
                paths: [...elementGroup.querySelectorAll('path')].map((elementPath) => elementPath.getAttribute('d')),
            });
        }

        return svgIconRecords;
    };


    static appDir = '/Files/Web/Apps/App/';
    static appDirAliasRegExp = /.*?\/@\//;
    static bundleNamePostfix = '.bundle';
    static entryPointsCss = {};
    static entryPointsHtml = {};
    static entryPointsJs = {};
    static entryPointsSvg = {};
    static minimizationBlank = true;
    static minimizationIdentifier = false;
    static minimizationSyntax = false;
    static rootDir = '/Files/Web/';
    static rootDirAliasRegExp = /.*?\/\$\//;
    // static rootDirAliasRegExp = /.*?\/(?:\$|(?=Packages\/))/;
    // static svgBundleTemplatePath = '/Files/Web/Packages/Generic/Bun/Units/Bundler/BundleTemplate.svg';
    // static svgBundleTemplatePath = '/$/Packages/Generic/Bun/Units/Bundler/BundleTemplate.svg';
    static svgBundleTemplatePath = '/Packages/Generic/Bun/Units/Bundler/BundleTemplate.svg';
    static svgNumberPrecision = 5;


    static _createBundleName(inputPath) {
        return PathManager.basename(inputPath).replace('.', `${this.bundleNamePostfix}.`);
    }

    static _normalizeBuildPlugins() {
        for (let [buildPluginName, buildPlugin] of Object.entries(this._buildPlugins)) {
            for (let [methodName, methodArgs] of Object.entries(buildPlugin)) {
                for (let i = 0; i < methodArgs.length; i++) {
                    if (methodArgs[i]?.constructor != Function) continue;

                    methodArgs[i] = methodArgs[i].bind(this);
                }
            }

            this._buildPlugins[buildPluginName] = {
                name: buildPluginName,

                setup(build) {
                    for (let [methodName, methodArgs] of Object.entries(buildPlugin)) {
                        build[methodName](...methodArgs);
                    }
                },
            };
        }
    }


    static async bundleCss(inputPath, outputPath) {
        inputPath = this.resolvePath(inputPath);
        outputPath = this.resolvePath(outputPath);

        await Bun.build({
            entrypoints: [inputPath],
            external: ['*'],
            minify: this.minimizationBlank,
            naming: `[name]${this.bundleNamePostfix}.[ext]`,
            outdir: outputPath,
            target: 'bun',
        });
    }

    static async bundleHtml(inputPath, outputPath) {
        inputPath = this.resolvePath(inputPath);
        outputPath = this.resolvePath(outputPath);

        let contents = await Bun.file(inputPath).text();

        if (this.minimizationBlank) {
            contents = this.vacuumXml(contents);
        }

        await Bun.write(`${outputPath}/${this._createBundleName(inputPath)}`, contents);
    }

    static async bundleHtmlStandalone() {

    }

    static async bundleJs(inputPath, outputPath) {
        inputPath = this.resolvePath(inputPath);
        outputPath = this.resolvePath(outputPath);

        let {outputs} = await Bun.build({
            drop: ['console', 'debugger'],
            entrypoints: [inputPath],
            external: ['*'],
            plugins: [this._buildPlugins.cleaner, this._buildPlugins.componentBundler, this._buildPlugins.pathResolver],

            loader: {
                '.css': 'text',
                '.html': 'text',
            },

            minify: {
                identifiers: this.minimizationIdentifier,
                syntax: this.minimizationSyntax,
                whitespace: this.minimizationBlank,
            },
        });

        let contents = await outputs[0].text();
        contents = this.vacuum(contents);
        await Bun.write(`${outputPath}/${this._createBundleName(inputPath)}`, contents);
    }

    static async bundleSvg(inputPath, outputPath) {
        // let contents = await Bun.file(this.svgBundleTemplatePath).text();
        let contents = await Bun.file(this.resolvePath(this.svgBundleTemplatePath)).text();
        using webView = new Bun.WebView();
        await webView.navigate(`file:///${Bundler.resolvePath(inputPath)}`);

        for (let svgIconSize of this._svgIconSizes) {
            for (let svgIconType of this._svgIconTypes) {
                let svgIconRecords = await webView.evaluate(`(${this._extractSvgIconRecords})(${svgIconSize}, '${svgIconType}')`);

                if (!svgIconRecords.length) continue;

                let elementsSvgHtml = [];
                let elementsSymbolHtml = [];
                let svgIconIdPart0 = svgIconSize + svgIconType.replace(/^\w/, (char) => char.toUpperCase());

                for (let svgIconRecord of svgIconRecords) {
                    let svgIconIdPart1 = `${svgIconIdPart0}_${svgIconRecord.name}`;

                    for (let i = 0; i < svgIconRecord.paths.length; i++) {
                        svgIconRecord.paths[i] = svgIconRecord.paths[i].replace(
                            /(?:\d+\.\d+|\d+\.|\.\d+|\d+)(?:e[+-]?\d+)?/gi,
                            (number) => +(+number).toPrecision(this.svgNumberPrecision),
                        );
                    }

                    elementsSvgHtml.push(`
                        <svg id='icon${svgIconIdPart1}'>
                            <use href='#symbol${svgIconIdPart1}'/>
                        </svg>
                    `);
                    elementsSymbolHtml.push(`
                        <symbol id='symbol${svgIconIdPart1}'>
                            ${svgIconRecord.paths.map((svgIconPath) => `<path d='${svgIconPath}'/>`)}
                        </symbol>
                    `);
                }

                let htmlRewriter = new HTMLRewriter()
                    .on(
                        `defs.symbol${svgIconSize} > .${svgIconType}`,
                        {
                            element(element) {
                                element.append(elementsSymbolHtml.join(' '), {html: true});
                            },
                        },
                    )
                    .on(
                        `svg.icon${svgIconSize} > .${svgIconType}`,
                        {
                            element(element) {
                                element.append(elementsSvgHtml.join(' '), {html: true});
                            },
                        },
                    )
                ;
                contents = htmlRewriter.transform(contents);
            }
        }

        contents = this.vacuumXml(contents);
        await Bun.write(`${outputPath}/${this._createBundleName(inputPath)}`, contents);
    }

    static async init() {
        this._normalizeBuildPlugins();
    }

    static resolvePath(path) {
        if (PathManager.isAbsolute(path)) {
            path = path
                .replace(this.appDirAliasRegExp, this.appDir)
                .replace(this.rootDirAliasRegExp, this.rootDir)
            ;
            path = PathManager.join(this.rootDir, PathManager.relative(this.rootDir, path).replace(/^(?:\.+.)*/g, ''));
        }

        return PathManager.resolve(path).replaceAll('\\', '/');
    }

    static vacuum(string) {
        return string.replace(/\s+/g, ' ').trim();
    }

    static vacuumCss(string) {
        string = string.replace(/\/\*[\S\s]*?\*\//g, '');
        string = this.vacuum(string);

        return string;
    }

    static vacuumXml(string) {
        string = string.replace(/<!--[\S\s]*?-->/g, '');
        // string = string.replace(/<!--[\S\s]*?-->/g, '').replace(/(?<!\w)\s+|\s+(?!\w)/g, '');
        string = this.vacuum(string);

        return string;
    }


    static {
        this.init();
    }
}


Bundler.bundleCss(`/Packages/Generic/Frontend/Themes/Main/Main.css`, './Bundle');
Bundler.bundleHtml('/Packages/Generic/Frontend/Components/_Tests/All/All.htm', './Bundle');
Bundler.bundleJs('/Packages/Generic/Frontend/Components/Switch/Switch.js', './Bundle');
Bundler.bundleSvg('./icons.svg', './Bundle');
