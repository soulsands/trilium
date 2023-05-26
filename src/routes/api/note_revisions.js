"use strict";

const beccaService = require('../../becca/becca_service');
const protectedSessionService = require('../../services/protected_session');
const noteRevisionService = require('../../services/note_revisions');
const utils = require('../../services/utils');
const sql = require('../../services/sql');
const cls = require('../../services/cls');
const path = require('path');
const becca = require("../../becca/becca");

function getNoteRevisions(req) {
    return becca.getNoteRevisionsFromQuery(`
        SELECT note_revisions.*,
               LENGTH(note_revision_contents.content) AS contentLength
        FROM note_revisions
        JOIN note_revision_contents ON note_revisions.noteRevisionId = note_revision_contents.noteRevisionId 
        WHERE noteId = ?
        ORDER BY utcDateCreated DESC`, [req.params.noteId]);
}

function getNoteRevision(req) {
    const noteRevision = becca.getNoteRevision(req.params.noteRevisionId);

    if (noteRevision.type === 'file') {
        if (noteRevision.isStringNote()) {
            noteRevision.content = noteRevision.getContent().substr(0, 10000);
        }
    }
    else {
        noteRevision.content = noteRevision.getContent();

        if (noteRevision.content && noteRevision.type === 'image') {
            noteRevision.content = noteRevision.content.toString('base64');
        }
    }

    return noteRevision;
}

/**
 * @param {BNoteRevision} noteRevision
 * @returns {string}
 */
function getRevisionFilename(noteRevision) {
    let filename = utils.formatDownloadTitle(noteRevision.title, noteRevision.type, noteRevision.mime);

    const extension = path.extname(filename);
    const date = noteRevision.dateCreated
        .substr(0, 19)
        .replace(' ', '_')
        .replace(/[^0-9_]/g, '');

    if (extension) {
        filename = `${filename.substr(0, filename.length - extension.length)}-${date}${extension}`;
    }
    else {
        filename += `-${date}`;
    }

    return filename;
}

function downloadNoteRevision(req, res) {
    const noteRevision = becca.getNoteRevision(req.params.noteRevisionId);

    if (noteRevision.noteId !== req.params.noteId) {
        return res.setHeader("Content-Type", "text/plain")
            .status(400)
            .send(`Note revision ${req.params.noteRevisionId} does not belong to note ${req.params.noteId}`);
    }

    if (noteRevision.isProtected && !protectedSessionService.isProtectedSessionAvailable()) {
        return res.setHeader("Content-Type", "text/plain")
            .status(401)
            .send("Protected session not available");
    }

    const filename = getRevisionFilename(noteRevision);

    res.setHeader('Content-Disposition', utils.getContentDisposition(filename));
    res.setHeader('Content-Type', noteRevision.mime);

    res.send(noteRevision.getContent());
}

function eraseAllNoteRevisions(req) {
    const noteRevisionIdsToErase = sql.getColumn('SELECT noteRevisionId FROM note_revisions WHERE noteId = ?',
        [req.params.noteId]);

    noteRevisionService.eraseNoteRevisions(noteRevisionIdsToErase);
}

function eraseNoteRevision(req) {
    noteRevisionService.eraseNoteRevisions([req.params.noteRevisionId]);
}

function restoreNoteRevision(req) {
    const noteRevision = becca.getNoteRevision(req.params.noteRevisionId);

    if (noteRevision) {
        const note = noteRevision.getNote();

        note.saveNoteRevision();

        note.title = noteRevision.title;
        note.setContent(noteRevision.getContent());
        note.save();
    }
}

function getEditedNotesOnDate(req) {
    const noteIds = sql.getColumn(`
        SELECT notes.*
        FROM notes
        WHERE noteId IN (
                SELECT noteId FROM notes 
                WHERE notes.dateCreated LIKE :date
                   OR notes.dateModified LIKE :date
            UNION ALL
                SELECT noteId FROM note_revisions
                WHERE note_revisions.dateLastEdited LIKE :date
        )
        ORDER BY isDeleted
        LIMIT 50`, {date: `${req.params.date}%`});

    let notes = becca.getNotes(noteIds, true);

    // Narrow down the results if a note is hoisted, similar to "Jump to note".
    const hoistedNoteId = cls.getHoistedNoteId();
    if (hoistedNoteId !== 'root') {
        notes = notes.filter(note => note.hasAncestor(hoistedNoteId));
    }

    return notes.map(note => {
        const notePath = note.isDeleted ? null : getNotePathData(note);

        const notePojo = note.getPojo();
        notePojo.notePath = notePath ? notePath.notePath : null;

        return notePojo;
    });

}

function getNotePathData(note) {
    const retPath = note.getBestNotePath();

    if (retPath) {
        const noteTitle = beccaService.getNoteTitleForPath(retPath);

        let branchId;

        if (note.isRoot()) {
            branchId = 'none_root';
        }
        else {
            const parentNote = note.parents[0];
            branchId = becca.getBranchFromChildAndParent(note.noteId, parentNote.noteId).branchId;
        }

        return {
            noteId: note.noteId,
            branchId: branchId,
            title: noteTitle,
            notePath: retPath,
            path: retPath.join('/')
        };
    }
}

module.exports = {
    getNoteRevisions,
    getNoteRevision,
    downloadNoteRevision,
    getEditedNotesOnDate,
    eraseAllNoteRevisions,
    eraseNoteRevision,
    restoreNoteRevision
};
