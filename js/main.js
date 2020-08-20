// NOTE(bret): Thanks to Ian Jones for providing a bit of the boilerplate code here from https://github.com/WITS/regretris/
const userAgent = navigator.userAgent;
const IS_TOUCH_DEVICE = !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch);
const IS_MOBILE = /(iPhone|iPod|iPad|Android|BlackBerry)/i.test(userAgent);
const IS_FIREFOX = (/\bfirefox\//i.test(userAgent) &&
    !/\bseamonkey\//i.test(userAgent));
const IS_CHROME = (/\bchrome\//i.test(userAgent) &&
    !/\b(?:chromium|edge)\//i.test(userAgent));
const IS_SAFARI = (/\bsafari\//i.test(userAgent) &&
    !/\b(?:chrome|chromium)\//i.test(userAgent));
const IS_OPERA = (/\b(?:opera|opr)\//i.test(userAgent));
const IS_WEBKIT = (IS_CHROME || IS_SAFARI || IS_OPERA);
const IS_MSIE = (/\b(?:MSIE|Trident)\b/i.test(userAgent));
const IS_EDGE = (userAgent.indexOf("Edge") != -1);

String.prototype.toTitleCase = function() {
	return this.split(' ').map(v => v.substring(0, 1).toUpperCase() + v.substring(1).toLowerCase()).join(' ');
};

const boardSize = 15;
let boardRect;
const boardTiles = [];
const getBoardTile = (x, y) => {
	if ((x < 0) || (x >= boardSize) || (y < 0) || (y >= boardSize))
		return null;
	return boardTiles[y * boardSize + x];
};

const getHoveringTile = (tile) => getBoardTile(+tile.dataset.x, +tile.dataset.y);

const version = '0.2.7';

const RENDER_BOARD = true;

const KEYS = {
	LEFT: 37,
	UP: 38,
	RIGHT: 39,
	DOWN: 40,
	B: 66,
	A: 65,
	SPACE: 32,
	ENTER: 13,
	SLASH: 191,
};

const konami = [
	KEYS.UP,
	KEYS.UP,
	KEYS.DOWN,
	KEYS.DOWN,
	KEYS.LEFT,
	KEYS.RIGHT,
	KEYS.LEFT,
	KEYS.RIGHT,
	KEYS.B,
	KEYS.A
];

const latestKeys = Array.from({ length: konami.length });

const dictionaries = [
	[ 
		'awesome', 
		'bitchin', 
		'boss', 
		'cool', 
		'dope', 
		'epic', 
		'fresh', 
		'gnarly', 
		'groovy', 
		'mint', 
		'radical', 
		'righteous', 
		'rockin', 
		'sweet', 
		'sick', 
		'tight', 
		'tubular', 
		'wicked' 
	],
	[ 
		'fallus', 
		'phaked', 
		'phamous', 
		'phantastic', 
		'phantasy', 
		'phart', 
		'phast', 
		'phiend', 
		'phined', 
		'phired', 
		'phocus', 
		'pholks', 
		'phollower', 
		'phool', 
		'phoreword', 
		'phorward', 
		'phreak', 
		'phree', 
		'phriend', 
		'phrosty', 
		'phuck', 
		'phunky', 
		'phurious' 
	],
	[ 
		'apple', 
		'banana', 
		'cherry', 
		'dragonfruit', 
		'durian', 
		'grape', 
		'grapefruit', 
		'kiwi', 
		'lychee', 
		'mango', 
		'olive', 
		'orange', 
		'papaya', 
		'pomelo', 
		'peach', 
		'pear', 
		'pineapple', 
		'plum', 
		'rambutan', 
		'redberry', 
		'tomato' 
	]
];

const dictionary = dictionaries[0];

const themes = [
	{
		title: 'Default',
		value: 'theme-default'
	},
	{
		title: '90s Skater',
		value: 'theme-90s-skater'
	},
	{
		title: 'Pastel',
		value: 'theme-pastel'
	},
	{
		title: 'Garbage',
		value: 'theme-garbage'
	},
	{
		title: 'Custom',
		value: 'theme-custom'
	}
];

const style = $new('style[type=text/css]').element();
const colorStyle = $new('style[type=text/css]').element();
let boardElem, wordsHolderElem;

Math.lerp = (a, b, t) => (b - a) * t + a;
Math.easeIn = (t) => t * t;
Math.easeOut = (t) => -t * (t - 2);
Math.easeInOut = (t) => (t <= .5) ? (t * t * 2) : (1 - (--t) * t * 2);

let grid;

let pointsTitleElem, pointsElem;
let pointsColHundreds, pointsColTens, pointsColOnes;
let totalPoints = 0;

const LETTER_POINTS = { A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10 };

const openSettings = () => {
	overlay.classList.add('show');
	settingsModal.classList.add('show');
};

const toggleSettings = () => {
	overlay.classList.toggle('show');
	settingsModal.classList.toggle('show');
};

const closeSettings = () => {
	overlay.classList.remove('show');
	settingsModal.classList.remove('show');
};

const actionSettings = () => {
	openSettings();
};

const actionUndo = () => {
	// TODO(bret): Probably make sure you can't do this while something is animating
	if (playedWords.length > 0) {
		let word = playedWords.pop();
		let tile, tileHover;
		for (let l = 0; l < word.tiles.length; ++l) {
			tile = word.tiles[l];
			tileHover = getHoveringTile(tile);
			let stacked = +tileHover.dataset.stacked - 1;
			if (stacked === 0) {
				resetTile(tileHover, 60 * (word.tiles.length - l));
			} else {
				if (word.hasClass('rotated')) {
					tileHover.classList.remove('vertical');
					tileHover.classList.remove('top');
					tileHover.classList.remove('bottom');
				} else {
					tileHover.classList.remove('horizontal');
					tileHover.classList.remove('left');
					tileHover.classList.remove('right');
				}
			}
			tileHover.dataset.stacked = stacked;
		}
		removePoints(word.points);
		word.points = 0;
		returnToHand(word);
		saveGame();
	}
};

let undoButton, infoButton, resetButton;

const initGrid = (body, progress) => {
	let headerElem = body.appendChild(
		$new('header')
			.children(
				$new('.title').children(
					$new('.top').text('Radical'),
					$new('.bottom').text('Scrabble')
				),
				$new('.nav').children(
					$new('span#home')
						.child($new('i').class('home fad fa-home-alt'))
						/*.on('click', actionHome)*/,
					$new('span#info')
						.child($new('i').class('info fad fa-info-square'))
						/*.on('click', actionInfo)*/,
					$new('span#settings')
						.child($new('i').class('settings fad fa-sliders-h-square'))
						.on('click', actionSettings),
					$new('span#undo')
						.child($new('i').class('undo fad fa-undo-alt'))
						.on('click', actionUndo),
				),
				$new('.points').children(
					$new('.top').text('Points'),
					// $new('.bottom').attr('data-points', '000'),
					$new('.bottom').children(
						$new('.column').child(
							$new('.digit').text('-'),
							$new('.digit').text('0'),
							$new('.digit').text('.')
						),
						$new('.column').child(
							$new('.digit').text('-'),
							$new('.digit').text('0'),
							$new('.digit').text('.')
						),
						$new('.column').child(
							$new('.digit').text('-'),
							$new('.digit').text('0'),
							$new('.digit').text('.')
						),
					)
				)
			)
			.element()
	);
	pointsTitleElem = headerElem.q('.points .top');
	pointsElem = headerElem.q('.points .bottom');
	
	[pointsColHundreds, pointsColTens, pointsColOnes] = [...pointsElem.q('.column')]
	
	undoButton = headerElem.q('#undo');
	infoButton = headerElem.q('#info');
	resetButton = headerElem.q('#reset');
	
	const boardWrapper = body.appendChild($new('.board-wrapper').element());
	boardElem = boardWrapper.appendChild($new('.board').element());
	let wordsElem = body.appendChild($new('.words').element());
	
	let footerElem = body.appendChild(
		$new('footer')
			.children(
				$new('a.author')
					.text('Bret Hudson')
					.attr('href', 'https://brethudson.com')
					.attr('target', '_BLANK'),
				$new('a.build')
					.text(`${version}`)
					.attr('href', 'https://github.com/BretHudson/radical-scrabble')
					.attr('target', '_BLANK')
			)
			.element()
	);
	
	// Render board
	let numTiles = boardSize * boardSize;
	if (RENDER_BOARD) {
		grid = Array.from({ length: boardSize }).map(c => Array.from({ length: boardSize }));
		
		let centerPos = Math.floor(boardSize / 2);
		for (let t = 0; t < numTiles; ++t) {
			let _x = (t % boardSize);
			let _y = Math.floor(t / boardSize);
			let x = Math.abs(centerPos - _x);
			let y = Math.abs(centerPos - _y);
			let d = Math.abs(x - y);
			
			let className = '';
			if ((x === 0) && (y === 0))
				className = 'wild';
			else if (((x === 7) || (y === 7)) && (d % 7 === 0))
				className = 'x-3-word';
			else if ((x === y) && (x >= 3) && (x <= 6))
				className = 'x-2-word';
			else if ((d === 4) && ((x === 6) || (y === 6)))
				className = 'x-3-letter';
			else if ((x === y) && (x === 2))
				className = 'x-3-letter';
			else if ((d === 3) && ((x === 7) || (y === 7)))
				className = 'x-2-letter';
			else if ((d === 4) && ((x === 5) || (y === 5) || (x === 4) || (y === 4)))
				className = 'x-2-letter';
			else if ((x === y) && (x === 1))
				className = 'x-2-letter';
		
			const tile = createTile(null, _x, _y, className);
			grid[_x][_y] = tile;
			boardTiles.push(tile);
			boardElem.append(tile);
		}
	}
	
	const boardWidth = 100, boardHalfWidth = boardWidth / 2;
	const emWidth = `${boardWidth}em`;
	const emLeft = `calc(50% - ${boardHalfWidth}em)`;
	
	headerElem.style.width = footerElem.style.width = emWidth; //`${boardWidth * 2}em`;
	headerElem.style.left = footerElem.style.left = emLeft; //`calc(50% - ${boardWidth}em)`;
	
	boardWrapper.style.width = emWidth;
	boardWrapper.style.left = emLeft;
	boardWrapper.style.top = '12em';
	
	wordsElem.style.width = emWidth;
	wordsElem.style.height = `calc(100% - ${boardWidth}em - 18em)`;
	wordsElem.style.left = emLeft;
	wordsElem.style.top = (boardWidth + 12) + `em`;
	
	const tileSize = (boardWidth - 3) / boardSize; // NOTE(bret): for that 1.5em padding yo
	style.textContent = `.tile { width: ${tileSize}em; height: ${tileSize}em; }`;
	colorStyle.textContent = '';
	
	const resizeBoard = () => {
		// TODO(bret): Make sure we re-position all the tiles!
		// Resize the board
		const navHeight = 9;
		const tileSize = boardWidth / boardSize;
		const ratio = window.innerWidth / window.innerHeight;
		
		const landscape = ratio > 1.25;
		let width, height;
		if (landscape) {
			width = window.innerWidth / ((boardSize << 1) + 1.5) / tileSize;
			height = window.innerHeight / (3.0 + boardSize) / tileSize;
		} else {
			width = window.innerWidth / (boardSize + 0.5) / tileSize;
			height = window.innerHeight / (navHeight + boardSize) / tileSize;
		}
		
		document.body.classList.add((landscape) ? 'landscape' : 'portrait');
		document.body.classList.remove((landscape) ? 'portrait' : 'landscape');
		
		const size = Math.min(width, height);
		if (size === width) {
			console.log('hi');
		} else {
			console.log('bye');
		}
		
		if (IS_FIREFOX)
			document.body.style.fontSize = `${Math.floor(size)}px`;
		else
			document.body.style.fontSize = `${size}px`;
		
		// Update each tile's position
		window.requestAnimationFrame(() => {
			boardElem.q('.tile').each(tile => {
				tile.pos = tile.getBoundingClientRect();
			});
		});
		
		boardRect = boardElem.getBoundingClientRect();
	};
	
	resizeBoard();
	
	wordsHolderElem = $new('.words-holder').element();
	
	// TODO(bret): Create an animation for these (probably set that up _after_ we've removed words based on wordsOnBoard (make these words animate in AFTER the progress words have been animated!)
	for (const word of shuffle(dictionary))
		addWord(word.toUpperCase());
	
	if (progress !== null) {
		const { wordsOnBoard } = progress;
		let points = 0;
		for (const w of wordsOnBoard) {
			const {
				word,
				tileCoord,
				rotated = false
			} = w;
			
			let { x, y } = tileCoord;
			
			let finalPos = x;
			if (rotated === true) {
				finalPos = y;
			}
			finalPos += word.length;
			
			let success = (x >= 0) && (y >= 0) && (finalPos <= boardSize);
			
			const tiles = [];
			const letters = word.toUpperCase().split('');
			
			let wordPoints = 0;
			let wordMultiplier = 1;
			if (success === true) {
				letters.forEach((letter, i) => {
					const tile = getBoardTile(x, y);
					
					tiles.push(tile);
					
					if (tile.dataset.letter && (tile.dataset.letter !== letter)) {
						success = false;
						return;
					}
					
					let curPoints = LETTER_POINTS[letter];
					
					if (tile.hasClass('x-2-letter'))
						curPoints *= 2;
					if (tile.hasClass('x-3-letter'))
						curPoints *= 3;
					if (tile.hasClass('x-2-word'))
						wordMultiplier *= 2;
					if (tile.hasClass('x-3-word'))
						wordMultiplier *= 3;
					
					wordPoints += curPoints;
					
					if (rotated) {
						++y;
					} else {
						++x;
					}
				});
			}
			
			if (success === false) break;
			
			const wordElem = wordElems.getWord(word);
			wordElem.dataset.x = tileCoord.x;
			wordElem.dataset.y = tileCoord.y;
			
			if (rotated === true) {
				wordElem.classList.add('rotated');
			}
			
			wordPoints *= wordMultiplier;
			wordElem.points = wordPoints;
			points += wordPoints;
			
			for (let i = 0, n = tiles.length; i < n; ++i) {
				const tile = tiles[i];
				
				const wordTile = wordElem.children[i];
				wordTile.dataset.x = tile.dataset.x;
				wordTile.dataset.y = tile.dataset.y;
				
				const letter = letters[i];
				tile.dataset.letter = letter;
				tile.dataset.points = LETTER_POINTS[letter];
				
				tile.dataset.stacked = +(tile.dataset.stacked || 0) + 1;
				
				tile.classList.remove('wild');
				tile.classList.remove('x-2-letter');
				tile.classList.remove('x-3-letter');
				tile.classList.remove('x-2-word');
				tile.classList.remove('x-3-word');
				
				tile.classList.remove('no-letter');
				
				tile.classList.add('has-letter');
				
				if (rotated) {
					tile.classList.add('vertical');
					if (i === 0) {
						tile.classList.add('top');
					} else if (i === word.length - 1) {
						tile.classList.add('bottom');
					}
				} else {
					tile.classList.add('horizontal');
					if (i === 0) {
						tile.classList.add('left');
					} else if (i === word.length - 1) {
						tile.classList.add('right');
					}
				}
			}
			
			removeWord(wordElem);
		}
		addPoints(points);
	}
	
	grid = Array.from({ length: boardSize }).map(c => Array.from({ length: boardSize }));
	
	let centerPos = Math.floor(boardSize / 2);
	for (let t = 0; t < numTiles; ++t) {
		let _x = (t % boardSize);
		let _y = Math.floor(t / boardSize);
		let x = Math.abs(centerPos - _x);
		let y = Math.abs(centerPos - _y);
		
		const speed = 0.04;
		let delay = (x + y) * speed;
		
		const tile = getBoardTile(_x, _y);
		if (tile.className.split(' ').length > 2)
			delay += 8 * speed;
		if (tile.classList.contains('has-letter')) {
			delay += 10 * speed;
			setTimeout(() => {
				tile.classList.add('stop-animate');
			}, Math.ceil(delay * 1e3 + 400 + 200)); // 400 being how long the delay is, 200 for just extra padding
		}
		
		// TODO(bret): Remove this animation delay at some point!
		// TODO(bret): Figure out why this comment exists! :)
		tile.style.animationDelay = tile.q('.background').style.animationDelay = delay + 's';
		grid[_x][_y] = tile;
	}
	
	wordsElem.appendChild(wordsHolderElem);
	
	onResizeCallbacks.push(resizeBoard);
};

// TODO(bret): This is technically throttle... should rewrite if you want to use this!
const debounce = (func, duration, immediate = false) => {
	let timeout = null;
	let latestArgs = [];
	let lastCallAt = Date.now() - duration;
	let calledMultipleTimes = false;
	
	const callback = (shouldExecImmediately = false) => {
		if (shouldExecImmediately || calledMultipleTimes) {
			func(...latestArgs);
		}
		timeout = null;
		lastCallAt = Date.now();
	};
	
	return function(...args) {
		latestArgs = args;
		
		calledMultipleTimes = (timeout !== null);
		
		if (calledMultipleTimes) return;
		
		immediate && (Date.now() - lastCallAt >= duration) && callback(true);
		
		timeout = setTimeout(callback, duration);
	};
};

const onResizeCallbacks = [];
const resize = e => {
	for (let c of onResizeCallbacks) {
		c(e);
	}
};

let overlay, settingsModal;
const initSettings = body => {
	overlay = $new('#overlay').element();
	settingsModal = $new('#settings-modal').element();
	
	overlay.on('click', e => {
		closeSettings();
	});
	
	const createOption = ({ title, value }) => $new('option').text(title).attr('value', value);
	
	let currentTheme = localStorage.getItem('theme') || themes[0].option;
	document.body.classList.add(currentTheme);
	
	const themeDropdown =
		$new('select')
			.children(themes.map(createOption))
			.element();
	
	const colorOptions = $new('.color-options').element();
	
	const setCustomColorOptionsVisibility = () => {
		switch (currentTheme) {
			case 'theme-custom': {
				colorOptions.classList.add('show');
			} break;
			
			default: {
				colorOptions.classList.remove('show');
			} break;
		}
	};
	
	setCustomColorOptionsVisibility();
	
	themeDropdown.on('change', e => {
		const { value } = e.target;
		document.body.classList.remove(currentTheme);
		
		currentTheme = value;
		document.body.classList.add(currentTheme);
		
		localStorage.setItem('theme', currentTheme);
		
		setCustomColorOptionsVisibility();
	});
	
	themeDropdown.value = currentTheme;
	
	settingsModal.append(themeDropdown);
	
	const customThemeColors = JSON.parse(localStorage.getItem('custom-theme')) || {};
	
	const updateCustomThemeStyle = () => {
		let styleStr = '.theme-custom { ';
		styleStr += Object.entries(customThemeColors).map(([k, v]) => `--${k}: ${v}`).join('; ');
		colorStyle.textContent = styleStr;
		
		localStorage.setItem('custom-theme', JSON.stringify(customThemeColors));
	};
	
	updateCustomThemeStyle();
	
	const colorInputs = [];
	
	const createColorPicker = (property, defaultValue) => {
		const initialValue = customThemeColors[property] || defaultValue;
		
		const id = `input-color-${property}`;
		const title =
			property.replace('x-', 'x').replace(/-/g, ' ').toTitleCase();
		
		const colorOption =
			$new('.color-option')
				.attr('style', `--color: var(--${property})`);
		
		const colorPickerTitle =
			$new('.title')
				.text(title)
				.element();
		
		const colorPicker =
			$new('label.color-picker')
				.attr('for', id)
				.element();
		
		const colorInput =
			$new('input[type=color]')
				.id(id)
				.attr('value', initialValue)
				.attr('data-default-value', defaultValue)
				.attr('data-css-property', property)
				.element();
		
		const resetIcon =
			$new('i')
				.class('home fad fa-trash-alt')
				.on('click', e => {
					const {
						dataset: { cssProperty }
					} = colorInput;
					
					colorInput.value = defaultValue;
					
					delete customThemeColors[cssProperty];
					updateCustomThemeStyle();
				});
		
		colorInput.on('change', e => {
			const {
				value,
				dataset: { cssProperty }
			} = e.target;
			
			customThemeColors[cssProperty] = value;
			
			updateCustomThemeStyle();
		});
		
		colorInputs.push(colorInput);
		
		const colorPickerWrapper =
			$new('.color-picker-wrapper')
				.append(colorPicker)
				.element();
		
		colorPickerWrapper.append(colorInput);
		colorPickerWrapper.append(resetIcon);
		
		colorOption.append(colorPickerTitle);
		colorOption.append(colorPickerWrapper);
		
		colorOptions.append(colorOption);
	};
	
	createColorPicker('text-color', 'white');
	createColorPicker('page-background-color', '#685B87');
	createColorPicker('board-color', '#2f2f69');
	createColorPicker('nav-button-border-color', '#ffffff99');
	createColorPicker('nav-button-background-color', '#44335566');
	createColorPicker('wild-color', '#FFFF00');
	createColorPicker('x-2-letter-color', '#FFA500');
	createColorPicker('x-3-letter-color', '#FF0000');
	createColorPicker('x-2-word-color', '#800080');
	createColorPicker('x-3-word-color', '#000000');
	createColorPicker('empty-tile-color', '#a1a1a1');
	createColorPicker('empty-tile-text-color', '#ffffff');
	createColorPicker('tile-color', '#C5A064');
	createColorPicker('tile-border-color', '#8b6914');
	createColorPicker('tile-text-color', '#ffffff');
	createColorPicker('word-holder-color', '#633');
	createColorPicker('word-holder-border-color', '#311');
	
	
	const resetAllCustomColors = e => {
		Object.keys(customThemeColors).forEach(k => delete customThemeColors[k]);
		
		colorInputs.forEach(colorPicker => {
			colorPicker.value = colorPicker.dataset.defaultValue;
		});
		
		updateCustomThemeStyle();
	};
	
	const resetAllButton =
		$new('button')
			.text('Reset All Colors')
			.on('click', resetAllCustomColors)
			.element();
	
	colorOptions.append(resetAllButton);
	
	settingsModal.append(colorOptions);
	
	body.append(overlay);
	body.append(settingsModal);
};

document.on('DOMContentLoaded', (e) => {
	document.head[0].append(style);
	document.head[0].append(colorStyle);
	
	let body = document.body;
	
	const progress = JSON.parse(localStorage.getItem('progress'));
	initGrid(body, progress);
	
	initSettings(body);
	
	resize();
	
	window.on('resize', resize);
	
	const dragBegin = (e, t) => {
		if (e.target.hasClass('button')) {
			e.preventDefault();
			const word = e.target.parentElement.parentElement;
			if (e.target.hasClass('vertical'))
				word.classList.add('rotated');
			beginWordDrag(word, t.clientX, t.clientY);
		}
	};
	
	window.on('mousedown', (e) => { dragBegin(e, e); });
	window.on('touchstart', (e) => { dragBegin(e, e.touches[0]); }, { passive: false });
	
	// TODO(bret): Use requestAnimationFrame for the actual placement of the word?
	const dragProgress = (e, t) => {
		if (dragWord !== null) {
			// If there are no buttons being pressed, return to hand
			if (e.buttons === 0) {
				returnToHand(dragWord);
				dragWord = null;
				return;
			}
			
			e.preventDefault();
			onWordDrag(dragWord, t.clientX, t.clientY);
		}
	};
	
	window.on('mousemove', (e) => { dragProgress(e, e); });
	window.on('touchmove', (e) => { dragProgress(e, e.touches[0]); }, { passive: false });
	
	const dragEnd = () => {
		if (dragWord !== null) {
			endWordDrag(dragWord);
		}
	}
	
	window.on('mouseup', dragEnd);
	window.on('touchend', dragEnd);
	
	document.on('keydown', e => {
		if (e.ctrlKey) {
			switch (e.keyCode) {
				case KEYS.SLASH: {
					e.preventDefault();
					toggleSettings();
				} break;
			}
		} else {
			switch (e.keyCode) {
				case KEYS.SPACE:
				case KEYS.ENTER: {
					let valid = true;
					for (let i = 0, n = konami.length; valid && (i < n); ++i) {
						valid = (latestKeys[i] === konami[i]); 
					}
					
					if (valid) {
						// TODO(bret): Do something special!
						console.log('you have entered the konami code');
					}
				} break;
			}
			
			latestKeys.shift();
			latestKeys.push(e.keyCode);
		}
	});
});

// TODO(bret): Create a shuffle button!
const shuffle = (arr) => {
	return arr;
	let curIndex = arr.length, temp, randomIndex;
	
	while (curIndex > 0) {
		randomIndex = Math.floor(Math.random() * 9999999) % curIndex;
		--curIndex;
		
		temp = arr[curIndex];
		arr[curIndex] = arr[randomIndex];
		arr[randomIndex] = temp;
	}
	
	return arr;
};

// TODO(bret): Actually implement pooling
// TODO(bret): Check if we have pooling in or not...
const recycledTiles = [];
const recycleTile = (tile) => {
	tile.remove();
	recycledTiles.push(tile);
};

const createTile = (letter, x, y, className = '') => {
	const tile = recycledTiles.shift() || $new().children($new('.strings'), $new('.background')).element();
	
	const prefix = (letter) ? 'has' : 'no'
	
	tile.classList.add('tile');
	tile.classList.add(`${prefix}-letter`);
	if (className !== '')
		tile.classList.add(className);
	if (prefix === 'has') {
		tile.classList.add('stop-animate');
	}
	tile.dataset.letter = letter || '';
	tile.dataset.points = letter ? LETTER_POINTS[letter] : '';
	tile.dataset.type = className;
	
	if (x !== undefined) tile.dataset.x = x;
	if (y !== undefined) tile.dataset.y = y;
	
	return tile;
};

const resetTile = (tile, delay) => {
	tile.style.animationDelay = `${delay}ms`;
	tile.firstChild.style.transitionDelay = `0s`;
	
	tile.classList.remove('has-letter');
	tile.classList.remove('stop-animate');
	
	tile.classList.remove('horizontal');
	tile.classList.remove('vertical');
	
	tile.classList.remove('left');
	tile.classList.remove('right');
	tile.classList.remove('top');
	tile.classList.remove('bottom');
	
	tile.classList.add('no-letter');
	if (tile.dataset.type !== '')
		tile.classList.add(tile.dataset.type);
	
	tile.dataset.letter = '';
	tile.dataset.points = '';
	
	return tile;
};

const isTileOccupied = (letter, tile) => (tile.dataset.letter !== '');

const setWordPos = (word, x, y, before = null, execIfNull = false) => {
	window.requestAnimationFrame(() => {
		if (before !== null) before();
		if ((execIfNull === false) && (dragWord === null)) return;
		word.style.left = word.pos.x + x + 'px';
		word.style.top = word.pos.y + y + 'px';
	});
};

// TODO(bret): Do we want to throttle this? What if the player leaves the browser page before it saves? But then again... that's on the player if they close it that quickly?
const saveGame = () => {
	const wordsOnBoard = playedWords.map(w => ({
		word: w.dataset.word,
		tileCoord: {
			x: +w.dataset.x,
			y: +w.dataset.y
		},
		rotated: w.classList.contains('rotated')
	}));
	
	localStorage.setItem('progress', JSON.stringify({
		words: dictionary,
		wordsOnBoard
	}));
};

const playedWords = [];
const removeWord = (word) => {
	word.remove();
	playedWords.push(word);
};

const getPointsForTile = (hoverTile) => {
	
};

const assignPointsToWord = (word) => {
	let multiplier = 1;
	let points = 0;
	for (const tile of word.tiles) {
		const hoverTile = getHoveringTile(tile);
		hoverTile.dataset.letter = tile.dataset.letter;
		hoverTile.dataset.points = tile.dataset.points;
		let curPoints = +hoverTile.dataset.points;
		
		if (hoverTile.hasClass('x-2-letter'))
			curPoints *= 2;
		if (hoverTile.hasClass('x-3-letter'))
			curPoints *= 3;
		if (hoverTile.hasClass('x-2-word'))
			multiplier *= 2;
		if (hoverTile.hasClass('x-3-word'))
			multiplier *= 3;
		
		points += curPoints;
	};
	
	word.points = points * multiplier;
};

const keyframesWordPlace = {
	0: {
		'transform': 'scale(1)',
	},
	50: {
		'transform': 'scale(1.6)',
		'opacity': '0.75'
	},
	100: {
		'transform': 'scale(1)',
		'opacity': '1.0'
	}
};

const animateWordIntoBoard = (word) => {
	const tiles = word.q('.tile');
	const delay = 60;
	const duration = delay * 5;	
	
	assignPointsToWord(word);
	addPoints(word.points);
	
	word.classList.add('on-grid');
	setTimeout(() => {
		let tile;
		for (let t = 0, tile = null, n = tiles.length; (t < n) && (tile = tiles[t]); ++t) {
			Transition.animate(tile, keyframesWordPlace, duration, {
				delay: t * delay
			});
			
			const delayStr = `${t * delay / 1000}s`;
			const gridTile = getHoveringTile(tile);
			gridTile.dataset.stacked = 1 + +(gridTile.dataset.stacked || 0);
			gridTile.firstChild.style.transitionDelay = `${delayStr}, ${delayStr}, ${delayStr}, ${delayStr}`;
			gridTile.classList.remove('no-letter');
			if (word.hasClass('rotated')) {
				gridTile.classList.add('vertical');
				if (t === 0)
					gridTile.classList.add('top');
				if (t === word.tiles.length - 1)
					gridTile.classList.add('bottom');
			} else {
				 gridTile.classList.add('horizontal');
				if (t === 0)
					gridTile.classList.add('left');
				if (t === word.tiles.length - 1)
					gridTile.classList.add('right');
			}
			
		}
		
		setTimeout(() => {
			assignToGrid(word);
			removeWord(word);
			saveGame();
			word.classList.remove('on-grid');
		}, duration + tiles.length * delay);
	}, 100);
};

const alignWithGrid = (word, instant = false) => {
	const startPos = word.getBoundingClientRect();
	word.pos.x = word.pos.y = 0;
	const firstTile = getHoveringTile(word);
	const dx = startPos.x - firstTile.pos.x;
	const dy = startPos.y - firstTile.pos.y;
	if (instant) {
		setWordPos(word, firstTile.pos.x, firstTile.pos.y, null, true);
		animateWordIntoBoard(word);
	} else {
		let percent = 0.0;
		let then = performance.now();
		const move = (now) => {
			const dt = Math.max(0, (now - then)) / 1000;
			then = now;
			percent += 10.0 * dt;
			if (percent < 1.0)
				window.requestAnimationFrame(move);
			else
				animateWordIntoBoard(word);
			const t = Math.easeInOut(Math.easeOut(percent));
			setWordPos(word,
				Math.lerp(startPos.x, firstTile.pos.x, t),
				Math.lerp(startPos.y, firstTile.pos.y, t),
				null, true);
		};
		window.requestAnimationFrame(move);
	}
};

const assignToGrid = (word) => {
	for (const tile of word.tiles) {
		const hoverTile = getHoveringTile(tile);
		
		hoverTile.classList.remove('wild');
		hoverTile.classList.remove('x-2-letter');
		hoverTile.classList.remove('x-3-letter');
		hoverTile.classList.remove('x-2-word');
		hoverTile.classList.remove('x-3-word');
		
		hoverTile.classList.add('has-letter');
		hoverTile.classList.add('stop-animate');
	};
};

const updateColumn = (column, n, prev, next, fade = true) => {
	if (n === +column.children[1].textContent) {
		return;
	}
	
	fade && column.classList.add('fade');
	
	column.children[0].textContent = prev || (n + 10 - 1) % 10;
	column.children[1].textContent = n;
	column.children[2].textContent = next || (n + 1) % 10;
};

const updateColumns = (points, ...args) => {
	updateColumn(pointsColHundreds, Math.floor(points / 100) % 10, ...args);
	updateColumn(pointsColTens, Math.floor(points / 10) % 10, ...args);
	updateColumn(pointsColOnes, points % 10, ...args);
};

let transition = 0;
const addPoints = (inc) => {
	const startPoints = totalPoints;
	let points = startPoints;
	totalPoints += inc;
	
	const incSign = Math.sign(inc);
	const incAbs = Math.abs(inc);
	let length = 300 * Math.log2(incAbs) * 2;
	let lengthPerDigit = length / incAbs;
	
	let then = performance.now();
	let elapsed = 0;
	
	updateColumns(points, '-');
	
	const animate = now => {
		if (elapsed > length) {
			points = totalPoints;
			
			pointsColHundreds.firstChild.style.marginTop = 0;
			pointsColTens.firstChild.style.marginTop = 0;
			pointsColOnes.firstChild.style.marginTop = 0;
			
			updateColumns(points, '-', '-');
			
			window.requestAnimationFrame(() => {
				pointsColHundreds.classList.remove('fade');
				pointsColTens.classList.remove('fade');
				pointsColOnes.classList.remove('fade');
			});
			
			return;
		}
		
		window.requestAnimationFrame(animate);
		
		const dt = now - then;
		then = now;
		
		elapsed += dt;
		
		const elapsedLerped = Math.lerp(0, length, Math.easeOut(Math.easeInOut(elapsed / length)));
		const digitsElapsed = (inc > 0)
			? Math.floor(elapsedLerped / lengthPerDigit)
			: Math.ceil(elapsedLerped / lengthPerDigit);
		const curElapsed = elapsedLerped - lengthPerDigit * digitsElapsed;
		
		points = startPoints + digitsElapsed * incSign;
		updateColumns(points);
		
		const em = (inc > 0)
			? Math.lerp(0, -0.99, curElapsed / lengthPerDigit)
			: Math.lerp(0, 0.99, curElapsed / lengthPerDigit);
		
		if (points % 100 === 99) {
			pointsColHundreds.firstChild.style.marginTop = `calc(${em}em)`;
		} else {
			pointsColHundreds.firstChild.style.marginTop = 0;
		}
		
		if (points % 10 === 9) {
			pointsColTens.firstChild.style.marginTop = `calc(${em}em)`;
		} else {
			pointsColTens.firstChild.style.marginTop = 0;
		}
		
		pointsColOnes.firstChild.style.marginTop = `calc(${em}em)`;
	};
	
	window.requestAnimationFrame(animate);
};

const removePoints = (points) => {
	addPoints(-points);
};

const returnToHand = (word) => {
	window.requestAnimationFrame(() => {
		let after = null;
		wordsHolderElem.q('.word').each(w => {
			if (w.order > word.order)
				after = w;
		});
		wordsHolderElem.insertBefore(word, after);
		word.style.left = null;
		word.style.top = null;
		word.classList.remove('drag');
		word.classList.remove('rotated');
	});
};

const dragStartPos = { x: 0, y: 0 };
const dragPos = { x: 0, y: 0 };
let dragWord = null;
const beginWordDrag = (word, mx, my) => {
	//word.classList.remove('on-grid');
	
	dragStartPos.x = dragPos.x = mx;
	dragStartPos.y = dragPos.y = my;
	
	window.requestAnimationFrame(() => {
		const rect = word.getBoundingClientRect();
		word.pos.x = mx - rect.width;
		word.pos.y = my - rect.height;
		if (word.hasClass('rotated'))
			rect.height /= word.tiles.length;
		else
			rect.width /= word.tiles.length;
		if (IS_TOUCH_DEVICE)
			word.pos.y -= rect.height * 2.25;
		for (const [index, tile] of word.tiles.entries()) {
			let xx = word.pos.x;
			let yy = word.pos.y;
			if (word.hasClass('rotated'))
				yy += (index * rect.height);
			else
				xx += (index * rect.width);
			tile.center.x = xx + (rect.width / 2) - mx;
			tile.center.y = yy + (rect.height / 2) - my;
		}
		setWordPos(word, 0, 0, () => {
			document.body.append(word);
			word.classList.add('drag');
		});
		dragWord = word;
	});
};

let dragWordValidPlacement = false;
const onWordDrag = (word, mx, my) => {
	dragPos.x = mx;
	dragPos.y = my;
	
	setWordPos(word, dragPos.x - dragStartPos.x, dragPos.y - dragStartPos.y);
	
	// TODO(bret): Cache this on resize
	const overlappedTiles = [];
	let x, y;
	let hasWild = false;
	for (const boardTile of boardTiles) {
		boardTile.classList.remove('word-hovering');
		boardTile.classList.remove('invalid');
	}
	
	const boardX = boardRect.x;
	const boardY = boardRect.y;
	const tileSize = boardRect.width / boardSize;
	
	let boardTile;
	let success = true;
	for (const tile of word.tiles) {
		x = Math.floor((tile.center.x + dragPos.x - boardX) / tileSize);
		y = Math.floor((tile.center.y + dragPos.y - boardY) / tileSize);
		
		tile.dataset.x = x;
		tile.dataset.y = y;
		
		boardTile = getBoardTile(x, y);
		if (boardTile === null) break;
		
		if (boardTile.dataset.type === 'wild')
			hasWild = true;
		
		overlappedTiles.push([ tile, boardTile ]);
	}
	
	word.dataset.x = word.tiles[0].dataset.x;
	word.dataset.y = word.tiles[0].dataset.y;
	
	dragWordValidPlacement = (overlappedTiles.length === word.tiles.length);
	
	let isOccupied = false;
	for (const [tile, boardTile] of overlappedTiles) {
		boardTile.classList.add('word-hovering');
		if (isTileOccupied(tile, boardTile)) {
			if (boardTile.dataset.letter === tile.dataset.letter) {
				isOccupied = true;
			} else {
				dragWordValidPlacement = false;
				boardTile.classList.add('invalid');
			}
		}
	}
	
	dragWordValidPlacement = (dragWordValidPlacement && (hasWild || isOccupied));
	
	if (!dragWordValidPlacement) {
		for (const [tile, boardTile] of overlappedTiles) {
			if (!isTileOccupied(tile, boardTile))
				boardTile.classList.add('invalid');
		}
	}
};

const endWordDrag = (word, instant = false) => {
	if (dragWordValidPlacement) {
		alignWithGrid(word, instant);
	} else {
		returnToHand(word);
	}
	
	dragWord = null;
	
	for (const tile of boardTiles)
		tile.classList.remove('word-hovering');
};

const wordElems = [];
wordElems.getWord = function(word) { return this[word.toUpperCase()]; };
const resetWordElems = () => wordElems.splice(0);

const addWord = (word) => {
	const wordElem = $new('.word').element();
	wordElem.points = 0;
	wordElem.str = word;
	wordElem.tiles = [];
	wordElem.order = wordsHolderElem.children.length;
	wordElem.pos = { x: 0, y: 0 };
	wordsHolderElem.append(wordElem);
	
	let totalPoints = 0;
	for (const letter of word) {
		totalPoints += LETTER_POINTS[letter] || 0;
		const tile = createTile(letter);
		tile.center = { x: 0, y: 0 };
		wordElem.tiles.push(tile);
		wordElem.append(tile);
	}
	wordElem.attr('data-points', totalPoints);
	
	const buttons = $new('.buttons').children(
		$new('i').class('button horizontal fad fa-arrow-alt-square-right'),
		$new('i').class('button vertical fad fa-arrow-alt-square-down')
	);
	
	wordElem.append(buttons);
	
	wordElems.push(wordElem);
	wordElem.dataset.word = word;
	wordElems[word] = wordElem;
};

// Dev section!
const localStorageSetGood = () => {
	const words = dictionary.slice();
	const wordsOnBoard = [
		{
			word: 'awesome',
			tileCoord: { x: 7, y: 4 },
			rotated: true
		},
		{
			word: 'dope',
			tileCoord: { x: 6, y: 8 }
		},
		{
			word: 'epic',
			tileCoord: { x: 9, y: 8 },
			rotated: true
		},
		{
			word: 'mint',
			tileCoord: { x: 8, y: 10 },
		},
		{
			word: 'bitchin',
			tileCoord: { x: 11, y: 8 },
			rotated: true
		},
		{
			word: 'boss',
			tileCoord: { x: 11, y: 8 }
		},
		{
			word: 'gnarly',
			tileCoord: { x: 5, y: 4 }
		},
		{
			word: 'righteous',
			tileCoord: { x: 2, y: 6 }
		},
		{
			word: 'fresh',
			tileCoord: { x: 7, y: 12 }
		},
	];
	
	localStorage.setItem('progress', JSON.stringify({
		words,
		wordsOnBoard
	}));
};

