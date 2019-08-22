// NOTE(bret): Thanks to Ian Jones for providing a bit of the boilerplate code here from https://github.com/WITS/regretris/
let userAgent = navigator.userAgent;
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

let style = $new('style[type=text/css]').element();
let boardElem, wordsHolderElem;

let boardTiles = [];

let version = '0.2.5';

let dictionary = [
	'awesome',
	//'baller',
	'bitchin',
	'boss',
	'cool',
	'dope',
	'epic',
	'fresh',
	'gnarly',
	'groovy',
	//'hip',
	//'lit',
	'mint',
	'radical',
	'righteous',
	'rockin',
	'sweet',
	'sick',
	'tight',
	'tubular',
	'wicked',
];

Math.lerp = (a, b, t) => (b - a) * t + a;
Math.easeIn = t => t * t;
Math.easeOut = t => -t * (t - 2);
Math.easeInOut = t => (t <= .5) ? (t * t * 2) : (1 - (--t) * t * 2);

//dictionary = dictionary.slice(0, 1);
let grid;

let pointsElem;
let totalPoints = 0;

const LETTER_POINTS = { A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10 };

let actionUndo = () => {
	// TODO(bret): Probably make sure you can't do this while something is animating
	if (playedWords.length > 0) {
		let word = playedWords.pop();
		let letter, tile;
		for (let l = 0; l < word.letters.length; ++l) {
			letter = word.letters[l];
			tile = letter.tileHovering;
			let stacked = +tile.dataset.stacked - 1;
			if (stacked === 0) {
				resetTile(tile, 60 * (word.letters.length - (word.letters.length - l)));
			}
			tile.dataset.stacked = stacked;
		}
		removePoints(word.points);
		word.points = 0;
		returnToHand(word);
	}
};

let undoButton, infoButton, resetButton;

