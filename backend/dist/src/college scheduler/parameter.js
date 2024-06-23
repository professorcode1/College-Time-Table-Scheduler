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
exports.SetParameter = void 0;
const db_1 = require("../utils/db");
const connections_1 = require("../connections");
const SetParameter = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const sql_string = "CALL update_paramterers(" +
        req.user.university_id + ',' + connections_1.college_scheduler_connection.escape(req.body.periods_per_day) + ',' + connections_1.college_scheduler_connection.escape(req.body.days_per_week) + ')';
    try {
        yield (0, db_1.async_get_query)(sql_string, connections_1.college_scheduler_connection);
        return res.status(200).send();
    }
    catch (error) {
        console.log(error);
        return res.status(500).send();
    }
});
exports.SetParameter = SetParameter;
