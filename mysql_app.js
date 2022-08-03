const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const bcrypt = require("bcrypt");
const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy
const session = require('express-session')
var MySQLStore = require('express-mysql-session')(session);
var mysql = require('mysql');
const util = require('util');
require('dotenv').config();

function initializePassport(passport, getUserByEmail, getUserById) {
    const authenticateUser = async (email, password, done) => {
        const user = await getUserByEmail(email)
        if (user == null) {
            return done(null, false, { message: 'No user with that email' })
        }

        try {
            if (await bcrypt.compare(password, user.password)) {
                return done(null, user)
            } else {
                return done(null, false, { message: 'Password incorrect' })
            }
        } catch (e) {
            return done(e)
        }
    }

    passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser))
    passport.serializeUser((user, done) => done(null, user.university_id))
    passport.deserializeUser(async (id, done) => {
        return done(null, await getUserById(id))
    })
}


async function try_catch(promise) {
    return_val = [null, null];
    try {
        return_val[0] = await promise;
    } catch (err) {
        return_val[1] = err;
    }
    return return_val;
}

var options = {
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQLPASS,
    database: process.env.DATABASE_NAME
};
var connection = mysql.createConnection(options);

connection.connect();

function async_get_query(sql_query) {
    return util.promisify(connection.query).call(connection, sql_query);
}
function async_push_query(sql_query, info) {
    return util.promisify(connection.query).call(connection, sql_query, info);
}
initializePassport(
    passport,
    async (email) => {
        const result = await async_get_query("SELECT * FROM university WHERE email = " + connection.escape(email));
        if (result.length == 0)
            return null;
        else
            return result[0];
    },
    async (id) => {
        const result = await async_get_query("SELECT * FROM university WHERE university_id = " + connection.escape(id));
        if (result.length == 0)
            return null;
        else
            return result[0];
    }
)
var sessionStore = new MySQLStore(options);
async function hehe(email) {
    // console.log(await async_push_query("INSERT INTO university SET ?", {
    //   name : "TIET",
    //   email : "rkumar_be19@thapar.edu",
    //   password : "abcd",
    //   periods_per_day : 1 ,
    //   days_per_week :2 }));


    // console.log((await async_get_query("SELECT EXISTS(SELECT * FROM university WHERE email = " + connection.escape(email) + ") AS email_used"))[0].email_used);

    // console.log(await async_push_query("INSERT INTO professor SET ?", {
    //   university_id : 1,
    //   name : "Pankaj "
    // }));
}

hehe("raghkum2000@gmail.com");
hehe("rkumar_be19@thapar.edu");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));
app.use(session({
    secret: "You were expecting this string to be a secret used to encrypt cookies,DEMO: KONO DIO DA!(menacing!)",
    resave: false,
    saveUninitialized: false,
    store: sessionStore
}));
app.use(passport.initialize());
app.use(passport.session());



app.get("/", (req, res) => res.sendFile(__dirname + "/webPages/index.html"));
app.get("/loginFailed", (req, res) => res.render("message", {
    message: "You password or Username was incorrect. Try again"
}));


app.get("/login", (req, res) => res.sendFile(__dirname + "/webPages/login.html"));
app.post('/login', passport.authenticate('local', {
    successRedirect: '/homepage',
    failureRedirect: '/loginFailed',
}))


app.get("/register", (req, res) => res.sendFile(__dirname + "/webPages/register.html"));
app.post("/register", async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        if ((await async_get_query("SELECT EXISTS(SELECT * FROM university WHERE email = " + connection.escape(req.body.email) + ") AS email_used"))[0].email_used) {
            return res.render("message", {
                message: "This email is already in use"
            })
        }
        await async_push_query("INSERT INTO university SET ?", {
            name: req.body.instituteName,
            email: req.body.email,
            password: hashedPassword
        });
        passport.authenticate("local")(req, res, function () {
            res.redirect("/homepage");
        });
    } catch (err) {
        console.log(err);
        res.redirect('/register')
    }
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
    // console.log(req.user);
    res.render("getParam", {
        days: req.user.days_per_week,
        periods: req.user.periods_per_day
    });
});

