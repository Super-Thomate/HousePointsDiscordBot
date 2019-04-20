//Load env vars
if (process.env.NODE_ENV !== 'production') {
  require ('dotenv')
    .load () ;
}
const fs                     = require ('fs') ;
const bcrypt                 = require ('bcrypt') ;
const Sequelize              = require ('sequelize') ;
const Op                     = Sequelize.Op ;
const sequelize              = new Sequelize (   process.env.DB_NAME
                                               , process.env.DB_USER
                                               , process.env.DB_PASS
                                               , {
                                                       host: process.env.DB_HOST
                                                  , dialect: process.env.DB_DIALECT
                                                  , storage: process.env.DB_STORAGE // only usefull for sqlite
                                                 }
                                             ) ;
sequelize
  .authenticate ()
  .then ( () => {
    console.log ('Connection has been established successfully.') ;
  })
  .catch ( (err) => {
    console.error ('Unable to connect to the database:', err) ;
  }) ;

const current_server_id      = process.env.GUILD_ID ;

//For discord
var   Discord                = require ('discord.js')
    , client                 = new Discord.Client ()
    ;
// For commands
var COMMANDS                 = new Object () ;

// Create configuration table
const Configuration          = sequelize.define (   'configuration'
                                                  , {             server_id: {type: Sequelize.STRING}
                                                      ,       p_log_channel: {type: Sequelize.STRING}
                                                      ,  p_leaderboard_post: {type: Sequelize.STRING}
                                                      , leaderboard_display: {type: Sequelize.BOOLEAN, defaultValue: 1}
                                                      ,          max_points: {type: Sequelize.INTEGER, defaultValue: 100}
                                                      ,          min_points: {type: Sequelize.INTEGER, defaultValue: 1}
                                                      ,      negative_house: {type: Sequelize.BOOLEAN, defaultValue: 1}
                                                      ,   mandatory_reasons: {type: Sequelize.BOOLEAN, defaultValue: 1}
                                                    }
                                                ) ;
Configuration
  .sync ({
      alter: true
  })
  .then ( () => {
    console.log ("TABLE CREATED: configuration") ;
  })
  .catch ( (err)=> {
    console.error ("FAILED TABLE CREATE: configuration ", err) ;
  }) ;

// Create house_point table
/*
const HPoints                = sequelize.define (   'house_point'
                                                  , {        name: {type: Sequelize.STRING}
                                                      , server_id: {type: Sequelize.STRING}
                                                      ,    points: {type: Sequelize.INTEGER, defaultValue: 0}
                                                    }
                                                ) ;
*/
/*
HPoints
  .sync ({
      alter: true
  })
  .then( () => {
    console.log ("TABLE CREATED: house_points") ;
  })
  .catch( (err) => {
     console.error ("FAILED TABLE CREATE: house_points ", err) ;
  }) ;
*/

// Create houses table
const Houses                 = sequelize.define (   'houses'
                                                  , {        name: {type: Sequelize.STRING}
                                                      , server_id: {type: Sequelize.STRING}
                                                      ,      icon: {type: Sequelize.STRING, defaultValue: ""}
                                                      ,     color: {type: Sequelize.STRING, defaultValue: "0x000000"}
                                                      ,   aliases: {type: Sequelize.STRING, defaultValue: "[]"}
                                                      ,    points: {type: Sequelize.INTEGER, defaultValue: 0}
                                                    }
                                                ) ;
Houses
  .sync ({
     alter: true
  })
  .then ( () => {
    console.log ("TABLE CREATED: houses") ;
  })
  .catch ( (err) => {
    console.error ("FAILED TABLE CREATE: houses ", err) ;
  }) ;

//Create users table
const Users                  = sequelize.define (   'users'
                                                  , {         name: {type: Sequelize.STRING}
                                                      ,   password: {type: Sequelize.STRING}
                                                      , server_id: {type: Sequelize.STRING}
                                                      , registered: {type: Sequelize.BOOLEAN, defaultValue: 0}
                                                      ,     banned: {type: Sequelize.BOOLEAN, defaultValue: 0}
                                                      ,      roles: {type: Sequelize.STRING, defaultValue: "[]"}
                                                    }
                                                ) ;
Users
  .sync ({
     alter: true
  })
  .then ( () => {
    console.log ("TABLE CREATED: users") ;
  })
  .catch ( (err) => {
    console.error ("FAILED TABLE CREATE: users ", err) ;
  }) ;

//Create roles table
const Roles                  = sequelize.define (   'roles'
                                                  , {   permission: {type: Sequelize.STRING}
                                                      ,       role: {type: Sequelize.STRING}
                                                      , server_id: {type: Sequelize.STRING}
                                                    }
                                                ) ;
Roles
  .sync ({
     alter: true
  })
  .then ( () => {
    console.log ("TABLE CREATED: roles") ;
  })
  .catch ( (err) => {
    console.error ("FAILED TABLE CREATE: roles ", err) ;
  }) ;
var config_roles             = new Object () ;

// SOME CONSTANTS
// Get all permission
const perm_list              = new Array
                                           (   'setPoints'
                                             , 'givePoints'
                                             , 'takePoints'
                                             , 'addHouse'
                                             , 'doAllOfTheAbove'
                                           ) ;
// GIVE
const GIVE                   = new Array
                                           (   'give'
                                             , 'add'
                                             , 'increase'
                                             , 'inc'
                                             , '+'
                                           ) ;
// TAKE
const TAKE                   = new Array
                                           (   'take'
                                             , 'subtract'
                                             , 'sub'
                                             , 'decrease'
                                             , 'dec'
                                             , '-'
                                           ) ;
// SET
const SET                    = new Array
                                           (   'set'
                                             , '='
                                           ) ;

/**
 * HTTP SERVER => BOT MANAGER
 */
const http                   = require ('http') ;
const express                = require ('express') ;
const path                   = require ('path') ;
const handlebars             = require ('handlebars') ;
const exhandlebars           = require ('express-handlebars') ;
const bodyParser             = require ('body-parser') ;
const app                    = express () ;
// Parser
app.use (bodyParser.json()) ;       // to support JSON-encoded bodies
app.use (bodyParser.urlencoded ({     // to support URL-encoded bodies
    extended: true
  })
);
// Register Handlebars view engine
app.engine ('hbs', exhandlebars ({extname:'.hbs'})) ;
// Use Handlebars view engine
app.set ('view engine', 'hbs') ;
app.set ('views', __dirname+"/views") ;
app.set ('partials', __dirname+"/views/partials") ;
// assets
app.use(express.static(__dirname + '/public'));
app.use ('/static', express.static (__dirname+'public')) ;
var PARAMS                   = new Object () ;
PARAMS.BotName               = process.env.BOT_NAME ;
PARAMS.isLogged              = false ;
PARAMS.isLogged              = true ;

