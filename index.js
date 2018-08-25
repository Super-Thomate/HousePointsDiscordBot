/* jshint esversion:6*/

//Load env vars
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load();
}

//PG Promise
const pgp = require('pg-promise')();
pgp.pg.defaults.ssl = true;
const db = pgp(process.env.DATABASE_URL);

// Airbrake config, prod only
var AirbrakeClient = require('airbrake-js');
let airbrake;
if ( process.env.ENVIRONMENT == 'production') {
  airbrake = new AirbrakeClient({
    projectId: Number(process.env.AIRBRAKE_PROJECT_ID),
    projectKey: process.env.AIRBRAKE_API_KEY
  });
  console.log('Initialized Airbrake client');
}

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

  db.none('CREATE TABLE IF NOT EXISTS "configuration"("server_id" TExT primary key,"p_log_channel" text, "p_leaderboard_post" text)')
    .then(() => {
      console.log("Created configuration table");
    })
    .catch(err => {
       console.log("Failed to created configuration table " + err);
    });

  // TODO create leaderboard in db with new db syntax
  // pg.any('create table if not exists points( \
  //   id serial primary key, \
  //   name text, \
  //   count integer default 0)', function (err, result) {
  //     done();
  //     if (err) {
  //       console.log(err);
  //       done(err);
  //     }
  //     console.log("Created Points table");
  // });
  // pg.query("insert into points (id, name, count) select 1, 'Gryffindor', 0 WHERE NOT EXISTS (SELECT name FROM points WHERE name = 'Gryffindor')",
  //   function (err, result) {
  //     done(err);
  //     console.log('PG Inserted Gryffindor row into Points')
  // });
  // pg.query("insert into points (id, name, count) select 2, 'Hufflepuff', 0 WHERE NOT EXISTS (SELECT name FROM points WHERE name = 'Hufflepuff')",
  //   function (err, result) {
  //     done(err);
  //     console.log('PG Inserted Hufflepuff row into Points')
  // });
  // pg.query("insert into points (id, name, count) select 3, 'Ravenclaw', 0 WHERE NOT EXISTS (SELECT name FROM points WHERE name = 'Ravenclaw')",
  //   function (err, result) {
  //     done(err);
  //     console.log('PG Inserted Ravenclaw row into Points')
  // });
  // pg.query("insert into points (id, name, count) select 4, 'Slytherin', 0 WHERE NOT EXISTS (SELECT name FROM points WHERE name = 'Slytherin')",
  //   function (err, result) {
  //     done(err);
  //     console.log('PG Inserted Slytherin row into Points')
  // });
});

var errHandler = function(err) {
    console.log(err);
}

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

addCommand('pointslog', async function(args) {
  var user = args.message.member,
  roles = user.roles;
  var canSetPoints = false;

  roles.map((value, index, arr) => {
    for (let i = 0; i < config_roles.doAllOfTheAbove.length; i++) {
      if (roles.find("name", config_roles.doAllOfTheAbove[i])) {
        canSetPoints = true;
      }
    }
  });

  // Reject if user has no permissions
  if (!canSetPoints) {
    args.send('You do not have permission to do that.');
    return;
  }

  db.none('INSERT INTO configuration (server_id, p_log_channel) values ($1, $2) \
    ON CONFLICT (server_id) DO UPDATE SET p_log_channel = $2', [args.guildId, args.channelId])
    .then(() => {
      console.log("Set points log channel to " + args.message.channel);
      args.send("Set points log channel to " + args.message.channel);
    })
    .catch(err => {
       console.log("Failed to set points log channel " + err);
    });
});

