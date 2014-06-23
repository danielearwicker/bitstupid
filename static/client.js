
var viewModel = {
    mode: ko.observable("home"),
    bit: ko.observable(""),
    activity: ko.observable([]),
    changes: ko.observable([]),
    belongsTo: ko.observable(null),
    user: ko.observable(null),
    showSignIn: ko.observable(false)
};

setInterval(function() {
    updateBit();
}, 10000);

viewModel.relativeTime = function(time) {
    return moment(time).fromNow();
};

ko.computed(function() {
    if (viewModel.user() && !viewModel.belongsTo()) {
        viewModel.belongsTo(viewModel.user());
    }
});

function updateBit() {
    if (viewModel.belongsTo()) {
        $.get('bits/' + viewModel.belongsTo().name + '?take=5').done(function(result) {
            viewModel.bit(result.state ? 1 : 0);
            viewModel.changes(result.changes.map(function(change) {
                return {
                    time: change.at,
                    info: {
                        preferredUsername: change.info.preferredUsername,
                        photo: change.info.photo,
                        url: '#' + change.by
                    }
                };
            }));
        });
        $.get('activity/' + viewModel.belongsTo().name + '?take=5').done(function(result) {
            viewModel.activity(result.activity.map(function(action) {
                return {
                    time: action.at,
                    info: {
                        preferredUsername: action.info.preferredUsername,
                        photo: action.info.photo,
                        url: '#' + action.of
                    }
                };
            }));
        });
    }
}

ko.computed(function() {
    updateBit();
});

viewModel.toggle = function() {
    if (!viewModel.user()) {
        viewModel.showSignIn(true);
        return;
    }
    $.ajax({
        type: 'POST',
        url: 'bits/' + viewModel.belongsTo().name,
        dataType: 'json',
        data: { secret: localStorage["secret"] }
    }).done(function(result) {
        viewModel.bit(result.state ? 1 : 0);
        updateBit();
    });
};

function route() {
    var hash = location.hash.substr(1);
    if (hash) {
        $.get('users/' + hash).done(function(info) {
            viewModel.belongsTo({
                name: hash,
                info: info
            });
        })
    }
}

window.onload = function() {
    route();
    ko.applyBindings(viewModel);
};

window.onhashchange = route;

viewModel.signOut = function() {
    localStorage.removeItem("secret");
    viewModel.user(null);
    location.reload();
};

var secret = localStorage["secret"];
if (secret) {
    $.get('secrets/' + secret).done(function(result) {
        viewModel.user(result);
    }).fail(function() {
        viewModel.signOut();
    });
}

function janrainWidgetOnload() {
    janrain.events.onProviderLoginToken.addHandler(function(janrainData) {  
        $.ajax({
            type: "POST",
            url: "janrain",
            data: "token=" + janrainData.token
        }).done(function(result) {
            localStorage["secret"] = result.secret;
            delete result.secret;
            viewModel.user(result);
        });
    });
}

(function() {
    if (typeof window.janrain !== 'object') window.janrain = {};
    if (typeof window.janrain.settings !== 'object') window.janrain.settings = {};
    
    janrain.settings.tokenAction = 'event';

    function isReady() { 
        janrain.ready = true; 
    };

    if (document.addEventListener) {
      document.addEventListener("DOMContentLoaded", isReady, false);
    } else {
      window.attachEvent('onload', isReady);
    }

    var e = document.createElement('script');
    e.type = 'text/javascript';
    e.id = 'janrainAuthWidget';

    if (document.location.protocol === 'https:') {
      e.src = 'https://rpxnow.com/js/lib/bitstupid/engage.js';
    } else {
      e.src = 'http://widget-cdn.rpxnow.com/js/lib/bitstupid/engage.js';
    }

    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(e, s);
})();
