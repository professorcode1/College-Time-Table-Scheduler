const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const graph = require("graph");
const io = require('console-read-write');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.set("view engine", "ejs");

mongoose.connect("mongodb://localhost:27017/collegeScheduler", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
//mongooseObjects
const systemParamSchema = new mongoose.Schema({
    numberOfDays: Number,
    periodsPerDay: Number
});
const SystemParam = mongoose.model("systemParam", systemParamSchema);

const roomSchema = new mongoose.Schema({
    roomName: String,
    roomCapacity: Number,
    unAvialability: [Number],
    periodsUsedIn: [mongoose.Types.ObjectId]
});
const Room = mongoose.model("room", roomSchema);

const profSchema = new mongoose.Schema({
    profName: String,
    coursesTaught: [mongoose.Types.ObjectId],
    periodsTaken: [mongoose.Types.ObjectId],
    unAvialability: [Number]
});
const Prof = mongoose.model("prof", profSchema);

const groupSchema = new mongoose.Schema({
    groupName: String,
    groupQuantity: Number,
    periodsAttended: [mongoose.Types.ObjectId],
    coursesTaken: [mongoose.Types.ObjectId],
    unAvialability: [Number]
});
const Group = mongoose.model("group", groupSchema);

const courseSchema = new mongoose.Schema({
    courseName: String,
    taughtTo: [mongoose.Types.ObjectId],
    taughtBy: [mongoose.Types.ObjectId],
    periods: [mongoose.Types.ObjectId]
});
const Course = mongoose.model("course", courseSchema);

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
    periodColor: {
        type: Number,
        default: -1,
        required: true
    }
});
const Period = mongoose.model("period", periodSchema);

app.get("/", async (req, res) => {
    if ((await SystemParam.find()).length === 0)
        res.render("getParam", {
            firstEntry: true,
            days: -1,
            periods: -1
        });
    else {
        const {
            numberOfDays,
            periodsPerDay
        } = (await SystemParam.find())[0];
        res.render("getParam", {
            firstEntry: false,
            days: numberOfDays,
            periods: periodsPerDay
        });
    }
});


app.get("/systemParams", async (req, res) => {
    await SystemParam.deleteMany();
    await Prof.updateMany({}, {
        unAvialability: new Array(0)
    });
    await Room.updateMany({}, {
        unAvialability: new Array(0)
    });
    await Group.updateMany({}, {
        unAvialability: new Array(0)
    });
    const periods = await Period.find();
    for (const period in periods)
        await deletePeriod(period._id);
    res.redirect("/");
});

