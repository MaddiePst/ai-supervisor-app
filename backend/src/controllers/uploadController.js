import { extractText } from "unpdf";
import {
  parseNewProject,
  parseProjectUpdate,
  parseProjectRoles,
} from "../agents/parseProject.js";
import { supabaseAdmin } from "../lib/supabaseClient.js";

export async function uploadProjectDoc(req, res) {
  const { projectId } = req.params;

  try {
    let rawText = "";

    if (req.file) {
      // ── PDF uploaded — extract text from it ──────────────────────────────
      console.log("1. Extracting text from PDF...");
      const { text } = await extractText(new Uint8Array(req.file.buffer));
      rawText = text || "";
      console.log("2. Text extracted, length:", rawText.length);

      // Upload file to Supabase Storage
      console.log("3. Uploading to storage...");
      const filename = `${Date.now()}_${req.file.originalname}`;
      const { error: storageError } = await supabaseAdmin.storage
        .from("project_docs")
        .upload(`${projectId}/${filename}`, req.file.buffer, {
          contentType: "application/pdf",
        });
      if (storageError) throw storageError;
      console.log("4. Storage upload done");

      const { data: urlData } = supabaseAdmin.storage
        .from("project_docs")
        .getPublicUrl(`${projectId}/${filename}`);

      // Save upload record
      console.log("5. Saving upload record...");
      const { error: uploadError } = await supabaseAdmin
        .from("uploads")
        .insert({
          project_id: projectId,
          filename: req.file.originalname,
          file_url: urlData.publicUrl,
          raw_text: rawText,
        });
      if (uploadError) throw uploadError;
      console.log("6. Upload record saved");
    } else {
      // ── No PDF — fetch project name + description to use as AI prompt ───
      console.log("1. No PDF — fetching project details for AI...");
      const { data: project, error: projError } = await supabaseAdmin
        .from("projects")
        .select("name, description")
        .eq("id", projectId)
        .single();

      if (projError || !project) throw new Error("Project not found");

      rawText = `Project Name: ${project.name}\n\nDescription: ${
        project.description || "No description provided."
      }`;
      console.log("2. Using project details as AI input");
    }

    // ── Check for existing tasks ──────────────────────────────────────────
    console.log("7. Checking existing tasks...");
    const { data: existingTasks, error: tasksError } = await supabaseAdmin
      .from("tasks")
      .select("*")
      .eq("project_id", projectId);
    if (tasksError) throw tasksError;
    console.log("8. Existing tasks count:", existingTasks?.length);

    // ── Generate tasks ────────────────────────────────────────────────────
    console.log("9. Generating tasks with AI...");
    let tasks = [];

    if (!existingTasks || existingTasks.length === 0) {
      const parsedTasks = await parseNewProject(rawText);
      console.log("10. Tasks generated:", parsedTasks?.length);

      const { data, error: taskError } = await supabaseAdmin
        .from("tasks")
        .insert(
          parsedTasks.map((task) => ({ ...task, project_id: projectId }))
        )
        .select();
      if (taskError) throw taskError;
      tasks = data;
    } else {
      const changes = await parseProjectUpdate(rawText, existingTasks);
      console.log("10. Task updates generated:", changes?.length);

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
            if (error) throw error;
            return data;
          }
        })
      );
    }

    // ── Generate roles ────────────────────────────────────────────────────
    console.log("11. Generating roles with AI...");
    let roles = [];
    try {
      roles = await parseProjectRoles(rawText);
      console.log("12. Roles generated:", roles?.length);
    } catch (aiErr) {
      console.error("AI role generation failed:", aiErr.message);
    }

    // ── Save roles to project ─────────────────────────────────────────────
    const { error: rolesError } = await supabaseAdmin
      .from("projects")
      .update({ roles })
      .eq("id", projectId);
    if (rolesError) throw rolesError;

    res.json({ message: "Success", tasks, roles });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
}