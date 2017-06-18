const fs = require('fs');
const commandLineArgs = require('command-line-args');

const optionDefinitions = [
  { name: 'input', type: String, multiple: false, defaultOption: true }
];

interface Tweet {
    created_at: string,
    id_str: string,
    text: string,
    user: {
        id_str: string
    }
}

function main(options) {
    if (options.input === undefined) {
        console.error("Input folder is needed.");
        process.exit(1);
        return;
    }

    sample(options.input);
}

function sample(foldername: string) {

}

main(commandLineArgs(optionDefinitions))