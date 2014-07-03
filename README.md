See semi-explanatory blogpost at:

http://smellegantcode.wordpress.com/2014/06/25/implementing-a-minimal-social-network-in-node-with-generators-and-thunks/

Note: it requires a JSON config file in the parent directory, that is: 

    var config = require('../bitstupid-config.json');

In this it only expects to find a Janrain API key:

    config.janrain.apiKey

This is needed to handle logins.
