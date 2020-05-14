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

const boardTiles = [];

const version = '0.2.5';

const dictionary = [
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

const style = $new('style[type=text/css]').element();
let boardElem, wordsHolderElem;

Math.lerp = (a, b, t) => (b - a) * t + a;
Math.easeIn = t => t * t;
Math.easeOut = t => -t * (t - 2);
Math.easeInOut = t => (t <= .5) ? (t * t * 2) : (1 - (--t) * t * 2);

//dictionary = dictionary.slice(0, 1);
let grid;

let pointsTitleElem, pointsElem;
let totalPoints = 0;

const LETTER_POINTS = { A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10 };

let actionUndo = () => {
	// TODO(bret): Probably make sure you can't do this while something is animating
	if (playedWords.length > 0) {
		let word = playedWords.pop();
		let tile, tileHover;
		for (let l = 0; l < word.tiles.length; ++l) {
			tile = word.tiles[l];
			tileHover = tile.tileHovering;
			let stacked = +tileHover.dataset.stacked - 1;
			if (stacked === 0) {
				resetTile(tileHover, 60 * (word.tiles.length - (word.tiles.length - l)));
			}
			tileHover.dataset.stacked = stacked;
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
						/*.on('click', actionSettings)*/,
					$new('span#undo')
						.child($new('i').class('undo fad fa-undo-alt'))
						.on('click', actionUndo),
				),
				$new('.points').children(
					$new('.top').text('Points'),
					$new('.bottom').attr('data-points', '000')
				)
			)
			.element()
	);
	pointsTitleElem = headerElem.q('.points .top');
	pointsElem = headerElem.q('.points .bottom');
	
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
	
	// Render board
	let boardSize = 15;
	let numTiles = boardSize * boardSize;
	if (false) {
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
			
			const speed = 0.04;
			let delay = (x + y) * speed;
			if (className !== '')
				delay += 8 * speed;
			
			const tile = createTile(null, className);
			// TODO(bret): Remove this animation delay at some point!
			// TODO(bret): Figure out why this comment exists! :)
			tile.style.animationDelay = tile.q('.background').style.animationDelay = delay + 's';
			grid[_x][_y] = tile;
			boardTiles.push(tile);
			boardElem.append(tile);
		}
		
		for (const word of shuffle(dictionary))
			addWord(word.toUpperCase());
	}
		
	const boardWidth = 100, boardHalfWidth = boardWidth >> 1;
	const emWidth = `${boardWidth}em`;
	const emLeft = `calc(50% - ${boardHalfWidth}em)`;
	
	headerElem.style.width = footerElem.style.width = emWidth; //`${boardWidth * 2}em`;
	headerElem.style.left = footerElem.style.left = emLeft; //`calc(50% - ${boardWidth}em)`;
	
	boardElem.style.width = emWidth;
	boardElem.style.left = emLeft;
	boardElem.style.top = '12em';
	
	wordsElem.style.width = emWidth;
	wordsElem.style.height = `calc(100% - ${boardWidth}em - 18em)`;
	wordsElem.style.left = emLeft;
	wordsElem.style.top = (boardWidth + 12) + `em`;
	
	const tileSize = (boardWidth - 3) / boardSize; // NOTE(bret): for that 1.5em padding yo
	style.textContent = `.tile { width: ${tileSize}em; height: ${tileSize}em; }`;
	
	const resize = () => {
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
		
		document.body.addClass((landscape) ? 'landscape' : 'portrait');
		document.body.removeClass((landscape) ? 'portrait' : 'landscape');
		
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
	};
	
	window.on('resize', resize);
	resize();
	
	const dragBegin = (e, e2) => {
		if (e.target.hasClass('button')) {
			e.preventDefault();
			const word = e.target.parentElement.parentElement;
			if (e.target.hasClass('vertical'))
				word.toggleClass('rotated');
			beginWordDrag(word, e2.clientX, e2.clientY);
		}
	};
	
	window.on('mousedown', (e) => { dragBegin(e, e); });
	window.on('touchstart', (e) => { dragBegin(e, e.touches[0]); }, { passive: false });
	
	const dragProgress = (e, e2) => {
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
	
	const dragEnd = () => {
		if (dragWord !== null) {
			endWordDrag(dragWord);
		}
	}
	
	window.on('mouseup', dragEnd);
	window.on('touchend', dragEnd);
});

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

