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

Array.prototype.remove = function(val) {
    const index = this.indexOf(val);
    return (index > -1) ? this.splice(index, 1) : undefined;
};

String.prototype.toTitleCase = function() {
	return this.split(' ').map(v => v.substring(0, 1).toUpperCase() + v.substring(1).toLowerCase()).join(' ');
};

const createEnum = (...args) => args.reduce((acc, val) => {
	acc[val] = val;
	return acc;
}, {});

let gameState;
const GAME_STATES = createEnum(
	'PLAYING',
	'SETTINGS',
	'THEMING',
);

const changeState = newState => {
	console.log(`Changed state from ${gameState} to ${newState}`);
	gameState = newState;
};

// TODO(bret): Handle states better
changeState(GAME_STATES.PLAYING);

let boardRect;
const boardSize = 15;

const createGrid = boardSize => Array.from({ length: boardSize }, v => Array.from({ length: boardSize }));

const boardSquares = [];
const getBoardSquare = (x, y) => {
	if ((x < 0) || (x >= boardSize) || (y < 0) || (y >= boardSize))
		return null;
	return boardSquares[y * boardSize + x];
};

const getUnderlappingSquare = (tile) => getBoardSquare(+tile.dataset.x, +tile.dataset.y);

const getBoardSquareRow = (x, y, n) => Array.from({ length: n }, (_, i) => getBoardSquare(x + i, y));

const getBoardSquareCol = (x, y, n) => Array.from({ length: n }, (_, i) => getBoardSquare(x, y + i));

const getBoardSquareSeq = (x, y, n, rotated) => ((rotated) ? getBoardSquareCol : getBoardSquareRow)(x, y, n);

const everySquareMatchesLetters = (letters) => (tile, i) => (tile !== null) && ((!tile.dataset.letter) || (tile.dataset.letter === letters[i]));

const everySquareMatchesWord = (word) => everySquareMatchesLetters(word.toUpperCase().split(''));

const getXYAtOffset = (x, y, i, rotated) => [x + (!rotated && i), y + (rotated && i)];

const isTileSeqIntersectingCenter = (x, y, n, rotated, boardSize) => {
	const center = boardSize >> 1;
	const [span, axis] = [x, y][rotated ? 'reverse' : 'slice']();
	return (span <= center && span + n > center) && (axis === center);
};

const version = '0.3.2';

const RENDER_BOARD = true;

const KEYCODES = {
	LEFT: 37,
	UP: 38,
	RIGHT: 39,
	DOWN: 40,
	B: 66,
	A: 65,
	SPACE: 32,
	ENTER: 13,
};

const KEYS = {
	COMMA: ',',
	SLASH: '/',
};

const konami = [
	KEYCODES.UP,
	KEYCODES.UP,
	KEYCODES.DOWN,
	KEYCODES.DOWN,
	KEYCODES.LEFT,
	KEYCODES.RIGHT,
	KEYCODES.LEFT,
	KEYCODES.RIGHT,
	KEYCODES.B,
	KEYCODES.A
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
	changeState(GAME_STATES.SETTINGS);
};

const toggleSettings = () => {
	overlay.classList.toggle('show');
	if (settingsModal.classList.toggle('show')) {
		changeState(GAME_STATES.SETTINGS);
	} else {
		changeState(GAME_STATES.PLAYING);
	}
};

const closeSettings = () => {
	overlay.classList.remove('show');
	settingsModal.classList.remove('show');
	changeState(GAME_STATES.PLAYING);
};

const startEditTheme = () => {
	overlay.classList.add('capture-pointer-events');
	closeSettings();
	changeState(GAME_STATES.THEMING);
	setTimeout(() => {
		themingPanel.classList.add('show');
	}, 150);
	setTimeout(() => {
		themingPanel.classList.remove('collapsed');
	}, 300);
};

const finishEditTheme = () => {
	overlay.classList.remove('capture-pointer-events');
	themingPanel.classList.remove('show');
	openSettings();
	changeState(GAME_STATES.SETTINGS);
	themingPanel.classList.add('collapsed');
};

const actionSettings = () => {
	openSettings();
};

