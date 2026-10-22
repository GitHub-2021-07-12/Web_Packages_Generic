import * as Util from 'util';

import {Bundler} from '/Files/Web/Packages/Generic/Bun/Units/Bundler/Bundler.js';


let {values: args} = Util.parseArgs({
    allowPositionals: true,
    args: Bun.argv,
    strict: true,

    options: {
        a: {type: 'boolean'},
        b: {type: 'string'},
    },
});

