(function () {
    var stopwatch_var = null;

    function _isTimerActive () {
        return !!stopwatch_var;
    }

    function _clearTimerInterval () {
        if (stopwatch_var) {
            clearInterval(stopwatch_var);
            stopwatch_var = null;
        }
    }

    // storage utils
    function _saveToStorage (params, callBack) {
        chrome.storage.local.set(params, callBack || (function(){}));
    }
    function _getFromStorage (propName, callBack) {
        return chrome.storage.local.get(propName, callBack || (function(){}));
    }

    function updateUI () {
        var message = { action: "stopwatch", data: _isTimerActive() ? "started" : "stopped" };
        // update popup UI
        chrome.runtime.sendMessage(message);

        // update content UI
        chrome.tabs.query({}, function (tabs) {
            (tabs || []).forEach(function (tab) {
                chrome.tabs.sendMessage(tab.id, message);
            });
        });
    }

    function toggleUIVisible (visible) {
        _saveToStorage({ showContentUI: !!visible });

        chrome.tabs.query({}, function (tabs) {
            (tabs || []).forEach(function (tab) {
                chrome.tabs.sendMessage(tab.id, {
                    action: "stopwatch_visible_toggle", data: visible ? "visible" : "hidden"
                });
            });
        });
    }

    function _injectScript () {
        chrome.tabs.query({}, function (tabs) {
            (tabs || []).forEach(function (tab) {
                if (tab.url && tab.status !== 'unloaded' && /(http(s?)):\/\//.test(tab.url)) {
                    chrome.tabs.executeScript(tab.id, { file: 'js/content.js' });
                    chrome.tabs.insertCSS(tab.id, { file: 'css/content.css' });
                }
            });
        })
    }
    
    chrome.runtime.onInstalled.addListener(function() {
        _saveToStorage({ stopwatch: 0, showContentUI: true });
    });

    chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
        if (msg.action == "stopwatch") {
            updateUI();
        } else if (msg.action == "hideContentView") {
            toggleUIVisible(false);
        }
    });
    
    chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
        if (msg.action == "startStopwatch") {
            function stopwatch_int() {
                _getFromStorage("stopwatch", function(ret) {
                    var seconds = ret.stopwatch;
                    seconds++;
                    _saveToStorage({ stopwatch: seconds });
                    if (seconds.toString().length && seconds.toString().length <= 4) {
                        chrome.browserAction.setBadgeText({text: seconds.toString()});
                    } else { chrome.browserAction.setBadgeText({text: "2h+"}); }
                });
                sendResponse({
                    res: "message received"
                });
            }
            if (_isTimerActive()) {
                _clearTimerInterval();
            } else {
                stopwatch_var = setInterval(stopwatch_int, 1000);
            }

            updateUI();
        } else if (msg.action == "resetStopwatch") {
            _clearTimerInterval();
            _saveToStorage({ stopwatch: 0 });
            updateUI();
            chrome.browserAction.setBadgeText({text: ""});
        }
    });

    // fired when a browser action icon is clicked
    chrome.browserAction.onClicked.addListener(function () {
        toggleUIVisible(true);
    });
    
    chrome.runtime.onInstalled.addListener(function(details) {
        if (details.reason == "install") {
            _saveToStorage({ version:chrome.runtime.getManifest().version });
        }
    });
    
    _getFromStorage(['uid','version'], function(result) {
        if (!result.uid) {
            var generate_id =  String.fromCharCode(65 + Math.floor(Math.random() * 26)) + Date.now();
            window.uid = generate_id;
            _saveToStorage({ uid: generate_id });
        }
        else {
            window.uid = result.uid;
        }
    });

    _injectScript(); // inject script after install and refresh
})();
