if (Meteor.isClient) {
	Meteor.subscribe("userData");

  Accounts.ui.config({
	  passwordSignupFields: "USERNAME_ONLY"
  });

  Template.hello.user = function(){
	  return Meteor.user();
  }

  Template.hello.players = function(){
	  return Meteor.users.find({}, {sort: {"size": -1}});
  }

  Template.controls.upgrades = function(){
	  return [{name: "Chant", cost: 20, income: 1}];
  }

  //console.log(Template.controls.upgrades());

  Template.controls.events({
	  "click input.grow": function(){
		  Meteor.call("grow", 1);
	  },
	  "click input.buy": function(event){
		  var target = {};
		  var source = Template.controls.upgrades();
		  for (var i = 0; i < source.length; i++)
			  target[source[i].name] = source[i];

		  Meteor.call("install", target[event.target.id].cost, target[event.target.id].income);
	  }
  });

  Template.settings.events({
	  "submit .species-editor": function(event){
		  event.preventDefault();
		  Meteor.call("modifyField", "species", event.target.text.value);
		  event.target.text.value = "";
	  },
	  "submit .adjective-editor": function(event){
		  event.preventDefault();
		  Meteor.call("modifyField", "adjective", event.target.text.value);
		  event.target.text.value = "";
	  }
  })

	Handlebars.registerHelper('format', function(number){
    return number.toLocaleString();
  });
}

if (Meteor.isServer) {
	Meteor.startup(function(){
		// This interval fires every week (604,800,000 milliseconds) to reset every player's score-related
		// attributes. It does not affect username, password, character data, or milestones.
		Meteor.setInterval(function(){
			Meteor.users.find({}).map(function(user){
				Meteor.users.update({_id: user._id}, {$set: {"size": 6, "rate": 0}})
			});
		}, 604800000)

		// This interval fires every game tick (currently one second) and constitutes the game loop,
		// performing updates and repeating tasks.
		Meteor.setInterval(function(){
			Meteor.users.find({}).map(function(user){
				Meteor.users.update({_id: user._id}, {$inc: {"size": user.rate}})
			});
		}, 1000)
	});

	Accounts.onCreateUser(function(options,user){
		user.size = 6;
		user.rate = 0;
		return user;
	});

  Meteor.publish("userData",function(){
	  return Meteor.users.find({}, {sort: {"size":-1}});
  });
}

Meteor.methods({
	grow: function(amount) {
		Meteor.users.update({_id: this.userId}, {$inc: {"size": amount}});
	},

	// INSTALL purchases an upgrade for the current user. If the user has enough points to purchase the
	// upgrade, their score is decremented accordingly (by subtracting the cost from zero to create a
	// negative value to give to the increment command) and their income is raised by the given upgrade's
	// income value.
	install: function(cost,income) {
		if(Meteor.user().size >= cost && cost > 0)
			Meteor.users.update({_id: this.userId}, {$inc: {"rate": income, "size": (0 - cost)}});
	},

	// MODIFY FIELD modifies a given attribute for the character.
	modifyField: function(attribute, value) {
		var setModifier = { $set: {} };
		setModifier.$set[attribute] = value;
		Meteor.users.update({_id: this.userId}, setModifier);
	},
});
