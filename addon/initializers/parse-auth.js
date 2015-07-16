export function initialize(container, application) {
  var authObject = Ember.Object.extend({
    user: null,

    register_instance: function(instance) {
      //Here we do whatever we need to on "startup"

    },
    authenticate: function(user, onSuccess, onError) {
      onSuccess = onSuccess || function() {};
      onError = onError || function(user, error) {console.log("Error: " + error.code + " " + error.message);}

      Parse.User.logIn(user.email, user.password, {
        success: onSuccess,
        error: onError
      });
    },
    authenticate_fb: function(onSuccess, onError) {
      this.fbSuccess = onSuccess || function() {};
      this.fbError = onError || function(user, error) {console.log(error);};

      if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/)) {
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
          that.fbSuccess(user);
        },
        error: function(user, error) {
          that.fbError(user, error);
        }
      });
    },
    authenticate_fb_cordova: function() {
      var that = this;
      facebookConnectPlugin.login(['public_profile','email'],
          function(success) {
            if (success.status=='connected') {
              expiration_date = (new Date(Date.now()+success.authResponse.expiresIn*1000)).toISOString();
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
                  that.fbError(user, error);
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
            user = Parse.User.current();
            user.set("email", success.email);
            user.save();
            that.fbSuccess(success);
          }, function (error) {
            that.fbError(null, error);
          });
    },
    register: function(userNew, onSuccess, onError) {
      onSuccess = onSuccess || function() {};
      onError = onError || function(user, error) {console.log("Error: " + error.code + " " + error.message);}
      var user = new Parse.User();
      user.set("username", userNew.email);
      user.set("password", userNew.password);
      user.set("email", userNew.email);
      user.signUp(null, {
        success: onSuccess,
        error: onError
      });
    }


  });
  application.register('parse-auth:main', authObject);
  application.inject('route', 'auth', 'parse-auth:main');
  application.inject('controller', 'auth', 'parse-auth:main');
}

export default {
  name: 'parse-auth',
  initialize: initialize
};
