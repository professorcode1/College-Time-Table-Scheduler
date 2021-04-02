const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const randomArray = require('array-random');
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const MongoStore = require('connect-mongo');
const app = express();
const http = require("http");
const socketio = require("socket.io")
const server = http.createServer(app);
const io = socketio(server);
var ObjectId = require('mongodb').ObjectID;
const CircularJSON = require("circular-json")
const {
    fork
} = require("child_process");
const util = require('util');
const {
    Worker,
    isMainThread,
    parentPort,
    workerData
} = require('worker_threads');
const {
    json
} = require("body-parser");
require('dotenv').config();

app.set('socketio', io);
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-raghav:" + encodeURIComponent(process.env.MONGOCLUSTERPASS) + "@cluster0.tbblr.mongodb.net/CollegeScheduler?retryWrites=true&w=majority", {
    poolSize: 460,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

app.use(session({
    secret: "You were expecting this string to be a secret used to encrypt cookies, but It was me, DIO!",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: "mongodb+srv://admin-raghav:" + encodeURIComponent(process.env.MONGOCLUSTERPASS) + "@cluster0.tbblr.mongodb.net/CollegeScheduler?retryWrites=true&w=majority"
    })
}));
app.use(passport.initialize());
app.use(passport.session());
io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
});

mongoose.set("useCreateIndex", true);

const courseSchema = new mongoose.Schema({
    courseName: String,
    taughtTo: [mongoose.Types.ObjectId],
    taughtBy: [mongoose.Types.ObjectId],
    periods: [mongoose.Types.ObjectId]
});
const Course = new mongoose.model("course", courseSchema);

const periodSchema = new mongoose.Schema({
    periodName: String,
    parentCourse: mongoose.Types.ObjectId,
    profTaking: mongoose.Types.ObjectId,
    roomUsed: mongoose.Types.ObjectId,
    periodLength: Number,
    periodFrequency: Number,
    groupsAttending: [mongoose.Types.ObjectId],
    periodTime: Number,
    periodAntiTime: [Number],
});
const Period = new mongoose.model("period", periodSchema);

const userSchema = new mongoose.Schema({
    instituteName: {
        type: String,
        required: true
    },
    numberOfDays: {
        type: Number,
        default: 1,
        required: true
    },
    periodsPerDay: {
        type: Number,
        default: 1,
        required: true
    },
    schedule: {
        type: Object,
        default: new Object()
    },
    rooms: {
        type: [new mongoose.Schema({
            roomName: String,
            roomCapacity: Number,
            unAvialability: [Number],
            periodsUsedIn: [mongoose.Types.ObjectId]
        })],
        requied: true,
        default: new Array()
    },
    professors: {
        type: [new mongoose.Schema({
            profName: String,
            coursesTaught: [mongoose.Types.ObjectId],
            periodsTaken: [mongoose.Types.ObjectId],
            unAvialability: [Number]
        })],
        requied: true,
        default: new Array(),
    },
    groups: {
        type: [new mongoose.Schema({
            groupName: String,
            groupQuantity: Number,
            periodsAttended: [mongoose.Types.ObjectId],
            coursesTaken: [mongoose.Types.ObjectId],
            unAvialability: [Number]
        })],
        required: true,
        default: new Array(),
    },
    courses: {
        type: [courseSchema],
        required: true,
        default: new Array(),
    },
    periods: {
        type: [periodSchema],
        required: true,
        default: new Array()
    }
});
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("user", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", (req, res) => res.sendFile(__dirname + "/webPages/index.html"));
app.get("/loginFailed", (req, res) => res.render("message", {
    message: "You password or Username was incorrect. Try again"
}));


app.get("/login", (req, res) => res.sendFile(__dirname + "/webPages/login.html"));
app.post("/login", function (req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, (err) => {
        if (!err) {
            passport.authenticate("local", {
                failureRedirect: "/loginFailed"
            })(req, res, () => {
                res.redirect("/homepage");
            });
        } else {
            console.log(err);
            res.redirect("/");
        }
    });
});