document.on('DOMContentLoaded', (e) => {
	document.head[0].append(style);
	
	let body = document.body;
	
	let headerElem = body.appendChild(
		$new('header')
			.children(
				$new('.title'),
				$new('.nav').children(
					$new('span#home')
						.child($new('i').class('home fad fa-home-alt'))
						/*.on('click', actionHome)*/,
					$new('span#info')
						.child($new('i').class('info fad fa-info-square'))
						/*.on('click', actionInfo)*/,
					$new('span#settings')
						.child($new('i').class('settings fad fa-sliders-h-square'))
						/*.on('click', actionSettings)*/,
					$new('span#undo')
						.child($new('i').class('undo fad fa-undo-alt'))
						.on('click', actionUndo),
				),
				$new('.points').attr('data-points', '000')
			)
			.element()
	);
	pointsElem = headerElem.q('.points');
	
	undoButton = headerElem.q('#undo');
	infoButton = headerElem.q('#info');
	resetButton = headerElem.q('#reset');
	
	boardElem = body.appendChild($new('.board').element());
	let wordsElem = body.appendChild($new('.words').element());
	wordsHolderElem = wordsElem.appendChild($new('.words-holder').element());
	
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
	
	let boardSize = 15;
	let numTiles = boardSize * boardSize;
	
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
		
		let speed = 0.04;
		let delay = (x + y) * speed;
		if (className !== '')
			delay += 8 * speed;
		
		let tile = createTile(null, className);
		// TODO(bret): Remove this animation delay at some point!
		tile.style.animationDelay = tile.q('.background').style.animationDelay = delay + 's';
		grid[_x][_y] = tile;
		boardTiles.push(tile);
		boardElem.append(tile);
	}
	
	for (let word of shuffle(dictionary))
		addWord(word.toUpperCase());
	
	let boardWidth = 100, boardHalfWidth = boardWidth >> 1;
	let emWidth = `${boardWidth}em`;
	let emLeft = `calc(50% - ${boardHalfWidth}em)`;
	
	headerElem.style.width = footerElem.style.width = emWidth; //`${boardWidth * 2}em`;
	headerElem.style.left = footerElem.style.left = emLeft; //`calc(50% - ${boardWidth}em)`;
	
	boardElem.style.width = emWidth;
	boardElem.style.left = emLeft;
	boardElem.style.top = '12em';
	
	wordsElem.style.width = emWidth;
	wordsElem.style.height = `calc(100% - ${boardWidth}em - 18em)`;
	wordsElem.style.left = emLeft;
	wordsElem.style.top = (boardWidth + 12) + `em`;
	
	let tileSize = (boardWidth - 3) / boardSize; // NOTE(bret): for that 1.5em padding yo
	style.textContent = `.tile { width: ${tileSize}em; height: ${tileSize}em; }`;
	
	const resize = () => {
		// TODO(bret): Make sure we re-position all the tiles!
		// Resize the board
		let navHeight = 9;
		let tileSize = boardWidth / boardSize;
		let ratio = window.innerWidth / window.innerHeight;
		
		let landscape = ratio > 1.25;
		let width, height;
		if (landscape) {
			width = window.innerWidth / ((boardSize << 1) + 1.5) / tileSize;
			height = window.innerHeight / (3.0 + boardSize) / tileSize;
		} else {
			width = window.innerWidth / (boardSize + 0.5) / tileSize;
			height = window.innerHeight / (navHeight + boardSize) / tileSize;
		}
		
		document.body.addClass((landscape) ? 'landscape' : 'portrait');
		document.body.removeClass((landscape) ? 'portrait' : 'landscape');
		
		let size = Math.min(width, height);
		if (size === width) {
			console.log('hi');
		} else {
			console.log('bye');
		}
		
		if (IS_FIREFOX)
			size = Math.floor(size);
		document.body.style.fontSize = `${size}px`;
		
		// Update each tile's position
		window.requestAnimationFrame(() => {
			boardElem.q('.tile').each(tile => {
				tile.pos = tile.getBoundingClientRect();
			});
		});
	};
	
	window.on('resize', resize);
	resize();
	
	let dragBegin = (e, e2) => {
		if (e.target.hasClass('button')) {
			e.preventDefault();
			let word = e.target.parentElement.parentElement;
			if (e.target.hasClass('vertical'))
				word.toggleClass('rotated');
			beginWordDrag(word, e2.clientX, e2.clientY);
		}
	};
	
	window.on('mousedown', (e) => { dragBegin(e, e); });
	window.on('touchstart', (e) => { dragBegin(e, e.touches[0]); }, { passive: false });
	
	let dragProgress = (e, e2) => {
		if ((e.buttons === 0) && (dragWord !== null)) {
			returnToHand(dragWord);
			dragWord = null;
		}
		
		if (dragWord !== null) {
			e.preventDefault();
			onWordDrag(dragWord, e2.clientX, e2.clientY);
		}
	};
	
	window.on('mousemove', (e) => { dragProgress(e, e); });
	window.on('touchmove', (e) => { dragProgress(e, e.touches[0]); }, { passive: false });
	
	let dragEnd = () => {
		if (dragWord !== null) {
			endWordDrag(dragWord);
		}
	}
	
	window.on('mouseup', dragEnd);
	window.on('touchend', dragEnd);
});

