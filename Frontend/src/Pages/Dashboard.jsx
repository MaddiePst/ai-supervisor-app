import React from "react";
import Sidebar from "../Components/Sidebar";
import DonutChart from "../Components/DonutChart";
import TasksSection from "../Components/TasksSection";
import DeadlineCalendar from "../Components/DeadlineCalendar";
import StatsCards from "../Components/StatsCards";

export default function Dashboard() {
  
  return (
    <div className="bg-[#c5c7ca] text-gray-800 flex">
    <Sidebar/>
    <div className="space-y-6 ml-10 ">
      <h1 className="text-3xl font-bold  mt-8">
        AI Supervisor Analyzer
      </h1>
<div className="grid grid-cols-2 gap-10">

      <StatsCards />
      <DonutChart/>
      <TasksSection />
      <DeadlineCalendar />
       </div>
    </div>
    </div>
  );
}
