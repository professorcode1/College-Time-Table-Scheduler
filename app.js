const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
var addon = require('bindings')('hello');
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
    periodLength: Number,
    periodFrequency: Number,
    groupsAttending: [mongoose.Types.ObjectId],
    potentialRooms: [mongoose.Types.ObjectId],
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
    Prof.updateMany({}, {
        unAvialability: new Array(0)
    });
    Room.updateMany({}, {
        unAvialability: new Array(0)
    });
    Group.updateMany({}, {
        unAvialability: new Array(0)
    });
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

    app.post("/deleteCourse", async (req, res) => {
        const {
            taughtTo,
            taughtBy,
            _id: thisCourseId,
            periods
        } = await Course.findById(mongoose.Types.ObjectId(req.body.courseId));

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
            _id: mongoose.Types.ObjectId(req.body.courseId)
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
            res.redirect("/courseTemplate/"+String(thisCourseId));
    });

    app.get("/courseTemplate/:courseId",async (req,res) => {

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

            potentialRoomsDisplay = new Array(0);
            for (const roomId of period.potentialRooms)
                potentialRoomsDisplay.push((await Room.findById(roomId)).roomName)


            let preferenceString = ""
            if (period.periodTime !== -1) {
                preferenceString = "The period must take place at D" + String(Math.floor(period.periodTime / periodsPerDay) + 1) + "P" + String(period.periodTime % periodsPerDay);
            } else if (period.periodAntiTime.length !== 0) {
                preferenceString = "The period must not take place at ";
                for (const prefval of period.periodAntiTime)
                    preferenceString += "D" + String(Math.floor(prefval / periodsPerDay) + 1) + "P" + String(prefval % periodsPerDay) + " , ";
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
                potentialRooms: potentialRoomsDisplay,
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
        const {courseId} = req.body;
        res.redirect("/getPeriod/" + String(courseId));
    });

    app.get("/deletePeriod/:periodId", async (req, res) => {
        await deletePeriod(req.params.periodId);
        res.redirect("/getCourse");
    });
}
async function deletePeriod(periodId) {
    const period = await Period.findById(mongoose.Types.ObjectId(periodId));

    if (!period)
        return;

    //updating the course
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

    //update the rooms
    for (const roomId of period.potentialRooms) {
        let {
            periodsUsedIn
        } = await Room.findById(roomId);
        periodsUsedIn.splice(periodsUsedIn.indexOf(periodId), 1);
        await Room.updateOne({
            _id: roomId
        }, {
            periodsUsedIn: periodsUsedIn
        });
    }

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
        periodFrequency
    } = periodArgs;

    let groupsAttending = new Array(0),
        potentialRooms = new Array(0);

    for (const group of (await Group.find()))
        if (periodArgs[group._id] === "on")
            groupsAttending.push(mongoose.Types.ObjectId(group._id));


    for (const room of (await Room.find()))
        if (periodArgs[room._id] === "on")
            potentialRooms.push(mongoose.Types.ObjectId(room._id));

    let periodObject = {
        periodName: periodName,
        parentCourse: (mongoose.Types.ObjectId(courseId)),
        profTaking: (mongoose.Types.ObjectId(profId)),
        periodLength: (Number(periodLength)),
        periodFrequency: periodFrequency,
        groupsAttending: groupsAttending,
        potentialRooms: potentialRooms
    }

    if (periodArgs.specifyTime) {
        const periodTime = periodsPerDay * (Number(periodArgs.timeSpeicifiedDay) - 1) + Number(periodArgs.timeSpeicifiedPeriod);
        periodObject.periodTime = periodTime;
        periodObject.periodAntiTime = new Array(0);
    } else {
        let periodAntiTime = new Array(0);
        for (let loopitrt = 0; loopitrt < numberOfDays * periodsPerDay; loopitrt++)
            if (periodArgs["antiTimeSpecified" + String(loopitrt)] === "on")
                periodAntiTime.push(loopitrt);
        periodObject.periodTime = -1;
        periodObject.periodAntiTime = periodAntiTime;
    }

    const {
        _id: thisPeriodId
    } = await (new Period(periodObject)).save();

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

    //update the rooms
    for (const roomId of potentialRooms) {
        let {
            periodsUsedIn
        } = await Room.findById(roomId);
        periodsUsedIn.push(mongoose.Types.ObjectId(thisPeriodId));
        await Room.updateOne({
            _id: roomId
        }, {
            periodsUsedIn: periodsUsedIn
        });
    }
}
//console.log(addon.add(3, 5));
app.listen(3000, () => {
    console.log("listening on port 3000");
});