let shuffle = (arr) => {
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
let recycledTiles = [];
let recycleTile = (tile) => {
	tile.remove();
	recycledTiles.push(tile);
};

let createTile = (letter, className = '') => {
	let prefix = (letter) ? 'has' : 'no'
	let tile = recycledTiles.shift() || $new().children($new('.strings'), $new('.background')).element();
	
	tile.className = `tile ${className} ${prefix}-letter`;
	tile.dataset.letter = letter || '';
	tile.dataset.points = letter ? LETTER_POINTS[letter] : '';
	tile.dataset.type = className;
	
	return tile;
};

let resetTile = (tile, delay) => {
	tile.style.animationDelay = `${delay}ms`;
	tile.firstChild.style.transitionDelay = `0s`;
	
	tile.removeClass('has-letter');
	
	tile.removeClass('horizontal');
	tile.removeClass('vertical');
	
	tile.removeClass('left');
	tile.removeClass('right');
	tile.removeClass('top');
	tile.removeClass('bottom');
	
	tile.addClass('no-letter');
	if (tile.dataset.type !== '')
		tile.addClass(tile.dataset.type);
	
	tile.dataset.letter = '';
	tile.dataset.points = '';
	
	return tile;
};

let overlapTile = (tile, x, y) => {
	return (x >= tile.pos.left) && (x < tile.pos.right) && (y >= tile.pos.top) && (y < tile.pos.bottom);
};

let doesTileHasLetter = (letter, tile) => {
	return (tile.dataset.letter !== '');
};

let setWordPos = (word, x, y, before = null, execIfNull = false) => {
	window.requestAnimationFrame(() => {
		if (before !== null) before();
		if ((execIfNull === false) && (dragWord === null)) return;
		word.style.left = word.pos.x + x + 'px';
		word.style.top = word.pos.y + y + 'px';
	});
};

let playedWords = [];
let removeWord = (word) => {
	word.remove();
	playedWords.push(word);
};

let keyframesWordPlace = {
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

let animateWordIntoBoard = (word) => {
	let tiles = word.q('.tile');
	let delay = 60;
	let duration = delay * 5;	
	
	word.addClass('on-grid');
	setTimeout(() => {
		let tile;
		for (let t = 0, tile = null, n = tiles.length; (t < n) && (tile = tiles[t]); ++t) {
			Transition.animate(tile, keyframesWordPlace, duration, {
				delay: t * delay
			});
			
			let delayStr = `${t * delay / 1000}s`;
			let gridTile = tile.tileHovering;
			gridTile.dataset.stacked = 1 + +(gridTile.dataset.stacked || 0);
			gridTile.firstChild.style.transitionDelay = `${delayStr}, ${delayStr}, ${delayStr}, ${delayStr}`;
			gridTile.removeClass('no-letter');
			if (word.hasClass('rotated')) {
				gridTile.addClass('vertical');
				if (t === 0)
					gridTile.addClass('top');
				if (t === word.letters.length - 1)
					gridTile.addClass('bottom');
			} else {
				 gridTile.addClass('horizontal');
				if (t === 0)
					gridTile.addClass('left');
				if (t === word.letters.length - 1)
					gridTile.addClass('right');
			}
			
		}
		
		setTimeout(() => {
			assignToGrid(word);
			removeWord(word);
			word.removeClass('on-grid');
		}, duration + tiles.length * delay);
	}, 100);
};

let alignWithGrid = (word) => {
	let startPos = word.getBoundingClientRect();
	word.pos.x = word.pos.y = 0;
	let firstTile = word.letters[0].tileHovering;
	let percent = 0.0;
	let then = performance.now();
	let dx = startPos.x - firstTile.pos.x;
	let dy = startPos.y - firstTile.pos.y;
	let move = (now) => {
		let dt = Math.max(0, (now - then)) / 1000;
		then = now;
		percent += 10.0 * dt;
		if (percent < 1.0)
			window.requestAnimationFrame(move);
		else
			animateWordIntoBoard(word);
		let t = Math.easeInOut(Math.easeOut(percent));
		setWordPos(word,
			Math.lerp(startPos.x, firstTile.pos.x, t),
			Math.lerp(startPos.y, firstTile.pos.y, t),
			null, true);
	};
	window.requestAnimationFrame(move);
};

let assignToGrid = (word) => {
	let multiplier = 1;
	let points = 0;
	let index = 0;
	for (let letter of word.letters) {
		let tile = letter.tileHovering;
		tile.dataset.letter = letter.dataset.letter;
		tile.dataset.points = letter.dataset.points;
		let curPoints = +tile.dataset.points;
		
		if (tile.hasClass('x-2-letter'))
			curPoints *= 2;
		if (tile.hasClass('x-3-letter'))
			curPoints *= 3;
		if (tile.hasClass('x-2-word'))
			multiplier *= 2;
		if (tile.hasClass('x-3-word'))
			multiplier *= 3;
		
		points += curPoints;
		
		tile.removeClass('wild');
		tile.removeClass('x-2-letter');
		tile.removeClass('x-3-letter');
		tile.removeClass('x-2-word');
		tile.removeClass('x-3-word');
		
		tile.addClass('has-letter');
	};
	
	word.points = points * multiplier;
	addPoints(word.points);
};

let addPoints = (points) => {
	totalPoints += points;
	pointsElem.dataset.points = ('00' + totalPoints).substr(-3);
};

let removePoints = (points) => {
	addPoints(-points);
};

let returnToHand = (word) => {
	window.requestAnimationFrame(() => {
		let after = null;
		wordsHolderElem.q('.word').each(w => {
			if (w.order > word.order)
				after = w;
		});
		wordsHolderElem.insertBefore(word, after);
		word.style.left = null;
		word.style.top = null;
		word.removeClass('drag');
		word.removeClass('rotated');
	});
};

let dragStartPos = { x: 0, y: 0 };
let dragPos = { x: 0, y: 0 };
let dragWord = null;
let beginWordDrag = (word, mx, my) => {
	//word.removeClass('on-grid');
	
	dragStartPos.x = dragPos.x = mx;
	dragStartPos.y = dragPos.y = my;
	
	for (let letter of word.letters)
		letter.tileHovering = null;
	
	window.requestAnimationFrame(() => {
		let rect = word.getBoundingClientRect();
		word.pos.x = mx - rect.width;
		word.pos.y = my - rect.height;
		if (word.hasClass('rotated'))
			rect.height /= word.letters.length;
		else
			rect.width /= word.letters.length;
		if (IS_TOUCH_DEVICE)
			word.pos.y -= rect.height * 2.25;
		for (let [index, letter] of word.letters.entries()) {
			let xx = word.pos.x;
			let yy = word.pos.y;
			if (word.hasClass('rotated'))
				yy += (index * rect.height);
			else
				xx += (index * rect.width);
			letter.center.x = xx + (rect.width / 2) - mx;
			letter.center.y = yy + (rect.height / 2) - my;
		}
		setWordPos(word, 0, 0, () => {
			document.body.append(word);
			word.addClass('drag');
		});
		dragWord = word;
	});
};

let dragWordValidPlacement = false;
let onWordDrag = (word, mx, my) => {
	dragPos.x = mx;
	dragPos.y = my;
	
	setWordPos(word, dragPos.x - dragStartPos.x, dragPos.y - dragStartPos.y);
	
	for (let letter of word.letters)
		letter.tileHovering = null;
	
	let x, y;
	let overlappedTiles = [];
	let hasWild = false;
	let hasLetter = false;
	for (let tile of boardTiles) {
		tile.removeClass('word-hovering');
		tile.removeClass('invalid');
		for (let letter of word.letters) {
			x = letter.center.x + dragPos.x;
			y = letter.center.y + dragPos.y;
			if (overlapTile(tile, x, y)) {
				letter.tileHovering = tile;
				if (tile.dataset.type === 'wild')
					hasWild = true;
				overlappedTiles.push([ letter, tile ]);
			}
		}
	}
	
	dragWordValidPlacement = (overlappedTiles.length === word.letters.length);
	
	for (let [letter, tile] of overlappedTiles) {
		tile.addClass('word-hovering');
		if (doesTileHasLetter(letter, tile)) {
			if (tile.dataset.letter === letter.dataset.letter) {
				hasLetter = true;
			} else {
				dragWordValidPlacement = false;
				tile.addClass('invalid');
			}
		}
	}
	
	dragWordValidPlacement = (dragWordValidPlacement && (hasWild || hasLetter));
	
	if (!dragWordValidPlacement) {
		for (let [letter, tile] of overlappedTiles) {
			if (!doesTileHasLetter(letter, tile))
				tile.addClass('invalid');
		}
	}
};

let endWordDrag = (word) => {
	if (dragWordValidPlacement) {
		alignWithGrid(word);
	} else {
		returnToHand(word);
	}
	
	dragWord = null;
	
	for (let tile of boardTiles)
		tile.removeClass('word-hovering');
};

let wordElems = [];
let addWord = (word) => {
	let wordElem = $new('.word').element();
	wordElem.points = 0;
	wordElem.str = word;
	wordElem.letters = [];
	wordElem.order = wordsHolderElem.children.length;
	wordElem.pos = { x: 0, y: 0 };
	wordsHolderElem.append(wordElem);
	
	let totalPoints = 0;
	for (let letter of word) {
		totalPoints += LETTER_POINTS[letter] || 0;
		letter = createTile(letter);
		letter.center = { x: 0, y: 0 };
		wordElem.letters.push(letter);
		wordElem.append(letter);
	}
	wordElem.attr('data-points', totalPoints);
	
	let buttons = $new('.buttons').children(
		$new('i').class('button horizontal fad fa-arrow-alt-square-right'),
		$new('i').class('button vertical fad fa-arrow-alt-square-down')
	);
	
	wordElem.append(buttons);
	
	wordElems.push(wordElem);
};