const createTile = (letter, className = '') => {
	const prefix = (letter) ? 'has' : 'no'
	const tile = recycledTiles.shift() || $new().children($new('.strings'), $new('.background')).element();
	
	tile.className = `tile ${className} ${prefix}-letter`;
	tile.dataset.letter = letter || '';
	tile.dataset.points = letter ? LETTER_POINTS[letter] : '';
	tile.dataset.type = className;
	
	return tile;
};

const resetTile = (tile, delay) => {
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

const overlapTile = (tile, x, y) => {
	return (x >= tile.pos.left) && (x < tile.pos.right) && (y >= tile.pos.top) && (y < tile.pos.bottom);
};

const isTileOccupied = (letter, tile) => {
	return (tile.dataset.letter !== '');
};

const setWordPos = (word, x, y, before = null, execIfNull = false) => {
	window.requestAnimationFrame(() => {
		if (before !== null) before();
		if ((execIfNull === false) && (dragWord === null)) return;
		word.style.left = word.pos.x + x + 'px';
		word.style.top = word.pos.y + y + 'px';
	});
};

const playedWords = [];
const removeWord = (word) => {
	word.remove();
	playedWords.push(word);
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
	
	word.addClass('on-grid');
	setTimeout(() => {
		let tile;
		for (let t = 0, tile = null, n = tiles.length; (t < n) && (tile = tiles[t]); ++t) {
			Transition.animate(tile, keyframesWordPlace, duration, {
				delay: t * delay
			});
			
			const delayStr = `${t * delay / 1000}s`;
			const gridTile = tile.tileHovering;
			gridTile.dataset.stacked = 1 + +(gridTile.dataset.stacked || 0);
			gridTile.firstChild.style.transitionDelay = `${delayStr}, ${delayStr}, ${delayStr}, ${delayStr}`;
			gridTile.removeClass('no-letter');
			if (word.hasClass('rotated')) {
				gridTile.addClass('vertical');
				if (t === 0)
					gridTile.addClass('top');
				if (t === word.tiles.length - 1)
					gridTile.addClass('bottom');
			} else {
				 gridTile.addClass('horizontal');
				if (t === 0)
					gridTile.addClass('left');
				if (t === word.tiles.length - 1)
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

const alignWithGrid = (word) => {
	const startPos = word.getBoundingClientRect();
	word.pos.x = word.pos.y = 0;
	const firstTile = word.tiles[0].tileHovering;
	const dx = startPos.x - firstTile.pos.x;
	const dy = startPos.y - firstTile.pos.y;
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
};

const assignToGrid = (word) => {
	let multiplier = 1;
	let points = 0;
	for (const tile of word.tiles) {
		const hoverTile = tile.tileHovering;
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
		
		hoverTile.removeClass('wild');
		hoverTile.removeClass('x-2-letter');
		hoverTile.removeClass('x-3-letter');
		hoverTile.removeClass('x-2-word');
		hoverTile.removeClass('x-3-word');
		
		hoverTile.addClass('has-letter');
	};
	
	word.points = points * multiplier;
	addPoints(word.points);
};

let transition = 0;
const addPoints = (points) => {
	let p = totalPoints;
	totalPoints += points;
	
	let timer = 0;
	const length = 0.25 * (1 + Math.log(points)); // TODO(bret): Calculate this based on # of points
	const invLength = 1 / length;
	
	const curTransition = ++transition;
	let then = performance.now();
	
	const options = ['opacity'];
	const pointsTitleSnapshot = Transition.snapshot(pointsTitleElem, options);
	// const pointsSnapshot = Transition.snapshot(pointsElem, options);
	
	// pointsElem.style.opacity = 1;
	
	// Transition.from(pointsElem, pointsSnapshot, length * 1000);
	
	// Transition.animate(tile, keyframesWordPlace, duration, {
	// 	delay: t * delay
	// });
	
	// pointsTitleElem.style.transform = `scale(0.6)`;
	pointsTitleElem.style.opacity = 0.3;
	
	let lastDigit = p;
	const updatePoints = now => {
		if (curTransition !== transition) return;
		
		const elapsed = (now - then) / 1000;
		timer += elapsed;
		then = now;
		
		if (timer < length) {
			window.requestAnimationFrame(updatePoints);
		} else {
			timer = length;
		}
		
		const t = Math.easeOut(Math.easeOut(timer * invLength));
		const _points = Math.round(Math.lerp(p, totalPoints, t));
		if (lastDigit !== _points) {
			// TODO(bret): Do something
			function random_rgba() {
			    var o = Math.round, r = Math.random, s = 255;
			    return 'rgba(' + o(r()*s) + ',' + o(r()*s) + ',' + o(r()*s) + ',' + r().toFixed(1) + ')';
			}
			// pointsElem.style.color = random_rgba();
			const size = 0.2 + Math.random() * 0.4;
			// pointsTitleElem.style.fontSize = `${0.75 - size}em`;
			// pointsElem.style.fontSize = `${0.75 + size}em`;
			pointsElem.style.transform = `scale(${1 + size})`;
			lastDigit = _points;
		}
		
		pointsElem.dataset.points = ('00' + _points).substr(-3);
		
		if (lastDigit === totalPoints) {
			// TODO(bret): Do a delay & add a Transition.js transition to the scale there
			pointsTitleElem.style.opacity = 1;
			pointsElem.style.transform = `scale(1.5)`;
			const snapshot = Transition.snapshot(pointsElem, ['transform']);
			pointsElem.style.transform = `scale(1)`;
			console.log(snapshot, pointsElem);
			Transition.from(pointsElem, snapshot, 1e3);
		}
	};
	window.requestAnimationFrame(updatePoints);
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
		word.removeClass('drag');
		word.removeClass('rotated');
	});
};

const dragStartPos = { x: 0, y: 0 };
const dragPos = { x: 0, y: 0 };
let dragWord = null;
const beginWordDrag = (word, mx, my) => {
	//word.removeClass('on-grid');
	
	dragStartPos.x = dragPos.x = mx;
	dragStartPos.y = dragPos.y = my;
	
	for (const tile of word.tiles)
		tile.tileHovering = null;
	
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
			word.addClass('drag');
		});
		dragWord = word;
	});
};