app
  .route ("/")
  .get ((request, response) => {
    console.log(""+dateToday() + " GET /") ;
    var allHousesAndPoints   = new Array () ;
    PARAMS.STYLES            = new Array () ;
    PARAMS.SCRIPTS           = new Array () ;
    PARAMS.currentPage       = new Object () ;
    PARAMS.currentPage.index = true ;
    PARAMS.STYLES         [PARAMS.STYLES.length] = "table" ;
    Houses
      .findAll ({where: {server_id:current_server_id}})
      .then ((houses) => {
        for (let n = 0 ; n < houses.length ; n++) {
          let house          = houses [n] ;
          allHousesAndPoints [allHousesAndPoints.length] =
              {     name: house.get ({plain: true}).name
                ,  color: house.get ().color.substring (2)
                , points: house.get ().points
                //,   icon: house.get ().icon
              } ;
        }
        PARAMS.houses            = allHousesAndPoints ;
        response.render ("index", PARAMS) ;
      })
      .catch ((e) => {
        console.error ("Error on Houses.findAll () : ", e) ;
        response.render ("index", PARAMS) ;
      }) ;
  })
  .post ((request, response) => {
    console.log(""+dateToday() + " POST /") ;
    var allHousesAndPoints   = new Array () ;
    PARAMS.STYLES            = new Array () ;
    PARAMS.SCRIPTS           = new Array () ;
    //allHousesAndPoints       = getAllHousesAndPoints () ;
    PARAMS.currentPage       = new Object () ;
    PARAMS.currentPage.index = true ;
    PARAMS.houses            = allHousesAndPoints ;
    PARAMS.STYLES            = ["table"] ;
    console.log ("POST /", allHousesAndPoints) ;
    console.log ("REQ", request.body)
    response.render ("index", PARAMS) ;
  }) ;

app
  .route ("/connect")
  .get ((request, response) => {
    console.log(""+dateToday() + " GET /connect") ;
    PARAMS.STYLES            = new Array () ;
    PARAMS.SCRIPTS           = new Array () ;
    PARAMS.currentPage       = new Object () ;
    PARAMS.currentPage.connect = true ;
    response.render ("connect", PARAMS) ;
  })
  .post ((request, response) => {
    console.log(""+dateToday() + " POST /connect") ;
    PARAMS.STYLES            = new Array () ;
    PARAMS.SCRIPTS           = new Array () ;
    PARAMS.currentPage       = new Object () ;
    PARAMS.currentPage.connect = true ;
    console.log ("REQ", request.body)
    response.render ("connect", PARAMS) ;
  }) ;

app
  .route ("/disconnect")
  .get ((request, response) => {
    console.log(""+dateToday() + " GET /disconnect") ;
    PARAMS.STYLES            = new Array () ;
    PARAMS.SCRIPTS           = new Array () ;
    PARAMS.currentPage       = new Object () ;
    PARAMS.currentPage.disconnect = true ;
    response.render ("disconnect", PARAMS) ;
  })
  .post ((request, response) => {
    console.log(""+dateToday() + " POST /disconnect") ;
    PARAMS.STYLES            = new Array () ;
    PARAMS.SCRIPTS           = new Array () ;
    PARAMS.currentPage       = new Object () ;
    PARAMS.currentPage.disconnect = true ;
    console.log ("REQ", request.body)
    response.render ("disconnect", PARAMS) ;
  }) ;

app
  .route ("/house")
  .get ((request, response) => {
    console.log(""+dateToday() + " GET /house") ;
    PARAMS.STYLES            = new Array () ;
    PARAMS.SCRIPTS           = new Array () ;
    PARAMS.currentPage       = new Object () ;
    PARAMS.currentPage.house = true ;
    response.render ("house", PARAMS) ;
  })
  .post ((request, response) => {
    console.log(""+dateToday() + " POST /house") ;
    PARAMS.STYLES            = new Array () ;
    PARAMS.SCRIPTS           = new Array () ;
    PARAMS.currentPage       = new Object () ;
    PARAMS.currentPage.house = true ;
    console.log ("REQ", request.body)
    response.render ("house", PARAMS) ;
  }) ;

app
  .route ("/user")
  .get ((request, response) => {
    console.log(""+dateToday() + " GET /user") ;
    PARAMS.STYLES            = new Array () ;
    PARAMS.SCRIPTS           = new Array () ;
    PARAMS.currentPage       = new Object () ;
    PARAMS.currentPage.user = true ;
    response.render ("user", PARAMS) ;
  })
  .post ((request, response) => {
    console.log(""+dateToday() + " POST /user") ;
    PARAMS.STYLES            = new Array () ;
    PARAMS.SCRIPTS           = new Array () ;
    PARAMS.currentPage       = new Object () ;
    PARAMS.currentPage.user = true ;
    console.log ("REQ", request.body)
    response.render ("user", PARAMS) ;
  }) ;

app
  .route ("/user/add")
  .get ((request, response) => {
    console.log(""+dateToday() + " GET /user/add") ;
    PARAMS.STYLES            = new Array () ;
    PARAMS.SCRIPTS           = new Array () ;
    PARAMS.currentPage       = new Object () ;
    PARAMS.currentPage.add = true ;
    PARAMS.currentPage.user = true ;
    response.render ("add", PARAMS) ;
  })
  .post ((request, response) => {
    console.log(""+dateToday() + " POST /user/add") ;
    PARAMS.STYLES            = new Array () ;
    PARAMS.SCRIPTS           = new Array () ;
    PARAMS.currentPage       = new Object () ;
    PARAMS.currentPage.add = true ;
    PARAMS.currentPage.user = true ;
    console.log ("REQ", request.body) ;
    var allMembers           =  client.guilds.first ().members.array () ;
    var reqUserName          = request.body.username ;
    var canCont              = false ;
    var User                 = null ;
    for(let m = 0 ; m < allMembers.length ; m++) {
      let member             = allMembers [m] ;
      console.log ("member.user.username :", member.user.username) ;
      if (reqUserName == member.user.username) {
        canCont              = true ;
        User                 = member ;
        break ;
      }
    }
    if (canCont) {
      // I've got a good user
      console.log ("USER :", User) ;

      User
        .send (createInvite (User))
        .then ((message) => {
          response.redirect ("/user/info") ;
          console.log ("Sent message "+message.content) ;
        })
        .catch (console.error) ;
    }
    //console.log ("MEMBERS", allMembers) ;

    response.render ("add", PARAMS) ;
  }) ;

app
  .route ("/user/info")
  .get ((request, response) => {
    console.log(""+dateToday() + " GET /user/info") ;
    PARAMS.STYLES            = new Array () ;
    PARAMS.SCRIPTS           = new Array () ;
    PARAMS.currentPage       = new Object () ;
    PARAMS.currentPage.info = true ;
    PARAMS.currentPage.user = true ;
    response.render ("info", PARAMS) ;
  })
  .post ((request, response) => {
    console.log(""+dateToday() + " POST /user/info") ;
    PARAMS.STYLES            = new Array () ;
    PARAMS.SCRIPTS           = new Array () ;
    PARAMS.currentPage       = new Object () ;
    PARAMS.currentPage.info = true ;
    PARAMS.currentPage.user = true ;
    console.log ("REQ", request.body)
    response.render ("info", PARAMS) ;
  }) ;

