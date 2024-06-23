"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateRoom = exports.DeletRoom = void 0;
const db_1 = require("../utils/db");
const connections_1 = require("../connections");
const utils_1 = require("./utils");
const DeletRoom = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, db_1.async_get_query)("DELETE FROM room WHERE room_id = " + connections_1.college_scheduler_connection.escape(req.params.roomId), connections_1.college_scheduler_connection);
        return res.status(200).send();
    }
    catch (error) {
        console.error(error);
        return res.status(500).send();
    }
});
exports.DeletRoom = DeletRoom;
const CreateRoom = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const unAvialability = new Array(0);
        for (let loopitrt = 0; loopitrt < req.body.days_per_week * req.body.periods_per_day; loopitrt++)
            if (req.body["periodTaken" + String(loopitrt)] === "on")
                unAvialability.push(loopitrt);
        const room_id = (yield (0, db_1.async_push_query)("INSERT INTO `room` SET ?", {
            university_id: req.user.university_id,
            name: req.body.roomName,
            capacity: req.body.roomCapacity
        }, connections_1.college_scheduler_connection)).insertId;
        yield (0, utils_1.insert_many_hlpr)("room_ban_times", room_id, unAvialability, connections_1.college_scheduler_connection);
    }
    catch (error) {
        res.status(500).send();
    }
    return res.status(200).send();
});
exports.CreateRoom = CreateRoom;