let dragWordValidPlacement = false;
const onWordDrag = (word, mx, my) => {
	dragPos.x = mx;
	dragPos.y = my;
	
	setWordPos(word, dragPos.x - dragStartPos.x, dragPos.y - dragStartPos.y);
	
	for (const tile of word.tiles)
		tile.tileHovering = null;
	
	const overlappedTiles = [];
	let x, y;
	let hasWild = false;
	for (const boardTile of boardTiles) {
		boardTile.removeClass('word-hovering');
		boardTile.removeClass('invalid');
		for (const tile of word.tiles) {
			x = tile.center.x + dragPos.x;
			y = tile.center.y + dragPos.y;
			if (overlapTile(boardTile, x, y)) {
				tile.tileHovering = boardTile;
				if (boardTile.dataset.type === 'wild')
					hasWild = true;
				overlappedTiles.push([ tile, boardTile ]);
			}
		}
	}
	
	dragWordValidPlacement = (overlappedTiles.length === word.tiles.length);
	
	let isOccupied = false;
	for (const [tile, boardTile] of overlappedTiles) {
		boardTile.addClass('word-hovering');
		if (isTileOccupied(tile, boardTile)) {
			if (boardTile.dataset.letter === tile.dataset.letter) {
				isOccupied = true;
			} else {
				dragWordValidPlacement = false;
				boardTile.addClass('invalid');
			}
		}
	}
	
	dragWordValidPlacement = (dragWordValidPlacement && (hasWild || isOccupied));
	
	if (!dragWordValidPlacement) {
		for (const [tile, boardTile] of overlappedTiles) {
			if (!isTileOccupied(tile, boardTile))
				boardTile.addClass('invalid');
		}
	}
};

const endWordDrag = (word) => {
	if (dragWordValidPlacement) {
		alignWithGrid(word);
	} else {
		returnToHand(word);
	}
	
	dragWord = null;
	
	for (const tile of boardTiles)
		tile.removeClass('word-hovering');
};

const wordElems = [];
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
};

setTimeout(() => {
	addPoints(10);
}, 1e3);
