import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

const COLORS = ["#8b5cf6", "#06b6d4", "#FDD835", "#f97316", "#ef4444"];

export default function DonutChart() {
  // 1 Chart data stored in state
  const [data, setData] = useState([
    { name: "Frontend", value: 2 },
    { name: "Backend", value: 1 },
    { name: "PostgreSQL", value: 1 },
    { name: "AI ", value: 1 },
  ]);
  const [skillCoverage,setSkillCoverage] = useState(100);

  //  Simulate automatic updates (like new analysis results)
  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) =>
        prev.map((item) => ({
          ...item,
          value: Math.max(1, item.value + Math.floor(Math.random() * 2 - 0.5)),
        }))
      );
    }, 100000); // updates every 10 min

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white/60 backdrop-blur-md p-4 pr-0 rounded-2xl shadow">
      <h3 className="text-lg font-semibold mb-4">Project Progress by Person/Skill/Department</h3>
      <div className="grid grid-cols-2">

      <PieChart width={250} height={200}>
        {/* Outer Pie */}
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}   
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
          >
         
          {data.map((entry, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
         {/* Inner Pie */}
         <Pie
          data={[{ value: skillCoverage }]}
          cx="50%"
          cy="50%"
          innerRadius={40}   
          outerRadius={60}
          paddingAngle={3}
          dataKey="value"
          fill="#22c55e" 
          ></Pie>
        <Tooltip />
      </PieChart>
       {/* Coverage label */}
  <div className="text-center">
    <p className="text-gray-800 text-sm">Skill Coverage</p>
    <p className="text-2xl font-bold text-green-600">
      {skillCoverage}%
    </p>
  {/* </div> */}

      {/* <div> */}
  {data.map((entry, index) => (
    <div className="ml-10 m-2 flex items-center gap-2" key={entry.name}>
      
      <span
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: COLORS[index % COLORS.length] }}
      ></span>

      <span>
        {entry.name} - {entry.value}
      </span>

    </div>
  ))}
</div>


    </div>
    </div>
  );
}
