/* jshint esversion:6*/

//Load env vars
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load();
}

// Sequelize
const Sequelize = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL);
sequelize.authenticate().then(() => {
  console.log('PG connection has been established successfully.');
}).catch(err => {
  console.error('Unable to connect to the database:', err);
});

// Create configuration table
const Configuration = sequelize.define('configuration', {
  server_id: { type: Sequelize.STRING },
  p_log_channel: { type: Sequelize.STRING },
  p_leaderboard_post: { type: Sequelize.STRING }
})
Configuration.sync({alter: true}).then(() => {
  console.log("TABLE CREATED: configuration");
}).catch(err => {
  console.error("FAILED TABLE CREATE: configuration " + err);
});

// Create house_point table
const HPoints = sequelize.define('house_point', {
  name: { type: Sequelize.STRING },
  server_id: { type: Sequelize.STRING },
  points: { type: Sequelize.INTEGER, defaultValue: 0 }
});
HPoints.sync({ alter: true }).then(() => {
  console.log("TABLE CREATED: house_points");
}).catch(err => {
   console.error("FAILED TABLE CREATE: house_points " + err);
});

// Airbrake config, prod only
// var AirbrakeClient = require('airbrake-js');
// let airbrake;
// if ( process.env.ENVIRONMENT == 'production') {
//   airbrake = new AirbrakeClient({
//     projectId: Number(process.env.AIRBRAKE_PROJECT_ID),
//     projectKey: process.env.AIRBRAKE_API_KEY
//   });
//   console.log('Initialized Airbrake client');
// }

const http = require('http');
const express = require('express');
const app = express();
app.get("/", (request, response) => {
  console.log(Date.now() + " Ping Received");
  response.sendStatus(200);
});
app.listen(process.env.PORT);

// role permissions. TODO move to db
const config_roles = {
  "takePoints": [
    "Staff", "Prefect"
  ],
  "setPoints": [
    "Headmaster"
  ],
  "givePoints": [
    "Staff", "Prefect"
  ],
  "doAllOfTheAbove": [
    "Headmaster"
  ]
};

//For discord
var Discord = require('discord.js'),
  fs = require('fs'),
  client = new Discord.Client();

client.on("ready", function() {
  console.log("logged in serving in " + client.guilds.array().length + " servers");
});

client.on("message", message => {
  // Ignore bots
  if(message.author.bot) return;

  console.log(message.author.username + ' : ' + message.content);

  // Ignore messages that don't start with prefix
  if(message.content.indexOf(process.env.PREFIX) !== 0) return;

  runCommand(message);
});

String.prototype.replaceAll = function(search, replacement) {
  var target = this;
  return target.replace(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), 'g'), replacement);
};
String.prototype.capitalize = function() {
  return this.slice(0, 1).toUpperCase() + this.slice(1);
}

var COMMANDS = {};

function addCommand(name, func, hide) {
  if (name.constructor === Array) {
    for (var i = 0; i < name.length; i++) {
      if (i === 0) {
        addCommand(name[i], func, false);
      } else {
        addCommand(name[i], func, true);
      }
    }
  } else {
    COMMANDS["cmd_" + name] = {
      name,
      func,
      hide: hide || false
    };
  }
}

function runCommand(message) {
  console.log("Verified bot command");
  var firstArg = message.content.split(' ')[0];
  if (firstArg.startsWith(process.env.PREFIX) && COMMANDS.hasOwnProperty('cmd_' + firstArg.replace(process.env.PREFIX, ''))) {
    //probably don't need most of these, but it's for simplicity if I ever do need them.
    processed_content = message.content.trim().replace(/\s{2,}/g, ' ');
    var args = {
      message,
      text: processed_content,
      params: processed_content.split(' ').slice(1),
      send: message.channel.sendMessage.bind(message.channel),
      sendFile: message.channel.sendFile.bind(message.channel),
      user: message.author,
      nick: message.author.nickanme,
      username: message.author.username,
      userTag: message.author.tag,
      displayName: message.member.displayName,
      avatar: message.author.avatar,
      avatarURL: message.author.avatarURL,
      isBot: message.author.bot,
      authorID: message.author.id,
      mentions: message.mentions.members,
      lastMessageID: message.author.lastMessageID,
      channelId: message.channel.id,
      messageId: message.id,
      guildId: message.guild.id,
      dm: message.author.send.bind(message.author),
      dmCode: message.author.sendCode.bind(message.author),
      dmEmbed: message.author.sendEmbed.bind(message.author),
      dmFile: message.author.sendFile.bind(message.author),
      dmMessage: message.author.sendMessage.bind(message.author),
    };
    COMMANDS['cmd_' + firstArg.replace(process.env.PREFIX, '')].func(args);
  }
}

