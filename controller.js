const Contact = require("./model");
const helper = require("./helper");
const { Op } = require("sequelize");

/**
 * Handles the identification of contacts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} Response with identified contact information
 */
const identify = async (req, res) => {
    let { email, phoneNumber } = req.body;

    email = email ? email.trim() : null;
    phoneNumber = phoneNumber ? phoneNumber.trim() : null;

    try {
        // Find all contacts matching either email or phone
        const contacts = await Contact.findAll({
            where: {
                [Op.or]: [{ email }, { phoneNumber }],
            },
        });

        // Find the root node ID
        let finalRootNodeId = await helper.determineRootNodeId(contacts);

        if (!finalRootNodeId) {
            // No existing contacts found, will create a new primary contact
            const newContact = await helper.addNewContact(
                email,
                phoneNumber,
                null,
                "primary"
            );

            finalRootNodeId = newContact.id;
        }

        // Get all contacts associated with the root node
        const allContacts = await Contact.findAll({
            where: {
                [Op.or]: [
                    { id: finalRootNodeId },
                    { linkedId: finalRootNodeId },
                ],
            },
        });

        // Extract emails, phone numbers, and secondary contact IDs
        const emails = [];
        const phoneNumbers = [];
        const secondaryContactIds = [];

        // First, find the primary contact to ensure its email/phone appear first
        const primaryContact = allContacts.find(
            (contact) => contact.id === finalRootNodeId
        );

        // Add primary contact info first
        if (primaryContact) {
            if (primaryContact.email) emails.push(primaryContact.email);
            if (primaryContact.phoneNumber)
                phoneNumbers.push(primaryContact.phoneNumber);
        }

        // Then add all other contacts
        allContacts.forEach((contact) => {
            // Skip the primary contact as we've already added it
            if (contact.id === finalRootNodeId) return;

            if (contact.email) emails.push(contact.email);
            if (contact.phoneNumber) phoneNumbers.push(contact.phoneNumber);
            if (contact.linkPrecedence === "secondary")
                secondaryContactIds.push(contact.id);
        });

        // Check if we got any new information to add i.e. email is new or phoneNumber is new
        const isEmailNew = email && !emails.includes(email);
        const isPhoneNew = phoneNumber && !phoneNumbers.includes(phoneNumber);

        if (isEmailNew || isPhoneNew) {
            // Add a new secondary contact linked to the primary
            const newSecondaryContact = await helper.addNewContact(
                email,
                phoneNumber,
                finalRootNodeId,
                "secondary"
            );

            // Update our lists with the new contact info
            if (newSecondaryContact.email)
                emails.push(newSecondaryContact.email);

            if (newSecondaryContact.phoneNumber)
                phoneNumbers.push(newSecondaryContact.phoneNumber);

            secondaryContactIds.push(newSecondaryContact.id);
        }

        // Return the consolidated response
        return res
            .status(200)
            .json(
                helper.buildResponse(
                    finalRootNodeId,
                    emails,
                    phoneNumbers,
                    secondaryContactIds
                )
            );
    } catch (error) {
        console.error("Error identifying contact:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = { identify };
