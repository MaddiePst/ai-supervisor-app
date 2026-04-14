import React, {useState} from "react";
import Toggle from "./Toggle";

export default function Notifications (){
  const [emailNotif, setEmailNotif] = useState(false);
  const [pushNotif, setPushNotif] = useState(true);
  const [weekNotif, setWeekNotif] = useState(true);

  return  <div className="max-w-3xl p-6 rounded-3xl shadow-2xl bg-[#cfd3d7] ">
      <h2 className="text-xl font-semibold mb-10">Notifications</h2>
     
        <div className="flex justify-between items-center mb-10">
          <div>
        <span className="text-lg">Email Alerts</span>
        <p className="text-xs">Receive email notifications for important updates</p>
        </div>
        <Toggle enabled={emailNotif} setEnabled={setEmailNotif} />
        </div>
      

        <div className="flex justify-between items-center mb-10">
      <div>
        <span className="text-lg">Push Notifications</span>
        <p className="text-xs">Get push notifications in your browser</p>
        </div>
        <Toggle enabled={pushNotif} setEnabled={setPushNotif} />
      </div>

      <div className="flex justify-between items-center mb-10">
      <div>
        <span className="text-lg">Weekly Reports</span>
        <p className="text-xs">Weekly summary of the project</p>
        </div>
        <Toggle enabled={weekNotif} setEnabled={setWeekNotif} />
      </div>

      
    </div>
}