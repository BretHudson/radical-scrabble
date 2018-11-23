// NOTE(bret): Thanks to Ian Jones for providing a bit of the boilerplate code here from https://github.com/WITS/regretris/
const IS_TOUCH_DEVICE = !!(('ontouchstart' in window) ||
	window.DocumentTouch && document instanceof DocumentTouch);

let style = $new('style[type=text/css]').element();
let boardElem, wordsHolderElem;

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
		boardElem.append(tile);
	}
	
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

let addWord = (word) => {
	wordsHolderElem.append(word.split('').reduce((wordElem, letter) => {
		return wordElem.child(createTile(letter));
	}, $new('.word')));
};
