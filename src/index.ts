// import A from "arcsecond";
// @ts-ignore
import A from "../node_modules/arcsecond";


// @ts-ignore
// import fs from "../node_modules/@type node/fs.d.ts";
import fs = require('fs');

console.log('Hello World 33');
// @ts-ignore
// const B = require('arcsecond-binary');
// // @ts-ignore
// const C = require('construct-js');
// // @ts-ignore
// const fs = require('fs');

import path = require('path');


const file = fs.readFileSync(path.join(__dirname, '../test.wav'));
debugger;
