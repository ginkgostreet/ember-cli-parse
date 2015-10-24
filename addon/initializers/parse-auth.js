export function initialize(container, application) {
  var authObject = Ember.Object.extend({
    user: null,
    loggedIn: false,
    register_instance: function(instance) {
      //Here we do whatever we need to on "startup"
      var user = Parse.User.current();
      if (user) {
        this.set("user", user);
        this.set("loggedIn", true);
      }
    },
    auth_success: function(callback, user) {
      this.set("user", user);
      this.set("loggedIn", true);
      callback(user);
    },
    auth_error: function(callback, user, error) {
      this.set("user", null);
      this.set("loggedIn", false);
      callback(user, error);
    },
    logout: function() {
      Parse.User.logOut();
      this.set("user", null);
      this.set("loggedIn", false);
    },
    passwordReset: function(email, options) {
      Parse.User.requestPasswordReset(email, options);
    },
    authenticate: function(user, onSuccess, onError) {
      onSuccess = onSuccess || function() {};
      onError = onError || function(user, error) {console.log("Error: " + error.code + " " + error.message);}
      var that = this;
      Parse.User.logIn(user.email, user.password, {
        success: function(user) {that.auth_success(onSuccess, user);},
        error: function(user, error) {that.auth_error(onError, user, error);}
      });
    },
    authenticate_fb: function(onSuccess, onError) {
      this.fbSuccess = onSuccess || function() {};
      this.fbError = onError || function(user, error) {console.log(error);};

      if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/) && (typeof facebookConnectPlugin === "Object" || typeof facebookConnectPlugin === "object")) {
        this.authenticate_fb_cordova();
      }
      else {
        this.authenticate_fb_web();
      }
    },
    authenticate_fb_web: function() {
      var that = this;
      Parse.FacebookUtils.logIn("email", {
        success: function(user) {
          //todo: Do we need to save the email if we are using the parse?
          //The parse library should already do that.
          //this.saveFbEmail();
          that.auth_success(that.fbSuccess, user);
        },
        error: function(user, error) {
          that.auth_error(that.fbError, user, error);
        }
      });
    },
    authenticate_fb_cordova: function() {
      var that = this;
      facebookConnectPlugin.login(['public_profile','email'],
          function(success) {
            if (success.status=='connected') {
              var expiration_date = (new Date(Date.now()+success.authResponse.expiresIn*1000)).toISOString();
              var facebookAuthData = {
                "id": success.authResponse.userID+"",
                "access_token": success.authResponse.accessToken,
                "expiration_date": expiration_date
              };
              Parse.FacebookUtils.logIn(facebookAuthData, {
                success: function(user) {
                  that.saveFbEmail();
                },
                error: function(user, error) {
                  //console.log("User cancelled the Facebook login or did not fully authorize.");
                  that.auth_error(that.fbError, user, error);
                }
              });
            }
            else {
              console.log("FB Returned status not connected");
            }
          }, function(error) {
            that.fbError(null, error);
          });
    },
    saveFbEmail: function() {
      var that = this;
      facebookConnectPlugin.api("me", ["email"],
          function(success) {
            var user = Parse.User.current();
            user.set("email", success.email);
            user.save();
            that.auth_success(that.fbSuccess, user);
          }, function (error) {
            that.auth_error(that.fbError, null, error);
          });
    },
    register: function(userNew, onSuccess, onError) {
      onSuccess = onSuccess || function() {};
      onError = onError || function(user, error) {console.log("Error: " + error.code + " " + error.message);}
      var that = this;
      var user = new Parse.User();
      user.set("username", userNew.email);
      user.set("password", userNew.password);
      user.set("email", userNew.email);
      user.signUp(null, {
        success: function(user) {that.auth_success(onSuccess, user);},
        error: function(user, error) {that.auth_error(onError, user, error);}
      });
    }


  });
  application.register('service:parse-auth', authObject);
  application.inject('route', 'parseAuth', 'service:parse-auth');
  application.inject('controller', 'parseAuth', 'service:parse-auth');
  application.inject('component', 'parseAuth', 'service:parse-auth');
  application.inject('view', 'parseAuth', 'service:parse-auth');
}

export default {
  name: 'parse-auth',
  initialize: initialize
};