app.get("/register", (req, res) => res.sendFile(__dirname + "/webPages/register.html"));
app.post("/register", (req, res) => {
    User.exists({
        username: req.body.username
    }, (err, usernameTaken) => {
        if (usernameTaken) {
            return res.render("message", {
                message: "Sorry, username taken"
            });
        } else {
            User.register({
                username: req.body.username,
                instituteName: req.body.instituteName
            }, req.body.password, (err, user) => {
                if (!err) {
                    passport.authenticate("local")(req, res, function () {
                        res.redirect("/homepage");
                    });
                } else {
                    console.log(err);
                    res.redirect("/");
                }
            });
        }
    });
});

app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});

app.get("/homepage", (req, res) => {
    if (!req.isAuthenticated())
        return res.redirect("/login");
    return res.sendFile(__dirname + "/webPages/homepage.html");
});

app.get("/parameter", (req, res) => {
    if (!req.isAuthenticated())
        return res.redirect("/login");
    res.render("getParam", {
        days: req.user.numberOfDays,
        periods: req.user.periodsPerDay
    })
});
app.post("/parameter", async (req, res) => {
    if (!req.isAuthenticated())
        return res.redirect("/login");
    const promiseOne = User.updateOne({
        _id: req.user._id
    }, {
        numberOfDays: req.body.days,
        periodsPerDay: req.body.periods
    });
    const promiseTwo = User.updateOne({
        _id: req.user._id
    }, {
        $set: {
            "professors.$[].unAvialability": new Array()
        }
    });
    const promiseThree = User.updateOne({
        _id: req.user._id
    }, {
        $set: {
            "rooms.$[].unAvialability": new Array()
        }
    });
    const promiseFour = User.updateOne({
        _id: req.user._id
    }, {
        $set: {
            "groups.$[].unAvialability": new Array()
        }
    });
    const promiseFive = User.updateOne({
        _id: req.user._id
    }, {
        $set: {
            "periods.$[].periodAntiTime": new Array()
        },
        $set: {
            "periods.$[].periodTime": -1
        }
    });
    await promiseOne;
    await promiseTwo;
    await promiseThree;
    await promiseFour;
    await promiseFive;
    res.redirect("/homepage");
});
//Professor
{
    app.get("/professor", (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        return res.render("getProf", {
            profs: req.user.professors,
            numberOfDays: req.user.numberOfDays,
            periodsPerDay: req.user.periodsPerDay
        });
    });
    app.post("/professor", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        unAvialability = new Array(0);
        for (let loopitrt = 0; loopitrt < req.user.numberOfDays * req.user.periodsPerDay; loopitrt++)
            if (req.body["periodTaken" + String(loopitrt)] === "on")
                unAvialability.push(loopitrt);
        await User.updateOne({
            _id: req.user._id
        }, {
            $push: {
                professors: {
                    profName: req.body.profName,
                    coursesTaught: new Array(0),
                    periodsTaken: new Array(0),
                    unAvialability: unAvialability
                }
            }
        });
        return res.redirect("/professor");
    });
    app.get("/deleteProfessor/:professorId", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        const {
            coursesTaught,
            periodsTaken
        } = req.user.professors.find(prof => prof._id == req.params.professorId);
        //below line removes the professor from the courses that s/he teaches
        const promiseOne = User.updateOne({
            _id: req.user._id,
        }, {
            $pull: {
                "courses.$[element].taughtBy": req.params.professorId
            }
        }, {
            arrayFilters: [{
                "element._id": {
                    $in: coursesTaught
                }
            }]
        });
        //delete the periods assosiated with it
        const promiseTwo = deleteManyPeriods(periodsTaken, req.user)
        //delete the prof 
        const promiseThree = User.updateOne({
            _id: req.user._id
        }, {
            $pull: {
                "professors": {
                    _id: req.params.professorId
                }
            }
        });
        await promiseOne;
        await promiseTwo;
        await promiseThree;
        return res.redirect("/professor");
    });
}
//Groups
{
    app.get("/group", (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        res.render("getGroup", {
            groups: req.user.groups,
            numberOfDays: req.user.numberOfDays,
            periodsPerDay: req.user.periodsPerDay
        });
    });
    app.post("/group", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        unAvialability = new Array(0);
        for (let loopitrt = 0; loopitrt < req.user.numberOfDays * req.user.periodsPerDay; loopitrt++)
            if (req.body["periodTaken" + String(loopitrt)] === "on")
                unAvialability.push(loopitrt);
        await User.updateOne({
            _id: req.user._id
        }, {
            $push: {
                groups: {
                    groupName: req.body.groupName,
                    groupQuantity: req.body.groupQuantity,
                    periodsAttended: new Array(0),
                    unAvialability: unAvialability
                }
            }
        });
        return res.redirect("/group");
    });
    app.get("/deleteGroup/:groupId", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        const {
            coursesTaken,
            periodsAttended
        } = req.user.groups.find(group => group._id == req.params.groupId);
        //below line removes the groups from the courses that it attends
        const promiseOne = User.updateOne({
            _id: req.user._id
        }, {
            $pull: {
                "courses.$[element].taughtTo": req.params.groupId
            }
        }, {
            arrayFilters: [{
                "element._id": {
                    $in: coursesTaken
                }
            }]
        });
        //delete the periods assosiated with it
        const promiseTow = deleteManyPeriods(periodsAttended, req.user);
        //delete the group
        const promiseThree = User.updateOne({
            _id: req.user._id
        }, {
            $pull: {
                "groups": {
                    _id: req.params.groupId
                }
            }
        });
        await promiseOne;
        await promiseTow;
        await promiseThree;
        return res.redirect("/group");
    });
}
//Rooms
{
    app.get("/room", (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        res.render("getRoom", {
            rooms: req.user.rooms,
            numberOfDays: req.user.numberOfDays,
            periodsPerDay: req.user.periodsPerDay
        });
    });
    app.post("/room", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        unAvialability = new Array(0);
        for (let loopitrt = 0; loopitrt < req.user.numberOfDays * req.user.periodsPerDay; loopitrt++)
            if (req.body["periodTaken" + String(loopitrt)] === "on")
                unAvialability.push(loopitrt);
        await User.updateOne({
            _id: req.user._id
        }, {
            $push: {
                rooms: {
                    roomName: req.body.roomName,
                    roomCapacity: req.body.roomCapacity,
                    unAvialability: unAvialability,
                    periodsUsedIn: new Array(0)
                }
            }
        });
        return res.redirect("/room");
    });
    app.get("/deleteroom/:roomId", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        const {
            periodsUsedIn
        } = req.user.rooms.find(room => room._id == req.params.roomId);
        //delete the periods assosiated with it
        const promiseOne = deleteManyPeriods(periodsUsedIn, req.user);
        //delete the room
        const promiseTwo = User.updateOne({
            _id: req.user._id
        }, {
            $pull: {
                "rooms": {
                    _id: req.params.roomId
                }
            }
        });
        await promiseOne;
        await promiseTwo;
        return res.redirect("/room");
    });
}
//Courses
{
    app.get("/course", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        let courseDisplay = new Array(0);
        for (const course of req.user.courses) {
            let taughtBy = new Array(0),
                taughtTo = new Array(0);
            if (course.taughtBy.length == 0 || course.taughtTo.length == 0)
                return res.redirect("/deleteCourse/" + String(course._id));
            for (const professor of course.taughtBy)
                taughtBy.push(req.user.professors.find(prof => String(prof._id) == professor).profName);
            for (const groupId of course.taughtTo)
                taughtTo.push(req.user.groups.find(group => String(group._id) == groupId).groupName);
            courseDisplay.push({
                courseName: course.courseName,
                taughtBy: taughtBy,
                taughtTo: taughtTo,
                _id: course._id
            });
        }
        res.render("getCourse", {
            courseDisplay: courseDisplay,
            groups: req.user.groups,
            profs: req.user.professors
        });
    });
    app.post("/course", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        let taughtBy = new Array(0),
            taughtTo = new Array(0);

        for (const key in req.body)
            if (req.body[key] === "on")
                if (req.user.professors.find(prof => prof._id == key))
                    taughtBy.push(key); //key is of a professor
                else
                    taughtTo.push(key); //key is of a group
        if (taughtTo.length == 0 || taughtBy.length == 0)
            return res.redirect("/course");
        //course is created, but not saved, so that it doesn't create its own collection
        const course = new Course({
            courseName: req.body.courseName,
            taughtTo: taughtTo,
            taughtBy: taughtBy
        });
        const {
            _id: thisCourseId
        } = course;
        //adding the course
        const promiseOne = User.updateOne({
            _id: req.user._id
        }, {
            $push: {
                courses: course
            }
        });
        //update all prof documents to reflect they teach this course
        const promiseTwo = User.updateOne({
            _id: req.user._id
        }, {
            $push: {
                "professors.$[element].coursesTaught": thisCourseId
            }
        }, {
            arrayFilters: [{
                "element._id": {
                    $in: taughtBy
                }
            }]
        });
        //update all groups documents to reflect they learn this course
        const promiseThree = User.updateOne({
            _id: req.user._id
        }, {
            $push: {
                "groups.$[element].coursesTaken": thisCourseId
            }
        }, {
            arrayFilters: [{
                "element._id": {
                    $in: taughtTo
                }
            }]
        });
        const {
            numberOfLectures,
            numberOfTutorials,
            numberOfLabs
        } = req.body;
        await promiseOne;
        await promiseTwo;
        await promiseThree;
        if (numberOfLectures == 0 && numberOfTutorials == 0 && numberOfLabs == 0)
            res.redirect("/course");
        else
            res.redirect("/courseTemplate/" + String(thisCourseId) + "/?numberOfLectures=" + numberOfLectures + "&numberOfTutorials=" + numberOfTutorials + "&numberOfLabs=" + numberOfLabs);
    });
    app.get("/deleteCourse/:courseId", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        const {
            taughtTo,
            taughtBy,
            _id: thisCourseId,
            periods
        } = req.user.courses.find(course => String(course._id) == req.params.courseId);

        //update all profs to reflect they don't teach this course anymore
        const promiseOne = User.updateOne({
            _id: req.user._id
        }, {
            $pull: {
                "professors.$[element].coursesTaught": thisCourseId
            }
        }, {
            arrayFilters: [{
                "element._id": {
                    $in: taughtBy
                }
            }]
        });
        //update all groups to reflect they don't learn this course anymore.
        const promiseTwo = User.updateOne({
            _id: req.user._id
        }, {
            $pull: {
                "groups.$[element].coursesTaken": thisCourseId
            }
        }, {
            arrayFilters: [{
                "element._id": {
                    $in: taughtTo
                }
            }]
        });
        //removing the course itself
        const promiseThree = User.updateOne({
            _id: req.user._id
        }, {
            $pull: {
                "courses": {
                    _id: thisCourseId
                }
            }
        });
        //deleting all periods of the course
        await deleteManyPeriods(periods, req.user);
        await promiseOne;
        await promiseTwo;
        await promiseThree;
        res.redirect("/course");
    });

    app.get("/courseTemplate/:courseId", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        const {
            taughtBy: taughtByIds,
            taughtTo: taughtToIds,
            courseName
        } = req.user.courses.find(course => String(course._id) == req.params.courseId);
        if (taughtByIds.length == 0 || taughtToIds.length == 0)
            return res.redirect("/deleteCourse/" + String(req.params.courseId));
        const
            taughtBy = req.user.professors.filter(prof => taughtByIds.includes(String(prof._id))),
            taughtTo = req.user.groups.filter(group => taughtToIds.includes(String(group._id)));

        res.render("courseTemplate", {
            taughtBy: taughtBy,
            taughtTo: taughtTo,
            rooms: req.user.rooms,
            numberOfDays: req.user.numberOfDays,
            periodsPerDay: req.user.periodsPerDay,
            courseId: req.params.courseId,
            numberOfLectures: Number(req.query.numberOfLectures),
            numberOfTutorials: Number(req.query.numberOfTutorials),
            numberOfLabs: Number(req.query.numberOfLabs),
            courseName: courseName
        });
    });

    app.post("/courseTemplate", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        const {
            courseId,
            numberOfLectures,
            numberOfTutorials,
            numberOfLabs
        } = req.body;

        const course = req.user.courses.find(course => String(course._id) == courseId);
        let promiseOne, promiseTwo, promiseThree;
        if (Number(numberOfLectures) !== 0) {
            let periodArgs = {
                courseId: courseId,
                periodName: (course.courseName + " Lecture "),
                profId: req.body.lecture.profId,
                periodLength: req.body.lecture.periodLength,
                periodFrequency: numberOfLectures,
                roomId: req.body.lecture.roomId,
            };

            for (const groupId of course.taughtTo)
                periodArgs[groupId] = "on";

            promiseOne = createPeriod(periodArgs, req.user);
        }

        if (Number(numberOfTutorials) !== 0)
            for (let lpitrt = 0; lpitrt < course.taughtTo.length; lpitrt++) {
                const {
                    groupId,
                    roomId,
                    profId,
                    periodLength
                } = req.body["tutorial" + String(lpitrt)];

                let periodArgs = {
                    courseId: courseId,
                    periodName: course.courseName + " Tutorial " + req.user.groups.find(group => String(group._id) == groupId).groupName,
                    profId: profId,
                    periodLength: periodLength,
                    periodFrequency: numberOfTutorials,
                    roomId: roomId,
                };

                periodArgs[groupId] = "on";

                promiseTwo = createPeriod(periodArgs, req.user);
            }

        if (Number(numberOfLabs) !== 0)
            for (let lpitrt = 0; lpitrt < course.taughtTo.length; lpitrt++) {
                const {
                    groupId,
                    roomId,
                    profId,
                    periodLength
                } = req.body["lab" + lpitrt];

                let periodArgs = {
                    courseId: courseId,
                    periodName: course.courseName + " Lab " + req.user.groups.find(group => String(group._id) == groupId).groupName,
                    profId: profId,
                    periodLength: periodLength,
                    periodFrequency: numberOfLabs,
                    roomId: roomId,
                };

                periodArgs[groupId] = "on";

                promiseThree = createPeriod(periodArgs, req.user);
            }
        await promiseOne;
        await promiseTwo;
        await promiseThree;
        res.redirect("/course");
    });

    // app.get("/editCourse/:courseId", async (req, res) => {
    //     if (!req.isAuthenticated())
    //         return res.redirect("/login");
    //     const course = req.user.courses.find(course => String(course._id) == req.params.courseId);
    //     if (!course)
    //         return res.send("The course id you sent wasn't linked to any course in the database.");
    //     return res.render("editCourse", {
    //         course: course,
    //         profs: req.user.professors,
    //         groups: req.user.groups
    //     });
    // });

    // app.post("/editCourse/:courseId", async (req, res) => {
    //     //this method is incorrect because it doesn't delete the periods that should not exist.
    //     //Say course C has a group G and has 2 periods P1,P2 of G
    //     //Now if the edit removes G then the periods P1,P2 should be deleted, but this method doesn't do that
    //     //..will add it in the future if the need of it is ever expressed.
    //     if (!req.isAuthenticated())
    //         return res.redirect("/login");
    //     let taughtBy = new Array(0),
    //         taughtTo = new Array(0);
    //     for (const key in req.body)
    //         if (req.body[key] === "on")
    //             if (req.user.professors.find(prof => String(prof._id) == key))
    //                 taughtBy.push(mongoose.Types.ObjectId(key)); //key is of a professor
    //             else
    //                 taughtTo.push(mongoose.Types.ObjectId(key)); //key is of a group
    //     await User.updateOne({
    //         _id: req.user._id,
    //         "courses._id": req.params.courseId
    //     }, {
    //         $set: {
    //             "courses.$.taughtBy": taughtBy,
    //             "courses.$.taughtTo": taughtTo
    //         }
    //     });
    //     return res.redirect("/course");
    // });
}
//Periods
{
    app.get("/period/:courseId", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        const {
            periods: periodIds,
            taughtBy: taughtByIds,
            taughtTo: taughtToIds
        } = req.user.courses.find(course => String(course._id) == req.params.courseId);
        if (taughtByIds.length == 0 || taughtToIds.length == 0)
            return res.redirect("/deleteCourse/" + req.params.courseId);

        let periodDisplay = new Array(0),
            taughtBy = new Array(0),
            taughtTo = new Array(0),
            rooms = req.user.rooms;

        const {
            numberOfDays,
            periodsPerDay
        } = req.user;

        for (const periodId of periodIds) {

            period = req.user.periods.find(period => String(period._id) == periodId);

            groupsAttendingDisplay = new Array(0);
            for (const groupId of period.groupsAttending)
                groupsAttendingDisplay.push(req.user.groups.find(group => String(group._id) == groupId).groupName);

            const {
                roomName: roomUsedDisplay
            } = req.user.rooms.find(room => String(room._id) == period.roomUsed);

            let preferenceString = ""
            if (period.periodTime !== -1) {
                preferenceString = "The period must take place at D" + String(Math.floor(period.periodTime / periodsPerDay) + 1) + "P" + String((period.periodTime % periodsPerDay) + 1);
            } else if (period.periodAntiTime.length !== 0) {
                preferenceString = "The period must not take place at ";
                for (const prefval of period.periodAntiTime)
                    preferenceString += "D" + String(Math.floor(prefval / periodsPerDay) + 1) + "P" + String((prefval % periodsPerDay) + 1) + " , ";
            } else {
                preferenceString = "No special preference.";
            }

            const periodDisplayObject = {
                _id: period._id,
                periodName: period.periodName,
                parentCourse: req.user.courses.find(course => String(course._id) == period.parentCourse).courseName,
                profTaking: req.user.professors.find(prof => String(prof._id) == period.profTaking).profName,
                periodLength: period.periodLength,
                periodFrequency: period.periodFrequency,
                groupsAttending: groupsAttendingDisplay,
                roomUsed: roomUsedDisplay,
                preference: preferenceString
            };

            periodDisplay.push(periodDisplayObject);
        }
        for (const profId of taughtByIds)
            taughtBy.push(req.user.professors.find(prof => String(prof._id) == profId));
        for (const groupId of taughtToIds)
            taughtTo.push(req.user.groups.find(prof => String(prof._id) == groupId));
        res.render("getPeriod", {
            periods: periodDisplay,
            taughtBy: taughtBy,
            taughtTo: taughtTo,
            rooms: rooms,
            numberOfDays: numberOfDays,
            periodsPerDay: periodsPerDay,
            courseId: (req.params.courseId)
        });
    });

    app.post("/addPeriod", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        await createPeriod(req.body, req.user);
        const {
            courseId
        } = req.body;
        res.redirect("/period/" + String(courseId));
    });

    app.get("/deletePeriod/:periodId", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        const period = req.user.periods.find(period => String(period._id) == req.params.periodId);
        const courseId = period.parentCourse;
        await deletePeriod(req.params.periodId, req.user);
        res.redirect("/period/" + String(courseId));
    });
}
//time table
app.get("/generateSchedule", async (req, res) => {
    if (!req.isAuthenticated())
        return res.redirect("/login");
    if (req.user.periods.length == 0)
        return res.render("message", {
            message: "Please make some periods first"
        });
    else {
        console.log(req.user.periods.length, req.user.periods.length == 0)
        res.sendFile(__dirname + "/webPages/waitingPage.html");
        const childProcess = fork("./ScheduleGenerator.js");

        setTimeout(() => childProcess.send({
            "user": CircularJSON.stringify(req.user),
            "io": CircularJSON.stringify(req.app.get('socketio'))
        }), 3000);


        childProcess.on("message", async message => {
            if (message.case == "emit")
                io.emit("message", message.emit);
            if (message.case == "schedule") {
                io.emit("message", {
                    case: "message",
                    message: "schedule complete.Redirecting you shotly"
                });
                io.emit("message", {
                    case: "complete"
                });
                console.log(message.schedule, typeof message.schedule);

                console.log(await User.updateOne({
                    _id: req.user._id
                }, {
                    $set: {
                        schedule: message.schedule
                    }
                }));
            }
        });
    }
});
app.get("/viewSchedules", async (req, res) => {
    const scheduleArray = await User.find({
        schedule: {
            $exists: true
        }
    }, {
        instituteName: 1,
        _id: 1
    });
    res.render("listOfInstitutes", {
        list: scheduleArray
    });
});
app.get("/schedule/:userId", async (req, res) => {
    id = req.params.userId;
    const user = await User.findById(id);
    if (!user)
        return res.render("message", {
            message: "User does not exist"
        });
    let sendTable = new Map();
    const {
        numberOfDays,
        periodsPerDay
    } = user;
    for (const group of user.groups) {
        let table = new Array(numberOfDays);
        for (let i = 0; i < numberOfDays; i++)
            table[i] = new Array(periodsPerDay);
        for (let i = 0; i < numberOfDays; i++)
            for (let j = 0; j < periodsPerDay; j++)
                table[i][j] = "Free Period";
        for (const periodId of group.periodsAttended) {
            const period = user.periods.find(period => String(period._id) == periodId);
            //console.log(periodId,period);
            for (let len = 0; len < Number(period.periodLength); len++)
                for (let freq = 0; freq < Number(period.periodFrequency); freq++) {
                    const time = user.schedule[String(periodId)+"Period"+len+"Freq"+freq];
                    //console.log(user.schedule[String(periodId)+"Period"+len+"Freq"+freq]);
                    table[Math.floor(time / periodsPerDay)][time % periodsPerDay] = period.periodName;
                }
        }
        sendTable.set(group.groupName, table);
    }
    for (const prof of user.professors) {
        let table = new Array(numberOfDays);
        for (let i = 0; i < numberOfDays; i++)
            table[i] = new Array(periodsPerDay);
        for (let i = 0; i < numberOfDays; i++)
            for (let j = 0; j < periodsPerDay; j++)
                table[i][j] = "Free Period";
        for (const periodId of prof.periodsTaken) {
            const period = user.periods.find(period => String(period._id) == periodId);
            //console.log(periodId,period);
            for (let len = 0; len < Number(period.periodLength); len++)
                for (let freq = 0; freq < Number(period.periodFrequency); freq++) {
                    const time = user.schedule[String(periodId)+"Period"+len+"Freq"+freq];
                    //console.log(user.schedule[String(periodId)+"Period"+len+"Freq"+freq]);
                    table[Math.floor(time / periodsPerDay)][time % periodsPerDay] = period.periodName;
                }
        }
        sendTable.set(prof.profName, table);
    }
    //console.log(sendTable);
    res.render("timetable", {
        sendTable: sendTable,
        numberOfDays: numberOfDays,
        periodsPerDay: periodsPerDay
    });
});
app.get("/viewMySchedule", async (req, res) => {
    if (!req.isAuthenticated())
        res.redirect("/login");
    const scheduleExists = User.findById(req.user._id, "schedule");
    if (!scheduleExists)
        res.render("message", {
            message: "make a schedule first"
        });

});
async function deletePeriod(periodId, user) {
    const period = user.periods.find(period => String(period._id) == periodId);

    if (!period)
        return;


    //deletePeriodNode(period);


    //updating the course
    const promiseOne = User.updateOne({
        _id: user._id,
        "courses._id": period.parentCourse
    }, {
        $pull: {
            "courses.$.periods": period._id
        }
    });

    //updating the prof
    const promiseTwo = User.updateOne({
        _id: user._id,
        "professors._id": period.profTaking
    }, {
        $pull: {
            "professors.$.periodsTaken": period._id
        }
    });
    //update the groups
    const promiseThree = User.updateOne({
        _id: user._id
    }, {
        $pull: {
            "groups.$[element].periodsAttended": period._id
        }
    }, {
        arrayFilters: [{
            "element._id": {
                $in: period.groupsAttending
            }
        }]
    });

    //update the room
    const promiseFour = User.updateOne({
        _id: user._id,
        "rooms._id": period.roomUsed
    }, {
        $pull: {
            "rooms.$.periodsUsedIn": period._id
        }
    });
    //delete the period
    await User.updateOne({
        _id: user._id
    }, {
        $pull: {
            "periods": {
                _id: period._id
            }
        }
    });
    await promiseOne;
    await promiseTwo;
    await promiseThree;
    await promiseFour;
}
async function createPeriod(periodArgs, user) {
    const {
        numberOfDays,
        periodsPerDay
    } = user;
    const {
        courseId,
        periodName,
        profId,
        periodLength,
        periodFrequency,
        roomId,
    } = periodArgs;
    let groupsAttending = new Array(0);

    for (const group of user.groups)
        if (periodArgs[group._id] === "on")
            groupsAttending.push(mongoose.Types.ObjectId(group._id));


    let periodObject = {
        periodName: periodName,
        parentCourse: mongoose.Types.ObjectId(courseId),
        profTaking: mongoose.Types.ObjectId(profId),
        periodLength: Number(periodLength),
        periodFrequency: Number(periodFrequency),
        groupsAttending: groupsAttending,
        roomUsed: mongoose.Types.ObjectId(roomId)
    }
    if (Number(periodFrequency) == 1) {
        if (periodArgs.specifyTime && periodArgs.timeSpeicifiedDay && periodArgs.timeSpeicifiedPeriod) {
            if (Number(periodArgs.timeSpeicifiedPeriod) + Number(periodLength) <= periodsPerDay + 1) {
                const periodTime = periodsPerDay * (Number(periodArgs.timeSpeicifiedDay) - 1) + Number(periodArgs.timeSpeicifiedPeriod) - 1;
                periodObject.periodTime = periodTime;
                periodObject.periodAntiTime = new Array(0);
            } else {
                periodObject.periodTime = -1;
                periodObject.periodAntiTime = new Array(0);
                console.log("createPeriod function WARNING:The period just made didn't have it's time set as that time was impossible.");
            }
        } else {
            let periodAntiTime = new Array(0);
            for (let loopitrt = 0; loopitrt < numberOfDays * periodsPerDay; loopitrt++)
                if (periodArgs["antiTimeSpecified" + String(loopitrt)] === "on")
                    periodAntiTime.push(loopitrt);
            periodObject.periodTime = -1;
            periodObject.periodAntiTime = periodAntiTime;
        }
    } else {
        periodObject.periodTime = -1;
        periodObject.periodAntiTime = new Array(0);
    }

    const period = new Period(periodObject);
    const {
        _id: thisPeriodId
    } = period;

    //await addPerioddNode(period);

    //updating the course
    const promiseOne = User.updateOne({
        _id: user._id,
        "courses._id": courseId
    }, {
        $push: {
            "courses.$.periods": thisPeriodId
        }
    });
    //updating the porf
    const promiseTwo = User.updateOne({
        _id: user._id,
        "professors._id": profId
    }, {
        $push: {
            "professors.$.periodsTaken": thisPeriodId
        }
    });

    //update the groups 
    const promiseThree = User.updateOne({
        _id: user._id,
    }, {
        $push: {
            "groups.$[element].periodsAttended": thisPeriodId
        }
    }, {
        arrayFilters: [{
            "element._id": {
                $in: groupsAttending
            }
        }]
    });
    //update the room
    const promiseFour = User.updateOne({
        _id: user._id,
        "rooms._id": roomId
    }, {
        $push: {
            "rooms.$.periodsUsedIn": thisPeriodId
        }
    });
    //update the periods array
    await User.updateOne({
        _id: user._id
    }, {
        $push: {
            "periods": period
        }
    });
    await promiseFour;
    await promiseThree;
    await promiseTwo;
    await promiseOne;
    return period;
}
async function deleteManyPeriods(periodIds, user) {
    //updating the course
    const promiseOne = User.updateOne({
        _id: user._id
    }, {
        $pull: {
            "courses.$[].periods": {
                $in: periodIds
            }
        }
    });

    //updating the prof
    const promiseTwo = User.updateOne({
        _id: user._id
    }, {
        $pull: {
            "professors.$[].periodsTaken": {
                $in: periodIds
            }
        }
    });
    //update the groups
    const promiseThree = User.updateOne({
        _id: user._id
    }, {
        $pull: {
            "groups.$[].periodsAttended": {
                $in: periodIds

            }
        }
    });

    //update the room
    const promiseFour = User.updateOne({
        _id: user._id
    }, {
        $pull: {
            "rooms.$[].periodsUsedIn": {
                $in: periodIds
            }
        }
    });
    //delete the period
    await User.updateOne({
        _id: user._id
    }, {
        $pull: {
            "periods": {
                _id: {
                    $in: periodIds
                }
            }
        }
    });
    await promiseOne;
    await promiseTwo;
    await promiseThree;
    await promiseFour;
}

var port_number = process.env.PORT || 3000;
//server.listen(process.env.PORT || 3000);
server.listen(port_number, () => {
    console.log("Server started on " + port_number);
});