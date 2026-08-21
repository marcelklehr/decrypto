var wordList;
var wakeLock = null;
var wakeLockDesired = false;

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

function setGameControlsEnabled(enabled) {
	var newGameButton = document.getElementById('newGameButton');
	var codeButton = document.getElementById('dropdownMenuButton');
	if (newGameButton) newGameButton.disabled = !enabled;
	if (codeButton) codeButton.disabled = !enabled;
}

function loadWordList(callback, errorCallback) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', 'wordlist.txt', true);
	xhr.onreadystatechange = function() {
		if (xhr.readyState === 4) {
			if (xhr.status === 200) {
				wordList = xhr.responseText.split('\n').filter(function(line) {
					return line.trim() !== '';
				});
				callback();
			} else {
				errorCallback();
			}
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

async function requestWakeLock() {
	if (!wakeLockDesired || wakeLock || !('wakeLock' in navigator)) {
		return;
	}
	try {
		wakeLock = await navigator.wakeLock.request('screen');
		wakeLock.addEventListener('release', function() {
			wakeLock = null;
		});
	} catch (err) {
		// Wake lock not granted, ignore
	}
}

function disableScreenLock() {
	wakeLockDesired = true;
	requestWakeLock();
}

async function releaseWakeLock() {
	wakeLockDesired = false;
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
				wakeLockDesired = true;
				requestWakeLock();
			} else {
				releaseWakeLock();
			}
			setFullScreenIcon();
		});
		document.addEventListener('visibilitychange', function() {
			if (document.visibilityState === 'visible' && wakeLockDesired && !wakeLock) {
				requestWakeLock();
			}
		});
		setInterval(setFullScreenIcon, 200);
	} else {
		document.getElementById('fullScreenButton').style.display = 'none';
		openModal('disableScreenLockModal');
	}
}

function initialize() {
	initFullscreen();
	setGameControlsEnabled(false);
	loadWordList(function() {
		setGameControlsEnabled(true);
		loadCode();
		var words = loadWords();
		if (words) {
			setWords(words);
		} else {
			openModal('newGameModal');
		}
	}, function() {
		alert('Failed to load the word list. Please reload the page.');
	});
}

// Modal helpers
function openModal(id) {
	var modal = document.getElementById(id);
	if (document.querySelectorAll('.modal.show').length === 0) {
		var backdrop = document.createElement('div');
		backdrop.className = 'modal-backdrop';
		backdrop.id = 'modalBackdrop';
		document.body.appendChild(backdrop);
	}
	modal.dataset.trigger = document.activeElement && document.activeElement.id ? document.activeElement.id : '';
	modal.classList.add('show');
	modal.style.display = 'block';
	modal.setAttribute('aria-hidden', 'false');
	document.body.classList.add('modal-open');
	var focusTarget = modal.querySelector('[autofocus]') ||
		modal.querySelector('.modal-footer .btn-primary') ||
		modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ||
		modal;
	focusTarget.focus();
}

function closeModal(id) {
	var modal = document.getElementById(id);
	modal.classList.remove('show');
	modal.style.display = 'none';
	modal.setAttribute('aria-hidden', 'true');
	if (document.querySelectorAll('.modal.show').length === 0) {
		var backdrop = document.getElementById('modalBackdrop');
		if (backdrop) backdrop.parentNode.removeChild(backdrop);
		document.body.classList.remove('modal-open');
	}
	var trigger = modal.dataset.trigger ? document.getElementById(modal.dataset.trigger) : null;
	if (trigger) trigger.focus();
}

document.addEventListener('keydown', function(event) {
	var modal = document.querySelector('.modal.show');
	if (!modal) return;
	if (event.key === 'Escape') {
		closeModal(modal.id);
		return;
	}
	if (event.key !== 'Tab') return;
	var focusable = Array.prototype.slice.call(
		modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
	).filter(function(el) {
		if (el.disabled) return false;
		if (el.style.display === 'none' || el.style.visibility === 'hidden') return false;
		if (typeof el.getClientRects === 'function') {
			var rects = el.getClientRects();
			if (rects && rects.length > 0) return true;
			return el.offsetWidth > 0 || el.offsetHeight > 0;
		}
		return true;
	});
	if (focusable.length === 0) return;
	var first = focusable[0];
	var last = focusable[focusable.length - 1];
	if (event.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) {
		event.preventDefault();
		last.focus();
	} else if (!event.shiftKey && (document.activeElement === last || !modal.contains(document.activeElement))) {
		event.preventDefault();
		first.focus();
	}
});

// Dropdown helper
function setDropdownExpanded(button, expanded) {
	var menu = button.parentNode.querySelector('.dropdown-menu');
	if (menu) menu.classList.toggle('show', expanded);
	button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
}

function toggleDropdown(event) {
	event.preventDefault();
	var button = event.currentTarget;
	setDropdownExpanded(button, button.getAttribute('aria-expanded') !== 'true');
}

document.addEventListener('click', function(event) {
	document.querySelectorAll('.dropdown').forEach(function(dropdown) {
		var button = dropdown.querySelector('.dropdown-toggle');
		var itemClicked = event.target.closest && event.target.closest('.dropdown-item');
		if (button && (!dropdown.contains(event.target) || itemClicked)) {
			setDropdownExpanded(button, false);
		}
	});
});
