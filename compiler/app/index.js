const chokidar = require('chokidar');
const fs = require('fs');
const http = require('http');
const path = require('path');

const baseCompilerDirectory = path.join(__dirname, '..');
const baseWebAppDirectory = path.join(__dirname, '../..');
const watchDirs = [
	path.join(baseCompilerDirectory, 'word-lists'),
	path.join(baseCompilerDirectory, 'js'),
	path.join(baseWebAppDirectory, 'css')
];

const wordListsDir = path.join(baseCompilerDirectory, 'word-lists');

const compile = () => {
	// Pull in the styles
	const styl = fs.readFileSync(path.join(baseWebAppDirectory, 'css', 'styles.styl'), 'utf8');
	
	const replacements = {};
	
	// Word lists
	const wordListFileNames = JSON.parse(fs.readFileSync(path.join(wordListsDir, 'index.json'), 'utf8'));
	
	const wordLists = [];
	wordListFileNames.forEach(fileName => {
		const fileContents = fs.readFileSync(path.join(wordListsDir, fileName), 'utf8');
		const words =
			fileContents
				.replace(/\r/g, '')
				.split('\n')
				.map(str => str.trim())
				.filter(str => str.length && !str.startsWith('//'));
		wordLists.push(words);
	});
	
	replacements['{{wordLists}}'] = '[' +
		wordLists
			.map(list => `\n\t[ ${list.map(v => `\n\t\t'${v}'`).join(', ')} \n\t]`)
			.join(',') + '\n]';
	
	// Theme Colors
	{
		const regexThemeColor = /\/\* themeColor \*\//;
		const regexGetThemeColor = /--(?<property>[a-z0-9\-]+): (?<value>[A-Za-z0-9(),. #]+) /;
		const colors =
			styl.split('\n')
				.filter(c => regexThemeColor.test(c))
				.map(c => ({
					...c.match(regexGetThemeColor).groups
				}));
		
		const colorPickers = colors.map(({ property, value }) => `createColorPicker('${property}', '${value}');\n\t`).join('');
		
		replacements['{{colorPickers}}'] = colorPickers;
	}
	
	// Themes
	{
		const regexTheme = /\.(?<selector>[a-z0-9\-]+) \/\* theme: (?<title>[\w ]+) \*\//;
		const themeData =
			styl.split('\n')
				.filter(c => regexTheme.test(c))
				.map(c => ({
					...c.match(regexTheme).groups
				}));
		
		const themes =
			themeData.map(({ selector, title }) => `{\n\t\ttitle: '${title}',\n\t\tvalue: '${selector}'\n\t},`).join('\n\t');
		
		replacements['{{themes}}'] = themes;
	}
	
	let js = fs.readFileSync(path.join(baseCompilerDirectory, 'js', 'main.bs'), 'utf8');
	
	Object.entries(replacements).forEach(([k, v]) => {
		js = js.replace(k, v);
	});
	
	fs.writeFileSync(path.join(baseWebAppDirectory, 'js', 'main.js'), js);
};

const watcher = chokidar.watch(watchDirs);

watcher.on('change', async path => {
	const [filename] = path.split('\\').reverse();
	
	switch (filename) {
		case 'index.json':
		case 'styles.styl':
		case 'main.bs': {
			compile();
		} break;
		
		default: {
			if (/\\word-lists\\[a-z-]+\.txt$/.test(path)) {
				compile();
			}
		} break;
	}
});

compile();
