import { extractText } from "unpdf";
import {
  parseNewProject,
  parseProjectUpdate,
  parseProjectRoles,
} from "../agents/parseProject.js";
import { supabase, supabaseAdmin } from "../lib/supabaseClient.js";

export async function uploadProjectDoc(req, res) {
  const { projectId } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: "No file provided" });
  }

  try {
    // 1. Extract text from PDF
    console.log("1. Extracting text from PDF...");
    const { text: rawText } = await extractText(new Uint8Array(req.file.buffer));
    console.log("2. Text extracted, length:", rawText.length);
 
    // 2. Upload file to Supabase Storage
    console.log("3. Uploading to storage...");
    const filename = `${Date.now()}_${req.file.originalname}`;
    const { error: storageError } = await supabaseAdmin.storage
      .from("project_docs")
      .upload(`${projectId}/${filename}`, req.file.buffer, {
        contentType: "application/pdf",
      });

    if (storageError) throw storageError;

    const { data: urlData } = supabase.storage
      .from("project_docs")
      .getPublicUrl(`${projectId}/${filename}`);
          // storage upload here
    console.log("4. Storage upload done");

    // 3. Save upload record
    console.log("5. Saving upload record...");
 
    const { data: uploadRecord, error: uploadError } = await supabaseAdmin
      .from("uploads")
      .insert({
        project_id: projectId,
        filename: req.file.originalname,
        file_url: urlData.publicUrl,
        raw_text: rawText,
      })
      .select()
      .single();

    if (uploadError) throw uploadError;
       // insert upload record here
       console.log("6. Upload record saved");   
       
       // 4. Check for existing tasks
       console.log("7. Checking existing tasks...");
    const { data: existingTasks, error: tasksError } = await supabaseAdmin
      .from("tasks")
      .select("*")
      .eq("project_id", projectId);

    if (tasksError) throw tasksError;
    // fetch existing tasks here
    console.log("8. Existing tasks count:", existingTasks?.length);
   
           
    // 5. Generate tasks (new or update)
    console.log("9. Generating tasks with AI...");
    let tasks;
    if (!existingTasks || existingTasks.length === 0) {
      const parsedTasks = await parseNewProject(rawText);

      const { data, error: taskError } = await supabaseAdmin
        .from("tasks")
        .insert(parsedTasks.map((task) => ({ ...task, project_id: projectId })))
        .select();

      if (taskError) throw taskError;
      tasks = data;
    } else {
      const changes = await parseProjectUpdate(rawText, existingTasks);

      tasks = await Promise.all(
        changes.map(async (change) => {
          const { task_id, ...fields } = change;

          if (task_id) {
            const { data, error } = await supabaseAdmin
              .from("tasks")
              .update({ ...fields, updated_at: new Date() })
              .eq("id", task_id)
              .select()
              .single();
            if (error) throw error;
            return data;
          } else {
            const { data, error } = await supabaseAdmin
              .from("tasks")
              .insert({ ...fields, project_id: projectId })
              .select()
              .single();
              // parseNewProject or parseProjectUpdate here
              console.log("10. Tasks generated:", tasks?.length);
            if (error) throw error;


            return data;
          }
        })
      );
    }

           



    // 6. ✅ Generate roles from PDF — AI extracts or infers job titles + headcount
    console.log("11. Generating roles with AI...");
    const roles = await parseProjectRoles(rawText);
    // parseProjectRoles here
    console.log("12. Roles generated:", roles?.length);

    // 7. ✅ Save roles to the project row
    const { error: rolesError } = await supabaseAdmin
      .from("projects")
      .update({ roles })
      .eq("id", projectId);

    if (rolesError) throw rolesError;

    // 8. Return tasks AND roles so frontend can display both immediately
    res.json({ message: "Upload successful", upload: uploadRecord, tasks, roles });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
}