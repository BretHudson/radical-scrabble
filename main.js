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
	
	for (let t = 0; t < numTiles; ++t) {
		let tile = createTile();
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
	
	words.forEach(word => addWord(word));
	
	window.on('resize', resize);
	resize();
});

let createTile = (letter) => {
	return $new('.tile' + ((letter) ? '.has-letter' : '')).children(
		$new('.background'),
		$new('.letter').attr('data-letter', letter || '')
	).element();
};

let overlapTile = (tile, x, y) => {
	return (x >= tile.pos.left) && (x < tile.pos.right) && (y >= tile.pos.top) && (y < tile.pos.bottom)
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

let dragStartPos = { x: 0, y: 0 };
let dragPos = { x: 0, y: 0 };
let dragWord = null;
let beginWordDrag = (word, mx, my) => {
	word.removeClass('on-grid');
	
	dragStartPos.x = dragPos.x = mx;
	dragStartPos.y = dragPos.y = my;
	
	word.letters.forEach(letter => {
		letter.tileHovering = null;
	});
	
	window.requestAnimationFrame(() => {
		let rect = word.getBoundingClientRect();
		if (word.hasClass('rotated'))
			rect.height /= word.letters.length;
		else
			rect.width /= word.letters.length;
		word.pos.x = mx - rect.width;
		word.pos.y = my - rect.height;
		word.letters.forEach((letter, index) => {
			let xx = word.pos.x;
			let yy = word.pos.y;
			if (word.hasClass('rotated'))
				yy += (index * rect.height);
			else
				xx += (index * rect.width);
			letter.center.x = xx + (rect.width / 2) - mx;
			letter.center.y = yy + (rect.height / 2) - my;
		});
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
	
	word.letters.forEach(letter => {
		letter.tileHovering = null;
	});
	
	let x, y;
	boardTiles.forEach(tile => {
		tile.removeClass('word-hovering');
		word.letters.forEach(letter => {
			x = letter.center.x + dragPos.x;
			y = letter.center.y + dragPos.y;
			if (overlapTile(tile, x, y)) {
				letter.tileHovering = tile;
				tile.addClass('word-hovering');
			}
		});
	});
};

let endWordDrag = (word) => {
	if (snapToTile(word)) {
		word.addClass('on-grid');
		word.removeClass('drag');
	} else {
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
	
	dragWord = null;
	
	boardTiles.forEach(tile => {
		tile.removeClass('word-hovering');
	});
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
	
	word.split('').forEach(letter => {
		letter = createTile(letter);
		letter.center = { x: 0, y: 0 };
		wordElem.letters.push(letter);
		wordElem.append(letter);
	});
};
