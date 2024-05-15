import axios from "axios";

async function getCurrentTimeFromInterntionalServer():Promise<string>{
    try {
        return ((await axios.get("https://worldtimeapi.org/api/timezone/Asia/Kolkata")).data.datetime as string).split('.')[0] 
    } catch (error) {
        console.error(error)
        return ""
    }
}

export {getCurrentTimeFromInterntionalServer}