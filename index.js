//Load env vars
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load();
}
const fs                     = require('fs') ;
const Sequelize              = exports.Sequelize = require ('sequelize') ;
const Op                     = Sequelize.Op ;
const sequelize              = new Sequelize(process.env.MYSQL_URL) ;
sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  }) ;
//For discord
var   Discord                = require ('discord.js')
    , client                 = new Discord.Client () ;

// Create configuration table
const Configuration = sequelize.define('configuration', {
              server_id: {type: Sequelize.STRING}
  ,       p_log_channel: {type: Sequelize.STRING}
  ,  p_leaderboard_post: {type: Sequelize.STRING}
  ,          max_points: {type: Sequelize.INTEGER, defaultValue: 100}
  ,          min_points: {type: Sequelize.INTEGER, defaultValue: 1}
})
Configuration.sync({alter: true}).then(() => {
  console.log("TABLE CREATED: configuration");
}).catch(err => {
  console.error("FAILED TABLE CREATE: configuration " + err);
}) ;

// Create house_point table
const HPoints = sequelize.define('house_point', {
         name: { type: Sequelize.STRING }
  , server_id: { type: Sequelize.STRING }
  ,    points: { type: Sequelize.INTEGER, defaultValue: 0 }
}) ;
HPoints.sync({ alter: true }).then(() => {
  console.log("TABLE CREATED: house_points");
}).catch(err => {
   console.error("FAILED TABLE CREATE: house_points " + err);
}) ;

// Create houses table
const Houses = sequelize.define('houses', {
         name: { type: Sequelize.STRING }
  , server_id: { type: Sequelize.STRING }
  ,      icon: { type: Sequelize.STRING, defaultValue: "" }
  ,     color: { type: Sequelize.STRING, defaultValue: "0x000000" }
  ,   aliases: { type: Sequelize.STRING, defaultValue: "[]" }
}) ;
Houses.sync({ alter: true }).then(() => {
  console.log("TABLE CREATED: houses");
}).catch(err => {
  console.error("FAILED TABLE CREATE: houses " + err);
}) ;
// Is this still relevant ?
/*
const http = require('http');
const express = require('express');
const app = express();
app.get("/", (request, response) => {
  console.log(""+Date.now() + " Ping Received");
  response.sendStatus(200);
});
app.listen(process.env.PORT);
*/
// TODO
//  |- Move Roles  to db
const config_roles           = loadJSON ("./JSON/roles.json");
var allHouses                = new Array () ;
Houses.findAll ()
.then ((houses) => {
  for (let n = 0 ; n < houses.length; n++) {
    var house                = houses [n] ;
    let houseName            = house.get ({plain: true}).name.toLowerCase () ;
    let aliases              = JSON.parse (house.get ().aliases) ;
    allHouses       [allHouses.length] = houseName ;
    console.log ("--------------------------------------------------------") ;
    console.log (houseName, aliases) ;
    console.log ("--------------------------------------------------------") ;
    addCommand (aliases, housePointsFunc.bind (houseName)) ;
  }
})
.catch(err => {
  console.error ("FAILED to load houses " + err)
}) ;
// const MyHouses               = loadJSON ("./JSON/houses.json") ;

//Loads a JSON file
function loadJSON (dir) {
    return JSON.parse(fs.readFileSync(dir, 'utf8'));
}
//Writes to a JSON file
function writeJSON (dir, data) {
    return fs.writeFileSync (
                                dir
                              , JSON.stringify (data)
                              , 'utf8'
                            ) ;
}

client.on ("ready", () => {
  console.log("logged in serving in " + client.guilds.array().length + " servers");
});

client.on ("message", (message) => {
  // Ignore bots
  if(message.author.bot)
    return ;
  console.log(message.author.username + ' : ' + message.content);
  var galt = /bendor/i ;
  if (galt.test(message.content))
    message.content = "bendor" ;
  // Ignore messages that don't start with prefix
  if(message.content.indexOf(process.env.PREFIX) !== 0 && message.content != "bendor")
    return ;

  runCommand (message) ;
}) ;

