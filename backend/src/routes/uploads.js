import express from "express";
import multer from "multer";
import { extractText } from "unpdf";
import { parseNewProject, parseProjectUpdate } from "../agents/parseProject.js";
import { supabase } from "../lib/supabase.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"), false);
  },
});

router.post("/:projectId", upload.single("file"), async (req, res) => {
  const { projectId } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: "No file provided" });
  }

  try {
    // 1. Extract text from PDF
    const { text: rawText } = await extractText(
      new Uint8Array(req.file.buffer),
    );

    // 2. Upload PDF to Supabase Storage
    const filename = `${Date.now()}_${req.file.originalname}`;
    const { error: storageError } = await supabase.storage
      .from("project_docs")
      .upload(`${projectId}/${filename}`, req.file.buffer, {
        contentType: "application/pdf",
      });

    if (storageError) throw storageError;

    // 3. Get public URL
    const { data: urlData } = supabase.storage
      .from("project-docs")
      .getPublicUrl(`${projectId}/${filename}`);

    // 4. Save upload record to DB
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

    // 5. Check if project already has tasks
    const { data: existingTasks, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId);

    if (tasksError) throw tasksError;

    let tasks;

    if (!existingTasks || existingTasks.length === 0) {
      // 6a. New project — parse and insert tasks
      const parsedTasks = await parseNewProject(rawText);

      const { data, error: taskError } = await supabase
        .from("tasks")
        .insert(
          parsedTasks.map((task) => ({
            ...task,
            project_id: projectId,
          })),
        )
        .select();

      if (taskError) throw taskError;
      tasks = data;
    } else {
      // 6b. Existing project — parse update and upsert tasks
      const changes = await parseProjectUpdate(rawText, existingTasks);

      const upserted = await Promise.all(
        changes.map(async (change) => {
          const { task_id, ...fields } = change;

          if (task_id) {
            // overwrite existing task
            const { data, error } = await supabase
              .from("tasks")
              .update({ ...fields, updated_at: new Date() })
              .eq("id", task_id)
              .select()
              .single();

            if (error) throw error;
            return data;
          } else {
            // insert new task
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

      tasks = upserted;
    }

    res.json({
      message: "Upload successful",
      upload: uploadRecord,
      tasks,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.use((err, req, res, next) => {
  if (
    err instanceof multer.MulterError ||
    err.message === "Only PDF files are allowed"
  ) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