addCommand('pointsreset', async function(args) {
  var user = args.message.member,
  roles = user.roles;
  var canSetPoints = false;

  roles.map((value, index, arr) => {
    for (let i = 0; i < config_roles.doAllOfTheAbove.length; i++) {
      if (roles.find("name", config_roles.doAllOfTheAbove[i])) {
        canSetPoints = true;
      }
    }
  });

  // Reject if user has no permissions
  if (!canSetPoints) {
    args.send('You do not have permission to do that.');
    return;
  }

  // Check for house param
  var houseParam = args.params[0];
  if (houseParam !== undefined) {
    houseParam = houseParam.toLowerCase();
  }

  if ((houseParam === undefined) || (houseParam == 'gryffindor')) {
    db.none("UPDATE points SET count = 0 WHERE name = 'Gryffindor'")
      .then(() => {
        console.log("Reset Gryffindor points to 0.");
        args.send("Reset Gryffindor points to 0.");
      })
      .catch(err => {
         console.log("Failed to reset points Gryffindor points to 0 " + err);
      });
  }
  if ((houseParam === undefined) || (houseParam == 'hufflepuff')) {
    db.none("UPDATE points SET count = 0 WHERE name = 'Hufflepuff'")
      .then(() => {
        console.log("Reset Hufflepuff points to 0.");
        args.send("Reset Hufflepuff points to 0.");
      })
      .catch(err => {
         console.log("Failed to reset points Hufflepuff points to 0" + err);
      });
  }
  if ((houseParam === undefined) || (houseParam == 'ravenclaw')) {
    db.none("UPDATE points SET count = 0 WHERE name = 'Ravenclaw'")
      .then(() => {
        console.log("Reset Ravenclaw points to 0.");
        args.send("Reset Ravenclaw points to 0.");
      })
      .catch(err => {
         console.log("Failed to reset points Ravenclaw points to 0 " + err);
      });
  }
  if ((houseParam === undefined) || (houseParam == 'slytherin')) {
    db.none("UPDATE points SET count = 0 WHERE name = 'Slytherin'")
      .then(() => {
        console.log("Reset Slytherin points to 0.");
        args.send("Reset Slytherin points to 0.");
      })
      .catch(err => {
         console.log("Failed to reset points Slytherin points to 0 " + err);
      });
  }
});

addCommand('points', async function(args) {
  var text = '';
  var embed = new Discord.RichEmbed()
    .setTitle("Points Leaderboard")
    .setColor(0xFFFFFF)
    .setFooter("Updated at")
    .setTimestamp(new Date().toISOString());

  try {
    const points_rows = await db.any("SELECT * FROM points ORDER BY count DESC");
    for (var i = 0; i < points_rows.length; i++) {
      var row = points_rows[i];
      var subtext = `${i+1}` + ". " + row.name + ": " + row.count + " points";
      if (i == 0) {
        subtext = '**' + subtext + '**';
      }
      text = [text, subtext].join('\n');
    };
  }
  catch(e) {
    console.log("Failed to fetch all points data." + e);
    text = 'Could not retrieve points.'
  }
  embed.setDescription(text);
  console.log("text: " + text);

  var logChannel;
  await db.one('SELECT p_log_channel FROM configuration WHERE server_id = $1', args.guildId)
    .then(logChannelId => {
      if (logChannelId) {
        logChannel = args.message.guild.channels.find("id", logChannelId.p_log_channel);
        console.log("Found points log channel: " + logChannel);
      }
    })
    .catch(err => {
      console.log("Could not find points log channel " + err);
    });

  logChannel.sendEmbed(embed)
    .then(sentMessage => {
      // Remove old leaderboard message
      db.any('SELECT p_leaderboard_post FROM configuration WHERE server_id = $1', [args.guildId])
        .then(function(dataOldPostId) {
          logChannel.fetchMessage(dataOldPostId[0].p_leaderboard_post)
            .then(message => {
              if (message) {
                message.delete();
                console.log("Deleted old points leaderboard message");
              }
            })
            .catch(console.error);
        })
        .catch(err => {
           console.log("Failed retrieve old p_leaderboard_post " + err);
        });

      // Update p_leaderboard_post with new messageId
      var sentMessageId = sentMessage.id;
      console.log("sentMessageId: " + sentMessageId);
      db.none("UPDATE configuration SET p_leaderboard_post = $1 WHERE server_id = $2", [sentMessageId, args.guildId])
        .then(() => {
          console.log("Saved p_leaderboard_post to " + sentMessageId);
        })
        .catch(err => {
           console.log("Failed to save p_leaderboard_post to " + sentMessageId + err);
        });
    })
    .catch(console.error);

  args.message.delete();
  console.log('------channel ' + args.channelId + " " + typeof(args.channelId));
  console.log('------messageId ' + args.messageId + " " + typeof(args.messageId));
  console.log('------guildId ' + args.guildId + " " + typeof(args.guildId));
  return;
});

