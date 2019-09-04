import fs from 'fs';
const fsp = fs.promises;

const gitIgnoreRules = '/bitsy-source\n/input/template.html\n';

fsp.appendFile('./.git/info/exclude', gitIgnoreRules)
	.then(() => console.log('add dev-mode ignore rules to .git/info/exclude'))
	.catch((err) => console.error('failed to add dev-mode ignore rules to .git/info/exclude', err));
