/**
 * Branch represents a relationship between a child note and its parent note. Trilium allows a note to have multiple
 * parents.
 */
class FBranch {
    constructor(froca, row) {
        this.froca = froca;

        this.update(row);
    }

    update(row) {
        /**
         * primary key
         * @type {string}
         */
        this.branchId = row.branchId;
        /** @type {string} */
        this.noteId = row.noteId;
        /** @type {string} */
        this.parentNoteId = row.parentNoteId;
        /** @type {int} */
        this.notePosition = row.notePosition;
        /** @type {string} */
        this.prefix = row.prefix;
        /** @type {boolean} */
        this.isExpanded = !!row.isExpanded;
        /** @type {boolean} */
        this.fromSearchNote = !!row.fromSearchNote;
    }

    /** @returns {FNote} */
    async getNote() {
        return this.froca.getNote(this.noteId);
    }

    /** @returns {FNote} */
    getNoteFromCache() {
        return this.froca.getNoteFromCache(this.noteId);
    }

    /** @returns {FNote} */
    async getParentNote() {
        return this.froca.getNote(this.parentNoteId);
    }

    /** @returns {boolean} true if it's top level, meaning its parent is root note */
    isTopLevel() {
        return this.parentNoteId === 'root';
    }

    get toString() {
        return `FBranch(branchId=${this.branchId})`;
    }

    get pojo() {
        const pojo = {...this};
        delete pojo.froca;
        return pojo;
    }
}

export default FBranch;
