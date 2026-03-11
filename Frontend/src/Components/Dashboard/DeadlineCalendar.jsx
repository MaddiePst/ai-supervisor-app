import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import React, { useState } from "react";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

export default function DeadlineCalendar() {
  const [events, setEvents] = useState([]);

  const handleSelectSlot = ({ start }) => {
    const title = prompt("Enter event:");

    if (title) {
      setEvents([
        ...events,
        {
          title,
          start,
          end: start,
        },
      ]);
    }
  };

  return (
    <div className="h-120  p-5 rounded-xl ">
      <h2 className="text-xl font-bold mb-4">Project Calendar</h2>

      <Calendar
        selectable
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={["month"]}
        defaultView="month"
        toolbar={false}
        style={{ height: 300, width: 400 }}
        onSelectSlot={handleSelectSlot}
      />
    </div>
  );
}
