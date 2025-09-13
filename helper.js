const Contact = require("./model");
const { Op } = require("sequelize");

/**
 * Builds a standardized response object for the identify endpoint
 * @param {Number} primaryContactId - The ID of the primary contact
 * @param {Array} emails - List of unique emails associated with the contact
 * @param {Array} phoneNumbers - List of unique phone numbers associated with the contact
 * @param {Array} secondaryContactIds - List of secondary contact IDs
 * @returns {Object} Formatted response object
 */
const buildResponse = (
    primaryContactId,
    emails,
    phoneNumbers,
    secondaryContactIds
) => {
    return {
        contact: {
            primaryContactId, // Fixed the typo in parameter name
            emails: emails || [],
            phoneNumbers: phoneNumbers || [],
            secondaryContactIds: secondaryContactIds || [],
        },
    };
};

/**
 * Creates a new contact in the database
 * @param {String} email - Contact email (can be null)
 * @param {String} phoneNumber - Contact phone number (can be null)
 * @param {Number} linkedId - ID of the primary contact (for secondary contacts)
 * @param {String} linkPrecedence - Either "primary" or "secondary"
 * @returns {Promise<Object>} The newly created contact
 */
const addNewContact = async (
    email,
    phoneNumber,
    linkedId,
    linkPrecedence = "primary"
) => {
    try {
        const newContact = await Contact.create({
            email,
            phoneNumber,
            linkedId,
            linkPrecedence,
        });
        return newContact;
    } catch (error) {
        console.error("Error adding new contact:", error);
        throw error;
    }
};

/**
 * Determines the root node ID for a single contact
 * @param {Object} contact - The contact object
 * @returns {Number} The ID of the root node
 */
const getRootNodeForSingleContact = (contact) => {
    // If primary, then it is the root node
    // If secondary, then linkedId is the root node
    return contact.linkPrecedence === "primary" ? contact.id : contact.linkedId;
};

/**
 * Collects all unique parent IDs from a list of contacts
 * @param {Array} contacts - List of contact objects
 * @returns {Set} Set of unique parent IDs
 */
const collectUniqueParentIds = (contacts) => {
    const uniqueParentIds = new Set();

    contacts.forEach((contact) => {
        uniqueParentIds.add(getRootNodeForSingleContact(contact));
    });

    return uniqueParentIds;
};

/**
 * Finds the oldest primary contact from a list of parent IDs
 * @param {Array} parentIds - List of parent IDs
 * @returns {Promise<Object>} The oldest primary contact
 * @throws {Error} If no primary contacts found
 */
const findOldestPrimaryContact = async (parentIds) => {
    const oldestPrimaryContacts = await Contact.findAll({
        where: {
            id: {
                [Op.in]: [...parentIds],
            },
            linkPrecedence: "primary",
        },
        order: [["createdAt", "ASC"]],
        limit: 1,
    });

    if (!oldestPrimaryContacts || oldestPrimaryContacts.length === 0) {
        throw new Error("No primary contacts found");
    }

    return oldestPrimaryContacts[0];
};

/**
 * Merges contacts by updating other primary contacts to secondary
 * and pointing all secondary contacts to the oldest primary
 * @param {Object} oldestPrimaryContact - The oldest primary contact
 * @param {Array} uniqueParentIds - Set of unique parent IDs
 * @returns {Promise<void>}
 */
const mergeContacts = async (oldestPrimaryContact, uniqueParentIds) => {
    // Update other primary contacts to secondary
    await Contact.update(
        {
            linkPrecedence: "secondary",
            linkedId: oldestPrimaryContact.id,
        },
        {
            where: {
                id: {
                    [Op.and]: [
                        { [Op.ne]: oldestPrimaryContact.id },
                        { [Op.in]: [...uniqueParentIds] },
                    ],
                },
                linkPrecedence: "primary",
            },
        }
    );

    // Update secondary contacts to point to the new primary
    await Contact.update(
        {
            linkedId: oldestPrimaryContact.id,
        },
        {
            where: {
                linkPrecedence: "secondary",
                linkedId: {
                    [Op.in]: [...uniqueParentIds],
                },
            },
        }
    );
};

/**
 * Determines the root node ID from the contacts found
 * @param {Array} contacts - List of contact objects
 * @returns {Promise<Number|null>} The ID of the root node, or null if no contacts
 */
const determineRootNodeId = async (contacts) => {
    if (contacts.length === 0) {
        return null;
    } else if (contacts.length === 1) {
        return getRootNodeForSingleContact(contacts[0]);
    } else {
        // Multiple contacts found, need to determine if they belong to same root or need merging
        const uniqueParentIds = collectUniqueParentIds(contacts);

        if (uniqueParentIds.size === 1) {
            // All contacts belong to the same root node
            return [...uniqueParentIds][0];
        } else {
            // Contacts belong to different root nodes, need to merge
            const oldestPrimaryContact = await findOldestPrimaryContact(
                uniqueParentIds
            );
            await mergeContacts(oldestPrimaryContact, uniqueParentIds);
            return oldestPrimaryContact.id;
        }
    }
};

module.exports = {
    addNewContact,
    buildResponse,
    determineRootNodeId,
    getRootNodeForSingleContact,
    collectUniqueParentIds,
    findOldestPrimaryContact,
    mergeContacts,
};
