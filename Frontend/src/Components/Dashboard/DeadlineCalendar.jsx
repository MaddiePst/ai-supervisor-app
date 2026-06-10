import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import React from "react";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

export default function DeadlineCalendar({ events = [] }) {
  return (
    <div className="bg-white/60 p-5 rounded-2xl shadow">
      <h2 className="text-xl font-bold mb-4">Project Deadlines</h2>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={["month"]}
        defaultView="month"
        toolbar={false}
        style={{ height: 300, width: 400 }}
      />
    </div>
  );
}
