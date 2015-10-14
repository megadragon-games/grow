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
  
  console.log(Template.controls.upgrades());
  
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
}

if (Meteor.isServer) {
	Meteor.startup(function(){
		Meteor.setInterval(function(){
			Meteor.users.find({}).map(function(user){
				Meteor.users.update({_id: user._id}, {$inc: {"size": user.rate}})
			});
		}, 5000)
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
	install: function(cost,income) {
		if(Meteor.user().size >= cost && cost > 0)
			Meteor.users.update({_id: this.userId}, {$inc: {"rate": income, "size": (0 - cost)}});
	}
});