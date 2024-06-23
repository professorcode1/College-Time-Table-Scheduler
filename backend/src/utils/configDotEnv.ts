import path from 'path';
import fs from 'fs'
const dotenv = require('dotenv')
const envFilePath = path.resolve(process.cwd(), '.env');
const envFilePathInDist = path.resolve(process.cwd(),'dist', '.env');
// Check if the .env file exists
function configure_dotnev(){
    if (fs.existsSync(envFilePath)) {
        console.log(`${envFilePath} exists, using that to config`)
        dotenv.config({path:envFilePath})
    }else if(fs.existsSync(envFilePathInDist)){
        console.log(`${envFilePathInDist} exists, using that to config`)
        dotenv.config({path:envFilePathInDist})
    }else{
        throw Error("unable to find .env file")
    }
}

function get_build_path(){
    if(fs.existsSync(path.join(process.cwd(),'build'))){
        return path.join(process.cwd(),'build');
    }else if(fs.existsSync(path.join(process.cwd(),'dist', 'build'))){
        return path.join(process.cwd(),'dist' ,'build');
    }else{
        throw Error("no build folder exists")
    }
}

function get_waiting_ant_path(){
    if(fs.existsSync(path.join(process.cwd(),'waitingAnt.html'))){
        return path.join(process.cwd(),'waitingAnt.html');
    }else if(fs.existsSync(path.join(process.cwd(),'dist', 'waitingAnt.html'))){
        return path.join(process.cwd(),'dist' ,'waitingAnt.html');
    }else{
        throw Error("no build folder exists")
    }
}

export {configure_dotnev,get_build_path, get_waiting_ant_path}