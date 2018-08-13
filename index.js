/* jshint esversion:6*/

//Load env vars
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load();
}

//PG Promise
const pgp = require('pg-promise')();
pgp.pg.defaults.ssl = true;
const db = pgp(process.env.DATABASE_URL);

//Connect to PG db
// const { Pool } = require('pg');
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: true
// });

var http = require("http");
var AirbrakeClient = require('airbrake-js');

http.createServer(function (request, response) {

  // Send the HTTP header
  // HTTP Status: 200 : OK
  // Content Type: text/plain
  response.writeHead(200, {'Content-Type': 'text/plain'});

  // Send the response body as "Hello World"
  response.end('Hello World\n');
}).listen(process.env.PORT || 3000)

// Console will print the message
console.log(`Server running at port ${process.env.PORT || 3000}`);

var airbrake = new AirbrakeClient({
  projectId: process.env.AIRBRAKE_PROJECT_ID || 0,
  projectKey: process.env.AIRBRAKE_API_KEY || '';
});

//For discord
var Discord = require('discord.js'),
  fs = require('fs'),
  client = new Discord.Client();
  // config = loadJSON(__dirname + '/JSON/config.json'),
  // points = {"gryffindor":0,"ravenclaw":0,"slytherin":0,"hufflepuff":0};
  //points = loadJSON(__dirname + '/JSON/points.json');

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
  if (firstArg.startsWith(process.env.commandsBegin) && COMMANDS.hasOwnProperty('cmd_' + firstArg.replace(process.env.commandsBegin, ''))) {
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
    COMMANDS['cmd_' + firstArg.replace(process.env.commandsBegin, '')].func(args);
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
    text += process.env.commandsBegin + COMMANDS[cmd].name;
  }
  args.send(text + '.');
});

