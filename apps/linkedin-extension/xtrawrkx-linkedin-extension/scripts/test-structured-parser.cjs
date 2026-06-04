/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

async function main() {
    const { parseHTML } = await import('linkedom');

    const parserPath = path.join(__dirname, '../src/content/profile-structured-parser.js');
    const htmlPath = path.join(__dirname, 'sample-profile.html');

    const sandbox = {
        window: {},
        self: {},
        DOMParser: class {
            parseFromString(html) {
                return parseHTML(html).document;
            }
        },
    };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(parserPath, 'utf8'), sandbox);

    const html = fs.readFileSync(htmlPath, 'utf8');
    const { document } = parseHTML(html);
    const result = sandbox.window.ProfileStructuredParser.parseFromDocument(document, {
        title: 'Arastu Gupta | LinkedIn',
    });

    console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