app.post("/systemParams", async (req, res) => {
    if (req.body.numberOfDays && req.body.periodsPerDay) {
        await SystemParam.deleteMany();
        await (new SystemParam({
            numberOfDays: req.body.numberOfDays,
            periodsPerDay: req.body.periodsPerDay
        })).save();
    }
    intialiseGraph();
    res.redirect("/");
});
//Professors 
{
    app.get("/getProf", async (req, res) => {
        const profs = await Prof.find();
        const {
            numberOfDays,
            periodsPerDay
        } = (await SystemParam.find())[0];
        res.render("getProf", {
            profs: profs,
            numberOfDays: numberOfDays,
            periodsPerDay: periodsPerDay
        });
    });

    app.post("/deleteProf", async (req, res) => {
        const _id = mongoose.Types.ObjectId(req.body.profId);
        const {
            coursesTaught,
            periodsTaken
        } = await Prof.findById(_id);
        for (const courseId of coursesTaught) {
            const {
                taughtBy: updateCourseTaughtBy
            } = await Course.findById(courseId);
            updateCourseTaughtBy.splice(updateCourseTaughtBy.indexOf(String(_id)), 1);
            await Course.updateOne({
                _id: courseId
            }, {
                taughtBy: updateCourseTaughtBy
            });
        }
        for (const periodId of periodsTaken)
            await deletePeriod(periodId);
        await Prof.deleteOne({
            _id,
            _id
        });
        res.redirect("/getProf");
    });

    app.post("/addProf", async (req, res) => {
        unAvialability = new Array(0);
        const {
            numberOfDays,
            periodsPerDay
        } = (await SystemParam.find())[0];
        for (let loopitrt = 0; loopitrt < numberOfDays * periodsPerDay; loopitrt++)
            if (req.body["periodTaken" + String(loopitrt)] === "on")
                unAvialability.push(loopitrt);
        await (new Prof({
            profName: req.body.profName,
            coursesTaught: new Array(0),
            periodsTaken: new Array(0),
            unAvialability: unAvialability
        })).save();
        res.redirect("/getProf");
    });
}
//Groups
{
    app.get("/getGroup", async (req, res) => {
        const groups = await Group.find();
        const {
            numberOfDays,
            periodsPerDay
        } = (await SystemParam.find())[0];
        res.render("getGroup", {
            groups: groups,
            numberOfDays: numberOfDays,
            periodsPerDay: periodsPerDay
        });
    });

    app.post("/deleteGroup", async (req, res) => {
        const _id = mongoose.Types.ObjectId(req.body.groupId);
        const {
            coursesTaken,
            periodsAttended
        } = await Group.findById(_id);
        for (const courseId of coursesTaken) {
            const {
                taughtTo: updateCourseTaughtTo
            } = await Course.findById(courseId);
            updateCourseTaughtTo.splice(updateCourseTaughtTo.indexOf(String(_id)), 1);
            await Course.updateOne({
                _id: courseId
            }, {
                taughtTo: updateCourseTaughtTo
            });
        }
        for (const periodId of periodsAttended)
            await deletePeriod(periodId);
        await Group.deleteOne({
            _id,
            _id
        });
        res.redirect("/getGroup");
    });

    app.post("/addGroup", async (req, res) => {
        unAvialability = new Array(0);
        const {
            numberOfDays,
            periodsPerDay
        } = (await SystemParam.find())[0];
        for (let loopitrt = 0; loopitrt < numberOfDays * periodsPerDay; loopitrt++)
            if (req.body["periodTaken" + String(loopitrt)] === "on")
                unAvialability.push(loopitrt);
        await (new Group({
            groupName: req.body.groupName,
            groupQuantity: req.body.groupQuantity,
            periodsAttended: new Array(0),
            unAvialability: unAvialability
        })).save();
        res.redirect("/getGroup");
    });
}
//Rooms
{
    app.get("/getRoom", async (req, res) => {
        const rooms = await Room.find();

        const {
            numberOfDays,
            periodsPerDay
        } = (await SystemParam.find())[0];

        res.render("getRoom", {
            rooms: rooms,
            numberOfDays: numberOfDays,
            periodsPerDay: periodsPerDay
        });
    });

    app.post("/deleteRoom", async (req, res) => {
        const {
            periodsUsedIn
        } = await Room.findById(req.body.roomId);

        for (const periodId of periodsUsedIn)
            await deletePeriod(periodId);

        await Room.deleteOne({
            _id: req.body.roomId
        });
        res.redirect("/getRoom");
    });

    app.post("/addRoom", async (req, res) => {
        unAvialability = new Array(0);
        const {
            numberOfDays,
            periodsPerDay
        } = (await SystemParam.find())[0];

        for (let loopitrt = 0; loopitrt < numberOfDays * periodsPerDay; loopitrt++)
            if (req.body["periodTaken" + String(loopitrt)] === "on")
                unAvialability.push(loopitrt);

        await (new Room({
            roomName: req.body.roomName,
            roomCapacity: req.body.roomCapacity,
            unAvialability: unAvialability,
            periodsUsedIn: new Array(0)
        })).save();
        res.redirect("/getRoom");
    });
}
//Courses
{
    app.get("/getCourse", async (req, res) => {
        const courses = await Course.find();
        let courseDisplay = new Array(0),
            groups = await Group.find(),
            profs = await Prof.find();
        for (const course of courses) {
            let taughtBy = new Array(0),
                taughtTo = new Array(0);
            for (const professor of course.taughtBy)
                taughtBy.push((await Prof.findById(professor)).profName);
            for (const group of course.taughtTo)
                taughtTo.push((await Group.findById(group)).groupName);
            courseDisplay.push({
                courseName: course.courseName,
                taughtBy: taughtBy,
                taughtTo: taughtTo,
                _id: course._id
            });
        }
        res.render("getCourse", {
            courseDisplay: courseDisplay,
            groups: groups,
            profs: profs
        });
    });

    app.get("/deleteCourse/:courseId", async (req, res) => {
        const {
            taughtTo,
            taughtBy,
            _id: thisCourseId,
            periods
        } = await Course.findById(mongoose.Types.ObjectId(req.params.courseId));

        for (const profId of taughtBy) {
            let {
                coursesTaught: updatedCoursesTaught
            } = await Prof.findById(profId);

            updatedCoursesTaught.splice(updatedCoursesTaught.indexOf(thisCourseId), 1);

            await Prof.updateOne({
                _id: profId
            }, {
                coursesTaught: updatedCoursesTaught
            });
        }
        for (const groupId of taughtTo) {
            let {
                coursesTaken: updatedCoursesTaken
            } = await Group.findById(groupId);

            updatedCoursesTaken.splice(updatedCoursesTaken.indexOf(thisCourseId), 1);

            await Group.updateOne({
                _id: groupId
            }, {
                coursesTaken: updatedCoursesTaken
            });
        }
        for (const periodId of periods)
            await deletePeriod(periodId);

        await Course.deleteOne({
            _id: mongoose.Types.ObjectId(req.params.courseId)
        });
        res.redirect("/getCourse");
    });

    app.post("/addCourse", async (req, res) => {
        let taughtBy = new Array(0),
            taughtTo = new Array(0);

        for (const key in req.body)
            if (req.body[key] === "on")
                if (await Prof.exists({
                        _id: mongoose.Types.ObjectId(key)
                    }))
                    taughtBy.push(mongoose.Types.ObjectId(key)); //key is of a professor
                else
                    taughtTo.push(mongoose.Types.ObjectId(key)); //key is of a group

        const {
            _id: thisCourseId,
        } = await (new Course({
            courseName: req.body.courseName,
            taughtTo: taughtTo,
            taughtBy: taughtBy
        })).save();

        for (const profId of taughtBy) {
            let {
                coursesTaught: updatedCoursesTaught
            } = await Prof.findById(profId);
            updatedCoursesTaught.push(thisCourseId);
            await Prof.updateOne({
                _id: profId
            }, {
                coursesTaught: updatedCoursesTaught
            });
        }

        for (const groupId of taughtTo) {
            let {
                coursesTaken: updatedCoursesTaken
            } = await Group.findById(groupId);
            updatedCoursesTaken.push(thisCourseId);
            await Group.updateOne({
                _id: groupId
            }, {
                coursesTaken: updatedCoursesTaken
            });
        }

        const {
            numberOfLectures,
            numberOfTutorials,
            numberOfLabs
        } = req.body;

        if (numberOfLectures == 0 && numberOfTutorials == 0 && numberOfLabs == 0)
            res.redirect("/getCourse");
        else
            res.redirect("/courseTemplate/" + String(thisCourseId) + "/?numberOfLectures=" + numberOfLectures + "&numberOfTutorials=" + numberOfTutorials + "&numberOfLabs=" + numberOfLabs);
    });

    app.get("/courseTemplate/:courseId", async (req, res) => {
        const {
            taughtBy: taughtByIds,
            taughtTo: taughtToIds,
            courseName
        } = await Course.findById(req.params.courseId);

        let
            taughtBy = new Array(0),
            taughtTo = new Array(0),
            rooms = await Room.find();

        const {
            numberOfDays,
            periodsPerDay
        } = (await SystemParam.find())[0];
        for (const profId of taughtByIds)
            taughtBy.push(await Prof.findById(profId));
        for (const groupId of taughtToIds)
            taughtTo.push(await Group.findById(groupId));
        res.render("courseTemplate", {
            taughtBy: taughtBy,
            taughtTo: taughtTo,
            rooms: rooms,
            numberOfDays: numberOfDays,
            periodsPerDay: periodsPerDay,
            courseId: (req.params.courseId),
            numberOfLectures: Number(req.query.numberOfLectures),
            numberOfTutorials: Number(req.query.numberOfTutorials),
            numberOfLabs: Number(req.query.numberOfLabs),
            courseName: courseName
        });
    });

    app.post("/courseTemplate", async (req, res) => {
        const {
            courseId,
            numberOfLectures,
            numberOfTutorials,
            numberOfLabs
        } = req.body;

        const course = await Course.findById(courseId);

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

            await createPeriod(periodArgs);
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
                    periodName: (course.courseName + " Tutorial " + (await Group.findById(groupId)).groupName),
                    profId: profId,
                    periodLength: periodLength,
                    periodFrequency: numberOfTutorials,
                    roomId: roomId,
                };

                periodArgs[groupId] = "on";

                await createPeriod(periodArgs);
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
                    periodName: (course.courseName + " Lab " + (await Group.findById(groupId)).groupName),
                    profId: profId,
                    periodLength: periodLength,
                    periodFrequency: numberOfLabs,
                    roomId: roomId,
                };

                periodArgs[groupId] = "on";

                await createPeriod(periodArgs);
            }
        res.redirect("/getCourse");
    });

    app.get("/updateCourse/:courseId", async (req, res) => {
        const course = await Course.findById(req.params.courseId);
        if (!course)
            res.send("The course id you sent wasn't linked to any course in the database.");
        else {
            const profs = await Prof.find();
            const groups = await Group.find();
            res.render("updateCourse", {
                course: course,
                profs: profs,
                groups: groups
            });
        }
    });

    app.post("/updateCourse/:courseId", async (req, res) => {
        let taughtBy = new Array(0),
            taughtTo = new Array(0);
        for (const key in req.body)
            if (req.body[key] === "on")
                if (await Prof.exists({
                        _id: mongoose.Types.ObjectId(key)
                    }))
                    taughtBy.push(mongoose.Types.ObjectId(key)); //key is of a professor
                else
                    taughtTo.push(mongoose.Types.ObjectId(key)); //key is of a group
        await Course.updateOne({
            _id: req.params.courseId
        }, {
            taughtBy: taughtBy,
            taughtTo: taughtTo
        });
        res.redirect("/getCourse");
    });
}
//Periods
{
    app.get("/getPeriod/:courseId", async (req, res) => {

        const {
            periods: periodIds,
            taughtBy: taughtByIds,
            taughtTo: taughtToIds
        } = await Course.findById(req.params.courseId);

        let periodDisplay = new Array(0),
            taughtBy = new Array(0),
            taughtTo = new Array(0),
            rooms = await Room.find();

        const {
            numberOfDays,
            periodsPerDay
        } = (await SystemParam.find())[0];

        for (const periodId of periodIds) {

            period = await Period.findById(periodId);

            groupsAttendingDisplay = new Array(0);
            for (const groupId of period.groupsAttending)
                groupsAttendingDisplay.push((await Group.findById(groupId)).groupName);

            const {
                roomName: roomUsedDisplay
            } = await Room.findById(period.roomUsed);

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
                _id: (period._id),
                periodName: (period.periodName),
                parentCourse: ((await Course.findById(period.parentCourse)).courseName),
                profTaking: ((await Prof.findById(period.profTaking)).profName),
                periodLength: (period.periodLength),
                periodFrequency: (period.periodFrequency),
                groupsAttending: groupsAttendingDisplay,
                roomUsed: roomUsedDisplay,
                preference: preferenceString
            };

            periodDisplay.push(periodDisplayObject);
        }
        for (const profId of taughtByIds)
            taughtBy.push(await Prof.findById(profId));
        for (const groupId of taughtToIds)
            taughtTo.push(await Group.findById(groupId));
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
        await createPeriod(req.body);
        const {
            courseId
        } = req.body;
        res.redirect("/getPeriod/" + String(courseId));
    });

    app.get("/deletePeriod/:periodId", async (req, res) => {
        const period = await Period.findById(req.params.periodId);
        const courseId = period.parentCourse;
        await deletePeriod(req.params.periodId);
        res.redirect("/getPeriod/" + String(courseId));
    });
}
async function deletePeriod(periodId) {
    const period = await Period.findById(mongoose.Types.ObjectId(periodId));

    if (!period)
        return;


    deletePeriodNode(period);


    //updating the course
    let {
        periods
    } = await Course.findById(period.parentCourse);
    periods.splice(periods.indexOf(periodId), 1);
    await Course.updateOne({
        _id: (period.parentCourse)
    }, {
        periods: periods
    });

    //updating the porf
    let {
        periodsTaken
    } = await Prof.findById(period.profTaking);
    periodsTaken.splice(periodsTaken.indexOf(periodId), 1);
    await Prof.updateOne({
        _id: period.profTaking
    }, {
        periodsTaken: periodsTaken
    });

    //update the groups 
    for (const groupID of period.groupsAttending) {
        let {
            periodsAttended
        } = await Group.findById(groupID);
        periodsAttended.splice(periodsAttended.indexOf(periodId), 1);
        await Group.updateOne({
            _id: groupID
        }, {
            periodsAttended: periodsAttended
        });
    }

    //update the room
    let {
        periodsUsedIn
    } = await Room.findById(period.roomUsed);
    periodsUsedIn.splice(periodsUsedIn.indexOf(periodId), 1);
    await Room.updateOne({
        _id: (period.roomUsed)
    }, {
        periodsUsedIn: periodsUsedIn
    });

    await Period.deleteOne({
        _id: periodId
    });
}
async function createPeriod(periodArgs) {
    const {
        numberOfDays,
        periodsPerDay
    } = (await SystemParam.find())[0];

    const {
        courseId,
        periodName,
        profId,
        periodLength,
        periodFrequency,
        roomId,
    } = periodArgs;
    let groupsAttending = new Array(0);

    for (const group of (await Group.find()))
        if (periodArgs[group._id] === "on")
            groupsAttending.push(mongoose.Types.ObjectId(group._id));


    let periodObject = {
        periodName: periodName,
        parentCourse: (mongoose.Types.ObjectId(courseId)),
        profTaking: (mongoose.Types.ObjectId(profId)),
        periodLength: (Number(periodLength)),
        periodFrequency: periodFrequency,
        groupsAttending: groupsAttending,
        roomUsed: (mongoose.Types.ObjectId(roomId))
    }
    if (periodFrequency == 1) {
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

    const period = await (new Period(periodObject)).save();
    const {
        _id: thisPeriodId
    } = period;

    await addPerioddNode(period);

    //updating the course
    let {
        periods
    } = await Course.findById(periodObject.parentCourse);
    periods.push(mongoose.Types.ObjectId(thisPeriodId));
    await Course.updateOne({
        _id: (periodObject.parentCourse)
    }, {
        periods: periods
    });

    //updating the porf
    let {
        periodsTaken
    } = await Prof.findById(periodObject.profTaking);
    periodsTaken.push(mongoose.Types.ObjectId(thisPeriodId));
    await Prof.updateOne({
        _id: periodObject.profTaking
    }, {
        periodsTaken: periodsTaken
    });

    //update the groups 
    for (const groupID of groupsAttending) {
        let {
            periodsAttended
        } = await Group.findById(groupID);
        periodsAttended.push(mongoose.Types.ObjectId(thisPeriodId));
        await Group.updateOne({
            _id: groupID
        }, {
            periodsAttended: periodsAttended
        });
    }

    //update the room
    let {
        periodsUsedIn
    } = await Room.findById(roomId);
    periodsUsedIn.push(mongoose.Types.ObjectId(thisPeriodId));
    await Room.updateOne({
        _id: roomId
    }, {
        periodsUsedIn: periodsUsedIn
    });
    return period;
}
app.listen(3000, () => {
    console.log("listening on port 3000");
});

var schedulerGraph = new graph.Graph();
intialiseGraph();

app.get("/viewGraph", (req, res) => {
    res.send(schedulerGraph);
});

async function intialiseGraph() {
    console.log("Initialising graph");
    if (await SystemParam.countDocuments() === 0) {
        console.log("Completed Initialising Graph");
        return;
    }

    const {
        numberOfDays,
        periodsPerDay
    } = (await SystemParam.find())[0];
    for (let lpitrt = 1; lpitrt < numberOfDays * periodsPerDay; lpitrt++)
        for (let lpitrt1 = 0; lpitrt1 < lpitrt; lpitrt1++)
            schedulerGraph.set(lpitrt, lpitrt1);

    const periods = await Period.find();
    const groups = await Group.find();
    const rooms = await Room.find();
    const profs = await Prof.find();

    for (const room of rooms) {

        for (let lpitrt = 0; lpitrt < room.periodsUsedIn.length; lpitrt++) {
            for (let lpitrt1 = 0; lpitrt1 < lpitrt; lpitrt1++)
                schedulerGraph.set(String(room.periodsUsedIn[lpitrt]) + "Period0", String(room.periodsUsedIn[lpitrt1]) + "Period0");


            for (const roomUnavailabiliy of room.unAvialability)
                schedulerGraph.set(roomUnavailabiliy, String(room.periodsUsedIn[lpitrt]) + "Period0");
        }
    }
    console.log("Initialise::Rooms done");

    for (const prof of profs) {
        for (let lpitrt = 0; lpitrt < prof.periodsTaken.length; lpitrt++) {
            for (let lpitrt1 = 0; lpitrt1 < lpitrt; lpitrt1++)
                schedulerGraph.set(String(prof.periodsTaken[lpitrt]) + "Period0", String(prof.periodsTaken[lpitrt1]) + "Period0");


            for (const profUnavailabiliy of prof.unAvialability)
                schedulerGraph.set(profUnavailabiliy, String(prof.periodsTaken[lpitrt]) + "Period0");
        }
    }
    console.log("Initialise::Prof Done");

    for (const group of groups) {
        for (let lpitrt = 0; lpitrt < group.periodsAttended.length; lpitrt++) {
            for (let lpitrt1 = 0; lpitrt1 < lpitrt; lpitrt1++)
                schedulerGraph.set(String(group.periodsAttended[lpitrt]) + "Period0", String(group.periodsAttended[lpitrt1]) + "Period0");


            for (const groupUnavailabiliy of group.unAvialability)
                schedulerGraph.set(groupUnavailabiliy, String(group.periodsAttended[lpitrt]) + "Period0");
        }
    }
    console.log("Initialise::Group Done");

    for (const period of periods) {
        console.log("Initialise::" + period.periodName);

        for (let len = 1; len < Number(period.periodLength); len++) {

            const thisPeriodNode = String(period._id) + "Period" + String(len);

            for (const node in schedulerGraph._graph[String(period._id) + "Period0"])
                schedulerGraph.set(node, thisPeriodNode);

            for (let itrt = Number(period.periodLength) - 1 - len; itrt > 0; itrt--)
                for (let day = 0; day < numberOfDays; day++)
                    schedulerGraph.set(day * periodsPerDay + periodsPerDay - itrt, thisPeriodNode);

            for (let itrt = 0; itrt < len; itrt++)
                for (let day = 0; day < numberOfDays; day++)
                    schedulerGraph.set(day * periodsPerDay + itrt, thisPeriodNode);
        }

        if (period.periodFrequency == 1) {

            if (period.periodTime != -1) {

                for (let lpitrt = 0; lpitrt < numberOfDays * periodsPerDay; lpitrt++)
                    if (lpitrt != period.periodTime)
                        schedulerGraph.set(lpitrt, String(period._id) + "Period0");
            } else if (period.periodAntiTime.length != 0) {

                for (const antiTime of period.periodAntiTime)
                    schedulerGraph.set(Number(antiTime), String(period._id) + "Period0");
            }
        }


        for (let itrt = Number(period.periodLength) - 1; itrt > 0; itrt--)
            for (let day = 0; day < numberOfDays; day++)
                schedulerGraph.set(day * periodsPerDay + periodsPerDay - itrt, String(period._id) + "Period0");

        for (let len = 1; len < Number(period.periodLength); len++)
            for (let len1 = 0; len1 < len; len1++)
                schedulerGraph.set(String(period._id) + "Period" + String(len), String(period._id) + "Period" + String(len1));
    }
    checkTimeTablePossible();
    console.log("Initialisation Complete");
    antColonySystemRLF(0, 1, 0.3, 0.05, 1, 0.25, 1, 60);
}

function deletePeriodNode(period) {
    console.log("Deleting period node" + period.periodName);
    for (let len = 0; len < period.periodLength; len++)
        console.log(schedulerGraph.drop(String(period._id) + "Period" + String(len)));
}

async function addPerioddNode(period) {

    const {
        numberOfDays,
        periodsPerDay
    } = (await SystemParam.find())[0];

    let groupContraints = new Array(0);
    for (const groupId of period.groupsAttending) {
        const {
            periodsAttended,
            unAvialability: groupUnavialability
        } = await Group.findById(period.groupsAttending);

        groupContraints.push({
            periodsAttended: periodsAttended,
            groupUnAvialability: groupUnavialability
        });
    }

    console.log("Append Period Node::" + period.periodName);


    for (let len = 1; len < Number(period.periodLength); len++) {

        const thisPeriodNode = String(period._id) + "Period" + String(len);

        for (const node in schedulerGraph._graph[String(period._id) + "Period0"])
            schedulerGraph.set(node, thisPeriodNode);

        for (let itrt = Number(period.periodLength) - 1 - len; itrt > 0; itrt--)
            for (let day = 0; day < numberOfDays; day++)
                schedulerGraph.set(day * periodsPerDay + periodsPerDay - itrt, thisPeriodNode);

        for (let itrt = 0; itrt < len; itrt++)
            for (let day = 0; day < numberOfDays; day++)
                schedulerGraph.set(day * periodsPerDay + itrt, thisPeriodNode);
    }

    if (period.periodFrequency == 1) {

        if (period.periodTime != -1) {

            for (let lpitrt = 0; lpitrt < numberOfDays * periodsPerDay; lpitrt++)
                if (lpitrt != period.periodTime)
                    schedulerGraph.set(lpitrt, String(period._id) + "Period0");
        } else if (period.periodAntiTime.length != 0) {

            for (const antiTime of period.periodAntiTime)
                schedulerGraph.set(Number(antiTime), String(period._id) + "Period0");
        }
    }


    for (let itrt = Number(period.periodLength) - 1; itrt > 0; itrt--)
        for (let day = 0; day < numberOfDays; day++)
            schedulerGraph.set(day * periodsPerDay + periodsPerDay - itrt, String(period._id) + "Period0");

    for (let len = 1; len < Number(period.periodLength); len++)
        for (let len1 = 0; len1 < len; len1++)
            schedulerGraph.set(String(period._id) + "Period" + String(len), String(period._id) + "Period" + String(len1));


    const {
        periodsUsedIn, //by the room
        unAvialability: roomUnavialability
    } = await Room.findById(period.roomUsed);


    for (let len = 0; len < Number(period.periodLength); len++) {

        for (const neighbor of periodsUsedIn) {
            let neighborPeriod = await Period.findById(neighbor);
            for (let neblen = 0; neblen < Number(neighborPeriod.periodLength); neblen++)
                schedulerGraph.set(String(neighborPeriod._id) + "Period" + String(neblen), String(period._id) + "Period" + String(len));
        }

        for (const roomBusy of roomUnavialability) {
            schedulerGraph.set(Number(roomBusy), String(period._id) + "Period" + String(len));
        }
    }



    const {
        periodsTaken, //by the prof
        unAvialability: profUnavialability
    } = await Prof.findById(period.profTaking);

    for (let len = 0; len < Number(period.periodLength); len++) {

        for (const neighbor of periodsTaken) {
            let neighborPeriod = await Period.findById(neighbor);
            for (let neblen = 0; neblen < Number(neighborPeriod.periodLength); neblen++)
                schedulerGraph.set(String(neighborPeriod._id) + "Period" + String(neblen), String(period._id) + "Period" + String(len));
        }

        for (const roomBusy of profUnavialability) {
            schedulerGraph.set(Number(roomBusy), String(period._id) + "Period" + String(len));
        }
    }

    for (const groupId of period.groupsAttending) {
        const {
            periodsAttended,
            unAvialability: groupUnavialability
        } = await Group.findById(period.groupsAttending);

        for (let len = 0; len < Number(period.periodLength); len++) {

            for (const neighbor of periodsAttended) {
                let neighborPeriod = await Period.findById(neighbor);
                for (let neblen = 0; neblen < Number(neighborPeriod.periodLength); neblen++)
                    schedulerGraph.set(String(neighborPeriod._id) + "Period" + String(neblen), String(period._id) + "Period" + String(len));
            }

            for (const roomBusy of groupUnavialability) {
                schedulerGraph.set(Number(roomBusy), String(period._id) + "Period" + String(len));
            }
        }
    }
    checkTimeTablePossible();
    console.log("Graph Update Complete");
}

async function checkTimeTablePossible() {
    const {
        numberOfDays,
        periodsPerDay
    } = (await SystemParam.find())[0];

    for (const node in schedulerGraph._graph) {
        let inConflict = true;
        for (let periodNumber = 0; periodNumber < numberOfDays * periodsPerDay; periodNumber++)
            inConflict = inConflict && schedulerGraph.has(node, periodNumber);
        if (inConflict) {
            const nodeString = String(node);
            const period = await Period.findById(nodeString.slice(0, 24));
            console.log("WARNING:The period " + period.periodName + " causing impossible time table config.");
        }
    }
}

//ACS on RLF. No matter what I do it is not working. it has bugs that just cannot be explained.
async function antColonySystemRLF(alpha, beta, Qnot, Epsilon, Row, tripRestartProbability, initialPheramonValue, numberOfAnts) {
    const parentGraphsNodes = schedulerGraph._vertices;
    const {
        numberOfDays,
        periodsPerDay
    } = (await SystemParam.find())[0];
    const periods = await Period.find();

    const coloringGraph = new graph.Graph();
    for (const nodeOne in schedulerGraph._graph)
        for (const nodeTwo in schedulerGraph._graph)
            if (!schedulerGraph.has(nodeOne, nodeTwo))
                coloringGraph.set(nodeOne, nodeTwo, initialPheramonValue);

    let solutionBestSoFar, fitnessOfSolutionBestSoFar = 0;
    for (let generations = 0; fitnessOfSolutionBestSoFar < 99; generations++) {

        let antTrips = new Array(numberOfAnts);
        for (let antNumber = 0; antNumber < numberOfAnts; antNumber++) {
            antTrips[antNumber] = new Object();
            antTrips[antNumber].coloring = new Map();
            antTrips[antNumber].unColored = new Set(schedulerGraph._vertices);
            let antStartingChoices = ([...antTrips[antNumber].unColored]).filter(ele => String(ele).length < 24);
            antTrips[antNumber].neighborOfColored = new Set();
            antTrips[antNumber].ant = antStartingChoices[Math.floor(Math.random() * antStartingChoices.length)]
            antTrips[antNumber].color = Number(antTrips[antNumber].ant);
            antTrips[antNumber].coloring.set(antTrips[antNumber].color, new Array(0));
            antTrips[antNumber].unColored.delete(antTrips[antNumber].ant);

            antTrips[antNumber].messageForOtherColor = new Map();
            for (let numOfPer = 0; numOfPer < numberOfDays * periodsPerDay; numOfPer++)
                antTrips[antNumber].messageForOtherColor.set(numOfPer, new Array(0));
        }
        while (true) {
            let allAntsHaveCompletedTheirTrips = true;
            for (let antNumber = 0; antNumber < numberOfAnts; antNumber++)
                allAntsHaveCompletedTheirTrips = allAntsHaveCompletedTheirTrips && antTrips[antNumber].unColored.size === 0;
            if (allAntsHaveCompletedTheirTrips)
                break;
            for (let antNumber = 0; antNumber < numberOfAnts; antNumber++) {
                let nextAntStop = new Map();
                //Colorable Neighbor => Connected by No edge. Neighbor => Connected by edge.
                for (const antColorableNeighbor in coloringGraph._graph[antTrips[antNumber].ant])
                    if (antTrips[antNumber].unColored.has(antColorableNeighbor) && (!antTrips[antNumber].neighborOfColored.has(antColorableNeighbor)) && (!schedulerGraph.has(antColorableNeighbor, antTrips[antNumber].color))) {

                        let pheramon = coloringGraph.get(antColorableNeighbor, antTrips[antNumber].ant),
                            deg_a_antNeighbor = 0;
                        for (const antColorableNeighborsNeighbor in schedulerGraph._graph[antColorableNeighbor])
                            if (antTrips[antNumber].unColored.has(antColorableNeighborsNeighbor))
                                deg_a_antNeighbor++;
                        let heuristic = antTrips[antNumber].unColored.size - deg_a_antNeighbor; //heuristic can be 1)deg_in_neighborOfCOlored of antNeighbor OR 2)unColored.size - deg_a_antNeighbor OR 3)deg_in_uncolored_Union_neighborOfColored_of_antNeighbor
                        //if (antNumber === 1)
                            //console.log(heuristic);

                        let transitionValue = Math.pow(pheramon, alpha) * Math.pow(heuristic, beta);
                        nextAntStop.set(antColorableNeighbor, transitionValue);
                    }
                //if (antNumber === 1)
                   // console.log("\n");
                if (nextAntStop.size === 0 || Math.random() < tripRestartProbability) {
                    if (antTrips[antNumber].unColored.size === 0)
                        continue;

                    let antStartingChoices = ([...antTrips[antNumber].unColored]).filter(ele => String(ele).length < 24);
                    antTrips[antNumber].neighborOfColored = new Set();
                    if (antStartingChoices.length > 0) {
                        antTrips[antNumber].ant = antStartingChoices[Math.floor(Math.random() * antStartingChoices.length)]
                        antTrips[antNumber].color = Number(antTrips[antNumber].ant);
                        antTrips[antNumber].unColored.delete(antTrips[antNumber].ant);
                        antTrips[antNumber].coloring.set(antTrips[antNumber].color, new Array(0));
                    } else {
                        if (antTrips[antNumber].color >= numberOfDays * periodsPerDay)
                            antTrips[antNumber].color = antTrips[antNumber].color + 1;
                        else
                            antTrips[antNumber].color = numberOfDays * periodsPerDay;
                        antTrips[antNumber].ant = ([...antTrips[antNumber].unColored])[Math.floor(Math.random() * antStartingChoices.length)];
                        antTrips[antNumber].unColored.delete(antTrips[antNumber].ant);
                        antTrips[antNumber].coloring.set(antTrips[antNumber].color, [antTrips[antNumber].ant]);
                        for (const antsNeighbor in schedulerGraph._graph[antTrips[antNumber].ant])
                            antTrips[antNumber].neighborOfColored.add(antsNeighbor);

                        antTrips[antNumber].messageForOtherColor.set(antTrips[antNumber].color, new Array(0));



                        let {
                            periodLength: thisAntsPeriodLength
                        } = await Period.findById(String(antTrips[antNumber].ant).slice(0, 24));
                        let thisAntPeriodNumber = Number(String(antTrips[antNumber].ant).slice(30));

                        for (let messageForPreviosPeriods = thisAntPeriodNumber - 1; messageForPreviosPeriods >= 0; messageForPreviosPeriods--) {
                            //console.log(antTrips[antNumber].color - messageForPreviosPeriods, antTrips[antNumber].color, messageForPreviosPeriods, String(antTrips[antNumber].ant));
                            antTrips[antNumber].messageForOtherColor.set(antTrips[antNumber].color - messageForPreviosPeriods, [...antTrips[antNumber].messageForOtherColor.get(antTrips[antNumber].color - messageForPreviosPeriods), String(antTrips[antNumber].ant).slice(0, 30) + String(messageForPreviosPeriods)]);
                        }
                        if (antTrips[antNumber].color < numberOfDays * periodsPerDay)
                            for (let messageForNextPeriods = thisAntPeriodNumber + 1; messageForNextPeriods < thisAntsPeriodLength; messageForNextPeriods++) {
                                //console.log(antTrips[antNumber].color + messageForNextPeriods, antTrips[antNumber].color, messageForNextPeriods, String(antTrips[antNumber].ant));
                                antTrips[antNumber].messageForOtherColor.set(antTrips[antNumber].color + messageForNextPeriods, [...antTrips[antNumber].messageForOtherColor.get(antTrips[antNumber].color + messageForNextPeriods), String(antTrips[antNumber].ant).slice(0, 30) + String(messageForNextPeriods)]);
                            }
                    }
                    continue;
                }
                let nextAnt; //check if there is any message for this color asking it to pick a speicfic node
                for (const [transitionChoice, transitionValue] of nextAntStop) {
                    if (antTrips[antNumber].messageForOtherColor.get(antTrips[antNumber].color).includes(transitionChoice)) {
                        nextAnt = transitionChoice;
                        break;
                    }
                }
                if (!nextAnt) {
                    if (Math.random() < Qnot) {
                        let bestTransitionValue = -1;
                        for (const [transitionChoice, transitionValue] of nextAntStop) {
                            if (transitionValue > bestTransitionValue) {
                                bestTransitionValue = transitionValue;
                                nextAnt = transitionChoice;
                            }
                        }
                    } else {
                        let cumilativeTransitionValue = 0;
                        for (const transitionValue of nextAntStop.values())
                            cumilativeTransitionValue += transitionValue;

                        let antChoice = Math.random() * cumilativeTransitionValue;

                        cumilativeTransitionValue = 0;
                        for (const [transitionChoice, transitionValue] of nextAntStop) {
                            nextAnt = transitionChoice;
                            cumilativeTransitionValue += transitionValue;
                            if (cumilativeTransitionValue >= transitionValue)
                                break;
                        }
                    }
                }
                //Local Pheramon Update
                const localPhreramonUpdate = (1 - Epsilon) * coloringGraph.get(antTrips[antNumber].ant, nextAnt) + Epsilon * (initialPheramonValue * 2);
                coloringGraph.set(antTrips[antNumber].ant, nextAnt, localPhreramonUpdate);


                antTrips[antNumber].ant = nextAnt;
                antTrips[antNumber].unColored.delete(antTrips[antNumber].ant);
                antTrips[antNumber].coloring.set(antTrips[antNumber].color, [...antTrips[antNumber].coloring.get(antTrips[antNumber].color), antTrips[antNumber].ant]);
                for (const antsNeighbor in schedulerGraph._graph[antTrips[antNumber].ant])
                    antTrips[antNumber].neighborOfColored.add(antsNeighbor);

                let {
                    periodLength: thisAntsPeriodLength
                } = await Period.findById(String(antTrips[antNumber].ant).slice(0, 24));
                let thisAntPeriodNumber = Number(String(antTrips[antNumber].ant).slice(30));

                for (let messageForPreviosPeriods = thisAntPeriodNumber - 1; messageForPreviosPeriods >= 0; messageForPreviosPeriods--) {
                    //console.log(antTrips[antNumber].color - messageForPreviosPeriods, antTrips[antNumber].color, messageForPreviosPeriods, String(antTrips[antNumber].ant));
                    antTrips[antNumber].messageForOtherColor.set(antTrips[antNumber].color - messageForPreviosPeriods, [...antTrips[antNumber].messageForOtherColor.get(antTrips[antNumber].color - messageForPreviosPeriods), String(antTrips[antNumber].ant).slice(0, 30) + String(messageForPreviosPeriods)]);
                }
                if (antTrips[antNumber].color < numberOfDays * periodsPerDay)
                    for (let messageForNextPeriods = thisAntPeriodNumber + 1; messageForNextPeriods < thisAntsPeriodLength; messageForNextPeriods++)
                        antTrips[antNumber].messageForOtherColor.set(antTrips[antNumber].color + messageForNextPeriods, [...antTrips[antNumber].messageForOtherColor.get(antTrips[antNumber].color + messageForNextPeriods), String(antTrips[antNumber].ant).slice(0, 30) + String(messageForNextPeriods)]);

            }
        }
        //global pheramon update and Evaluating Success
        //if (!solutionBestSoFar) {
        solutionBestSoFar = antTrips[0].coloring;
        fitnessOfSolutionBestSoFar = antTripFitness(solutionBestSoFar, periods, numberOfDays, periodsPerDay);
        //}
        for (let antNumber = 0; antNumber < numberOfAnts; antNumber++) {
            thisTripsFitness = antTripFitness(antTrips[antNumber].coloring, periods, numberOfDays, periodsPerDay);
            if (thisTripsFitness > fitnessOfSolutionBestSoFar) {
                fitnessOfSolutionBestSoFar = thisTripsFitness;
                solutionBestSoFar = antTrips[antNumber].coloring;
            }
        }

        for (const edgeStart in coloringGraph._graph)
            for (const edgeEnd in coloringGraph._graph)
                if (coloringGraph.has(edgeStart, edgeEnd)) {
                    const pheramonAfterEvaporation = Math.sqrt(1 - Row) * coloringGraph.get(edgeStart, edgeEnd);
                    coloringGraph.set(edgeStart, edgeEnd, pheramonAfterEvaporation);
                }

        for (const [key, value] of solutionBestSoFar)
            for (let colorPeriodArrayItrt = 1; colorPeriodArrayItrt < value.length; colorPeriodArrayItrt++)
                for (let colorPeriodArrayItrt1 = 0; colorPeriodArrayItrt1 < colorPeriodArrayItrt; colorPeriodArrayItrt1++) {
                    let pheramonAfterEnforcment = coloringGraph.get(value[colorPeriodArrayItrt], value[colorPeriodArrayItrt1]);
                    pheramonAfterEnforcment += Row * (fitnessOfSolutionBestSoFar + 10);
                    coloringGraph.set(value[colorPeriodArrayItrt], value[colorPeriodArrayItrt1], pheramonAfterEnforcment);
                }
        console.log(solutionBestSoFar);
        console.log("Generation::" + generations + "    Fitness::" + fitnessOfSolutionBestSoFar + "\n\n");

        //await io.read();
    }
}

function antTripFitness(trip, periods, numberOfDays, periodsPerDay) {
    let sickness = trip.size - (numberOfDays * periodsPerDay);
    if (sickness < 0)
        sickness = 0;
    for (const period of periods)
        if (Number(period.periodLength) > 1) {
            let periodConsecutiveCheck = [];
            for (let len = 0; len < Number(period.periodLength); len++) {
                let thisPeriodTime = 0;
                for (const [key, value] of trip)
                    if (value.includes((period._id) + "Period" + String(len))) {
                        thisPeriodTime = key;
                        break;
                    }
                periodConsecutiveCheck.push(thisPeriodTime);
            }
            for (let periodConsecutiveCheckItrt = 1; periodConsecutiveCheckItrt < periodConsecutiveCheck.length; periodConsecutiveCheckItrt++)
                if (periodConsecutiveCheck[periodConsecutiveCheckItrt] - periodConsecutiveCheck[periodConsecutiveCheckItrt - 1] !== 1)
                    sickness += 1;
        }
    return 100 / (1 + sickness);
}