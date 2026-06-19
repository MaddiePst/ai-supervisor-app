import { extractText } from "unpdf";
import { parseNewProject, parseProjectUpdate } from "../agents/parseProject.js";
import { supabase } from "../lib/supabaseClient.js";;

export async function uploadProjectDoc(req, res) {
  const { projectId } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: "No file provided" });
  }

  try {
    const { text: rawText } = await extractText(new Uint8Array(req.file.buffer));

    const filename = `${Date.now()}_${req.file.originalname}`;
    const { error: storageError } = await supabase.storage
      .from("project_docs")
      .upload(`${projectId}/${filename}`, req.file.buffer, {
        contentType: "application/pdf",
      });

    if (storageError) throw storageError;

    const { data: urlData } = supabase.storage
      .from("project-docs")
      .getPublicUrl(`${projectId}/${filename}`);

    const { data: uploadRecord, error: uploadError } = await supabase
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

    const { data: existingTasks, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId);

    if (tasksError) throw tasksError;

    let tasks;

    if (!existingTasks || existingTasks.length === 0) {
      const parsedTasks = await parseNewProject(rawText);

      const { data, error: taskError } = await supabase
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
            const { data, error } = await supabase
              .from("tasks")
              .update({ ...fields, updated_at: new Date() })
              .eq("id", task_id)
              .select()
              .single();
            if (error) throw error;
            return data;
          } else {
            const { data, error } = await supabase
              .from("tasks")
              .insert({ ...fields, project_id: projectId })
              .select()
              .single();
            if (error) throw error;
            return data;
          }
        }),
      );
    }

    res.json({ message: "Upload successful", upload: uploadRecord, tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
