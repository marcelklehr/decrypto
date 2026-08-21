var wordList;
var wakeLock = null;

function sampleWithoutReplacement(array, n) {
	var arr = array.slice();
	var result = [];
	for (var i = 0; i < n && arr.length > 0; i++) {
		var idx = Math.floor(Math.random() * arr.length);
		result.push(arr.splice(idx, 1)[0]);
	}
	return result;
}

function sample(array, n) {
	var result = [];
	for (var i = 0; i < n; i++) {
		result.push(array[Math.floor(Math.random() * array.length)]);
	}
	return result;
}

function setCookie(name, value, days) {
	days = days || 365;
	var expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
	document.cookie = name + '=' + encodeURIComponent(JSON.stringify(value)) + '; expires=' + expires + '; path=/';
}

function getCookie(name) {
	var cookies = document.cookie.split(';');
	for (var i = 0; i < cookies.length; i++) {
		var cookie = cookies[i].trim();
		if (cookie.indexOf(name + '=') === 0) {
			try {
				return JSON.parse(decodeURIComponent(cookie.substring(name.length + 1)));
			} catch (e) {
				return null;
			}
		}
	}
	return null;
}

function removeCookie(name) {
	document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
}

function loadWordList(callback) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', 'wordlist.txt', true);
	xhr.onreadystatechange = function() {
		if (xhr.readyState === 4 && xhr.status === 200) {
			wordList = xhr.responseText.split('\n').filter(function(line) {
				return line.trim() !== '';
			});
			callback();
		}
	};
	xhr.send();
}

function pickWords(numWords) {
	return sampleWithoutReplacement(wordList, numWords);
}

function generateCode() {
	var code = sampleWithoutReplacement([1, 2, 3, 4], 3);
	setCookie('code', code);
	setCode(code);
	openModal('codeModal');
}

function setCode(code) {
	for (var idx = 0; idx < 3; idx++) {
		document.getElementById('code' + idx).textContent = code[idx];
	}
	document.getElementById('revealCodeButton').style.display = 'block';
}

function setWords(words) {
	for (var idx = 0; idx < 4; idx++) {
		document.getElementById('word' + idx).textContent = words[idx];
	}
}

function loadWords() {
	return getCookie('words');
}

function loadCode() {
	var code = getCookie('code');
	if (code) {
		setCode(code);
	} else {
		document.getElementById('revealCodeButton').style.display = 'none';
	}
}

function newGame() {
	var words = pickWords(4);
	setCookie('words', words);
	removeCookie('code');
	document.getElementById('revealCodeButton').style.display = 'none';
	return words;
}

function toggleFullScreen() {
	if (document.fullscreenElement) {
		document.exitFullscreen().catch(function() {});
	} else {
		document.documentElement.requestFullscreen().catch(function() {});
	}
	setFullScreenIcon();
}

function setFullScreenIcon() {
	var enableIcon = document.getElementById('enableFullScreen');
	var disableIcon = document.getElementById('disableFullScreen');
	if (document.fullscreenElement) {
		enableIcon.style.display = 'none';
		disableIcon.style.display = 'inline';
	} else {
		enableIcon.style.display = 'inline';
		disableIcon.style.display = 'none';
	}
}

function startNewGame() {
	setWords(newGame());
}

async function disableScreenLock() {
	if ('wakeLock' in navigator) {
		try {
			wakeLock = await navigator.wakeLock.request('screen');
		} catch (err) {
			// Wake lock not granted, ignore
		}
	}
}

async function releaseWakeLock() {
	if (wakeLock) {
		try {
			await wakeLock.release();
		} catch (err) {
			// ignore
		}
		wakeLock = null;
	}
}

function initFullscreen() {
	if (document.fullscreenEnabled) {
		document.addEventListener('fullscreenchange', function() {
			if (document.fullscreenElement) {
				disableScreenLock();
			} else {
				releaseWakeLock();
			}
			setFullScreenIcon();
		});
		setInterval(setFullScreenIcon, 200);
	} else {
		document.getElementById('fullScreenButton').style.display = 'none';
		openModal('disableScreenLockModal');
	}
}

function initialize() {
	initFullscreen();
	loadWordList(function() {
		loadCode();
		var words = loadWords();
		if (words) {
			setWords(words);
		} else {
			openModal('newGameModal');
		}
	});
}

// Modal helpers
function openModal(id) {
	var modal = document.getElementById(id);
	modal.classList.add('show');
	modal.style.display = 'block';
	document.body.classList.add('modal-open');
}

function closeModal(id) {
	var modal = document.getElementById(id);
	modal.classList.remove('show');
	modal.style.display = 'none';
	document.body.classList.remove('modal-open');
}

// Dropdown helper
function toggleDropdown(event) {
	event.preventDefault();
	var menu = document.querySelector('.dropdown-menu');
	menu.classList.toggle('show');
}

document.addEventListener('click', function(event) {
	var dropdown = document.querySelector('.dropdown');
	if (dropdown && !dropdown.contains(event.target)) {
		var menu = document.querySelector('.dropdown-menu');
		if (menu) menu.classList.remove('show');
	}
});
