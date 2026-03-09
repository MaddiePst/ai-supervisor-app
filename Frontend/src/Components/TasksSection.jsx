import React, { useState } from "react";

export default function TasksByPercentage() {
  const [tasks, setTasks] = useState([
    { id: 1, name: "Implement Authentication Flow",percent:80 },
    { id: 2, name: "Build REST API Endpoints",percent:80},
    { id: 3, name: "Create Database Schema",percent:80 },
    { id: 4, name: "Integrate Third-Party API",percent:80 },
    { id: 5, name: "Build Dashboard Components",percent:80 },
    { id: 6, name: "Implement Role-Based Access Control" },
    { id: 7, name: "Develop User Profile System", percent: 20 },
    { id: 8, name: "Implement Notifications System", percent: 20 },
    { id: 9, name: "Create File Upload Feature", percent: 20 },
    { id: 10, name: "Build Search Functionality", percent: 20 },
  ]);

  return (
    <div className="bg-white/10 rounded-2xl  p-6 w-full max-w-xl text-gray-700 shadow-lg">
      
      <h3 className="text-lg font-semibold mb-6">Tasks by Progress</h3>

      <div className="space-y-5">
        {tasks.map((task) => (
          <div key={task.id}>
            
            {/* Task title and percentage */}
            <div className="flex justify-between mb-1 text-sm">
              <span>{task.name}</span>
              <span>{task.percent}%</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-linear-to-r from-blue-900 to-cyan-500 h-2 rounded-full transition-all"
                style={{ width: `${task.percent}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