function checkPermissions(args, permission) {
  var user = args.message.member,
  roles = user.roles;
  var targetPermission;
  const perm_list = ['doAllOfTheAbove', 'takePoints', 'givePoints', 'setPoints'];
  for(var i = 0; i < perm_list.length; i++) {
    if (permission == perm_list[i]) {
      targetPermission = perm_list[i];
    }
  }
  if (targetPermission === undefined) {
    console.log("PERMISSION NOT FOUND: " + permission);
    return false;
  }

  var allowedRoles = config_roles[targetPermission];
  console.log("Allowed roles for permission " + permission + ": " + allowedRoles);
  roles.map((value, index, arr) => {
    for (var i = 0; i < allowedRoles.length; i++) {
      if (roles.find("name", allowedRoles[i])) {
        targetPermission = true;
      }
    }
  });

  if (targetPermission === true) {
    console.log("PERMISSION ALLOWED: " + permission);
    return true;
  }
  else {
    console.log("PERMISSION DENIED: " + permission);
    return false;
  }
}

addCommand(['help', 'commands'], function(args) {
  var text = 'Commands:\n',
    first = true;
  for (let cmd in COMMANDS) {
    if (COMMANDS[cmd].hide) {
      continue;
    }
    if (!first) {
      text += ', ';
    } else {
      first = false;
    }
    text += process.env.PREFIX + COMMANDS[cmd].name;
  }
  args.send(text + '.');
});

addCommand("emojilist", async function(args) {
  // if (checkPermissions(args, "setPoints") === false) {
  //   args.send('You do not have permission to do that.');
  //   return;
  // }

  const emojiList = args.message.guild.emojis.sort();
  let text = "**Regular Emojis List**";
  let animated = "**Discord Nitro Emojis List**";
  for (var [emojiId, emoji] of emojiList) {
    if (emoji.animated) {
      animated = [animated, emoji + " :" + emoji.name + ":"].join("\n");
    }
    else {
      text = [text, emoji + " :" + emoji.name + ":"].join("\n");
    }
  }
  console.log(text);
  console.log(animated);
  args.send(text);
  args.send(animated);
  args.message.delete();
});

addCommand("pointssetup", async function(args) {
  let houses = ['gryffindor', 'hufflepuff', 'ravenclaw', 'slytherin'];
  for (var i = 0; i < houses.length; i++) {
    HPoints.findOrCreate( {where: {name: houses[i], server_id: args.guildId}} ).spread((house, created) => {
      console.log("FINDORCREATE house_points: " + house.get({plain: true}).name)
      args.send("Created house entry " + house.get({plain: true}).name + " in points table.");
    }).catch(err => {
      console.error("FAILED to findOrCreate house entry in house_points " + houses[i])
    });
  }
});

addCommand('pointslog', async function(args) {
  if (checkPermissions(args, "setPoints") === false) {
    args.send('You do not have permission to do that.');
    return;
  }

  Configuration.findOrCreate({where: {server_id: args.guildId}}).spread((server_configs, created) => {
    var old_log_channel = server_configs.p_log_channel;
    server_configs.p_log_channel = args.channelId;
    server_configs.save().then(() => {console.log("UPDATED configuration: Set points log channel to " + args.message.channel)});
    args.send("Set points log channel to " + args.message.channel);
  }).catch(err => {
    console.error("FAILED to set points log channel to " + args.message.channel);
    args.send("Unable to set points log channel to " + args.message.channel);
  });
});