addCommand('points', async function(args) {
  var text = '';

  try {
    const points_rows = await db.any("SELECT * FROM points");
    console.log(points_rows);
    points_rows.forEach( function(row) {
      text = text + row.name + ": " + row.count + " points\n";
    });
    // success
  }
  catch(e) {
    // error
    console.log("Failed to fetch all points data." + e);
    text = 'Could not retrieve points.'
  }

  args.send(
    text
  );
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

function housePointsFunc(args) {
  const config_roles = {
      "takePoints": [
          "Staff"
      ],
      "setPoints": [
          "Staff"
      ],
      "givePoints": [
          "Staff"
      ],
      "doAllOfTheAbove": [
          "Staff"
      ]
  };

  var house = this,

  user = args.message.member,
  roles = user.roles,

  canGivePoints = false,
  canTakePoints = false,
  canSetPoints = false;

  roles.map((value, index, arr) => {
    for (let i = 0; i < config_roles.doAllOfTheAbove.length; i++) {
      //if (config.roles.doAllOfTheAbove[i] === value.name.toLowerCase()) {
      if (roles.find("name", config_roles.doAllOfTheAbove[i])) {
        canGivePoints = true;
        canTakePoints = true;
        canSetPoints = true;
      }
    }

    if (!canTakePoints) {
      for (let i = 0; i < config_roles.takePoints.length; i++) {
        //if (config.roles.takePoints[i] === value.name.toLowerCase()) {
        if (roles.find("name", config_roles.takePoints[i])) {
          canTakePoints = true;
          break;
        }
      }
    }

    if (!canGivePoints) {
      for (let i = 0; i < config_roles.givePoints.length; i++) {
        //if (config.roles.givePoints[i] === value.name.toLowerCase()) {
        if (roles.find("name", config_roles.givePoints[i])) {
          canGivePoints = true;
          break;
        }
      }
    }

    if (!canSetPoints) {
      for (let i = 0; i < config_roles.setPoints.length; i++) {
        //if (config.roles.setPoints[i] === value.name.toLowerCase()) {
         if (roles.find("name", config_roles.setPoints[i])) {
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
  }
  else if ((firstParam === 'add' || firstParam === 'increase' || firstParam === '+' || firstParam === 'give') && canGivePoints === true) {
    // Add points
    if (isNaN(args.params[1]) || args.params[1] === 'Infinity' || args.params[1] === '-Infinity') {
      args.send(' ' + args.params[1] + ' is not a number!');
    }
    else {
      var text = '';
      // Update DB with points
      db.any('update points set count = count + $2 where name = $1', [house.capitalize(), Number(args.params[1])])
      .then( () => {
        text = 'Added ' + args.params[1] + ' point(s) to ' + house.capitalize();
        console.log('PG Added ' + args.params[1] + ' point(s) to ' + house.capitalize());
        args.send(text);
      })
      .catch( error => {
        console.log("Failed give: " + house.capitalize() + " by " + args.params[1]  + " " + err);
        args.send("Failed to give" + args.params[1] + " points to " + house.capitalize() );
        done(err);
      });

        // Add new row to DB
        // if (result.rowCount == 0){
        //   db.any('insert into points (name, count) values ($1, $2)',
        //    [house.capitalize(), Number(args.params[1])], function (err, result) {
        //     console.log("Failed insert: " + house.capitalize() + " by " + args.params[1]  + " " + err);
        //     args.send("Failed to insert" + args.params[1] + " points to " + house.capitalize() );
        //     done(err);
        //   });
        //   console.log('PG Created ' + args.params[1] + ' point(s) to ' + house.capitalize());
        // }
        // console.log('PG Added ' + args.params[1] + ' point(s) to ' + house.capitalize());

      // Send to Discord
      // var text = 'Added ' + args.params[1] + ' point(s) to ' + house.capitalize();

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

      // args.send('Added ' + args.params[1] + ' point(s) to ' + house.capitalize() + '!\n' + house.capitalize() + ' has ' + get_house_points(house.capitalize()) + ' point(s) now!');
      // args.send('Added ' + args.params[1] + ' point(s) to ' + house.capitalize() + '!');

    }
  }
  else if ((firstParam === 'subtract' || firstParam === 'sub' || firstParam === 'decrease' || firstParam === '-' || firstParam === 'take') && canTakePoints === true) {
    // Subtract points
    if (isNaN(args.params[1]) || args.params[1] === 'Infinity' || args.params[1] === '-Infinity') {
      args.send(' ' + args.params[1] + ' is not a number!');
    }
    else {
      var text = '';
      // Update DB with points
      db.any('update points set count = count - $2 where name = $1', [house.capitalize(), Number(args.params[1])])
      .then( () => {
        text = 'Subtracted ' + args.params[1] + ' point(s) from ' + house.capitalize();
        console.log('PG Added ' + args.params[1] + ' point(s) to ' + house.capitalize());
        args.send(text);
      })
      .catch( error => {
        console.log("Failed take: " + house.capitalize() + " by " + args.params[1]  + " " + err);
        args.send("Failed to take" + args.params[1] + " points to " + house.capitalize() );
        done(err);
      });

      // Send to Discord
      // args.send('Subtracted ' + args.params[1] + ' point(s) from ' + house.capitalize() + '!\n' + house.capitalize() + ' has ' + points[house] + ' point(s) now!');
      // args.send('Subtracted ' + args.params[1] + ' point(s) from ' + house.capitalize() + '!');
    }
  }
  else if ((firstParam === 'set' || firstParam === 'setas') && canSetPoints === true) {
    // Set points
    if (isNaN(args.params[1]) || args.params[1] === 'Infinity' || args.params[1] === '-Infinity') {
      args.send(' ' + args.params[1] + ' is not a number!');
    }
    else {
      var text = '';
      // Update DB with points
      db.any('update points set count = $2 where name = $1', [house.capitalize(), Number(args.params[1])])
      .then( () => {
        text = 'Set ' + args.params[1] + ' point(s) to ' + house.capitalize();
        console.log('PG Set' + args.params[1] + ' point(s) to ' + house.capitalize());
        args.send(text);
      })
      .catch( error => {
        console.log("Failed set: " + house.capitalize() + " by " + args.params[1]  + " " + err);
        args.send("Failed to set" + args.params[1] + " points to " + house.capitalize() );
        done(err);
      });

        // Send to Discord
        // args.send('Set ' + house.capitalize() + " house's points to " + args.params[1] + '!\n' + house.capitalize() + ' has ' + points[house] + ' point(s) now!');
        // args.send('Set ' + args.params[1] + ' point(s) to ' + house.capitalize() + '!');
    }
  }
  else {
    args.send(`You might not be able to do that.\nUsage:\n${process.env.commandsBegin}housename add points\n${process.env.commandsBegin}housename subtract points\n${process.env.commandsBegin}housename set points\nWhere housename is the house's name (hufflepuff, slytherin, ravenclaw, gryffindor) and points is a number.`);
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