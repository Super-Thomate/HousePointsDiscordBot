/* jshint esversion:6*/
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load();
}

//For discord
var Discord = require('discord.js'),
  fs = require('fs'),
  client = new Discord.Client(),
  config = loadJSON(__dirname + '/JSON/config.json'),
  points = loadJSON(__dirname + '/JSON/points.json');

//Loads a JSON file
function loadJSON(dir) {
  return JSON.parse(fs.readFileSync(dir, 'utf8'));
}

//Writes to a JSON file
function writeJSON(dir, data) {
  return fs.writeFileSync(
    dir,
    JSON.stringify(data),
    'utf8'
  );
}

client.on("ready", function() {
  console.log("logged in serving in " + client.guilds.array().length + " servers");

});
client.on("message", message => {
  console.log(message.author.username + ' : ' + message.content);
  var botName = process.env.BOT_NAME;
  if (message.author.username === botName) {
    return;
  }
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
  var firstArg = message.content.split(' ')[0];
  if (firstArg.startsWith(config.commandsBegin) && COMMANDS.hasOwnProperty('cmd_' + firstArg.replace(config.commandsBegin, ''))) {
    //probably don't need most of these, but it's for simplicity if I ever do need them.
    var args = {
      message,
      text: message.content,
      params: message.content.split(' ').slice(1),
      send: message.channel.sendMessage.bind(message.channel),
      sendFile: message.channel.sendFile.bind(message.channel),
      user: message.author,
      nick: message.author.username,
      username: message.author.username,
      avatar: message.author.avatar,
      avatarURL: message.author.avatarURL,
      isBot: message.author.bot,
      authorID: message.author.id,
      lastMessageID: message.author.lastMessageID,
      dm: message.author.send.bind(message.author),
      dmCode: message.author.sendCode.bind(message.author),
      dmEmbed: message.author.sendEmbed.bind(message.author),
      dmFile: message.author.sendFile.bind(message.author),
      dmMessage: message.author.sendMessage.bind(message.author),
    };
    COMMANDS['cmd_' + firstArg.replace(config.commandsBegin, '')].func(args);
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
    text += config.commandsBegin + COMMANDS[cmd].name;
  }
  args.send(text + '.');
});

addCommand('points', function(args) {
  var text =
    `Gryffindor : ${points.gryffindor} point(s)
Hufflepuff : ${points.hufflepuff} point(s)
Ravenclaw  : ${points.ravenclaw} point(s)
Slytherin  : ${points.slytherin} point(s)`;

  args.send(
    text
  );
});

function housePointsFunc(args) {
  var house = this,

    user = args.message.member,
    roles = user.roles,

    canGivePoints = false,
    canTakePoints = false,
    canSetPoints = false;

  roles.map((value, index, arr) => {
    for (let i = 0; i < config.roles.doAllOfTheAbove.length; i++) {
      //if (config.roles.doAllOfTheAbove[i] === value.name.toLowerCase()) {
      if (roles.find("name", config.roles.doAllOfTheAbove[i])) {
        canGivePoints = true;
        canTakePoints = true;
        canSetPoints = true;
      }
    }

    if (!canTakePoints) {
      for (let i = 0; i < config.roles.takePoints.length; i++) {
        //if (config.roles.takePoints[i] === value.name.toLowerCase()) {
        if (roles.find("name", config.roles.takePoints[i])) {
          canTakePoints = true;
          break;
        }
      }
    }

    if (!canGivePoints) {
      for (let i = 0; i < config.roles.givePoints.length; i++) {
        //if (config.roles.givePoints[i] === value.name.toLowerCase()) {
        if (roles.find("name", config.roles.givePoints[i])) {
          canGivePoints = true;
          break;
        }
      }
    }

    if (!canSetPoints) {
      for (let i = 0; i < config.roles.setPoints.length; i++) {
        //if (config.roles.setPoints[i] === value.name.toLowerCase()) {
         if (roles.find("name", config.roles.setPoints[i])) {
          canSetPoints = true;
          break;
        }
      }
    }
  });

  var firstParam = args.params[0];
  if (firstParam !== undefined) {
    if (firstParam.toLowerCase !== undefined) {
      firstParam = firstParam.toLowerCase();
    }
  }

  if (firstParam === 'points' || firstParam === 'point' || firstParam === 'p' || firstParam === undefined) {
    args.send(house.capitalize() + ' has ' + points[house] + ' point(s)!');
  } else if ((firstParam === 'add' || firstParam === 'increase' || firstParam === '+' || firstParam === 'give') && canGivePoints === true) {
    if (isNaN(args.params[1]) || args.params[1] === 'Infinity' || args.params[1] === '-Infinity') {
      args.send(' ' + args.params[1] + ' is not a number!');
    } else {
      points[house] += Number(args.params[1]);
      if (points[house] < 0) {
        points[house] = 0;
      }
      args.send('Added ' + args.params[1] + ' point(s) to ' + house.capitalize() + '!\n' + house.capitalize() + ' has ' + points[house] + ' point(s) now!');
      writeJSON(__dirname + '/JSON/points.json', points);
    }
  } else if ((firstParam === 'subtract' || firstParam === 'sub' || firstParam === 'decrease' || firstParam === '-' || firstParam === 'take') && canTakePoints === true) {
    if (isNaN(args.params[1]) || args.params[1] === 'Infinity' || args.params[1] === '-Infinity') {
      args.send(' ' + args.params[1] + ' is not a number!');
    } else {
      points[house] -= Number(args.params[1]);
      if (points[house] < 0) {
        points[house] = 0;
      }
      args.send('Subtracted ' + args.params[1] + ' point(s) from ' + house.capitalize() + '!\n' + house.capitalize() + ' has ' + points[house] + ' point(s) now!');
      writeJSON(__dirname + '/JSON/points.json', points);
    }
  } else if ((firstParam === 'set' || firstParam === 'setas') && canSetPoints === true) {
    if (isNaN(args.params[1]) || args.params[1] === 'Infinity' || args.params[1] === '-Infinity') {
      args.send(' ' + args.params[1] + ' is not a number!');
    } else {
      points[house] = Number(args.params[1]);
      if (points[house] < 0) {
        points[house] = 0;
      }
      args.send('Set ' + house.capitalize() + " house's points to " + args.params[1] + '!\n' + house.capitalize() + ' has ' + points[house] + ' point(s) now!');
      writeJSON(__dirname + '/JSON/points.json', points);
    }
  } else {
    args.send(`You might not be able to do that.\nUsage:\n${config.commandsBegin}housename add points\n${config.commandsBegin}housename subtract points\n${config.commandsBegin}housename set points\nWhere housename is the house's name (hufflepuff, slytherin, ravenclaw, gryffindor) and points is a number.`);
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