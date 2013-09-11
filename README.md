bitstupid
=========

The ultimate in minimal personal status sharing.

Server requires a config file at ../bitstupid-config.json laid out like this:

    {
        "aws":
        {
            "accessKeyId": "XXXXXXXXXXXXXXXXXXXX",
            "secretAccessKey": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            "region": "us-west-2"
        },

        "mysql":
        {
            "host": "localhost",
            "user": "admin",
            "password": "topsecret",
            "database: "bitstupid"
        }
    }

The accessKeyId and secretAccessKey are the Amazon Web Service values.

The MySQL database needs these tables:

    CREATE TABLE `bits` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `created` datetime NOT NULL,
      `creator` int(11) NOT NULL,
      `name` varchar(50) NOT NULL,
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1;

    CREATE TABLE `users` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `name` varchar(50) NOT NULL,
      `joined` datetime NOT NULL,
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;

    CREATE TABLE `userbits` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `bit` int(11) NOT NULL,
      `user` int(11) NOT NULL,
      `state` int(11) NOT NULL,
      `changed` datetime NOT NULL,
      `added` datetime NOT NULL,
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1;

Also requires GraphicsMagick, e.g.

    brew install graphicsmagick

or

    sudo apt-get install graphicsmagick

