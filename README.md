# **College Scheduler**

This the software engineering project made by me as the semester 4 engineering project. Its solves the common university problem of having to perfrom tedius scheduling.

To use this, follow the below steps.

- Git clone this repo
- delete the build folder in the project(optional, however once you delete this folder the existence of this folder can be used to check if the build command has worked properly, as if it has the build folder will reappear)
- Make sure you have node installed
- Make sure you have Python 3.6(or above),make and GCC installled(for unix/linux)
- for any other OS refer here to know the dependencies https://www.npmjs.com/package/node-gyp
- run `npm -g node-gyp` to get the gyp compiler
- run `node-gyp configure` in terminal to configure it to your machine
- run `npm install` to get all the node modules as well as generate the build files
- cut and paste this build folder into the node_modules folder
- have a mongod server on your local machine up and running
- replace the string `"mongodb+srv://admin-raghav:" + encodeURIComponent(process.env.MONGOCLUSTERPASS) + "@cluster0.tbblr.mongodb.net/CollegeScheduler?retryWrites=true&w=majority"` on lines 41 and 52 with `"mongodb://localhost:27017/collegeScheduler"`
- run `node app.js` to run the application
- open any browser and goto `localhost:3000` to use the application.

It can be tedius to make your own dataset. So to use the dataset I used, the databaseClone folder has the entire database in JSON and BSON format. Use the following command in the mongodb shell
`mongorestore --drop -d collegeScheduler -c users /path/to/user.bson`.
Now use the username: raghkum2000@gmail.com and password:12345 to play with the thapar even semester 2020-2021 dataset.

The application currently lacks a front-end and also the `/generateSchedule` page does not re-route the user once the schedule is generate as it claims. However it does update the database. So once the website says "rerouting you shortly" goto the `http://localhost:3000/viewMySchedule` manually.

* * *

Here's how the application works.

* * *

## Database

In the app.js file, only the logic for interacting with the database is written. It took 1200 lines total to implement the database queries. The database schema is as follows.

- A `user` constitues of 3 types of resources. `Professors`, `Rooms` and `groups`.
- Each resource can be assosiated ban-time. Times where said resource cannot have/be used for a period. Professor who need to go home early, rooms reserved for other periods. Lunch break of student groups.
- `User` also constitutes `courses` which are a combination of `professors`(those who teach it) and `groups`(those who learn it). A course is not useful for the generation of the schedule however it helps the user organise and query the data more easily.
- A `course` is composed of `periods`. A period can have a set-time i.e. when a period needs to happen. For example, egnineering drawing tutorial needs to happen on monday morning period 2 as that is the only time the patial professor is available. Also if you choose not to assign a set-time to a period, you can also assign ban-time's. These define when a period can't happen. I.e. manufacturing lab cannot happen before lunch as the students may pass out from hunger. You can also choose not to define either.
- If the `user` generates a schedule then said user also has one schedule object. A JSON object that maps all periods to a number(day and time) such that they don't have any conflicting resources and don't break the contraints set by the set-time/ban-time.

The database queries should be done in the form of procedures and functions implemented inside the database(instead of in the application). I didn't know this when I made this project as it was long before semester four started and hence I didn't yet start studying DBMS. This is also why I used MongoDB instead of MySQL which would have been the far more sensible choise (226 out of the 1278 lines in app.js are so that resources can be deletes without compromising the database integrity. To have the same effect in MySQL the only thing that would have to be done was to include `ON DELETE CASCADE` for all primary keys in the schema of all the relations). At the time of this project I simply did not know SQL.

* * *

## Generate Schedule

Once a user goes to the `/generateSchedule` route, the user performs a two-way handshake witht the backend using `socketio` (or simply, has a full-duplex connection with the backend) to get real-time updates on the schedule generation process. Now since JS and by extentions node is a single threaded(kindof) generating the schedules in the same JS process will completely block the JS application.

To prevent this, the actual generation is done by forking ScheduleGenerator.js to create a child process, which effectively is another node.js process. ScheduleGenerator.js performs the below algorithm.
To actually generate the schedule the following algorithm is followed

- For each period a node in the graph is initalised.
- For each professor an edge in initalised b/w all the periods taught by the professor
- For each group, an edge is initalised b/w all the periods attended by the group
- For each room an edge is initalised if the period takes place in that room.
- The number b/w \[1 , number of day * number of periods\]. So say you the university operates for 8 hours and from monday to friday then for each number in the set {1,5 * 8} = {1,40} a node is initalised.
- For each set time an edge b/w all other times and the corresponding period is intialised. So if set-time is tuesday hour 5 for period p, then node 1 * 8 + 5 = node 13, then p will have an edge initalised for all nodes in {1,40} except 13.
- For each ban time the node b/w the time and the corresponding period is intialised. So if ban-time is friday hour 2 for period p, then node 4 * 8 + 5 = node 37 and p have an edge intialised.
- One last contraint is applied. The manufacturing lab is 3 hours long, which means that it cannot be started at periods 7,8 as this would mean that a part of the period will take place the next day. To account for this fact as well, edges are drawn b/w such times and periods which go over one hour.

Now that the graph is generated it is colored using a Genetic Algorithm.

There are a hugh number of papers covering how to implement GA to color graphs so I wont cover it here. The algorithm runs in C++ which is attached to the project using node-gyp. node-gyp generates an ABI(Application Binary Interface). You can see the implementation in Cpp folder.

Once a coloring is generated, the child process exits and the database is updated to reflect that the user has a schedule.
