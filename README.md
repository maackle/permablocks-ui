permablocks
===========

A game/tool for designing permaculture systems out of modular components.  The most recent build can be found at http://michaeldougherty.info/permablocks

Concept and vision by Sam Smith of the [Alberta Guildhall](http://www.communitysupportedeverything.org/)

Setup
=====

If you want to play with the code, first follow these steps to set up the project.

First you'll need to first install nodejs and npm.  For Mac users, try [this](http://shapeshed.com/setting-up-nodejs-and-npm-on-mac-osx/)

Next you'll need to install [grunt](http://gruntjs.com), which I'm using to compile Sass and CoffeeScript.

    $ npm install -g grunt-cli

If you'll be adding any third-party libraries it will help to install [bower](http://bower.io) as well.

    $ npm install -g bower

Now go to the project directory (where `package.json` lives), and:

    $ npm install
    $ bower install  # if you installed bower

Once everything is downloaded and installed you should be good to go.  When you're ready, in the same directory simply use:

    $ grunt

This will fire up a development server at http://localhost:1337 and begin watching for changes to files in `src/` (Sass and CoffeeScript), which will be compiled directly into `www/`.

Contributing
============

This is still at a really early stage, and most of the work now is conceptual.  So rather than creating a pull request right away, get in touch and let's talk ideas!
