import * as React from "react"
import LoginImage from "../assets/login.jpg"
import { useAppDispatch } from "../redux/main";

import axios from "axios";
import { URLBase } from "../utils/URLBase";
import Cookies from 'js-cookie';
import { Link, useNavigate } from "react-router-dom";

const Login:React.FC<{}> = ()=>{
    const navigate = useNavigate();

    const [LoginFormState, setLoginFormState] = React.useState({
        email:"",
        password:""
    });
    const dispatcher = useAppDispatch();
    const OnLoginSubmit = async () => {
        try {
            const loginRes = await axios.post(`${URLBase}/login`,LoginFormState, {
                withCredentials:true
            });
            
            if(loginRes.status === 200){
                Cookies.set("token", loginRes.data)
                navigate("/collegeSchduler/Homescreen");
            }else{
                throw Error();
            }
        } catch (error) {
            alert("Sorry! Unable to login.\t"+ (error as Error).message)
        }

    }
    return (
        <div className="relative h-screen w-screen">
            <img src={LoginImage} className="h-screen w-screen absolute top-0 left-0" />
            <div className="absolute h-screen w-screen top-0 left-0">
                <div className="h-full w-full flex items-center justify-center">
                    <div className="bg-white h-1/2 w-2/3 rounded opacity-90 p-4 flex flex-col justify-between">
                        <p className="text-3xl font-bold text-black">Login</p>
                        <div className="flex mt-4">
                            <p className="text-xl mr-2 w-24">Username</p>
                            <input 
                                className="bg-white border-black border-2" 
                                value={LoginFormState.email}
                                onChange={(event)=>setLoginFormState({
                                    password:LoginFormState.password,
                                    email:event.target.value 
                                })}
                            />
                        </div>
                        <div className="flex mt-4">
                           <p className="text-xl mr-2 w-24">Password</p>
                            <input 
                                type="password" className="bg-white border-black border-2"
                                value={LoginFormState.password}
                                onChange={(event)=>setLoginFormState({
                                    email: LoginFormState.email,
                                    password:event.target.value,
                                })} 
                            />
                        </div>
                        <div className="flex">
                            <button 
                                className="opacity-100 w-24 bg-green-800 text-white font-bold p-2 rounded mr-2"
                                onClick={OnLoginSubmit}
                            >Submit</button>
                            <Link
                                className="opacity-100 w-24 bg-sky-800 text-white font-bold p-2 rounded"
                                to="/collegeSchduler"
                            >Back</Link>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}

export {Login}