addCommand('pointsreset', async function(args) {
  if (checkPermissions(args, "setPoints") === false) {
    args.send('You do not have permission to do that.');
    return;
  }

  // Check for house param
  let housesList = ['gryffindor', 'hufflepuff', 'ravenclaw', 'slytherin']; // Go through all houses unless specified
  var houseParam = args.params[0];
  if (houseParam !== undefined) {
    houseParam = houseParam.toLowerCase();
    housesList = [houseParam];
  }

  for (var i = 0; i < housesList.length; i++) {
    HPoints.findOne( {where: {name: housesList[i]} } )
    .then((house) => {
      house.points = 0;
      house.save().then(() => {
        console.log(`Reset ${housesList[i]} points to 0.`);
        args.send(`Reset ${housesList[i]} points to 0.`);
      });
    }).catch(err => {
       console.error(`Failed to reset points ${housesList[i]} points to 0: ` + err);
    });
  }
});

addCommand('points', async function(args) {
  await postLeaderboard(args)
  args.message.delete();
});

async function postLeaderboard(args) {
  // Get log channel
  let logChannel;
  let server_config = await Configuration.findOne( {where: {server_id: args.guildId}} );
  if (server_config.p_log_channel) {
    logChannel = args.message.guild.channels.find("id", server_config.p_log_channel);
    console.log("Found points log channel: " + logChannel);
  }

  // Set up embed
  var text = '';
  var embed = new Discord.RichEmbed()
    .setTitle("Points Leaderboard")
    .setColor(0xFFFFFF)
    .setFooter("Updated at")
    .setTimestamp(new Date().toISOString());

  let pointRows = await HPoints.findAll({ order: [ ['points', 'DESC'] ], raw: true });

  // Create leaderboard text
  for (var i = 0; i < pointRows.length; i++) {
    var row = pointRows[i];
    var subtext = `${i+1}` + ". " + row.name.capitalize() + ": " + row.points + " points";
    if (i == 0) {
      subtext = '**' + subtext + '**';
    }
    text = [text, subtext].join('\n');
  };
  embed.setDescription(text);
  console.log("text: " + text);

  logChannel.sendEmbed(embed)
  .then(sentMessage => {
    // Remove old leaderboard message
    let oldPostId = server_config.p_leaderboard_post;
    if (oldPostId) {
      console.log("Found points old leaderboard post: " + oldPostId);
      logChannel.fetchMessage(oldPostId)
      .then(message => {
        if (message) {
          message.delete();
          console.log("Deleted old points leaderboard message");
        }
      })
      .catch(console.error);
    }

    // Update p_leaderboard_post with new messageId
    var sentMessageId = sentMessage.id;
    console.log("sentMessageId: " + sentMessageId);
    server_config.p_leaderboard_post = sentMessageId;
    server_config.save().then(() => {
      console.log("Saved p_leaderboard_post to " + sentMessageId);
    }).catch(err => {
      console.log("Failed to save p_leaderboard_post to " + sentMessageId + err);
    });

  })
  .catch(console.error);
};