function get_house_points(house) {
  var value = 0;
  try {
    result = db.any("SELECT count FROM points WHERE name = $1", [house]);
    console.log(result);
    value = result[0].count;
    console.log("first result: " + result[0] + ", value: " + value);
  }
  catch(e) {
    console.log("Failed to fetch ${house} points." + e);
  }

  return value;
};

async function housePointsFunc(args) {
  console.log("Begin points manipulation commands");

  // Assign permissions
  var house = this,
  user = args.message.member,
  userMention = "<@!" + args.authorID + ">",
  roles = user.roles;

  var canGivePoints = false,
  canTakePoints = false,
  canSetPoints = false;

  roles.map((value, index, arr) => {
    for (let i = 0; i < config_roles.doAllOfTheAbove.length; i++) {
      if (roles.find("name", config_roles.doAllOfTheAbove[i])) {
        canGivePoints = true;
        canTakePoints = true;
        canSetPoints = true;
      }
    }

    if (!canTakePoints) {
      for (let i = 0; i < config_roles.takePoints.length; i++) {
        if (roles.find("name", config_roles.takePoints[i])) {
          canTakePoints = true;
          break;
        }
      }
    }

    if (!canGivePoints) {
      for (let i = 0; i < config_roles.givePoints.length; i++) {
        if (roles.find("name", config_roles.givePoints[i])) {
          canGivePoints = true;
          break;
        }
      }
    }

    if (!canSetPoints) {
      for (let i = 0; i < config_roles.setPoints.length; i++) {
         if (roles.find("name", config_roles.setPoints[i])) {
          canSetPoints = true;
          break;
        }
      }
    }
  });
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

  // Log channel if there is one
  var logChannel;
  await db.one('SELECT p_log_channel FROM configuration WHERE server_id = $1', args.guildId)
    .then(logChannelId => {
      if (logChannelId) {
        console.log(logChannelId);
        logChannel = args.message.guild.channels.find("id", logChannelId.p_log_channel);
        console.log("Found points log channel: " + logChannel);
      }
    })
    .catch(err => {
      console.log("Could not find points log channel " + err);
    });

  if ( ['points', 'point', 'p'].includes(firstParam) || firstParam === undefined ) {
    // args.send(house.capitalize() + ' has ' + points[house] + ' point(s)!');
  }
  else if ( (['give', 'add', 'increase', 'inc', '+'].includes(firstParam)) && canGivePoints === true ) {
    // Add points
    // Update DB with points
    db.any('update points set count = count + $2 where name = $1', [house.capitalize(), Number(args_points)])
    .then( () => {
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
      // args.send(text);
      args.message.channel.sendEmbed(embed)
        .then(sentMessage => {
          var sentMessageUrl = `https://discordapp.com/channels/${args.guildId}/${args.channelId}/${sentMessage.id}`;
          console.log("sentMessage: " + sentMessageUrl);
          embed.setDescription(embed.description + ` [#${args.message.channel.name}](${sentMessageUrl})`);
          if (logChannel) {
            logChannel.sendEmbed(embed);
          }
        })
        .catch(console.error);

      args.message.delete();
    })
    .catch( err => {
      console.log("Failed give: " + args_points + " points to " + house.capitalize() + " " + err);
      args.send("Failed to give " + args_points + " points to " + house.capitalize() );
      return;
    });

    // var new_house_points = get_house_points(house.capitalize());
    // get_house_points(house.capitalize()).then(function(data) {
    //    new_house_points = data;
    // })
    // .catch(function(error) {
    //   console.log(error);
    // });

    // db.func('get_house_points', [house.capitalize()])
    // .then(data => {
    //   console.log('DATA:', data); // print data
    //   new_house_points = data;
    // })
    // .catch(error => {
    //   console.log('ERROR:', error); // print the error;
    // });

    // text = text + '!\n' + house.capitalize() + ' has ' + new_house_points + ' point(s) now!';

    // args.send('Added ' + args_points + ' point(s) to ' + house.capitalize() + '!\n' + house.capitalize() + ' has ' + get_house_points(house.capitalize()) + ' point(s) now!');
  }
  else if ( (['take', 'subtract', 'sub', 'decrease', 'dec', '-'].includes(firstParam)) && canTakePoints === true ) {
    // Subtract points
    // Update DB with points
    db.any('update points set count = count - $2 where name = $1', [house.capitalize(), Number(args_points)])
    .then( () => {
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
      // args.send(text);
      args.message.channel.sendEmbed(embed)
        .then(sentMessage => {
          var sentMessageUrl = `https://discordapp.com/channels/${args.guildId}/${args.channelId}/${sentMessage.id}`;
          console.log("sentMessage: " + sentMessageUrl);
          embed.setDescription(embed.description + ` [#${args.message.channel.name}](${sentMessageUrl})`);
          if (logChannel) {
            logChannel.sendEmbed(embed);
          }
        })
        .catch(console.error);

      args.message.delete();
    })
    .catch( err => {
      console.log("Failed take: " + args_points + " points from " + house.capitalize() + " " + err);
      args.send("Failed to take " + args_points + " points from " + house.capitalize() );
      return;
    });

    // args.send('Subtracted ' + args_points + ' point(s) from ' + house.capitalize() + '!\n' + house.capitalize() + ' has ' + points[house] + ' point(s) now!');
  }
  else if ( (['set'].includes(firstParam)) && canSetPoints === true ) {
    // Set points
    var text = '';
    // Update DB with points
    db.any('update points set count = $2 where name = $1', [house.capitalize(), Number(args_points)])
    .then( () => {
      text = 'Set ' + house.capitalize() + ' to ' + args_points + ' point(s)' + userMention;
      console.log('LOG: ' + text + '(' + args.userTag + ')');
      args.send(text);
    })
    .catch( error => {
      console.log("Failed set: " + house.capitalize() + " to " + args_points + " points " + err);
      args.send("Failed to set" + house.capitalize() + " to " + args_points + " points" );
      done(err);
    });

      // args.send('Set ' + house.capitalize() + " house's points to " + args_points + '!\n' + house.capitalize() + ' has ' + points[house] + ' point(s) now!');
  }
  else {
    args.send(`You might not be able to do that.\nUsage:\n${process.env.PREFIX}housename add points\n${process.env.PREFIX}housename subtract points\nWhere housename is the house's name (hufflepuff, slytherin, ravenclaw, gryffindor) and points is a number.`);
  }
}

//Adds the commands with different variations.
addCommand(['gryffindor', 'gryff', 'griff', 'griffin', 'g', 'godric', 'lion', 'sword'], housePointsFunc.bind('gryffindor'));
addCommand(['ravenclaw', 'raven', 'claw', 'bird', 'rowena', 'r', 'eagle', 'diadem'], housePointsFunc.bind('ravenclaw'));
addCommand(['slytherin', 'slyther', 'slither', 'snake', 'salazar', 'pureblood', 'basilisk', 's'], housePointsFunc.bind('slytherin'));
addCommand(['hufflepuff', 'huffle', 'huff', 'badger', 'puff', 'h'], housePointsFunc.bind('hufflepuff'));


//Logs into discord
var botToken = process.env.BOT_TOKEN;
client.login(botToken);

console.log("Starting...");