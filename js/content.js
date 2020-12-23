(function () {
    var POPUP_ID = '__stop_watch__';
    var timer = null;

    function loadFont () {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://use.fontawesome.com/releases/v5.6.1/css/all.css';
        link.integrity = 'sha384-gfdkjb5BdAXd+lj+gudLWI+BXq4IuLW5IT+brZEZsLFm++aCMlF1V92rMkPaX4PP';
        link.crossOrigin = 'anonymous';
        document.head.append(link);
    }

    function injectHtml () {
        if (document.querySelector('#' + POPUP_ID)) {
            document.querySelector('#' + POPUP_ID).remove();
        }

        var rootEl = document.createElement('div');
        rootEl.id = POPUP_ID;
        rootEl.innerHTML = `<div class="b3de_stopwatch__container b3de_stopwatch__container--hidden">
            <div role="button" class="b3de_stopwatch__close"></div>
            <div class="b3de_stopwatch__inner">
                <div class="b3de_stopwatch__time">00:00:00</div>
                <div class="b3de_stopwatch__bgroup" role="group">
                    <button type="button" class="b3de_stopwatch__btn b3de_stopwatch__btn-sp"><i class="fas fa-play"></i></button>
                    <button type="button" class="b3de_stopwatch__btn b3de_stopwatch__btn-rs"><i class="fas fa-power-off"></i></button>
                </div>
            </div>
        </div>`;
        document.body.append(rootEl);
    }

    function _getElement (selector) {
        return document.querySelector('#' + POPUP_ID + ' ' + selector);
    }

    function update () {
        chrome.storage.local.get('stopwatch', function (result) {
            var date = new Date(null);
            date.setSeconds(result.stopwatch);
            var timeString = date.toISOString().substr(11, 8);
            _getElement('.b3de_stopwatch__time').textContent = timeString;
        });
    }

    function _showPopup () {
        _getElement('.b3de_stopwatch__container').classList.remove('b3de_stopwatch__container--hidden');
    }

    function _hidePopup () {
        _getElement('.b3de_stopwatch__container').classList.add('b3de_stopwatch__container--hidden');
    }

    loadFont();
    injectHtml();

    chrome.runtime.sendMessage({ action: 'stopwatch' });
    chrome.runtime.onMessage.addListener(function (msg) {
        if (msg.action === "stopwatch") {
            var btn = _getElement('.b3de_stopwatch__btn-sp');
            if (msg.data === "stopped") {
                btn.innerHTML = '<i class="fas fa-play"></i>';
            } else {
                btn.innerHTML = '<i class="fas fa-pause"></i>';
            }
        } else if (msg.action === "stopwatch_visible_toggle") {
            if (msg.data === "visible") {
                _showPopup();
            } else {
                _hidePopup();
            }
        }
    });

    update();
    timer = setInterval(update, 1000);

    chrome.storage.local.get("showContentUI", function(res) {
        if (res.showContentUI) {
            _showPopup();
        } else {
            _hidePopup();
        }
    });

    // on click start\pause
    _getElement('.b3de_stopwatch__btn-sp').addEventListener('click', function () {
        chrome.runtime.sendMessage({ action: "startStopwatch" });
    });

    // on click reset
    _getElement('.b3de_stopwatch__btn-rs').addEventListener('click', function () {
        chrome.runtime.sendMessage({ action: "resetStopwatch" });
    });

    // on click close
    _getElement('.b3de_stopwatch__close').addEventListener('click', function () {
        chrome.runtime.sendMessage({ action: "hideContentView" });
    });

    window.onerror = function () {
        if (timer) {
            clearInterval(timer);
        }
    }
})();
