const chokidar = require('chokidar');
const fs = require('fs');
const http = require('http');
const path = require('path');

const baseDirectory = path.join(__dirname, '../..');
const watchDirs = [
	path.join(baseDirectory, 'js'),
	path.join(baseDirectory, 'css')
];

const compile = () => {
	const styl = fs.readFileSync(path.join(baseDirectory, 'css', 'styles.styl'), 'utf8');
	
	const regexThemeColor = /\/\* themeColor \*\//;
	const regexGetThemeColor = /--(?<property>[a-z0-9\-]+): (?<value>[A-Za-z0-9(),. #]+) /;
	const colors =
		styl.split('\n')
			.filter(c => regexThemeColor.test(c))
			.map(c => ({
				...c.match(regexGetThemeColor).groups
			}));
	
	const colorPickers = colors.map(({ property, value }) => `createColorPicker('${property}', '${value}');\n\t`).join('');
	
	const js =
		fs.readFileSync(path.join(baseDirectory, 'js', '_main.bs'), 'utf8')
			.replace('{{colorPickers}}', colorPickers)
	
	fs.writeFileSync(path.join(baseDirectory, 'js', 'main.js'), js);
};

const watcher = chokidar.watch(watchDirs);

watcher.on('change', async path => {
	const [filename] = path.split('\\').reverse();
	
	switch (filename) {
		case 'styles.styl':
		case '_main.js': {
			compile();
		} break;
	}
});

compile();
