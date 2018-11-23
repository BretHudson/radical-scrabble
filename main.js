// NOTE(bret): Thanks to Ian Jones for providing a bit of the boilerplate code here from https://github.com/WITS/regretris/
const IS_TOUCH_DEVICE = !!(('ontouchstart' in window) ||
	window.DocumentTouch && document instanceof DocumentTouch);

let style = $new('style[type=text/css]').element();
let boardElem, wordsElem;

document.on('DOMContentLoaded', (e) => {
	document.head[0].append(style);
	
	boardElem = document.q('#board');
	wordsElem = document.q('#words');
	
	let boardSize = 15;
	let numTiles = boardSize * boardSize;
	
	let boardWidth = 100, boardHalfWidth = boardWidth / 2;
	boardElem.style.width = `${boardWidth}em`;
	boardElem.style.left = `calc(50% - ${boardHalfWidth}em)`;
	
	wordsElem.style.width = `${boardWidth}em`;
	wordsElem.style.left = `calc(50% - ${boardHalfWidth}em)`;
	wordsElem.style.top = `${boardWidth}em`;
	
	let tileSize = boardWidth / boardSize;
	style.textContent = `.tile { width: ${tileSize}em; height: ${tileSize}em; }`;
	
	for (let t = 0; t < numTiles; ++t) {
		let tile =
			$new('.tile').children(
				$new('.background'),
				$new('.letter').attr('data-letter', 'a')
			);
		boardElem.append(tile);
	}
	
	const resize = () => {
		let navHeight = 5;
		let size = Math.min(
			window.innerWidth / (boardSize + 0) / tileSize,
			window.innerHeight / (navHeight + boardSize + 0) / tileSize
		);
		document.body.style.fontSize = `${size}px`;
	};
	
	window.on('resize', resize);
	resize();
});