app
  .route ("/join")
  .get ((request, response) => {
    console.log(""+dateToday() + " GET /join") ;
    PARAMS.STYLES            = new Array () ;
    PARAMS.SCRIPTS           = new Array () ;
    PARAMS.currentPage       = new Object () ;
    PARAMS.botname           = process.env.BOTNAME ;
    PARAMS.username          = request.query.un ;
    PARAMS.usertoken         = request.query.tk ;

    response.render ("join", PARAMS) ;
  })
  .post ((request, response) => {
    console.log(""+dateToday() + " POST /join") ;
    PARAMS.STYLES            = new Array () ;
    PARAMS.SCRIPTS           = new Array () ;
    PARAMS.currentPage       = new Object () ;
    PARAMS.botname           = process.env.BOTNAME ;
    PARAMS.username          = request.body.un ;
    PARAMS.usertoken         = request.body.tk ;
    let   step               = request.body.st
        , toRender           = "join"
        ;
    switch (step) {
      case       1:
      case     "1":
        toRender             = "join_st1" ;
        PARAMS.SCRIPTS   [PARAMS.SCRIPTS.length] = "join_validate" ;
      break ;
    }
    console.log ("REQ : ", request.body) ;
    console.log ("toRender : ", toRender) ;
    response.render (toRender, PARAMS) ;
  }) ;

/**
 * ERROR 404
 */
app
  .route ("*")
  .get ((request, response) => {
    console.log(""+dateToday() + " GET 404") ;
    PARAMS.STYLES            = new Array () ;
    PARAMS.SCRIPTS           = new Array () ;
    PARAMS.currentPage       = new Object () ;
    response.status (404).render ("err_404", PARAMS) ;
  })
  .post ((request, response) => {
    console.log(""+dateToday() + " POST 404") ;
    PARAMS.STYLES            = new Array () ;
    PARAMS.SCRIPTS           = new Array () ;
    PARAMS.currentPage       = new Object () ;
    response.status (404).render ("err_404", PARAMS) ;
  }) ;

app.listen(process.env.PORT);

/**
 * BACK TO THE BOT
 */

// All functions needed

// Loads a JSON file
function loadJSON
                       (   dir
                       ) {
    return JSON.parse (fs.readFileSync (dir, 'utf8')
                      ) ;
}
// Writes to a JSON file
function writeJSON
                       (   dir
                         , data
                       ) {
    return fs.writeFileSync (
                                dir
                              , JSON.stringify (data)
                              , 'utf8'
                            ) ;
}
// Turn bot off (args), then turn it back on
function resetBot
                       (   args
                       ) {
    // send channel a message that you're resetting bot [optional]
    args
      .send ('Rebooting ...')
      .then ( msg => client.destroy ())
      .then ( () => client.login (process.env.BOT_TOKEN))
      .then ( () => args.send ("I'm back !") )
      ;
}

function addCommand
                       (   name
                         , func
                         , hide
                       ) {
  if (name.constructor === Array) {
    for (var i = 0; i < name.length; i++) {
      if (i === 0) {
        addCommand (   name [i]
                     , func
                     , false
                   ) ;
      } else {
        addCommand (   name [i]
                     , func
                     , true
                   ) ;
      }
    }
  } else {
    COMMANDS   ["cmd_"+name] = {   name
                                 , func
                                 , hide: hide || false
                               } ;
  }
}

function runCommand
                       (   message
                       ) {
  console.log ("Verified bot command") ;
  var firstArg               = message.content.split (' ') [0] ;
  if (   (   firstArg.startsWith (process.env.PREFIX)
          && COMMANDS.hasOwnProperty ('cmd_'+firstArg.replace (process.env.PREFIX, ''))
         )
      || firstArg == "bendor"
     ) {
    //probably don't need most of these, but it's for simplicity if I ever do need them.
    var processed_content = message.content.trim ().replace (/\s{2,}/g, ' ') ;
    var args                 = {         message: message
                                 ,          text: processed_content
                                 ,        params: processed_content.split (' ').slice (1)
                                 ,          send: message.channel.send.bind (message.channel)
                                 ,      sendFile: message.channel.sendFile.bind (message.channel)
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
                                 ,            dm: message.author.send.bind (message.author)
                                 ,        dmCode: message.author.sendCode.bind (message.author)
                                 ,       dmEmbed: message.author.send.bind (message.author)
                                 ,        dmFile: message.author.sendFile.bind (message.author)
                                 ,     dmMessage: message.author.send.bind (message.author)
                                 ,         guild: message.guild
                               } ;
    console.log ("cmd called : "+'cmd_'+firstArg.replace (process.env.PREFIX, ''))
    COMMANDS ['cmd_'+firstArg.replace (process.env.PREFIX, '')].func (args) ;
  }
}

function checkPermissions
                       (   args
                         , permission
                       ) {
  var   user                 = args.message.member
      , roles                = user.roles
      , targetPermission     = ""
      ;
  for (var i = 0 ; i < perm_list.length ; i++) {
    if (permission == perm_list [i]) {
      targetPermission       = perm_list [i] ;
    }
  }
  if (! targetPermission.length) {
    console.log ("PERMISSION NOT FOUND: "+permission) ;
    return false ;
  }
  var allowedRoles           = config_roles [targetPermission] ;
  console.log ("Allowed roles for permission "+permission+": "+allowedRoles) ;
  for (var [key, value] of roles) {
    if (allowedRoles.includes (value.name)) {
      console.log ("PERMISSION ALLOWED: "+permission) ;
      return true ;
    }
  }
  console.log ("PERMISSION DENIED: "+permission) ;
  return false ;
}

function dateToday
                       (
                       ) {
  let date                   = new Date () ;
  return "{"+date.toString ()+"}" ;
}

