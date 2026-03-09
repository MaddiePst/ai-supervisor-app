import React from "react";
import googleIcon from "../../../assets/google.svg"
import appleIcon from "../../../assets/apple.svg"
 export default function SocialAuthButtons(){ 
  return ( 
  <>
   {/* Divider */} 
   <div className="mt-2 flex flex-col gap-3">
     <div className="flex items-center my-1"> 
      <hr className="grow border-gray-600" /> 
      <span className="px-2 text-gray-400 text-sm">OR</span> 
      <hr className="grow border-gray-600" /> 
      </div> 
{/* Buttons */}
      <div className="grid grid-cols-2 gap-5">    
      <button className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-600 hover:bg-gray-700 transition">
         <img src={googleIcon} alt="Google" className="w-5 h-5" /> 
         Continue with Google 
         </button> 
         <button className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-600 hover:bg-gray-700 transition"> 
          <img src={appleIcon} alt="Apple" className="w-5 h-5" /> 
          Continue with Apple </button> 
          </div>
          </div> 
          </> 
          ) 
        }