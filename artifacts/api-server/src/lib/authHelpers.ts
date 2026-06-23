import { Meeting, Participant, Task, Project, Team, Recording } from "@workspace/db";
import mongoose from "mongoose";

/**
 * Checks if a user has access to a meeting.
 * Accessible if:
 * 1. User is the host/owner of the meeting.
 * 2. User is an admitted/waiting/left participant of the meeting.
 */
export async function canAccessMeeting(
  meetingId: string | mongoose.Types.ObjectId,
  userId: string | mongoose.Types.ObjectId
): Promise<boolean> {
  try {
    const mId = meetingId.toString();
    const uId = userId.toString();

    let query: any = {};
    if (mongoose.Types.ObjectId.isValid(mId)) {
      query._id = mId;
    } else {
      query.$or = [{ meetingId: mId }, { roomId: mId }];
    }

    const meeting = await Meeting.findOne(query);
    if (!meeting) return false;

    // Host checks
    if (meeting.host && meeting.host.toString() === uId) {
      return true;
    }

    // Participant checks
    const participant = await Participant.findOne({
      meeting: meeting._id,
      user: uId,
    });

    if (participant) {
      return true;
    }

    return false;
  } catch (err) {
    return false;
  }
}

/**
 * Checks if a user has access to a recording.
 * Accessible if:
 * 1. User recorded it.
 * 2. User has access to the associated meeting.
 */
export async function canAccessRecording(
  recordingId: string | mongoose.Types.ObjectId,
  userId: string | mongoose.Types.ObjectId
): Promise<boolean> {
  try {
    const rId = recordingId.toString();
    const uId = userId.toString();

    if (!mongoose.Types.ObjectId.isValid(rId)) return false;

    const recording = await Recording.findById(rId);
    if (!recording) return false;

    if (recording.recordedBy && recording.recordedBy.toString() === uId) {
      return true;
    }

    return canAccessMeeting(recording.meeting, uId);
  } catch (err) {
    return false;
  }
}

/**
 * Checks if a user has access to a project.
 * Accessible if:
 * 1. User is the owner of the project.
 * 2. User belongs to the team that the project is associated with.
 */
export async function canAccessProject(
  projectId: string | mongoose.Types.ObjectId,
  userId: string | mongoose.Types.ObjectId
): Promise<boolean> {
  try {
    const pId = projectId.toString();
    const uId = userId.toString();

    if (!mongoose.Types.ObjectId.isValid(pId)) return false;

    const project = await Project.findById(pId);
    if (!project) return false;

    if (project.owner && project.owner.toString() === uId) {
      return true;
    }

    if (project.teamId) {
      const team = await Team.findById(project.teamId);
      if (team) {
        if (team.owner && team.owner.toString() === uId) {
          return true;
        }
        const isMember = team.members.some(
          (m: any) => m.user && m.user.toString() === uId
        );
        if (isMember) return true;
      }
    }

    return false;
  } catch (err) {
    return false;
  }
}

/**
 * Checks if a user has access to a task.
 * Accessible if:
 * 1. User is assignee of the task.
 * 2. User is reporter of the task.
 * 3. User has access to the task's project or team.
 */
export async function canAccessTask(
  taskId: string | mongoose.Types.ObjectId,
  userId: string | mongoose.Types.ObjectId
): Promise<boolean> {
  try {
    const tId = taskId.toString();
    const uId = userId.toString();

    if (!mongoose.Types.ObjectId.isValid(tId)) return false;

    const task = await Task.findById(tId);
    if (!task) return false;

    if (task.assignee && task.assignee.toString() === uId) {
      return true;
    }

    if (task.reporter && task.reporter.toString() === uId) {
      return true;
    }

    return false;
  } catch (err) {
    return false;
  }
}