const actionUndo = (n = 1) => {
	// TODO(bret): Probably make sure you can't do this while something is animating
	while (n--) {
		if (playedWords.length > 0) {
			const word = playedWords.pop();
			let tile, square;
			for (let l = 0; l < word.tiles.length; ++l) {
				tile = word.tiles[l];
				square = getUnderlappingSquare(tile);
				
				playedTiles[square.dataset.letter].remove(square);
				
				let stacked = +square.dataset.stacked - 1;
				if (stacked === 0) {
					resetBoardSquare(square, 60 * (word.tiles.length - l));
				} else {
					if (word.hasClass('rotated')) {
						square.classList.remove('vertical');
						square.classList.remove('top');
						square.classList.remove('bottom');
					} else {
						square.classList.remove('horizontal');
						square.classList.remove('left');
						square.classList.remove('right');
					}
				}
				square.dataset.stacked = stacked;
			}
			removePoints(word.points);
			word.points = 0;
			returnToHand(word);
		}
	}
	saveGame();
};

let undoButton, infoButton;

const clearProgress = () => {
	localStorage.removeItem('progress');
};

const restorePlayedWords = (wordsOnBoard) => {
	const {
		word,
		tileCoord,
		rotated = false
	} = wordsOnBoard[0];
	
	const { x, y } = tileCoord;
	
	if (isTileSeqIntersectingCenter(x, y, word.length, rotated, boardSize) === false) {
		clearProgress();
		return;
	}
	
	const allWithinBounds = wordsOnBoard.every(w => {
		const {
			word,
			tileCoord,
			rotated = false
		} = w;
		
		const { x, y } = tileCoord;
		
		// Check within bounds
		const finalPos = word.length + ((rotated === true) ? y : x);
		const withinBoardBounds = (x >= 0) && (y >= 0) && (finalPos <= boardSize);
		return withinBoardBounds;
	});
	
	if (allWithinBounds === false) {
		clearProgress();
		return;
	}
	
	const totalPoints = wordsOnBoard.reduce((acc, w) => {
		if (acc === null) return acc;
		
		const {
			word,
			tileCoord,
			rotated = false
		} = w;
		
		const { x, y } = tileCoord;
		
		// Make sure the user didn't cheat
		const letters = word.toUpperCase().split('');
		const squares = getBoardSquareSeq(x, y, word.length, rotated);
		if (squares.every(everySquareMatchesLetters(letters)) === false)
			return null;
		
		const wordElem = wordElems.getWord(word);
		wordElem.dataset.x = x;
		wordElem.dataset.y = y;
		
		const { tiles } = wordElem;
		tiles.forEach((tile, i) => {
			[tile.dataset.x, tile.dataset.y] = getXYAtOffset(x, y, i, rotated);
		});
		
		if (rotated === true)
			wordElem.classList.add('rotated');
		
		assignPointsToWord(wordElem);
		acc += wordElem.points;
		
		squares.forEach((square, i) => {
			const letter = letters[i];
			playedTiles[letter].push(square);
			
			square.dataset.letter = letter;
			square.dataset.points = LETTER_POINTS[letter];
			
			square.dataset.stacked = +(square.dataset.stacked || 0) + 1;
			
			square.classList.remove('wild');
			square.classList.remove('x-2-letter');
			square.classList.remove('x-3-letter');
			square.classList.remove('x-2-word');
			square.classList.remove('x-3-word');
			
			square.classList.remove('no-letter');
			
			square.classList.add('has-letter');
			
			if (rotated) {
				square.classList.add('vertical');
				if (i === 0) {
					square.classList.add('top');
				} else if (i === word.length - 1) {
					square.classList.add('bottom');
				}
			} else {
				square.classList.add('horizontal');
				if (i === 0) {
					square.classList.add('left');
				} else if (i === word.length - 1) {
					square.classList.add('right');
				}
			}
		});
		
		removeWord(wordElem);
		
		return acc;
	}, 0);
	
	if (totalPoints === null) {
		actionUndo(playedWords.length);
		clearProgress();
		return;
	}
	
	addPoints(totalPoints);
	
	checkGameOver();
};

