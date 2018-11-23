// NOTE(bret): Thanks to Ian Jones for providing a bit of the boilerplate code here from https://github.com/WITS/regretris/
const IS_TOUCH_DEVICE = !!(('ontouchstart' in window) ||
	window.DocumentTouch && document instanceof DocumentTouch);

let style = $new('style[type=text/css]').element();
let boardElem, wordsHolderElem;

const words = [
	'awesome',
	'bad',
	/*
	'bitchin',
	'cool',
	'epic',
	'gnarly',
	'radical',
	'righteous',
	'sick',
	'tubular',
	'wicked',
	*/
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
		boardElem.append(tile);
	}
	
	window.on('mousemove', function(e) {
		if (dragWord !== null) {
			dragPos.x = e.clientX;
			dragPos.y = e.clientY;
			
			setWordPos(dragWord, dragPos.x - dragStartPos.x, dragPos.y - dragStartPos.y);
		}
	});
	
	window.on('mouseup', function(e) {
		if (dragWord !== null)
			endWordDrag(dragWord);
	});
	
	const resize = () => {
		let navHeight = 5;
		let tileSize = boardWidth / boardSize;
		let size = Math.min(
			window.innerWidth / (boardSize + 0) / tileSize,
			window.innerHeight / (navHeight + boardSize + 0) / tileSize
		);
		document.body.style.fontSize = `${size}px`;
	};
	
	words.forEach(word => addWord(word));
	
	window.on('resize', resize);
	resize();
});

let createTile = (letter) => {
	return $new('.tile' + ((letter) ? '.has-letter' : '')).children(
		$new('.background'),
		$new('.letter').attr('data-letter', letter || '')
	);
};

let setWordPos = (word, x, y, before = null) => {
	window.requestAnimationFrame(() => {
		if (before !== null) before();
		word.style.left = dragWordPos.x + x + 'px';
		word.style.top = dragWordPos.y + y + 'px';
	});
};

let dragWordPos = { x: 0, y: 0 };
let dragStartPos = { x: 0, y: 0 };
let dragPos = { x: 0, y: 0 };
let dragWord;
let beginWordDrag = (word) => {
	console.log('begin drag');
	let rect = word.getBoundingClientRect();
	dragWordPos.x = rect.left;
	dragWordPos.y = rect.top;
	window.requestAnimationFrame(() => {
		setWordPos(word, 0, 0, () => {
			document.body.append(word);
			word.addClass('drag');
		});
	});
	dragWord = word;
};

let endWordDrag = (word) => {
	console.log('end drag');
	wordsHolderElem.append(word);
	word.removeClass('drag');
	dragWord = null;
};

let addWord = (word) => {
	let wordElem =
		$new('.word')
			.on('mousedown', function(e) {
				dragStartPos.x = dragPos.x = e.clientX;
				dragStartPos.y = dragPos.y = e.clientY;
				beginWordDrag(this);
			});
	wordsHolderElem.append(word.split('').reduce((wordElem, letter) => {
		return wordElem.child(createTile(letter));
	}, wordElem));
};