async function postLeaderboard
                                 (   args
                                 ) {
  // Get log channel
  let logChannel             = false ;
  let server_config          = await Configuration.findOne (   {
                                                                   where: {server_id: args.guildId}
                                                               }
                                                           ) ;
  if (server_config.p_log_channel) {
    logChannel              = args.message.guild.channels.find (   "id"
                                                                 , server_config.p_log_channel
                                                               ) ;
    console.log ("Found points log channel: "+logChannel) ;
  }
  if (    logChannel
       && server_config.leaderboard_display
     ) {
    // Set up embed
    var text                 = '' ;
    var embed                =
      new Discord.RichEmbed ()
        .setTitle ("Points Leaderboard")
        .setColor (0xFFFFFF)
        .setFooter ("Updated at")
        .setTimestamp (new Date ().toISOString ()) ;

    let pointRows            = await Houses.findAll (   {
                                                             order: [
                                                                      [   'points'
                                                                        , 'DESC'
                                                                      ]
                                                                    ]
                                                           , raw: true
                                                           , where: {server_id: current_server_id}
                                                         }
                                                     ) ;
    // Create leaderboard text
    for (var i = 0 ; i < pointRows.length ; i++) {
      var row                = pointRows [i] ;
      var subtext            = (i+1)+". "+row.name.capitalize ()+": "+row.points+" points" ;
      if (i == 0) {
        subtext              = '**'+subtext+'**' ;
      }
      text                   = new Array (text, subtext).join ('\n') ;
    };
    embed.setDescription (text) ;
    console.log ("text: "+text) ;


     logChannel
       .send (embed)
       .then (sentMessage => {
         // Remove old leaderboard message
         let oldPostId       = server_config.p_leaderboard_post ;
         if (oldPostId) {
           console.log ("Found points old leaderboard post: "+oldPostId) ;
           logChannel
             .fetchMessage (oldPostId)
             .then (message => {
               if (message) {
                 message.delete () ;
                 console.log ("Deleted old points leaderboard message") ;
               }
             })
             .catch (console.error)
             ;
         }
         // Update p_leaderboard_post with new messageId
         var sentMessageId   = sentMessage.id;
         console.log("sentMessageId: "+sentMessageId) ;
         server_config.p_leaderboard_post        = sentMessageId;
         server_config.save ().then ( () => {
           console.log ("Saved p_leaderboard_post to "+sentMessageId) ;
         })
         .catch (err => {
           console.log ("Failed to save p_leaderboard_post to "+sentMessageId+"", err) ;
         }) ;
       })
       .catch (console.error)
       ;
  }
};

async function housePointsFunc
                                 (   args

                                 ) {
  console.log("Begin points manipulation commands");
  var   house                = this
      , user                 = args.message.member
      , userMention          = "<@!" + args.authorID + ">"
      ;
  // Assign permissions
  var   canGivePoints        = checkPermissions (args, "givePoints") || checkPermissions (args, "doAllOfTheAbove")
      , canTakePoints        = checkPermissions (args, "takePoints") || checkPermissions (args, "doAllOfTheAbove")
      , canSetPoints         = checkPermissions  (args, "setPoints") || checkPermissions (args, "doAllOfTheAbove")
      ;
  console.log("Verified roles permission") ;

  // Reject if user has no permissions
  if (!(canGivePoints || canTakePoints || canSetPoints)) {
    args.send('You do not have permission to do that.') ;
    return;
  }
  var server_config          = await Configuration.findOne( {where: {server_id: args.guildId}} ) ;
  // Save first param as command name
  var firstParam             = args.params [0] ;
  if (firstParam !== undefined) {
    if (firstParam.toLowerCase !== undefined) {
      firstParam             = firstParam.toLowerCase () ;
    }
  }
  console.log("Command: "+firstParam+", Params: "+args.params) ;

  // Check second param is a number
  let args_points           = Number (args.params [1]) ;
  if (      isNaN (args_points)
       && ! Number.isInteger (args_points)
      ) {
    args.send ('Point values must be an integer.') ;
    console.log (' Point values must be an integer.') ;
    return ;
  }

  // Setup user from param's mention if possible
  var targetUser             = args.mentions.first () ;
  var targetUserMention      = "" ;
  if (targetUser !== undefined) {
    targetUserMention = "<@!" + targetUser.id + ">";
  }

  // Save reason param
  let args_reason            = "" ;
  let startAt                = 2 ;
  if (    targetUser
       && args.params [2].startsWith ('<@')
       && args.params [2].endsWith('>')
     ) {
    // Ignore mentions in reason param
    startAt                  = 3 ;
  }
  else {
    // Not directed at a particular user
    targetUser               = undefined ; // Needs to be set if no user param but there is a mention in reason
  }
  args_reason                = args.params.slice (startAt).join (" ") ;
  if (    (! args_reason)
       && (server_config.mandatory_reasons == "true")
     ) {
    args.send ('Please include a reason.') ;
    return ;
  }
  console.log ("Mentions: "+targetUser) ;
  console.log ("Reason: "+args_reason) ;
  let logChannel             = false ;

  // Get log channel if there is one
  if (server_config.p_log_channel) {
    logChannel               = args.message.guild.channels.find ("id", server_config.p_log_channel) ;
    console.log ("Found points log channel: "+logChannel) ;
  }

  if ( (GIVE.includes(firstParam)) && canGivePoints === true ) {
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
      let housePoints = await Houses.findOne( {where: {name: house}} );
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
    if (server_config.leaderboard_display)
      await postLeaderboard(args);
  }
  else if ( (TAKE.includes(firstParam)) && canTakePoints === true ) {
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
    let housePoints = await Houses.findOne( {where: {name: house}} );
    housePoints.points = housePoints.points - args_points;
    let negative             = await canDrop (args) ;
      if (! negative && housePoints.points < 0)
        housePoints.points   = 0  ;
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

    if (server_config.leaderboard_display)
      await postLeaderboard(args);
  }
  else if ( (SET.includes(firstParam)) && canSetPoints === true ) {
    // Set points
    // Set points
    // Update DB with points
    let negative             = await canDrop (args) ;
    if (! negative && args_points < 0) {
      args_points            = 0 ;
      args.send ("WARNING : Houses' points can not be negative.") ;
    }
    let housePoints = await Houses.findOne( {where: {name: house}} );
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

    if (server_config.leaderboard_display)
      await postLeaderboard(args);
  }
  else {
    let allHouseNames  = allHouses.join(', ') ;
    args.send(
    'Unknown argument: '+firstParam+'.'+
    '\nUsage:\n'+process.env.PREFIX+'<housename> add <integer>\n'+
    process.env.PREFIX+'<housename> subtract <integer>'+
    ''
    ) ;
  }
  //allHousesAndPoints       =
  getAllHousesAndPoints () ;
}

async function aliasExists (alias) {
  var canDo                  = true ;
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

async function canDrop (args) {
  let config                 = await Configuration.findOne( {where: {server_id: args.guildId}} ) ;
  return config.get().negative_house ;
}

function createInvite (User) {
  let   name                 = User.user.username
      , password             = "password"
      , message              = ""
      ;
  message                   +=
              "Hello "+name+" !\n"+
              "You have been invited to join "+process.env.BOT_NAME+" interface at "+
              "https://"+process.env.DN+"/join?tk=1&un="+name+
              ".\n"+
              "" ;
  return message ;
}

function get_time
                       (   formated    = false
                       ) {
  var date_now               = new Date () ;
  if (formated) {
    var toReturn             =
              date_now.getFullYear()+"/"+
              (   (date_now.getMonth()+1) > 9
                ? (date_now.getMonth()+1)
                : "0"+(date_now.getMonth()+1)
              )+
              "/"+date_now.getDate()+
              " "+date_now.getHours()+":"+date_now.getMinutes()+":"+date_now.getSeconds()+
              "" ;
    return toReturn ;
  }
  return date_now.getTime () ;
}

// Prototype definition

String.prototype.replaceAll = function (search, replacement) {
  var target                 = this;
  return target.replace(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), 'g'), replacement);
};

String.prototype.capitalize = function () {
  return this.slice(0, 1).toUpperCase() + this.slice(1);
} ;

