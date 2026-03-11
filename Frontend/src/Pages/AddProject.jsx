import React,{useState} from "react";
import Sidebar from "../Components/Sidebar";
import TasksSection from "../Components/TasksSection";

export default function AddProject(){
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (selectedFile) => {
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      alert("Please upload a PDF file");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  };

  const handleChange = (e) => {
    const selectedFile = e.target.files[0];
    handleFile(selectedFile);
  };

  
  return (

    <div className="bg-[#c5c7ca] text-gray-800 flex flex-col-2">
      <Sidebar/>
      {/* Drag and Drop Section */}
      <div className="flex flex-col flex-1 p-6">

      {/* Upload Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`h-70 flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer transition shadow-2xl
        ${dragActive ? "border-blue-500 bg-blue-50" : "border-blue-500 bg-gray-100"}`}
      >

        <input
          type="file"
          accept="application/pdf"
          onChange={handleChange}
          className="hidden"
          id="pdfUpload"
        />

        <label htmlFor="pdfUpload" className="cursor-pointer text-center">
          <p className="text-xl font-semibold">Upload PDF</p>
          <p className="text-gray-500 text-sm">
            Drag & drop your file here or click to browse
          </p>
        </label>

      </div>

      {/* File Preview */}
      {file && (
        <div className="flex items-center gap-4 bg-gray-100 p-3 rounded-lg justify-between shadow-2xl mt-2">

          <span className="text-sm font-medium truncate">
            {file.name}
          </span>

          <button
            onClick={() => setFile(null)}
            className="text-red-700 font-semibold"
          >
            Remove
          </button>

        </div>
      )}

<div className="flex-1 mt-6">
  <TasksSection showActions={true} />
</div>
    </div>

    </div>
  );
}