import React, { useState } from "react";
import addBox from "../assets/addBox.svg";

import {
  DndContext,
  closestCenter
} from "@dnd-kit/core";

import {
  arrayMove,                            //Moves items in an array
  SortableContext,                     //Enables sortable items
  verticalListSortingStrategy,         //Enables sortable items
  useSortable                         //Hook that makes items draggable
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";


/* ------------------ DRAGGABLE TASK ------------------ */

function SortableTask({
  task,
  showActions,
  startEdit,
  deleteTask,
  editingTaskId,
  editingValues,
  setEditingValues,
  saveEdit
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task.id });

    // transform/Drag animation style 
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  // Checks if this task is currently being edited
  const isEditing = editingTaskId === task.id;

  return (
    <div
    // Connects this DOM element to DnD 
      ref={setNodeRef}
      // Adds the transform animation
      style={style}
      // Enable drag only when allowed
      {...(showActions && !isEditing ? attributes : {})}
{...(showActions && !isEditing ? listeners : {})}
// Cursor style
className={showActions && !isEditing ? "cursor-grab active:cursor-grabbing" : ""}
    >
      <div className="flex justify-between items-center mb-1 text-sm">

        {/* TASK NAME */}
        {isEditing ? (
          <input
            value={editingValues.name}
            onChange={(e) =>
              setEditingValues({
                ...editingValues,
                name: e.target.value
              })
            }
            className="border px-2 py-1 rounded"
          />
        ) : (
          <span>{task.name}</span>
        )}

        <div className="flex items-center gap-3">

          {/* TASK PERCENT */}
          {isEditing ? (
            <input
              type="number"
              value={editingValues.percent}
              onChange={(e) =>
                setEditingValues({
                  ...editingValues,
                  percent: Number(e.target.value)
                })
              }
              className="border w-16 px-2 py-1 rounded"
            />
          ) : (
            <span>{task.percent}%</span>
          )}

          {showActions && (
            <>
              {isEditing ? (
                <button
                onClick={(e) => {
                  e.stopPropagation();
                  saveEdit();
                }}
                className="text-green-600 text-xs"
              >
                Save
              </button>
              ) : (
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    startEdit(task);
                  }}
                  className="text-blue-600 text-xs"
                >
                  Edit
                </button>
                )}

<button
onPointerDown={(e) => e.stopPropagation()}
  onClick={(e) => {
    e.stopPropagation();
     deleteTask(task.id)}}
                className="text-red-600 text-xs"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="bg-linear-to-r from-blue-900 to-cyan-500 h-2 rounded-full transition-all"
          style={{ width: `${task.percent}%` }}
        />
      </div>
    </div>
  );
}


/* ------------------ MAIN COMPONENT ------------------ */

export default function TasksByPercentage({ showActions = false }) {

  const [tasks, setTasks] = useState([
    { id: 1, name: "Implement Authentication Flow", percent: 80 },
    { id: 2, name: "Build REST API Endpoints", percent: 80 },
    { id: 3, name: "Create Database Schema", percent: 80 },
    { id: 4, name: "Integrate Third-Party API", percent: 80 },
    { id: 5, name: "Build Dashboard Components", percent: 80 },
    { id: 6, name: "Implement Role-Based Access Control", percent: 0 }
  ]);

  const [newTaskName, setNewTaskName] = useState("");
  const [showInput, setShowInput] = useState(false);

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingValues, setEditingValues] = useState({ name: "", percent: 0 });


  /* ---------- ADD TASK ---------- */

  const addTask = () => {

    if (!showInput) {
      setShowInput(true);
      return;
    }

    if (!newTaskName.trim()) return;

    const newTask = {
      id: Date.now(),
      name: newTaskName,
      percent: 0
    };

    setTasks([...tasks, newTask]);
    setNewTaskName("");
    setShowInput(false);
  };


  /* ---------- DELETE TASK ---------- */

  const deleteTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };


  /* ---------- EDIT TASK ---------- */

  const startEdit = (task) => {
    setEditingTaskId(task.id);
    setEditingValues({ name: task.name, percent: task.percent });
  };

  const saveEdit = () => {

    setTasks(
      tasks.map((task) =>
        task.id === editingTaskId
          ? { ...task, ...editingValues }
          : task
      )
    );

    setEditingTaskId(null);
  };


  /* ---------- DRAG & DROP ---------- */

  const handleDragEnd = (event) => {

    const { active, over } = event;

    if (!over) return;

    if (active.id !== over.id) {

      setTasks((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });

    }
  };


  /* ---------- UI ---------- */

  return (
    <div className="bg-white/10 rounded-2xl mt-7 p-6 w-full text-gray-700 shadow-lg">

      {/* HEADER */}

      <div className="mb-6 flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tasks by Progress</h3>

        {showActions && (
          <button onClick={addTask}>
            <img src={addBox} alt="Add Task" className="w-8 h-8" />
          </button>
        )}
      </div>


      {/* INPUT */}

      {showActions && showInput && (
        <div className="flex gap-2 mb-6">

          <input
            type="text"
            placeholder="New task..."
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}

            onKeyDown={(e) => {
              if (e.key === "Enter") {
                addTask();
              }
            }}

            className="border rounded px-3 py-1 w-full"
            autoFocus
          />

        </div>
      )}


      {/* TASK LIST */}

      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={showActions ? handleDragEnd : undefined}
      >

        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >

          <div className="space-y-5">

            {tasks.map((task) => (
              <SortableTask
                key={task.id}
                task={task}
                showActions={showActions}
                startEdit={startEdit}
                deleteTask={deleteTask}
                editingTaskId={editingTaskId}
                editingValues={editingValues}
                setEditingValues={setEditingValues}
                saveEdit={saveEdit}
              />
            ))}

          </div>

        </SortableContext>

      </DndContext>

    </div>
  );
}