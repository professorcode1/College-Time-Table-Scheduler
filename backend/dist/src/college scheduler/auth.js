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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Authenticate = exports.RegisterRoute = exports.LoginRoute = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = require("../utils/db");
const connections_1 = require("../connections");
const write_thapar_records_to_db_1 = require("./write_thapar_records_to_db");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Authenticate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.cookies.token;
    try {
        const { university_id } = jsonwebtoken_1.default.verify(token, process.env.JWTEncryptionToken);
        // @ts-ignore
        req.user = { university_id };
        next();
    }
    catch (error) {
        return res.status(403).send("invalid/expired token");
    }
});
exports.Authenticate = Authenticate;
const LoginRoute = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query_ = `
    SELECT university_id, password as hashedPassword
    FROM university 
    WHERE email = ${connections_1.college_scheduler_connection.escape(req.body.email)}
    `;
    const users_list = yield (0, db_1.async_get_query)(query_, connections_1.college_scheduler_connection);
    if (users_list.length === 0) {
        return res.status(401).send("Invalid username");
    }
    const { university_id, hashedPassword } = users_list[0];
    if (!(yield bcrypt_1.default.compare(req.body.password, hashedPassword))) {
        return res.status(401).send("Invalid password");
    }
    const token = jsonwebtoken_1.default.sign({ university_id }, process.env.JWTEncryptionToken, { expiresIn: "8h" });
    res.status(200).send(token);
});
exports.LoginRoute = LoginRoute;
const RegisterRoute = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const hashedPassword = yield bcrypt_1.default.hash(req.body.password, 10);
        if ((yield (0, db_1.async_get_query)("SELECT EXISTS(SELECT * FROM university WHERE email = " + connections_1.college_scheduler_connection.escape(req.body.email) + ") AS email_used", connections_1.college_scheduler_connection))[0].email_used) {
            return res.status(400).send("This email is already in use");
        }
        const university_query_result = yield (0, db_1.async_push_query)("INSERT INTO university SET ?", {
            name: req.body.instituteName,
            email: req.body.email,
            password: hashedPassword
        }, connections_1.college_scheduler_connection);
        const university_id = university_query_result.insertId;
        if (req.body.useSample) {
            yield (0, write_thapar_records_to_db_1.write_thapars_record_to_db)(university_id, connections_1.college_scheduler_connection);
        }
        const token = jsonwebtoken_1.default.sign({ university_id }, process.env.JWTEncryptionToken, { expiresIn: "8h" });
        res.status(200).send(token);
    }
    catch (err) {
        console.log(err);
        res.status(500).send("Some internal error occured");
    }
});
exports.RegisterRoute = RegisterRoute;
