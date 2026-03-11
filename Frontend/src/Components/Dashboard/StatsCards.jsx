import React from "react"

export default function StatsCards(){
  return <div className ="grid grid-cols-2 gap-4">
    <div className="bg-white/60 rounded-2xl p-6 shadow-xl">
      <p>Team Utilization Rate </p>
      <h3 className="text-2xl font-bold">80%</h3>
    </div>

    <div className="bg-linear-to-r from-blue-900 to-cyan-500 text-gray-300 shadow rounded-2xl p-6">
      <p>Project Deadline</p>
      <h3 className="text-2xl font-bold">Date </h3>
    </div>

    <div className="bg-linear-to-r from-blue-900 to-cyan-500 text-gray-300 rounded-2xl p-6 shadow">
      <p >Tasks left</p>
      <h3 className="text-2xl font-bold">7</h3>
    </div>

    <div className="bg-white/60 rounded-2xl p-6 shadow">
      <p >Completed Tasks</p>
      <h3 className="text-2xl font-bold">70%</h3>
    </div>
  </div>
  
}