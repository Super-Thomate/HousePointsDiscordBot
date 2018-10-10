# House Points Discord Bot
## Requires:  
* Node.js v8 or greater, http://nodejs.org/  
  
## Upon downloading, or cloning  
Search up a tutorial on how to open a terminal in your Operating System.  
  
Open up the terminal and make it go to the directory where you downloaded the folder. (Search up how to if you need to.)  
Type: `npm install` in the terminal, press enter and wait. You can ignore things that say WARN, if it says ERROR tell me.  
Wait. This will install the required modules it needs to run.  
  
In your preferred folder viewer (Like Windows Explorer, not the browser but the file browser).  
Goto this folder.  
Create a .env file (.env.dist shows you how to configure some parameters).  
  
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
Copy the username, but without anything after the #, and put it in the .env file `BOT_NAME` property.
Press the click to reveal next to Token.  
Do not show this token to anyone else because they could do a good amount of damaged if they got it.  
Copy the token and put it in .env `BOT_TOKEN`.  
That's all you have to do for now.  
Make sure to save the changes.

You can leave `PREFIX` as the same value, this makes so commands have to be run with that before them.  
  
To actually start the bot!  

https://discordapp.com/oauth2/authorize?client_id=CLIENT_ID_HERE&scope=bot  
Copy that link, and replace CLIENT_ID_HERE with the client ID on your bot page.  

Go to your terminal in the folder and type `node index.js` then press enter.  
To stop it (If on your actual computer) press CTRL+C  
That will run the bot, and it should join.  

## Roles
Roles are required to perfom some actions (adding a house, giving points, etc.).
* takePoints :
Users with this permission can take points away to any house in competition.
* givePoints :
Users with this permission can give points away to any house in competition.
* setPoints :
Users with this permission can set any value to points of any house in competition. They also can reset all points to 0.
* addHouse :
Users with this permission can add houses, and modify their attribute.
* doAllOfTheAbove :
Users with this permission can do everything listed above, but also can change settings of the competition and set permissions to any roles.

## Commands  
All the commands listed below are run in the chat.

The command's prefix is defined in the .env file `PREFIX` property, in all of this file, we will use `/` as the prefix.

### Set a permission
Permissions are linked to role on your Discord server.
To add a specific permission to a specific role, run `/setpermission <permission> <role>`.

In order to do that you must have a role linked to  `doAllOfTheAbove`.

> When initializing the bot, it will create the default entry (doAllOfTheAbove, Headmaster).
> You need to give yourself the role Headmaster to be able to set other permissions.

> Note : for one permission you can have as many roles as you want.

### List all available permissions
If you wish to know every permissions needed in the bot, you may run `/listpermissions`.
This will display a list of all permissions currently available, and a short description on its scope.

### List all permissions entry
If you wish to know for every permissions the roles that are set, you may run `/showpermissions`.
This will display a list of all permissions currently available, and the role that are associated with it.

### Add house
You first need to create houses.
In order to do that you must have a role linked to `addhouse` or `doAllOfTheAbove`.

Run `/addhouse <housename>` in a channel that your bot can access.

**Example**
   ```
   /addhouse Gryffindor
   ```
> This will create house Gryffindor.
>
> Note: House names are not case sensistive.

Then, you need to run `/sethouse <housename> <attribute> <value>` in order to set your house color, icon and aliases.

### Set house color
When displaying the points earned or lost by a house, the bot will embed them with the house color. By default, this color is black, but you can change it in order to fit your fantasy.

You can set a house color using hexadecimal value (between `000000` and `ffffff`).

**Example**
   ```
   /sethouse Gryffindor color FF0000
   ```
> This will set the color of house Gryffindor to FF0000 (100% red).

### Set house icon
When displaying the points earned or lost by a house, the bot will also display an icon to represent your house. By default, this icon is empty, but you can change it in order to fit your fantasy.

You can set a house icon using an url to your assets.

