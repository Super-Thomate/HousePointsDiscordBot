# Discord Hogwarts Point Bot  
## Requires:  
* Node.js 6.0 or greater, http://nodejs.org/  
  
## Upon downloading, or cloning  
Search up a tutorial on how to open a terminal in your Operating System.  
  
Open up the terminal and make it go to the directory where you downloaded the folder. (Search up how to if you need to.)  
Type: `npm install` in the terminal, press enter and wait. You can ignore things that say WARN, if it says ERROR tell me.  
Wait. This will install the required modules it needs to run.  
  
In your preferred folder viewer (Like Windows Explorer, not the browser but the file browser).  
Goto this folder and goto /JSON/ inside of it.  
Rename the file named 'example_config.json' to 'config.json'.  
  
Inside that you will have to do several things. So open it in your favorite text editor. Like notepad.  
I recommend notepad++. It works much better.

### finding your bot token.  
Click New App in https://discordapp.com/developers/applications/me  
Login if you have to.  
Type in a name for the app.  
Type a description, if you want.  
You can also select an app icon, if you want.  
  
![The app page](http://i.imgur.com/r90Vorg.png)  
  
Congrats. You now have an app, but it is still not a bot.  
Press the "Create a Bot User" button. This will make it an actual bot.  
![Create a Bot User button](http://i.imgur.com/LU9mgMK.png)  
  
You will see this: ![App Bot User area](http://i.imgur.com/C8SCoed.png).  
Copy the username, but without anything after the #, and put it in the config file `botName` property.  
Press the click to reveal next to Token.  
Do not show this token to anyone else because they could do a good amount if they got it.  
Copy the token and put it in config.json `botToken` spot.  
That's all you have to do for now.  
Make sure to save the changes.

You can leave `commandsBegin` as the same value, this makes so commands have to be run with that before them.  
  
To actually start the bot!  

https://discordapp.com/oauth2/authorize?client_id=CLIENT_ID_HERE&scope=bot  
Copy that link, and replace CLIENT_ID_HERE with the client ID on your bot page.  

Go to your terminal in the folder and type `node index.js` then press enter.  
To stop it (If on your actual computer) press CTRL+C  
That will run the bot, and it should join.  
  
## Commands  
These are run in the chat.  
`/gryffindor give 100`  
This would give gryffindor 100 points.  
  
`/ravenclaw take 100`  
This would take 100 points from ravenclaw, points do not go into the negatives.  
  
`/hufflepuff set 100`  
This would set hufflepuff's points to exactly one hundred.  
  
Houses, and what they can be shortened as.  
gryffindor, gryff, griff, g
hufflepuff, huff, puff, h
ravenclaw, raven, claw, r
slytherin, slyther, slither, s
  
`/slytherin add 50`  
is the same as  
`/s add 50`  
  