app.post("/parameter", async (req, res) => {
    if (!req.isAuthenticated())
        return res.redirect("/login");
    const sql_string = "CALL update_paramterers(" + req.user.university_id + ',' + req.body.periods + ',' + req.body.days + ')';
    // console.log(sql_string);
    await async_get_query(sql_string);
    res.redirect("/homepage");
});

async function insert_many_hlpr(table_name_and_fields, left_value, right_values) {
    let sql_professor_ban_time_query = "INSERT INTO " + table_name_and_fields + " VALUES "
    for (let right_value of right_values)
        sql_professor_ban_time_query += "(" + left_value + "," + right_value + "),";
    if (right_values.length > 0)
        await async_get_query(sql_professor_ban_time_query.slice(0, -1));
}
function groupBy(list, keyGetter) {
    const map = new Map();
    list.forEach((item) => {
        const key = keyGetter(item);
        const collection = map.get(key);
        if (!collection) {
            map.set(key, [item]);
        } else {
            collection.push(item);
        }
    });
    return map;
}
extend_id_to_24_char = id => 'a'.repeat(24 - String(id).length) + id;


//Professor
async function get_professors(university_id) {
    const professors = await async_get_query("SELECT * from professor WHERE university_id = " + university_id);
    for (let professor of professors) {
        professor.unAvialability = (await async_get_query("SELECT ban_time FROM professor_ban_times WHERE professor_id = " + professor.professor_id)).map(x => x.ban_time);
        professor.profName = professor.name;
        professor._id = professor.professor_id;
    }
    return professors;
}
{

    app.get("/professor", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        return res.render("getProf", {
            profs: await get_professors(req.user.university_id),
            numberOfDays: req.user.days_per_week,
            periodsPerDay: req.user.periods_per_day
        });
    });
    app.get("/professorForm", (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        return res.render("professorForm", {
            numberOfDays: req.user.days_per_week,
            periodsPerDay: req.user.periods_per_day
        });
    });
    app.post("/professor", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        unAvialability = new Array(0);
        for (let loopitrt = 0; loopitrt < req.user.days_per_week * req.user.periods_per_day; loopitrt++)
            if (req.body["periodTaken" + String(loopitrt)] === "on")
                unAvialability.push(loopitrt);
        const professor_id = (await async_push_query("INSERT INTO professor SET ?", {
            university_id: req.user.university_id,
            name: req.body.profName
        })).insertId;
        await insert_many_hlpr("professor_ban_times", professor_id, unAvialability);
        return res.redirect("/professorForm");
    });
    app.get("/deleteProfessor/:professorId", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        await async_get_query("DELETE FROM professor WHERE professor_id = " + req.params.professorId);
        return res.redirect("/professor");
    });
}
//Groups
async function get_groups(university_id) {
    const groups = await async_get_query("SELECT * FROM `group` WHERE university_id = " + university_id);
    for (let group of groups) {
        group.unAvialability = (await async_get_query("SELECT ban_time FROM group_ban_times WHERE group_id = " + group.group_id)).map(x => x.ban_time);
        group.groupName = group.name;
        group._id = group.group_id;
        group.groupQuantity = group.number_of_students;
    }
    return groups;
}
{

    app.get("/group", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        res.render("getGroup", {
            groups: await get_groups(req.user.university_id),
            numberOfDays: req.user.days_per_week,
            periodsPerDay: req.user.periods_per_day
        });
    });
    app.get("/groupForm", (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        return res.render("groupForm", {
            numberOfDays: req.user.days_per_week,
            periodsPerDay: req.user.periods_per_day
        });
    });
    app.post("/group", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        unAvialability = new Array(0);
        for (let loopitrt = 0; loopitrt < req.user.days_per_week * req.user.periods_per_day; loopitrt++)
            if (req.body["periodTaken" + String(loopitrt)] === "on")
                unAvialability.push(loopitrt);
        const group_id = (await async_push_query("INSERT INTO `group` SET ?", {
            university_id: req.user.university_id,
            name: req.body.groupName,
            number_of_students: req.body.groupQuantity
        })).insertId;
        await insert_many_hlpr(group_ban_times, group_id, unAvialability);
        return res.redirect("/groupForm");
    });
    app.get("/deleteGroup/:groupId", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        await async_get_query("DELETE FROM `group` WHERE group_id = " + req.params.groupId);
        return res.redirect("/group");
    });
    app.get("/editGroup/:groupId", async (req, res) => {
        const group = (await async_get_query("SELECT * FROM `group` WHERE group_id = " + req.params.groupId))[0];
        group.unAvialability = (await async_get_query("SELECT ban_time FROM group_ban_times WHERE group_id = " + group.group_id)).map(x => x.ban_time);
        group.groupName = group.name;
        group._id = group.group_id;
        group.groupQuantity = group.number_of_students;

        res.render("editGroup", {
            group: group,
            numberOfDays: req.user.days_per_week,
            periodsPerDay: req.user.periods_per_day
        });
    });
    app.post("/editGroup/:groupId", async (req, res) => {
        unAvialability = new Array(0);
        for (let loopitrt = 0; loopitrt < req.user.days_per_week * req.user.periods_per_day; loopitrt++)
            if (req.body["periodTaken" + String(loopitrt)] === "on")
                unAvialability.push(loopitrt);
        const group = new Object();
        group.name = req.body.groupName;
        group.number_of_students = req.body.groupQuantity;
        await async_push_query("UPDATE `group` SET ? WHERE group_id = " + req.params.groupId, group);
        await async_get_query("DELETE FROM group_ban_times WHERE group_id = " + req.params.groupId);
        let sql_professor_ban_time_query = "INSERT INTO group_ban_times VALUES "
        for (let unAvialability_ele of unAvialability)
            sql_professor_ban_time_query += "(" + req.params.groupId + "," + unAvialability_ele + "),";
        await async_get_query(sql_professor_ban_time_query.slice(0, -1));

        return res.redirect("/group");
    });
}

