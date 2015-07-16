/* jshint node: true */
'use strict';

module.exports = {
  name: 'ember-cli-parse',
  included: function(app) {
    this._super.included(app);
    this.app.import('vendor/parse/parse.js');
  }
};