// Discord events
// Go !
client.on ("ready", () => {
  console.log("logged in serving in " + client.guilds.array().length + " servers");
  // Find allHouses
  var allHouses              = new Array () ;
  Houses.findAll ({where: {server_id:current_server_id}})
    .then ( (houses) => {
      for (let n = 0 ; n < houses.length; n++) {
        var house            = houses [n] ;
        let houseName        = house.get ({plain: true}).name.toLowerCase () ;
        let aliases          = JSON.parse (house.get ().aliases) ;
        allHouses     [allHouses.length] = houseName ;
        console.log ("--------------------------------------------------------") ;
        console.log (houseName, aliases) ;
        console.log ("--------------------------------------------------------") ;
        addCommand (aliases, housePointsFunc.bind (houseName)) ;
      }
    })
    .catch((err) => {
      console.error ("FAILED to load houses ", err)
    }) ;
  // Get all (perm,role)
  for (let i = 0 ; i < perm_list.length ; i++) {
    config_roles       [perm_list [i]] = new Array () ;
  }
  Roles
    .findAll ({where: {server_id:current_server_id}})
    .then ( (roles) => {
      for (let i = 0 ; i < roles.length ; i ++) {
        let perm             = roles [i].get ().permission ;
        let role             = roles [i].get ().role ;
        config_roles     [perm] [config_roles [perm].length] = role ;
      }
    })
    .catch ( (err) => {
      console.log ("FAIL findOrCreate Roles "+err) ;
    })
    ;

  //   _____                                          _
  //  / ____|                                        | |
  // | |     ___  _ __ ___  _ __ ___   __ _ _ __   __| |___
  // | |    / _ \| '_ ` _ \| '_ ` _ \ / _` | '_ \ / _` / __|
  // | |___| (_) | | | | | | | | | | | (_| | | | | (_| \__ \
  //  \_____\___/|_| |_| |_|_| |_| |_|\__,_|_| |_|\__,_|___/
  //

  addCommand ("commands", function (args) {
    var   text                 = 'Commands:\n'
        , first                = true
        ;
    for (let cmd in COMMANDS) {
      if (COMMANDS [cmd].hide) {
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
      args.send ("No house define in base => use "+process.env.PREFIX+"addhouse <housename> to add houses.") ;
      return ;
    }
    for (var i = 0; i < allHouses.length; i++) {
      Houses
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
      Houses
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
    var server_config          = await Configuration.findOne( {where: {server_id: args.guildId}} ) ;
      if (server_config.leaderboard_display)
        await postLeaderboard(args);
    args.message.delete () ;
  });

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
      args.send ("Missing args. Use "+process.env.PREFIX+"addhouse <housename>") ;
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
          args.send("Set houses options with "+process.env.PREFIX+"sethouse <name> <attribute> <value>.");
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
    if (    ! checkPermissions(args, "addHouse")
         && ! checkPermissions(args, "doAllOfTheAbove")
       ) {
      args.send ('You do not have permission to do that.') ;
      return ;
    }
    console.log ("update house") ;
    console.log ("args", args.params) ;
    if (args.params.length < 3) {
      args.send ("Missing args. Use "+process.env.PREFIX+"sethouse <name> <attribute> <value>") ;
      return ;
    }
    var HouseName              = args.params [0].trim () ;
    var attribute              = args.params [1].trim () ;
    var value                  = args.params [2].trim () ;
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
        .findAll ({where: {server_id:current_server_id}})
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
                             , "Use "+process.env.PREFIX+"addhouse <housename> to add a house."
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
                           , "Use "+process.env.PREFIX+"addhouse "+houseName+" to add the house."
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
    let page                   = args.params [0] ;
    if (      isNaN (page)
         && ! Number.isInteger (page)
       ) {
      page                     = 1 ;
    } else {
      page                     = parseInt (page) ;
    }
    let embed1                 =
            new Discord
                  .RichEmbed ()
                  .setColor (0x2EB050)
                  .setTitle ("Help for "+process.env.BOT_NAME)
                  .setDescription (   "This is the help page for "+process.env.BOT_NAME+".\n"+
                                      "Initially created by MinusGix as"+
                                      " [DiscordModelHogwartsBot](https://github.com/MinusGix/DiscordModelHogwartsBot),"+
                                      " it was upgraded by rykanrar as"+
                                      " [HousePointsDiscordBot](https://github.com/rykanrar/HousePointsDiscordBot).\n"+
                                      "The current Sorting Hat is a work of Super-Thomate build"+
                                      " on top of the two previous version."+
                                      ""
                                  )
                  .addField (
                                ""+process.env.PREFIX+"help [<page>]"
                              , "Display this help page. If <page> is set, display the page <page>"
                            ) // 1
                  .addField (
                                ""+process.env.PREFIX+"commands"
                              , "Display a list of all available commands."
                            ) // 2
                  .addField (
                                ""+process.env.PREFIX+"pointssetup"
                              , "Starts the competition."
                            ) // 3
                  .addField (
                                ""+process.env.PREFIX+"pointslog"
                              , "Set points log channel to the current channel."
                            ) // 4
                  .addField (
                                ""+process.env.PREFIX+"displayleaderboard <true|false>"
                              , "Set if you want to display or not the points leaderboard."
                            ) // 5
                  .addField (
                                ""+process.env.PREFIX+"pointsreset"
                              , "Set points to every houses to 0."
                            ) // 6
                  .addField (
                                ""+process.env.PREFIX+"addhouse <housename>"
                              , "Add a house."
                            ) // 7
                  .addField (
                                ""+process.env.PREFIX+"sethouse <housename> <attribute> <value>"
                              , "For house <housename> set <attribute> to <value>."
                            ) // 8
                  .addField (
                                ""+process.env.PREFIX+"maxpoints <integer>"
                              , "Set the maximum of points one can give or take at <integer>."
                            ) // 9
                  .addField (
                                ""+process.env.PREFIX+"minpoints <integer>"
                              , "Set the minimum of points one can give or take at <integer>."
                            ) // 10
                  .setFooter ("1/3")
                  ;
    let embed2                 =
            new Discord
                  .RichEmbed ()
                  .setColor (0x2EB050)
                  .setTitle ("Help for "+process.env.BOT_NAME)
                  .setDescription (   "This is the help page for "+process.env.BOT_NAME+".\n"+
                                      "Initially created by MinusGix as"+
                                      " [DiscordModelHogwartsBot](https://github.com/MinusGix/DiscordModelHogwartsBot),"+
                                      " it was upgraded by rykanrar as"+
                                      " [HousePointsDiscordBot](https://github.com/rykanrar/HousePointsDiscordBot).\n"+
                                      "The current Sorting Hat is a work of Super-Thomate build"+
                                      " on top of the two previous version."+
                                      ""
                                  )
                  .addField (
                                ""+process.env.PREFIX+"infos"
                              , "Display informations for all houses in competition."
                            ) // 1
                  .addField (
                                ""+process.env.PREFIX+"infos <housename>"
                              , "Display informations for <housename>."
                            ) // 2
                  .addField (
                                ""+process.env.PREFIX+"<housename> add <amount> [<@Someone>] <reason>"
                              , "Add <amount> points to <housename> for the reason <reason>. The points are earned by <@Someone> if specified."
                            ) // 3
                  .addField (
                                ""+process.env.PREFIX+"<housename> take <amount> [<@Someone>] <reason>"
                              , "Take <amount> points to <housename> for the reason <reason>. The points are lost by <@Someone> if specified."
                            ) // 4
                  .addField (
                                ""+process.env.PREFIX+"<housename> set <amount>"
                              , "Set <housename> points to <amount>."
                            ) // 5
                  .addField (
                                ""+process.env.PREFIX+"setpermission <permission> <role>"
                              , "Add the permission <permission> to the role <role>."
                            ) // 6
                  .addField (
                                ""+process.env.PREFIX+"listpermissions"
                              , "List all permissions for the Sorting Hat."
                            ) // 7
                  .addField (
                                ""+process.env.PREFIX+"showpermissions"
                              , "Show for every permissions the role sets for the Sorting Hat."
                            ) // 8
                  .addField (
                                ""+process.env.PREFIX+"deletehouse <housename>"
                              , "Delete the house <houseName> then reboot the Sorting Hat."
                            ) // 9
                  .addField (
                                ""+process.env.PREFIX+"deletealias <housename> <alias>"
                              , "Delete the aliases <alias> from <housename> then reboot the Sorting Hat."
                            ) // 10
                  .setFooter ("2/3")
                  ;
    let embed3                 =
            new Discord
                  .RichEmbed ()
                  .setColor (0x2EB050)
                  .setTitle ("Help for "+process.env.BOT_NAME)
                  .setDescription (   "This is the help page for "+process.env.BOT_NAME+".\n"+
                                      "Initially created by MinusGix as"+
                                      " [DiscordModelHogwartsBot](https://github.com/MinusGix/DiscordModelHogwartsBot),"+
                                      " it was upgraded by rykanrar as"+
                                      " [HousePointsDiscordBot](https://github.com/rykanrar/HousePointsDiscordBot).\n"+
                                      "The current Sorting Hat is a work of Super-Thomate build"+
                                      " on top of the two previous version."+
                                      ""
                                  )
                  .addField (
                                ""+process.env.PREFIX+"deletepermission <permission> <role>"
                              , "Delete the permission <permission> for the role <role> then reboot the Sorting Hat."
                            ) // 1
                  .addField (
                                ""+process.env.PREFIX+"reboot"
                              , "Reboot the bot."
                            ) // 2
                  .addField (
                                ""+process.env.PREFIX+"addrole <role>"
                              , "Add the role <role> to the server."
                            ) // 3
                  .addField (
                                ""+process.env.PREFIX+"giverole <role> <@someone>"
                              , "Give the role <role> to <@someone>."
                            ) // 4
                  .addField (
                                ""+process.env.PREFIX+"housebot? <question>"
                              , "Sometimes it's good to let the Sorting Hat decide, sometimes it's not.\n"+
                                "Alias "+process.env.PREFIX+"hb? <question>"
                            ) // 5
                  .addField (
                                ""+process.env.PREFIX+"negativehouses <true|false>"
                              , "Set if you want to allow or not the houses to have negative points."
                            ) // 6
                  .setFooter ("3/3")
                  ;
    let embed                  = "" ;
    switch (page) {
      case 2:
       embed                   = embed2 ;
      break ;
      case 3:
        embed                  = embed3 ;
      break ;
      default:
        embed                  = embed1 ;
    }
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
      args.send ("Missing args. Use "+process.env.PREFIX+"maxpoints <integer>") ;
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
      args.send ("Missing args. Use "+process.env.PREFIX+"minpoints <integer>") ;
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
    if (process.env.BENDOR !== "bendor") {
      return ;
    }
    var  house               = "Firebendor"
       , args_points         = 10
       , args_reason         = "Bendor"
       ;
    console.log ("BENDOR") ;
    let logChannel;
    let server_config          = await Configuration.findOne( {where: {server_id: args.guildId}} );
    if (server_config.p_log_channel) {
      logChannel              = args.message.guild.channels.find("id", server_config.p_log_channel);
      console.log("Found points log channel: " + logChannel);
    }
    let housePoints = await Houses.findOne( {where: {name: house}} );
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

  addCommand ("displayleaderboard", function (args) {
    if (   ! checkPermissions(args, "doAllOfTheAbove")
       ) {
      args.send ('You do not have permission to do that.') ;
      return ;
    }
    var params                 = args.params ;
    if (! params.length) {
      args.send ("Missing args. Use "+process.env.PREFIX+"displayleaderboard <true|false>") ;
      return ;
    }
    var bool                   = params [0] ;
    if (    bool != "true"
         && bool != "false"
       ) {
      args.send ("Wrong args. Use "+process.env.PREFIX+"displayleaderboard <true|false>") ;
      return ;
    }
    bool                       = bool == "true" ;
    Configuration
      .findOne( {where: {server_id: args.guildId}} )
      .then ( (config) => {
        config.leaderboard_display       = bool ;
        config
          .save ()
          .then(() => {
            console.log ("Set leaderboard_display to "+bool+".");
            args.send("Leaderboard will "+(bool?"":"not ")+"be shown.");
          })
          .catch ()
      })
      .catch ( (err) => {
        console.error ("FAIL findOne Configuration on displayleaderboard "+err) ;
      })
      ;
  }) ;

  addCommand ("setpermission", async function (args) {
    if (   ! checkPermissions(args, "doAllOfTheAbove")
       ) {
      args.send ('You do not have permission to do that.') ;
      return ;
    }
    var params                 = args.params ;
    if (! params.length) {
      args.send ("Missing args. Use "+process.env.PREFIX+"addRole <permission> <role>") ;
      return ;
    }
    var perm                   = params [0] ;
    var role                   = params [1] ;
    if (! perm_list.includes(perm)) {
      args.send ("The permission "+perm+" is not defined. Use "+process.env.PREFIX+"listpermission for more infos.") ;
      return ;
    }
    Roles
      .findOrCreate ({where: {permission:perm, role: role, server_id: args.guildId}})
      .spread ( (roles, created) => {
        if (created) {
           config_roles  [perm] [config_roles [perm].length] = role ;
          args.send ("Created permission "+perm+" for "+role+".") ;
          console.log ("Created permission "+perm+" for "+role+".") ;
        } else {
          args.send (role+" already has the permission "+perm+".") ;
          console.log (role+" already has the permission "+perm+".") ;
        }
      })
      .catch ( (err) => {
        console.log ("FAIL findOrCreate Roles "+err) ;
      })
      ;
  }) ;

  addCommand ("listpermissions", function (args) {
    var embed                  =
      new Discord
            .RichEmbed ()
            .setColor (0x2EB050)
            .setTitle ("List all permissions for "+process.env.BOT_NAME)
            //.setDescription ()
            .addField (
                          "setPoints"
                        , "Can set points to a house or reset all points."
                      )
            .addField (
                          "givePoints"
                        , "Can give points to a house."
                      )
            .addField (
                          "takePoints"
                        , "Can take points to a house."
                      )
            .addField (
                          "addHouse"
                        , "Can add a house and modify its attribute."
                      )
            .addField (
                          "doAllOfTheAbove"
                        , "Can do everything listed above, and more."
                      )
            ;
    args.message.channel.send(embed)
    .then(sentMessage => {
      console.log ("Message sent.") ;
    })
    .catch(err => {
      console.error("Failed to send embed: " + err);
    });
  }) ;

  addCommand ("showpermissions", async function (args) {

    var allPermRoles           = new Object () ;
    for (let i = 0 ; i < perm_list.length ; i++) {
      allPermRoles       [perm_list [i]] = new Array () ;
    }
    await Roles
      .findAll ({where: {server_id:current_server_id}})
      .then ( (roles) => {
        for (let i = 0 ; i < roles.length ; i ++) {
          let perm             = roles[i].get().permission ;
          let role             = roles[i].get().role ;
          allPermRoles   [perm] [allPermRoles [perm].length] = role ;
        }
      })
      .catch ( (err) => {
        console.log ("FAIL findOrCreate Roles "+err) ;
      })
      ;
    var embed                  =
      new Discord
            .RichEmbed ()
            .setColor (0x2EB050)
            .setTitle ("Show for every permissions the role sets for "+process.env.BOT_NAME)
            //.setDescription ()
           ;
    Object
      .keys(allPermRoles)
      .map( (perm) => {
        var text               = "" ;
        for (let i = 0; i < allPermRoles [perm].length; i++) {
          text                 +=
                "* "+allPermRoles [perm][i]+"\n"+
                "" ;
        }
        if (! text.length) {
          text                 +=
                "No role sets for this permission."+
                "" ;
        }
        embed.addField (
                           perm
                         , text
                       )
      }) ;
    args.message.channel.send(embed)
      .then(sentMessage => {
        console.log ("Message sent.") ;
      })
      .catch(err => {
        console.error("Failed to send embed: " + err);
      });
  }) ;

  addCommand ("deletehouse", async function (args) {
    // delete myObject['regex'] ;
    if (    ! checkPermissions(args, "addHouse")
         && ! checkPermissions(args, "doAllOfTheAbove")
       ) {
      args.send ('You do not have permission to do that.') ;
      return ;
    }
    if (! args.params.length) {
      args.send ("Missing args. Use "+process.env.PREFIX+"deletehouse <housename>") ;
      return ;
    }
    var HouseName              = args.params [0].trim () ;
    Houses
      .destroy ({where: {name: HouseName.toLowerCase() } })
      .then ( (val) => {
        if (val > 0) {
          args.send ("Successfully delete "+HouseName) ;
          resetBot (args) ;
        } else
          args.send ("Something went wrong") ;
      })
      .catch ( (err) => {
        console.log ("Cannot find house "+err) ;
      })
      ;
  }) ;

  addCommand ("deletealias", async function (args) {
    if (    ! checkPermissions(args, "addHouse")
         && ! checkPermissions(args, "doAllOfTheAbove")
       ) {
      args.send ('You do not have permission to do that.') ;
      return ;
    }
    if (args.params.length < 2) {
      args.send ("Missing args. Use "+process.env.PREFIX+"deletealias <housename> <alias>") ;
      return ;
    }
    var HouseName            = args.params [0] ;
    var alias                = args.params [1] ;
    var newAliases           = alias.split(",") ;
    Houses
      .findOne ({where: {name: HouseName.toLowerCase() } })
      .then ( (house) => {
        var oldAliases         = JSON.parse (house.get().aliases) ;
        oldAliases             = oldAliases.filter ( (alias) => {
                                                  return ! newAliases.includes (alias)
                                                }) ;
        house.aliases          = JSON.stringify (oldAliases) ;
        house.save () ;
        args.send ("Deleted alias") ;
        resetBot (args) ;
      })
      .catch ( (err) => {
        args.send ("No house found for name "+HouseName) ;
        console.err ("FAIL findOne house "+HouseName+" on deletealias "+alias+" : ",err) ;
      })
      ;
  }) ;

  addCommand ("deletepermission", async function (args) {
    if (    ! checkPermissions(args, "doAllOfTheAbove")
       ) {
      args.send ('You do not have permission to do that.') ;
      return ;
    }
    if (args.params.length < 2) {
      args.send ("Missing args. Use "+process.env.PREFIX+"deletepermission <permission> <role>") ;
      return ;
    }
    var perm                   = args.params [0] ;
    var role                   = args.params [1] ;
    if (! perm_list.includes (perm)) {
      args.send ("The permission "+perm+" is not defined. Use "+process.env.PREFIX+"listpermission for more infos.") ;
      return ;
    }
    Roles
      .destroy ({where: {permission:perm, role: role, server_id: args.guildId}})
      .then ( (val) => {
        if (val) {
          args.send ("The role "+role+" does not have the permission "+perm+" anymore.") ;
          console.log ("The role "+role+" does not have the permission "+perm+" anymore.") ;
          resetBot (args) ;
        } else {
          args.send ("The role "+role+" may not have the permission "+perm+".") ;
          args.send ("Use "+process.env.PREFIX+"showpermissions for more infos.") ;
          console.log ("The role "+role+" may not have the permission "+perm+".") ;
        }
      })
      .catch ( (err) => {
        console.log ("FAIL destroy Roles "+err) ;
      })
      ;
  }) ;

  addCommand ("reboot", function (args) {
    if (    ! checkPermissions(args, "doAllOfTheAbove")
       ) {
      args.send ('You do not have permission to do that.') ;
      return ;
    }
    resetBot (args) ;
  }) ;

  addCommand (["housebot?","hb?"], function (args) {
    if (! args.params.length) {
      args.send ("What was the question again ?") ;
      return ;
    }
    let allAnswers             =
                [   "It is certain."
                  , "As I see it, yes."
                  , "Reply hazy, try again"
                  , "Don't count on it."
                  , "It is decidedly so."
                  , "Most likely."
                  , "Ask again later."
                  , "My reply is no."
                  , "Without a doubt."
                  , "Outlook good."
                  , "Better not tell you now."
                  , "My sources say no."
                  , "Yes - definitely."
                  , "Yes."
                  , "Cannot predict now."
                  , "Outlook not so good."
                  , "You may rely on it."
                  , "Signs point to yes."
                  , "Concentrate and ask again."
                  , "Very doubtful."
                ] ;
    args.send (allAnswers [Math.floor(allAnswers.length*Math.random())]) ;
  }) ;

  addCommand ("addrole", function (args) {
    if (    ! checkPermissions(args, "doAllOfTheAbove")
       ) {
      args.send ('You do not have permission to do that.') ;
      return ;
    }
    if (! args.params.length) {
      args.send ("Missing args. Use "+process.env.PREFIX+"addrole <role>") ;
      return ;
    }
    var guild                  = args.guild ;
    var roleInput              = args.params [0] ;
    for (var [key, value] of guild.roles) {
      if (value.name == roleInput) {
        args.send ("Role "+roleInput+" already exists.") ;
        return null ;
      }
    }
    guild
      .createRole ({name:roleInput, permissions:new Array ()})
      .then ( (roles) => {
        args.send ("Created role "+roleInput+".") ;
      })
      .catch(error => console.log(error))
      ;
  }) ;

  addCommand ("giverole", function (args) {
    if (    ! checkPermissions(args, "doAllOfTheAbove")
       ) {
      args.send ('You do not have permission to do that.') ;
      return ;
    }
    if (args.params.length < 2) {
      args.send ("Missing args. Use "+process.env.PREFIX+"giverole <role> <@someone>") ;
      return ;
    }
    var roleInput              = args.params [0] ;
    Roles
      .findOne ({where: {role:roleInput, server_id:args.guildId}})
      .then ( (LeRole) => {
        //console.log ("roles", LeRole) ;
        var member             = args.mentions.first();
        var memberMention;
        if (member !== undefined) {
          memberMention        = "<@!" + member.id + ">";
          //console.log ("In args : \n", args) ;
          var role             = args.guild.roles.find("name", roleInput) ;
          member
            .addRole (role)
            .then ( () => {
              args.send ("Successfully added role "+roleInput+" to "+memberMention) ;
              if (! LeRole) {
                args.send ("WARNING : "+roleInput+" does not have any permission yet.") ;
                args.send ("Run "+process.env.PREFIX+"setpermission <permission> "+roleInput+" to give it one.") ;
              }
            })
            .catch ( (err) => {
              console.error(err) ;
              args.send ("WARNING : role "+roleInput+" does not exist on this server.") ;
            })
            ;
            ; // https://anidiotsguide_old.gitbooks.io/discord-js-bot-guide/content/information/understanding-roles.html
        } else {
          args.send ("Wrong args. Use "+process.env.PREFIX+"giverole <role> <@someone>") ;
        }

      })
      .catch ( (err) => {
        console.log ("FAIL findOne Roles where role: "+roleInput+" => ", err) ;
      }) ;
  }) ;

  addCommand ("negativehouses", function (args) {
    if (   ! checkPermissions(args, "doAllOfTheAbove")
       ) {
      args.send ('You do not have permission to do that.') ;
      return ;
    }
    var params                 = args.params ;
    if (! params.length) {
      args.send ("Missing args. Use "+process.env.PREFIX+"negativehouses <true|false>") ;
      return ;
    }
    var bool                   = params [0] ;
    if (    bool != "true"
         && bool != "false"
       ) {
      args.send ("Wrong args. Use "+process.env.PREFIX+"negativehouses <true|false>") ;
      return ;
    }
    bool                       = bool == "true" ;
    Configuration
      .findOne( {where: {server_id: args.guildId}} )
      .then ( (config) => {
        config.negative_house  = bool ;
        config
          .save ()
          .then(() => {
            console.log ("Set negative_house to "+bool+".");
            args.send("Houses can "+(bool?"":"not ")+"have negative points value.");
          })
          .catch ()
      })
      .catch ( (err) => {
        console.error ("FAIL findOne Configuration on displayleaderboard "+err) ;
      })
      ;
  }) ;

  addCommand ("mandatoryreasons", function (args) {
    if (   ! checkPermissions(args, "doAllOfTheAbove")
       ) {
      args.send ('You do not have permission to do that.') ;
      return ;
    }
    var params                 = args.params ;
    if (! params.length) {
      args.send ("Missing args. Use "+process.env.PREFIX+"mandatoryreasons <true|false>") ;
      return ;
    }
    var bool                   = params [0] ;
    if (    bool != "true"
         && bool != "false"
       ) {
      args.send ("Wrong args. Use "+process.env.PREFIX+"mandatoryreasons <true|false>") ;
      return ;
    }
    bool                       = bool == "true" ;
    Configuration
      .findOne( {where: {server_id: args.guildId}} )
      .then ( (config) => {
        config.mandatory_reasons       = bool ;
        config
          .save ()
          .then(() => {
            console.log ("Set mandatory_reasons to "+bool+".");
            args.send("Reasons now "+(bool?"mandatory":"optional ")+".");
          })
          .catch ()
      })
      .catch ( (err) => {
        console.error ("FAIL findOne Configuration on displayleaderboard "+err) ;
      })
      ;
  }) ;

  addCommand ("debuginfos", function (args) {
    if (    (process.env.NODE_ENV == "production")
         || (process.env.NODE_ENV == "prod")
       ) {
      return ;
    }
    if (   ! checkPermissions(args, "doAllOfTheAbove")
       ) {
      args.send ('You do not have permission to do that.') ;
      return ;
    }
    var debuginfos           =
              "```"+
              "DEBUG INFOS\n"+
              " * CURRENT TIMESTAMP : "+get_time (false)+"\n"+
              " * CURRENT DATE      : "+get_time (true)+"\n"+
              " * GUILD ID          : "+current_server_id+"\n"+
              " * NODE ENV          : "+process.env.NODE_ENV+"\n"+
              " * BOT NAME          : "+process.env.BOT_NAME+"\n"+
              "```" ;
    args.send (debuginfos) ;
  }) ;
});
// catch message
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
  console.log ("In message.content : "+message.content) ;
  runCommand (message) ;
}) ;
// catch error
client.on ("error", (err) => {
  console.error("An error occurred. The error was: ", err) ;
}) ;
//added to a server
client.on ("guildCreate", (guild) => {
  console.log (guild) ;
  Roles
    .findOrCreate ({where: { permission:"doAllOfTheAbove" , role:"Headmaster", server_id:current_server_id } })
    .spread ((roles, created) => {
      console.log ("State "+(created?"created":"found")+".") ;
    })
    ;
  var canCreate              = true ;
  for (var [key, value] of guild.roles) {
    if (value.name == "Headmaster") {
      canCreate              = false ;
      break ;
    }
  }
  if (canCreate)
    guild
      .createRole ({name:'Headmaster', permissions:new Array ()})
      .catch(error => console.log(error))
      ;
}) ;
//removed from a server
client.on ("guildDelete", (guild) => {
    console.log("NOOOOOOOOOOOOOOOOOOO !",) ;
    //remove from guildArray
}) ;

//Logs into discord
client.login (process.env.BOT_TOKEN) ;

console.log ("Starting...") ;

/*
const saltRounds = 10;
const myPlaintextPassword = 's0/\/\P4$$w0rD';
const someOtherPlaintextPassword = 'not_bacon';
bcrypt.hash(myPlaintextPassword, saltRounds, function(err, hash) {
  // Store hash in your password DB.
});
// Load hash from your password DB.
bcrypt.compare(myPlaintextPassword, hash, function(err, res) {
    // res == true
});
bcrypt.compare(someOtherPlaintextPassword, hash, function(err, res) {
    // res == false
});
*/