//Rooms
{
    app.get("/room", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        const rooms = (await async_get_query("SELECT * FROM room WHERE university_id = " + req.user.university_id));
        for (let room of rooms) {
            room.unAvialability = (await async_get_query("SELECT ban_time FROM room_ban_times WHERE room_id = " + room.room_id)).map(x => x.ban_time);
            room.roomName = room.name;
            room._id = room.room_id;
            room.roomCapacity = room.capacity;
        }
        res.render("getRoom", {
            rooms: rooms,
            numberOfDays: req.user.days_per_week,
            periodsPerDay: req.user.periods_per_day
        });
    });
    app.get("/roomForm", (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        return res.render("roomForm", {
            numberOfDays: req.user.days_per_week,
            periodsPerDay: req.user.periods_per_day
        });
    });
    app.post("/room", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        unAvialability = new Array(0);
        for (let loopitrt = 0; loopitrt < req.user.days_per_week * req.user.periods_per_day; loopitrt++)
            if (req.body["periodTaken" + String(loopitrt)] === "on")
                unAvialability.push(loopitrt);
        const room_id = (await async_push_query("INSERT INTO `room` SET ?", {
            university_id: req.user.university_id,
            name: req.body.roomName,
            capacity: req.body.roomCapacity
        })).insertId;
        await insert_many_hlpr("room_ban_times", room_id, unAvialability);
        return res.redirect("/roomForm");
    });
    app.get("/deleteroom/:roomId", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        await async_get_query("DELETE FROM room WHERE room_id = " + req.params.roomId);
        return res.redirect("/room");
    });
}
//Courses
{
    app.get("/course", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        const data = await async_get_query("CALL courses_information(" + req.user.university_id + ")");
        const [course_data, professor_data, group_data,] = data;
        const professor_map = groupBy(professor_data, ele => ele.course_id);
        const group_map = groupBy(group_data, ele => ele.course_id);
        for (let course of course_data) {
            course._id = course.course_id;
            course.courseName = course.name;
            course.taughtBy = professor_map.get(course.course_id).map(ele => ele.name);
            course.taughtTo = group_map.get(course.course_id).map(ele => ele.name);
        }
        res.render("getCourse", {
            courseDisplay: course_data
        });
    });
    app.get("/courseForm", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        return res.render("courseForm", {
            groups: await get_groups(req.user.university_id),
            profs: await get_professors(req.user.university_id)
        });
    });
    app.post("/course", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        let taughtBy = new Array(0),
            taughtTo = new Array(0);
        for (const key in req.body)
            if (req.body[key] === "on")
                if (key[0] === 'P')
                    taughtBy.push(key.substring(1, key.length)); //key is of a professor
                else
                    taughtTo.push(key.substring(1, key.length)); //key is of a group
        taughtBy = taughtBy.map(x => Number(x));
        taughtTo = taughtTo.map(x => Number(x));
        if (taughtTo.length == 0 || taughtBy.length == 0)
            return res.redirect("/course");
        const thisCourseId = (await async_push_query("INSERT INTO course SET ?", {
            university_id: req.user.university_id,
            name: req.body.courseName
        })).insertId;
        await insert_many_hlpr("course_professor", thisCourseId, taughtBy);
        await insert_many_hlpr("course_group", thisCourseId, taughtTo);
        const {
            numberOfLectures,
            numberOfTutorials,
            numberOfLabs
        } = req.body;
        if (numberOfLectures == 0 && numberOfTutorials == 0 && numberOfLabs == 0)
            res.redirect("/courseForm");
        else
            res.redirect("/courseTemplate/" + String(thisCourseId) + "/?numberOfLectures=" + numberOfLectures + "&numberOfTutorials=" + numberOfTutorials + "&numberOfLabs=" + numberOfLabs);
    });
    app.get("/deleteCourse/:courseId", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        await async_get_query("DELETE FROM course WHERE course_id = " + req.params.courseId);
        res.redirect("/course");
    });

    app.get("/courseTemplate/:courseId", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        const [[course], taughtBy, taughtTo, rooms,] = await async_get_query("CALL course_information(" + req.params.courseId + ')');
        for (let prof of taughtBy) {
            prof.profName = prof.name;
            prof._id = prof.professor_id;
        }
        for (let room of rooms) {
            room.roomName = room.name;
            room._id = room.room_id;
        }
        for (let group of taughtTo) {
            group.groupName = group.name;
            group._id = group.group_id;
        }
        res.render("courseTemplate", {
            taughtBy: taughtBy,
            taughtTo: taughtTo,
            rooms: rooms,
            numberOfDays: req.user.days_per_week,
            periodsPerDay: req.user.periods_per_day,
            courseName: course.name,
            courseId: course.course_id,
            numberOfLectures: Number(req.query.numberOfLectures),
            numberOfTutorials: Number(req.query.numberOfTutorials),
            numberOfLabs: Number(req.query.numberOfLabs),
        });
    });

    app.post("/courseTemplate", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        //console.log(req.body)
        const {
            courseId: course_id,
            numberOfLectures,
            numberOfTutorials,
            numberOfLabs
        } = req.body;
        const { name: course_name } = (await async_get_query(`SELECT name FROM course WHERE course_id = ${course_id}`))[0];
        const period_insert_statement = "INSERT INTO `period`(name, course_id, professor_id, room_id, length, frequency) VALUES "
        const groups_this_course = await async_get_query(`SELECT group_id, \`name\` FROM \`group\` WHERE group_id IN (SELECT group_id FROM course_group WHERE course_id = ${course_id})`);
        const lecture_period_id = (await async_get_query(period_insert_statement + `("${course_name + " Lecture"}", ${course_id}, ${req.body.lecture.profId}, ${req.body.lecture.roomId}, ${req.body.lecture.periodLength}, ${numberOfLectures})`)).insertId;
        await insert_many_hlpr("period_group", lecture_period_id, groups_this_course.map(x => x.group_id));

        const [{ taught_to_length }] = await async_get_query(`select count(*) as taught_to_length from course_group where course_id = ${course_id}`);
        if (Number(numberOfTutorials) !== 0)
            for (let lpitrt = 0; lpitrt < taught_to_length; lpitrt++) {
                const {
                    groupId,
                    roomId,
                    profId,
                    periodLength
                } = req.body["tutorial" + String(lpitrt)];
                let periodArgs = {
                    name: course_name + " Tutorial " + groups_this_course.find(group => group.group_id == groupId).name,
                    course_id: course_id,
                    room_id: roomId,
                    professor_id: profId,
                    length: periodLength,
                    frequency: numberOfTutorials,
                };
                const period_id = (await async_push_query("INSERT INTO `period` SET ?", periodArgs)).insertId;
                await async_get_query(`INSERT INTO period_group VALUES (${period_id}, ${groupId})`);
            }

        if (Number(numberOfLabs) !== 0)
            for (let lpitrt = 0; lpitrt < taught_to_length; lpitrt++) {
                const {
                    groupId,
                    roomId,
                    profId,
                    periodLength
                } = req.body["lab" + lpitrt];

                let periodArgs = {
                    name: course_name + " Lab " + groups_this_course.find(group => group.group_id == groupId).name,
                    course_id: course_id,
                    room_id: roomId,
                    professor_id: profId,
                    length: periodLength,
                    frequency: numberOfLabs,
                };
                const period_id = (await async_push_query("INSERT INTO `period` SET ?", periodArgs)).insertId;
                await async_get_query(`INSERT INTO period_group VALUES (${period_id}, ${groupId})`);
            }

        res.redirect("/courseForm");
    });
}
//Periods
{
    app.get("/period/:courseId", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        const [[{ name: courseName }], periods_data, group_Data, ban_time_Data,] = await async_get_query(`CALL periods_information(${req.params.courseId})`);
        // console.log(courseName, periods_data, group_Data, ban_time_Data);
        const grouped_group_data = groupBy(group_Data, x => x.period_id);
        const grouped_ban_times = groupBy(ban_time_Data, x => x.period_id)
        // console.log(grouped_group_data, grouped_ban_times)
        for (let period of periods_data) {
            period.groupsAttending = grouped_group_data.get(period._id).map(x => x.name);
            period.parentCourse = courseName;
            period.preference = "";
            // console.log(period);
            if (period.set_time === null) {
                const this_period_ban_times = grouped_ban_times.get(period._id);
                if (this_period_ban_times) {
                    period.preference = "Ban Times : ";
                    for (let ban_time_obj of this_period_ban_times)
                        period.preference += `D${Math.floor(ban_time_obj.ban_time / req.user.periods_per_day) + 1}P${(ban_time_obj.ban_time % req.user.periods_per_day) + 1}`
                }
            } else {
                period.preference = `Set Time : D${Math.floor(period.set_time / req.user.periods_per_day) + 1}P${(period.set_time % req.user.periods_per_day) + 1}`
            }
        }
        res.render("getPeriod", {
            periods: periods_data
        });
    });
    app.get("/periodForm/:courseId", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        const [[course], taughtBy, taughtTo, rooms,] = await async_get_query("CALL course_information(" + req.params.courseId + ')');
        for (let prof of taughtBy) {
            prof.profName = prof.name;
            prof._id = prof.professor_id;
        }
        for (let room of rooms) {
            room.roomName = room.name;
            room._id = room.room_id;
        }
        for (let group of taughtTo) {
            group.groupName = group.name;
            group._id = group.group_id;
        }
        res.render("periodForm", {
            taughtBy: taughtBy,
            taughtTo: taughtTo,
            rooms: rooms,
            numberOfDays: req.user.days_per_week,
            periodsPerDay: req.user.periods_per_day,
            courseId: (req.params.courseId)
        });
    });
    app.post("/addPeriod", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        let group_ids = [];
        for(let key in req.body){
            if(!isNaN(key) && req.body[key] === "on"){
                group_ids.push(key);
            }
        }
        const numberOfDays = req.user.days_per_week;
        const periodsPerDay = req.user.periods_per_day;
        let ban_times = []
        for(let iter = 0 ; iter < numberOfDays * periodsPerDay ; iter++){
            if(req.body["antiTimeSpecified" + iter] === "on"){
                ban_times.push(iter);
            }
        }
        const use_set_time = req.body.specifyTime && (!isNaN(req.body.timeSpeicifiedDay)) && (!isNaN(req.body.timeSpeicifiedPeriod)) && Number(req.body.periodFrequency) == 1;
        // console.log(use_set_time, req.body.specifyTime ,!isNaN(req.body.timeSpeicifiedDay) ,!isNaN(req.body.timeSpeicifiedPeriod), );
        let period_Obj = new Object();
        period_Obj.name = req.body.periodName;
        period_Obj.course_id = req.body.courseId;
        period_Obj.professor_id = req.body.profId;
        period_Obj.room_id = req.body.roomId;
        period_Obj.length = req.body.periodLength
        period_Obj.frequency = req.body.periodFrequency;
        if(use_set_time){
            period_Obj.set_time = periodsPerDay * (Number(req.body.timeSpeicifiedDay) - 1) + Number(req.body.timeSpeicifiedPeriod) - 1;
        }
        const period_id = (await async_push_query("INSERT INTO `period` SET ?", period_Obj)).insertId;
        await insert_many_hlpr("period_ban_times", period_id, ban_times);
        await insert_many_hlpr("period_group", period_id, group_ids);
        res.redirect("/periodForm/" + String(req.body.courseId));
    });

    app.get("/deletePeriod/:periodId", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        const {course_id} = (await async_get_query(`SELECT course_id FROM \`period\` WHERE period_id = ${req.params.periodId}`))[0];
        await async_get_query(`DELETE FROM \`period\` WHERE period_id = ${req.params.periodId}`);
        return res.redirect("/period/"+course_id);
    });
}
//time table
{
    app.get("/userDatabaseObject", async (req,res) => {
        if( !req.isAuthenticated())
            return res.redirect("/login");
        const [[user_Object],
            rooms_data, room_ban_times,
            groups_data, group_ban_times,
            professors_data, professor_ban_times, 
            courses_data, 
            period_data, period_group, period_ban_times] = await async_get_query(`CALL entire_university_information(${req.user.university_id})`);

        const room_ban_times_grouped = groupBy(room_ban_times, x => x.room_id);
        const group_ban_times_grouped = groupBy(group_ban_times, x => x.group_id);
        const professor_ban_times_grouped = groupBy(professor_ban_times, x => x.professor_id);
        const period_group_grouped = groupBy(period_group, x => x.period_id);
        const period_ban_times_grouped = groupBy(period_ban_times, x => x.period_id);
        // console.log(room_ban_times_grouped ,group_ban_times_grouped ,professor_ban_times_grouped ,period_group_grouped ,period_ban_times_grouped);
        const room_map = new Map();
        const professor_map = new Map();
        const group_map = new Map();
        for(let room of rooms_data){
            room_map.set(room._id, room); 
            if(room_ban_times_grouped.has(room._id)){
                room.unAvialability = room_ban_times_grouped.get(room._id).map(x => x.ban_time);
            }else{
                room.unAvialability = [];
            }
            room.periodsUsedIn = [];
        }

        for(let group of groups_data){
            group_map.set(group._id, group); 
            if(group_ban_times_grouped.has(group._id)){
                group.unAvialability = group_ban_times_grouped.get(group._id).map(x => x.ban_time);
            }else{
                group.unAvialability = [];
            }
            group.periodsAttended = [];
        }

        for(let professor of professors_data){
            professor_map.set(professor._id, professor); 
            if(professor_ban_times_grouped.has(professor._id)){
                professor.unAvialability = professor_ban_times_grouped.get(professor._id).map(x => x.ban_time);
            }else{
                professor.unAvialability = [];
            }
            professor.periodsTaken = [];
        }
        for(let period of period_data){
            period.groupsAttending = period_group_grouped.get(period._id).map(x => x.group_id);
            if(period_ban_times_grouped.has(period._id))
                period.periodAntiTime = period_ban_times_grouped.get(period._id).map(x => x.ban_time);
            else
                period.periodAntiTime = [];
            period._id = extend_id_to_24_char(period._id);
            room_map.get(period.roomUsed).periodsUsedIn.push(period._id);
            professor_map.get(period.profTaking).periodsTaken.push(period._id);
            for(let group_id of period.groupsAttending)
                group_map.get(group_id).periodsAttended.push(period._id);
        }
        user_Object.rooms = rooms_data;
        user_Object.professors = professors_data;
        user_Object.groups = groups_data;
        user_Object.courses = courses_data;
        user_Object.periods = period_data;
        res.send(user_Object);
    });

    app.get("/generateSchedule", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        const {periods_made} = (await async_get_query(`SELECT EXISTS(SELECT * FROM \`period\` WHERE course_id IN (SELECT course_id FROM course WHERE university_id = ${req.user.university_id})) AS periods_made`))[0];
        if(periods_made)    
            return res.sendFile( __dirname + "/webPages/waitingAnt.html");
        else {
            return res.render("message", { message : "Please make some periods first"})
        }
    });
 
    app.post("/generateSchedule", async (req, res) => {
        if (!req.isAuthenticated())
            return res.redirect("/login");
        const coloring = req.body;
        console.log(coloring);
        try{
            let sql_string_r = "";
            for(let period_Info in coloring){
                let [period_id, length_value, frequency_value] = period_Info.match(/\d+/g);
                let color = coloring[period_Info];
                sql_string_r += `(${period_id}, ${length_value}, ${frequency_value}, ${color}),`;
            }
            await async_get_query(`CALL delete_university_schedule(${req.user.university_id})`);
            await async_get_query("INSERT INTO period_coloring VALUES " + sql_string_r.substring(0, sql_string_r.length - 1));
        }catch(err){
            console.log(err);
            return res.send(err);
        }
        return res.send("done");
    });
    app.get("/viewSchedules", async (req, res) => {
        const scheduleArray = await async_get_query("SELECT `name` AS instituteName, university_id AS _id FROM university");
        res.render("listOfInstitutes", {
            list: scheduleArray
        });
    });
    app.get("/schedule/:userId", async (req, res) => {
        const [prof_data, prof_views, group_data, group_views, ] = await async_get_query(`CALL view_schedule(${req.params.userId})`);
        const prof_views_grouped = groupBy(prof_views, x => x.professor_id);
        const group_views_grouped = groupBy(group_views, x => x.group_id);
        const {
            numberOfDays,
            periodsPerDay
        } = (await async_get_query(`SELECT days_per_week AS numberOfDays, periods_per_day AS periodsPerDay FROM university WHERE university_id = ${req.params.userId}`))[0];
        let sendTable = new Map();
        for(let prof of prof_data){
            let table = new Array(numberOfDays);
            for (let i = 0; i < numberOfDays; i++)
                table[i] = new Array(periodsPerDay);
            for (let i = 0; i < numberOfDays; i++)
                for (let j = 0; j < periodsPerDay; j++)
                    table[i][j] = "Free Period";
            if(prof_views_grouped.has(prof.professor_id)){
                for(let period of prof_views_grouped.get(prof.professor_id)){
                    // console.log(period);
                    table[Math.floor(period.color / periodsPerDay)][period.color % periodsPerDay] = period.name; 
                }
            }
            sendTable.set(prof.name, table);
        }
        for(let group of group_data){
            let table = new Array(numberOfDays);
            for (let i = 0; i < numberOfDays; i++)
                table[i] = new Array(periodsPerDay);
            for (let i = 0; i < numberOfDays; i++)
                for (let j = 0; j < periodsPerDay; j++)
                    table[i][j] = "Free Period";
            if(group_views_grouped.has(group.group_id)){
                for(let period of group_views_grouped.get(group.group_id)){
                    table[Math.floor(period.color / periodsPerDay)][period.color % periodsPerDay] = period.name; 
                }
            }
            sendTable.set(group.name, table);
        }
        // console.log(group_views_grouped);
        // return res.send({prof_data, prof_views, group_data, group_views});
        res.render("timetable", {
            sendTable: sendTable,
            numberOfDays: numberOfDays,
            periodsPerDay: periodsPerDay
        });
    });
    app.get("/viewMySchedule", async (req, res) => {
        if (!req.isAuthenticated())
            res.redirect("/login");
        else
            res.redirect("/schedule/" + String(req.user.university_id));
    });
}

app.listen(process.env.PORT || 3000, () => {
    console.log("listening")
})