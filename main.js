// NOTE(bret): Thanks to Ian Jones for providing a bit of the boilerplate code here from https://github.com/WITS/regretris/
const IS_TOUCH_DEVICE = !!(('ontouchstart' in window) ||
	window.DocumentTouch && document instanceof DocumentTouch);

let style = $new('style[type=text/css]').element();
let boardElem, wordsHolderElem;

let boardTiles = [];

const words = [
	'awesome',
	'bad',
	'bitchin',
	'cool',
	'epic',
	'gnarly',
	'radical',
	'righteous',
	'sick',
	'tubular',
	'wicked',
];

document.on('DOMContentLoaded', (e) => {
	document.head[0].append(style);
	
	let wordsElem = document.body.appendChild($new('.words').element());
	wordsHolderElem = wordsElem.appendChild($new('.words-holder').element());
	boardElem = document.body.appendChild($new('.board').element());
	
	let boardSize = 15;
	let numTiles = boardSize * boardSize;
	
	let boardWidth = 100, boardHalfWidth = boardWidth / 2;
	boardElem.style.width = `${boardWidth}em`;
	boardElem.style.left = `calc(50% - ${boardHalfWidth}em)`;
	
	wordsElem.style.paddingTop = `${boardWidth}em`;
	wordsElem.style.width = `${boardWidth}em`;
	wordsElem.style.left = `calc(50% - ${boardHalfWidth}em)`;
	
	let tileSize = (boardWidth - 3) / boardSize; // NOTE(bret): for that 1.5em padding yo
	style.textContent = `.tile { width: ${tileSize}em; height: ${tileSize}em; }`;
	
	let centerPos = Math.floor(boardSize / 2);
	for (let t = 0; t < numTiles; ++t) {
		let x = Math.abs(centerPos - (t % boardSize));
		let y = Math.abs(centerPos - Math.floor(t / boardSize));
		let d = Math.abs(x - y);
		
		let className = '';
		if ((x === 0) && (y === 0))
			className = '.wild';
		else if (((x === 7) || (y === 7)) && (d % 7 === 0))
			className = '.premium-3-x-word';
		else if ((x === y) && (x >= 3) && (x <= 6))
			className = '.premium-2-x-word';
		else if ((d === 4) && ((x === 6) || (y === 6)))
			className = '.premium-3-x-letter';
		else if ((x === y) && (x === 2))
			className = '.premium-3-x-letter';
		else if ((d === 3) && ((x === 7) || (y === 7)))
			className = '.premium-2-x-letter';
		else if ((d === 4) && ((x === 5) || (y === 5) || (x === 4) || (y === 4)))
			className = '.premium-2-x-letter';
		else if ((x === y) && (x === 1))
			className = '.premium-2-x-letter';
		
		let tile = createTile(null, className);
		boardTiles.push(tile);
		boardElem.append(tile);
	}
	
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
		if (dragWord !== null) {
			e.preventDefault();
			console.log('what');
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
	
	const resize = () => {
		// Resize the board
		let navHeight = 5;
		let tileSize = boardWidth / boardSize;
		let size = Math.floor(Math.min(
			window.innerWidth / (boardSize) / tileSize,
			window.innerHeight / (navHeight + boardSize) / tileSize
		));
		document.body.style.fontSize = `${size}px`;
		
		// Update each tile's position
		window.requestAnimationFrame(() => {
			boardElem.q('.tile').each(tile => {
				tile.pos = tile.getBoundingClientRect();
			});
		});
	};
	
	for (let word of words)
		addWord(word);
	
	window.on('resize', resize);
	resize();
});

let createTile = (letter, className = '') => {
	return $new('.tile' + className + ((letter) ? '.has-letter' : '.no-letter')).children(
		$new('.background')
	)
	.attr('data-letter', letter || '')
	.element();
};

let overlapTile = (tile, x, y) => {
	return (x >= tile.pos.left) && (x < tile.pos.right) && (y >= tile.pos.top) && (y < tile.pos.bottom);
};

let validTile = (letter, tile) => {
	return true;
};

let setWordPos = (word, x, y, before = null, execIfNull = false) => {
	window.requestAnimationFrame(() => {
		if (before !== null) before();
		if ((execIfNull === false) && (dragWord === null)) return;
		word.style.left = word.pos.x + x + 'px';
		word.style.top = word.pos.y + y + 'px';
	});
};

let snapToTile = (word) => {
	let valid = word.letters.reduce((valid, letter) => valid & (letter.tileHovering !== null), true);
	
	if (valid) {
		word.pos.x = word.pos.y = 0;
		let firstTile = word.letters[0].tileHovering;
		setWordPos(word, firstTile.pos.x, firstTile.pos.y, null, true);
	}
	
	return valid;
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
}

let dragStartPos = { x: 0, y: 0 };
let dragPos = { x: 0, y: 0 };
let dragWord = null;
let beginWordDrag = (word, mx, my) => {
	word.removeClass('on-grid');
	
	dragStartPos.x = dragPos.x = mx;
	dragStartPos.y = dragPos.y = my;
	
	for (let letter of word.letters)
		letter.tileHovering = null;
	
	window.requestAnimationFrame(() => {
		let rect = word.getBoundingClientRect();
		if (word.hasClass('rotated'))
			rect.height /= word.letters.length;
		else
			rect.width /= word.letters.length;
		word.pos.x = mx - rect.width;
		word.pos.y = my - rect.height;
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

let onWordDrag = (word, mx, my) => {
	dragPos.x = mx;
	dragPos.y = my;
	
	setWordPos(word, dragPos.x - dragStartPos.x, dragPos.y - dragStartPos.y);
	
	for (let letter of word.letters)
		letter.tileHovering = null;
	
	let x, y;
	for (let tile of boardTiles) {
		tile.removeClass('word-hovering');
		for (let letter of word.letters) {
			x = letter.center.x + dragPos.x;
			y = letter.center.y + dragPos.y;
			if (overlapTile(tile, x, y)) {
				letter.tileHovering = tile;
				tile.addClass('word-hovering');
				if (!validTile(letter, tile)) {
					tile.addClass('invalid');
				}
			}
		}
	}
};

let endWordDrag = (word) => {
	if (snapToTile(word)) {
		word.addClass('on-grid');
		word.removeClass('drag');
	} else {
		returnToHand(word);
	}
	
	dragWord = null;
	
	for (let tile of boardTiles)
		tile.removeClass('word-hovering');
};

let addWord = (word) => {
	let wordElem =
		$new('.word')
			.child($new('.buttons').children(
				$new('.button.horizontal'),
				$new('.button.vertical')
			))
			.element();
	wordElem.letters = [];
	wordElem.order = wordsHolderElem.children.length;
	wordElem.pos = { x: 0, y: 0 };
	wordsHolderElem.append(wordElem);
	
	for (let letter of word) {
		letter = createTile(letter);
		letter.center = { x: 0, y: 0 };
		wordElem.letters.push(letter);
		wordElem.append(letter);
	}
};
