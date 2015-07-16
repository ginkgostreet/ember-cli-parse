import Ember from 'ember';

export function initialize(registry, application) {
    var authObject = Ember.Object.extend({
    });
    application.register('auth:main', authObject);
    application.inject('route', 'auth', 'auth:main');
    application.inject('controller', 'auth', 'auth:main');
}

export default {
    name: 'parse-auth',
    initialize: initialize
};
