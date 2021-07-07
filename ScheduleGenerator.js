const {
    Worker,
    isMainThread,
    parentPort,
    workerData
} = require('worker_threads');
const GeneticAlgorithm = require('build/Release/GeneticAlgorithmJS.node');
const Graph = require("graph");

process.on("message", message => {
    process.send(ScheduleGenerator(JSON.parse(message.user)));
    process.exit();
});
ScheduleGenerator = (user) => {
    const {
        numberOfDays,
        periodsPerDay
    } = user;
    let schedulerGraph = new Graph.Graph();
    //Initialising Graph Below
    {
        const periods = user.periods;
        const groups = user.groups;
        const rooms = user.rooms;
        const profs = user.professors;
        // io.emit("message", {
        //     case: "message",
        //     message: "Initialising graph"
        // });
        process.send({
            case: "emit",
            emit: {
                case: "message",
                message: "Initialising::Graph"
            }
        });
        console.log("Initialising graph");
        if (user.numberOfDays == 0 && user.periodsPerDay == 0)
            return console.log("Completed Initialising Graph");
        for (let lpitrt = 1; lpitrt < numberOfDays * periodsPerDay; lpitrt++)
            for (let lpitrt1 = 0; lpitrt1 < lpitrt; lpitrt1++)
                schedulerGraph.set(lpitrt, lpitrt1);

        for (const room of rooms) {

            for (let lpitrt = 0; lpitrt < room.periodsUsedIn.length; lpitrt++) {
                for (let lpitrt1 = 0; lpitrt1 < lpitrt; lpitrt1++)
                    schedulerGraph.set(String(room.periodsUsedIn[lpitrt]) + "Period0", String(room.periodsUsedIn[lpitrt1]) + "Period0");


                for (const roomUnavailabiliy of room.unAvialability)
                    schedulerGraph.set(roomUnavailabiliy, String(room.periodsUsedIn[lpitrt]) + "Period0");
            }
        }
        process.send({
            case: "emit",
            emit: {
                case: "message",
                message: "Initialising::Rooms Complete"
            }
        });
        console.log("Initialise::Rooms Complete");

        for (const prof of profs) {
            for (let lpitrt = 0; lpitrt < prof.periodsTaken.length; lpitrt++) {
                for (let lpitrt1 = 0; lpitrt1 < lpitrt; lpitrt1++)
                    schedulerGraph.set(String(prof.periodsTaken[lpitrt]) + "Period0", String(prof.periodsTaken[lpitrt1]) + "Period0");


                for (const profUnavailabiliy of prof.unAvialability)
                    schedulerGraph.set(profUnavailabiliy, String(prof.periodsTaken[lpitrt]) + "Period0");
            }
        }
        process.send({
            case: "emit",
            emit: {
                case: "message",
                message: "Initialising::Professors Complete"
            }
        });
        console.log("Initialise::Prof Done");

        for (const group of groups) {
            for (let lpitrt = 0; lpitrt < group.periodsAttended.length; lpitrt++) {
                for (let lpitrt1 = 0; lpitrt1 < lpitrt; lpitrt1++)
                    schedulerGraph.set(String(group.periodsAttended[lpitrt]) + "Period0", String(group.periodsAttended[lpitrt1]) + "Period0");


                for (const groupUnavailabiliy of group.unAvialability)
                    schedulerGraph.set(groupUnavailabiliy, String(group.periodsAttended[lpitrt]) + "Period0");
            }
        }
        process.send({
            case: "emit",
            emit: {
                case: "message",
                message: "Initialising::Groups Complete"
            }
        });
        console.log("Initialise::Group Done");

        for (const period of periods) {
            console.log("Initialise::" + period.periodName);
            process.send({
                case: "emit",
                emit: {
                    case: "message",
                    message: "Initialising::Period " + period.periodName
                }
            });
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
                        for (let perLen = 0; perLen < period.periodLength; perLen++)
                            if (Number(antiTime) + perLen < numberOfDays * periodsPerDay)
                                schedulerGraph.set(Number(antiTime) + perLen, String(period._id) + "Period" + String(perLen));
                }
            }


            for (let itrt = Number(period.periodLength) - 1; itrt > 0; itrt--)
                for (let day = 0; day < numberOfDays; day++)
                    schedulerGraph.set(day * periodsPerDay + periodsPerDay - itrt, String(period._id) + "Period0");

            for (let len = 1; len < Number(period.periodLength); len++)
                for (let len1 = 0; len1 < len; len1++)
                    schedulerGraph.set(String(period._id) + "Period" + String(len), String(period._id) + "Period" + String(len1));
        }
        let hlprGraph = schedulerGraph.copy();
        schedulerGraph = new Graph.Graph();

        for (let i = 0; i < numberOfDays * periodsPerDay; i++)
            for (let j = 0; j < i; j++)
                schedulerGraph.set(i, j);

        for (const period of periods)
            for (let freq = 0; freq < Number(period.periodFrequency); freq++)
                for (let len = 0; len < Number(period.periodLength); len++) {
                    const thisPeriodNode = String(period._id) + "Period" + String(len) + "Freq" + String(freq);

                    //a corner case someone can use to break the application is to make 1 period for a university with 1 day and 1 period per day
                    //thus creating a graph in which case neither the nodes will come into existence since the graph is intialised via edges
                    //to avoide that edge case i.e. any graph with disjoint nodes,all nodes are first attached then detacched from 0,to create the nodes
                    schedulerGraph.set(0,thisPeriodNode);
                    schedulerGraph.del(0,thisPeriodNode);

                    for (let freq1 = 0; freq1 < freq; freq1++)
                        for (let len1 = 0; len1 < Number(period.periodLength); len1++)
                            schedulerGraph.set(thisPeriodNode, String(period._id) + "Period" + String(len1) + "Freq" + String(freq1))

                    for (const neighborNode in hlprGraph.adj(String(period._id) + "Period" + String(len)))
                        if (String(neighborNode).length > 24) {
                            let neighborPeriod = periods.find(periodItrt => String(periodItrt._id) == neighborNode.slice(0, 24));
                            for (let freq1 = 0; freq1 < Number(neighborPeriod.periodFrequency); freq1++)
                                schedulerGraph.set(thisPeriodNode, neighborNode + "Freq" + String(freq1));
                        } else
                            schedulerGraph.set(thisPeriodNode, neighborNode);

                }

        //Checking if time table is possible
        let abort = false;
        for (const node in schedulerGraph._graph) {
            let inConflict = true;
            for (let periodNumber = 0; periodNumber < numberOfDays * periodsPerDay; periodNumber++)
                inConflict = inConflict && schedulerGraph.has(node, periodNumber);
            if (inConflict) {
                abort = true;
                const nodeString = String(node);
                const period = user.periods.find(period => String(period._id) == nodeString.slice(0, 24));
                console.log("WARNING:The period " + period.periodName + " causing impossible time table config.");
                process.send({
                    case: "emit",
                    emit: {
                        case: "warning",
                        message: "WARNING:The period " + period.periodName + " causing impossible time table config."
                    }
                });

            }
        }
        if (abort)
            return {
                case: "emit",
                emit: {
                    case: "abort"
                }
            };
    }

    process.send({
        case: "emit",
        emit: {
            case: "Initalisation_Success",
            message: "Initialisation::Complete"
        }
    });
    console.log("Initialisation Complete");

    //Calling the genetic algorithm in c++
    {
        let nodesThenItsNeighbors = new Array();
        for (const node of schedulerGraph._vertices) {
            nodesThenItsNeighbors.push(String(node));
            nodesThenItsNeighbors.push(schedulerGraph._graph[node]);
        }
        let PerLnGtOne = new Object();
        for (const period of user.periods)
            if (Number(period.periodLength) > 1) {
                PerLnGtOne[String(period._id)] = 1;
                PerLnGtOne[String(period._id) + "Length"] = Number(period.periodLength);
                PerLnGtOne[String(period._id) + "Frequency"] = Number(period.periodFrequency);
            }
        let periodsCppArgs = new Array();
        for (const period of user.periods) {
            let obj = new Object();
            obj["id"] = String(period._id);
            obj["length"] = Number(period.periodLength);
            obj["frequency"] = Number(period.periodFrequency);
            periodsCppArgs.push(obj);
        }
        console.log("Calling genetic algorithm constructor.");
        let generation = 0;
        const GeneticAlgorithmObject = new GeneticAlgorithm.Cpp(numberOfDays * periodsPerDay, schedulerGraph._vertices.length, ...nodesThenItsNeighbors, PerLnGtOne, user.periods.length, ...periodsCppArgs);
        console.log("starting loop");
        while (GeneticAlgorithmObject.conflictsInBestSoFarColoring() > 0) {
            generation = generation + 1;
            console.log("calling the algorithm");
            if (GeneticAlgorithmObject.geneticAlgorithmForGraphColoring()) {
                process.send({
                    case: "emit",
                    emit: {
                        case: "failure"
                    }
                });
                let schedule = new Object();
                schedule.case = "schedule";
                schedule.schedule = GeneticAlgorithmObject.bestSoFar();
                return schedule;
            }
            process.send({
                case: "emit",
                emit: {
                    case: "algorithm_update",
                    conflicts : GeneticAlgorithmObject.conflictsInBestSoFarColoring(),
                    generation : generation
                }
            });
            console.log("Current Conflicts in graph being colored:" + GeneticAlgorithmObject.conflictsInBestSoFarColoring());
        }
        let schedule = new Object();
        schedule.case = "schedule";
        schedule.schedule = GeneticAlgorithmObject.bestSoFar();
        return schedule;
    }
}