import { Router } from "express";
import { db, meetingsTable, meetingNotesTable, actionItemsTable } from "@workspace/db";
import { eq, desc, count, and, sql } from "drizzle-orm";
import {
  EndMeetingParams,
  EndMeetingBody,
  GetMeetingParams,
  UpsertNotesParams,
  UpsertNotesBody,
  CreateActionItemParams,
  CreateActionItemBody,
  UpdateActionItemParams,
  UpdateActionItemBody,
  DeleteActionItemParams,
} from "@workspace/api-zod";

const router = Router();

// ─── POST /rooms/:roomId/end ─────────────────────────────────────────────────
router.post("/rooms/:roomId/end", async (req, res) => {
  const params = EndMeetingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid room ID" });
    return;
  }
  const body = EndMeetingBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { roomId } = params.data;
  const { participantNames, durationSeconds } = body.data;

  // Find the latest meeting for this room that hasn't ended yet
  const [existing] = await db
    .select()
    .from(meetingsTable)
    .where(and(eq(meetingsTable.roomId, roomId), sql`${meetingsTable.endedAt} IS NULL`))
    .orderBy(desc(meetingsTable.startedAt))
    .limit(1);

  const now = new Date();

  if (existing) {
    const [updated] = await db
      .update(meetingsTable)
      .set({ endedAt: now, durationSeconds, participantNames })
      .where(eq(meetingsTable.id, existing.id))
      .returning();
    req.log.info({ meetingId: updated!.id }, "Meeting ended");
    res.json({
      id: updated!.id,
      roomId: updated!.roomId,
      name: updated!.name,
      startedAt: updated!.startedAt.toISOString(),
      endedAt: updated!.endedAt?.toISOString() ?? null,
      durationSeconds: updated!.durationSeconds ?? null,
      participantNames: updated!.participantNames,
      actionItemCount: 0,
      openActionItemCount: 0,
      hasNotes: false,
    });
  } else {
    // No existing meeting — create one (e.g. room created before DB tracking)
    const [created] = await db
      .insert(meetingsTable)
      .values({
        roomId,
        name: `Meeting ${roomId}`,
        endedAt: now,
        durationSeconds,
        participantNames,
      })
      .returning();
    req.log.info({ meetingId: created!.id }, "Meeting created + ended");
    res.json({
      id: created!.id,
      roomId: created!.roomId,
      name: created!.name,
      startedAt: created!.startedAt.toISOString(),
      endedAt: created!.endedAt?.toISOString() ?? null,
      durationSeconds: created!.durationSeconds ?? null,
      participantNames: created!.participantNames,
      actionItemCount: 0,
      openActionItemCount: 0,
      hasNotes: false,
    });
  }
});

// ─── GET /meetings ───────────────────────────────────────────────────────────
router.get("/meetings", async (req, res) => {
  const meetings = await db
    .select()
    .from(meetingsTable)
    .orderBy(desc(meetingsTable.startedAt));

  const results = await Promise.all(
    meetings.map(async (m) => {
      const [aiCounts] = await db
        .select({
          total: count(),
          open: sql<number>`COUNT(*) FILTER (WHERE ${actionItemsTable.isDone} = false)`,
        })
        .from(actionItemsTable)
        .where(eq(actionItemsTable.meetingId, m.id));

      const [notesRow] = await db
        .select({ id: meetingNotesTable.id })
        .from(meetingNotesTable)
        .where(eq(meetingNotesTable.meetingId, m.id))
        .limit(1);

      return {
        id: m.id,
        roomId: m.roomId,
        name: m.name,
        startedAt: m.startedAt.toISOString(),
        endedAt: m.endedAt?.toISOString() ?? null,
        durationSeconds: m.durationSeconds ?? null,
        participantNames: m.participantNames,
        actionItemCount: Number(aiCounts?.total ?? 0),
        openActionItemCount: Number(aiCounts?.open ?? 0),
        hasNotes: !!notesRow,
      };
    }),
  );

  res.json(results);
});

// ─── GET /meetings/:meetingId ─────────────────────────────────────────────────
router.get("/meetings/:meetingId", async (req, res) => {
  const params = GetMeetingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid meeting ID" });
    return;
  }

  const [meeting] = await db
    .select()
    .from(meetingsTable)
    .where(eq(meetingsTable.id, params.data.meetingId))
    .limit(1);

  if (!meeting) {
    res.status(404).json({ error: "Meeting not found" });
    return;
  }

  const [notesRow] = await db
    .select()
    .from(meetingNotesTable)
    .where(eq(meetingNotesTable.meetingId, meeting.id))
    .limit(1);

  const items = await db
    .select()
    .from(actionItemsTable)
    .where(eq(actionItemsTable.meetingId, meeting.id))
    .orderBy(actionItemsTable.createdAt);

  res.json({
    id: meeting.id,
    roomId: meeting.roomId,
    name: meeting.name,
    startedAt: meeting.startedAt.toISOString(),
    endedAt: meeting.endedAt?.toISOString() ?? null,
    durationSeconds: meeting.durationSeconds ?? null,
    participantNames: meeting.participantNames,
    notes: notesRow?.content ?? null,
    actionItems: items.map((item) => ({
      id: item.id,
      meetingId: item.meetingId,
      text: item.text,
      assigneeName: item.assigneeName ?? null,
      dueDate: item.dueDate ?? null,
      isDone: item.isDone,
      createdAt: item.createdAt.toISOString(),
    })),
  });
});