**Example**
   ```
   /sethouse Gryffindor icon https://www.myimage.com/myicon.png
   ```
> This will set the icon of house Gryffindor to whatever image are at this adress (nothing in my case).

### Set house aliases
When you want to give or take points from a house, you need to call the house by one of this aliases. By default, you have one alias, the name of the house itself.

Note: If you wish to set multiple aliases, you may separate them with a comma.

**Example** 
   ```
   /sethouse alias gryff,g,red
   ```
> This will add gryff, g and red to the aliases of a house.
>
> Its aliases are now :
> * gryffindor (default value)
> * gryff
> * g
> * red
>
> Note: Aliases are case sensistive.

### Setting up the competition
When you are happy with your houses, you may start the points counting.

Run `/pointssetup` to initialize the bot. It will take all houses define on your server and start the competition between them.

In order to do that you must have a role linked to `doAllOfTheAbove`.

**Example** 
   ```
   /pointssetup
   ```
> The competition will start with all the houses you have.
>
> If no house is defined, the competition will not start, and you will be remembered to add house.

### Manage points
You can give, take or set points (according to your role) to any of the houses defined in your competition.

The role `doAllOfTheAbove` can give, take and set points. If you whish to restrict actions you can use `givePoints`, `takePoints` and `setPoints`.

**Examples** 
   ```
   /gryffindor give 100
   ```
> This would give gryffindor 100 points.  
  
   ```
   /ravenclaw take 100
   ```
> This would take 100 points from ravenclaw.  
  
   ```
   /hufflepuff set 100
   ```
> This would set hufflepuff's points to exactly one hundred.  

   ```
   /slytherin give 100
   ``` 
> is the same as  

   ```
   /s give 100
   ``` 
### Points leaderboard
The points leaderboard recaps the points of every house in competition and rank them from the highest score to the lowest.

In order to display it, you must run `/pointslog` in the channel you want (you must have a role linked to `doAllOfTheAbove`).
From now on, every time someone give, take or set points from a house, the leaderboard will be updated in this channel, and a log of the action on the points will be display in it too.

At any time, you can run the `/points` command to show the leaderboard.

By default the points leaderboard is shown, but you can toggle it with `displayleaderboard <true|false>` (it will either display or not the leaderboard).

### Reset all the points
You can reset all the houses to 0 points using `/pointsreset`.
In order to do that you must have a role linked to `setPoints` or `doAllOfTheAbove`.

All the houses will have their points number back to 0.


### Infos on houses
Run `/infos` in order to get informations on all houses.

Run `/infos <housename>` in order to get informations on the house `<housename>`.


### Set max and min points
Run `/maxpoints <integer>` to set maximum points one can give or take to `<integer>`.

Run `/minpoints <integer>` to set minimum points one can give or take to `<integer>`.

The maximum should always be greater or equal than the minimum.

### Delete house
Run `/deletehouse <housename>` to delete house `<housename>`.

In order to do that you must have a role linked to `addHouse` or `doAllOfTheAbove`.

### Delete alias
Run `/deletealias <housename> <alias>` to delete alias `<alias>` for house `<housename>`.

In order to do that you must have a role linked to `addHouse` or `doAllOfTheAbove`.

Note: If you wish to delete multiple aliases, you may separate them with a comma.

### Delete permission
Run `/deletehouse <housename>` to delete house `<housename>`.

In order to do that you must have a role linked to `addHouse` or `doAllOfTheAbove`.

### Reboot
Run `/reboot` to reboot the bot.

In order to do that you must have a role linked to `doAllOfTheAbove`.

### Add Role
Run `/addrole <role>` to add the role `<role>` to the server.

In order to do that you must have a role linked to `doAllOfTheAbove`.

### Give Role
Run `/giverole <role> <@someone>` to give the role `<role>` to `<@someone>`.

In order to do that you must have a role linked to `doAllOfTheAbove`.