async function housePointsFunc(args) {
  console.log("Begin points manipulation commands");

  var house = this,
  user = args.message.member,
  userMention = "<@!" + args.authorID + ">";

  // Assign permissions
  var canGivePoints = checkPermissions(args, "givePoints"),
  canTakePoints = checkPermissions(args, "takePoints"),
  canSetPoints = checkPermissions(args, "setPoints");
  console.log("Verified roles permission");

  // Reject if user has no permissions
  if (!(canGivePoints || canTakePoints || canSetPoints)) {
    args.send('You do not have permission to do that.');
    return;
  }

  // Save first param as command name
  var firstParam = args.params[0];
  if (firstParam !== undefined) {
    if (firstParam.toLowerCase !== undefined) {
      firstParam = firstParam.toLowerCase();
    }
  }
  console.log("Command: " + firstParam + ", Params: " + args.params);

  // Check second param is a number
  let args_points = Number(args.params[1]);
  if ( isNaN(args_points) ){
    args.send(args.params[1] + ' is not a number!');
    console.log(args.params[1] + ' is not a number!');
    return;
  }
  else if ( !Number.isInteger(args_points) ) {
    args.send('Point values must be an integer.');
    console.log('Point values must be an integer.');
    return;
  }
  else if (args_points <= 0 || args_points > 100) {
    args.send('Point value must be between 1 to 100.');
    return;
  }
  else {
    args_points = Number(args_points);
  }

  // Setup user from param's mention if possible
  var targetUser = args.mentions.first();
  var targetUserMention;
  if (targetUser !== undefined) {
    targetUserMention = "<@!" + targetUser.id + ">";
  }

  // Save reason param
  let args_reason;
  if ( targetUser && args.params[2].startsWith('<@') && args.params[2].endsWith('>') ){
    // Ignore mentions in reason param
    args_reason = args.params.slice(3).join(" ");
  }
  else {
    // Not directed at a particular user
    targetUser = undefined; // Needs to be set if no user param but there is a mention in reason
    args_reason = args.params.slice(2).join(" ");
  }
  if (!args_reason) {
    args.send('Please include a reason.');
    return;
  }
  console.log("Mentions: " + targetUser);
  console.log("Reason: " + args_reason);

  // Get log channel if there is one
  let logChannel;
  let server_config = await Configuration.findOne( {where: {server_id: args.guildId}} );
  if (server_config.p_log_channel) {
    logChannel = args.message.guild.channels.find("id", server_config.p_log_channel);
    console.log("Found points log channel: " + logChannel);
  }

  if ( ['points', 'point', 'p'].includes(firstParam) || firstParam === undefined ) {
    // args.send(house.capitalize() + ' has ' + points[house] + ' point(s)!');
  }
  else if ( (['give', 'add', 'increase', 'inc', '+'].includes(firstParam)) && canGivePoints === true ) {
    // Add points
    // Update DB with points
    let housePoints = await HPoints.findOne( {where: {name: house}} );
    housePoints.points = housePoints.points + args_points;
    housePoints.save()
    .then( () => {
      console.log("Added to " + house + ": " + args_points + " points" );
    } ).catch(err => {
      console.error("Failed give: " + args_points + " points to " + house.capitalize() + " " + err);
      args.send("Failed to give " + args_points + " points to " + house.capitalize() );
      return;
    });

    var text = '';
    var embed = new Discord.RichEmbed()
      .setFooter(`Rewarded by: ${args.displayName}`, 'https://i.imgur.com/Ur1VL2r.png');

    var description = "";
    if ( targetUser === undefined ) {
      text = 'Earned ' + args_points + ' points for ' + house.capitalize() + ' from ' + userMention + '.';
    }
    else {
      text = targetUserMention + ' earned ' + args_points + ' points for ' + house.capitalize() + ' from ' + userMention + '.';
      description = [description, 'Earned by ' + targetUserMention + '.'].join(' ');
    }
    if ( args_reason ) {
      text = text + ' *Reason: ' + args_reason + '*';
      description = [description, 'Reason: ' + args_reason].join(' ');
    }
    embed.setDescription(description);

    var authorName = args_points + ' points for ' + house.capitalize();
    switch(house.capitalize()) {
      case 'Gryffindor':
        embed.setAuthor(authorName, 'https://i.imgur.com/ds8VV2l.png').setColor(0xEA0000);
        break;
      case 'Hufflepuff':
        embed.setAuthor(authorName, 'https://i.imgur.com/sB4KbDn.png').setColor(0xFFE500);
        break;
      case 'Ravenclaw':
        embed.setAuthor(authorName, 'https://i.imgur.com/un87c3p.png').setColor(0x2362AF);
        break;
      case 'Slytherin':
        embed.setAuthor(authorName, 'https://i.imgur.com/idnZ3xJ.png').setColor(0x047A00);
        break;
    }

    console.log(text);
    await args.message.channel.sendEmbed(embed)
    .then(sentMessage => {
      if (logChannel) {
        var sentMessageUrl = `https://discordapp.com/channels/${args.guildId}/${args.channelId}/${sentMessage.id}`;
        embed.setDescription(embed.description + ` [#${args.message.channel.name}](${sentMessageUrl})`);
        logChannel.sendEmbed(embed);
      }
    })
    .catch(err => {
      console.error("Failed to send embed: " + err);
    });

    args.message.delete();

    await postLeaderboard(args);
  }
  else if ( (['take', 'subtract', 'sub', 'decrease', 'dec', '-'].includes(firstParam)) && canTakePoints === true ) {
    // Subtract points
    // Update DB with points
    let housePoints = await HPoints.findOne( {where: {name: house}} );
    housePoints.points = housePoints.points - args_points;
    housePoints.save()
    .then( () => {
      console.log("Subtracted from " + house + ": " + args_points + " points" );
    } ).catch(err => {
      console.error("Failed take: " + args_points + " points from " + house.capitalize() + " " + err);
      args.send("Failed to take " + args_points + " points from " + house.capitalize() );
      return;
    });

    var text = '';
    var embed = new Discord.RichEmbed()
      .setFooter(`Taken by: ${args.displayName}`, 'https://i.imgur.com/jM0Myc5.png');

    var description = "";
    if ( targetUser === undefined ) {
      text = 'Lost ' + args_points + ' point(s) from ' + house.capitalize() + ' from ' + userMention + '.';
    }
    else {
      text = targetUserMention + ' lost ' + args_points + ' point(s) from ' + house.capitalize() + ' from ' + userMention + '.';
      description = [description, 'Lost by ' + targetUserMention + '.'].join(' ');
    }
    if ( args_reason ) {
      text = text + ' *Reason: ' + args_reason + '*';
      description = [description, 'Reason: ' + args_reason].join(' ');
    }
    embed.setDescription(description);

    var authorName = args_points + ' points from ' + house.capitalize();
    switch(house.capitalize()) {
      case 'Gryffindor':
        embed.setAuthor(authorName, 'https://i.imgur.com/ds8VV2l.png').setColor(0xEA0000);
        break;
      case 'Hufflepuff':
        embed.setAuthor(authorName, 'https://i.imgur.com/sB4KbDn.png').setColor(0xFFE500);
        break;
      case 'Ravenclaw':
        embed.setAuthor(authorName, 'https://i.imgur.com/un87c3p.png').setColor(0x2362AF);
        break;
      case 'Slytherin':
        embed.setAuthor(authorName, 'https://i.imgur.com/idnZ3xJ.png').setColor(0x047A00);
        break;
    }

    console.log(text);
    await args.message.channel.sendEmbed(embed)
    .then(sentMessage => {
      var sentMessageUrl = `https://discordapp.com/channels/${args.guildId}/${args.channelId}/${sentMessage.id}`;
      console.log("sentMessage: " + sentMessageUrl);
      embed.setDescription(embed.description + ` [#${args.message.channel.name}](${sentMessageUrl})`);
      if (logChannel) {
        logChannel.sendEmbed(embed);
      }
    })
    .catch(err => {
    console.error("Failed to send embed: " + err);
    });

    args.message.delete();

    await postLeaderboard(args);
  }
  else if ( (['set'].includes(firstParam)) && canSetPoints === true ) {
    // Set points
    args.send("This command is not currently available.");
  }
  else {
    args.send(`You might not be able to do that.\nUsage:\n${process.env.PREFIX}housename add points\n${process.env.PREFIX}housename subtract points\nWhere housename is the house's name (hufflepuff, slytherin, ravenclaw, gryffindor) and points is a number.`);
  }
}

//Adds the commands with different variations.
addCommand(['gryffindor', 'g', 'gryff'], housePointsFunc.bind('gryffindor'));
addCommand(['ravenclaw', 'r', 'raven', 'claw'], housePointsFunc.bind('ravenclaw'));
addCommand(['slytherin', 's', 'slyther'], housePointsFunc.bind('slytherin'));
addCommand(['hufflepuff', 'h', 'huffle', 'huff', 'puff'], housePointsFunc.bind('hufflepuff'));


//Logs into discord
var botToken = process.env.BOT_TOKEN;
client.login(botToken);

console.log("Starting...");