// ─── PUT /meetings/:meetingId/notes ───────────────────────────────────────────
router.put("/meetings/:meetingId/notes", async (req, res) => {
  const params = UpsertNotesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid meeting ID" });
    return;
  }
  const body = UpsertNotesBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const now = new Date();
  const [existing] = await db
    .select()
    .from(meetingNotesTable)
    .where(eq(meetingNotesTable.meetingId, params.data.meetingId))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(meetingNotesTable)
      .set({ content: body.data.content, updatedAt: now })
      .where(eq(meetingNotesTable.id, existing.id))
      .returning();
    res.json({
      id: updated!.id,
      meetingId: updated!.meetingId,
      content: updated!.content,
      updatedAt: updated!.updatedAt.toISOString(),
    });
  } else {
    const [created] = await db
      .insert(meetingNotesTable)
      .values({ meetingId: params.data.meetingId, content: body.data.content })
      .returning();
    res.json({
      id: created!.id,
      meetingId: created!.meetingId,
      content: created!.content,
      updatedAt: created!.updatedAt.toISOString(),
    });
  }
});

// ─── POST /meetings/:meetingId/action-items ───────────────────────────────────
router.post("/meetings/:meetingId/action-items", async (req, res) => {
  const params = CreateActionItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid meeting ID" });
    return;
  }
  const body = CreateActionItemBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const [item] = await db
    .insert(actionItemsTable)
    .values({
      meetingId: params.data.meetingId,
      text: body.data.text,
      assigneeName: body.data.assigneeName ?? null,
      dueDate: body.data.dueDate ?? null,
    })
    .returning();

  res.status(201).json({
    id: item!.id,
    meetingId: item!.meetingId,
    text: item!.text,
    assigneeName: item!.assigneeName ?? null,
    dueDate: item!.dueDate ?? null,
    isDone: item!.isDone,
    createdAt: item!.createdAt.toISOString(),
  });
});

// ─── PATCH /action-items/:actionItemId ───────────────────────────────────────
router.patch("/action-items/:actionItemId", async (req, res) => {
  const params = UpdateActionItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid action item ID" });
    return;
  }
  const body = UpdateActionItemBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (body.data.text !== undefined) updates["text"] = body.data.text;
  if (body.data.isDone !== undefined) updates["isDone"] = body.data.isDone;
  if ("assigneeName" in body.data) updates["assigneeName"] = body.data.assigneeName ?? null;
  if ("dueDate" in body.data) updates["dueDate"] = body.data.dueDate ?? null;

  const [item] = await db
    .update(actionItemsTable)
    .set(updates)
    .where(eq(actionItemsTable.id, params.data.actionItemId))
    .returning();

  if (!item) {
    res.status(404).json({ error: "Action item not found" });
    return;
  }

  res.json({
    id: item.id,
    meetingId: item.meetingId,
    text: item.text,
    assigneeName: item.assigneeName ?? null,
    dueDate: item.dueDate ?? null,
    isDone: item.isDone,
    createdAt: item.createdAt.toISOString(),
  });
});

// ─── DELETE /action-items/:actionItemId ──────────────────────────────────────
router.delete("/action-items/:actionItemId", async (req, res) => {
  const params = DeleteActionItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid action item ID" });
    return;
  }

  await db
    .delete(actionItemsTable)
    .where(eq(actionItemsTable.id, params.data.actionItemId));

  res.status(204).send();
});

// ─── GET /dashboard/stats ─────────────────────────────────────────────────────
router.get("/dashboard/stats", async (_req, res) => {
  const [totals] = await db
    .select({ total: count() })
    .from(meetingsTable);

  const [durationSum] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${meetingsTable.durationSeconds}), 0)`,
    })
    .from(meetingsTable);

  const [aiStats] = await db
    .select({
      open: sql<number>`COUNT(*) FILTER (WHERE ${actionItemsTable.isDone} = false)`,
      done: sql<number>`COUNT(*) FILTER (WHERE ${actionItemsTable.isDone} = true)`,
    })
    .from(actionItemsTable);

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [weekMeetings] = await db
    .select({ total: count() })
    .from(meetingsTable)
    .where(sql`${meetingsTable.startedAt} >= ${weekAgo}`);

  res.json({
    totalMeetings: Number(totals?.total ?? 0),
    totalDurationSeconds: Number(durationSum?.total ?? 0),
    openActionItems: Number(aiStats?.open ?? 0),
    completedActionItems: Number(aiStats?.done ?? 0),
    meetingsThisWeek: Number(weekMeetings?.total ?? 0),
  });
});

export default router;