const initGrid = (body, progress) => {
	const navButtons = [
		{
			name: 'home',
			faClass: 'fa-home-alt',
			onClick: () => {},
		},
		{
			name: 'info',
			faClass: 'fa-info-square',
			onClick: () => {},
		},
		{
			name: 'settings',
			faClass: 'fa-sliders-h-square',
			onClick: actionSettings,
		},
		{
			name: 'undo',
			faClass: 'fa-undo-alt',
			onClick: () => actionUndo(),
		},
	];
	
	const mapDigit = t => $new('.digit').text(t);
	const mapDigitColumn = () => $new('.column').child(...['-', '0', '.'].map(mapDigit));
	
	const headerElem = body.appendChild(
		$new('header')
			.children(
				$new('.title').children(
					$new('.top').text('Radical'),
					$new('.bottom').text('Scrabble')
				),
				$new('.nav').children(
					...navButtons.map(({ name, faClass, onClick }) => {
						return $new(`span#${name}`).child(
							$new('i').class(`${name} fad ${faClass}`)
						).on('click', onClick);
					}),
				),
				$new('.points').children(
					$new('.top').text('Points'),
					$new('.bottom').children(
						...Array.from({ length: 3 }, mapDigitColumn)
					)
				)
			)
			.element()
	);
	pointsTitleElem = headerElem.q('.points .top');
	pointsElem = headerElem.q('.points .bottom');
	
	[undoButton, infoButton] = ['#undo', '#info'].map(id => headerElem.q(id));
	[pointsColHundreds, pointsColTens, pointsColOnes] = [...pointsElem.q('.column')]
	
	const boardWrapper = body.appendChild($new('.board-wrapper').element());
	boardElem = boardWrapper.appendChild($new('.board').element());
	const wordsElem = body.appendChild($new('.words').element());
	
	const footerElem = body.appendChild(
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
	const numSquares = boardSize * boardSize;
	if (RENDER_BOARD) {
		grid = createGrid(boardSize);
		
		const centerPos = Math.floor(boardSize / 2);
		for (let s = 0; s < numSquares; ++s) {
			const _x = (s % boardSize);
			const _y = Math.floor(s / boardSize);
			const x = Math.abs(centerPos - _x);
			const y = Math.abs(centerPos - _y);
			const d = Math.abs(x - y);
			
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
		
			const square = createSquare(null, _x, _y, className);
			grid[_x][_y] = square;
			boardSquares.push(square);
			boardElem.append(square);
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
	
	const tileDim = (boardWidth - 3) / boardSize; // NOTE(bret): for that 1.5em padding yo
	style.textContent = `.tile { width: ${tileDim}em; height: ${tileDim}em; }`;
	colorStyle.textContent = '';
	
	const resizeBoard = () => {
		// Resize the board
		const navHeight = 9;
		const squareDim = boardWidth / boardSize;
		const ratio = window.innerWidth / window.innerHeight;
		
		const landscape = ratio > 1.25;
		const [width, height] = (landscape) ? [
			window.innerWidth / ((boardSize << 1) + 1.5) / squareDim,
			window.innerHeight / (3.0 + boardSize) / squareDim
		] : [
			window.innerWidth / (boardSize + 0.5) / squareDim,
			window.innerHeight / (navHeight + boardSize) / squareDim
		];
		
		const classNames = ['portrait', 'landscape'];
		document.body.classList.add(classNames[+landscape]);
		document.body.classList.remove(classNames[+!landscape]);
		
		const size = Math.min(width, height);
		document.body.style.fontSize = (IS_FIREFOX) ? `${Math.floor(size)}px` : `${size}px`;
		
		// Update each square's position
		window.requestAnimationFrame(() => {
			boardElem.q('.tile').each(square => {
				square.pos = square.getBoundingClientRect();
			});
		});
		
		boardRect = boardElem.getBoundingClientRect();
	};
	
	resizeBoard();
	
	wordsHolderElem = $new('.words-holder').element();
	
	const {
		words = dictionary,
		wordsOnBoard = []
	} = progress || {};
	
	// TODO(bret): Create an animation for these (probably set that up _after_ we've removed words based on wordsOnBoard (make these words animate in AFTER the progress words have been animated!)
	// TODO(bret): Perhaps he meant an animation of the words on the side?
	shuffle(words).forEach(addWord);
	
	if (wordsOnBoard.length > 0)
		restorePlayedWords(wordsOnBoard);
	
	// Create the DOM grid
	grid = createGrid(boardSize);
	
	const centerPos = Math.floor(boardSize / 2);
	for (let s = 0; s < numSquares; ++s) {
		const _x = (s % boardSize);
		const _y = Math.floor(s / boardSize);
		const x = Math.abs(centerPos - _x);
		const y = Math.abs(centerPos - _y);
		
		const speed = 0.04;
		let delay = (x + y) * speed;
		
		const square = getBoardSquare(_x, _y);
		if (square.className.split(' ').length > 2)
			delay += 8 * speed;
		if (square.classList.contains('has-letter')) {
			delay += 10 * speed;
			setTimeout(() => {
				square.classList.add('stop-animate');
			}, Math.ceil(delay * 1e3 + 400 + 200)); // 400 being how long the delay is, 200 for just extra padding
		}
		
		// TODO(bret): Remove this animation delay at some point!
		// TODO(bret): Figure out why this comment exists! :)
		square.style.animationDelay = square.q('.background').style.animationDelay = `${delay}s`;
		grid[_x][_y] = square;
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
const resize = e => onResizeCallbacks.forEach(c => c(e));


let overlay, settingsModal, themingPanel;
const initSettings = body => {
	overlay = $new('#overlay').element();
	settingsModal = $new('#settings-modal').element();
	
	overlay.on('click', e => {
		switch (gameState) {
			case GAME_STATES.SETTINGS:
				closeSettings();
				break;
			case GAME_STATES.THEMING:
				themingPanel.classList.add('collapsed');
				break;
		}
	});
	
	let currentTheme = localStorage.getItem('theme') || themes[0].option;
	document.body.classList.add(currentTheme);
	
	const createOption = ({ title, value }) => $new('option').text(title).attr('value', value);
	
	const themeDropdown =
		$new('select')
			.children(themes.map(createOption))
			.element();
	
	themeDropdown.on('change', e => {
		const { value } = e.target;
		document.body.classList.remove(currentTheme);
		
		currentTheme = value;
		document.body.classList.add(currentTheme);
		
		localStorage.setItem('theme', currentTheme);
	});
	
	themeDropdown.value = currentTheme;
	
	const themeButton =
		$new('button')
			.text('Edit Theme')
			.on('click', startEditTheme)
			.element();
	
	settingsModal.append(themeDropdown);
	settingsModal.append(themeButton);
	
	body.append(overlay);
	body.append(settingsModal);
};

const initThemingPanel = body => {
	themingPanel = $new('#theming-panel').element();
	
	const mainContent = $new('.main-content').element();
	
	const colorOptions = $new('.color-options').element();
	
	const customThemeColors = JSON.parse(localStorage.getItem('custom-theme')) || {};
	
	const updateCustomThemeStyle = () => {
		let styleStr = '.theme-custom { ';
		styleStr += Object.entries(customThemeColors).map(([k, v]) => `--${k}: ${v}`).join('; ')
		styleStr += ' }';
		colorStyle.textContent = styleStr;
		
		localStorage.setItem('custom-theme', JSON.stringify(customThemeColors));
	};
	
	updateCustomThemeStyle();
	
	const colorInputs = [];
	
	const colorPickerTemp = document.createElement('div');
	document.body.appendChild(colorPickerTemp);
	
	const createColorPicker = (property, defaultValue) => {
		colorPickerTemp.style.color = defaultValue;
		defaultValue = getComputedStyle(colorPickerTemp).color;
		
		const rgbRegex = /rgba?\((\d+), ?(\d+), ?(\d+)/;
		const [, ...rgb] = defaultValue.match(rgbRegex);
		
		defaultValue =
			rgb.map(v => +v)
				.reduce((acc, v) => acc + v.toString(16).padStart(2, '0'), '#');
		
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
					
					colorInput.resetToDefault();
					
					delete customThemeColors[cssProperty];
					updateCustomThemeStyle();
				})
				.element();
		
		if (initialValue !== defaultValue)
			resetIcon.classList.add('enabled');
		
		colorInput.on('change', e => {
			const {
				value,
				dataset: { cssProperty }
			} = e.target;
			
			customThemeColors[cssProperty] = value;
			
			resetIcon.classList.add('enabled');
			
			updateCustomThemeStyle();
		});
		
		colorInputs.push(colorInput);
		
		const colorPickerWrapper =
			$new('.color-picker-wrapper')
				.append(colorPicker)
				.element();
		
		colorInput.resetToDefault = () => {
			colorInput.value = colorInput.dataset.defaultValue;
			resetIcon.classList.remove('enabled');
		};
		
		colorPickerWrapper.append(colorInput);
		colorPickerWrapper.append(resetIcon);
		
		colorOption.append(colorPickerWrapper);
		colorOption.append(colorPickerTitle);
		
		colorOptions.append(colorOption);
	};
	
	createColorPicker('text-color', 'white');
	createColorPicker('page-background-color', '#685B87');
	createColorPicker('board-color', '#2f2f69');
	createColorPicker('settings-panel-color', '#99859e');
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
	
	
	colorPickerTemp.remove();
	
	const resetAllCustomColors = e => {
		Object.keys(customThemeColors).forEach(k => delete customThemeColors[k]);
		
		colorInputs.forEach(input => input.resetToDefault());
		
		updateCustomThemeStyle();
	};
	
	const finishedButton =
		$new('button')
			.text('All Done')
			.on('click', finishEditTheme)
			.element();
	
	const resetAllButton =
		$new('button')
			.text('Reset All Colors')
			.on('click', resetAllCustomColors)
			.element();
	
	colorOptions.append(finishedButton);
	colorOptions.append(resetAllButton);
	
	mainContent.append(colorOptions);
	
	const sidebar =
		$new('.bar')
			.child($new('i').class('fad fa-bars'))
			.on('click', (e) => {
				themingPanel.classList.toggle('collapsed');
			})
			.element();
	
	themingPanel.append(mainContent);
	themingPanel.append(sidebar);
	
	body.append(themingPanel);
	
	themingPanel.classList.add('collapsed');
};

document.on('DOMContentLoaded', (e) => {
	document.head[0].append(style);
	document.head[0].append(colorStyle);
	
	const body = document.body;
	
	const progress = JSON.parse(localStorage.getItem('progress'));
	initGrid(body, progress);
	
	initSettings(body);
	initThemingPanel(body);
	
	resize();
	
	window.on('resize', resize);
	
	const dragBegin = (e, t) => {
		if (e.target.hasClass('button')) {
			// e.preventDefault();
			const word = e.target.parentElement.parentElement;
			const vertical = e.target.hasClass('vertical');
			beginWordDrag(word, t.clientX, t.clientY, vertical);
		}
	};
	
	// TODO(bret): Do any other events need passive??
	window.on('mousedown', (e) => dragBegin(e, e), { passive: false });
	window.on('touchstart', (e) => dragBegin(e, e.touches[0]), { passive: false });
	
	// TODO(bret): Use requestAnimationFrame for the actual placement of the word?
	const dragProgress = (e, t) => {
		if (dragWord === null) return;
		
		// If there are no buttons being pressed, return to hand
		if (e.buttons === 0) {
			returnToHand(dragWord);
			dragWord = null;
			return;
		}
		
		e.preventDefault();
		onWordDrag(dragWord, t.clientX, t.clientY);
	};
	
	window.on('mousemove', (e) => dragProgress(e, e), { passive: false });
	window.on('touchmove', (e) => dragProgress(e, e.touches[0]), { passive: false });
	
	const dragEnd = () => {
		if (dragWord === null) return;
		
		endWordDrag(dragWord);
	}
	
	window.on('mouseup', dragEnd, { passive: false });
	window.on('touchend', dragEnd, { passive: false });
	
	document.on('keydown', e => {
		if (e.ctrlKey) {
			switch (e.key) {
				case KEYS.COMMA: {
					e.preventDefault();
					toggleSettings();
				} break;
				
				case KEYS.SLASH: {
					e.preventDefault();
				} break;
			}
		} else {
			switch (e.keyCode) {
				case KEYCODES.SPACE:
				case KEYCODES.ENTER: {
					if (konami.every((k, i) => k === latestKeys[i])) {
						// TODO(bret): Do something special!
						console.log('you have entered the konami code!');
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

// TODO(bret): Actually implement pooling (we don't recycle tiles ever)
const recycledTiles = [];
const recycleTile = (tile) => {
	tile.remove();
	recycledTiles.push(tile);
};

const getRecycledTile = () => {
	const tile = recycledTiles.shift();
	if (!tile) return;
	
	tile.className = 'tile';
	
	tile.removeAttritube('data-x');
	tile.removeAttritube('data-y');
	tile.removeAttritube('data-letter');
	tile.removeAttritube('data-points');
	tile.removeAttritube('data-type');
	
	return tile;
};

const createTile = (letter, x, y, className = '') => {
	const tile = getRecycledTile() || $new(`.tile`).children($new('.strings'), $new('.background')).element();
	
	const prefix = (letter) ? 'has' : 'no';
	
	tile.classList.add(`${prefix}-letter`);
	if (className !== '')
		tile.classList.add(className);
	if (prefix === 'has')
		tile.classList.add('stop-animate');
	tile.dataset.letter = letter || '';
	tile.dataset.points = letter ? LETTER_POINTS[letter] : '';
	tile.dataset.type = className;
	
	if (x !== undefined) tile.dataset.x = x;
	if (y !== undefined) tile.dataset.y = y;
	
	return tile;
};

const createSquare = createTile;

const resetBoardSquare = (square, delay) => {
	square.style.animationDelay = `${delay}ms`;
	square.firstChild.style.transitionDelay = `0s`;
	
	square.classList.remove('has-letter');
	square.classList.remove('stop-animate');
	
	square.classList.remove('horizontal');
	square.classList.remove('vertical');
	
	square.classList.remove('left');
	square.classList.remove('right');
	square.classList.remove('top');
	square.classList.remove('bottom');
	
	square.classList.add('no-letter');
	if (square.dataset.type !== '')
		square.classList.add(square.dataset.type);
	
	square.dataset.letter = '';
	square.dataset.points = '';
	
	return square;
};

const isSquareOccupied = (square) => square.dataset.letter !== '';

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

const checkGameOver = () => {
	let words = wordsHolderElem.q('.word');
	if (HTMLCollection.prototype.isPrototypeOf(words))
		words = [...words];
	else
		words = [words];
	
	let hasMovesLeft = (playedWords.length === 0);
	if ((hasMovesLeft === false) && (words.length > 0)) {
		let x, y;
		
		hasMovesLeft = words.some(word => {
			const letters = word.dataset.word.split('');
			
			return word.tiles.some((tile, t) => {
				const { letter } = tile.dataset;
				
				return playedTiles[letter].some(letterElem => {
					x = +letterElem.dataset.x;
					y = +letterElem.dataset.y;
					
					return [
						getBoardSquareSeq(x - t, y, word.tiles.length, false),
						getBoardSquareSeq(x, y - t, word.tiles.length, true)
					].some(squares => squares.every(everySquareMatchesLetters(letters)));
				});
			});
		});
	}
	
	return !hasMovesLeft;
};

const playedWords = [];
const playedTiles = Object.keys(LETTER_POINTS).reduce((acc, val) => (acc[val] = [], acc), {});
const removeWord = (word) => {
	word.remove();
	playedWords.push(word);
};

const assignPointsToWord = (word) => {
	let multiplier = 1;
	let points = 0;
	for (const tile of word.tiles) {
		const square = getUnderlappingSquare(tile);
		square.dataset.letter = tile.dataset.letter;
		square.dataset.points = tile.dataset.points;
		let curPoints = +square.dataset.points;
		
		if (square.hasClass('x-2-letter'))
			curPoints *= 2;
		if (square.hasClass('x-3-letter'))
			curPoints *= 3;
		if (square.hasClass('x-2-word'))
			multiplier *= 2;
		if (square.hasClass('x-3-word'))
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
			const gridTile = getUnderlappingSquare(tile);
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
			checkGameOver();
			word.classList.remove('on-grid');
		}, duration + tiles.length * delay);
	}, 100);
};

const alignWithGrid = (word, instant = false) => {
	const startPos = word.getBoundingClientRect();
	word.pos.x = word.pos.y = 0;
	const firstTile = getUnderlappingSquare(word);
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
		const square = getUnderlappingSquare(tile);
		
		const { letter } = tile.dataset;
		playedTiles[letter].push(square);
		
		square.classList.remove('wild');
		square.classList.remove('x-2-letter');
		square.classList.remove('x-3-letter');
		square.classList.remove('x-2-word');
		square.classList.remove('x-3-word');
		
		square.classList.add('has-letter');
		square.classList.add('stop-animate');
	};
};

const updateColumn = (column, n, prev, next, fade = true) => {
	if (n === +column.children[1].textContent) return;
	
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
	const length = 300 * Math.log2(incAbs) * 2;
	const lengthPerDigit = length / incAbs;
	
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

const removePoints = (points) => addPoints(-points);

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
const beginWordDrag = (word, mx, my, rotated) => {
	//word.classList.remove('on-grid');
	
	dragStartPos.x = dragPos.x = mx;
	dragStartPos.y = dragPos.y = my;
	
	window.requestAnimationFrame(() => {
		if (rotated === true)
			word.classList.add('rotated');
		
		const rect = word.getBoundingClientRect();
		word.pos.x = mx - rect.width;
		word.pos.y = my - rect.height;
		
		if (word.hasClass('rotated'))
			rect.height /= word.tiles.length;
		else
			rect.width /= word.tiles.length;
		
		// TODO(bret): Would be sweet to get the DPI!
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
		
		dragWord = word;
		word.remove();
		
		setWordPos(word, 0, 0, () => {
			document.body.append(word);
			word.classList.add('drag');
		});
	});
};

let dragWordValidPlacement = false;
const onWordDrag = (word, mx, my) => {
	dragPos.x = mx;
	dragPos.y = my;
	
	setWordPos(word, dragPos.x - dragStartPos.x, dragPos.y - dragStartPos.y);
	
	// TODO(bret): We could keep a changelog of these and apply those changes at the end instead of doing so many DOM manipulations - dunno if that has a performance cost
	let x, y;
	let hasWild = false;
	for (const square of boardSquares) {
		square.classList.remove('word-hovering');
		square.classList.remove('invalid');
	}
	
	const boardX = boardRect.x;
	const boardY = boardRect.y;
	const tileSize = boardRect.width / boardSize;
	
	let square;
	let success = true;
	const tileSquarePairs = []; // TODO(bret): Cache this on resize
	for (const tile of word.tiles) {
		x = Math.floor((tile.center.x + dragPos.x - boardX) / tileSize);
		y = Math.floor((tile.center.y + dragPos.y - boardY) / tileSize);
		
		tile.dataset.x = x;
		tile.dataset.y = y;
		
		square = getBoardSquare(x, y);
		if (square === null) break;
		
		if (square.dataset.type === 'wild')
			hasWild = true;
		
		tileSquarePairs.push([ tile, square ]);
	}
	
	word.dataset.x = word.tiles[0].dataset.x;
	word.dataset.y = word.tiles[0].dataset.y;
	
	dragWordValidPlacement = (tileSquarePairs.length === word.tiles.length);
	
	let isOccupied = false;
	for (const [tile, square] of tileSquarePairs) {
		square.classList.add('word-hovering');
		if (isSquareOccupied(square)) {
			if (square.dataset.letter === tile.dataset.letter) {
				isOccupied = true;
			} else {
				dragWordValidPlacement = false;
				square.classList.add('invalid');
			}
		}
	}
	
	dragWordValidPlacement = (dragWordValidPlacement && (hasWild || isOccupied));
	
	if (!dragWordValidPlacement) {
		for (const [tile, square] of tileSquarePairs) {
			if (!isSquareOccupied(square))
				square.classList.add('invalid');
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
	
	for (const square of boardSquares)
		square.classList.remove('word-hovering');
};

const wordElems = [];
wordElems.getWord = function(word) { return this[word.toUpperCase()]; };
const resetWordElems = () => wordElems.splice(0);

const addWord = (word) => {
	word = word.toUpperCase();
	
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