client.on ("error", (err) => {
  console.error("An error occurred. The error was: "+err) ;
}) ;

String.prototype.replaceAll = function (search, replacement) {
  var target                 = this;
  return target.replace(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), 'g'), replacement);
};
String.prototype.capitalize = function () {
  return this.slice(0, 1).toUpperCase() + this.slice(1);
}

var COMMANDS = {} ;

function addCommand (name, func, hide) {
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

function runCommand (message) {
  console.log("Verified bot command");
  var firstArg = message.content.split(' ')[0];
  if (   (   firstArg.startsWith(process.env.PREFIX)
          && COMMANDS.hasOwnProperty('cmd_' + firstArg.replace(process.env.PREFIX, ''))
         )
      || firstArg == "bendor"
     ) {
    //probably don't need most of these, but it's for simplicity if I ever do need them.
    var processed_content = message.content.trim().replace(/\s{2,}/g, ' ');
    var args                 = 
      {
                message
        ,          text: processed_content
        ,        params: processed_content.split(' ').slice(1)
        ,          send: message.channel.sendMessage.bind(message.channel)
        ,      sendFile: message.channel.sendFile.bind(message.channel)
        ,          user: message.author
        ,          nick: message.author.nickanme
        ,      username: message.author.username
        ,       userTag: message.author.tag
        ,   displayName: message.member.displayName
        ,        avatar: message.author.avatar
        ,     avatarURL: message.author.avatarURL
        ,         isBot: message.author.bot
        ,      authorID: message.author.id
        ,      mentions: message.mentions.members
        , lastMessageID: message.author.lastMessageID
        ,     channelId: message.channel.id
        ,     messageId: message.id
        ,       guildId: message.guild.id
        ,            dm: message.author.send.bind(message.author)
        ,        dmCode: message.author.sendCode.bind(message.author)
        ,       dmEmbed: message.author.send.bind(message.author)
        ,        dmFile: message.author.sendFile.bind(message.author)
        ,     dmMessage: message.author.sendMessage.bind(message.author)
      } ;
    COMMANDS ['cmd_' + firstArg.replace(process.env.PREFIX, '')].func(args);
  }
}

function checkPermissions (args, permission) {
  var   user                 = args.message.member
      , roles                = user.roles
      , targetPermission     = ""
      ;
  const perm_list = [   'doAllOfTheAbove'
                      , 'takePoints'
                      , 'givePoints'
                      , 'setPoints'
                      , 'addHouse'
                    ] ;
  for (var i = 0 ; i < perm_list.length ; i++) {
    if (permission == perm_list [i]) {
      targetPermission       = perm_list [i] ;
    }
  }
  if (! targetPermission.length) {
    console.log("PERMISSION NOT FOUND: " + permission);
    return false;
  }
  var allowedRoles           = config_roles [targetPermission] ;
  console.log("Allowed roles for permission " + permission + ": " + allowedRoles);
  for (var [key, value] of roles) {
    if (allowedRoles.includes(value.name)) {
      console.log("PERMISSION ALLOWED: " + permission);
      return true ;
    }
  }
  console.log("PERMISSION DENIED: " + permission);
  return false ;
}

addCommand ("commands", function (args) {
  var   text                 = 'Commands:\n'
      , first                = true
      ;
  for (let cmd in COMMANDS) {
    if (COMMANDS[cmd].hide) {
      continue ;
    }
    if (! first) {
      text                  += ', ' ;
    } else {
      first                  = false ;
    }
    text                    += process.env.PREFIX + COMMANDS[cmd].name ;
  }
  args.send(text + '.') ;
});

addCommand ("pointssetup", async function (args) {
  if (    ! checkPermissions (args, "doAllOfTheAbove")
     ) {
    args.send('You do not have permission to do that.');
    return;
  }
  if (! allHouses.length) {
    args.send ("No house define in base => use /addhouse <housename> to add houses.") ;
    return ;
  }
  for (var i = 0; i < allHouses.length; i++) {
    HPoints
      .findOrCreate ( {where: {name: allHouses [i], server_id: args.guildId}} )
      .spread ((house, created) => {
        console.log ("FINDORCREATE house_points: " + house.get({plain: true}).name)
        args.send ("Created house entry " + house.get({plain: true}).name + " in points table.");
      })
      .catch (err => {
        console.error("FAILED to findOrCreate house entry in house_points " + allHouses [i])
      })
  }
});

addCommand ('pointslog', async function (args) {
  if (   ! checkPermissions(args, "doAllOfTheAbove")
     ) {
    args.send('You do not have permission to do that.');
    return ;
  }

  Configuration
  .findOrCreate ({where: {server_id: args.guildId}})
  .spread ((server_configs, created) => {
    var old_log_channel      = server_configs.p_log_channel;
    server_configs.p_log_channel       = args.channelId ;
    server_configs
      .save()
      .then( () => {console.log("UPDATED configuration: Set points log channel to " + args.message.channel)})
    ;
    args.send("Set points log channel to " + args.message.channel);
  })
  .catch(err => {
    console.error("FAILED to set points log channel to " + args.message.channel);
    args.send("Unable to set points log channel to " + args.message.channel);
  })
  ;
});

addCommand ('pointsreset', async function (args) {
  if (   ! checkPermissions(args, "setPoints")
      && ! checkPermissions(args, "doAllOfTheAbove")
     ) {
    args.send('You do not have permission to do that.');
    return;
  }
  for (var i = 0; i < allHouses.length; i++) {
    HPoints
     .findOne ( {where: {name: allHouses [i]} } )
     .then ((house) => {
       house.points          = 0;
       house
         .save ()
         .then (() => {
           console.log (`Reset ${allHouses [i]} points to 0.`) ;
           args.send (`Reset ${allHouses [i]} points to 0.`) ;
         })
         ;
     })
     .catch (err => {
        console.error(`Failed to reset points ${allHouses [i]} points to 0: ` + err);
     })
     ;
  }
});

addCommand ('points', async function(args) {
  await postLeaderboard (args) ;
  args.message.delete () ;
});

async function postLeaderboard (args) {
  // Get log channel
  let logChannel             = false ;
  let server_config          = await Configuration.findOne( {where: {server_id: args.guildId}} );
  if (server_config.p_log_channel) {
    logChannel              = args.message.guild.channels.find("id", server_config.p_log_channel);
    console.log("Found points log channel: " + logChannel);
  }

  // Set up embed
  var text                   = '';
  var embed                  =
    new Discord.RichEmbed()
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

  if (logChannel) {
     logChannel.send(embed)
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
  }
};

async function housePointsFunc (args) {
  console.log("Begin points manipulation commands");
  var house = this,
  user = args.message.member,
  userMention = "<@!" + args.authorID + ">";

  // Assign permissions
  var 
        canGivePoints = checkPermissions (args, "givePoints") || checkPermissions (args, "doAllOfTheAbove")
      , canTakePoints = checkPermissions (args, "takePoints") || checkPermissions (args, "doAllOfTheAbove")
      , canSetPoints  = checkPermissions  (args, "setPoints") || checkPermissions (args, "doAllOfTheAbove")
      ;
  console.log("Verified roles permission");

  // Reject if user has no permissions
  if (!(canGivePoints || canTakePoints || canSetPoints)) {
    args.send('You do not have permission to do that.');
    return;
  }
  var server_config = await Configuration.findOne( {where: {server_id: args.guildId}} );
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
  if (      isNaN(args_points)
       && ! Number.isInteger(args_points)
      ) {
    args.send('Point values must be an integer.');
    console.log(' Point values must be an integer.');
    return;
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
  let logChannel;
  try {
   // Get log channel if there is one
    if (server_config.p_log_channel) {
      logChannel = args.message.guild.channels.find("id", server_config.p_log_channel);
      console.log("Found points log channel: " + logChannel);
    }
  } catch (e) {
    console.error ("Error on line 450 : ",e) ;
  }
  if ( ['points', 'point', 'p'].includes(firstParam) || firstParam === undefined ) {
    // args.send(house.capitalize() + ' has ' + points[house] + ' point(s)!');
  }
  else if ( (['give', 'add', 'increase', 'inc', '+'].includes(firstParam)) && canGivePoints === true ) {
    if (    args_points < server_config.min_points
        || args_points > server_config.max_points
      ) {
      args.send (   'Point value must be between '+server_config.min_points+
                    ' to '+server_config.max_points+'.'
                ) ;
      return;
    }
    try {
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
    } catch (e) {
      console.error ("Error on line 470 : ", e) ;
    }

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
    
    await Houses.findOne ({where:{name:house.toLowerCase()}})
    .then ( (house) => {
      embed.setAuthor(authorName, house.get().icon).setColor(house.get().color);
    })
    .catch (err => {
      console.error("FAILED to findOne house entry in houses " + err)
    }) ;
    console.log(text);
    await args.message.channel.send(embed)
    .then(sentMessage => {
      if (logChannel) {
        var sentMessageUrl = `https://discordapp.com/channels/${args.guildId}/${args.channelId}/${sentMessage.id}`;
        embed.setDescription(embed.description + ` [#${args.message.channel.name}](${sentMessageUrl})`);
        logChannel.send(embed);
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
    if (    args_points < server_config.min_points
         || args_points > server_config.max_points
       ) {
      args.send (   'Point value must be between '+server_config.min_points+
                    ' to '+server_config.max_points+'.'
                ) ;
      return;
    }
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
    await Houses.findOne ({where:{name:house.toLowerCase()}})
    .then ( (house) => {
      embed.setAuthor(authorName, house.get().icon).setColor(house.get().color);
    })
    .catch (err => {
      console.error("FAILED to findOne house entry in houses " + err)
    }) ;
    console.log(text);
    await args.message.channel.send(embed)
    .then(sentMessage => {
      var sentMessageUrl = `https://discordapp.com/channels/${args.guildId}/${args.channelId}/${sentMessage.id}`;
      console.log("sentMessage: " + sentMessageUrl);
      embed.setDescription(embed.description + ` [#${args.message.channel.name}](${sentMessageUrl})`);
      if (logChannel) {
        logChannel.send(embed);
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
    // Set points
    // Update DB with points
    let housePoints = await HPoints.findOne( {where: {name: house}} );
    housePoints.points = args_points;
    housePoints
      .save()
      .then ( () => {
        console.log("Set " + house + " points to: " + args_points + " points" );
      } )
      .catch (err => {
        console.error("Failed to set "+house.capitalize()+" points to "+args_points+" "+err) ;
        args.send("Failed to set "+house.capitalize()+" points to "+args_points) ;
        return;
      })
      ;

    var embed = new Discord.RichEmbed()
      .setFooter(`Set by: ${args.displayName}`, 'https://i.imgur.com/Ur1VL2r.png');

    var description = "";
    text                     = 
              "Set points for "+ house.capitalize()+
              " to "+args_points+
              "" ;
    description             += text ;
    if ( args_reason ) {
      text = text + ' *Reason: ' + args_reason + '*';
      description = [description, 'Reason: ' + args_reason].join(' ');
    }
    embed.setDescription(description);

    var authorName = 'Set points for ' + house.capitalize();
    
    await Houses.findOne ({where:{name:house.toLowerCase()}})
    .then ( (house) => {
      embed.setAuthor(authorName, house.get().icon).setColor(house.get().color);
    })
    .catch (err => {
      console.error("FAILED to findOne house entry in houses " + err)
    }) ;
    console.log(text);
    await args.message.channel.send(embed)
    .then(sentMessage => {
      if (logChannel) {
        var sentMessageUrl = `https://discordapp.com/channels/${args.guildId}/${args.channelId}/${sentMessage.id}`;
        embed.setDescription(embed.description + ` [#${args.message.channel.name}](${sentMessageUrl})`);
        logChannel.send(embed);
      }
    })
    .catch(err => {
      console.error("Failed to send embed: " + err);
    });

    args.message.delete();

    await postLeaderboard(args);
  }
  else {
    let allHouseNames  = allHouses.join(', ') ;
    args.send(
    'You might not be able to do that.'+
    '\nUsage:\n'+process.env.PREFIX+'housename add points\n'+
    process.env.PREFIX+'housename subtract points\n'+
    'Where housename is the house\'s name '+
    '('+allHouseNames+')'+
    ' and points is a number.'
    ) ;
  }
}

addCommand ("addhouse", async function(args) {
  if (    ! checkPermissions(args, "addHouse")
       && ! checkPermissions(args, "doAllOfTheAbove")
     ) {
    args.send ('You do not have permission to do that.') ;
    return ;
  }
  console.log ("addhouse") ;
  console.log ("args", args.params) ;
  if (! args.params.length) {
    args.send ("Missing args. Use /addhouse <housename>") ;
    return ;
  }
  var HouseName              = args.params [0].trim () ;

  //name is already an alias ?
  var canDo                  = await aliasExists (HouseName.toLocaleLowerCase()) ;
  if (! canDo) {
    args.send ("Alias "+HouseName.toLocaleLowerCase()+" is already in use.") ;
    args.send ("Failed to create house "+HouseName+".") ;
    console.error ("ADDHOUSE : Alias "+HouseName.toLocaleLowerCase()+" is already in use.") ;
    return ;
  }
  // add in Houses
  Houses
    .findOrCreate ( 
                   {where: {   name: HouseName.toLowerCase()
                             , server_id: args.guildId
                            }
                   }
                  )
    .spread ( (house, created) => {
      if (created) {
        house.aliasescolor   = JSON.stringify ([house.get({plain: true}).name]) ;
        house.save () ;
        console.log("CREATE houses: " + house.get({plain: true}).name) ;
        addCommand (HouseName.toLowerCase(), housePointsFunc.bind (HouseName.toLowerCase())) ;
        allHouses   [allHouses.length] = HouseName ;
        args.send("Created house entry " + house.get({plain: true}).name.capitalize() + " in houses table.");
        args.send("Set houses options with /sethouse <name> <attribute> <value>.");
      } else {
        console.log("FIND houses: " + HouseName) ;
        args.send("House " + HouseName + " already exists.");
      }
      
    })
    .catch (err => {
      console.error("FAILED to findOrCreate house entry in house_points " + HouseName)
    })
    ;
});

addCommand ("sethouse", async function(args) {
   if (   ! checkPermissions(args, "addHouse")
       && ! checkPermissions(args, "doAllOfTheAbove")
     ) {
    args.send ('You do not have permission to do that.') ;
    return ;
  }
  console.log ("update house") ;
  console.log ("args", args.params) ;
  if (args.params.length < 3) {
    args.send ("Missing args. Use /sethouse <name> <attribute> <value>") ;
    return ;
  }
  var HouseName              = args.params [0].trim () ;
  var attribute              = args.params [1].trim () ;
  var value                  = args.params [2].trim () ;
  //color_hexa alias1;alias2;alias3 
  const allAttr              = [   "color"
                                 , "icon"
                                 , "alias"
                               ] ;
  if (allAttr.indexOf (attribute) == -1) {
    args.send ("Invalid attribute {color, icon, alias}") ;
    return ;
  }
  if (! value.length) {
    args.send ("Can parse empty value") ;
    return ;
  }
  if (attribute=="alias") {
    var newAliases           = value.split(",") ;
    var canDo                = true  ;
    for (let n=0 ; n < newAliases.length ; n++) {
      canDo                  = await aliasExists (newAliases [n]) ;
      if (! canDo) {
        args.send ("Alias "+newAliases [n]+" is already in use") ;
        args.send ("Failed to update "+HouseName+" entry in houses table.") ;
        console.error ("SETHOUSE : Alias "+newAliases [n]+" is already in use") ;
        return ;
      }
    }
  }
  // add in Houses
  Houses
          .findOne ({where: {name: HouseName.toLowerCase() } })
          .then ( (house) => {
            switch (attribute) {
              case "alias" :
                var oldAliases         = JSON.parse (house.get().aliases) ;
                for (let i = 0 ; i < newAliases.length ; i++) {
                  if (    ! oldAliases.includes (newAliases [i])
                     )
                    oldAliases [oldAliases.length] = newAliases [i];
                }
                house.aliases          = JSON.stringify (oldAliases) ;
                addCommand (newAliases, housePointsFunc.bind (HouseName.toLowerCase())) ;
              break ;
              case "color" :
                const rex    = /[0-9a-f]{6}/i ;
                if (rex.test (value)) {
                  house.color          = "0x"+value ;
                  args.send ({embed: {
                      color: parseInt (parseInt (value, 16), 10)
                    , description: value.toUpperCase()
                  }})
                }  
                else {
                  args.send ("Invalid value for color "+value+".");
                  args.send ("Use hexadecimal value (e.g. 00ff00)");
                  return ;
                }
              break ;
              case "icon" :
                house.icon   = value ;
              break ;
            }
             house.save()
               .then(() => {
                 console.log ("Update house entry " + house.get({plain: true}).name + " in houses table.");
                 args.send("Update house entry " + house.get({plain: true}).name + " in houses table.");
               });
          })
          .catch(err => {
            args.send("Failed to update "+HouseName+" entry in houses table.");
            console.error("FAILED to findOne house entry in houses " + err)
          });
});

addCommand ("infos", async function (args) {
  var params                 = args.params ;
  if (! params.length) {
    // Infos on all houses
    Houses
      .findAll ()
      .then ((houses) => {
        var embed            = 
          new Discord
                .RichEmbed ()
                .setColor (0x2EB050)
              ;
        var foundHouses      = false ;
        for (let n = 0 ; n < houses.length; n++) {
          if (! foundHouses)
            foundHouses      = true ;
          var house          = houses [n] ;
          let houseName      = house.get ({plain: true}).name.capitalize () ;
          let color          = house.get ().color ;
          let aliases        = JSON.parse (house.get ().aliases) ;
          embed
            .setTitle ("Infos on all houses")
            .addField
                       (
                           houseName
                         , "> **Color  :** "+color+"\n"+
                           "> **Aliases:** "+aliases.join (", ")+
                           "\n"+
                           ""
                       )
            ;
        }
        if (! foundHouses) {
          embed.addField (   "No house found !"
                           , "Use /addhouse <housename> to add a house."
                         ) ;
        }
        
        args.message.channel.send(embed)
        .then(sentMessage => {
          console.log ("Message sent.") ;
        })
        .catch(err => {
          console.error("Failed to send embed: " + err);
        });
      })
      .catch(err => {
        console.error ("FAILED to load houses " + err)
      }) ;
  } else {
    // Infos on one house
    var houseName                 = params [0].capitalize () ;
    var embed                     = 
      new Discord
           .RichEmbed ()
           .setColor (0x2EB050)
         ;
    Houses
      .findOne ({where:{name:houseName.toLowerCase()}})
      .then ((houses) => {
        let color            = houses.get ().color ;
        let aliases          = JSON.parse (houses.get ().aliases) ;
        embed
          .setTitle ("Infos on house "+houseName)
          .addField
                     (
                         houseName
                       , "> **Color  :** "+color+"\n"+
                         "> **Aliases:** "+aliases.join (", ")+
                         "\n"+
                         ""
                     )
          ;
        args.message.channel.send(embed)
        .then(sentMessage => {
          console.log ("Message sent.") ;
        })
        .catch(err => {
          console.error("Failed to send embed: " + err);
        });
      })
      .catch(err => {
        embed.addField (   "No house found with name "+houseName+" !"
                         , "Use /addhouse "+houseName+" to add the house."
                       ) ;
        args.message.channel.send(embed)
        .then(sentMessage => {
          console.log ("Message sent.") ;
        })
        .catch(err => {
          console.error("Failed to send embed: " + err);
        });
        console.error ("FAILED to load houses " + err)
      }) ;
  }
}) ;

addCommand ("help", function (args) {
   var embed                 = 
          new Discord
                .RichEmbed ()
                .setColor (0x2EB050)
                .setTitle ("Help for "+process.env.BOT_NAME)
                .setDescription (   "This is the help page for "+process.env.BOT_NAME+".\n"+
                                    "Initially created by MinusGix as"+
                                    " [DiscordModelHogwartsBot](https://github.com/MinusGix/DiscordModelHogwartsBot),"+
                                    " it was upgraded by rykanrar as"+
                                    " [HousePointsDiscordBot](https://github.com/rykanrar/HousePointsDiscordBot).\n"+
                                    "The current version is a work of Super-Thomate build"+
                                    " on top of the two previous version."+
                                    ""
                                )
                .addField (   
                              "/help"
                            , "Display this help page."
                          )
                .addField (   
                              "/commands"
                            , "Display a list of all available commands."
                          )
                .addField (   
                              "/pointssetup"
                            , "Starts the competition."
                          )
                .addField (   
                              "/pointslog"
                            , "Set points log channel to the current channel."
                          ) 
                .addField (   
                              "/pointsreset"
                            , "Set points to every houses to 0."
                          ) 
                .addField (   
                              "/addhouse <housename>"
                            , "Add a house."
                          ) 
                .addField (   
                              "/sethouse <housename> <attribute> <value>"
                            , "For house <housename> set <attribute> to <value>."
                          ) 
                .addField (   
                              "/maxpoints <integer>"
                            , "Set the maximum of points one can give or take at <integer>."
                          ) 
                .addField (   
                              "/minpoints <integer>"
                            , "Set the minimum of points one can give or take at <integer>."
                          )  
                .addField (   
                              "/infos"
                            , "Display informations for all houses in competition."
                          ) 
                .addField (   
                              "/infos <housename>"
                            , "Display informations for <housename>."
                          ) 
                .addField (   
                              "/<housename> add <amount> [<@Someone>] <reason>"
                            , "Add <amount> points to <housename> for the reason <reason>. The points are earned by <@Someone> if specified."
                          ) 
                .addField (   
                              "/<housename> take <amount> [<@Someone>] <reason>"
                            , "Take <amount> points to <housename> for the reason <reason>. The points are lost by <@Someone> if specified."
                          ) 
                .addField (   
                              "/<housename> set <amount>"
                            , "Set <housename> points to <amount>."
                          )
                ;
  args.message.channel.send(embed)
  .then(sentMessage => {
    console.log ("Message sent.") ;
  })
  .catch(err => {
    console.error("Failed to send embed: " + err);
  });
});

addCommand ("maxpoints", async function (args) {
   if (   ! checkPermissions(args, "doAllOfTheAbove")
      ) {
    args.send ('You do not have permission to do that.') ;
    return ;
  }
  var params                 = args.params ;
  if (! params.length) {
    args.send ("Missing args. Use /maxpoints <integer>") ;
    return ;
  }
  var points                 = params [0] ;
  if (      isNaN (points) 
       && ! Number.isInteger (points)
       && points < 0
     ) {
    args.send('Point values must be a positive integer.') ;
    console.log(' Point values must be positive integer.') ;
    return;
  }
  // add in Configuration
  Configuration
    .findOne ({where: {server_id: args.guildId} })
    .then ( (config) => {
      let min                = config.get().min_points ;
      if (min > points) {
        args.send('Point values must be greater or equal than '+min+'.') ;
        return ;
      }
      config.max_points      = points ;
      config.save()
        .then(() => {
          console.log ("Set maxpoints to "+points+".");
          args.send("Set maxpoints to "+points+".");
        })
        ;
    })
    .catch(err => {
      console.error("FAILED to findOne house entry in houses " + err)
    });
});

addCommand ("minpoints", async function (args) {
   if (   ! checkPermissions(args, "doAllOfTheAbove")
      ) {
    args.send ('You do not have permission to do that.') ;
    return ;
  }
  var params                 = args.params ;
  if (! params.length) {
    args.send ("Missing args. Use /minpoints <integer>") ;
    return ;
  }
  var points                 = params [0] ;
  if (      isNaN (points) 
       && ! Number.isInteger (points)
       && points < 0
     ) {
    args.send('Point values must be positive integer.') ;
    console.log(' Point values must be positive integer.') ;
    return;
  }
  // add in Configuration
  Configuration
    .findOne ({where: {server_id: args.guildId} })
    .then ( (config) => {
      let max                = config.get().max_points ;
      if (max < points) {
        args.send('Point values must be lesser or equal than '+max+'.') ;
        return ;
      }
      config.min_points      = points ;
      config.save()
        .then(() => {
          console.log ("Set minpoints to "+points+".");
          args.send("Set minpoints to "+points+".");
        })
        ;
    })
    .catch(err => {
      console.error("FAILED to findOne house entry in houses " + err)
    });
});

addCommand ("bendor", async function (args) {
 var house = "Firebendor"
     , args_points = 10
     , args_reason = "Bendor"
     ;
 
  let logChannel;
  let server_config          = await Configuration.findOne( {where: {server_id: args.guildId}} );
  if (server_config.p_log_channel) {
    logChannel              = args.message.guild.channels.find("id", server_config.p_log_channel);
    console.log("Found points log channel: " + logChannel);
  }
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
      .setFooter(`Lost by: ${args.displayName}`, 'https://i.imgur.com/jM0Myc5.png');

    var description = "";
    text = 'Lost ' + args_points + ' point(s) from ' + house.capitalize() + ' from ' + args.displayName + '.';
    
    if ( args_reason ) {
      text = text + ' *Reason: ' + args_reason + '*';
      description = [description, 'Reason: ' + args_reason].join(' ');
    }
    embed.setDescription(description);

    var authorName = args_points + ' points from ' + house.capitalize();
    await Houses.findOne ({where:{name:house.toLowerCase()}})
    .then ( (house) => {
      embed.setAuthor(authorName, house.get().icon).setColor(house.get().color);
    })
    .catch (err => {
      console.error("FAILED to findOne house entry in houses " + err)
    }) ;
    console.log(text);
    await args.message.channel.send(embed)
    .then(sentMessage => {
      var sentMessageUrl = `https://discordapp.com/channels/${args.guildId}/${args.channelId}/${sentMessage.id}`;
      console.log("sentMessage: " + sentMessageUrl);
      embed.setDescription(embed.description + ` [#${args.message.channel.name}](${sentMessageUrl})`);
      if (logChannel) {
        logChannel.send(embed);
      }
    })
    .catch(err => {
    console.error("Failed to send embed: " + err);
    });
}) ;

async function aliasExists (alias) {
  var canDo                  = "pasteque" ;
  await Houses
    .findOne ({ where: { aliases: { [Op.like]:'%'+alias+'%' } } } )
    .then ( (house) => {
      var allAliases         = JSON.parse (house.get().aliases) ;
      console.log ('allAliases', allAliases) ;
      canDo                  = ! allAliases.includes (alias) ;
    })
    .catch(err => {
      console.error("No houses with aliases "+alias+".\nErr : "+ err) ;
      canDo                  =  true ;
    });
  return canDo ;
}

//Logs into discord
var botToken = process.env.BOT_TOKEN;
client.login(botToken);

console.log("Starting...");